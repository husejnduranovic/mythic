import React, { useEffect, useRef, useState } from "react"
import { Animated, StyleSheet, View } from "react-native"

interface ITimerProps {
  initialTime: number
  onTimeUp: () => void
  paused?: boolean
}

const Timer = ({ initialTime, onTimeUp, paused = false }: ITimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const barAnim = useRef(new Animated.Value(1)).current
  const flashAnim = useRef(new Animated.Value(1)).current
  const flashLoop = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    if (paused) return
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }
    const tick = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(tick)
  }, [timeLeft, paused])

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: timeLeft / initialTime,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [timeLeft])

  useEffect(() => {
    if (timeLeft <= 10 && !paused) {
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
  }, [timeLeft <= 10, paused])

  const isLow = timeLeft <= 10
  const barColor = isLow ? "#E74C3C" : timeLeft <= 20 ? "#E8C547" : "#4CAF50"
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timeStr =
    mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}`

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.timeText, { opacity: flashAnim, color: barColor }]}
      >
        {timeStr}
      </Animated.Text>
      <View style={styles.barTrack}>
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
  container: { alignItems: "center", gap: 3 },
  timeText: { fontSize: 15, fontWeight: "800", letterSpacing: 1 },
  barTrack: {
    width: 80,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 2 },
})

export default Timer
