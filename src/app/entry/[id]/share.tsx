import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, EmptyState, ModalHeader, Screen, Text } from '@/components/ui';
import { useEntry } from '@/features/entries/EntriesProvider';
import { CARD_RATIO, ShareCard, shareTemplates, type ShareTemplate } from '@/features/share/ShareCard';
import { shareCard } from '@/features/share/shareImage';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

export default function ShareCoffeeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntry(id);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const card = useRef<View>(null);

  const [template, setTemplate] = useState<ShareTemplate>('journal');
  const [sharing, setSharing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!entry) {
    return (
      <Screen padded={false} edges={['top']}>
        <ModalHeader title={t('share.title')} />
        <EmptyState title={t('entry.notFound')} />
      </Screen>
    );
  }

  // The preview is as large as the screen allows once the controls are placed.
  const previewWidth = Math.round(Math.min(width - spacing.xxxl * 2, (height - 420) * CARD_RATIO));

  const share = async () => {
    setFailure(null);
    setSharing(true);
    try {
      const shared = await shareCard(card);
      if (!shared) setFailure(t('share.unavailable'));
    } catch {
      setFailure(t('share.error'));
    }
    setSharing(false);
  };

  return (
    <Screen padded={false} edges={['top']}>
      <ModalHeader title={t('share.title')} />

      <View style={styles.preview}>
        <View style={styles.cardShadow}>
          <ShareCard ref={card} entry={entry} template={template} width={previewWidth} />
        </View>
      </View>

      <View style={styles.templates} accessibilityRole="radiogroup">
        {shareTemplates.map((option) => (
          <Chip
            key={option}
            label={t(`share.templates.${option}`)}
            selected={template === option}
            onPress={() => setTemplate(option)}
          />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {failure ? (
          <Text variant="small" color="danger" align="center" accessibilityLiveRegion="polite">
            {failure}
          </Text>
        ) : null}
        <Button label={t('share.action')} loading={sharing} onPress={share} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The only shadow in the app: it lifts the card off the page so a pale
  // card does not disappear into the background.
  cardShadow: {
    borderRadius: 2,
    backgroundColor: colors.background,
    shadowColor: colors.text,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  templates: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
  },
});
