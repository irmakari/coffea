import { albumSlots } from '@/features/album/album';
import { createPhotoLinks } from '@/features/entries/photoStorage';
import type { Entry } from '@/features/entries/types';
import { supabase } from '@/lib/supabase';

import type { Person } from './friendsApi';

type Face = Pick<Person, 'id' | 'username' | 'displayName' | 'avatarPath' | 'avatarUrl'>;

// One coffee a friend logged, as friends see it: what it was, how it was
// served, their note and the sticker cut from its photo. Never the photo
// itself, café or price.
export type LoggedCoffee = {
  id: string;
  person: Face;
  name: string;
  type: string | null;
  milk: string | null;
  size: string | null;
  shots: number | null;
  temperature: string | null;
  venue: string | null;
  rating: number | null;
  // As they wrote it. Missing until the server shares notes.
  notes: string | null;
  consumedAt: string;
  // Set when this was their first of an album coffee: its number in their album.
  albumNumber: number | null;
  // A friend's sticker, as stored and a temporary link to it.
  stickerPath: string | null;
  stickerUrl: string | null;
  // The user's own photo, which their sticker is cut from on this phone.
  photo: { url: string; path: string } | null;
};

type Row = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  coffee_name: string;
  coffee_type: string | null;
  milk: string | null;
  size: string | null;
  shots: number | null;
  temperature: string | null;
  venue: string | null;
  rating: number | null;
  notes?: string | null;
  sticker_path?: string | null;
  consumed_at: string;
  album_number: number | null;
};

// How many of friends' coffees the list loads.
export const LOG_PAGE_SIZE = 60;
export const LOG_DAYS = 30;

// Friends' coffees of the last 30 days, newest first.
export async function fetchFriendsLog(pageSize = LOG_PAGE_SIZE): Promise<LoggedCoffee[]> {
  const catalog = albumSlots().map((slot) => slot.value.toLowerCase());
  const { data, error } = await supabase.rpc('friends_log', { catalog, page_size: pageSize });
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const paths = [
    ...new Set(
      rows.flatMap((row) => [row.avatar_path, row.sticker_path ?? null].filter((path) => path !== null)),
    ),
  ];
  const links = await createPhotoLinks(paths).catch(() => new Map<string, string>());
  return rows.map((row) => ({
    id: row.id,
    person: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarPath: row.avatar_path,
      avatarUrl: (row.avatar_path && links.get(row.avatar_path)) || null,
    },
    name: row.coffee_name,
    type: row.coffee_type,
    milk: row.milk,
    size: row.size,
    shots: row.shots,
    temperature: row.temperature,
    venue: row.venue,
    rating: row.rating,
    notes: row.notes?.trim() || null,
    consumedAt: row.consumed_at,
    albumNumber: row.album_number,
    stickerPath: row.sticker_path ?? null,
    stickerUrl: (row.sticker_path && links.get(row.sticker_path)) || null,
    photo: null,
  }));
}

// The user's own coffees of the last 30 days, newest first, in the shape
// friends' come in. Album numbers are worked out the way the server does:
// each album kind's first coffee, numbered in the order they were had.
export function ownLog(entries: Entry[], person: Face, now = new Date()): LoggedCoffee[] {
  const catalog = new Set(albumSlots().map((slot) => slot.value.toLowerCase()));
  const had = entries.filter((entry) => new Date(entry.consumedAt) <= now);
  const oldestFirst = [...had].sort(
    (a, b) => a.consumedAt.localeCompare(b.consumedAt) || a.id.localeCompare(b.id),
  );
  const numbers = new Map<string, number>();
  const collected = new Set<string>();
  for (const entry of oldestFirst) {
    const kind = entry.type?.trim().toLowerCase();
    if (!kind || !catalog.has(kind) || collected.has(kind)) continue;
    collected.add(kind);
    numbers.set(entry.id, collected.size);
  }

  const since = now.getTime() - LOG_DAYS * 24 * 60 * 60 * 1000;
  return had
    .filter((entry) => new Date(entry.consumedAt).getTime() > since)
    .sort((a, b) => b.consumedAt.localeCompare(a.consumedAt) || b.id.localeCompare(a.id))
    .map((entry) => ({
      id: entry.id,
      person,
      name: entry.name,
      type: entry.type,
      milk: entry.milk,
      size: entry.size,
      shots: entry.shots,
      temperature: entry.temperature,
      venue: entry.venue,
      rating: entry.rating,
      notes: entry.notes?.trim() || null,
      consumedAt: entry.consumedAt,
      albumNumber: numbers.get(entry.id) ?? null,
      stickerPath: null,
      stickerUrl: null,
      photo: entry.photoUrl && entry.photoPath ? { url: entry.photoUrl, path: entry.photoPath } : null,
    }));
}

// Friends' coffees and the user's own, newest first. When friends' fill a
// whole page, the user's older than its last are left for later, so the list
// has no stretch where only the user seems to have had coffee.
export function mergeLogs(friends: LoggedCoffee[], own: LoggedCoffee[]): LoggedCoffee[] {
  const at = (coffee: LoggedCoffee) => new Date(coffee.consumedAt).getTime();
  const cutoff = friends.length >= LOG_PAGE_SIZE ? at(friends[friends.length - 1]) : null;
  const mine = cutoff === null ? own : own.filter((coffee) => at(coffee) >= cutoff);
  return [...friends, ...mine].sort((a, b) => at(b) - at(a));
}

// One friend's coffees on one day, as the list shows them: newest first.
export type LogGroup = {
  key: string;
  person: Face;
  coffees: LoggedCoffee[];
};

function dayOf(iso: string) {
  const at = new Date(iso);
  return `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;
}

// Runs of one friend's coffees on one day are gathered into a single line,
// so someone on their fifth cup does not fill the list.
export function groupLog(coffees: LoggedCoffee[]): LogGroup[] {
  const groups: LogGroup[] = [];
  const byKey = new Map<string, LogGroup>();
  for (const coffee of coffees) {
    const key = `${coffee.person.id}:${dayOf(coffee.consumedAt)}`;
    const group = byKey.get(key);
    if (group) {
      group.coffees.push(coffee);
    } else {
      const fresh = { key, person: coffee.person, coffees: [coffee] };
      byKey.set(key, fresh);
      groups.push(fresh);
    }
  }
  return groups;
}
