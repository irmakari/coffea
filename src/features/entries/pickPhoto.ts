import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// The long edge of a stored photo, in pixels: enough for a full-screen photo
// and a share card, small enough to upload quickly on a phone connection.
const PHOTO_SIZE = 1440;

export type PhotoSource = 'library' | 'camera';

// Thrown when the user has turned the camera down, which only Settings can undo.
export class CameraDeniedError extends Error {}

// The system photo picker needs no permission prompt; the camera asks once.
async function launch(source: PhotoSource) {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new CameraDeniedError();
    return ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  }
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Asking for anything but the original makes the picker re-encode the
    // full-size picture before handing it over, which takes seconds.
    quality: 1,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
  });
}

// Opens the system photo picker or the camera. Resolves to a small JPEG on
// the device, ready to show and to upload, or null if the user backed out.
export async function pickPhoto(size = PHOTO_SIZE, source: PhotoSource = 'library'): Promise<string | null> {
  const result = await launch(source);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  const context = ImageManipulator.manipulate(asset.uri);
  // Only ever scaled down, along whichever edge is longer. The size can be
  // missing, in which case the width is taken as the long edge.
  const longEdge = Math.max(asset.width, asset.height);
  if (longEdge === 0 || longEdge > size) {
    context.resize(asset.height > asset.width ? { height: size } : { width: size });
  }
  const rendered = await context.renderAsync();
  try {
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    return saved.uri;
  } finally {
    // The full-size picture is held in memory until these are let go.
    rendered.release();
    context.release();
  }
}
