import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { PixelRatio, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

// The size stories are displayed at.
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

// Renders the card to a PNG and hands it to the system share sheet.
// Resolves to false when this device has no way to share a file.
export async function shareCard(card: RefObject<View | null>): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;

  const scale = PixelRatio.get();
  const uri = await captureRef(card, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: EXPORT_WIDTH / scale,
    height: EXPORT_HEIGHT / scale,
  });

  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
  return true;
}
