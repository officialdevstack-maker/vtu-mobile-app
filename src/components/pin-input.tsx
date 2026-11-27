// src/components/pin-input.tsx

import { useRef, type RefObject } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';

import { MIN_TOUCH, fontSize, useColors } from '@/theme';

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  error?: string | null;
  inputRef?: RefObject<TextInputInstance | null>;
};

const LENGTH = 4;

export function PinInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  error,
  inputRef,
}: PinInputProps) {
  const colors = useColors();
  const localRef = useRef<TextInputInstance | null>(null);
  const ref = inputRef ?? localRef;

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.dots}>
          {Array.from({ length: LENGTH }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { borderColor: error ? colors.danger : colors.text },
                index < value.length && { backgroundColor: colors.text },
              ]}
            />
          ))}
        </View>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, LENGTH))}
          onSubmitEditing={onSubmit}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={LENGTH}
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          caretHidden
          editable={!disabled}
          accessibilityLabel={`Transaction PIN, ${value.length} of ${LENGTH} digits entered`}
          style={styles.input}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  field: {
    minHeight: MIN_TOUCH + 12,
    minWidth: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 16 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  input: { ...StyleSheet.absoluteFill, opacity: 0 },
  error: { fontSize: fontSize.base, fontWeight: '600', textAlign: 'center' },
});
