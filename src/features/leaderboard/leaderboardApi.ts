import { createPhotoLinks } from '@/features/entries/photoStorage';
import type { Person } from '@/features/friends/friendsApi';
import { supabase } from '@/lib/supabase';

export const metrics = ['cups', 'days', 'cafes'] as const;
// The album's count is not weekly, so it has a card of its own and is not
// one of the board's tabs.
export type BoardMetric = (typeof metrics)[number];
export type Metric = BoardMetric | 'album';

// This week, or the one before it.
export type Week = 0 | -1;

// One person's week. Counted on the server, so a friend's coffees are never
// sent, only these totals.
export type Standing = Pick<Person, 'id' | 'username' | 'displayName' | 'avatarPath' | 'avatarUrl'> & {
  cups: number;
  days: number;
  cafes: number;
};

export type Ranked = Standing & {
  rank: number;
  value: number;
};

type StandingRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  cups: number;
  days: number;
  cafes: number;
};

// The phone's own zone, so the week starts on the user's Monday.
function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export async function fetchLeaderboard(week: Week): Promise<Standing[]> {
  const { data, error } = await supabase.rpc('friends_leaderboard', { tz: timeZone(), week_offset: week });
  if (error) throw error;
  const rows = (data ?? []) as StandingRow[];

  const paths = rows.flatMap((row) => (row.avatar_path ? [row.avatar_path] : []));
  const links = await createPhotoLinks(paths).catch(() => new Map<string, string>());
  return rows.map((row) => ({
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    avatarUrl: (row.avatar_path && links.get(row.avatar_path)) || null,
    cups: row.cups,
    days: row.days,
    cafes: row.cafes,
  }));
}

// Highest first. Equal totals share a place, and the next place skips
// accordingly: 1, 2, 2, 4.
export function rank(standings: Standing[], metric: BoardMetric, nameOf: (standing: Standing) => string): Ranked[] {
  const sorted = [...standings].sort(
    (a, b) => b[metric] - a[metric] || nameOf(a).localeCompare(nameOf(b)),
  );
  return sorted.map((standing, index) => {
    const value = standing[metric];
    const tied = sorted.findIndex((other) => other[metric] === value);
    return { ...standing, value, rank: tied + 1 };
  });
}

// Monday to Sunday of the week asked for, in the phone's zone.
export function weekRange(week: Week, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  // getDay() is 0 on Sunday; Monday is the first day here.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + week * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}
