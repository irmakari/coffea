import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { createPhotoLinks, removePhoto, uploadPhoto } from '@/features/entries/photoStorage';
import { supabase } from '@/lib/supabase';

import { DEFAULT_CURRENCY } from './currencies';

// Passed to `pickPhoto`, so the avatar is already this small when it gets here.
export const AVATAR_SIZE = 480;

// Thrown by `setUsername` when someone else already has the name.
export class UsernameTakenError extends Error {}

type Profile = {
  displayName: string | null;
  // How friends find this account. Missing until the user picks one.
  username: string | null;
  // Whether friends see this account on their weekly leaderboard.
  onLeaderboard: boolean;
  preferredCurrency: string;
  // Where the photo lives in private storage, and a link to show it.
  avatarPath: string | null;
  avatarUrl: string | null;
};

type ProfileState = {
  profile: Profile;
  setPreferredCurrency: (currency: string) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  // Takes the username as stored; see `normalizeUsername`.
  setUsername: (username: string) => Promise<void>;
  setOnLeaderboard: (value: boolean) => Promise<void>;
  // Takes a photo file on the device.
  setAvatar: (localUri: string) => Promise<void>;
  removeAvatar: () => Promise<void>;
};

type ProfileRow = {
  display_name: string | null;
  username: string | null;
  on_leaderboard: boolean;
  preferred_currency: string;
  avatar_path: string | null;
};

const fallback: Profile = {
  displayName: null,
  username: null,
  onLeaderboard: true,
  preferredCurrency: DEFAULT_CURRENCY,
  avatarPath: null,
  avatarUrl: null,
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Keyed by user, so signing out or switching accounts starts fresh.
  return (
    <ProfileStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </ProfileStore>
  );
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username, on_leaderboard, preferred_currency, avatar_path')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();
  if (!data) return null;

  const links = data.avatar_path ? await createPhotoLinks([data.avatar_path]).catch(() => null) : null;
  return {
    displayName: data.display_name,
    username: data.username,
    onLeaderboard: data.on_leaderboard,
    preferredCurrency: data.preferred_currency,
    avatarPath: data.avatar_path,
    avatarUrl: (data.avatar_path && links?.get(data.avatar_path)) || null,
  };
}

function ProfileStore({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(fallback);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // If this fails the defaults stay in place; nothing here blocks the app.
    loadProfile(userId)
      .then((loaded) => {
        if (!cancelled && loaded) setProfile(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo<ProfileState>(() => {
    const save = async (changes: Partial<ProfileRow>) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').update(changes).eq('id', userId);
      if (error) throw error;
    };

    return {
      profile,
      setPreferredCurrency: async (currency) => {
        const previous = profile.preferredCurrency;
        const apply = (value: string) => setProfile((current) => ({ ...current, preferredCurrency: value }));
        // Show the choice at once and put it back if the save fails.
        apply(currency);
        try {
          await save({ preferred_currency: currency });
        } catch (error) {
          apply(previous);
          throw error;
        }
      },
      setDisplayName: async (name) => {
        const displayName = name.trim() || null;
        await save({ display_name: displayName });
        setProfile((current) => ({ ...current, displayName }));
      },
      setUsername: async (username) => {
        try {
          await save({ username });
        } catch (error) {
          // Postgres reports a duplicate in a unique index this way.
          if ((error as { code?: string }).code === '23505') throw new UsernameTakenError();
          throw error;
        }
        setProfile((current) => ({ ...current, username }));
      },
      setOnLeaderboard: async (onLeaderboard) => {
        const previous = profile.onLeaderboard;
        const apply = (value: boolean) => setProfile((current) => ({ ...current, onLeaderboard: value }));
        // Show the choice at once and put it back if the save fails.
        apply(onLeaderboard);
        try {
          await save({ on_leaderboard: onLeaderboard });
        } catch (error) {
          apply(previous);
          throw error;
        }
      },
      setAvatar: async (localUri) => {
        if (!userId) throw new Error('Not signed in');
        const previous = profile.avatarPath;
        const avatarPath = await uploadPhoto(userId, localUri);
        try {
          await save({ avatar_path: avatarPath });
        } catch (error) {
          await removePhoto(avatarPath);
          throw error;
        }
        if (previous) await removePhoto(previous);
        // The file on the device is shown straight away; a stored link is
        // only needed the next time the profile loads.
        setProfile((current) => ({ ...current, avatarPath, avatarUrl: localUri }));
      },
      removeAvatar: async () => {
        const previous = profile.avatarPath;
        if (!previous) return;
        await save({ avatar_path: null });
        await removePhoto(previous);
        setProfile((current) => ({ ...current, avatarPath: null, avatarUrl: null }));
      },
    };
  }, [profile, userId]);

  return <ProfileContext value={value}>{children}</ProfileContext>;
}

export function useProfile() {
  const context = use(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
