import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatDate } from '@/i18n';
import { colors, radii, sizes, spacing } from '@/theme';

type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
};

// A coffee can be backdated but not logged in the future.
export function DateField({ label, value, onChange }: DateFieldProps) {
  // Android has no combined picker, so it asks for the day and then the time.
  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (_event, day) => {
        DateTimePickerAndroid.open({
          value: day,
          mode: 'time',
          onValueChange: (_timeEvent, picked) => onChange(picked > new Date() ? new Date() : picked),
        });
      },
    });
  };

  return (
    <View style={styles.row}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="compact"
          maximumDate={new Date()}
          accentColor={colors.accent}
          themeVariant="light"
          onValueChange={(_event, picked) => onChange(picked)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={openAndroidPicker}
          style={({ pressed }) => [styles.androidValue, pressed && styles.pressed]}
        >
          <Text variant="label">
            {formatDate(value, 'short')} · {formatDate(value, 'time')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  androidValue: {
    minHeight: sizes.chip,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
