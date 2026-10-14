import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

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
  // From opening the picker until the chosen photo is ready to show.
  const [busy, setBusy] = useState(false);

  const choose = async () => {
    if (busy) return;
    setFailed(false);
    setBusy(true);
    try {
      const picked = await pickPhoto();
      if (picked) onChange(picked);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {uri ? (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('entry.photo.change')}
            accessibilityState={{ busy }}
            onPress={choose}
            style={busy && styles.busy}
          >
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
        // The cup is the page's picture until a photograph takes its place,
        // and it turns into the drink as soon as a type is chosen.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('entry.photo.add')}
          accessibilityState={{ busy }}
          onPress={choose}
          style={({ pressed }) => [styles.empty, pressed && styles.emptyPressed]}
        >
          <CupMark drink={drink} size={120} />
          <View style={styles.add}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Icon name="photo" size={18} strokeWidth={1.5} />
            )}
            <Text variant="label">{t('entry.photo.add')}</Text>
          </View>
          {drink ? (
            <Text variant="caption" color="accentPressed">
              {t('entry.photo.fallback')}
            </Text>
          ) : null}
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
  // The same crop as a picked photo, so choosing one does not move the form.
  empty: {
    aspectRatio: photoRatio.landscape,
    borderRadius: radii.frame,
    backgroundColor: colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyPressed: {
    opacity: 0.8,
  },
  add: {
    minHeight: sizes.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  busy: {
    opacity: 0.6,
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
