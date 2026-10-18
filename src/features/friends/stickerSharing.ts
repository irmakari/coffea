import { useEffect, useRef } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useEntries } from '@/features/entries/EntriesProvider';
import { shareSticker } from '@/features/entries/entriesApi';
import { makeSticker } from '@/features/entries/sticker';
import { useProfile } from '@/features/profile/ProfileProvider';

import { useFriends } from './FriendsProvider';
import { LOG_DAYS } from './friendsLogApi';

// Coffees already tried this launch, shared or not, so a photo with no
// sticker or a failed upload is not tried over and over.
const tried = new Set<string>();

// Shares the stickers of the user's coffees from the friends log's days, so
// friends see the cup instead of its drawing. Only while the user has
// friends and shares their log; one coffee at a time, in the background.
export function useStickerSharing() {
  const { session } = useAuth();
  const { entries, noteSticker } = useEntries();
  const { profile } = useProfile();
  const { friends } = useFriends();
  const userId = session?.user.id ?? null;
  const sharing = userId !== null && profile.shareLogs && friends.length > 0;
  const running = useRef(false);

  useEffect(() => {
    if (!sharing || userId === null || running.current) return;
    const now = Date.now();
    const since = now - LOG_DAYS * 24 * 60 * 60 * 1000;
    const waiting = entries.filter((entry) => {
      const at = new Date(entry.consumedAt).getTime();
      return entry.photoPath && entry.photoUrl && !entry.stickerPath && !tried.has(entry.id) && at > since && at <= now;
    });
    if (waiting.length === 0) return;

    running.current = true;
    (async () => {
      for (const entry of waiting) {
        tried.add(entry.id);
        if (!entry.photoPath || !entry.photoUrl) continue;
        try {
          // Keyed by the storage path, like the sticker shown in the journal.
          const sticker = await makeSticker(entry.photoUrl, entry.photoPath);
          if (!sticker) continue;
          const path = await shareSticker(userId, entry, sticker);
          if (path) noteSticker(entry.id, entry.photoPath, path);
        } catch {
          // Tried again next launch.
        }
      }
    })().finally(() => {
      running.current = false;
    });
  }, [sharing, entries, userId, noteSticker]);
}
