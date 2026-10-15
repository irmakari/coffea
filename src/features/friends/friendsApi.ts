import { createPhotoLinks } from '@/features/entries/photoStorage';
import { supabase } from '@/lib/supabase';

// How someone stands with the signed-in user. "outgoing" is a request the
// user sent, "incoming" one they received.
export type Relation = 'friend' | 'incoming' | 'outgoing' | 'none';

// Only what other people may see of a profile.
export type Person = {
  id: string;
  // Missing for someone who has not chosen one yet.
  username: string | null;
  displayName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  relation: Relation;
};

export type Connection = Person & {
  // When the friendship began, or the request was sent.
  since: string;
};

type PersonRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  relation: Relation;
};

type ConnectionRow = PersonRow & { since: string };

type BlockedRow = Omit<PersonRow, 'relation'> & { since: string };

// Rows come back with storage paths; the photos are shown through links.
// A missing link only means initials instead of a photo.
async function withAvatars<T extends { avatar_path: string | null }>(rows: T[]) {
  const paths = rows.flatMap((row) => (row.avatar_path ? [row.avatar_path] : []));
  const links = await createPhotoLinks(paths).catch(() => new Map<string, string>());
  return rows.map((row) => ({ row, avatarUrl: (row.avatar_path && links.get(row.avatar_path)) || null }));
}

function toPerson(row: PersonRow, avatarUrl: string | null): Person {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    avatarUrl,
    relation: row.relation,
  };
}

// The name to show for someone, falling back to their username.
export function personName(person: Pick<Person, 'displayName' | 'username'>) {
  return person.displayName ?? (person.username ? `@${person.username}` : '');
}

// Friends and open requests both ways, most recent first.
export async function fetchConnections(): Promise<Connection[]> {
  const { data, error } = await supabase.rpc('list_connections');
  if (error) throw error;
  return (await withAvatars((data ?? []) as ConnectionRow[])).map(({ row, avatarUrl }) => ({ ...toPerson(row, avatarUrl), since: row.since }));
}

export async function fetchBlocked(): Promise<Person[]> {
  const { data, error } = await supabase.rpc('list_blocked');
  if (error) throw error;
  return (await withAvatars((data ?? []) as BlockedRow[])).map(({ row, avatarUrl }) => toPerson({ ...row, relation: 'none' }, avatarUrl));
}

// People whose username starts with the query. Fewer than two characters
// finds nobody.
export async function searchPeople(query: string): Promise<Person[]> {
  const { data, error } = await supabase.rpc('search_profiles', { query });
  if (error) throw error;
  return (await withAvatars((data ?? []) as PersonRow[])).map(({ row, avatarUrl }) => toPerson(row, avatarUrl));
}

// The person an invite link names, or null if there is no one to add.
export async function findByUsername(username: string): Promise<Person | null> {
  const { data, error } = await supabase.rpc('get_profile_by_username', { name: username });
  if (error) throw error;
  const [found] = await withAvatars((data ?? []) as PersonRow[]);
  return found ? toPerson(found.row, found.avatarUrl) : null;
}

// Asking someone who already asked you accepts their request.
export async function sendFriendRequest(id: string): Promise<Relation> {
  const { data, error } = await supabase.rpc('send_friend_request', { target: id });
  if (error) throw error;
  return data as Relation;
}

export async function respondToFriendRequest(id: string, accept: boolean): Promise<Relation> {
  const { data, error } = await supabase.rpc('respond_to_friend_request', { from_user: id, accept });
  if (error) throw error;
  return data as Relation;
}

// Unfriends, withdraws a request or declines one.
export async function removeFriend(id: string): Promise<void> {
  const { error } = await supabase.rpc('remove_friend', { other: id });
  if (error) throw error;
}

export async function blockUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { target: id });
  if (error) throw error;
}

export async function unblockUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { target: id });
  if (error) throw error;
}
