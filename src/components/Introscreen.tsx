import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

const INTRO_KEY = "@mythic_intro_seen"

interface IntroScreenProps {
  onComplete: () => void
}

const TUTORIAL_SLIDES = [
  {
    icon: "🃏",
    title: "Match Cards",
    desc: "Tap cards that are +1 or -1 from your open card\nAce wraps — it matches both 2 and King",
    example: "7 → 6 or 8    K → Q or A",
  },
  {
    icon: "🔥",
    title: "Build Combos",
    desc: "Chain matches without drawing from the deck\nBigger combos = massive point multipliers",
    example: "x3 = 2×  •  x5 = 3.5×  •  x10 = 8×",
  },
  {
    icon: "⚡",
    title: "Wild Card",
    desc: "Reach combo 5 to earn a Wild Card\nUse it to match ANY card when you're stuck",
    example: "One per game — use it wisely!",
  },
]

const IntroScreen = ({ onComplete }: IntroScreenProps) => {
  const [phase, setPhase] = useState<"intro" | "tutorial">("intro")
  const [slideIndex, setSlideIndex] = useState(0)

  // Intro animations
  const bgOpacity = useRef(new Animated.Value(0)).current
  const beast1 = useRef(new Animated.Value(0)).current
  const beast2 = useRef(new Animated.Value(0)).current
  const beast3 = useRef(new Animated.Value(0)).current
  const beast4 = useRef(new Animated.Value(0)).current
  const titleScale = useRef(new Animated.Value(0.3)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const subtitleOpacity = useRef(new Animated.Value(0)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current
  const flashOpacity = useRef(new Animated.Value(0)).current
  const tapOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const seq = Animated.sequence([
      // Bg fade in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Beasts appear one by one
      Animated.stagger(200, [
        Animated.spring(beast1, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(beast2, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(beast3, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(beast4, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      // Flash
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Title slam in
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(150),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(100),
      // Tagline
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      // Tap to continue
      Animated.timing(tapOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ])
    seq.start()
  }, [])

  const handleIntroTap = () => setPhase("tutorial")

  const handleNext = async () => {
    if (slideIndex < TUTORIAL_SLIDES.length - 1) {
      setSlideIndex((i) => i + 1)
    } else {
      await AsyncStorage.setItem(INTRO_KEY, "true")
      onComplete()
    }
  }

  if (phase === "intro") {
    return (
      <TouchableOpacity
        style={styles.container}
        activeOpacity={1}
        onPress={handleIntroTap}
      >
        <Animated.View style={[styles.bg, { opacity: bgOpacity }]}>
          {/* Beasts appearing */}
          <View style={styles.beastRow}>
            <Animated.Text
              style={[
                styles.beast,
                { opacity: beast1, transform: [{ scale: beast1 }] },
              ]}
            >
              🐉
            </Animated.Text>
            <Animated.Text
              style={[
                styles.beast,
                { opacity: beast2, transform: [{ scale: beast2 }] },
              ]}
            >
              🦅
            </Animated.Text>
            <Animated.Text
              style={[
                styles.beast,
                { opacity: beast3, transform: [{ scale: beast3 }] },
              ]}
            >
              🐺
            </Animated.Text>
            <Animated.Text
              style={[
                styles.beast,
                { opacity: beast4, transform: [{ scale: beast4 }] },
              ]}
            >
              🐍
            </Animated.Text>
          </View>

          {/* Title */}
          <Animated.Text
            style={[
              styles.title,
              { opacity: titleOpacity, transform: [{ scale: titleScale }] },
            ]}
          >
            MYTHIC PEAKS
          </Animated.Text>
          <Animated.Text
            style={[styles.subtitle, { opacity: subtitleOpacity }]}
          >
            A Card Game of Beasts & Glory
          </Animated.Text>
          <Animated.View
            style={[styles.divider, { opacity: taglineOpacity }]}
          />
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            5 Battlefields • 4 Beast Clans • Infinite Glory
          </Animated.Text>

          {/* Tap prompt */}
          <Animated.Text style={[styles.tapText, { opacity: tapOpacity }]}>
            Tap to continue
          </Animated.Text>
        </Animated.View>

        {/* Flash overlay */}
        <Animated.View
          style={[styles.flash, { opacity: flashOpacity }]}
          pointerEvents="none"
        />
      </TouchableOpacity>
    )
  }

  // Tutorial slides
  const slide = TUTORIAL_SLIDES[slideIndex]
  const isLast = slideIndex === TUTORIAL_SLIDES.length - 1

  return (
    <View style={styles.container}>
      <View style={styles.tutorialCard}>
        <Text style={styles.slideIcon}>{slide.icon}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideDesc}>{slide.desc}</Text>
        <View style={styles.exampleBox}>
          <Text style={styles.exampleText}>{slide.example}</Text>
        </View>
      </View>

      {/* Dots */}
      <View style={styles.dotRow}>
        {TUTORIAL_SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === slideIndex && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextBtn}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextBtnText}>
          {isLast ? "⚔ Enter the Arena" : "Next →"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.skipHint}>
        {slideIndex + 1} / {TUTORIAL_SLIDES.length}
      </Text>
    </View>
  )
}

// Check if intro has been seen
export const hasSeenIntro = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(INTRO_KEY)
    return val === "true"
  } catch {
    return false
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A12",
    justifyContent: "center",
    alignItems: "center",
  },
  bg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  beastRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  beast: { fontSize: 36 },

  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#E8C547",
    letterSpacing: 6,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  subtitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 2,
    marginTop: 4,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
    marginVertical: 10,
  },
  tagline: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
  tapText: {
    position: "absolute",
    bottom: 30,
    color: "rgba(232,197,71,0.35)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
  },

  flash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E8C547",
  },

  // Tutorial
  tutorialCard: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
    width: "80%",
  },
  slideIcon: { fontSize: 40, marginBottom: 10 },
  slideTitle: {
    color: "#E8C547",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
  },
  slideDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  exampleBox: {
    marginTop: 12,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
  },
  exampleText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },

  dotRow: { flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 16 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(232,197,71,0.15)",
  },
  dotActive: { backgroundColor: "#E8C547", width: 20 },

  nextBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 180,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },

  skipHint: { color: "rgba(255,255,255,0.15)", fontSize: 10, marginTop: 10 },
})

export default IntroScreen
