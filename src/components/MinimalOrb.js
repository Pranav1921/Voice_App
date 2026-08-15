import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';

/**
 * MinimalOrb Component
 * Modern pearlescent 3D iridescent holographic glass orb matching reference mockup.
 * States: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
 */
export const MinimalOrb = ({ state = 'IDLE', onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const auraScale = useRef(new Animated.Value(1)).current;
  const auraOpacity = useRef(new Animated.Value(0.4)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop = null;

    if (state === 'LISTENING') {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.3, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 1.0, duration: 600, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(auraOpacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
            Animated.timing(auraOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.08, duration: 300, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.96, duration: 300, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else if (state === 'THINKING') {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(rotation, {
            toValue: 1,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.1, duration: 450, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0.94, duration: 450, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else if (state === 'SPEAKING') {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 380, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.96, duration: 380, useNativeDriver: true }),
        ])
      );
      animLoop.start();
    } else {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.98, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      animLoop.start();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [state]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      {/* Soft Ethereal Atmospheric Cyan Glow */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            transform: [{ scale: auraScale }],
            opacity: auraOpacity,
            backgroundColor:
              state === 'LISTENING'
                ? '#93C5FD'
                : state === 'THINKING'
                ? '#C084FC'
                : state === 'SPEAKING'
                ? '#86EFAC'
                : '#7DD3FC',
          },
        ]}
      />

      {/* Mid Soft Diffusion Ring */}
      <Animated.View
        style={[
          styles.midRing,
          {
            transform: [{ scale: pulseAnim }],
            borderColor:
              state === 'LISTENING'
                ? 'rgba(59, 130, 246, 0.35)'
                : state === 'THINKING'
                ? 'rgba(168, 85, 247, 0.35)'
                : 'rgba(56, 189, 248, 0.25)',
          },
        ]}
      />

      {/* Core 3D Iridescent Holographic Glass Sphere */}
      <Animated.View
        style={[
          styles.orbCore,
          {
            transform: [{ scale: pulseAnim }, { rotate: spin }],
          },
        ]}
      >
        {/* Layer 1: Core Blue Ocean Swirl */}
        <View style={styles.innerGradient1} />
        {/* Layer 2: Soft Violet Wave */}
        <View style={styles.innerGradient2} />
        {/* Layer 3: Warm Gold Sun Reflection */}
        <View style={styles.innerGradient3} />
        {/* Layer 4: Glass Specular Highlight Curve */}
        <View style={styles.glassHighlight} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  glowAura: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.4,
  },
  midRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1.5,
  },
  orbCore: {
    width: 175,
    height: 175,
    borderRadius: 87.5,
    backgroundColor: '#38BDF8',
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  innerGradient1: {
    position: 'absolute',
    top: -25,
    left: -25,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#3B82F6',
    opacity: 0.85,
  },
  innerGradient2: {
    position: 'absolute',
    top: 30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#818CF8',
    opacity: 0.6,
  },
  innerGradient3: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FDE047',
    opacity: 0.5,
  },
  glassHighlight: {
    position: 'absolute',
    top: 16,
    left: 24,
    width: 65,
    height: 40,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    transform: [{ rotate: '-28deg' }],
  },
});
