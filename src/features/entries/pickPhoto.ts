import * as ImagePicker from 'expo-image-picker';

// Opens the system photo picker. Resolves to a local file URI, or null if
// the user backed out. The system picker needs no permission prompt.
export async function pickPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}
