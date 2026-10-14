import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { BackButton } from './BackButton';
import { Text } from './Text';

type PageHeaderProps = {
  title: string;
  // A line under the title.
  subtitle?: string;
  // Controls at the far end of the row, such as an add button.
  trailing?: ReactNode;
  // Screens that already pad their content turn this off.
  padded?: boolean;
};

// The header of every page reached from another: the way back and the title
// on one line. Tabs have no way back and a larger title, which is how the
// two kinds of page are told apart.
export function PageHeader({ title, subtitle, trailing, padded = true }: PageHeaderProps) {
  return (
    <View style={[styles.header, padded && styles.padded]}>
      <View style={styles.row}>
        <BackButton />
        <Text variant="title" accessibilityRole="header" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {trailing}
      </View>
      {subtitle ? <Text color="textSecondary">{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  padded: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
  },
});
