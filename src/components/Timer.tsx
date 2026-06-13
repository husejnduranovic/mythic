import React, { useEffect, useRef, useState } from "react"
import { Animated, StyleSheet, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { color } from "../ui/theme"

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons)

interface ITimerProps {
  initialTime: number
  onTimeUp: () => void
  paused?: boolean
  frozen?: boolean
  onTick?: (timeLeft: number) => void
}

const Timer = ({
  initialTime,
  onTimeUp,
  paused = false,
  frozen = false,
  onTick,
}: ITimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const barAnim = useRef(new Animated.Value(1)).current
  const flashAnim = useRef(new Animated.Value(1)).current
  const frozenPulse = useRef(new Animated.Value(0)).current
  const flashLoop = useRef<Animated.CompositeAnimation | null>(null)
  const frozenLoop = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (onTick) onTick(initialTime)
  }, [])

  useEffect(() => {
    if (paused || frozen) return
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }
    const tick = setTimeout(
      () =>
        setTimeLeft((t) => {
          const next = t - 1
          if (onTick) onTick(next)
          return next
        }),
      1000,
    )
    return () => clearTimeout(tick)
  }, [timeLeft, paused, frozen])

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: timeLeft / initialTime,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft <= 10 && !paused && !frozen) {
      flashLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      )
      flashLoop.current.start()
    } else {
      flashLoop.current?.stop()
      flashAnim.setValue(1)
    }
    return () => flashLoop.current?.stop()
  }, [timeLeft <= 10, paused, frozen])

  // Frozen glow pulse
  useEffect(() => {
    if (frozen) {
      frozenLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(frozenPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(frozenPulse, {
            toValue: 0.4,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      )
      frozenLoop.current.start()
    } else {
      frozenLoop.current?.stop()
      frozenPulse.setValue(0)
    }
    return () => frozenLoop.current?.stop()
  }, [frozen])

  const isLow = timeLeft <= 10
  // Spoils burning down: healthy gold → warn ember (≤20s) → low crimson (≤10s);
  // frozen reads frost. De-neoned from the old blue/green/red traffic light.
  const barColor = frozen
    ? color.frost
    : isLow
      ? color.crimson
      : timeLeft <= 20
        ? color.ember
        : color.gold
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeStr =
    mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}`

  return (
    <View style={styles.container}>
      {frozen && (
        <AnimatedIcon
          name="snowflake"
          size={12}
          color={color.frost}
          style={[styles.frozenIcon, { opacity: frozenPulse }]}
        />
      )}
      <View style={styles.timerFrame}>
        <Animated.Text
          style={[
            styles.timeText,
            { opacity: flashAnim, color: barColor, textShadowColor: barColor },
          ]}
        >
          {timeStr}
        </Animated.Text>
      </View>
      <View style={[styles.barTrack, frozen && styles.barTrackFrozen]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 2 },
  timerFrame: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  barTrack: {
    width: 80,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.08)",
  },
  barTrackFrozen: {
    backgroundColor: "rgba(159,216,239,0.15)",
    borderColor: "rgba(159,216,239,0.35)",
  },
  barFill: { height: "100%", borderRadius: 2 },
  frozenIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 2,
  },
})

export default Timer
