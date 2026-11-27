// src/app/help.tsx

import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSupportTicket, isLookupReference } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { useColors } from '@/theme';

export default function HelpScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ subject?: string; transactionId?: string }>();
  const transactionId =
    params.transactionId && isLookupReference(params.transactionId) ? params.transactionId : undefined;
  const [subject, setSubject] = useState(
    params.subject ? `Issue with ${params.subject}`.slice(0, 120) : '',
  );
  const [message, setMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const ticket = useMutation({ mutationFn: createSupportTicket });

  const subjectOk = subject.trim().length > 0;
  const messageOk = message.trim().length > 0;

  function submit() {
    setShowErrors(true);
    if (!subjectOk || !messageOk || ticket.isPending) return;
    ticket.mutate({ subject: subject.trim(), body: message.trim(), transactionId });
  }

  if (ticket.isSuccess) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            Message sent
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Our team has your request and will reply. Ticket reference: {ticket.data.id}
          </Text>
          <Button label="Done" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Tell us what went wrong. If it is about an order, mention what you bought and when.
            Please don&apos;t include your PIN.
          </Text>
          {transactionId ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              This message will be linked to your order.
            </Text>
          ) : null}
          <TextField
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Purchase has not completed"
            maxLength={120}
            editable={!ticket.isPending}
            error={showErrors && !subjectOk ? 'Enter a subject.' : null}
          />
          <TextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Describe the problem"
            multiline
            maxLength={2000}
            textAlignVertical="top"
            editable={!ticket.isPending}
            style={styles.multiline}
            error={showErrors && !messageOk ? 'Enter a message.' : null}
          />
          {ticket.isError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {errorMessage(ticket.error)}
            </Text>
          ) : null}
          <Button label="Send message" onPress={submit} loading={ticket.isPending} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 16 },
  centered: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  multiline: { minHeight: 140, paddingTop: 12 },
  error: { fontSize: 14, fontWeight: '600' },
});
