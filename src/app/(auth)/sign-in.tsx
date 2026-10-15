import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { isValidEmail, resendSignUpCode, signIn } from '@/features/auth/authApi';
import { ConfirmEmail } from '@/features/auth/ConfirmEmail';
import { PasswordField } from '@/features/auth/PasswordField';
import { t } from '@/i18n';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Set when the account exists but its email was never confirmed.
  const [confirming, setConfirming] = useState(false);
  const passwordField = useRef<TextInput>(null);

  const emailError = isValidEmail(email) ? undefined : t('auth.email.invalid');
  const passwordError = password ? undefined : t('auth.password.required');

  const submit = async () => {
    setShowErrors(true);
    setFailure(null);
    if (emailError || passwordError) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    // On success the root layout swaps to the signed-in screens by itself.
    if (!result.ok && result.message === 'auth.errors.emailNotConfirmed') {
      // The first code may be long gone, so a fresh one is sent.
      await resendSignUpCode(email);
      setSubmitting(false);
      setConfirming(true);
    } else if (!result.ok) {
      setFailure(t(result.message));
      setSubmitting(false);
    }
  };

  if (confirming) {
    return <ConfirmEmail email={email} onBack={() => setConfirming(false)} />;
  }

  return (
    <AuthScreen
      title={t('auth.signIn.title')}
      subtitle={t('auth.signIn.subtitle')}
      footer={{
        prompt: t('auth.signIn.switchPrompt'),
        action: t('auth.signIn.switchAction'),
        href: '/sign-up',
      }}
    >
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
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordField.current?.focus()}
      />
      <PasswordField
        ref={passwordField}
        label={t('auth.password.label')}
        value={password}
        onChangeText={setPassword}
        error={showErrors ? passwordError : undefined}
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {failure}
        </Text>
      ) : null}
      <Button label={t('auth.signIn.submit')} loading={submitting} onPress={submit} />
      <Link href="/forgot-password" style={styles.forgot}>
        <Text variant="small" color="textSecondary">
          {t('auth.reset.link')}
        </Text>
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'center',
    paddingVertical: 14,
    marginVertical: -14,
  },
});
