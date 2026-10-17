import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
  fetchActivity,
  fetchAlbumBoard,
  fetchFriendAlbum,
  type Activity,
  type Collected,
} from '@/features/album/albumFriendsApi';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchLeaderboard, type Ranked, type Standing } from '@/features/leaderboard/leaderboardApi';
import { standingName } from '@/features/leaderboard/StandingRow';

type Status = 'loading' | 'ready' | 'error';

export type FriendPage = {
  // Their totals this week, when they show on the leaderboard.
  week: Standing | null;
  // Their place on the album board among the user and their friends.
  album: Ranked | null;
  // Their firsts of the last 30 days, newest first.
  firsts: Activity[];
  // Every album coffee they have collected. Until the server can say, the
  // firsts above are all that is known.
  collected: Collected[];
};

// What the server shares about one friend: the same totals and firsts the
// friends tab shows, picked out for them. Never their coffees themselves.
export function useFriendPage(id: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [page, setPage] = useState<FriendPage>({ week: null, album: null, firsts: [], collected: [] });
  const [status, setStatus] = useState<Status>('loading');
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const [week, album, activity, collected] = await Promise.all([
        fetchLeaderboard(0),
        fetchAlbumBoard((face) => standingName(face, userId)),
        fetchActivity(100),
        fetchFriendAlbum(id).catch(() => null),
      ]);
      if (mine !== generation.current) return;
      const firsts = activity.filter((item) => item.person.id === id);
      setPage({
        week: week.find((standing) => standing.id === id) ?? null,
        album: album.find((standing) => standing.id === id) ?? null,
        firsts,
        collected: collected ?? firsts.map(({ coffee, collectedAt }) => ({ coffee, collectedAt })),
      });
      setStatus('ready');
    } catch {
      if (mine === generation.current) setStatus('error');
    }
  }, [id, userId]);

  // Again whenever the page comes back into view, as the friends tab does.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { ...page, status, reload };
}
