import { Pressable, View } from 'react-native';

import { colors, sizes, spacing, themed } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type ListRowProps = {
  label: string;
  value?: string;
  // Makes the row a button and adds a chevron.
  onPress?: () => void;
};

export function ListRow({ label, value, onPress }: ListRowProps) {
  const content = (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trailing}>
        {value ? (
          <Text color="textMuted" numberOfLines={1} style={styles.value}>
            {value}
          </Text>
        ) : null}
        {onPress ? <Icon name="chevronRight" size={16} color="textMuted" /> : null}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

type SectionHeaderProps = {
  title: string;
  // The App Store's style: a bold title with an optional "See All" beside it.
  large?: boolean;
  action?: { label: string; onPress: () => void };
};

export function SectionHeader({ title, large = false, action }: SectionHeaderProps) {
  if (large) {
    return (
      <View style={styles.largeSection}>
        <Text variant="heading" accessibilityRole="header" style={styles.largeTitle}>
          {title}
        </Text>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={spacing.sm}>
            {({ pressed }) => (
              <Text variant="bodyStrong" color="textSecondary" style={pressed && styles.pressed}>
                {action.label}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    );
  }
  return (
    // Mocha, not the paler muted tone: at this size that one is hard to read
    // on the warm page.
    <Text variant="eyebrow" color="textSecondary" accessibilityRole="header" style={styles.section}>
      {title}
    </Text>
  );
}

const styles = themed(() => ({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  // A long value gives way first; the label always shows in full.
  label: {
    flexShrink: 0,
  },
  trailing: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  section: {
    marginBottom: spacing.sm,
  },
  largeSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  largeTitle: {
    flexShrink: 1,
  },
}));
