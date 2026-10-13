import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CoffeePhoto, CupMark, Icon, Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, photoRatio, radii, sizes, spacing } from '@/theme';

import { pickPhoto } from './pickPhoto';

type PhotoFieldProps = {
  uri: string | null;
  onChange: (uri: string | null) => void;
  // The chosen coffee type, previewed as the drawing used when no photo is added.
  drink?: string | null;
};

export function PhotoField({ uri, onChange, drink }: PhotoFieldProps) {
  const [failed, setFailed] = useState(false);

  const choose = async () => {
    setFailed(false);
    try {
      const picked = await pickPhoto();
      if (picked) onChange(picked);
    } catch {
      setFailed(true);
    }
  };

  return (
    <View style={styles.container}>
      {uri ? (
        <View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('entry.photo.change')} onPress={choose}>
            <CoffeePhoto uri={uri} ratio="landscape" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('entry.photo.remove')}
            onPress={() => onChange(null)}
            hitSlop={spacing.md}
            style={styles.remove}
          >
            <Icon name="close" size={16} color="textOnAccent" strokeWidth={2} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('entry.photo.add')}
          onPress={choose}
          style={({ pressed }) => [
            styles.empty,
            drink && styles.emptyDrawn,
            pressed && (drink ? styles.emptyDrawnPressed : styles.emptyPressed),
          ]}
        >
          {drink ? (
            <CupMark drink={drink} size={88} />
          ) : (
            <Icon name="photo" size={28} color="textSecondary" strokeWidth={1.25} />
          )}
          <View style={styles.emptyText}>
            <Text variant="bodyStrong">{t('entry.photo.add')}</Text>
            <Text variant="caption" color={drink ? 'accentPressed' : 'textMuted'}>
              {drink ? t('entry.photo.fallback') : t('common.optional')}
            </Text>
          </View>
        </Pressable>
      )}
      {failed ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {t('entry.photo.error')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  empty: {
    aspectRatio: photoRatio.landscape * 1.6,
    borderRadius: radii.frame,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyPressed: {
    backgroundColor: colors.surfacePressed,
  },
  emptyDrawn: {
    backgroundColor: colors.highlight,
  },
  emptyDrawnPressed: {
    opacity: 0.8,
  },
  emptyText: {
    alignItems: 'center',
    gap: 2,
  },
  remove: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: sizes.hairline,
    borderColor: colors.textOnAccent,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
