import { router } from 'expo-router';
import { Alert } from 'react-native';

import { t } from '@/i18n';

// Whether the log tab holds a coffee that was started and not yet saved.
let dirty = false;

export function setLogDraftDirty(value: boolean) {
  dirty = value;
}

export function isLogDraftDirty() {
  return dirty;
}

type LogStart = {
  // A coffee type key, or the name of one of the other coffees.
  drink?: string;
  day?: Date;
  // A coffee's own name and where it was had, as the bucket list knows them.
  name?: string;
  cafe?: string;
};

// Opens the log tab on a form that already knows some of the coffee. That
// starts the form afresh, so a coffee that is half filled in is asked about
// first. `onSettled` runs once the answer is in, either way.
export function startLog(start: LogStart, onSettled?: () => void) {
  const open = () => {
    onSettled?.();
    router.navigate({
      pathname: '/log',
      params: {
        // Always sent, so one start never inherits the other's leftovers.
        drink: start.drink ?? '',
        day: start.day ? String(start.day.getTime()) : '',
        name: start.name ?? '',
        cafe: start.cafe ?? '',
        // The time tells one start from the next, so choosing the same
        // coffee twice fills the form in twice.
        at: String(Date.now()),
      },
    });
  };
  if (!dirty) {
    open();
    return;
  }
  Alert.alert(t('quickLog.replace.title'), t('quickLog.replace.body'), [
    { text: t('common.discard.keep'), style: 'cancel', onPress: onSettled },
    { text: t('quickLog.replace.confirm'), style: 'destructive', onPress: open },
  ]);
}
