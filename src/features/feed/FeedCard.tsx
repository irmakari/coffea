import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, CoffeePhoto, Icon, IconButton, Text } from '@/components/ui';
import { isCoffeeType, isMilkType, MAX_RATING } from '@/features/entries/types';
import { personName } from '@/features/friends/friendsApi';
import { formatDate, formatNumber, t } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

import type { FeedItem } from './feedApi';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// "Just now", "25 min ago", "3 h ago", "Yesterday", then the date.
function when(date: string, now = new Date()) {
  const then = new Date(date);
  const elapsed = now.getTime() - then.getTime();
  if (elapsed < MINUTE) return t('feed.when.now');
  if (elapsed < HOUR) return t('feed.when.minutes', { count: Math.floor(elapsed / MINUTE) });
  if (elapsed < 24 * HOUR && then.getDate() === now.getDate()) {
    return t('feed.when.hours', { count: Math.floor(elapsed / HOUR) });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (then.toDateString() === yesterday.toDateString()) return t('feed.when.yesterday');
  return formatDate(then, 'dayShort');
}

type FeedCardProps = {
  item: FeedItem;
  // The user's own coffees open in the journal and take no cheers.
  mine: boolean;
  onOpen: () => void;
  onCheer: () => void;
  onMore: () => void;
};

export function FeedCard({ item, mine, onOpen, onCheer, onMore }: FeedCardProps) {
  const author = mine ? t('feed.you') : personName(item.author);
  const type = item.type ? (isCoffeeType(item.type) ? t(`coffeeTypes.${item.type}`) : item.type) : null;
  const milk = item.milk ? (isMilkType(item.milk) ? t(`milkTypes.${item.milk}`) : item.milk) : null;
  const details = [type, milk, item.cafe].filter((part): part is string => !!part).join(' · ');

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.header}>
        <Avatar
          uri={item.author.avatarUrl}
          cacheKey={item.author.avatarPath}
          name={personName(item.author)}
          size={36}
        />
        <View style={styles.headerText}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {author}
          </Text>
          <Text variant="caption" color="textSecondary">
            {when(item.consumedAt)}
          </Text>
        </View>
        {mine ? null : <IconButton icon="more" plain label={t('feed.more', { name: author })} onPress={onMore} />}
      </View>

      <Pressable
        accessibilityRole={mine ? 'button' : undefined}
        disabled={!mine}
        onPress={onOpen}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {item.photoUrl || item.type ? (
          <CoffeePhoto
            uri={item.photoUrl}
            cacheKey={item.photoPath}
            drink={item.type}
            ratio={item.photoUrl ? 'portrait' : 'landscape'}
            accessibilityLabel={item.name}
            style={styles.photo}
          />
        ) : null}

        <View style={styles.body}>
          <Text variant="heading" numberOfLines={2}>
            {item.name}
          </Text>
          {details ? (
            <Text color="textSecondary" numberOfLines={2}>
              {details}
            </Text>
          ) : null}
          {item.rating ? (
            <View style={styles.rating} accessibilityLabel={t('entry.rating.value', { count: item.rating })}>
              {Array.from({ length: MAX_RATING }, (_, index) => {
                const active = index < (item.rating ?? 0);
                return (
                  <Icon
                    key={index}
                    name="star"
                    size={14}
                    filled={active}
                    strokeWidth={1.25}
                    color={active ? 'text' : 'placeholder'}
                  />
                );
              })}
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.footer}>
        {mine ? (
          <Text variant="label" color="textSecondary">
            {item.cheers === 1
              ? t('feed.cheers.one')
              : item.cheers > 1
                ? t('feed.cheers.other', { count: formatNumber(item.cheers) })
                : t('feed.cheers.none')}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: item.cheered }}
            accessibilityLabel={t(item.cheered ? 'feed.cheers.undo' : 'feed.cheers.give', { name: author })}
            onPress={onCheer}
            hitSlop={spacing.xs}
            style={({ pressed }) => [styles.cheers, item.cheered && styles.cheered, pressed && styles.cheersPressed]}
          >
            <Text variant="label" color={item.cheered ? 'textOnAccent' : 'text'}>
              ☕ {t('feed.cheers.action')}
              {item.cheers > 0 ? ` · ${formatNumber(item.cheers)}` : ''}
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  photo: {
    borderRadius: 0,
  },
  body: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cheers: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: sizes.hairline,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cheered: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cheersPressed: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.85,
  },
});
