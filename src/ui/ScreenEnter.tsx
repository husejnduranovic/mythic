import React, { useEffect, useRef } from "react"
import { Animated, Easing } from "react-native"

// One shared enter transition for every screen. The app hard-cut between
// screens while everything inside them animated — the seams read as a
// different product from the composed interiors. Key this by the screen name
// so each switch remounts it: a 200ms fade + 10px rise (the deal-in grammar,
// at room scale), native driver, one-shot — inert after mount, so it adds
// zero per-frame cost to the live board.
export const ScreenEnter = ({ children }: { children: React.ReactNode }) => {
  const enter = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  )
}
