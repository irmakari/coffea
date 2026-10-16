import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';

import { colors, radii, sizes, spacing, themed, withAlpha } from '@/theme';

import { Text } from './Text';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

// `cancelable` lets a tap outside the alert close it, as on Android.
type Shown = { title: string; message?: string; buttons: AlertButton[]; cancelable: boolean };

// One alert at a time, shown by the host at the root of the app. A second
// asked for while one is up waits its turn.
let present: ((alert: Shown) => void) | null = null;
const waiting: Shown[] = [];

// The app's own Alert.alert: the same arguments, drawn in the app's style.
// With no buttons it offers a plain OK, as the system one does.
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: { cancelable?: boolean },
) {
  const alert = {
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    cancelable: options?.cancelable ?? false,
  };
  if (present) present(alert);
  else waiting.push(alert);
}

function AlertAction({ button, onPress, grow }: { button: AlertButton; onPress: () => void; grow: boolean }) {
  const kind = button.style ?? 'default';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        grow && styles.actionGrow,
        kind === 'cancel' ? styles.cancel : kind === 'destructive' ? styles.destructive : styles.confirm,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="button" color={kind === 'cancel' ? 'text' : 'textOnAccent'} numberOfLines={1}>
        {button.text}
      </Text>
    </Pressable>
  );
}

// Mounted once at the root. Fades the page back and lifts the alert in.
export function AlertHost() {
  // Any asked for before the host was up are shown first.
  const [alert, setAlert] = useState<Shown | null>(() => waiting.shift() ?? null);
  const [lift] = useState(() => new Animated.Value(0));
  const queue = useRef<Shown[]>(waiting.splice(0));

  useEffect(() => {
    present = (next) => {
      setAlert((current) => {
        if (current) {
          queue.current.push(next);
          return current;
        }
        return next;
      });
    };
    return () => {
      present = null;
    };
  }, []);

  useEffect(() => {
    if (!alert) return;
    lift.setValue(0);
    Animated.timing(lift, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [alert, lift]);

  // The alert goes first, then the button's action runs, so an action that
  // shows another alert finds the way clear.
  const close = (button?: AlertButton) => {
    setAlert(queue.current.shift() ?? null);
    button?.onPress?.();
  };

  const buttons = alert?.buttons ?? [];
  // Two sit side by side, cancel first; one or three or more stack.
  const sideBySide = buttons.length === 2;
  const ordered = sideBySide
    ? [...buttons.filter((button) => button.style === 'cancel'), ...buttons.filter((button) => button.style !== 'cancel')]
    : buttons;
  const cancel = buttons.find((button) => button.style === 'cancel');

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => (cancel || alert?.cancelable ? close(cancel) : undefined)}
    >
      <View style={styles.backdrop}>
        {/* Behind the alert: a tap here backs out, where that is allowed. */}
        <Pressable
          accessible={false}
          style={styles.dismiss}
          onPress={() => (alert?.cancelable ? close(cancel) : undefined)}
        />
        {alert ? (
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.card,
              {
                opacity: lift,
                transform: [{ scale: lift.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
              },
            ]}
          >
            <View style={styles.words}>
              <Text variant="heading" align="center" accessibilityRole="header">
                {alert.title}
              </Text>
              {alert.message ? (
                <Text color="textSecondary" align="center">
                  {alert.message}
                </Text>
              ) : null}
            </View>
            <View style={sideBySide ? styles.row : styles.column}>
              {ordered.map((button) => (
                <AlertAction key={button.text} button={button} grow={sideBySide} onPress={() => close(button)} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = themed(() => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: withAlpha(colors.shadow, 0.45),
  },
  dismiss: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.frame,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  words: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  column: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    minHeight: sizes.control - 6,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGrow: {
    flex: 1,
  },
  confirm: {
    backgroundColor: colors.accent,
  },
  destructive: {
    backgroundColor: colors.danger,
  },
  cancel: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.75,
  },
}));
