// Pause overlay — "War Camp" (DESIGN_PLAN §4.x, recomposed).
// A composed centered panel: pause medallion, Cinzel title, a spoils-held
// cartouche, and the camp actions (Resume primary, Restart/Home ghost). No
// emoji; scales in on mount.

import React, { useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { Icon } from "../../ui/Icon"
import { GoldButton } from "../../ui/GoldButton"
import { color, font } from "../../ui/theme"
import { withAlpha } from "../../ui/honor"
import type { ThemeConfig } from "../Armory"

export const PausedScreen = ({
  theme,
  background,
  score,
  dailyMode,
  onResume,
  onRestart,
  onHome,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  score: number
  dailyMode: boolean
  onResume: () => void
  onRestart: () => void
  onHome?: () => void
}) => {
  const scale = useRef(new Animated.Value(0.92)).current
  const fade = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={[ps.container, { backgroundColor: theme.battlefieldColor }]}>
      {background}
      <Animated.View
        style={[ps.panel, { opacity: fade, transform: [{ scale }] }]}
      >
        <View style={ps.runeRow}>
          <View style={ps.ornLine} />
          <Text style={ps.dot}>◆</Text>
          <View style={ps.ornLine} />
        </View>

        <View style={ps.medal}>
          <View style={ps.medalRing} />
          <Icon name="pause" size={26} color={color.gold} />
        </View>

        <Text style={ps.title}>PAUSED</Text>

        <View style={ps.stakeBox}>
          <Text style={ps.stakeLabel}>SPOILS HELD</Text>
          <Text style={ps.stakeValue}>{score.toLocaleString()}</Text>
        </View>

        <GoldButton label="RESUME" icon="play" onPress={onResume} />

        <View style={ps.ghostRow}>
          {!dailyMode && (
            <TouchableOpacity style={ps.ghostBtn} onPress={onRestart} activeOpacity={0.8}>
              <Icon name="restart" size={14} color={color.goldFaded} />
              <Text style={ps.ghostTxt}>Restart</Text>
            </TouchableOpacity>
          )}
          {onHome && (
            <TouchableOpacity style={ps.ghostBtn} onPress={onHome} activeOpacity={0.8}>
              <Icon name="castle" size={14} color={color.goldFaded} />
              <Text style={ps.ghostTxt}>Castle</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={ps.runeRow}>
          <View style={ps.ornLine} />
          <Text style={ps.dot}>◆</Text>
          <View style={ps.ornLine} />
        </View>
      </Animated.View>
    </View>
  )
}

const ps = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  panel: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(13,9,7,0.92)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: color.goldLine,
    paddingHorizontal: 40,
    paddingVertical: 18,
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 28,
  },
  runeRow: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%" },
  ornLine: { flex: 1, height: 1, backgroundColor: color.goldLine },
  dot: { color: "rgba(232,197,71,0.4)", fontSize: 7 },
  medal: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: withAlpha(color.gold, 0.1),
    borderWidth: 1.5,
    borderColor: withAlpha(color.gold, 0.6),
    justifyContent: "center",
    alignItems: "center",
  },
  medalRing: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 23,
    borderWidth: 0.5,
    borderColor: withAlpha(color.gold, 0.35),
  },
  title: {
    color: color.gold,
    fontFamily: font.display,
    fontSize: 24,
    letterSpacing: 5,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  stakeBox: {
    alignItems: "center",
    backgroundColor: color.goldWash,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.goldLine,
    paddingHorizontal: 30,
    paddingVertical: 6,
  },
  stakeLabel: {
    color: color.goldFaded,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 1,
  },
  stakeValue: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 20,
    includeFontPadding: false,
    textShadowColor: withAlpha(color.gold, 0.5),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  ghostRow: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.goldLine,
    backgroundColor: color.goldWash,
    minWidth: 105,
  },
  ghostTxt: {
    color: color.goldFaded,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
})
