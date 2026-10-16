import { StyleSheet, View } from 'react-native';

import { Avatar, CupMark, SectionHeader, Text } from '@/components/ui';
import { isCoffeeType } from '@/features/entries/types';
import { personName } from '@/features/friends/friendsApi';
import { t } from '@/i18n';
import { colors, fonts, sizes, spacing } from '@/theme';

import type { Activity } from './albumFriendsApi';

function coffeeName(coffee: string) {
  return isCoffeeType(coffee) ? t(`coffeeTypes.${coffee}`) : coffee;
}

// "Today", "Yesterday", "3 days ago", by the phone's calendar days.
function when(iso: string, now = new Date()) {
  const day = new Date(iso);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()) /
      86_400_000,
  );
  if (days <= 0) return t('activity.when.today');
  if (days === 1) return t('activity.when.yesterday');
  return t('activity.when.days', { count: days });
}

// Friends' latest firsts: one line each, no photos.
export function ActivityList({ items }: { items: Activity[] }) {
  return (
    <View>
      <SectionHeader large title={t('activity.title')} />
      {items.length === 0 ? (
        <Text color="textSecondary">{t('activity.empty')}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View
              key={`${item.person.id}:${item.coffee}`}
              style={[styles.item, index === items.length - 1 && styles.lastItem]}
            >
              <Avatar
                uri={item.person.avatarUrl}
                cacheKey={item.person.avatarPath}
                name={personName(item.person)}
                size={40}
              />
              <View style={styles.itemText}>
                <Text numberOfLines={2}>
                  <Text style={styles.strong}>{personName(item.person)}</Text>
                  {t('activity.collectedJoin')}
                  <Text style={styles.strong}>{coffeeName(item.coffee)}</Text>
                </Text>
                <Text variant="caption" color="textMuted">
                  {when(item.collectedAt)} · {t('activity.progress', { count: item.collected })}
                </Text>
              </View>
              <View style={styles.cup}>
                <CupMark drink={item.coffee} size={46} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Straight on the page, split by hairlines, like the home tab's list.
  list: {},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  // The drink alone, straight on the page.
  cup: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strong: {
    fontFamily: fonts.sansStrong,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
});
