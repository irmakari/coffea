import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import type { TextStyle } from 'react-native';

// Passed to useFonts in the root layout. Keys double as fontFamily names.
// Coffea uses one upright sans family: no serif, no italics.
export const fontAssets = {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
};

export const fonts = {
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansStrong: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

// Hierarchy comes from size, weight and tight tracking on the large sizes,
// not from a second typeface.
export const typography = {
  display: { fontFamily: fonts.sansBold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1 },
  title: { fontFamily: fonts.sansBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.7 },
  heading: { fontFamily: fonts.sansStrong, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  subheading: { fontFamily: fonts.sansStrong, fontSize: 17, lineHeight: 24, letterSpacing: -0.1 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 20, letterSpacing: 0.1 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  eyebrow: {
    fontFamily: fonts.sansStrong,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
