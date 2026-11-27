// src/app/(tabs)/services.tsx

import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { NoSearchResultsState } from '@/components/states';
import { SERVICE_ICON } from '@/lib/service-icons';
import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

type ServiceItem = {
  label: string;
  href: Href;
  icon: ComponentProps<typeof SymbolView>['name'];
  keywords?: string;
  accessibilityLabel?: string;
};

type ServiceSection = {
  title: string;
  featured?: boolean;
  items: readonly ServiceItem[];
};

const SECTIONS: readonly ServiceSection[] = [
  {
    title: 'Essentials',
    featured: true,
    items: [
      {
        label: 'Airtime',
        href: '/buy/airtime',
        icon: SERVICE_ICON.airtime,
        keywords: 'recharge top up credit mtn airtel glo 9mobile',
        accessibilityLabel: 'Buy airtime',
      },
      {
        label: 'Data',
        href: '/buy/data',
        icon: SERVICE_ICON.data,
        keywords: 'internet bundle plan wifi',
        accessibilityLabel: 'Buy data',
      },
      {
        label: 'Cable TV',
        href: '/buy/cable',
        icon: SERVICE_ICON.cable,
        keywords: 'tv dstv gotv subscription',
        accessibilityLabel: 'Pay for cable TV',
      },
      {
        label: 'Electricity',
        href: '/buy/electricity',
        icon: SERVICE_ICON.electricity,
        keywords: 'light bill meter prepaid postpaid disco nepa',
        accessibilityLabel: 'Buy electricity',
      },
    ],
  },
  {
    title: 'Wallet',
    items: [
      {
        label: 'Add money',
        href: '/fund',
        icon: SERVICE_ICON.wallet,
        keywords: 'fund deposit transfer bank account',
      },
      {
        label: 'Transactions',
        href: '/history',
        icon: { ios: 'list.bullet.rectangle.fill', android: 'receipt_long', web: 'receipt_long' },
        keywords: 'history orders receipts',
      },
      {
        label: 'Cashback',
        href: '/cashback',
        icon: { ios: 'gift.fill', android: 'redeem', web: 'redeem' },
        keywords: 'rewards earned',
      },
    ],
  },
  {
    title: 'Rewards and account',
    items: [
      {
        label: 'Referrals',
        href: '/referrals',
        icon: { ios: 'person.2.fill', android: 'group', web: 'group' },
        keywords: 'invite friends code earn',
      },
      {
        label: 'Security',
        href: '/pin',
        icon: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
        keywords: 'pin transaction password',
        accessibilityLabel: 'Transaction PIN and security',
      },
      {
        label: 'Alerts',
        href: '/notifications',
        icon: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
        keywords: 'notifications updates messages',
        accessibilityLabel: 'Notifications',
      },
      {
        label: 'Help',
        href: '/help',
        icon: { ios: 'headphones', android: 'support_agent', web: 'support_agent' },
        keywords: 'support contact complaint feedback ticket',
        accessibilityLabel: 'Help and support',
      },
    ],
  },
];

function matches(item: ServiceItem, query: string): boolean {
  if (!query) return true;
  return `${item.label} ${item.keywords ?? ''}`.toLowerCase().includes(query);
}

export default function ServicesScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();

  const visible = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => matches(item, query)),
  })).filter((section) => section.items.length > 0);

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
            All services
          </Text>

          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <SymbolView
              tintColor={colors.textSecondary}
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={16}
            />
            <TextInput
              accessibilityLabel="Search services"
              value={search}
              onChangeText={setSearch}
              placeholder="Search for anything"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              maxLength={50}
              style={[styles.search, { color: colors.text }]}
            />
            {search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={10}
                onPress={() => setSearch('')}>
                <SymbolView
                  tintColor={colors.textSecondary}
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                  size={16}
                />
              </Pressable>
            ) : null}
          </View>

          {visible.length === 0 ? (
            <NoSearchResultsState compact query={search} onClear={() => setSearch('')} />
          ) : (
            visible.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
                <View
                  style={[
                    styles.panel,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  {section.items.map((item) => (
                    <Pressable
                      key={item.label}
                      accessibilityRole="button"
                      accessibilityLabel={item.accessibilityLabel ?? item.label}
                      onPress={() => router.push(item.href)}
                      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
                      <View
                        style={[
                          styles.iconWrap,
                          section.featured
                            ? { backgroundColor: colors.primary }
                            : {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                              },
                          !section.featured && styles.iconBordered,
                        ]}>
                        <SymbolView
                          tintColor={section.featured ? colors.onPrimary : colors.text}
                          name={item.icon}
                          size={20}
                        />
                      </View>
                      <Text numberOfLines={2} style={[styles.tileLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
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
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: MIN_TOUCH,
    borderRadius: radius,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  search: { flex: 1, minHeight: MIN_TOUCH, fontSize: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  panel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tile: {
    width: '25%',
    minHeight: 88,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBordered: { borderWidth: 1 },
  tileLabel: { fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: fontSize.base, textAlign: 'center' },
  pressed: { opacity: 0.85 },
});
