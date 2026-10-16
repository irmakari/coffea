import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, contentColumn, spacing, themed } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  // Screens that manage their own gutters (forms with a pinned footer) opt out.
  padded?: boolean;
  // Tab screens sit above the tab bar, which handles the bottom inset itself.
  edges?: Edge[];
  contentStyle?: ViewStyle;
  // Makes a scrolling screen reload when it is pulled down.
  onRefresh?: () => Promise<unknown>;
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  onRefresh,
}: ScreenProps) {
  const padding = padded && styles.padded;
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[contentColumn, padding, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[contentColumn, padding, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = themed(() => ({
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
}));
