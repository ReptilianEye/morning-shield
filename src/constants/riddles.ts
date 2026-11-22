import type { SFSymbol } from 'sf-symbols-typescript';

import type { ActiveRiddleRoute, RiddleId } from '@/store/useMorningStore';

export interface ChallengeMetadata {
  id: RiddleId;
  href: ActiveRiddleRoute;
  title: string;
  shortTitle: string;
  description: string;
  tags: string[];
  symbol: SFSymbol;
  fallbackEmoji: string;
  tint: string;
  badgeBg: string;
}

export const CHALLENGE_CATALOG: ChallengeMetadata[] = [
  {
    id: 'ice-cat',
    href: '/riddle/ice-cat',
    title: 'Break the Ice Cat',
    shortTitle: 'Ice Cat',
    description:
      'Crack the frozen barrier and warm up the cat by shaking your phone and tapping glowing weak spots.',
    tags: ['Shake & Tap', 'Quick'],
    symbol: 'snowflake',
    fallbackEmoji: '🧊',
    tint: '#0284C7',
    badgeBg: 'rgba(14, 165, 233, 0.14)',
  },
  {
    id: 'gyro-maze',
    href: '/riddle/gyro-maze',
    title: 'Gyro Maze',
    shortTitle: 'Gyro Maze',
    description:
      'Tilt your phone gently to roll the orb through the maze and guide it into the goal zone.',
    tags: ['Tilt & Balance', 'Focus'],
    symbol: 'circle.grid.cross.fill',
    fallbackEmoji: '🌀',
    tint: '#7C3AED',
    badgeBg: 'rgba(124, 58, 237, 0.14)',
  },
  {
    id: 'color-match',
    href: '/riddle/color-match',
    title: 'Color Match',
    shortTitle: 'Color Match',
    description:
      'Pick a target shade and find something around your room that matches using your camera.',
    tags: ['Camera Hunt', 'Active'],
    symbol: 'camera.viewfinder',
    fallbackEmoji: '🎨',
    tint: '#D97706',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
  },
  {
    id: 'sequence-tap',
    href: '/riddle/sequence-tap',
    title: 'Sequence Tap',
    shortTitle: 'Sequence Tap',
    description:
      'Clear the scattered number tiles by tapping all 20 in ascending or descending order.',
    tags: ['Focus & Tap', 'Quick'],
    symbol: 'number.square.fill',
    fallbackEmoji: '🔢',
    tint: '#0D9488',
    badgeBg: 'rgba(13, 148, 136, 0.14)',
  },
];

export const CHALLENGE_BY_ID: Record<RiddleId, ChallengeMetadata> = {
  'ice-cat': CHALLENGE_CATALOG[0],
  'gyro-maze': CHALLENGE_CATALOG[1],
  'color-match': CHALLENGE_CATALOG[2],
  'sequence-tap': CHALLENGE_CATALOG[3],
};
