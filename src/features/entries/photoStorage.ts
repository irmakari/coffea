import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

const BUCKET = 'coffee-photos';
const LINK_LIFETIME_SECONDS = 60 * 60 * 24;

export function isLocalPhoto(uri: string | null): uri is string {
  return uri !== null && !uri.startsWith('http');
}

// Stores a picked photo in the user's own folder. `pickPhoto` has already
// made it small. Resolves to the storage path that is saved on the entry.
export async function uploadPhoto(userId: string, localUri: string): Promise<string> {
  const file = await fetch(localUri);
  const body = await file.arrayBuffer();

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

// A coffee's photo as stored: the picture itself and, when one could be
// made, a smaller copy for the friends feed.
export type StoredPhoto = {
  path: string;
  thumbPath: string | null;
};

// The width of the feed's copy: sharp across a phone, a fraction of the
// download.
const THUMB_WIDTH = 800;

// Resolves to null for a photo already this small, which the feed can show
// as it is.
async function uploadThumbnail(userId: string, localUri: string): Promise<string | null> {
  const original = await ImageManipulator.manipulate(localUri).renderAsync();
  const small = original.width <= THUMB_WIDTH;
  original.release();
  if (small) return null;

  const context = ImageManipulator.manipulate(localUri).resize({ width: THUMB_WIDTH, height: null });
  const rendered = await context.renderAsync();
  try {
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
    return await uploadPhoto(userId, saved.uri);
  } finally {
    rendered.release();
    context.release();
  }
}

// Uploads a coffee's photo with its feed copy. The copy is a nicety: if it
// fails the photo is still stored, and the feed shows the full picture.
async function uploadCoffeePhoto(userId: string, localUri: string): Promise<StoredPhoto> {
  const [full, thumb] = await Promise.allSettled([uploadPhoto(userId, localUri), uploadThumbnail(userId, localUri)]);
  const thumbPath = thumb.status === 'fulfilled' ? thumb.value : null;
  if (full.status === 'rejected') {
    if (thumbPath) await removePhoto(thumbPath);
    throw full.reason;
  }
  return { path: full.value, thumbPath };
}

// Uploads begun the moment a photo was picked, by the file they came from.
// The rest of the form is filled in meanwhile, so saving rarely has to wait.
const early = new Map<string, Promise<StoredPhoto>>();

export function startUpload(userId: string, localUri: string) {
  if (early.has(localUri)) return;
  const upload = uploadCoffeePhoto(userId, localUri);
  // A failure is dealt with in `finishUpload`, which tries once more.
  upload.catch(() => {});
  early.set(localUri, upload);
}

// Resolves to where a picked photo is stored, uploading it now if it was
// not started early or that attempt failed.
export async function finishUpload(userId: string, localUri: string): Promise<StoredPhoto> {
  const upload = early.get(localUri);
  early.delete(localUri);
  if (upload) {
    try {
      return await upload;
    } catch {
      // Fall through to a fresh attempt.
    }
  }
  return uploadCoffeePhoto(userId, localUri);
}

// For a photo that was picked and then replaced, removed or never saved.
export function cancelUpload(localUri: string) {
  const upload = early.get(localUri);
  if (!upload) return;
  early.delete(localUri);
  upload.then(removeCoffeePhoto, () => {});
}

// Best effort: a photo left behind is harmless, so failures are not surfaced.
export async function removePhoto(path: string): Promise<void> {
  await supabase.storage
    .from(BUCKET)
    .remove([path])
    .catch(() => {});
}

// A coffee's photo and its feed copy, together.
export async function removeCoffeePhoto(photo: StoredPhoto): Promise<void> {
  await supabase.storage
    .from(BUCKET)
    .remove(photo.thumbPath ? [photo.path, photo.thumbPath] : [photo.path])
    .catch(() => {});
}

// Empties the user's folder, for an account that is being deleted. Unlike
// `removePhoto` this reports failure: the account must not go while its
// photos stay behind.
export async function removeAllPhotos(userId: string): Promise<void> {
  const bucket = supabase.storage.from(BUCKET);
  // Each pass lists what is left, so there is no page to keep track of.
  for (;;) {
    const { data, error } = await bucket.list(userId, { limit: 100 });
    if (error) throw error;
    if (data.length === 0) return;
    const { error: removeError } = await bucket.remove(data.map((file) => `${userId}/${file.name}`));
    if (removeError) throw removeError;
  }
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
