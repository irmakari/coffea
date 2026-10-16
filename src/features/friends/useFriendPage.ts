import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { fetchActivity, fetchAlbumBoard, type Activity } from '@/features/album/albumFriendsApi';
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
};

// What the server shares about one friend: the same totals and firsts the
// friends tab shows, picked out for them. Never their coffees themselves.
export function useFriendPage(id: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [page, setPage] = useState<FriendPage>({ week: null, album: null, firsts: [] });
  const [status, setStatus] = useState<Status>('loading');
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const [week, album, activity] = await Promise.all([
        fetchLeaderboard(0),
        fetchAlbumBoard((face) => standingName(face, userId)),
        fetchActivity(100),
      ]);
      if (mine !== generation.current) return;
      setPage({
        week: week.find((standing) => standing.id === id) ?? null,
        album: album.find((standing) => standing.id === id) ?? null,
        firsts: activity.filter((item) => item.person.id === id),
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
