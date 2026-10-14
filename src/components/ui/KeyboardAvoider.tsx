import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

// KeyboardAvoidingView compares its own frame, which is relative to its
// parent, with the keyboard's position on screen. Inside a modal sheet or
// below a header those differ, so the pinned footer ends up under the
// keyboard. This measures where it sits on screen and passes that as the
// offset.
export function KeyboardAvoider({ children }: { children: ReactNode }) {
  const container = useRef<View>(null);
  const [offset, setOffset] = useState(0);

  return (
    <View
      ref={container}
      style={styles.fill}
      onLayout={() => container.current?.measureInWindow((_x, y) => setOffset(y))}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={offset}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
