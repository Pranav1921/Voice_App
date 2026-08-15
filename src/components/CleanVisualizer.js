import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Text, Easing } from 'react-native';

/**
 * CleanVisualizer Component
 * Futuristic 7-Bar Cyberpunk / Holographic Soundwave Orb Visualizer.
 * States: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
 */
export const CleanVisualizer = ({ state = 'IDLE', onPress, disabled = false }) => {
  // 7 Sound Wave Frequency Bars
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.8)).current;
  const bar4 = useRef(new Animated.Value(1.0)).current;
  const bar5 = useRef(new Animated.Value(0.8)).current;
  const bar6 = useRef(new Animated.Value(0.5)).current;
  const bar7 = useRef(new Animated.Value(0.3)).current;

  // Concentric Aura & Ring Animations
  const auraScale = useRef(new Animated.Value(1)).current;
  const auraPulse = useRef(new Animated.Value(1)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop = null;

    if (state === 'LISTENING') {
      // High-energy dynamic recording sound waves (Crimson / Neon Red)
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bar1, { toValue: 1.1, duration: 180, useNativeDriver: true }),
            Animated.timing(bar1, { toValue: 0.2, duration: 180, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar2, { toValue: 1.5, duration: 150, useNativeDriver: true }),
            Animated.timing(bar2, { toValue: 0.3, duration: 170, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar3, { toValue: 1.8, duration: 130, useNativeDriver: true }),
            Animated.timing(bar3, { toValue: 0.4, duration: 140, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar4, { toValue: 2.1, duration: 160, useNativeDriver: true }),
            Animated.timing(bar4, { toValue: 0.5, duration: 160, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar5, { toValue: 1.8, duration: 140, useNativeDriver: true }),
            Animated.timing(bar5, { toValue: 0.4, duration: 130, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar6, { toValue: 1.5, duration: 170, useNativeDriver: true }),
            Animated.timing(bar6, { toValue: 0.3, duration: 150, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar7, { toValue: 1.1, duration: 180, useNativeDriver: true }),
            Animated.timing(bar7, { toValue: 0.2, duration: 180, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.22, duration: 300, useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 1.0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(auraPulse, { toValue: 1.4, duration: 600, useNativeDriver: true }),
            Animated.timing(auraPulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else if (state === 'THINKING') {
      // Rotating nebula AI pulse (Violet / Indigo)
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(ringRotate, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.15, duration: 450, useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 0.95, duration: 450, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar4, { toValue: 1.2, duration: 250, useNativeDriver: true }),
            Animated.timing(bar4, { toValue: 0.4, duration: 250, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else if (state === 'SPEAKING') {
      // Harmonic voice speech waves (Emerald / Mint Green)
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(bar1, { toValue: 0.9, duration: 220, useNativeDriver: true }),
            Animated.timing(bar1, { toValue: 0.3, duration: 220, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar2, { toValue: 1.3, duration: 190, useNativeDriver: true }),
            Animated.timing(bar2, { toValue: 0.4, duration: 190, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar3, { toValue: 1.6, duration: 160, useNativeDriver: true }),
            Animated.timing(bar3, { toValue: 0.5, duration: 160, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar4, { toValue: 1.9, duration: 180, useNativeDriver: true }),
            Animated.timing(bar4, { toValue: 0.6, duration: 180, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar5, { toValue: 1.6, duration: 160, useNativeDriver: true }),
            Animated.timing(bar5, { toValue: 0.5, duration: 160, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar6, { toValue: 1.3, duration: 190, useNativeDriver: true }),
            Animated.timing(bar6, { toValue: 0.4, duration: 190, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bar7, { toValue: 0.9, duration: 220, useNativeDriver: true }),
            Animated.timing(bar7, { toValue: 0.3, duration: 220, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.12, duration: 350, useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 1.0, duration: 350, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      // IDLE: Serene breathing aura (Electric Cyan)
      bar1.setValue(0.35);
      bar2.setValue(0.55);
      bar3.setValue(0.8);
      bar4.setValue(1.0);
      bar5.setValue(0.8);
      bar6.setValue(0.55);
      bar7.setValue(0.35);

      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 1.0, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(auraPulse, { toValue: 1.15, duration: 2200, useNativeDriver: true }),
            Animated.timing(auraPulse, { toValue: 1.0, duration: 2200, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [state, bar1, bar2, bar3, bar4, bar5, bar6, bar7, auraScale, auraPulse, ringRotate]);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getTheme = () => {
    switch (state) {
      case 'LISTENING':
        return {
          primary: '#EF4444',
          secondary: '#F43F5E',
          glowBg: 'rgba(239, 68, 68, 0.2)',
          ringBorder: 'rgba(239, 68, 68, 0.6)',
          statusText: 'RECORDING',
          icon: '🎙️',
        };
      case 'THINKING':
        return {
          primary: '#A855F7',
          secondary: '#6366F1',
          glowBg: 'rgba(168, 85, 247, 0.2)',
          ringBorder: 'rgba(168, 85, 247, 0.6)',
          statusText: 'AI THINKING',
          icon: '⚡',
        };
      case 'SPEAKING':
        return {
          primary: '#10B981',
          secondary: '#06B6D4',
          glowBg: 'rgba(16, 185, 129, 0.2)',
          ringBorder: 'rgba(16, 185, 129, 0.6)',
          statusText: 'SPEAKING',
          icon: '🔊',
        };
      default:
        return {
          primary: '#38BDF8',
          secondary: '#818CF8',
          glowBg: 'rgba(56, 189, 248, 0.15)',
          ringBorder: 'rgba(56, 189, 248, 0.4)',
          statusText: 'READY',
          icon: '✨',
        };
    }
  };

  const theme = getTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled}
      style={styles.container}
    >
      {/* Outer Holographic Radar Glow */}
      <Animated.View
        style={[
          styles.outerHalo,
          {
            backgroundColor: theme.glowBg,
            borderColor: theme.ringBorder,
            transform: [{ scale: auraPulse }],
          },
        ]}
      />

      {/* Middle Rotating Geometric Aura */}
      <Animated.View
        style={[
          styles.middleAura,
          {
            borderColor: theme.primary,
            transform: [{ scale: auraScale }, { rotate: spin }],
          },
        ]}
      />

      {/* Inner Core Cyber Circle with 7 Equalizer Bars */}
      <View style={[styles.coreCircle, { borderColor: theme.primary }]}>
        <View style={styles.waveformRow}>
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.primary, transform: [{ scaleY: bar1 }] }]}
          />
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.primary, transform: [{ scaleY: bar2 }] }]}
          />
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.secondary, transform: [{ scaleY: bar3 }] }]}
          />
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.primary, transform: [{ scaleY: bar4 }] }]}
          />
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.secondary, transform: [{ scaleY: bar5 }] }]}
          />
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.primary, transform: [{ scaleY: bar6 }] }]}
          />
          <Animated.View
            style={[styles.waveBar, { backgroundColor: theme.primary, transform: [{ scaleY: bar7 }] }]}
          />
        </View>

        {/* State Badge Label */}
        <View style={styles.centerBadge}>
          <Text style={[styles.centerBadgeText, { color: theme.primary }]}>
            {state === 'SPEAKING' ? 'TAP TO STOP' : state === 'LISTENING' ? 'RECORDING' : theme.statusText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  outerHalo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
  },
  middleAura: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderRadius: 77.5,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  coreCircle: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    backgroundColor: '#070C18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 48,
    marginTop: 4,
  },
  waveBar: {
    width: 4.5,
    height: 36,
    borderRadius: 3,
  },
  centerBadge: {
    marginTop: 6,
  },
  centerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default CleanVisualizer;
