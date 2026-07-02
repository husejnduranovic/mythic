// First Victory (DESIGN_PLAN §6 R5) — the first completed battle gets an arc:
// play → win → own something. Previously game #1 ended on the same screen as
// game #200 and the Armory's free starter pieces sat unmentioned. This
// celebrates once (@mythic_first_victory_seen) and hands the player their
// first reason to open the Armory: choose your colors, carry them into
// battle 2. Mounted only for its moment, above the game-over screen.

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

export const FirstVictoryOverlay = ({
  onClaim,
  onDismiss,
}: {
  onClaim: () => void
  onDismiss: () => void
}) => {
  const fade = useRef(new Animated.Value(0)).current
  const stamp = useRef(new Animated.Value(0)).current
  const late = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start()
    Animated.timing(stamp, {
      toValue: 1,
      duration: 340,
      delay: 240,
      easing: Easing.out(Easing.back(2.2)),
      useNativeDriver: true,
    }).start()
    Animated.timing(late, {
      toValue: 1,
      duration: 300,
      delay: 640,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  return (
    <Animated.View style={[styles.scrim, { opacity: fade }]}>
      <Animated.View
        style={{
          alignItems: "center",
          opacity: stamp,
          transform: [
            {
              scale: stamp.interpolate({
                inputRange: [0, 1],
                outputRange: [1.5, 1],
              }),
            },
          ],
        }}
      >
        <Animated.View style={[styles.flourishRow, { opacity: pulse }]}>
          <Text style={styles.flourish}>✦</Text>
          <Icon name="trophy-variant" size={20} color={color.goldBright} />
          <Text style={styles.flourish}>✦</Text>
        </Animated.View>
        <Text style={styles.title}>FIRST VICTORY</Text>
        <Text style={styles.overline}>THE ARMORY IS OPEN</Text>
      </Animated.View>

      <Animated.View
        style={{
          alignItems: "center",
          gap: 12,
          marginTop: 18,
          opacity: late,
          transform: [
            {
              translateY: late.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        }}
      >
        <Text style={styles.body}>
          Card backs, battlefields and crests await a banner to fly under.
        </Text>
        <GoldButton
          label="CHOOSE YOUR COLORS"
          icon="shield-half-full"
          onPress={onClaim}
        />
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Text style={styles.later}>LATER</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,7,0.94)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  flourishRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  flourish: { color: color.goldBright, fontSize: 13 },
  title: {
    fontFamily: font.display,
    color: color.goldBright,
    fontSize: 32,
    letterSpacing: 3,
    textShadowColor: "rgba(255,215,0,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  overline: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 4,
  },
  body: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 300,
  },
  later: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.5,
    padding: 4,
  },
})
