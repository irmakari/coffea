import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CupMark, SectionHeader, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';
import { colors, contentColumn, radii, sizes, spacing, themed } from '@/theme';

import { moreCoffees } from './moreCoffees';

// Four coffees to a row, each drawn this big.
const COLUMNS = 4;
const TILE_CUP = 60;

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
              {/* Each coffee drawn, with its name under it, so they can be told apart at a glance. */}
              <View style={styles.grid}>
                {group.names.map((name) => {
                  const selected = name === typed;
                  return (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      accessibilityLabel={name}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        tapFeedback();
                        setText(selected ? '' : name);
                      }}
                      style={styles.cell}
                    >
                      {({ pressed }) => (
                        <View style={[styles.tile, selected && styles.tileSelected, pressed && styles.tilePressed]}>
                          <CupMark drink={name} size={TILE_CUP} />
                          <Text
                            variant="caption"
                            color={selected ? 'text' : 'textSecondary'}
                            align="center"
                            numberOfLines={2}
                            style={styles.tileName}
                          >
                            {name}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    rowGap: spacing.sm,
  },
  cell: {
    width: `${100 / COLUMNS}%`,
    paddingHorizontal: spacing.xs,
  },
  tile: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tileSelected: {
    backgroundColor: colors.highlight,
    borderColor: colors.accent,
  },
  tilePressed: {
    opacity: 0.6,
  },
  tileName: {
    minHeight: 32,
  },
}));
