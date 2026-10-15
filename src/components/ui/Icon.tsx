import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, type ColorName } from '@/theme';

// A small hand-drawn line set on a 24pt grid. Add a glyph here rather than
// pulling in an icon font: the app only needs a handful.
const glyphs = {
  home: <Path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5Z" />,
  diary: (
    <>
      <Path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2V4Z" />
      <Path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7V4Z" />
    </>
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  collections: <Path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />,
  profile: (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </>
  ),
  calendar: (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={3} />
      <Path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  close: <Path d="M18 6 6 18M6 6l12 12" />,
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m20 20-4-4" />
    </>
  ),
  check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  share: (
    <>
      <Path d="M12 3v12M8 7l4-4 4 4" />
      <Path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </>
  ),
  friends: (
    <>
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  addFriend: (
    <>
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M19 8v6M22 11h-6" />
    </>
  ),
  more: (
    <>
      <Circle cx={5} cy={12} r={1} />
      <Circle cx={12} cy={12} r={1} />
      <Circle cx={19} cy={12} r={1} />
    </>
  ),
  chevronRight: <Path d="m9 18 6-6-6-6" />,
  chevronLeft: <Path d="m15 18-6-6 6-6" />,
  heart: (
    <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.7 7.8l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  photo: (
    <>
      <Rect x={3} y={4} width={18} height={16} rx={3} />
      <Circle cx={8.5} cy={9.5} r={1.5} />
      <Path d="m21 15-4.5-4.5L7 20" />
    </>
  ),
  star: (
    <Path d="m12 2.5 2.9 5.9 6.6 1-4.75 4.6 1.1 6.5L12 17.4l-5.85 3.1 1.1-6.5L2.5 9.4l6.6-1L12 2.5Z" />
  ),
} as const;

export type IconName = keyof typeof glyphs;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorName;
  strokeWidth?: number;
  filled?: boolean;
};

export function Icon({ name, size = 24, color = 'text', strokeWidth = 1.5, filled = false }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? colors[color] : 'none'}
      stroke={colors[color]}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphs[name]}
    </Svg>
  );
}
