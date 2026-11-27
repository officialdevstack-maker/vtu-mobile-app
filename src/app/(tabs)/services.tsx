// src/app/(tabs)/services.tsx

import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuRow } from '@/components/menu-row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SERVICE_ICON } from '@/lib/service-icons';
import { useColors } from '@/theme';

const SERVICES = [
  { label: 'Airtime', subtitle: 'Top up any network', href: '/buy/airtime', icon: SERVICE_ICON.airtime },
  { label: 'Data', subtitle: 'Bundles and plans', href: '/buy/data', icon: SERVICE_ICON.data },
  { label: 'Cable TV', subtitle: 'Renew your subscription', href: '/buy/cable', icon: SERVICE_ICON.cable },
  { label: 'Electricity', subtitle: 'Prepaid and postpaid meters', href: '/buy/electricity', icon: SERVICE_ICON.electricity },
] as const;

export default function ServicesScreen() {
  const colors = useColors();

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Services</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {SERVICES.map((service, index) => (
              <MenuRow
                key={service.label}
                first={index === 0}
                label={service.label}
                subtitle={service.subtitle}
                icon={service.icon}
                accessibilityLabel={`Buy ${service.label}. ${service.subtitle}.`}
                onPress={() => router.push(service.href)}
              />
            ))}
          </View>
          <Text style={[styles.section, { color: colors.text }]}>Wallet</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow
              first
              label="Add money"
              subtitle="Fund your wallet by bank transfer"
              icon={SERVICE_ICON.wallet}
              onPress={() => router.push('/fund')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
});
