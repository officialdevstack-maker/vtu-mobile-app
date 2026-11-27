import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { useSession } from '@/auth/session';
import { reportError } from '@/lib/report-error';
import { brand } from '@/theme';

const MIN_VISIBLE_MS = 1_400;
const FADE_OUT_MS = 350;

export function SplashOverlay() {
  const { isLoading } = useSession();
  const reduceMotion = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (minElapsed && !isLoading) return null;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      exiting={reduceMotion ? undefined : FadeOut.duration(FADE_OUT_MS)}
      onLayout={() => {
        void SplashScreen.hideAsync().catch(() => {
          reportError({ source: 'splash.hide' });
        });
      }}
      style={styles.overlay}>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Text style={styles.markText}>S</Text>
        </View>
        <Animated.Text
          entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(450)}
          style={styles.name}>
          Spur VTU
        </Animated.Text>
        <Animated.Text
          entering={reduceMotion ? undefined : FadeIn.delay(350).duration(450)}
          style={styles.tagline}>
          Airtime, data, cable TV and electricity
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: brand.petrol,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  center: { alignItems: 'center', gap: 12 },
  mark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: brand.marigold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: 40, fontWeight: '700', color: brand.petrol },
  name: { fontSize: 28, fontWeight: '700', color: brand.paper, marginTop: 4 },
  tagline: { fontSize: 14, color: '#BCD0D4', textAlign: 'center', maxWidth: 260 },
});
