import React, { useEffect, useRef } from "react"
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { Icon } from "../ui/Icon"
import { color, font } from "../ui/theme"
import { withAlpha } from "../ui/honor"

interface RecordCelebrationProps {
  score: number
  heroName: string
  onDismiss: () => void
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")

// Confetti particle
const Confetti = ({
  delay,
  startX,
  color,
  size,
  rotationSpeed,
}: {
  delay: number
  startX: number
  color: string
  size: number
  rotationSpeed: number
}) => {
  const translateY = useRef(new Animated.Value(-50)).current
  const translateX = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_H + 50,
          duration: 3000 + Math.random() * 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 200,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: rotationSpeed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ),
      ]),
    ]).start()
  }, [])

  const rotateStr = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate: rotateStr }],
        },
      ]}
    />
  )
}

// Sparkle particle
const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start()
  }, [])

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      ✦
    </Animated.Text>
  )
}

const RecordCelebration = ({
  score,
  heroName,
  onDismiss,
}: RecordCelebrationProps) => {
  // Main banner animations
  const bannerScale = useRef(new Animated.Value(0)).current
  const bannerOpacity = useRef(new Animated.Value(0)).current
  const glowOpacity = useRef(new Animated.Value(0.3)).current
  const trophyScale = useRef(new Animated.Value(0)).current
  const trophyRotate = useRef(new Animated.Value(0)).current

  // Festive but on-palette — gold ramp + ember/crimson + white-gold + parchment
  // (kills the off-brand blue #90CAF9 / pink #FF1744, DESIGN §1.3).
  const confettiColors = [
    color.goldBright,
    color.gold,
    color.ember,
    "#FFE08A", // white-gold accent
    color.crimson,
    color.parchment,
  ]

  useEffect(() => {
    // Banner zoom in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(bannerScale, {
          toValue: 1.2,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start()

    // Trophy bounce
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start()

    // Trophy wiggle
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotate, {
          toValue: -1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotate, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      onDismiss()
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  const trophyRotateStr = trophyRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-15deg", "15deg"],
  })

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={onDismiss}
    >
      {/* Pulsing gold glow background */}
      <Animated.View
        style={[styles.glowBackground, { opacity: glowOpacity }]}
      />

      {/* Sparkles scattered around */}
      {Array.from({ length: 15 }).map((_, i) => (
        <Sparkle
          key={`sparkle-${i}`}
          delay={i * 150}
          x={Math.random() * SCREEN_W}
          y={Math.random() * SCREEN_H}
        />
      ))}

      {/* Confetti falling */}
      {Array.from({ length: 40 }).map((_, i) => (
        <Confetti
          key={`conf-${i}`}
          delay={i * 60}
          startX={Math.random() * SCREEN_W}
          color={confettiColors[i % confettiColors.length]}
          size={6 + Math.random() * 6}
          rotationSpeed={600 + Math.random() * 800}
        />
      ))}

      {/* Main banner */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.banner,
          {
            opacity: bannerOpacity,
            transform: [{ scale: bannerScale }],
          },
        ]}
      >
        {/* Top stars */}
        <Text style={styles.starRow}>✦ ✦ ✦ ✦ ✦</Text>

        {/* Trophy */}
        <Animated.View
          style={[
            styles.trophy,
            {
              transform: [{ scale: trophyScale }, { rotate: trophyRotateStr }],
            },
          ]}
        >
          <Icon name="trophy-variant" size={50} color={color.goldBright} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.titleMain}>RECORD BROKEN</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>A NEW #1 WARRIOR</Text>

        {/* Name */}
        <Text style={styles.heroName}>{heroName}</Text>

        {/* Score */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>

        {/* Bottom stars */}
        <Text style={styles.starRow}>✦ ✦ ✦ ✦ ✦</Text>
      </Animated.View>

      {/* Tap hint */}
      <Text style={styles.tapHint}>tap to continue</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  glowBackground: {
    position: "absolute",
    top: "15%",
    left: "15%",
    right: "15%",
    bottom: "15%",
    backgroundColor: withAlpha(color.goldBright, 0.15),
    borderRadius: 300,
  },
  confetti: {
    position: "absolute",
    top: 0,
    borderRadius: 1,
  },
  sparkle: {
    position: "absolute",
    color: color.goldBright,
    fontSize: 16,
    textShadowColor: withAlpha(color.goldBright, 0.8),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  banner: {
    alignItems: "center",
    backgroundColor: "rgba(15,26,18,0.92)",
    borderWidth: 2.5,
    borderColor: color.goldBright,
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 14,
    shadowColor: color.goldBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    minWidth: 380,
  },
  starRow: {
    color: color.goldBright,
    fontSize: 10,
    letterSpacing: 8,
    textShadowColor: withAlpha(color.goldBright, 0.6),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  trophy: {
    marginVertical: 4,
  },
  titleMain: {
    color: color.goldBright,
    fontFamily: font.display,
    fontSize: 28,
    letterSpacing: 4,
    textShadowColor: withAlpha(color.goldBright, 0.8),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: withAlpha(color.goldBright, 0.5),
    marginVertical: 4,
  },
  subtitle: {
    color: withAlpha(color.goldBright, 0.7),
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 4,
  },
  heroName: {
    color: "#FFFFFF",
    fontFamily: font.heading,
    fontSize: 22,
    letterSpacing: 3,
    marginTop: 8,
    textShadowColor: withAlpha(color.goldBright, 0.4),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreBox: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  scoreLabel: {
    color: withAlpha(color.goldBright, 0.5),
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
  },
  scoreValue: {
    color: color.goldBright,
    fontFamily: font.display,
    fontSize: 26,
    textShadowColor: withAlpha(color.goldBright, 0.6),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tapHint: {
    position: "absolute",
    bottom: 30,
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
})

export default RecordCelebration
