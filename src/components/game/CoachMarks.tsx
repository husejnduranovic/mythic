// First-battle coach marks (DESIGN_PLAN §6 R2) — the game finally teaches
// in-session. Three parchment marks on the first-ever free battle: the match
// rule when the board opens, the chain when the first combo forms, the Free
// Draw right after. One full-screen pressable scrim (any tap dismisses), the
// clock frozen while a mark is up, nothing mounted once the lesson is done.
//
// Parchment is deliberate: it's the app's "one light surface" grammar (the
// nameplate) — a note pinned to the war table, not a floating dev tooltip.

import React, { useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Icon, IconName } from "../../ui/Icon"
import { color, font } from "../../ui/theme"

export type CoachVariant = "match" | "chain" | "draw"

const COPY: Record<
  CoachVariant,
  { icon: IconName; title: string; body: string; sub: string }
> = {
  match: {
    icon: "cards",
    title: "THE HUNT",
    body: "Capture any beast ONE ABOVE or ONE BELOW your card.",
    sub: "An 8 takes a 7 or a 9 — suits never matter.",
  },
  chain: {
    icon: "fire",
    title: "A CHAIN!",
    body: "Every link multiplies your spoils. Plant banners at ×5, ×8, ×12… — banked forever.",
    sub: "A deck draw breaks the chain. Banners survive.",
  },
  draw: {
    icon: "restore",
    title: "THE FREE DRAW",
    body: "The gold card draws WITHOUT breaking your chain — one per field, unused ones carry.",
    sub: "The deck beside it is the chain-breaker.",
  },
}

export const CoachMark = ({
  variant,
  onDismiss,
}: {
  variant: CoachVariant
  onDismiss: () => void
}) => {
  const a = useRef(new Animated.Value(0)).current

  useEffect(() => {
    a.setValue(0)
    Animated.timing(a, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    }).start()
  }, [variant])

  const copy = COPY[variant]
  const place =
    variant === "match"
      ? styles.placeMatch
      : variant === "chain"
        ? styles.placeChain
        : styles.placeDraw

  return (
    <Pressable style={styles.scrim} onPress={onDismiss}>
      <Animated.View
        style={[
          styles.plate,
          place,
          {
            opacity: a,
            transform: [
              {
                translateY: a.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
              { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.titleRow}>
          <Icon name={copy.icon} size={14} color={color.goldDeep} />
          <Text style={styles.title}>{copy.title}</Text>
        </View>
        <Text style={styles.body}>{copy.body}</Text>
        <Text style={styles.sub}>{copy.sub}</Text>
        <Text style={styles.hint}>TAP TO CONTINUE</Text>
        <View style={styles.arrow} />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 90,
  },
  plate: {
    position: "absolute",
    maxWidth: 300,
    backgroundColor: color.parchment,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: color.goldDeep,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  // The mark points at what it teaches: the dais, the combo gauge, the draw.
  placeMatch: { bottom: 96, alignSelf: "center" },
  placeChain: { bottom: 88, right: 14 },
  placeDraw: { bottom: 96, left: 64 },
  arrow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 12,
    height: 12,
    backgroundColor: color.parchment,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: color.goldDeep,
    transform: [{ rotate: "45deg" }],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  title: {
    fontFamily: font.heading,
    fontSize: 13,
    color: color.ink,
    letterSpacing: 1.5,
  },
  body: { color: "rgba(26,26,26,0.85)", fontSize: 11, fontWeight: "700" },
  sub: {
    color: "rgba(26,26,26,0.55)",
    fontSize: 10,
    fontWeight: "600",
    fontStyle: "italic",
    marginTop: 2,
  },
  hint: {
    color: color.goldDeep,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 6,
    textAlign: "center",
  },
})
