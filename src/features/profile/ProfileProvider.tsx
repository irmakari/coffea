import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { createPhotoLinks, removePhoto, uploadPhoto } from '@/features/entries/photoStorage';
import { supabase } from '@/lib/supabase';

import { DEFAULT_CURRENCY } from './currencies';

const AVATAR_WIDTH = 480;

type Profile = {
  displayName: string | null;
  preferredCurrency: string;
  // Where the photo lives in private storage, and a link to show it.
  avatarPath: string | null;
  avatarUrl: string | null;
};

type ProfileState = {
  profile: Profile;
  setPreferredCurrency: (currency: string) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  // Takes a photo file on the device.
  setAvatar: (localUri: string) => Promise<void>;
};

type ProfileRow = {
  display_name: string | null;
  preferred_currency: string;
  avatar_path: string | null;
};

const fallback: Profile = {
  displayName: null,
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
    .select('display_name, preferred_currency, avatar_path')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();
  if (!data) return null;

  const links = data.avatar_path ? await createPhotoLinks([data.avatar_path]).catch(() => null) : null;
  return {
    displayName: data.display_name,
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
    loadProfile(userId).then((loaded) => {
      if (!cancelled && loaded) setProfile(loaded);
    });
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
        await save({ preferred_currency: currency });
        setProfile((current) => ({ ...current, preferredCurrency: currency }));
      },
      setDisplayName: async (name) => {
        const displayName = name.trim() || null;
        await save({ display_name: displayName });
        setProfile((current) => ({ ...current, displayName }));
      },
      setAvatar: async (localUri) => {
        if (!userId) throw new Error('Not signed in');
        const previous = profile.avatarPath;
        const avatarPath = await uploadPhoto(userId, localUri, AVATAR_WIDTH);
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
    };
  }, [profile, userId]);

  return <ProfileContext value={value}>{children}</ProfileContext>;
}

export function useProfile() {
  const context = use(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
