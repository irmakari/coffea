import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { spacing } from '@/theme';

import { IconButton } from './IconButton';
import { Text } from './Text';

export function ModalHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    flexShrink: 1,
  },
});
