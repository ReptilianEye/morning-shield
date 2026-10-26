import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export interface UseShakeDetectorOptions {
  /**
   * Callback fired when a shake gesture exceeds the acceleration threshold.
   */
  onShake: () => void;
  /**
   * Acceleration magnitude threshold in g's (sqrt(x^2 + y^2 + z^2)).
   * Defaults to 2.2g.
   */
  threshold?: number;
  /**
   * Sensor sampling interval in milliseconds.
   * Defaults to 80ms.
   */
  interval?: number;
  /**
   * Minimum time in milliseconds between triggered shake callbacks to prevent double-firing.
   * Defaults to 350ms.
   */
  cooldownMs?: number;
  /**
   * Whether the shake detector is active.
   * Defaults to true.
   */
  enabled?: boolean;
}

const DEFAULT_THRESHOLD = 2.2;
const DEFAULT_INTERVAL_MS = 80;
const DEFAULT_COOLDOWN_MS = 350;

/**
 * Custom hook that listens to device accelerometer updates and triggers a callback
 * when a physical shake motion exceeds the specified magnitude threshold.
 */
export function useShakeDetector({
  onShake,
  threshold = DEFAULT_THRESHOLD,
  interval = DEFAULT_INTERVAL_MS,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  enabled = true,
}: UseShakeDetectorOptions): void {
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  const lastShakeTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    Accelerometer.setUpdateInterval(interval);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      console.log(`Accelerometer data: x=${x}, y=${y}, z=${z}`);
      // Calculate total acceleration magnitude across all three spatial axes
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (magnitude > threshold && now - lastShakeTimeRef.current > cooldownMs) {
        lastShakeTimeRef.current = now;
        onShakeRef.current();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, interval, threshold, cooldownMs]);
}
