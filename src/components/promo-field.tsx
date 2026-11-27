import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { previewPromo, type PromoService } from '@/api/account';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { formatNaira } from '@/lib/format';
import { fontSize, radius, useColors } from '@/theme';

export type AppliedPromo = {
  code: string;
  discount: number;
  finalPrice: number;
  forPrice: number;
};

type PromoFieldProps = {
  service: PromoService;
  price: number | null;
  value: AppliedPromo | null;
  onChange: (value: AppliedPromo | null) => void;
  disabled?: boolean;
};

export function PromoField({
  service,
  price,
  value,
  onChange,
  disabled = false,
}: PromoFieldProps) {
  const colors = useColors();
  const [code, setCode] = useState('');

  const preview = useMutation({
    mutationFn: (input: { code: string; price: number }) =>
      previewPromo({ code: input.code, service, price: input.price }),
    onSuccess: (result, input) => {
      onChange({
        code: result.code,
        discount: result.discount,
        finalPrice: result.finalPrice,
        forPrice: input.price,
      });
      setCode('');
    },
  });

  const trimmed = code.trim();

  function apply() {
    if (!trimmed || price === null || disabled || preview.isPending) return;
    preview.mutate({ code: trimmed, price });
  }

  function remove() {
    preview.reset();
    onChange(null);
  }

  if (value) {
    return (
      <View
        accessible
        accessibilityLabel={`Promo ${value.code} applied. Discount ${formatNaira(value.discount)}. Estimated price ${formatNaira(value.finalPrice)}.`}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.success }]}>
        <Text style={[styles.title, { color: colors.success }]}>Promo {value.code} applied</Text>
        <Text style={[styles.body, { color: colors.text }]}>
          Discount {formatNaira(value.discount)}. Estimated price {formatNaira(value.finalPrice)}.
        </Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          The final price is confirmed by our server when you pay.
        </Text>
        <Button label="Remove promo" variant="secondary" onPress={remove} disabled={disabled} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <TextField
        label="Promo code (optional)"
        value={code}
        onChangeText={(text) => {
          preview.reset();
          setCode(text.replace(/\s/g, '').slice(0, 32));
        }}
        placeholder="Enter a promo code"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        editable={!disabled && !preview.isPending}
        onSubmitEditing={apply}
        error={preview.isError ? errorMessage(preview.error) : null}
        hint={price === null ? 'Choose an amount or plan first.' : undefined}
      />
      {trimmed ? (
        <Button
          label="Apply code"
          variant="secondary"
          onPress={apply}
          disabled={disabled || price === null}
          loading={preview.isPending}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { borderRadius: radius + 4, borderWidth: 1, padding: 16, gap: 8 },
  title: { fontSize: fontSize.md, fontWeight: '700' },
  body: { fontSize: fontSize.base + 1, lineHeight: 22, fontVariant: ['tabular-nums'] },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
});
