import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Icon } from "../ui/Icon"
import { color, font } from "../ui/theme"
import { withAlpha } from "../ui/honor"

interface Props {
  newScore: number
  previousBest: number
}

const AUTO_DISMISS_MS = 4500
const DISMISS_DISTANCE = 70

const PersonalBestBanner = ({ newScore, previousBest }: Props) => {
  const slideY = useRef(new Animated.Value(-80)).current
  const drag = useRef(new Animated.Value(0)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const [dismissed, setDismissed] = useState(false)
  const improvement = newScore - previousBest
  const improvementPct = Math.round((improvement / previousBest) * 100)

  const dismiss = () => {
    Animated.timing(slideY, {
      toValue: -140,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setDismissed(true))
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 6,
      onPanResponderMove: (_, gesture) => {
        // only track upward drags; ignore downward pull
        drag.setValue(Math.min(0, gesture.dy))
      },
      onPanResponderRelease: (_, gesture) => {
        if (-gesture.dy > DISMISS_DISTANCE || gesture.vy < -0.5) {
          dismiss()
        } else {
          Animated.spring(drag, {
            toValue: 0,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    const t = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [])

  if (dismissed) return null

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        { transform: [{ translateY: Animated.add(slideY, drag) }] },
      ]}
    >
      <Animated.View style={[styles.glow, { opacity: glowPulse }]} />
      <View style={styles.grip} />
      <View style={styles.row}>
        <Icon name="sword-cross" size={18} color={color.sage} />
        <View style={styles.middle}>
          <Text style={styles.title}>NEW PERSONAL BEST</Text>
          <Text style={styles.detail}>
            +{improvement.toLocaleString()} spoils · {improvementPct}% better
          </Text>
        </View>
        <Icon name="sword-cross" size={18} color={color.sage} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    alignSelf: "center",
    zIndex: 500,
    backgroundColor: "rgba(15,26,18,0.95)",
    borderWidth: 1.5,
    borderColor: color.sage,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 7,
    paddingBottom: 10,
    shadowColor: color.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  grip: {
    alignSelf: "center",
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: withAlpha(color.sage, 0.4),
    marginBottom: 6,
  },
  glow: {
    position: "absolute",
    top: -20,
    left: "25%",
    width: "50%",
    height: 60,
    backgroundColor: withAlpha(color.sage, 0.2),
    borderRadius: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  middle: {
    alignItems: "center",
  },
  title: {
    color: color.sage,
    fontFamily: font.heading,
    fontSize: 14,
    letterSpacing: 3,
    textShadowColor: withAlpha(color.sage, 0.5),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  detail: {
    color: withAlpha(color.sage, 0.6),
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },
})

export default PersonalBestBanner
