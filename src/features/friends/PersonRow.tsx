import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Avatar, Text } from '@/components/ui';
import { colors, radii, sizes, spacing, themed } from '@/theme';

import { personName, type Person } from './friendsApi';

type PersonRowProps = {
  person: Person;
  // Buttons at the end of the row.
  trailing?: ReactNode;
  // Opens the person's page; the buttons at the end keep their own taps.
  onPress?: () => void;
};

export function PersonRow({ person, trailing, onPress }: PersonRowProps) {
  const name = personName(person);
  // The handle is only repeated when a display name stands in front of it.
  const handle = person.displayName && person.username ? `@${person.username}` : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Avatar uri={person.avatarUrl} cacheKey={person.avatarPath} name={name} size={44} />
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {name}
        </Text>
        {handle ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {handle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </Pressable>
  );
}

type RowButtonProps = {
  label: string;
  onPress: () => void;
  // Primary for the action the row is there for, quiet for the alternative.
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

// A small pill that fits beside a name, where a full-width Button would not.
export function RowButton({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: RowButtonProps) {
  const primary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={spacing.xs}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        pressed && (primary ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={primary ? colors.textOnAccent : colors.text} />
      ) : (
        <Text variant="label" color={primary ? 'textOnAccent' : 'text'}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = themed(() => ({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: sizes.hairline,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondary: {
    borderWidth: sizes.hairline,
    borderColor: colors.borderStrong,
  },
  secondaryPressed: {
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.35,
  },
}));
