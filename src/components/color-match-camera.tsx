import { Spacing } from '@/constants/theme';
import { htmlCanvasProcessor } from '@/constants/html-canvas-processor';
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
        style={[StyleSheet.absoluteFill, {borderRadius: 32}]}
        facing="back"
        animateShutter={false}
        onCameraReady={() => { isCameraReady.current = true; }}
      />

      {Platform.OS !== 'web' && (
        <View style={{width: 0, height: 0, opacity: 0, position: 'absolute'}}>
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
