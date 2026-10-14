import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { t } from '@/i18n';

import type { PhotoSource } from './pickPhoto';

// Asks where a photo should come from: the camera, for what is in front of
// you, or the library. With `onRemove` it also offers to take the current
// photo away. iOS asks in its own sheet, Android in a dialog.
export function askPhotoSource(title: string, onChoose: (source: PhotoSource) => void, onRemove?: () => void) {
  const take = t('entry.photo.take');
  const library = t('entry.photo.library');
  const remove = t('entry.photo.remove');
  const cancel = t('common.cancel');

  if (Platform.OS === 'ios') {
    const options = [take, library, ...(onRemove ? [remove] : []), cancel];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: onRemove ? 2 : undefined,
      },
      (index) => {
        if (index === 0) onChoose('camera');
        if (index === 1) onChoose('library');
        if (index === 2) onRemove?.();
      },
    );
    return;
  }
  Alert.alert(
    title,
    undefined,
    [
      // An Android dialog holds three buttons. When removing is one of them,
      // tapping outside the dialog is the way to back out.
      onRemove ? { text: remove, style: 'destructive', onPress: onRemove } : { text: cancel, style: 'cancel' },
      { text: library, onPress: () => onChoose('library') },
      { text: take, onPress: () => onChoose('camera') },
    ],
    { cancelable: true },
  );
}
