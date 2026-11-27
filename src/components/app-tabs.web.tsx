import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fontSize, useColors } from '@/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList>
        <CustomTabList>
          <TabTrigger name="home" href="/">
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="services" href="/services">
            <TabButton>Services</TabButton>
          </TabTrigger>
          <TabTrigger name="rewards" href="/rewards">
            <TabButton>Rewards</TabButton>
          </TabTrigger>
          <TabTrigger name="history" href="/history">
            <TabButton>History</TabButton>
          </TabTrigger>
          <TabTrigger name="me" href="/me">
            <TabButton>Me</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused }: TabTriggerSlotProps) {
  const colors = useColors();
  return (
    <View style={styles.tabButtonView}>
      <Text style={[styles.tabText, { color: isFocused ? colors.text : colors.textSecondary }]}>
        {children}
      </Text>
    </View>
  );
}

export function CustomTabList(props: TabListProps) {
  const colors = useColors();
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={[styles.innerContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.brandText, { color: colors.text }]}>Spur VTU</Text>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: { marginRight: 'auto', fontSize: fontSize.base, fontWeight: '700' },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  tabText: { fontSize: fontSize.base, fontWeight: '600' },
});
