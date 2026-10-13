import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radii, sizes, spacing, typography } from '@/theme';

import { Text } from './Text';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  // Short text pinned to the end of the field, such as a currency code.
  suffix?: string;
};

// Fields are filled rather than outlined, so a form reads as a few calm
// blocks instead of a stack of boxes. The border only appears on focus.
export function TextField({ label, error, suffix, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          maxFontSizeMultiplier={1.4}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            rest.multiline && styles.multiline,
            !!suffix && styles.withSuffix,
            focused && styles.focused,
            !!error && styles.invalid,
            style,
          ]}
        />
        {suffix ? (
          <View style={styles.suffix} pointerEvents="none">
            <Text variant="label" color="textMuted">
              {suffix}
            </Text>
          </View>
        ) : null}
      </View>
      {error ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  input: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    minHeight: sizes.control,
    paddingHorizontal: spacing.lg,
    borderWidth: sizes.hairline,
    borderColor: colors.surface,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: {
    minHeight: 112,
    paddingVertical: spacing.lg,
    lineHeight: typography.body.lineHeight,
    textAlignVertical: 'top',
  },
  withSuffix: {
    paddingRight: 64,
  },
  suffix: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  focused: {
    borderColor: colors.accent,
  },
  invalid: {
    borderColor: colors.danger,
  },
});
