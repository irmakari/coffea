import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, photoRatio, radii } from '@/theme';

import { CupMark } from './CupMark';

type CoffeePhotoProps = {
  uri?: string | null;
  // A stable name for the image cache. Photo links are temporary, so without
  // this every new link would download the same picture again.
  cacheKey?: string | null;
  ratio?: keyof typeof photoRatio;
  // The coffee type, drawn in place of a missing photo.
  drink?: string | null;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

// The one treatment for coffee photographs: a fixed crop, a soft corner and
// nothing laid over the picture. Without a photo it shows the cup mark, on
// tan and drawn as the drink when the type is known.
export function CoffeePhoto({ uri, cacheKey, ratio = 'portrait', drink, accessibilityLabel, style }: CoffeePhotoProps) {
  const illustrated = !uri && !!drink;

  // The shorter side, so the cup mark fits wide crops as well as tall ones.
  const [side, setSide] = useState(0);

  return (
    <View
      style={[styles.frame, { aspectRatio: photoRatio[ratio] }, style, illustrated && styles.illustrated]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSide(Math.min(width, height));
      }}
    >
      {uri ? (
        <Image
          source={cacheKey ? { uri, cacheKey } : { uri }}
          contentFit="cover"
          transition={200}
          accessibilityLabel={accessibilityLabel}
          style={StyleSheet.absoluteFill}
        />
      ) : side > 0 ? (
        <CupMark drink={drink} size={Math.round(Math.min(side * (illustrated ? 0.68 : 0.5), 180))} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    // Width leads and the crop sets the height, whatever the parent's layout.
    width: '100%',
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustrated: {
    backgroundColor: colors.highlight,
  },
});
