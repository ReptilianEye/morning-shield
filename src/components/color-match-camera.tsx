import { Spacing } from '@/constants/theme';
import { htmlCanvasProcessor } from '@/constants/html-canvas-processor';
import { useTheme } from '@/hooks/use-theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ThemedPressable from './themed-pressable';
import { ThemedText } from './themed-text';

export default function CameraScreen({
  children,
  onSetColor,
  isOver,
}: {
  children?: React.ReactNode;
  onSetColor: (value: string) => void;
  isOver: boolean;
}) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const isCameraReady = useRef<boolean>(false);
  const isProcessing = useRef<boolean>(false);
  const isOverRef = useRef(isOver);
  const cameraRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  const processWebImage = useCallback(
    (uri: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = uri;
      img.onload = () => {
        if (isOverRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const cx = Math.floor(img.width / 2);
        const cy = Math.floor(img.height / 2);
        const p = ctx.getImageData(cx, cy, 1, 1).data;
        const hex =
          '#' +
          ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase();
        onSetColor(hex);
      };
      img.onerror = () => {
        console.error('Failed to load web camera frame');
      };
    },
    [onSetColor]
  );

  const captureAndSampleColor = useCallback(async () => {
    if (isOverRef.current || isProcessing.current || !isCameraReady.current || !cameraRef.current) {
      return;
    }

    try {
      isProcessing.current = true;

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        shutterSound: false,
        fastPrioritization: true,
        skipProcessing: true,
      });

      if (isOverRef.current || !photo?.uri) return;

      if (Platform.OS === 'web') {
        processWebImage(photo.uri);
        return;
      }

      const base64Image = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!isOverRef.current && webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ base64: base64Image }));
      }

      FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
    } catch (error) {
      console.error('Failed to sample camera frame:', error);
    } finally {
      isProcessing.current = false;
    }
  }, [processWebImage]);

  useEffect(() => {
    isOverRef.current = isOver;
  }, [isOver]);

  useEffect(() => {
    if (isOver) return;

    const interval = setInterval(captureAndSampleColor, 250);
    return () => clearInterval(interval);
  }, [captureAndSampleColor, isOver]);

  if (!permission?.granted) {
    return (
      <View
        style={[
          styles.permissionCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}>
        <View style={[styles.permissionIconBadge, { backgroundColor: theme.accentSoft }]}>
          <SymbolView
            name={{ ios: 'camera.fill' }}
            size={28}
            tintColor={theme.accent}
            fallback={<ThemedText style={{ fontSize: 26, lineHeight: 30 }}>📷</ThemedText>}
          />
        </View>
        <ThemedText type="subtitle" style={styles.centerText}>
          Camera Access Needed
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.permissionSubtext}>
          Allow camera access so MorningShield can match objects around you with your target color.
        </ThemedText>
        <ThemedPressable onPress={requestPermission} content="Allow Camera Access" />
      </View>
    );
  }

  return (
    <View style={[styles.cameraContainer, { borderColor: theme.border }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        animateShutter={false}
        onCameraReady={() => {
          isCameraReady.current = true;
        }}
      />

      {Platform.OS !== 'web' && (
        <View style={styles.hiddenWebView}>
          <WebView
            ref={webViewRef}
            source={{ html: htmlCanvasProcessor }}
            javaScriptEnabled={true}
            onMessage={(event: any) => {
              try {
                const res = JSON.parse(event.nativeEvent.data);
                if (!isOverRef.current && res.hex) {
                  onSetColor(res.hex);
                }
              } catch (e) {
                console.error(e);
              } finally {
                isProcessing.current = false;
              }
            }}
          />
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  permissionCard: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  permissionIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  permissionSubtext: {
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#0F172A',
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
});
