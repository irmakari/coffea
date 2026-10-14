import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';

import { t } from '@/i18n';

// Asks before a screen with unsaved changes is left, whichever way that
// happens: its own back or close button, a swipe, or the system's back.
// Returns a function to call just before leaving on purpose, after a save
// or a delete, so that leaving is not questioned.
export function useDiscardGuard(dirty: boolean) {
  const navigation = useNavigation();
  const leaving = useRef(false);

  usePreventRemove(dirty, ({ data }) => {
    if (leaving.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(t('common.discard.title'), t('common.discard.body'), [
      { text: t('common.discard.keep'), style: 'cancel' },
      {
        text: t('common.discard.confirm'),
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  return useCallback(() => {
    leaving.current = true;
  }, []);
}
