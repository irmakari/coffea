import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { CupMark, Icon, Text } from '@/components/ui';
import { startLog } from '@/features/entries/logDraft';
import { coffeeLabel, useFavoriteCoffee } from '@/features/profile/favoriteCoffee';
import { t } from '@/i18n';
import { spacing, themed } from '@/theme';

// The row's picture, the size of an entry row's.
const FACE = 52;

// Nothing logged yet today: one row, laid out like the coffees that will
// fill the list, offering the favorite in one tap.
export function TodayInvite() {
  const favorite = useFavoriteCoffee();
  const coffee = favorite ? coffeeLabel(favorite) : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (favorite ? startLog({ drink: favorite }) : router.push('/log'))}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.face}>
        <CupMark drink={favorite} size={FACE} />
      </View>
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {coffee ? t('home.today.invite', { coffee }) : t('home.today.inviteAny')}
        </Text>
      </View>
      <Icon name="chevronRight" size={16} color="textMuted" />
    </Pressable>
  );
}

const styles = themed(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  // Faded, as a coffee not had yet.
  face: {
    width: FACE,
    height: FACE,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  text: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
}));
