import { createPhotoLinks } from '@/features/entries/photoStorage';
import { recognizeType } from '@/features/entries/types';
import type { Person } from '@/features/friends/friendsApi';
import { supabase } from '@/lib/supabase';

// A coffee as friends see it: no price, no notes.
export type FeedItem = {
  id: string;
  author: Pick<Person, 'id' | 'username' | 'displayName' | 'avatarPath' | 'avatarUrl'>;
  name: string;
  type: string | null;
  milk: string | null;
  cafe: string | null;
  rating: number | null;
  consumedAt: string;
  // The feed's smaller copy where there is one, else the photo itself.
  photoPath: string | null;
  photoUrl: string | null;
  cheers: number;
  cheered: boolean;
};

type FeedRow = {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  coffee_name: string;
  coffee_type: string | null;
  milk: string | null;
  cafe_name: string | null;
  rating: number | null;
  consumed_at: string;
  photo_path: string | null;
  // Postgres counts come through as text when they are large; never here, but
  // the app works in numbers either way.
  cheers: number | string;
  cheered: boolean;
};

export const FEED_PAGE_SIZE = 20;

// Newest first. Pass the last item shown to get the page after it.
export async function fetchFeed(after?: FeedItem): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('friends_feed', {
    before_at: after?.consumedAt ?? null,
    before_id: after?.id ?? null,
    page_size: FEED_PAGE_SIZE,
  });
  if (error) throw error;
  const rows = (data ?? []) as FeedRow[];

  const paths = rows.flatMap((row) => [row.photo_path, row.avatar_path].filter((path): path is string => !!path));
  // A missing link only means a drawing or initials instead of a photo.
  const links = await createPhotoLinks([...new Set(paths)]).catch(() => new Map<string, string>());
  const link = (path: string | null) => (path && links.get(path)) || null;

  return rows.map((row) => ({
    id: row.id,
    author: {
      id: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatarPath: row.avatar_path,
      avatarUrl: link(row.avatar_path),
    },
    name: row.coffee_name,
    type: recognizeType(row.coffee_type),
    milk: row.milk,
    cafe: row.cafe_name,
    rating: row.rating,
    consumedAt: row.consumed_at,
    photoPath: row.photo_path,
    photoUrl: link(row.photo_path),
    cheers: Number(row.cheers),
    cheered: row.cheered,
  }));
}

// Resolves to whether the user is cheering the coffee afterwards.
export async function toggleCheers(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_cheers', { entry: id });
  if (error) throw error;
  return data as boolean;
}

export type ReportReason = 'inappropriate' | 'spam' | 'other';

// Reports a person, or one coffee of theirs when `entryId` is given.
export async function reportContent(userId: string, reason: ReportReason, entryId?: string): Promise<void> {
  const { error } = await supabase.rpc('report_content', {
    target_user: userId,
    entry: entryId ?? null,
    reason,
  });
  if (error) throw error;
}
