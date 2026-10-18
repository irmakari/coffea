import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

import { createEntry, deleteEntry, fetchEntries, setEntryFavorite, updateEntry } from './entriesApi';
import type { Entry, EntryDraft } from './types';

type EntriesState = {
  // Newest first.
  entries: Entry[];
  status: 'loading' | 'ready' | 'error';
  reload: () => Promise<void>;
  add: (draft: EntryDraft) => Promise<Entry>;
  update: (entry: Entry, draft: EntryDraft) => Promise<Entry>;
  remove: (entry: Entry) => Promise<void>;
  toggleFavorite: (entry: Entry) => Promise<void>;
  // Notes a sticker shared for a coffee's photo, unless the photo changed.
  noteSticker: (id: string, photoPath: string, stickerPath: string) => void;
};

const EntriesContext = createContext<EntriesState | null>(null);

function newestFirst(entries: Entry[]) {
  return [...entries].sort((a, b) => b.consumedAt.localeCompare(a.consumedAt));
}

// Holds the signed-in user's journal in memory. A personal journal is small
// enough to load whole, which keeps every screen and statistic in step.
export function EntriesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Keyed by user, so signing out or switching accounts starts from empty.
  return (
    <EntriesStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </EntriesStore>
  );
}

function EntriesStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<EntriesState['status']>('loading');

  const reload = useCallback(async () => {
    try {
      setEntries(await fetchEntries());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchEntries().then(
      (loaded) => {
        if (cancelled) return;
        setEntries(loaded);
        setStatus('ready');
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    // Coming back to the app picks up anything changed on another device.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId, reload]);

  const value = useMemo<EntriesState>(() => {
    const requireUser = () => {
      if (!userId) throw new Error('Not signed in');
      return userId;
    };

    return {
      entries,
      status,
      reload,
      add: async (draft) => {
        const created = await createEntry(requireUser(), draft);
        setEntries((current) => newestFirst([created, ...current]));
        return created;
      },
      update: async (entry, draft) => {
        const updated = await updateEntry(requireUser(), entry, draft);
        setEntries((current) => newestFirst(current.map((item) => (item.id === updated.id ? updated : item))));
        return updated;
      },
      remove: async (entry) => {
        await deleteEntry(entry);
        setEntries((current) => current.filter((item) => item.id !== entry.id));
      },
      noteSticker: (id, photoPath, stickerPath) =>
        setEntries((current) =>
          current.map((item) =>
            item.id === id && item.photoPath === photoPath ? { ...item, stickerPath } : item,
          ),
        ),
      toggleFavorite: async (entry) => {
        const isFavorite = !entry.isFavorite;
        const apply = (value: boolean) =>
          setEntries((current) =>
            current.map((item) => (item.id === entry.id ? { ...item, isFavorite: value } : item)),
          );
        // Show the change at once and put it back if the save fails.
        apply(isFavorite);
        try {
          await setEntryFavorite(entry.id, isFavorite);
        } catch (error) {
          apply(entry.isFavorite);
          throw error;
        }
      },
    };
  }, [entries, status, reload, userId]);

  return <EntriesContext value={value}>{children}</EntriesContext>;
}

export function useEntries() {
  const context = use(EntriesContext);
  if (!context) throw new Error('useEntries must be used inside EntriesProvider');
  return context;
}

export function useEntry(id: string | undefined) {
  const { entries } = useEntries();
  return entries.find((entry) => entry.id === id) ?? null;
}
