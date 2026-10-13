import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { colors } from '@/theme';

export function LoadingState() {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={t('common.loading')}>
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
