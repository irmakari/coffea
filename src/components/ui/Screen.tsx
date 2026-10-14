import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, contentColumn, spacing } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  // Screens that manage their own gutters (forms with a pinned footer) opt out.
  padded?: boolean;
  // Tab screens sit above the tab bar, which handles the bottom inset itself.
  edges?: Edge[];
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = false, padded = true, edges = ['top'], contentStyle }: ScreenProps) {
  const padding = padded && styles.padded;

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contentColumn, padding, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[contentColumn, padding, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
});
