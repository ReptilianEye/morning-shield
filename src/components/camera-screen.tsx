import { Spacing } from '@/constants/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ThemedPressable from './themed-pressable';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function CameraScreen({ children, onSetColor, isOver }: { children?: React.ReactNode, onSetColor: (value: string) => void, isOver: boolean }) {
  const [permission, requestPermission] = useCameraPermissions();
  const isCameraReady = useRef<boolean>(false);
  const isProcessing = useRef<boolean>(false);
  const isOverRef = useRef(isOver);
  const cameraRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  const processWebImage = useCallback((uri: string) => {
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
      const hex = '#' + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase();
      onSetColor(hex);
    };
    img.onerror = () => {
      console.error('❌ [Web] Błąd wczytywania obrazu');
    };
  }, [onSetColor]);

  const captureAndSampleColor = useCallback(async () => {
    if (isOverRef.current || isProcessing.current || !isCameraReady.current || !cameraRef.current) return;

    try {
      isProcessing.current = true;

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.1,
        shutterSound: false,
        fastPrioritization: true,
        skipProcessing: true,
      });

      if (isOverRef.current) return;

      if (!photo?.uri) return;

      if (Platform.OS === 'web') {
        processWebImage(photo.uri);
        return;
      }

      const base64Image = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!isOverRef.current && webViewRef.current) {
        const message = JSON.stringify({ base64: base64Image });
        webViewRef.current.postMessage(message);
      }

      FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => { });
    } catch (error) {
      console.error('❌ Błąd pobierania zdjęcia:', error);
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

  const htmlCanvasProcessor = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0;">
        <canvas id="c"></canvas>
        <script>
          function processImage(base64Data) {
            const img = new Image();
            img.onload = function() {
              const canvas = document.getElementById('c');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              const cx = Math.floor(img.width / 2);
              const cy = Math.floor(img.height / 2);
              const p = ctx.getImageData(cx, cy, 1, 1).data;
              const hex = "#" + ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase();

              window.ReactNativeWebView.postMessage(JSON.stringify({ hex: hex }));
            };
            img.src = 'data:image/jpeg;base64,' + base64Data;
          }

          function handleMessage(e) {
            try {
              const data = JSON.parse(e.data);
              if (data.base64) processImage(data.base64);
            } catch(err) {}
          }

          document.addEventListener('message', handleMessage);
          window.addEventListener('message', handleMessage);
        </script>
      </body>
    </html>
  `;

  if (!permission?.granted) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1, padding: Spacing.four, borderRadius: Spacing.four, justifyContent: 'center', gap: Spacing.three }}>
        <ThemedText type='subtitle' style={{ textAlign: 'center' }}>App required camera access.</ThemedText>
        <ThemedPressable onPress={requestPermission} content="Grant permission" />
      </ThemedView>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        animateShutter={false}
        onCameraReady={() => { isCameraReady.current = true; }}
      />

      <View style={styles.crosshair} />

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
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  colorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
});
