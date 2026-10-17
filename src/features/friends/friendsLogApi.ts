import { albumSlots } from '@/features/album/album';
import { createPhotoLinks } from '@/features/entries/photoStorage';
import { supabase } from '@/lib/supabase';

import type { Person } from './friendsApi';

type Face = Pick<Person, 'id' | 'username' | 'displayName' | 'avatarPath' | 'avatarUrl'>;

// One coffee a friend logged, as friends see it: what it was, how it was
// served and their note. Never the photo, café or price.
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
  consumed_at: string;
  album_number: number | null;
};

// Friends' coffees of the last 30 days, newest first.
export async function fetchFriendsLog(pageSize = 60): Promise<LoggedCoffee[]> {
  const catalog = albumSlots().map((slot) => slot.value.toLowerCase());
  const { data, error } = await supabase.rpc('friends_log', { catalog, page_size: pageSize });
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const paths = [...new Set(rows.flatMap((row) => (row.avatar_path ? [row.avatar_path] : [])))];
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
  }));
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
