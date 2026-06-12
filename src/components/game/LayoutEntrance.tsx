// Fade + spring entrance wrapper for each layout. Extracted from Game.tsx (Step 1.3).

import React, { useEffect, useRef } from "react"
import { Animated } from "react-native"

export const LayoutEntrance = ({
  children,
  layoutKey,
}: {
  children: React.ReactNode
  layoutKey: string
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current

  useEffect(() => {
    opacity.setValue(0)
    scale.setValue(0.92)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }, [layoutKey])

  return (
    <Animated.View
      style={{
        flex: 1,
        justifyContent: "center",
        opacity,
        transform: [{ scale }],
      }}
    >
      {children}
    </Animated.View>
  )
}
