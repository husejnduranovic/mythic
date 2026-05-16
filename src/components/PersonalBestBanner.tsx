import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View, Easing } from "react-native"

interface Props {
  newScore: number
  previousBest: number
}

const PersonalBestBanner = ({ newScore, previousBest }: Props) => {
  const slideY = useRef(new Animated.Value(-60)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const improvement = newScore - previousBest
  const improvementPct = Math.round((improvement / previousBest) * 100)

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
  }, [])

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideY }] }]}
    >
      <Animated.View style={[styles.glow, { opacity: glowPulse }]} />
      <View style={styles.row}>
        <Text style={styles.icon}>⚔</Text>
        <View style={styles.middle}>
          <Text style={styles.title}>NEW PERSONAL BEST</Text>
          <Text style={styles.detail}>
            +{improvement.toLocaleString()} spoils · {improvementPct}% better
          </Text>
        </View>
        <Text style={styles.icon}>⚔</Text>
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
    borderColor: "#7BED9F",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: "#7BED9F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -20,
    left: "25%",
    width: "50%",
    height: 60,
    backgroundColor: "rgba(123,237,159,0.2)",
    borderRadius: 30,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: {
    fontSize: 20,
    color: "#7BED9F",
    textShadowColor: "rgba(123,237,159,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  middle: {
    alignItems: "center",
  },
  title: {
    color: "#7BED9F",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(123,237,159,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  detail: {
    color: "rgba(123,237,159,0.6)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },
})

export default PersonalBestBanner
