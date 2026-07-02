import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ReturnToCastle from "./ReturnToCastle"
import Card, { ICard } from "./Card"
import { StorageKeys } from "../services/storageKeys"
import { Icon, IconName } from "../ui/Icon"
import { GoldButton } from "../ui/GoldButton"
import { color, font } from "../ui/theme"
import { withAlpha } from "../ui/honor"
import { TOTAL_LEVELS } from "../game/config"
import { getLayoutMultiplier } from "../game/scoring"

// ─────────────────────────────────────────────────────────────────────────────
// Intro / How-to-play (Guide). First-run shows the brand splash then the
// tutorial; opened from Home it skips straight to the tutorial.
//
// The card-teaching slides demonstrate with THE REAL PIECES — actual Card
// components fanned in a tableau (a 7 beside an 8 for matching, an ascending
// run for combos, a deck back for the reset, a plain back beside a bounty back
// for "spot the special card") — instead of an abstract icon in a ring. The
// non-card slides (Free Draw, fields, Glory, prizes) keep the ring medallion
// with the in-game icon vocabulary. GoldButton nav; splash beasts stay emoji
// (§9, illustration).
// ─────────────────────────────────────────────────────────────────────────────

const INTRO_KEY = StorageKeys.introSeen

const mk = (value: string, suit: ICard["suit"]): ICard => ({
  value,
  suit,
  displayValue: value,
  visible: true,
})

// Slide index → the real pieces on display. Faces render CardFace, backs render
// the tooled-leather CardBackView / jeweled BountyCardBack — always current with
// the live game, never a drawing of it.
const SLIDE_DEMOS: Record<
  number,
  { faces?: ICard[]; backs?: ("plain" | "bounty")[] }
> = {
  0: { faces: [mk("7", "diamonds"), mk("8", "hearts")] },
  1: { faces: [mk("5", "clubs"), mk("6", "hearts"), mk("7", "spades")] },
  2: { backs: ["plain"] },
  4: { backs: ["plain", "bounty"] },
}

interface IntroScreenProps {
  onComplete: () => void
  skipAnimation?: boolean
  showReturnButton?: boolean
  onReturnHome?: () => void
}

const TUTORIAL_SLIDES: {
  icon: IconName
  title: string
  desc: string
  example: string
}[] = [
  {
    icon: "cards",
    title: "Match Cards",
    desc: "One card is open at the bottom.\nTap any field card that is one higher or one lower in number.\n\nAce connects to both King and 2.",
    example: "Open card is 7 → tap a 6 or an 8",
  },
  {
    icon: "fire",
    title: "Build Your Combo",
    desc: "Each match in a row builds your combo, and every card is worth more.\nAt combo milestones you PLANT A BANNER — banking bonus spoils that stay yours even if the chain breaks.\n\nThis is the heart of the game.",
    example: "Banners at 5 · 8 · 12 · 16 · 20 · 24 · 28 · 32",
  },
  {
    icon: "refresh",
    title: "The Deck Resets It",
    desc: "If no field card matches, draw from the deck.\nDrawing resets your combo to zero — only your planted banners survive.\n\nDraw only when you're truly stuck.",
    example: "Match → Match → Match → then draw if needed",
  },
  {
    icon: "restore",
    title: "One Free Draw",
    desc: "Each battlefield gives you one Free Draw.\nIt swaps your open card WITHOUT breaking your combo.\n\nSave it for the moment you get stuck with a high combo.",
    example: "Stuck at a big combo? Use your Free Draw",
  },
  {
    icon: "sack",
    title: "Bounty Cards",
    desc: "Two marked cards hide on every battlefield.\nA bounty pays TRIPLE your current combo value.\n\nRoute your chain to capture them late — that's where the treasure is.",
    example: "A bounty deep in a chain = three cards' spoils",
  },
  {
    icon: "image-filter-hdr",
    title: `${TOTAL_LEVELS} Battlefields`,
    desc: `Each run has ${TOTAL_LEVELS} battlefields, played in order.\nLater battlefields are worth more points per card.\n\nClear every card on a field for a big bonus.`,
    example: `Field 1 = 1×  →  Field ${TOTAL_LEVELS} = ${getLayoutMultiplier(TOTAL_LEVELS)}× points`,
  },
  {
    icon: "lightning-bolt",
    title: "Glory Hunt",
    desc: "Before battle you can activate Glory Hunt.\nIt doubles your points — but cuts your time in half.\n\nOne charge per run. High risk, high reward.",
    example: "2× points · 50% time · one charge per run",
  },
  {
    icon: "trophy-variant",
    title: "Monthly Prizes",
    desc: "Each month the top 3 warriors win real prizes.\nScores reset monthly, so everyone starts fresh.\n\nPlay the Daily Quest for your best shot.",
    example: "1st €50  ·  2nd €30  ·  3rd €20",
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
  const halo = useRef(new Animated.Value(0.3)).current

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

    // The tutorial medallion breathes (shared pulse grammar).
    Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 0.55,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0.3,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()
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

          {/* Beasts — the four card-face clans (§9: illustration, stay emoji) */}
          <View style={z.beastRow}>
            <Animated.Text
              style={[z.beast, { opacity: beast1, transform: [{ scale: beast1 }] }]}
            >
              🐉
            </Animated.Text>
            <Animated.Text
              style={[z.beast, { opacity: beast2, transform: [{ scale: beast2 }] }]}
            >
              🦅
            </Animated.Text>
            <Animated.Text
              style={[z.beast, { opacity: beast3, transform: [{ scale: beast3 }] }]}
            >
              🐺
            </Animated.Text>
            <Animated.Text
              style={[z.beast, { opacity: beast4, transform: [{ scale: beast4 }] }]}
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
            {TOTAL_LEVELS} Battlefields · 4 Beast Clans · Infinite Glory
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
        {/* Left — the demonstration (real cards where the lesson is about
            cards; the ring medallion elsewhere) + Title */}
        <View style={z.slideLeft}>
          <View style={z.iconZone}>
            {(() => {
              const demo = SLIDE_DEMOS[slideIndex]
              if (!demo) {
                return (
                  <>
                    <Animated.View style={[z.iconHalo, { opacity: halo }]} />
                    <View style={z.iconWrap}>
                      <View style={z.iconRing} />
                      <Icon name={slide.icon} size={30} color={color.gold} />
                    </View>
                  </>
                )
              }
              const pieces: React.ReactNode[] = [
                ...(demo.faces || []).map((c, i) => (
                  <Card key={`f${i}`} card={c} isOpen disabled />
                )),
                ...(demo.backs || []).map((b, i) => (
                  <Card key={`b${i}`} bounty={b === "bounty"} disabled />
                )),
              ]
              const n = pieces.length
              return (
                <>
                  <Animated.View
                    style={[z.iconHalo, z.demoHalo, { opacity: halo }]}
                  />
                  <View style={z.demoRow}>
                    {pieces.map((piece, i) => (
                      <View
                        key={i}
                        style={{
                          marginHorizontal: n > 1 ? -6 : 0,
                          transform: [
                            { rotate: `${(i - (n - 1) / 2) * 9}deg` },
                            {
                              translateY: Math.abs(i - (n - 1) / 2) * 5,
                            },
                          ],
                        }}
                      >
                        {piece}
                      </View>
                    ))}
                  </View>
                </>
              )
            })()}
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
            <Icon name="chevron-left" size={16} color={color.goldFaded} />
            <Text style={z.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <GoldButton
          label={isLast ? "ENTER BATTLE" : "NEXT"}
          icon={isLast ? "sword-cross" : "chevron-right"}
          onPress={handleNext}
          style={z.nextBtn}
        />
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
    backgroundColor: color.bgBase,
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
  bgRune: { position: "absolute", fontSize: 22, color: "rgba(232,197,71,0.04)" },
  bgHLine: {
    position: "absolute",
    top: "50%",
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },

  // Intro splash
  beastRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  beast: { fontSize: 38 },
  title: {
    fontFamily: font.display,
    fontSize: 40,
    color: color.gold,
    letterSpacing: 4,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: color.goldFaded,
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
    backgroundColor: color.gold,
  },

  // Tutorial header
  tutHeader: { alignItems: "center", marginBottom: 14 },
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ornLine: { width: 24, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  ornDot: { color: "rgba(232,197,71,0.4)", fontSize: 7 },
  tutHeaderTitle: {
    color: color.gold,
    fontFamily: font.heading,
    fontSize: 16,
    letterSpacing: 4,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },

  // Slide — horizontal layout
  slideRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 24,
    maxWidth: 620,
    width: "100%",
  },
  slideLeft: { flex: 1, alignItems: "center", gap: 10 },
  iconZone: { alignItems: "center", justifyContent: "center" },
  iconHalo: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: withAlpha(color.gold, 0.1),
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: withAlpha(color.gold, 0.08),
    borderWidth: 1.5,
    borderColor: withAlpha(color.gold, 0.6),
    justifyContent: "center",
    alignItems: "center",
  },
  iconRing: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: withAlpha(color.gold, 0.3),
  },
  // Real-piece tableau — the halo widens into a glow pool under the fan.
  demoHalo: { width: 130, height: 86, borderRadius: 30 },
  demoRow: { flexDirection: "row", alignItems: "center" },
  slideTitle: {
    color: color.gold,
    fontFamily: font.display,
    fontSize: 18,
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  slideRight: { flex: 2, gap: 10 },
  slideDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 19,
    letterSpacing: 0.5,
  },
  exampleBox: {
    backgroundColor: color.goldWash,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: color.goldLine,
  },
  exampleText: {
    color: color.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },

  // Dots
  dotRow: { flexDirection: "row", gap: 6, marginTop: 18, marginBottom: 12 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.goldLine,
  },
  dotActive: { backgroundColor: color.gold, width: 18 },

  // Navigation
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    width: "100%",
    maxWidth: 430,
  },
  backBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.goldLine,
    backgroundColor: color.goldWash,
  },
  backBtnText: {
    color: color.goldFaded,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  nextBtn: { flex: 1, minWidth: 0 },

  skipHint: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 18,
  },
})

export default IntroScreen
