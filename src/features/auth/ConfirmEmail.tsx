import { useState } from 'react';

import { Button, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';

import { AuthScreen } from './AuthScreen';
import { resendSignUpCode, verifySignUpCode } from './authApi';

type ConfirmEmailProps = {
  email: string;
  // Back to the screen this came from, to fix a typo or sign in instead.
  onBack: () => void;
};

// The last step of a new account: the code from the confirmation email.
// Used after signing up, and when someone signs in before confirming.
export function ConfirmEmail({ email, onBack }: ConfirmEmailProps) {
  const [code, setCode] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const codeError = /^\d{6,10}$/.test(code.trim()) ? undefined : t('auth.reset.codeInvalid');

  const confirm = async () => {
    setShowErrors(true);
    setFailure(null);
    setNotice(null);
    if (codeError) return;

    setSubmitting(true);
    const result = await verifySignUpCode(email, code);
    // On success the user is signed in and the root layout takes over.
    if (!result.ok) {
      setFailure(t(result.message));
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setFailure(null);
    setNotice(null);
    setSubmitting(true);
    const result = await resendSignUpCode(email);
    setSubmitting(false);
    if (result.ok) {
      setCode('');
      setShowErrors(false);
      setNotice(t('auth.confirm.resent'));
    } else {
      setFailure(t(result.message));
    }
  };

  return (
    <AuthScreen title={t('auth.confirm.title')} subtitle={t('auth.confirm.body', { email: email.trim() })}>
      <TextField
        label={t('auth.reset.codeLabel')}
        value={code}
        onChangeText={setCode}
        error={showErrors ? codeError : undefined}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={10}
        returnKeyType="go"
        onSubmitEditing={confirm}
      />
      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {failure}
        </Text>
      ) : null}
      {notice ? (
        <Text variant="small" color="textSecondary" accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
      <Button label={t('auth.confirm.submit')} loading={submitting} onPress={confirm} />
      <Button variant="quiet" label={t('auth.confirm.resend')} disabled={submitting} onPress={resend} />
      <Button variant="quiet" label={t('auth.confirm.back')} disabled={submitting} onPress={onBack} />
    </AuthScreen>
  );
}
