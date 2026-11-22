import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Oval,
  Path,
  RadialGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';

export interface IceCatIllustrationProps {
  iceHealth: number;
  size?: number;
}

/**
 * Vector AI Cat rendered with Skia inside the ice block.
 * Its colors, expression, and ambient aura shift smoothly as the ice breaks.
 */
export function IceCatIllustration({ iceHealth, size = 220 }: IceCatIllustrationProps) {
  const isBroken = iceHealth <= 0;
  const isThawing = iceHealth > 0 && iceHealth <= 50;

  const furColor = isBroken ? '#FFF3E0' : isThawing ? '#EBF4FF' : '#DCECFB';
  const furShadeColor = isBroken ? '#FDE2B8' : isThawing ? '#D6E7FA' : '#C5DDF5';
  const innerEarColor = isBroken ? '#FDA4AF' : isThawing ? '#F9A8D4' : '#93C5FD';
  const stripeColor = isBroken ? '#E5A96D' : '#8DB4D9';
  const cheekColor = isBroken ? 'rgba(251, 113, 133, 0.55)' : 'rgba(125, 211, 252, 0.45)';
  const scarfColor = isBroken ? '#F97316' : '#38BDF8';
  const scarfShade = isBroken ? '#EA580C' : '#0284C7';
  const outlineColor = '#1E293B';

  const haloInner = isBroken
    ? 'rgba(251, 191, 36, 0.36)'
    : isThawing
      ? 'rgba(56, 189, 248, 0.28)'
      : 'rgba(147, 197, 253, 0.24)';

  const scale = size / 220;

  return (
    <View pointerEvents="none" style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          {/* Ambient aura behind the cat */}
          <Circle cx={110} cy={112} r={98}>
            <RadialGradient c={vec(110, 112)} r={98} colors={[haloInner, 'rgba(0,0,0,0)']} />
          </Circle>

          {/* Subtle tail curl on the right */}
          <Path
            path="M 152 178 Q 186 172 184 144 Q 182 128 168 134"
            style="stroke"
            strokeWidth={13}
            strokeCap="round"
            color={furShadeColor}
          />
          <Path
            path="M 152 178 Q 186 172 184 144 Q 182 128 168 134"
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            color={outlineColor}
          />

          {/* Body / Shoulders */}
          <RoundedRect x={62} y={142} width={96} height={58} r={34} color={furShadeColor} />
          <RoundedRect
            x={62}
            y={142}
            width={96}
            height={58}
            r={34}
            style="stroke"
            strokeWidth={2.5}
            color={outlineColor}
          />

          {/* Cute tummy patch */}
          <Oval x={86} y={156} width={48} height={38} color={furColor} />

          {/* Left & Right Ears */}
          <Path path="M 62 98 L 54 44 L 96 72 Z" color={furColor} />
          <Path
            path="M 62 98 L 54 44 L 96 72 Z"
            style="stroke"
            strokeWidth={2.5}
            strokeJoin="round"
            color={outlineColor}
          />
          <Path path="M 64 89 L 59 54 L 87 73 Z" color={innerEarColor} />

          <Path path="M 158 98 L 166 44 L 124 72 Z" color={furColor} />
          <Path
            path="M 158 98 L 166 44 L 124 72 Z"
            style="stroke"
            strokeWidth={2.5}
            strokeJoin="round"
            color={outlineColor}
          />
          <Path path="M 156 89 L 161 54 L 133 73 Z" color={innerEarColor} />

          {/* Cat Head */}
          <Oval x={56} y={64} width={108} height={88} color={furColor} />
          <Oval
            x={56}
            y={64}
            width={108}
            height={88}
            style="stroke"
            strokeWidth={2.5}
            color={outlineColor}
          />

          {/* Forehead stripes */}
          <RoundedRect x={107} y={69} width={6} height={14} r={3} color={stripeColor} />
          <RoundedRect x={95} y={71} width={5} height={11} r={2.5} color={stripeColor} />
          <RoundedRect x={120} y={71} width={5} height={11} r={2.5} color={stripeColor} />

          {/* Cozy Scarf / Collar */}
          <RoundedRect x={72} y={141} width={76} height={16} r={8} color={scarfColor} />
          <RoundedRect x={124} y={150} width={16} height={22} r={6} color={scarfShade} />
          <RoundedRect
            x={72}
            y={141}
            width={76}
            height={16}
            r={8}
            style="stroke"
            strokeWidth={2}
            color={outlineColor}
          />
          {isBroken && (
            <Group>
              <Circle cx={110} cy={159} r={6} color="#FBBF24" />
              <Circle
                cx={110}
                cy={159}
                r={6}
                style="stroke"
                strokeWidth={1.8}
                color={outlineColor}
              />
            </Group>
          )}

          {/* Cheeks */}
          <Oval x={68} y={114} width={16} height={10} color={cheekColor} />
          <Oval x={136} y={114} width={16} height={10} color={cheekColor} />

          {/* Eyes (state-dependent) */}
          {isBroken ? (
            <Group>
              {/* Happy curved smiling eyes */}
              <Path
                path="M 79 106 Q 87 96 95 106"
                style="stroke"
                strokeWidth={3.5}
                strokeCap="round"
                color={outlineColor}
              />
              <Path
                path="M 125 106 Q 133 96 141 106"
                style="stroke"
                strokeWidth={3.5}
                strokeCap="round"
                color={outlineColor}
              />
            </Group>
          ) : isThawing ? (
            <Group>
              {/* Wide hopeful eyes with catchlights */}
              <Circle cx={87} cy={104} r={8.5} color={outlineColor} />
              <Circle cx={90} cy={101} r={3} color="#FFFFFF" />
              <Circle cx={84} cy={107} r={1.5} color="#FFFFFF" />

              <Circle cx={133} cy={104} r={8.5} color={outlineColor} />
              <Circle cx={136} cy={101} r={3} color="#FFFFFF" />
              <Circle cx={130} cy={107} r={1.5} color="#FFFFFF" />
            </Group>
          ) : (
            <Group>
              {/* Shivering > < eyes */}
              <Path
                path="M 80 98 L 93 104 L 80 110"
                style="stroke"
                strokeWidth={3.2}
                strokeCap="round"
                strokeJoin="round"
                color={outlineColor}
              />
              <Path
                path="M 140 98 L 127 104 L 140 110"
                style="stroke"
                strokeWidth={3.2}
                strokeCap="round"
                strokeJoin="round"
                color={outlineColor}
              />
            </Group>
          )}

          {/* Cute Triangle Nose */}
          <Path path="M 105 113 L 115 113 L 110 119 Z" color="#F472B6" />

          {/* Mouth (state-dependent) */}
          {isBroken ? (
            <Path
              path="M 97 123 Q 103.5 131 110 123 Q 116.5 131 123 123"
              style="stroke"
              strokeWidth={2.8}
              strokeCap="round"
              strokeJoin="round"
              color={outlineColor}
            />
          ) : isThawing ? (
            <Oval
              x={106}
              y={122}
              width={8}
              height={7}
              style="stroke"
              strokeWidth={2.5}
              color={outlineColor}
            />
          ) : (
            <Path
              path="M 97 127 Q 103.5 122 110 127 Q 116.5 132 123 127"
              style="stroke"
              strokeWidth={2.6}
              strokeCap="round"
              color={outlineColor}
            />
          )}

          {/* Whiskers */}
          <Path
            path="M 69 111 L 46 107 M 68 118 L 44 119 M 70 125 L 48 130"
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            color="rgba(30, 41, 59, 0.55)"
          />
          <Path
            path="M 151 111 L 174 107 M 152 118 L 176 119 M 150 125 L 172 130"
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            color="rgba(30, 41, 59, 0.55)"
          />

          {/* Paws */}
          <Oval x={72} y={182} width={26} height={18} color={furColor} />
          <Oval
            x={72}
            y={182}
            width={26}
            height={18}
            style="stroke"
            strokeWidth={2.3}
            color={outlineColor}
          />
          <Oval x={122} y={182} width={26} height={18} color={furColor} />
          <Oval
            x={122}
            y={182}
            width={26}
            height={18}
            style="stroke"
            strokeWidth={2.3}
            color={outlineColor}
          />

          {/* Celebration sparkles once freed */}
          {isBroken && (
            <Group>
              <Path
                path="M 38 56 L 41 64 L 49 67 L 41 70 L 38 78 L 35 70 L 27 67 L 35 64 Z"
                color="#FBBF24"
              />
              <Path
                path="M 182 48 L 184.5 54 L 190.5 56.5 L 184.5 59 L 182 65 L 179.5 59 L 173.5 56.5 L 179.5 54 Z"
                color="#FBBF24"
              />
              <Path
                path="M 184 110 L 186 115 L 191 117 L 186 119 L 184 124 L 182 119 L 177 117 L 182 115 Z"
                color="#FCD34D"
              />
            </Group>
          )}
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
