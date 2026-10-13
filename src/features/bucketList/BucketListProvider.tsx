import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

import {
  createBucketItem,
  deleteBucketItem,
  fetchBucketItems,
  setBucketItemCompleted,
  updateBucketItem,
  type BucketDraft,
  type BucketItem,
} from './bucketListApi';

type BucketListState = {
  // Newest first.
  items: BucketItem[];
  status: 'loading' | 'ready' | 'error';
  reload: () => Promise<void>;
  add: (draft: BucketDraft) => Promise<void>;
  update: (id: string, draft: BucketDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleCompleted: (item: BucketItem) => Promise<void>;
};

const BucketListContext = createContext<BucketListState | null>(null);

export function BucketListProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Keyed by user, so signing out or switching accounts starts from empty.
  return (
    <BucketListStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </BucketListStore>
  );
}

function BucketListStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [status, setStatus] = useState<BucketListState['status']>('loading');

  const reload = useCallback(async () => {
    try {
      setItems(await fetchBucketItems());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchBucketItems().then(
      (loaded) => {
        if (cancelled) return;
        setItems(loaded);
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

  const value = useMemo<BucketListState>(
    () => ({
      items,
      status,
      reload,
      add: async (draft) => {
        const created = await createBucketItem(draft);
        setItems((current) => [created, ...current]);
      },
      update: async (id, draft) => {
        const updated = await updateBucketItem(id, draft);
        setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      },
      remove: async (id) => {
        await deleteBucketItem(id);
        setItems((current) => current.filter((item) => item.id !== id));
      },
      toggleCompleted: async (item) => {
        const isCompleted = !item.isCompleted;
        const apply = (value: boolean) =>
          setItems((current) =>
            current.map((other) => (other.id === item.id ? { ...other, isCompleted: value } : other)),
          );
        // Show the tick at once and put it back if the save fails.
        apply(isCompleted);
        try {
          await setBucketItemCompleted(item.id, isCompleted);
        } catch (error) {
          apply(item.isCompleted);
          throw error;
        }
      },
    }),
    [items, status, reload],
  );

  return <BucketListContext value={value}>{children}</BucketListContext>;
}

export function useBucketList() {
  const context = use(BucketListContext);
  if (!context) throw new Error('useBucketList must be used inside BucketListProvider');
  return context;
}
