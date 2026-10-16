import { ActionSheetIOS, Platform } from 'react-native';

import { showAlert } from '@/components/ui';
import { t } from '@/i18n';

type Action = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

// A short menu of things to do with someone. iOS asks in its own sheet,
// Android in a dialog. That holds three buttons, so with three actions
// tapping outside it is the way to back out.
export function showActions(title: string, actions: Action[]) {
  const cancel = t('common.cancel');

  if (Platform.OS === 'ios') {
    const options = [...actions.map((action) => action.label), cancel];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options,
        cancelButtonIndex: actions.length,
        destructiveButtonIndex: actions.flatMap((action, index) => (action.destructive ? [index] : [])),
      },
      (index) => actions[index]?.onPress(),
    );
    return;
  }
  showAlert(
    title,
    undefined,
    [
      ...(actions.length < 3 ? [{ text: cancel, style: 'cancel' as const }] : []),
      ...actions.map((action) => ({
        text: action.label,
        style: action.destructive ? ('destructive' as const) : ('default' as const),
        onPress: action.onPress,
      })),
    ],
    { cancelable: true },
  );
}

// Asks before something that cannot be quietly taken back.
export function confirm(title: string, body: string | undefined, label: string, onConfirm: () => void) {
  showAlert(title, body, [
    { text: t('common.cancel'), style: 'cancel' },
    { text: label, style: 'destructive', onPress: onConfirm },
  ]);
}
