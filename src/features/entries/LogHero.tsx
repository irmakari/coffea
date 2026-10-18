import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CupMark, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, spacing, themed } from '@/theme';

import { usePhotoPicker } from './PhotoField';
import { useSticker } from './sticker';
import { StickerReveal } from './StickerReveal';

const DISC = 176;
// The rounded top of the sheet, which rises over the tan.
const SHEET_RADIUS = 32;

type LogHeroProps = {
  title: string;
  // The coffee as named so far, shown under the cup as it is typed.
  name: string;
  uri: string | null;
  onChange: (uri: string | null) => void;
  drink?: string | null;
};

// The top of the log screen: the title on tan, and the cup sitting in the
// middle where the sheet meets it. The cup turns into the chosen drink, and
// a tap on it adds a photo to take its place.
export function LogHero({ title, name, uri, onChange, drink }: LogHeroProps) {
  const insets = useSafeAreaInsets();
  const { busy, failure, choose } = usePhotoPicker(uri, onChange);
  const sticker = useSticker(uri, null);

  return (
    <View>
      <View style={[styles.band, { paddingTop: insets.top + spacing.lg }]}>
        {/* Pulled down past the top, the page shows more tan, not a gap. */}
        <View style={styles.overscroll} />
        <Text variant="display" color="heroText" accessibilityRole="header">
          {title}
        </Text>
      </View>

      <View style={styles.sheetTop}>
        <View style={styles.disc}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(uri ? 'entry.photo.change' : 'entry.photo.add')}
            accessibilityState={{ busy }}
            onPress={choose}
            style={({ pressed }) => [styles.fill, (pressed || busy) && styles.pressed]}
          >
            {uri ? (
              <StickerReveal photoUri={uri} sticker={sticker} shape="round" />
            ) : (
              <View style={styles.drawing}>
                <CupMark drink={drink} size={DISC} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Both lines are always there, so the form does not jump under the
            finger as a type is picked or a photo is added. */}
        <View style={styles.caption}>
          <Text variant="heading" align="center" numberOfLines={1} color={name ? 'text' : 'textMuted'}>
            {name || t('entry.hero.untitled')}
          </Text>
          {failure ? (
            <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
              {t(failure)}
            </Text>
          ) : uri && sticker !== undefined ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange(null)}
              hitSlop={spacing.sm}
              style={({ pressed }) => [styles.removeLink, pressed && styles.pressed]}
            >
              <Text variant="small" color="textSecondary" align="center" style={styles.underline}>
                {t('entry.photo.remove')}
              </Text>
            </Pressable>
          ) : (
            <Text
              variant="small"
              color="textSecondary"
              align="center"
              accessibilityLiveRegion={uri ? 'polite' : undefined}
            >
              {t(uri ? 'entry.photo.makingSticker' : 'entry.hero.addHint')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = themed(() => ({
  // Tall enough for the top half of the cup to sit on it below the title.
  band: {
    backgroundColor: colors.hero,
    paddingHorizontal: spacing.screen,
    paddingBottom: SHEET_RADIUS + DISC / 2 + spacing.lg,
  },
  overscroll: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    height: 1000,
    backgroundColor: colors.hero,
  },
  sheetTop: {
    marginTop: -SHEET_RADIUS,
    paddingHorizontal: spacing.screen,
    alignItems: 'center',
    gap: spacing.md,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderCurve: 'continuous',
    backgroundColor: colors.sheet,
  },
  // Centred on the sheet's top edge, half on the tan and half on the sheet.
  disc: {
    width: DISC,
    height: DISC,
    marginTop: -DISC / 2,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  drawing: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  caption: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xs,
  },
  removeLink: {
    alignSelf: 'center',
  },
  underline: {
    textDecorationLine: 'underline',
  },
}));
