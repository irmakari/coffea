import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import type { Ranked } from '@/features/leaderboard/leaderboardApi';
import { standingName } from '@/features/leaderboard/StandingRow';

import { fetchActivity, fetchAlbumBoard, type Activity } from './albumFriendsApi';

type Status = 'loading' | 'ready' | 'error';

// The album board and friends' latest album coffees, loaded together and
// again whenever the friends tab comes into view.
export function useFriendsAlbum() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [board, setBoard] = useState<Ranked[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  // Only the answer to the latest request lands.
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const [ranked, latest] = await Promise.all([
        fetchAlbumBoard((face) => standingName(face, userId)),
        fetchActivity(),
      ]);
      if (mine !== generation.current) return;
      setBoard(ranked);
      setActivity(latest);
      setStatus('ready');
    } catch {
      if (mine === generation.current) setStatus('error');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { board, activity, status, reload };
}
