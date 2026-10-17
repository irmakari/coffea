import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card, RollingNumber, Text } from '@/components/ui';
import type { Entry } from '@/features/entries/types';
import { formatDate, formatNumber, t } from '@/i18n';
import { spacing, themed } from '@/theme';

import { BeanJar } from './BeanJar';
import { caffeineLevel } from './caffeineLevel';

// One bean in the jar stands for this many milligrams.
const PER_BEAN = 10;
// The jar is checked as the minutes pass, so beans fade as caffeine wears off.
const TICK = 60 * 1000;

function useMinute() {
  const [minute, setMinute] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setMinute(Date.now()), TICK);
    return () => clearInterval(timer);
  }, []);
  return minute;
}

// How much caffeine is in the body right now, worked out from the coffees
// logged, as a jar of beans that empties while it wears off.
export function CaffeineCard({ entries }: { entries: Entry[] }) {
  const minute = useMinute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const level = useMemo(() => caffeineLevel(entries), [entries, minute]);

  if (!level) return null;

  const amount = Math.round(level.now / 5) * 5;
  const note =
    level.clearAt !== null
      ? t('home.caffeine.clearAt', { time: formatDate(level.clearAt, 'time') })
      : amount === 0
        ? t('home.caffeine.none')
        : t('home.caffeine.clear');

  return (
    <Card outline style={styles.card}>
      <View style={styles.text}>
        <Text variant="label" color="textSecondary">
          {t('home.caffeine.title')}
        </Text>
        <View style={styles.amount}>
          <RollingNumber variant="title" value={`~${formatNumber(amount)}`} />
          <Text variant="bodyStrong" color="textSecondary">
            {t('home.caffeine.unit')}
          </Text>
        </View>
        <Text variant="small" color="textSecondary">
          {note}
        </Text>
        <Text variant="caption" color="textMuted" style={styles.legend}>
          {t('home.caffeine.legend', { count: PER_BEAN })}
        </Text>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <BeanJar beans={level.now / PER_BEAN} />
      </View>
    </Card>
  );
}

const styles = themed(() => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  legend: {
    marginTop: spacing.sm,
  },
}));
