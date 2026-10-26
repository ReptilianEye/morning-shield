import { Spacing } from '@/constants/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, View } from 'react-native';
import ThemedPressable from './themed-pressable';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export default function CameraScreen({ children }: { children?: React.ReactNode }) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1, padding: Spacing.four, borderRadius: Spacing.four, justifyContent: 'center', gap: Spacing.three}}>
        <ThemedText type='subtitle' style={{textAlign: 'center'}}>App required camera access.</ThemedText>
        <ThemedPressable onPress={requestPermission} content="Grant permission"/>
      </ThemedView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView style={[StyleSheet.absoluteFill, { borderRadius: Spacing.four }]} facing="back" />
      {children}
    </View>
  );
}
