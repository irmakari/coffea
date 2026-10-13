import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, IconButton, ScreenHeader } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryCard } from '@/features/entries/EntryCard';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function FavoritesScreen() {
  const { entries } = useEntries();
  const favorites = entries.filter((entry) => entry.isFavorite);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={favorites}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => <EntryCard entry={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <IconButton icon="chevronLeft" label={t('common.back')} onPress={() => router.back()} />
            <ScreenHeader title={t('favorites.title')} />
          </View>
        }
        ListEmptyComponent={<EmptyState title={t('favorites.empty.title')} body={t('favorites.empty.body')} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  separator: {
    height: spacing.xxl,
  },
});
