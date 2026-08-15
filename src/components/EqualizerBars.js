import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

/**
 * EqualizerBars Component
 * Fluid, rhythmic soundwave equalizer bars that animate during speech.
 */
export const EqualizerBars = ({ isAnimating = true }) => {
  const bar1 = useRef(new Animated.Value(12)).current;
  const bar2 = useRef(new Animated.Value(22)).current;
  const bar3 = useRef(new Animated.Value(8)).current;
  const bar4 = useRef(new Animated.Value(26)).current;
  const bar5 = useRef(new Animated.Value(14)).current;
  const bar6 = useRef(new Animated.Value(18)).current;
  const bar7 = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!isAnimating) {
      Animated.parallel([
        Animated.timing(bar1, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(bar2, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(bar3, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(bar4, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(bar5, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(bar6, { toValue: 6, duration: 200, useNativeDriver: false }),
        Animated.timing(bar7, { toValue: 6, duration: 200, useNativeDriver: false }),
      ]).start();
      return;
    }

    const createBarAnim = (animVal, minH, maxH, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animVal, {
            toValue: maxH,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animVal, {
            toValue: minH,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
    };

    const anim1 = createBarAnim(bar1, 6, 24, 320);
    const anim2 = createBarAnim(bar2, 8, 36, 420);
    const anim3 = createBarAnim(bar3, 6, 18, 260);
    const anim4 = createBarAnim(bar4, 10, 38, 480);
    const anim5 = createBarAnim(bar5, 6, 28, 350);
    const anim6 = createBarAnim(bar6, 8, 32, 400);
    const anim7 = createBarAnim(bar7, 6, 20, 290);

    anim1.start();
    anim2.start();
    anim3.start();
    anim4.start();
    anim5.start();
    anim6.start();
    anim7.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      anim4.stop();
      anim5.stop();
      anim6.stop();
      anim7.stop();
    };
  }, [isAnimating]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { height: bar1, backgroundColor: '#38BDF8' }]} />
      <Animated.View style={[styles.bar, { height: bar2, backgroundColor: '#0284C7' }]} />
      <Animated.View style={[styles.bar, { height: bar3, backgroundColor: '#6366F1' }]} />
      <Animated.View style={[styles.bar, { height: bar4, backgroundColor: '#8B5CF6' }]} />
      <Animated.View style={[styles.bar, { height: bar5, backgroundColor: '#6366F1' }]} />
      <Animated.View style={[styles.bar, { height: bar6, backgroundColor: '#0284C7' }]} />
      <Animated.View style={[styles.bar, { height: bar7, backgroundColor: '#38BDF8' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    gap: 5,
    marginVertical: 6,
  },
  bar: {
    width: 4.5,
    borderRadius: 3,
    minHeight: 4,
  },
});
