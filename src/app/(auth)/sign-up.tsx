import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { ConfirmEmail } from '@/features/auth/ConfirmEmail';
import { isValidEmail, MIN_PASSWORD_LENGTH, signUp } from '@/features/auth/authApi';
import { PasswordField } from '@/features/auth/PasswordField';
import { t } from '@/i18n';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const emailField = useRef<TextInput>(null);
  const passwordField = useRef<TextInput>(null);

  const emailError = isValidEmail(email) ? undefined : t('auth.email.invalid');
  const passwordError =
    password.length >= MIN_PASSWORD_LENGTH
      ? undefined
      : t('auth.password.tooShort', { count: MIN_PASSWORD_LENGTH });

  const submit = async () => {
    setShowErrors(true);
    setFailure(null);
    if (emailError || passwordError) return;

    setSubmitting(true);
    const result = await signUp(email, password, name);
    if (!result.ok) {
      setFailure(t(result.message));
      setSubmitting(false);
    } else if (result.value.needsEmailConfirmation) {
      setAwaitingConfirmation(true);
      setSubmitting(false);
    }
    // Otherwise the user is signed in and the root layout takes over.
  };

  if (awaitingConfirmation) {
    return <ConfirmEmail email={email} onBack={() => router.replace('/sign-in')} />;
  }

  return (
    <AuthScreen
      title={t('auth.signUp.title')}
      subtitle={t('auth.signUp.subtitle')}
      footer={{
        prompt: t('auth.signUp.switchPrompt'),
        action: t('auth.signUp.switchAction'),
        href: '/sign-in',
      }}
    >
      <TextField
        label={t('auth.name.label')}
        placeholder={t('auth.name.placeholder')}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        textContentType="givenName"
        autoComplete="given-name"
        maxLength={60}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailField.current?.focus()}
      />
      <TextField
        ref={emailField}
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
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {failure ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {failure}
        </Text>
      ) : null}
      <Button label={t('auth.signUp.submit')} loading={submitting} onPress={submit} />
    </AuthScreen>
  );
}
