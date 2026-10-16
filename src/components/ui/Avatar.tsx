import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radii, themed } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type AvatarProps = {
  uri?: string | null;
  cacheKey?: string | null;
  // Supplies the initial shown when there is no photo.
  name?: string | null;
  size?: number;
};

export function Avatar({ uri, cacheKey, name, size = 72 }: AvatarProps) {
  // "@ayse" starts with its letter, not the @.
  const initial = name?.trim().replace(/^@/, '').charAt(0).toLocaleUpperCase();

  return (
    <View style={[styles.circle, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={cacheKey ? { uri, cacheKey } : { uri }}
          contentFit="cover"
          transition={200}
          style={StyleSheet.absoluteFill}
        />
      ) : initial ? (
        <Text
          variant="title"
          color="accentPressed"
          maxFontSizeMultiplier={1}
          style={{ fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.52) }}
        >
          {initial}
        </Text>
      ) : (
        <Icon name="profile" size={size * 0.4} color="textSecondary" />
      )}
    </View>
  );
}

const styles = themed(() => ({
  circle: {
    borderRadius: radii.pill,
    // Tan, so an initial stands out on the white cards it often sits on.
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}));
