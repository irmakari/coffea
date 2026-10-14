import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  // True until the stored session has been read on launch.
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

// A password reset signs the user in as soon as the emailed code checks out,
// before the new password is saved. While held, that session is kept from the
// app so the reset screen stays open until the password is in place.
let held = false;
let publishLatest: (() => void) | null = null;

export function holdSignIn() {
  held = true;
}

export function releaseSignIn() {
  held = false;
  publishLatest?.();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    let latest: Session | null = null;
    const publish = () => setState({ session: latest, loading: false });
    publishLatest = publish;

    // Fires once with the stored session, then on every sign-in and sign-out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      latest = session;
      if (!held) publish();
    });
    return () => {
      publishLatest = null;
      data.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth() {
  return use(AuthContext);
}
