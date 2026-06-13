// Daily-quest "already played today" (DESIGN_PLAN §4.x, recomposed).
// Today's run is shown as a sealed quest card on the honor chassis — the same
// language as the game-over Spoils Card — with a "returns at midnight" note.
// Replaces the board (early return), so the deal-in is free.

import React, { useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ReturnToCastle from "../ReturnToCastle"
import { Icon } from "../../ui/Icon"
import { color, font } from "../../ui/theme"
import { HonorCard, withAlpha } from "../../ui/honor"
import type { ThemeConfig } from "../Armory"

export const AlreadyPlayedScreen = ({
  theme,
  background,
  score,
  onHome,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  score: number
  onHome: () => void
}) => {
  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const fade = useRef(new Animated.Value(0)).current
  const deal = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    Animated.timing(deal, {
      toValue: 1,
      duration: 420,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    const loop = (v: Animated.Value, lo: number, hi: number, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: hi, duration: d, useNativeDriver: true }),
          Animated.timing(v, { toValue: lo, duration: d, useNativeDriver: true }),
        ]),
      ).start()
    loop(float, 0, 1, 2200)
    loop(pulse, 0.3, 0.5, 2000)
  }, [])

  const cardH = Math.round(Math.min(winH - 132, 210))
  const cardW = Math.round(cardH / 1.46)
  const padL = Math.max(14, insets.left)
  const padR = Math.max(14, insets.right)

  return (
    <View style={[a.container, { paddingLeft: padL, paddingRight: padR }]}>
      {background}
      <Animated.View style={[a.inner, { opacity: fade }]}>
        {/* Header */}
        <View style={a.header}>
          <View style={a.hLine} />
          <View style={a.hTitleRow}>
            <Icon name="script-text" size={16} color={color.gold} />
            <Text style={a.hTitle}>DAILY QUEST</Text>
          </View>
          <View style={a.hLine} />
        </View>

        <View style={a.center}>
          <Animated.View
            style={[
              a.cardPool,
              {
                width: cardW * 1.7,
                height: cardW * 1.7,
                borderRadius: cardW * 0.85,
                backgroundColor: withAlpha(color.gold, 0.05),
                opacity: pulse,
              },
            ]}
          />
          <HonorCard
            w={cardW}
            h={cardH}
            trim={color.gold}
            medallion="check-decagram"
            deal={deal}
            pulse={pulse}
            float={float}
          >
            <Text style={a.cardTitle}>SEALED</Text>
            <View style={{ flex: 1 }} />
            <Text style={a.cardOverline}>TODAY'S SPOILS</Text>
            <Text style={a.cardScore} numberOfLines={1} adjustsFontSizeToFit>
              {score.toLocaleString()}
            </Text>
            <Text style={a.cardSub}>RETURNS AT MIDNIGHT</Text>
          </HonorCard>
        </View>

        <Text style={a.note}>You have already answered today's call</Text>
        <ReturnToCastle onPress={onHome} />
      </Animated.View>
    </View>
  )
}

const a = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bgBase, paddingTop: 6 },
  inner: { flex: 1, alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 4,
  },
  hLine: { width: 30, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  hTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hTitle: {
    color: color.gold,
    fontFamily: font.heading,
    fontSize: 15,
    letterSpacing: 3,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardPool: { position: "absolute" },
  cardTitle: {
    color: color.gold,
    fontFamily: font.display,
    fontSize: 19,
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 6,
  },
  cardOverline: {
    color: withAlpha(color.gold, 0.55),
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 4,
  },
  cardScore: {
    color: color.gold,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    marginHorizontal: 8,
    textShadowColor: withAlpha(color.gold, 0.4),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cardSub: {
    color: withAlpha(color.gold, 0.55),
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 10,
  },
  note: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
})
