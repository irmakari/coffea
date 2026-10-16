import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CupMark, SectionHeader, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, contentColumn, radii, spacing, themed } from '@/theme';

import { moreCoffees } from './moreCoffees';
import { coffeeTypes } from './types';

const COLUMNS = 3;

type Coffee = { drink: string; label: string };

function inRows(coffees: Coffee[]): Coffee[][] {
  const rows: Coffee[][] = [];
  for (let index = 0; index < coffees.length; index += COLUMNS) rows.push(coffees.slice(index, index + COLUMNS));
  return rows;
}

type QuickLogPickerProps = {
  visible: boolean;
  // A coffee type key, or the name of one of the other coffees.
  onPick: (drink: string) => void;
  onClose: () => void;
};

function Grid({ coffees, cup, onPick }: { coffees: Coffee[]; cup: number; onPick: (drink: string) => void }) {
  return (
    <View style={styles.grid}>
      {inRows(coffees).map((row) => (
        <View key={row[0].drink} style={styles.row}>
          {row.map(({ drink, label }) => (
            <Pressable
              key={drink}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => onPick(drink)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <View style={styles.tile}>
                <CupMark drink={drink} size={cup} />
              </View>
              <Text variant="label" align="center" numberOfLines={3}>
                {label}
              </Text>
            </Pressable>
          ))}
          {/* Keeps the coffees of a short last row the same width as the rest. */}
          {Array.from({ length: COLUMNS - row.length }, (_, index) => (
            <View key={index} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

// How far, or how fast, the sheet has to be pulled down to let go of it.
const CLOSE_DISTANCE = 120;
const CLOSE_SPEED = 0.8;

// Opens from a long press on the tab bar's cup: every coffee the app knows,
// drawn, to start a new entry with one tap. A sheet over the lower part of
// the screen, closed by pulling it down or tapping above it.
export function QuickLogPicker({ visible, onPick, onClose }: QuickLogPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* Mounted with the modal, so the sheet rises afresh each time. */}
      <Sheet onPick={onPick} onClose={onClose} />
    </Modal>
  );
}

function Sheet({ onPick, onClose }: Omit<QuickLogPickerProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // The drawing is sized to its tile, which takes a third of the sheet.
  const column = Math.min(width, contentColumn.maxWidth) - spacing.screen * 2;
  const cup = Math.round(((column - spacing.md * (COLUMNS - 1)) / COLUMNS) * 0.7);

  // "Other" is the way into the longer list, which is shown here in full.
  const types = coffeeTypes
    .filter((type) => type !== 'other')
    .map((type) => ({ drink: type, label: t(`coffeeTypes.${type}`) }));

  // How far the sheet sits below its resting place. It starts off screen.
  const [offset] = useState(() => new Animated.Value(height));

  const settle = useCallback(() => {
    Animated.spring(offset, { toValue: 0, bounciness: 0, useNativeDriver: true }).start();
  }, [offset]);

  const dismiss = useCallback(() => {
    Animated.timing(offset, { toValue: height, duration: 200, useNativeDriver: true }).start(() => onClose());
  }, [offset, height, onClose]);

  useEffect(settle, [settle]);

  // Only the top of the sheet is a handle; the list below it scrolls.
  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_event, gesture) => offset.setValue(Math.max(0, gesture.dy)),
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > CLOSE_DISTANCE || gesture.vy > CLOSE_SPEED) {
            dismiss();
          } else {
            settle();
          }
        },
        onPanResponderTerminate: settle,
      }),
    [offset, dismiss, settle],
  );

  return (
    <>
      <Pressable
        accessibilityLabel={t('common.close')}
        onPress={dismiss}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      />
      <Animated.View style={[styles.sheet, { maxHeight: height * 0.82, transform: [{ translateY: offset }] }]}>
        <View style={styles.handle} {...drag.panHandlers}>
          <View style={styles.grabber} />
          <View style={[contentColumn, styles.heading]}>
            <Text variant="title" accessibilityRole="header">
              {t('quickLog.title')}
            </Text>
            <Text color="textSecondary">{t('quickLog.body')}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[contentColumn, styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Grid coffees={types} cup={cup} onPick={onPick} />

          {moreCoffees.map((group) => (
            <View key={group.title}>
              <SectionHeader title={t(group.title)} />
              <Grid coffees={group.names.map((name) => ({ drink: name, label: name }))} cup={cup} onPick={onPick} />
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = themed(() => ({
  backdrop: {
    backgroundColor: colors.accent,
    opacity: 0.35,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.frame + 6,
    borderTopRightRadius: radii.frame + 6,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  handle: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
  },
  heading: {
    paddingHorizontal: spacing.screen,
    gap: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xs,
    gap: spacing.xl + 4,
  },
  grid: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.6,
  },
  tile: {
    aspectRatio: 1,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
