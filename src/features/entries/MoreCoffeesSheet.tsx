import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, CupMark, SectionHeader, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { colors, contentColumn, radii, sizes, spacing, themed } from '@/theme';

import { moreCoffees } from './moreCoffees';

type MoreCoffeesSheetProps = {
  visible: boolean;
  // The coffee chosen so far, or empty.
  value: string;
  // Called when the sheet is closed, with the coffee it was left on. Empty
  // means none: nothing was picked, or what had been picked was cleared.
  onDone: (name: string) => void;
};

// What "Other" opens: a longer list of coffees and a field for anything that
// is not on it. It stays open while the user looks around and closes when
// they say so; however it is closed, the coffee showing at the top is kept.
export function MoreCoffeesSheet({ visible, value, onDone }: MoreCoffeesSheetProps) {
  // Mounted with the sheet, so each opening starts from the form's value.
  return visible ? <Sheet value={value} onDone={onDone} /> : null;
}

function Sheet({ value, onDone }: Omit<MoreCoffeesSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  // One value for both ways in: tapping a coffee writes its name here.
  const [text, setText] = useState(value);
  const typed = text.trim();
  const done = () => onDone(typed);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={done}>
      {/* An iOS sheet starts below the status bar by itself; Android's fills the screen. */}
      <View style={[styles.root, Platform.OS === 'android' && { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={[contentColumn, styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="title" accessibilityRole="header" numberOfLines={1} style={styles.title}>
              {t('entry.more.title')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={done}
              hitSlop={spacing.sm}
              style={({ pressed }) => [styles.done, pressed && styles.donePressed]}
            >
              <Text variant="label" color="textOnAccent">
                {t('common.done')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.preview}>
            <CupMark drink={typed} size={76} />
            <View style={styles.previewText}>
              <Text variant="heading" numberOfLines={2}>
                {typed || t('coffeeTypes.other')}
              </Text>
              <Text variant="small" color="accentPressed">
                {t('entry.more.hint')}
              </Text>
            </View>
          </View>

          <TextField
            label={t('entry.type.customLabel')}
            placeholder={t('entry.type.customPlaceholder')}
            value={text}
            onChangeText={setText}
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={40}
          />

          {moreCoffees.map((group) => (
            <View key={group.title}>
              <SectionHeader title={t(group.title)} />
              <View style={styles.chips}>
                {group.names.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={name === typed}
                    onPress={() => setText(name === typed ? '' : name)}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = themed(() => ({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  title: {
    flexShrink: 1,
  },
  done: {
    height: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donePressed: {
    backgroundColor: colors.accentPressed,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
  },
  previewText: {
    flex: 1,
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
}));
