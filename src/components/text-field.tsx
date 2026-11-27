// src/components/text-field.tsx

import { StyleSheet, Text, TextInput, View, type TextInputProps, type StyleProp, type TextStyle } from 'react-native';

import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  style?: StyleProp<TextStyle>;
};

export function TextField({ label, error, hint, style, ...props }: TextFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[styles.meta, { color: colors.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: fontSize.sm + 1, fontWeight: '700' },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base + 1,
  },
  meta: { fontSize: fontSize.sm, lineHeight: 16 },
});
