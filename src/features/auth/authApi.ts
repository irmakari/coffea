import type { AuthError } from '@supabase/supabase-js';

import type { TranslationKey } from '@/i18n';
import { supabase } from '@/lib/supabase';

export const MIN_PASSWORD_LENGTH = 8;

type AuthResult<T = undefined> = { ok: true; value: T } | { ok: false; message: TranslationKey };

const messages: Record<string, TranslationKey> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  user_already_exists: 'auth.errors.emailInUse',
  email_exists: 'auth.errors.emailInUse',
  weak_password: 'auth.errors.weakPassword',
  email_address_invalid: 'auth.errors.invalidEmail',
  validation_failed: 'auth.errors.invalidEmail',
  over_email_send_rate_limit: 'auth.errors.rateLimited',
  over_request_rate_limit: 'auth.errors.rateLimited',
  signup_disabled: 'auth.errors.signupDisabled',
  otp_expired: 'auth.errors.codeExpired',
  same_password: 'auth.errors.samePassword',
};

function describe(error: AuthError): TranslationKey {
  if (error.name === 'AuthRetryableFetchError') return 'auth.errors.network';
  return (error.code && messages[error.code]) || 'auth.errors.generic';
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, message: describe(error) } : { ok: true, value: undefined };
}

// Resolves to whether the account still needs its email confirmed. When it
// does not, the user is signed in immediately.
export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult<{ needsEmailConfirmation: boolean }>> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) return { ok: false, message: describe(error) };
  return { ok: true, value: { needsEmailConfirmation: data.session === null } };
}

// Emails a one-time code. Succeeds even when no account uses the address,
// so the screen never reveals who has an account.
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return error ? { ok: false, message: describe(error) } : { ok: true, value: undefined };
}

// Trades the emailed code for a session, then sets the new password.
export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<AuthResult> {
  const verified = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (verified.error) return { ok: false, message: describe(verified.error) };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { ok: false, message: describe(error) } : { ok: true, value: undefined };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, message: describe(error) } : { ok: true, value: undefined };
}
