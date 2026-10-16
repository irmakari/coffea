import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, PageHeader } from '@/components/ui';
import { collect, countLabel, isCollectionKind } from '@/features/collections/collections';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryCard } from '@/features/entries/EntryCard';
import { t } from '@/i18n';
import { colors, contentColumn, spacing, themed } from '@/theme';

export default function CollectionScreen() {
  const { kind, value } = useLocalSearchParams<{ kind?: string; value?: string }>();
  const { entries } = useEntries();
  // A link with a kind this version does not know opens the favorites.
  const collection = useMemo(
    () => collect(entries, isCollectionKind(kind) ? kind : 'favorites', value),
    [entries, kind, value],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={collection.entries}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => <EntryCard entry={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader
              padded={false}
              title={collection.name}
              subtitle={collection.entries.length > 0 ? countLabel(collection.entries.length) : undefined}
            />
          </View>
        }
        ListEmptyComponent={
          collection.kind === 'favorites' ? (
            <EmptyState title={t('favorites.empty.title')} body={t('favorites.empty.body')} />
          ) : (
            <EmptyState
              title={t('collections.empty.title')}
              body={t(collection.kind === 'fiveStars' ? 'collections.empty.fiveStars' : 'collections.empty.other')}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[contentColumn, styles.content]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = themed(() => ({
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
    marginBottom: spacing.xl,
  },
  separator: {
    height: spacing.xxl,
  },
}));
