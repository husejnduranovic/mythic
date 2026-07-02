// BoardBurst — a one-shot detonation for the board's biggest moments: a core
// flash plus expanding shock rings, centered on the field. Fired on banner
// plants ≥20 (RAMPAGE and up) and on field-clear moments (perfect / unbroken).
//
// Perf contract: mounted only for its ~700ms life, 3–4 static views driven by
// one Reanimated shared value on the UI thread, pointerEvents none, nothing
// per-card and nothing idle. The 28-card field never knows it happened.

import React, { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Reanimated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

const RING = 130

export const BoardBurst = ({
  color,
  big = false,
  onDone,
}: {
  color: string
  big?: boolean
  onDone: () => void
}) => {
  const t = useSharedValue(0)

  useEffect(() => {
    t.value = withTiming(
      1,
      { duration: big ? 820 : 640, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onDone)()
      },
    )
  }, [])

  // Core flash — blooms fast, dies fast.
  const flashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.12, 0.65], [0, big ? 0.5 : 0.32, 0]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.35, big ? 1.5 : 1.1]) }],
  }))

  // First shock ring — leads the detonation.
  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.08, 0.8], [0, 0.85, 0]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.3, big ? 3.4 : 2.6]) }],
  }))

  // Second ring — trails a beat behind on the same clock.
  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.22, 0.28, 0.95], [0, 0, 0.6, 0]),
    transform: [
      { scale: interpolate(t.value, [0, 0.22, 1], [0.3, 0.3, big ? 2.7 : 2.0]) },
    ],
  }))

  // Third ring — big detonations only.
  const ring3Style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.38, 0.44, 1], [0, 0, 0.45, 0]),
    transform: [{ scale: interpolate(t.value, [0, 0.38, 1], [0.3, 0.3, 2.1]) }],
  }))

  return (
    <View style={styles.stage} pointerEvents="none">
      <Reanimated.View
        style={[
          styles.flash,
          { backgroundColor: color, shadowColor: color },
          flashStyle,
        ]}
      />
      <Reanimated.View
        style={[styles.ring, { borderColor: color, shadowColor: color }, ring1Style]}
      />
      <Reanimated.View
        style={[styles.ring, { borderColor: color }, ring2Style]}
      />
      {big && (
        <Reanimated.View
          style={[styles.ring, { borderColor: color }, ring3Style]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
  },
  flash: {
    position: "absolute",
    width: RING * 1.6,
    height: RING * 1.6,
    borderRadius: RING * 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  ring: {
    position: "absolute",
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
})
