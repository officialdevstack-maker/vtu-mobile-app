// src/app/pin.tsx

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { changePin, requestPinReset, setPin } from '@/api/account';
import { getMe } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { useColors } from '@/theme';

const digits = (text: string) => text.replace(/\D/g, '').slice(0, 4);
const isPin = (value: string) => /^\d{4}$/.test(value);

export default function PinScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const hasPin = me.data?.hasPin ?? false;
  const save = useMutation({
    mutationFn: (input: { current: string; next: string }) =>
      hasPin ? changePin({ currentPin: input.current, nextPin: input.next }) : setPin(input.next),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const reset = useMutation({
    mutationFn: requestPinReset,
    onSuccess: (result) => void openBrowserAsync(result.resetUrl),
  });

  const mismatch = nextPin !== confirmPin;
  const currentError = showErrors && hasPin && !isPin(currentPin) ? 'Enter your current 4-digit PIN.' : null;
  const nextError = showErrors && !isPin(nextPin) ? 'Enter a 4-digit PIN.' : null;
  const confirmError = showErrors && isPin(nextPin) && mismatch ? 'The PINs do not match.' : null;

  function submit() {
    setShowErrors(true);
    if (save.isPending) return;
    if (hasPin && !isPin(currentPin)) return;
    if (!isPin(nextPin) || mismatch) return;
    const input = { current: currentPin, next: nextPin };
    setCurrentPin('');
    setNextPin('');
    setConfirmPin('');
    setShowErrors(false);
    save.mutate(input);
  }

  if (me.isLoading) return <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.text} style={styles.state} /></SafeAreaView>;
  if (me.isError || !me.data) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.centered, styles.gap]}>
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{errorMessage(me.error)}</Text>
          <Button label="Try again" variant="secondary" onPress={() => void me.refetch()} />
        </View>
      </SafeAreaView>
    );
  }
  if (save.isSuccess) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.centered, styles.gap]}>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[styles.title, { color: colors.text }]}>PIN saved</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>You will use this PIN to confirm purchases.</Text>
          <Button label="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{hasPin ? 'Change your PIN' : 'Set your PIN'}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{hasPin ? 'Enter your current PIN, then choose a new one.' : 'You need a 4-digit PIN to confirm purchases. Avoid repeated digits like 1111.'}</Text>
          {me.data.locked ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>Your PIN is temporarily locked after too many wrong attempts.</Text> : null}
          {hasPin ? <TextField label="Current PIN" value={currentPin} onChangeText={(text) => setCurrentPin(digits(text))} placeholder="4-digit PIN" secureTextEntry keyboardType="number-pad" maxLength={4} editable={!save.isPending} error={currentError} /> : null}
          <TextField label={hasPin ? 'New PIN' : 'PIN'} value={nextPin} onChangeText={(text) => setNextPin(digits(text))} placeholder="4-digit PIN" secureTextEntry keyboardType="number-pad" maxLength={4} editable={!save.isPending} error={nextError} />
          <TextField label="Confirm PIN" value={confirmPin} onChangeText={(text) => setConfirmPin(digits(text))} placeholder="Repeat the PIN" secureTextEntry keyboardType="number-pad" maxLength={4} editable={!save.isPending} error={confirmError} onSubmitEditing={submit} />
          {save.isError ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{errorMessage(save.error)}</Text> : null}
          <Button label={hasPin ? 'Change PIN' : 'Set PIN'} onPress={submit} loading={save.isPending} />
          {hasPin ? (
            <>
              <Button label="Forgot your PIN?" variant="secondary" onPress={() => reset.mutate()} loading={reset.isPending} />
              {reset.isError ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{errorMessage(reset.error)}</Text> : null}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  centered: { flex: 1, padding: 16, justifyContent: 'center' },
  state: { paddingVertical: 16 },
  gap: { gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  error: { fontSize: 14, fontWeight: '600' },
});
