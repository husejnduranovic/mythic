// Pause overlay screen. Extracted from Game.tsx (Step 1.6).

import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import type { ThemeConfig } from "../Armory"

export const PausedScreen = ({
  theme,
  background,
  score,
  dailyMode,
  onResume,
  onRestart,
  onHome,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  score: number
  dailyMode: boolean
  onResume: () => void
  onRestart: () => void
  onHome?: () => void
}) => (
  <View
    style={[
      styles.center,
      {
        backgroundColor: theme.battlefieldColor,
        position: "relative",
        overflow: "hidden",
      },
    ]}
  >
    {background}
    <Text style={styles.gameTitle}>⏸ PAUSED</Text>
    <Text style={styles.pauseScore}>{score.toLocaleString()}</Text>
    <TouchableOpacity style={styles.goldBtn} onPress={onResume}>
      <Text style={styles.goldBtnText}>▶ Resume</Text>
    </TouchableOpacity>
    {!dailyMode && (
      <TouchableOpacity style={styles.ghostBtn} onPress={onRestart}>
        <Text style={styles.ghostBtnText}>↺ Restart</Text>
      </TouchableOpacity>
    )}
    {onHome && (
      <TouchableOpacity style={styles.ghostBtn} onPress={onHome}>
        <Text style={styles.ghostBtnText}>🏰 Home</Text>
      </TouchableOpacity>
    )}
  </View>
)

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 32,
  },
  gameTitle: {
    color: "#E8C547",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  pauseScore: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 16,
    fontWeight: "700",
  },
  goldBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D4A017",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  ghostBtn: {
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  ghostBtnText: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
})
