import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group, Path, Rect } from '@shopify/react-native-skia';

export interface ImpactPoint {
  id: string;
  x: number;
  y: number;
  radius: number;
  branches?: number;
}

export interface IceOverlayCanvasProps {
  width: number;
  height: number;
  iceHealth: number; // 100 -> 0
  impactPoints: ImpactPoint[];
}

/**
 * Deterministic pseudo-random generator based on a seed number.
 * This guarantees crack paths remain consistent across re-renders for the same impact point.
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Procedurally generates an SVG path string for a realistic jagged ice crack
 * radiating outwards from an impact point (x, y).
 */
function generateCrackSvgPath(impact: ImpactPoint, canvasWidth: number, canvasHeight: number): string {
  // Generate a numerical seed from impact ID or coordinates
  const seedNum = impact.id
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), Math.round(impact.x + impact.y * 100));
  const rand = createSeededRandom(seedNum);

  const numBranches = impact.branches ?? Math.floor(5 + rand() * 3); // 5 to 7 primary rays
  const maxRadius = impact.radius;
  const pathSegments: string[] = [];

  // 1. Localized starburst at the center
  const centerStarSpikes = 6;
  for (let s = 0; s < centerStarSpikes; s++) {
    const starAngle = (s * (2 * Math.PI)) / centerStarSpikes + (rand() - 0.5) * 0.4;
    const spikeDist = 6 + rand() * 8;
    const sx = Math.max(0, Math.min(canvasWidth, impact.x + Math.cos(starAngle) * spikeDist));
    const sy = Math.max(0, Math.min(canvasHeight, impact.y + Math.sin(starAngle) * spikeDist));
    pathSegments.push(`M ${impact.x.toFixed(1)} ${impact.y.toFixed(1)} L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
  }

  // 2. Main radiating jagged cracks
  for (let b = 0; b < numBranches; b++) {
    const baseAngle = (b * (2 * Math.PI)) / numBranches + (rand() - 0.5) * 0.5;
    const branchLength = maxRadius * (0.65 + rand() * 0.5); // Variable ray length
    const stepLength = 14 + rand() * 8;
    const steps = Math.floor(branchLength / stepLength);

    let curX = impact.x;
    let curY = impact.y;
    let curAngle = baseAngle;

    pathSegments.push(`M ${curX.toFixed(1)} ${curY.toFixed(1)}`);

    for (let i = 0; i < steps; i++) {
      // Add jagged deviation to current angle (+/- 25 degrees)
      curAngle += (rand() - 0.5) * 0.7;
      const step = stepLength * (0.8 + rand() * 0.4);

      curX += Math.cos(curAngle) * step;
      curY += Math.sin(curAngle) * step;

      // Clamp within canvas boundaries
      curX = Math.max(0, Math.min(canvasWidth, curX));
      curY = Math.max(0, Math.min(canvasHeight, curY));

      pathSegments.push(`L ${curX.toFixed(1)} ${curY.toFixed(1)}`);

      // 3. Sub-branch (30% probability)
      if (rand() < 0.32 && i < steps - 1) {
        const subAngle = curAngle + (rand() > 0.5 ? 1 : -1) * (0.7 + rand() * 0.5);
        const subSteps = Math.floor(2 + rand() * 3);
        let subX = curX;
        let subY = curY;

        let subPath = ` M ${subX.toFixed(1)} ${subY.toFixed(1)}`;
        for (let j = 0; j < subSteps; j++) {
          const subStepLen = 10 + rand() * 6;
          subX += Math.cos(subAngle) * subStepLen;
          subY += Math.sin(subAngle) * subStepLen;
          subX = Math.max(0, Math.min(canvasWidth, subX));
          subY = Math.max(0, Math.min(canvasHeight, subY));
          subPath += ` L ${subX.toFixed(1)} ${subY.toFixed(1)}`;
        }
        pathSegments.push(subPath);
      }
    }
  }

  return pathSegments.join(' ');
}

export function IceOverlayCanvas({ width, height, iceHealth, impactPoints }: IceOverlayCanvasProps) {
  // Memoize combined crack paths so procedural calculation only runs when impact points change
  const combinedCrackPath = useMemo(() => {
    if (impactPoints.length === 0 || width <= 0 || height <= 0) {
      return '';
    }
    return impactPoints.map((impact) => generateCrackSvgPath(impact, width, height)).join(' ');
  }, [impactPoints, width, height]);

  // Frost opacity scales with iceHealth (from ~0.82 down to 0)
  const normalizedHealth = Math.max(0, Math.min(100, iceHealth)) / 100;
  const frostOpacity = normalizedHealth * 0.82;
  const frostBorderOpacity = normalizedHealth * 0.95;

  // If ice is completely broken, render nothing
  if (iceHealth <= 0 || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }]}>
      <Canvas style={{ width, height }}>
        {/* Semi-opaque frosted ice sheet */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          color={`rgba(205, 235, 255, ${frostOpacity.toFixed(3)})`}
        />

        {/* Crystalline ice border framing */}
        <Rect
          x={1}
          y={1}
          width={width - 2}
          height={height - 2}
          style="stroke"
          strokeWidth={3}
          color={`rgba(240, 248, 255, ${frostBorderOpacity.toFixed(3)})`}
        />

        {/* Procedural Cracks: Under-glow (cyan) + Sharp fracture core (white) */}
        {combinedCrackPath.length > 0 && (
          <Group>
            {/* Cyan deep-ice refraction glow */}
            <Path
              path={combinedCrackPath}
              style="stroke"
              strokeWidth={3.8}
              strokeCap="round"
              strokeJoin="round"
              color="rgba(128, 216, 255, 0.65)"
            />
            {/* Crisp white surface fracture line */}
            <Path
              path={combinedCrackPath}
              style="stroke"
              strokeWidth={1.8}
              strokeCap="round"
              strokeJoin="round"
              color="rgba(255, 255, 255, 0.95)"
            />
          </Group>
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
});
