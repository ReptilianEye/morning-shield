import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';

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
 * Guarantees crack paths remain consistent across re-renders for the same impact point.
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
function generateCrackSvgPath(
  impact: ImpactPoint,
  canvasWidth: number,
  canvasHeight: number
): string {
  const seedNum = impact.id
    .split('')
    .reduce(
      (acc, char, index) => acc + char.charCodeAt(0) * (index + 1),
      Math.round(impact.x + impact.y * 100)
    );
  const rand = createSeededRandom(seedNum);

  const numBranches = impact.branches ?? Math.floor(5 + rand() * 3);
  const maxRadius = impact.radius;
  const pathSegments: string[] = [];

  // Localized starburst at the impact core
  const centerStarSpikes = 6;
  for (let s = 0; s < centerStarSpikes; s++) {
    const starAngle = (s * (2 * Math.PI)) / centerStarSpikes + (rand() - 0.5) * 0.4;
    const spikeDist = 6 + rand() * 8;
    const sx = Math.max(0, Math.min(canvasWidth, impact.x + Math.cos(starAngle) * spikeDist));
    const sy = Math.max(0, Math.min(canvasHeight, impact.y + Math.sin(starAngle) * spikeDist));
    pathSegments.push(
      `M ${impact.x.toFixed(1)} ${impact.y.toFixed(1)} L ${sx.toFixed(1)} ${sy.toFixed(1)}`
    );
  }

  // Radiating jagged fractures
  for (let b = 0; b < numBranches; b++) {
    const baseAngle = (b * (2 * Math.PI)) / numBranches + (rand() - 0.5) * 0.5;
    const branchLength = maxRadius * (0.65 + rand() * 0.5);
    const stepLength = 14 + rand() * 8;
    const steps = Math.floor(branchLength / stepLength);

    let curX = impact.x;
    let curY = impact.y;
    let curAngle = baseAngle;

    pathSegments.push(`M ${curX.toFixed(1)} ${curY.toFixed(1)}`);

    for (let i = 0; i < steps; i++) {
      curAngle += (rand() - 0.5) * 0.7;
      const step = stepLength * (0.8 + rand() * 0.4);

      curX = Math.max(0, Math.min(canvasWidth, curX + Math.cos(curAngle) * step));
      curY = Math.max(0, Math.min(canvasHeight, curY + Math.sin(curAngle) * step));

      pathSegments.push(`L ${curX.toFixed(1)} ${curY.toFixed(1)}`);

      if (rand() < 0.32 && i < steps - 1) {
        const subAngle = curAngle + (rand() > 0.5 ? 1 : -1) * (0.7 + rand() * 0.5);
        const subSteps = Math.floor(2 + rand() * 3);
        let subX = curX;
        let subY = curY;

        let subPath = ` M ${subX.toFixed(1)} ${subY.toFixed(1)}`;
        for (let j = 0; j < subSteps; j++) {
          const subStepLen = 10 + rand() * 6;
          subX = Math.max(0, Math.min(canvasWidth, subX + Math.cos(subAngle) * subStepLen));
          subY = Math.max(0, Math.min(canvasHeight, subY + Math.sin(subAngle) * subStepLen));
          subPath += ` L ${subX.toFixed(1)} ${subY.toFixed(1)}`;
        }
        pathSegments.push(subPath);
      }
    }
  }

  return pathSegments.join(' ');
}

export function IceOverlayCanvas({
  width,
  height,
  iceHealth,
  impactPoints,
}: IceOverlayCanvasProps) {
  const combinedCrackPath = useMemo(() => {
    if (impactPoints.length === 0 || width <= 0 || height <= 0) {
      return '';
    }
    return impactPoints.map((impact) => generateCrackSvgPath(impact, width, height)).join(' ');
  }, [impactPoints, width, height]);

  const sheenPath = useMemo(() => {
    if (width <= 0 || height <= 0) return '';
    return [
      `M ${(width * 0.08).toFixed(1)} 0 L ${(width * 0.38).toFixed(1)} 0 L 0 ${(height * 0.42).toFixed(1)} L 0 ${(height * 0.14).toFixed(1)} Z`,
      `M ${(width * 0.62).toFixed(1)} 0 L ${(width * 0.78).toFixed(1)} 0 L ${(width * 0.14).toFixed(1)} ${height.toFixed(1)} L 0 ${height.toFixed(1)} Z`,
    ].join(' ');
  }, [width, height]);

  const normalizedHealth = Math.max(0, Math.min(100, iceHealth)) / 100;
  // Translucent frost veil so the trapped cat remains clearly visible inside the ice
  const topFrostAlpha = 0.15 + normalizedHealth * 0.38;
  const bottomFrostAlpha = 0.22 + normalizedHealth * 0.42;
  const borderOpacity = 0.25 + normalizedHealth * 0.65;
  const sheenOpacity = 0.06 + normalizedHealth * 0.14;

  if (iceHealth <= 0 || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }]}>
      <Canvas style={{ width, height }}>
        {/* Translucent frosted ice gradient */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[
              `rgba(224, 244, 255, ${topFrostAlpha.toFixed(3)})`,
              `rgba(147, 213, 252, ${bottomFrostAlpha.toFixed(3)})`,
            ]}
          />
        </Rect>

        {/* Diagonal specular ice glint bands */}
        {sheenPath.length > 0 && (
          <Path path={sheenPath} color={`rgba(255, 255, 255, ${sheenOpacity.toFixed(3)})`} />
        )}

        {/* Inner crystalline frost rim */}
        <RoundedRect
          x={1.5}
          y={1.5}
          width={width - 3}
          height={height - 3}
          r={22}
          style="stroke"
          strokeWidth={3}
          color={`rgba(224, 247, 255, ${borderOpacity.toFixed(3)})`}
        />

        {/* Procedural cracks with deep cyan refraction glow and crisp white fracture lines */}
        {combinedCrackPath.length > 0 && (
          <Group>
            <Path
              path={combinedCrackPath}
              style="stroke"
              strokeWidth={4.5}
              strokeCap="round"
              strokeJoin="round"
              color="rgba(56, 189, 248, 0.72)"
            />
            <Path
              path={combinedCrackPath}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
              strokeJoin="round"
              color="rgba(255, 255, 255, 0.96)"
            />
            {impactPoints.map((pt) => (
              <Circle
                key={pt.id}
                cx={pt.x}
                cy={pt.y}
                r={3.5}
                color="rgba(255, 255, 255, 0.9)"
              />
            ))}
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
