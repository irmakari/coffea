import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './Text';

type EmptyStateProps = {
  title: string;
  body?: string;
  // Shown above the title. Usually a CoffeePhoto without a photo.
  visual?: ReactNode;
  // Usually a single Button. Leave empty when there is nothing to do here.
  action?: ReactNode;
};

export function EmptyState({ title, body, visual, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {visual ? <View style={styles.visual}>{visual}</View> : null}
      <Text variant="title" align="center">
        {title}
      </Text>
      {body ? (
        <Text color="textSecondary" align="center" style={styles.body}>
          {body}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
  },
  visual: {
    marginBottom: spacing.xxl,
  },
  body: {
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.xl,
  },
});
