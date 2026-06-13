// Quit / retreat confirmation modal (DESIGN_PLAN §4.x, recomposed).
// Composed to the engraved language: a medallion in a crimson ring, Cinzel
// title, a spoils-at-stake cartouche, primary Keep Fighting + danger Retreat —
// no emoji. Scales in on mount.

import React, { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View } from "react-native"
import { Icon } from "../../ui/Icon"
import { GoldButton } from "../../ui/GoldButton"
import { color, font } from "../../ui/theme"
import { withAlpha } from "../../ui/honor"

export const QuitConfirmModal = ({
  dailyMode,
  score,
  onResume,
  onConfirmQuit,
}: {
  dailyMode: boolean
  score: number
  onResume: () => void
  onConfirmQuit: () => void
}) => {
  const scale = useRef(new Animated.Value(0.9)).current
  const fade = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[q.overlay, { opacity: fade }]}>
      <Animated.View style={[q.card, { transform: [{ scale }] }]}>
        <View style={q.glow} />

        {/* top rune row */}
        <View style={q.runeRow}>
          <Text style={q.rune}>ᚠ</Text>
          <View style={q.ornLine} />
          <Text style={q.rune}>ᚦ</Text>
          <View style={q.ornLine} />
          <Text style={q.rune}>ᚱ</Text>
        </View>

        {/* medallion */}
        <View style={q.medal}>
          <View style={q.medalRing} />
          <Icon name="skull" size={26} color={color.crimson} />
        </View>

        <Text style={q.title}>RETREAT?</Text>
        <Text style={q.subtitle}>Your battle will be abandoned</Text>

        <View style={q.divider} />

        {dailyMode && (
          <View style={q.warning}>
            <Icon name="alert" size={13} color="#D9604F" />
            <Text style={q.warningTxt}>Daily attempt will be lost</Text>
          </View>
        )}

        {score > 0 && (
          <View style={q.stakeBox}>
            <Text style={q.stakeLabel}>SPOILS AT STAKE</Text>
            <Text style={q.stakeValue}>{score.toLocaleString()}</Text>
          </View>
        )}

        <View style={q.divider} />

        <GoldButton
          label="KEEP FIGHTING"
          icon="sword-cross"
          onPress={onResume}
          style={q.btn}
        />
        <GoldButton
          variant="danger"
          label="RETREAT TO CASTLE"
          icon="castle"
          onPress={onConfirmQuit}
          style={q.btn}
        />

        {/* bottom rune row */}
        <View style={q.runeRow}>
          <Text style={q.rune}>ᛟ</Text>
          <View style={q.ornLine} />
          <Text style={q.runeDot}>◆</Text>
          <View style={q.ornLine} />
          <Text style={q.rune}>ᛏ</Text>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const q = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0D0907",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: color.goldLine,
    paddingHorizontal: 34,
    paddingVertical: 16,
    minWidth: 300,
    maxWidth: 340,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 30,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -40,
    left: "20%",
    width: "60%",
    height: 120,
    borderRadius: 60,
    backgroundColor: withAlpha(color.crimson, 0.06),
  },
  runeRow: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%" },
  ornLine: { flex: 1, height: 1, backgroundColor: color.goldLine },
  rune: { color: "rgba(232,197,71,0.3)", fontSize: 14 },
  runeDot: { color: "rgba(232,197,71,0.2)", fontSize: 7 },

  medal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: withAlpha(color.crimson, 0.1),
    borderWidth: 1.5,
    borderColor: withAlpha(color.crimson, 0.55),
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 3,
  },
  medalRing: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: withAlpha(color.crimson, 0.3),
  },
  title: {
    color: color.gold,
    fontFamily: font.display,
    fontSize: 22,
    letterSpacing: 4,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  subtitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },
  divider: { width: "70%", height: 1, backgroundColor: "rgba(232,197,71,0.08)" },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: withAlpha(color.crimson, 0.08),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: withAlpha(color.crimson, 0.25),
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  warningTxt: {
    color: "#D9806F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stakeBox: {
    alignItems: "center",
    backgroundColor: color.goldWash,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.goldLine,
    paddingHorizontal: 28,
    paddingVertical: 6,
    width: "100%",
  },
  stakeLabel: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 2,
  },
  stakeValue: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 20,
    includeFontPadding: false,
    textShadowColor: withAlpha(color.gold, 0.5),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  btn: { width: "100%" },
})
