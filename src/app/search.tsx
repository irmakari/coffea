import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton, Card, Icon, SectionHeader, Text } from '@/components/ui';
import { useEntries } from '@/features/entries/EntriesProvider';
import { EntryRow } from '@/features/entries/EntryCard';
import { searchEntries } from '@/features/entries/search';
import { formatNumber, t } from '@/i18n';
import { colors, contentColumn, radii, sizes, spacing, typography } from '@/theme';

// Enough to scan; past this the answer is another word, not more scrolling.
const SHOWN = 40;

export default function SearchScreen() {
  const { entries } = useEntries();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchEntries(entries, query), [entries, query]);
  const searching = query.trim() !== '';
  const shown = results.slice(0, SHOWN);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[contentColumn, styles.header]}>
        <BackButton />
        <View style={styles.field}>
          <Icon name="search" size={18} color="textMuted" />
          <TextInput
            accessibilityLabel={t('search.open')}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            maxFontSizeMultiplier={1.4}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
          />
          {searching ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('search.clear')}
              onPress={() => setQuery('')}
              hitSlop={spacing.md}
            >
              <Icon name="close" size={18} color="textMuted" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[contentColumn, styles.content]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {!searching ? (
          <Text color="textSecondary">{t('search.hint')}</Text>
        ) : results.length === 0 ? (
          <Text color="textSecondary">{t('search.none', { query: query.trim() })}</Text>
        ) : (
          <>
            <SectionHeader
              title={
                results.length === 1
                  ? t('search.count.one')
                  : t('search.count.other', { count: formatNumber(results.length) })
              }
            />
            <Card style={styles.list}>
              {shown.map((entry, index) => (
                <EntryRow key={entry.id} entry={entry} last={index === shown.length - 1} />
              ))}
            </Card>
            {results.length > SHOWN ? (
              <Text variant="small" color="textSecondary" style={styles.more}>
                {t('search.more', { count: formatNumber(SHOWN) })}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  // The app's text field, with the glass inside it instead of a label above.
  field: {
    flex: 1,
    minHeight: sizes.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  list: {
    paddingVertical: spacing.xs,
  },
  more: {
    marginTop: spacing.md,
  },
});
