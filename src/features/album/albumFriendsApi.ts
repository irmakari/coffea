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

export async function fetchActivity(): Promise<Activity[]> {
  const { data, error } = await supabase.rpc('friends_activity', { catalog: catalog(), max_items: 30 });
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
