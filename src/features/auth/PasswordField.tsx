import { useState, type ComponentProps } from 'react';

import { TextField } from '@/components/ui';
import { t } from '@/i18n';

// A password field that can be read back. Sign-up asks for the password
// once, so being able to check it is what stands between a typo and a reset.
export function PasswordField(props: Omit<ComponentProps<typeof TextField>, 'secureTextEntry' | 'suffix'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      suffix={t(visible ? 'auth.password.hide' : 'auth.password.show')}
      suffixLabel={t(visible ? 'auth.password.hideLabel' : 'auth.password.showLabel')}
      onSuffixPress={() => setVisible((current) => !current)}
    />
  );
}
