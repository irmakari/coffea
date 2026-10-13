import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, sizes, spacing } from '@/theme';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  // The quiet line at the bottom that leads to the other auth screen.
  footer?: { prompt: string; action: string; href: Href };
};

export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="heading">{t('brand.name')}</Text>

          <View style={styles.intro}>
            <Text variant="display" accessibilityRole="header">
              {title}
            </Text>
            <Text color="textSecondary">{subtitle}</Text>
          </View>

          <View style={styles.form}>{children}</View>

          {footer ? (
            <View style={styles.footer}>
              <Text variant="small" color="textSecondary">
                {footer.prompt}
              </Text>
              <Link href={footer.href} replace style={styles.link}>
                <Text variant="label" style={styles.linkText}>
                  {footer.action}
                </Text>
              </Link>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: spacing.xl,
  },
  intro: {
    marginTop: spacing.xxxl + spacing.lg,
    gap: spacing.sm,
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.xl,
  },
  footer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  link: {
    // Extends the touch target without moving the text off the baseline.
    paddingVertical: (sizes.touch - 18) / 2,
    marginVertical: -(sizes.touch - 18) / 2,
  },
  linkText: {
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
});
