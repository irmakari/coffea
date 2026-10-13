import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';

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
  const initial = name?.trim().charAt(0).toUpperCase();

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
        <Text variant="title" color="textSecondary" maxFontSizeMultiplier={1}>
          {initial}
        </Text>
      ) : (
        <Icon name="profile" size={size * 0.4} color="textSecondary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
