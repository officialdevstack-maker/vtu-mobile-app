import { Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBalance } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { useSession } from '@/auth/session';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatNaira } from '@/lib/format';

export default function HomeScreen() {
  const { isLoading: sessionLoading, isSignedIn, signOut } = useSession();
  const balance = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    enabled: isSignedIn,
  });

  if (sessionLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!isSignedIn) return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day</Text>
            <Text style={styles.brand}>Spur VTU</Text>
          </View>
          <Pressable
            accessibilityLabel="Sign out"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.wallet}>
          <Text style={styles.walletLabel}>Wallet balance</Text>
          {balance.isLoading ? (
            <ActivityIndicator color="#F2B632" />
          ) : balance.isError ? (
            <View>
              <Text style={styles.error}>{errorMessage(balance.error)}</Text>
              <Pressable accessibilityLabel="Retry wallet balance" onPress={() => void balance.refetch()}>
                <Text style={styles.retry}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.balance}>{formatNaira(balance.data?.balance ?? 0)}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.services}>
          {['Airtime', 'Data', 'Cable TV', 'Electricity'].map((service) => (
            <Pressable
              accessibilityLabel={`Buy ${service}`}
              key={service}
              style={({ pressed }) => [styles.service, pressed && styles.pressed]}>
              <Text style={styles.serviceText}>{service}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 20,
    paddingVertical: 24,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF3F4',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3F4' },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: '#60757A', fontSize: 14 },
  brand: { color: '#12343B', fontSize: 24, fontWeight: '700', marginTop: 2 },
  signOut: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  signOutText: { color: '#12343B', fontWeight: '700' },
  wallet: { width: '100%', minHeight: 140, justifyContent: 'center', borderRadius: 16, backgroundColor: '#12343B', padding: 24 },
  walletLabel: { color: '#BCD0D4', fontSize: 14, marginBottom: 8 },
  balance: { color: '#F7F8F3', fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  error: { color: '#C8432B', marginBottom: 8 },
  retry: { color: '#F2B632', minHeight: 44, fontWeight: '700' },
  sectionTitle: { color: '#12343B', fontSize: 20, fontWeight: '700' },
  services: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  service: { width: '48%', minHeight: 88, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F7F8F3' },
  serviceText: { color: '#12343B', fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
