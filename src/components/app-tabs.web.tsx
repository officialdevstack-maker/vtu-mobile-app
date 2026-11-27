import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

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
  return (
    <View style={styles.tabButtonView}>
      <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
        {children}
      </ThemedText>
    </View>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Spur VTU
        </ThemedText>

        {props.children}
      </ThemedView>
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
  brandText: {
    marginRight: 'auto',
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
