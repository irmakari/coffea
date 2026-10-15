import { supabase } from '@/lib/supabase';

import { createPhotoLinks, finishUpload, isLocalPhoto, removeCoffeePhoto, type StoredPhoto } from './photoStorage';
import { parsePrice, recognizeType, takesMilk, type Entry, type EntryDraft } from './types';

const COLUMNS =
  'id, coffee_name, coffee_type, milk, cafe_name, photo_path, photo_thumb_path, consumed_at, price, currency, rating, notes, is_favorite, is_shared';

type EntryRow = {
  id: string;
  coffee_name: string;
  coffee_type: string | null;
  milk: string | null;
  cafe_name: string | null;
  photo_path: string | null;
  photo_thumb_path: string | null;
  consumed_at: string;
  price: number | string | null;
  currency: string | null;
  rating: number | null;
  notes: string | null;
  is_favorite: boolean;
  is_shared: boolean;
};

function toEntry(row: EntryRow, photoUrl: string | null): Entry {
  return {
    id: row.id,
    name: row.coffee_name,
    type: recognizeType(row.coffee_type),
    milk: row.milk,
    cafe: row.cafe_name,
    photoPath: row.photo_path,
    photoUrl,
    photoThumbPath: row.photo_thumb_path,
    consumedAt: row.consumed_at,
    // The API may send a decimal column as text; the app always works in numbers.
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    rating: row.rating,
    notes: row.notes,
    isFavorite: row.is_favorite,
    isShared: row.is_shared,
  };
}

function blankToNull(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

// The optional fields a draft maps onto. A predefined type is stored by its
// key so it can be translated; "other" stores the user's own words.
function fieldsFromDraft(draft: EntryDraft) {
  const price = parsePrice(draft.price);
  if (Number.isNaN(price)) throw new Error('Invalid price');

  return {
    coffee_name: draft.name.trim(),
    coffee_type: draft.type === 'other' ? (recognizeType(blankToNull(draft.customType)) ?? 'other') : draft.type,
    // A milk chosen before switching to a type without any is dropped.
    milk: takesMilk(draft.type) ? draft.milk : null,
    cafe_name: blankToNull(draft.cafe),
    rating: draft.rating,
    price,
    // A currency is only meaningful beside a price.
    currency: price === null ? null : draft.currency,
    notes: blankToNull(draft.notes),
    is_shared: draft.isShared,
    // Left out when unset so the database stamps the entry with "now".
    ...(draft.consumedAt ? { consumed_at: draft.consumedAt } : {}),
  };
}

// A photo that was just picked is shown from the device, so it appears at
// once instead of waiting for the upload to be fetched back.
async function withPhotoLink(row: EntryRow, localUri?: string | null): Promise<Entry> {
  if (!row.photo_path) return toEntry(row, null);
  if (localUri) return toEntry(row, localUri);
  const links = await createPhotoLinks([row.photo_path]);
  return toEntry(row, links.get(row.photo_path) ?? null);
}

// Newest first. Row Level Security limits this to the signed-in user's rows.
export async function fetchEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('coffee_entries')
    .select(COLUMNS)
    .order('consumed_at', { ascending: false })
    .returns<EntryRow[]>();
  if (error) throw error;

  const paths = data.flatMap((row) => (row.photo_path ? [row.photo_path] : []));
  const links = await createPhotoLinks(paths);
  return data.map((row) => toEntry(row, row.photo_path ? (links.get(row.photo_path) ?? null) : null));
}

function photoColumns(photo: StoredPhoto | null) {
  return { photo_path: photo?.path ?? null, photo_thumb_path: photo?.thumbPath ?? null };
}

function storedPhoto(entry: Entry): StoredPhoto | null {
  return entry.photoPath ? { path: entry.photoPath, thumbPath: entry.photoThumbPath } : null;
}

export async function createEntry(userId: string, draft: EntryDraft): Promise<Entry> {
  const photo = isLocalPhoto(draft.photoUri) ? await finishUpload(userId, draft.photoUri) : null;

  const { data, error } = await supabase
    .from('coffee_entries')
    .insert({ ...fieldsFromDraft(draft), ...photoColumns(photo) })
    .select(COLUMNS)
    .single<EntryRow>();
  if (error) {
    if (photo) await removeCoffeePhoto(photo);
    throw error;
  }
  return withPhotoLink(data, draft.photoUri);
}

export async function updateEntry(userId: string, entry: Entry, draft: EntryDraft): Promise<Entry> {
  // The photo is replaced when a new file was picked, cleared when it was
  // removed in the form, and otherwise left alone.
  const previous = storedPhoto(entry);
  let photo = previous;
  const pickedNewPhoto = isLocalPhoto(draft.photoUri) && draft.photoUri !== entry.photoUrl;
  if (pickedNewPhoto) {
    photo = await finishUpload(userId, draft.photoUri as string);
  } else if (draft.photoUri === null) {
    photo = null;
  }

  const { data, error } = await supabase
    .from('coffee_entries')
    .update({ ...fieldsFromDraft(draft), ...photoColumns(photo) })
    .eq('id', entry.id)
    .select(COLUMNS)
    .single<EntryRow>();
  if (error) {
    if (photo && photo !== previous) await removeCoffeePhoto(photo);
    throw error;
  }

  if (previous && previous !== photo) await removeCoffeePhoto(previous);
  // Keep showing whatever the form was showing; it is the same picture.
  return withPhotoLink(data, draft.photoUri);
}

export async function setEntryFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase.from('coffee_entries').update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(entry: Entry): Promise<void> {
  const { error } = await supabase.from('coffee_entries').delete().eq('id', entry.id);
  if (error) throw error;
  const photo = storedPhoto(entry);
  if (photo) await removeCoffeePhoto(photo);
}
