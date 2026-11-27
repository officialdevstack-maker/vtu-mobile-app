import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { MaxContentWidth } from '@/constants/theme';
import { SERVICE_ICON } from '@/lib/service-icons';
import { completeOnboarding, retryLoadOnboarding, useOnboarding } from '@/onboarding/store';
import { fontSize, MIN_TOUCH, useColors } from '@/theme';

type Slide = {
  title: string;
  body: string;
  icon: SymbolViewProps['name'];
};

const SLIDES: readonly Slide[] = [
  {
    title: 'One wallet for your bills',
    body: 'Buy airtime, data, cable TV and electricity from a single wallet.',
    icon: SERVICE_ICON.wallet,
  },
  {
    title: 'Fast and protected',
    body: 'Every purchase is confirmed with your 4-digit transaction PIN, so only you can spend your money.',
    icon: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  },
  {
    title: 'Earn as you spend',
    body: 'Get cashback on purchases and rewards when friends join with your referral code.',
    icon: { ios: 'gift.fill', android: 'redeem', web: 'redeem' },
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const onboarding = useOnboarding();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const last = index === SLIDES.length - 1;

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(Math.max(next, 0), SLIDES.length - 1));
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await completeOnboarding();
    } catch {
      setSaveError("We couldn't save your progress. Please try again.");
      setSaving(false);
    }
  }

  async function retryLoading() {
    setRetrying(true);
    await retryLoadOnboarding();
    setRetrying(false);
  }

  function next() {
    if (last) {
      void finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    setIndex(index + 1);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        {last ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            hitSlop={8}
            onPress={() => void finish()}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}>
        {SLIDES.map((slide, slideIndex) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View
              accessible
              accessibilityLabel={`Page ${slideIndex + 1} of ${SLIDES.length}. ${slide.title}. ${slide.body}`}
              style={styles.slideContent}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
                <SymbolView tintColor={colors.onPrimary} name={slide.icon} size={44} />
              </View>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
                {slide.title}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{slide.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {onboarding.error || saveError ? (
          <View style={styles.storageError}>
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={[styles.error, { color: colors.danger }]}>
              {saveError ?? onboarding.error}
            </Text>
            {onboarding.error ? (
              <Button
                label="Retry"
                variant="secondary"
                onPress={() => void retryLoading()}
                loading={retrying}
              />
            ) : null}
          </View>
        ) : null}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.dots}>
          {SLIDES.map((slide, dotIndex) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                dotIndex === index
                  ? { width: 18, backgroundColor: colors.text }
                  : { width: 6, backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>
        <View style={styles.action}>
          <Button label={last ? 'Get started' : 'Next'} onPress={next} loading={saving} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    height: MIN_TOUCH + 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  skip: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 8 },
  skipText: { fontSize: fontSize.md, fontWeight: '700' },
  pager: { flex: 1 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  slideContent: { width: '100%', maxWidth: 420, alignItems: 'center', gap: 16 },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: fontSize.md, lineHeight: 24, textAlign: 'center' },
  footer: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  storageError: { width: '100%', maxWidth: MaxContentWidth, gap: 8 },
  error: { fontSize: fontSize.base, lineHeight: 20, textAlign: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  action: { width: '100%', maxWidth: MaxContentWidth },
  pressed: { opacity: 0.85 },
});
