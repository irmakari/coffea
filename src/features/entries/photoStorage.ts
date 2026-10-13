import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

const BUCKET = 'coffee-photos';
// Wide enough for a full-screen photo and a share card, small enough to
// upload quickly on a phone connection.
const MAX_WIDTH = 1600;
const LINK_LIFETIME_SECONDS = 60 * 60 * 24;

export function isLocalPhoto(uri: string | null): uri is string {
  return uri !== null && !uri.startsWith('http');
}

// Resizes a photo from the device and stores it in the user's own folder.
// Resolves to the storage path that is saved on the entry.
export async function uploadPhoto(userId: string, localUri: string, width = MAX_WIDTH): Promise<string> {
  const context = ImageManipulator.manipulate(localUri);
  context.resize({ width });
  const rendered = await context.renderAsync();
  const resized = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });

  const file = await fetch(resized.uri);
  const body = await file.arrayBuffer();

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

// Best effort: a photo left behind is harmless, so failures are not surfaced.
export async function removePhoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

// The bucket is private, so photos are shown through short-lived links.
export async function createPhotoLinks(paths: string[]): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  if (paths.length === 0) return links;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, LINK_LIFETIME_SECONDS);
  if (error) throw error;
  for (const item of data) {
    if (item.path && item.signedUrl) links.set(item.path, item.signedUrl);
  }
  return links;
}
