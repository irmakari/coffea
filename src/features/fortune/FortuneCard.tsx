import { Pressable, View } from 'react-native';

import { CupMark, Icon, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, sizes, spacing, themed } from '@/theme';

import type { FortuneSymbol } from './fortune';
import { Glyph, UpsideDown } from './FortuneCup';

const CUP = 136;

// A few of the shapes the grounds can leave, scattered beside the cup.
const scattered: { symbol: FortuneSymbol; size: number; top: number; right: number; opacity: number }[] = [
  { symbol: 'star', size: 14, top: 14, right: CUP - 10, opacity: 0.9 },
  { symbol: 'moon', size: 16, top: 104, right: CUP - 2, opacity: 0.7 },
  { symbol: 'heart', size: 12, top: 150, right: CUP - 28, opacity: 0.6 },
];

// The way into a Turkish coffee's fortune: a dark card with the cup at its
// edge, the shapes of the grounds round it, and a button to turn it over.
export function FortuneCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('fortune.entry.title')}. ${t('fortune.entry.body')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Already turned over on its saucer, as the fortune asks. */}
      <View pointerEvents="none" style={styles.cup}>
        <CupMark drink="turkish" size={CUP} />
        <UpsideDown size={CUP} />
      </View>
      {scattered.map((glyph) => (
        <View
          key={glyph.symbol}
          pointerEvents="none"
          style={[styles.glyph, { top: glyph.top, right: glyph.right, opacity: glyph.opacity }]}
        >
          <Glyph symbol={glyph.symbol} size={glyph.size} color={colors.boardAccent} />
        </View>
      ))}

      <View style={styles.text}>
        <Text variant="eyebrow" style={styles.eyebrow}>
          {t('fortune.title')}
        </Text>
        <Text variant="heading" style={styles.title}>
          {t('fortune.entry.title')}
        </Text>
        <Text variant="small" style={styles.body}>
          {t('fortune.entry.body')}
        </Text>
        <View style={styles.action}>
          <Text variant="label" style={styles.actionText}>
            {t('fortune.turn')}
          </Text>
          <Icon name="chevronRight" size={14} color="boardCard" strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = themed(() => ({
  card: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    backgroundColor: colors.boardCard,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  // Half off the card's right edge, as if the saucer runs on past it.
  cup: {
    position: 'absolute',
    right: -CUP * 0.32,
    top: '50%',
    marginTop: -CUP / 2,
  },
  glyph: {
    position: 'absolute',
  },
  // Clear of the cup, so no line runs under it.
  text: {
    marginRight: CUP * 0.62,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.boardAccent,
  },
  title: {
    color: colors.boardText,
  },
  body: {
    color: colors.boardMuted,
  },
  action: {
    minHeight: sizes.chip,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.boardAccent,
  },
  actionText: {
    color: colors.boardCard,
  },
}));
