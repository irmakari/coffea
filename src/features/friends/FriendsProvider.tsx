import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

import {
  blockUser,
  fetchConnections,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
  type Connection,
  type Person,
  type Relation,
} from './friendsApi';

type FriendsState = {
  // Each list is most recent first.
  friends: Connection[];
  incoming: Connection[];
  outgoing: Connection[];
  status: 'loading' | 'ready' | 'error';
  reload: () => Promise<void>;
  // Resolves to where the two stand afterwards.
  request: (person: Person) => Promise<Relation>;
  respond: (person: Person, accept: boolean) => Promise<Relation>;
  remove: (person: Pick<Person, 'id'>) => Promise<void>;
  block: (person: Pick<Person, 'id'>) => Promise<void>;
};

const FriendsContext = createContext<FriendsState | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Keyed by user, so signing out or switching accounts starts from empty.
  return (
    <FriendsStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </FriendsStore>
  );
}

function FriendsStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [status, setStatus] = useState<FriendsState['status']>('loading');

  const reload = useCallback(async () => {
    try {
      setConnections(await fetchConnections());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchConnections().then(
      (loaded) => {
        if (cancelled) return;
        setConnections(loaded);
        setStatus('ready');
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    // Requests arrive from other phones; coming back to the app picks them up.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [userId, reload]);

  const value = useMemo<FriendsState>(() => {
    const drop = (id: string) => setConnections((current) => current.filter((other) => other.id !== id));

    // Moves someone to the top of the list they now belong to.
    const place = (person: Person, relation: Relation) => {
      if (relation === 'none') {
        drop(person.id);
        return;
      }
      const since = new Date().toISOString();
      setConnections((current) => [
        { ...person, relation, since },
        ...current.filter((other) => other.id !== person.id),
      ]);
    };

    return {
      friends: connections.filter((person) => person.relation === 'friend'),
      incoming: connections.filter((person) => person.relation === 'incoming'),
      outgoing: connections.filter((person) => person.relation === 'outgoing'),
      status,
      reload,
      request: async (person) => {
        const relation = await sendFriendRequest(person.id);
        place(person, relation);
        return relation;
      },
      respond: async (person, accept) => {
        const relation = await respondToFriendRequest(person.id, accept);
        place(person, relation);
        return relation;
      },
      remove: async (person) => {
        await removeFriend(person.id);
        drop(person.id);
      },
      block: async (person) => {
        await blockUser(person.id);
        drop(person.id);
      },
    };
  }, [connections, status, reload]);

  return <FriendsContext value={value}>{children}</FriendsContext>;
}

export function useFriends() {
  const context = use(FriendsContext);
  if (!context) throw new Error('useFriends must be used inside FriendsProvider');
  return context;
}
