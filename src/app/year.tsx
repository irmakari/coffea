import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, PageHeader, Screen, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { CARD_RATIO } from '@/features/share/ShareCard';
import { shareCard } from '@/features/share/shareImage';
import { YearCard } from '@/features/share/YearCard';
import { totalCaffeine } from '@/features/stats/caffeine';
import { computeStats, entriesInPeriod } from '@/features/stats/stats';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

// This calendar year so far, as a story card to share.
export default function YearScreen() {
  const { entries } = useEntries();
  const insets = useSafeAreaInsets();
  const card = useRef<View>(null);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [sharing, setSharing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const thisYear = useMemo(() => entriesInPeriod(entries, 'year'), [entries]);
  const stats = useMemo(() => computeStats(thisYear), [thisYear]);
  const caffeine = totalCaffeine(thisYear);

  const previewWidth = Math.max(
    0,
    Math.floor(Math.min(area.width - spacing.xxxl * 2, (area.height - spacing.lg * 2) * CARD_RATIO)),
  );

  const share = async () => {
    setFailure(null);
    setSharing(true);
    try {
      const shared = await shareCard(card);
      if (!shared) setFailure(t('share.unavailable'));
    } catch {
      setFailure(t('share.error'));
    }
    setSharing(false);
  };

  return (
    <Screen padded={false} edges={['top']}>
      <View style={styles.header}>
        <PageHeader padded={false} title={t('year.title')} />
      </View>

      {stats.total === 0 ? (
        <EmptyState title={t('year.empty')} />
      ) : (
        <>
          <View
            style={styles.preview}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setArea({ width, height });
            }}
          >
            {previewWidth > 0 ? (
              <View style={styles.cardShadow}>
                <YearCard
                  ref={card}
                  year={new Date().getFullYear()}
                  stats={stats}
                  caffeine={caffeine}
                  width={previewWidth}
                />
              </View>
            ) : null}
          </View>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            {failure ? (
              <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
                {failure}
              </Text>
            ) : null}
            <Button label={t('year.action')} loading={sharing} onPress={share} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screen,
  },
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardShadow: {
    backgroundColor: colors.background,
    shadowColor: colors.text,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
});
