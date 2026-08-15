import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity, Text } from 'react-native';

/**
 * GeminiVisualizer Component
 * Authentic Google Gemini Live 4-Color Glowing Audio Waveform & Fluid Visualizer.
 * Colors: Google Blue (#4285F4), Coral Red (#EA4335), Amber Yellow (#FBBC05), Emerald Green (#34A853)
 * States: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
 */
export const GeminiVisualizer = ({ state = 'IDLE', onPress, disabled = false }) => {
  // 5 Audio Waveform Bar animations
  const barAnim1 = useRef(new Animated.Value(0.3)).current;
  const barAnim2 = useRef(new Animated.Value(0.6)).current;
  const barAnim3 = useRef(new Animated.Value(1.0)).current;
  const barAnim4 = useRef(new Animated.Value(0.6)).current;
  const barAnim5 = useRef(new Animated.Value(0.3)).current;

  // Aura rotation and scale animations
  const auraScale = useRef(new Animated.Value(1)).current;
  const auraRotate = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    let animLoop = null;

    if (state === 'LISTENING') {
      // Dynamic jumping audio frequency bars
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(barAnim1, { toValue: 1.0, duration: 250, useNativeDriver: true }),
            Animated.timing(barAnim1, { toValue: 0.2, duration: 250, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim2, { toValue: 1.4, duration: 180, useNativeDriver: true }),
            Animated.timing(barAnim2, { toValue: 0.3, duration: 220, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim3, { toValue: 1.6, duration: 200, useNativeDriver: true }),
            Animated.timing(barAnim3, { toValue: 0.4, duration: 200, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim4, { toValue: 1.3, duration: 220, useNativeDriver: true }),
            Animated.timing(barAnim4, { toValue: 0.2, duration: 180, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim5, { toValue: 0.9, duration: 260, useNativeDriver: true }),
            Animated.timing(barAnim5, { toValue: 0.2, duration: 240, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.15, duration: 400, useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 1.0, duration: 400, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else if (state === 'THINKING') {
      // Gemini rotating galaxy swirl
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(auraRotate, {
            toValue: 1,
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(auraScale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
            Animated.timing(auraScale, { toValue: 0.95, duration: 500, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim3, { toValue: 0.8, duration: 300, useNativeDriver: true }),
            Animated.timing(barAnim3, { toValue: 0.4, duration: 300, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else if (state === 'SPEAKING') {
      // Harmonic voice speech waveform
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(barAnim1, { toValue: 0.8, duration: 280, useNativeDriver: true }),
            Animated.timing(barAnim1, { toValue: 0.3, duration: 280, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim2, { toValue: 1.2, duration: 220, useNativeDriver: true }),
            Animated.timing(barAnim2, { toValue: 0.4, duration: 220, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim3, { toValue: 1.5, duration: 190, useNativeDriver: true }),
            Animated.timing(barAnim3, { toValue: 0.5, duration: 190, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim4, { toValue: 1.1, duration: 240, useNativeDriver: true }),
            Animated.timing(barAnim4, { toValue: 0.3, duration: 240, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim5, { toValue: 0.7, duration: 300, useNativeDriver: true }),
            Animated.timing(barAnim5, { toValue: 0.2, duration: 300, useNativeDriver: true }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      // IDLE: Soft gentle Gemini breathing
      barAnim1.setValue(0.35);
      barAnim2.setValue(0.55);
      barAnim3.setValue(0.75);
      barAnim4.setValue(0.55);
      barAnim5.setValue(0.35);

      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(auraScale, { toValue: 1.05, duration: 1600, useNativeDriver: true }),
          Animated.timing(auraScale, { toValue: 1.0, duration: 1600, useNativeDriver: true }),
        ])
      );
      animLoop.start();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [state, barAnim1, barAnim2, barAnim3, barAnim4, barAnim5, auraScale, auraRotate]);

  const spin = auraRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={styles.container}
    >
      {/* Outer Gemini Multi-Color Glowing Gradient Ring */}
      <Animated.View
        style={[
          styles.outerAura,
          {
            transform: [{ scale: auraScale }, { rotate: spin }],
            opacity: glowOpacity,
          },
        ]}
      >
        <View style={styles.colorDotBlue} />
        <View style={styles.colorDotRed} />
        <View style={styles.colorDotYellow} />
        <View style={styles.colorDotGreen} />
      </Animated.View>

      {/* Dark Core Circle */}
      <View style={styles.coreCircle}>
        {/* Dynamic 5-Bar Live Audio Waveform */}
        <View style={styles.waveformContainer}>
          <Animated.View
            style={[
              styles.waveBar,
              styles.barBlue,
              { transform: [{ scaleY: barAnim1 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.waveBar,
              styles.barRed,
              { transform: [{ scaleY: barAnim2 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.waveBar,
              styles.barYellow,
              { transform: [{ scaleY: barAnim3 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.waveBar,
              styles.barGreen,
              { transform: [{ scaleY: barAnim4 }] },
            ]}
          />
          <Animated.View
            style={[
              styles.waveBar,
              styles.barBlue,
              { transform: [{ scaleY: barAnim5 }] },
            ]}
          />
        </View>

        {state === 'SPEAKING' && (
          <Text style={styles.tapToStopHint}>Tap to interrupt</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  outerAura: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(66, 133, 244, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(66, 133, 244, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotBlue: {
    position: 'absolute',
    top: 6,
    left: 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    shadowColor: '#4285F4',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  colorDotRed: {
    position: 'absolute',
    top: 6,
    right: 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    shadowColor: '#EA4335',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  colorDotYellow: {
    position: 'absolute',
    bottom: 6,
    left: 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBBC05',
    shadowColor: '#FBBC05',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  colorDotGreen: {
    position: 'absolute',
    bottom: 6,
    right: 28,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34A853',
    shadowColor: '#34A853',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  coreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0A0F1D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 48,
  },
  waveBar: {
    width: 5.5,
    height: 38,
    borderRadius: 4,
  },
  barBlue: {
    backgroundColor: '#4285F4',
    shadowColor: '#4285F4',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  barRed: {
    backgroundColor: '#EA4335',
    shadowColor: '#EA4335',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  barYellow: {
    backgroundColor: '#FBBC05',
    shadowColor: '#FBBC05',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  barGreen: {
    backgroundColor: '#34A853',
    shadowColor: '#34A853',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  tapToStopHint: {
    position: 'absolute',
    bottom: 12,
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default GeminiVisualizer;
