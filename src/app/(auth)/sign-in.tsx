import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { isValidEmail, signIn } from '@/features/auth/authApi';
import { t } from '@/i18n';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailError = isValidEmail(email) ? undefined : t('auth.email.invalid');
  const passwordError = password ? undefined : t('auth.password.required');

  const submit = async () => {
    setShowErrors(true);
    setFailure(null);
    if (emailError || passwordError) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    // On success the root layout swaps to the signed-in screens by itself.
    if (!result.ok) {
      setFailure(t(result.message));
      setSubmitting(false);
    }
  };

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
      />
      <TextField
        label={t('auth.password.label')}
        value={password}
        onChangeText={setPassword}
        error={showErrors ? passwordError : undefined}
        secureTextEntry
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
