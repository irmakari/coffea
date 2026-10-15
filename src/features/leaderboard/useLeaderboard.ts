import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { fetchLeaderboard, type Standing, type Week } from './leaderboardApi';

type Status = 'loading' | 'ready' | 'error';

// One week's standings, loaded again whenever its screen comes into view so
// a coffee just logged moves the user up.
export function useLeaderboard(week: Week) {
  const [loaded, setLoaded] = useState<{ week: Week; standings: Standing[] } | null>(null);
  const [failedWeek, setFailedWeek] = useState<Week | null>(null);
  // Only the answer to the latest request lands.
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const standings = await fetchLeaderboard(week);
      if (mine !== generation.current) return;
      setLoaded({ week, standings });
      setFailedWeek(null);
    } catch {
      if (mine === generation.current) setFailedWeek(week);
    }
  }, [week]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Switching weeks shows nothing stale while the other week loads.
  const current = loaded?.week === week ? loaded.standings : null;
  const status: Status = current ? 'ready' : failedWeek === week ? 'error' : 'loading';
  return { standings: current ?? [], status, reload };
}
