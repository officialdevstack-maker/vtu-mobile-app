import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { MaxContentWidth } from '@/constants/theme';
import { useColors } from '@/theme';

export function ComingSoon({ title }: { title: string }) {
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          This screen is not built yet.
        </Text>
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
});
