// Bottom-bar wall decorations — battlements + stone texture. Extracted from
// Game.tsx (Step 1.3), drop-in: same props, same rendering.

import React from "react"
import { StyleSheet, View } from "react-native"

export const Battlements = React.memo(({ color }: { color: string }) => (
  <View style={bs.battlements}>
    {Array.from({ length: 22 }).map((_, i) => (
      <View
        key={i}
        style={[
          i % 2 === 0 ? bs.merlon : bs.crenel,
          i % 2 === 0 && { backgroundColor: color },
        ]}
      />
    ))}
    <View style={[bs.goldLine, { backgroundColor: "rgba(232,197,71,0.18)" }]} />
  </View>
))

// New wall texture — more detailed surface
export const WallTexture = React.memo(() => (
  <View style={bs.wallTexture} pointerEvents="none">
    <View style={[bs.grainLine, { top: "20%" }]} />
    <View style={[bs.grainLine, { top: "45%" }]} />
    <View style={[bs.grainLine, { top: "70%" }]} />
    <View style={[bs.grainLine, { top: "90%" }]} />
    {Array.from({ length: 6 }).map((_, i) => (
      <View
        key={i}
        style={[
          bs.textureDot,
          {
            top: `${(i * 37 + 15) % 80}%`,
            left: `${(i * 29 + 8) % 90}%`,
            width: 2,
            height: 2,
            opacity: 0.04 + (i % 2) * 0.02,
          },
        ]}
      />
    ))}
  </View>
))

const bs = StyleSheet.create({
  battlements: {
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
    // Shadow below battlements into the bar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  merlon: {
    width: 13,
    height: 7,
    backgroundColor: "#14100C",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  crenel: {
    width: 9,
    height: 7,
    backgroundColor: "transparent",
  },
  goldLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  wallTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  grainLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.025)", // white grain, works on any color
  },
  textureDot: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
})
