import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ReturnToCastle from "./ReturnToCastle"

const INTRO_KEY = "@mythic_intro_seen"

interface IntroScreenProps {
  onComplete: () => void
  skipAnimation?: boolean
  showReturnButton?: boolean // NEW
  onReturnHome?: () => void // NEW
}

const TUTORIAL_SLIDES = [
  {
    icon: "🃏",
    title: "Match Cards",
    desc: "You have one open card at the bottom.\nTap any field card that is one higher or one lower.\n\nAce is special — it connects King and 2.",
    example: "Open card is 7 → tap 6 or 8",
  },
  {
    icon: "🔥",
    title: "Combo is Everything",
    desc: "Every match without drawing from the deck adds to your combo.\n\nHigher combo = more points per card.\nThis is the most important thing in the game.",
    example: "x5 = 4×  ·  x10 = 12×  ·  x20 = 40×",
  },
  {
    icon: "⚡",
    title: "Never Break Your Combo",
    desc: "Drawing from the deck resets your combo to zero.\n\nOnly draw when you have no other choice.\nEvery extra match without drawing is worth it.",
    example: "Match → Match → Match → big points 💰",
  },
  {
    icon: "🃏",
    title: "Wild Cards",
    desc: "Build a combo of 10 to earn a Wild Card.\nA Wild Card matches ANY card on the field.\n\nUse it to keep your combo alive when you're stuck.",
    example: "Combo x10 = 1 Wild  ·  Combo x20 = 2 Wilds",
  },
  {
    icon: "💰",
    title: "Bounty Cards",
    desc: "Two special cards are hidden on every battlefield.\nThey look different from normal cards.\n\nMatch them for 5× points!",
    example: "Normal card = 500pts  ·  Bounty card = 2500pts",
  },
  {
    icon: "⚡",
    title: "Carry Your Combo",
    desc: "When 7 or fewer cards are left on the field\nand your combo is higher than the remaining cards —\nyou can carry your combo to the next battlefield!",
    example: "x15 combo − 3 cards left = carry x12 🔥",
  },
  {
    icon: "🏔",
    title: "6 Battlefields",
    desc: "Each run has 6 battlefields.\nLater battlefields give bigger point multipliers.\n\nClear all cards on a field for a massive bonus!",
    example: "Field 1 = 1×  →  Field 6 = 3.5× points",
  },
  {
    icon: "⚔",
    title: "Glory Hunt",
    desc: "Before battle you can activate Glory Hunt.\nDouble points — but only half the time!\n\nOne charge per run. Use it on your best layout.",
    example: "2× points · 50% time · High risk, high reward",
  },
  {
    icon: "🏆",
    title: "Monthly Prizes",
    desc: "Every month the top 3 warriors win real money.\nScores reset monthly so everyone starts equal.\n\nPlay daily quests for the best chance to win!",
    example: "🥇 €50  ·  🥈 €30  ·  🥉 €20",
  },
]

const IntroScreen = ({
  onComplete,
  skipAnimation = false,
  showReturnButton = false,
  onReturnHome,
}: IntroScreenProps) => {
  const [slideIndex, setSlideIndex] = useState(0)

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
  const slideOpacity = useRef(new Animated.Value(1)).current
  const slideSlide = useRef(new Animated.Value(0)).current

  const [phase, setPhase] = useState<"intro" | "tutorial">(
    skipAnimation ? "tutorial" : "intro",
  )

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
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
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(100),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.timing(tapOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleIntroTap = () => setPhase("tutorial")

  const animateSlideTransition = (newIndex: number) => {
    Animated.parallel([
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideSlide, {
        toValue: -20,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSlideIndex(newIndex)
      slideSlide.setValue(20)
      Animated.parallel([
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideSlide, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }

  const handleNext = async () => {
    if (slideIndex < TUTORIAL_SLIDES.length - 1) {
      animateSlideTransition(slideIndex + 1)
    } else {
      await AsyncStorage.setItem(INTRO_KEY, "true")
      onComplete()
    }
  }

  const handleBack = () => {
    if (slideIndex > 0) {
      animateSlideTransition(slideIndex - 1)
    }
  }

  if (phase === "intro") {
    return (
      <TouchableOpacity
        style={z.container}
        activeOpacity={1}
        onPress={handleIntroTap}
      >
        <Animated.View style={[z.bg, { opacity: bgOpacity }]}>
          {/* Background atmosphere */}
          <View style={z.bgLayer} pointerEvents="none">
            <Text style={[z.bgRune, { top: "12%", left: "8%" }]}>ᚠ</Text>
            <Text style={[z.bgRune, { top: "18%", right: "10%" }]}>ᚦ</Text>
            <Text style={[z.bgRune, { bottom: "20%", left: "12%" }]}>ᚱ</Text>
            <Text style={[z.bgRune, { bottom: "25%", right: "8%" }]}>ᛟ</Text>
          </View>

          {/* Beasts */}
          <View style={z.beastRow}>
            <Animated.Text
              style={[
                z.beast,
                { opacity: beast1, transform: [{ scale: beast1 }] },
              ]}
            >
              🐉
            </Animated.Text>
            <Animated.Text
              style={[
                z.beast,
                { opacity: beast2, transform: [{ scale: beast2 }] },
              ]}
            >
              🦅
            </Animated.Text>
            <Animated.Text
              style={[
                z.beast,
                { opacity: beast3, transform: [{ scale: beast3 }] },
              ]}
            >
              🐺
            </Animated.Text>
            <Animated.Text
              style={[
                z.beast,
                { opacity: beast4, transform: [{ scale: beast4 }] },
              ]}
            >
              🐍
            </Animated.Text>
          </View>

          {/* Title */}
          <Animated.Text
            style={[
              z.title,
              { opacity: titleOpacity, transform: [{ scale: titleScale }] },
            ]}
          >
            MYTHIC PEAKS
          </Animated.Text>
          <Animated.Text style={[z.subtitle, { opacity: subtitleOpacity }]}>
            A Card Game of Beasts & Glory
          </Animated.Text>
          <Animated.View style={[z.divider, { opacity: taglineOpacity }]} />
          <Animated.Text style={[z.tagline, { opacity: taglineOpacity }]}>
            6 Battlefields · 4 Beast Clans · Infinite Glory
          </Animated.Text>

          <Animated.Text style={[z.tapText, { opacity: tapOpacity }]}>
            Tap to continue
          </Animated.Text>
        </Animated.View>

        <Animated.View
          style={[z.flash, { opacity: flashOpacity }]}
          pointerEvents="none"
        />
      </TouchableOpacity>
    )
  }

  const slide = TUTORIAL_SLIDES[slideIndex]
  const isLast = slideIndex === TUTORIAL_SLIDES.length - 1
  const isFirst = slideIndex === 0

  return (
    <View style={z.container}>
      {/* Background */}
      <View style={z.bgLayer} pointerEvents="none">
        <Text style={[z.bgRune, { top: "10%", left: "6%" }]}>ᚠ</Text>
        <Text style={[z.bgRune, { top: "14%", right: "8%" }]}>ᚦ</Text>
        <Text style={[z.bgRune, { bottom: "16%", left: "10%" }]}>ᚱ</Text>
        <Text style={[z.bgRune, { bottom: "20%", right: "6%" }]}>ᛟ</Text>
        <View style={z.bgHLine} />
      </View>

      {/* Header */}
      <View style={z.tutHeader}>
        <View style={z.headerOrn}>
          <View style={z.ornLine} />
          <Text style={z.ornDot}>◆</Text>
          <View style={z.ornLine} />
        </View>
        <Text style={z.tutHeaderTitle}>HOW TO PLAY</Text>
      </View>

      {/* Slide content — horizontal layout */}
      <Animated.View
        style={[
          z.slideRow,
          { opacity: slideOpacity, transform: [{ translateX: slideSlide }] },
        ]}
      >
        {/* Left — Icon + Title */}
        <View style={z.slideLeft}>
          <View style={z.iconWrap}>
            <Text style={z.slideIcon}>{slide.icon}</Text>
          </View>
          <Text style={z.slideTitle}>{slide.title}</Text>
        </View>

        {/* Right — Description + Example */}
        <View style={z.slideRight}>
          <Text style={z.slideDesc}>{slide.desc}</Text>
          <View style={z.exampleBox}>
            <Text style={z.exampleText}>{slide.example}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Dots */}
      <View style={z.dotRow}>
        {TUTORIAL_SLIDES.map((_, i) => (
          <View key={i} style={[z.dot, i === slideIndex && z.dotActive]} />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={z.navRow}>
        {!isFirst ? (
          <TouchableOpacity
            style={z.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={z.backBtnText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          style={z.nextBtn}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={z.nextBtnText}>
            {isLast ? "⚔ Enter the Arena" : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={z.skipHint}>
        {slideIndex + 1} / {TUTORIAL_SLIDES.length}
      </Text>
      {showReturnButton && onReturnHome && (
        <ReturnToCastle onPress={onReturnHome} />
      )}
    </View>
  )
}

export const hasSeenIntro = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(INTRO_KEY)
    return val === "true"
  } catch {
    return false
  }
}

const z = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1410",
    justifyContent: "center",
    alignItems: "center",
  },
  bg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  // Background
  bgLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.04)",
  },
  bgHLine: {
    position: "absolute",
    top: "50%",
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },

  // Intro screen
  beastRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  beast: { fontSize: 38 },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#E8C547",
    letterSpacing: 6,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
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

  // Tutorial header
  tutHeader: { alignItems: "center", marginBottom: 12 },
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ornLine: { width: 24, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  ornDot: { color: "rgba(232,197,71,0.4)", fontSize: 7 },
  tutHeaderTitle: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 5,
  },

  // Slide — horizontal layout
  slideRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 20,
    maxWidth: 600,
    width: "100%",
  },
  slideLeft: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  slideIcon: { fontSize: 30 },
  slideTitle: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  slideRight: {
    flex: 2,
    gap: 10,
  },
  slideDesc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 19,
    letterSpacing: 0.5,
  },
  exampleBox: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
  },
  exampleText: {
    color: "#E8C547",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },

  // Dots
  dotRow: { flexDirection: "row", gap: 6, marginTop: 16, marginBottom: 12 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(232,197,71,0.15)",
  },
  dotActive: { backgroundColor: "#E8C547", width: 18 },

  // Navigation
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 400,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  backBtnText: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: "#E8C547",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnText: {
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  skipHint: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 10,
    marginTop: 8,
    marginBottom: 20,
  },
})

export default IntroScreen
