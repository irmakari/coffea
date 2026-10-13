import { useState } from 'react';

import { Button, Text, TextField } from '@/components/ui';
import { AuthScreen } from '@/features/auth/AuthScreen';
import {
  completePasswordReset,
  isValidEmail,
  MIN_PASSWORD_LENGTH,
  requestPasswordReset,
} from '@/features/auth/authApi';
import { t } from '@/i18n';

// Two steps on one screen: ask for a code by email, then enter the code with
// a new password. A code is used instead of a link so no browser is needed.
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailError = isValidEmail(email) ? undefined : t('auth.email.invalid');
  const codeError = /^\d{6,10}$/.test(code.trim()) ? undefined : t('auth.reset.codeInvalid');
  const passwordError =
    password.length >= MIN_PASSWORD_LENGTH
      ? undefined
      : t('auth.password.tooShort', { count: MIN_PASSWORD_LENGTH });

  const sendCode = async () => {
    setShowErrors(true);
    setFailure(null);
    if (emailError) return;

    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);
    if (result.ok) {
      setShowErrors(false);
      setStep('code');
    } else {
      setFailure(t(result.message));
    }
  };

  const savePassword = async () => {
    setShowErrors(true);
    setFailure(null);
    if (codeError || passwordError) return;

    setSubmitting(true);
    const result = await completePasswordReset(email, code, password);
    // On success the user is signed in and the root layout takes over.
    if (!result.ok) {
      setFailure(t(result.message));
      setSubmitting(false);
    }
  };

  const footer = {
    prompt: t('auth.reset.switchPrompt'),
    action: t('auth.signUp.switchAction'),
    href: '/sign-in',
  } as const;

  if (step === 'email') {
    return (
      <AuthScreen title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')} footer={footer}>
        <TextField
          label={t('auth.email.label')}
          placeholder={t('auth.email.placeholder')}
          value={email}
          onChangeText={setEmail}
          error={showErrors ? emailError : undefined}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={sendCode}
        />
        {failure ? (
          <Text variant="small" color="danger" accessibilityLiveRegion="polite">
            {failure}
          </Text>
        ) : null}
        <Button label={t('auth.reset.send')} loading={submitting} onPress={sendCode} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={t('auth.reset.codeTitle')}
      subtitle={t('auth.reset.codeSubtitle', { email: email.trim() })}
      footer={footer}
    >
      <TextField
        label={t('auth.reset.codeLabel')}
        value={code}
        onChangeText={setCode}
        error={showErrors ? codeError : undefined}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={10}
      />
      <TextField
        label={t('auth.reset.newPassword')}
        value={password}
        onChangeText={setPassword}
        error={showErrors ? passwordError : undefined}
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={savePassword}
      />
      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {failure}
        </Text>
      ) : null}
      <Button label={t('auth.reset.save')} loading={submitting} onPress={savePassword} />
      <Button variant="quiet" label={t('auth.reset.resend')} disabled={submitting} onPress={sendCode} />
    </AuthScreen>
  );
}
