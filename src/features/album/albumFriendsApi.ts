import { createPhotoLinks } from '@/features/entries/photoStorage';
import type { Person } from '@/features/friends/friendsApi';
import type { Ranked } from '@/features/leaderboard/leaderboardApi';
import { supabase } from '@/lib/supabase';

import { albumSlots } from './album';

type Face = Pick<Person, 'id' | 'username' | 'displayName' | 'avatarPath' | 'avatarUrl'>;

// A friend collecting a coffee for the first time.
export type Activity = {
  person: Face;
  // As the journal saved it: a type key or one of the names behind "Other".
  coffee: string;
  collectedAt: string;
  // How many album coffees they had with this one.
  collected: number;
};

type FaceRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
};

// The album as the server counts it: the same coffees, lowercased.
function catalog() {
  return albumSlots().map((slot) => slot.value.toLowerCase());
}

async function withFaces<T extends FaceRow>(rows: T[]): Promise<(T & { face: Face })[]> {
  const paths = [...new Set(rows.flatMap((row) => (row.avatar_path ? [row.avatar_path] : [])))];
  const links = await createPhotoLinks(paths).catch(() => new Map<string, string>());
  return rows.map((row) => ({
    ...row,
    face: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarPath: row.avatar_path,
      avatarUrl: (row.avatar_path && links.get(row.avatar_path)) || null,
    },
  }));
}

// The user and their friends by album coffees collected, most first. Equal
// counts share a place: 1, 2, 2, 4.
export async function fetchAlbumBoard(nameOf: (face: Face) => string): Promise<Ranked[]> {
  const { data, error } = await supabase.rpc('friends_album', { catalog: catalog() });
  if (error) throw error;
  const rows = await withFaces((data ?? []) as (FaceRow & { collected: number })[]);
  const sorted = rows.sort((a, b) => b.collected - a.collected || nameOf(a.face).localeCompare(nameOf(b.face)));
  return sorted.map((row) => ({
    ...row.face,
    // The weekly figures do not apply here.
    cups: 0,
    days: 0,
    cafes: 0,
    value: row.collected,
    rank: sorted.findIndex((other) => other.collected === row.collected) + 1,
  }));
}

// Friends' firsts of the last 30 days, newest first. The server sends at
// most 100.
export async function fetchActivity(maxItems = 30): Promise<Activity[]> {
  const { data, error } = await supabase.rpc('friends_activity', { catalog: catalog(), max_items: maxItems });
  if (error) throw error;
  const rows = await withFaces(
    (data ?? []) as (FaceRow & { coffee_type: string; collected_at: string; collected: number })[],
  );
  return rows.map((row) => ({
    person: row.face,
    coffee: row.coffee_type,
    collectedAt: row.collected_at,
    collected: row.collected,
  }));
}

// One friend's collected album coffees, each with when it was first had.
export type Collected = { coffee: string; collectedAt: string };

export async function fetchFriendAlbum(friend: string): Promise<Collected[]> {
  const { data, error } = await supabase.rpc('friend_album', { friend, catalog: catalog() });
  if (error) throw error;
  return ((data ?? []) as { coffee_type: string; collected_at: string }[]).map((row) => ({
    coffee: row.coffee_type,
    collectedAt: row.collected_at,
  }));
}

// The first time a friend had one album coffee, as they filled it in. Never
// their café, price or photo, which stay with them.
export type FriendCoffee = {
  name: string;
  type: string | null;
  milk: string | null;
  size: string | null;
  shots: number | null;
  temperature: string | null;
  venue: string | null;
  rating: number | null;
  notes: string | null;
  consumedAt: string;
};

type FriendCoffeeRow = {
  coffee_name: string;
  coffee_type: string | null;
  milk: string | null;
  size: string | null;
  shots: number | null;
  temperature: string | null;
  venue: string | null;
  rating: number | null;
  notes?: string | null;
  consumed_at: string;
};

export async function fetchFriendCoffee(friend: string, coffee: string): Promise<FriendCoffee | null> {
  const { data, error } = await supabase.rpc('friend_first_coffee', { friend, coffee });
  if (error) throw error;
  const row = ((data ?? []) as FriendCoffeeRow[])[0];
  if (!row) return null;
  return {
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
  };
}
