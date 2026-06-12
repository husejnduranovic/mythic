// Daily-quest "already played today" screen. Extracted from Game.tsx (Step 1.6).

import React from "react"
import { StyleSheet, Text, View } from "react-native"
import ReturnToCastle from "../ReturnToCastle"
import type { ThemeConfig } from "../Armory"

export const AlreadyPlayedScreen = ({
  theme,
  background,
  score,
  onHome,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  score: number
  onHome: () => void
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
    <Text style={styles.dailyBadgeIcon}>📜</Text>
    <Text style={styles.gameTitle}>QUEST COMPLETE</Text>
    <Text style={styles.partialText}>You already fought today's battle</Text>
    <View style={styles.divider} />
    <Text style={styles.scoreLabel}>YOUR SCORE</Text>
    <Text style={styles.finalScore}>{score.toLocaleString()}</Text>
    <View style={styles.divider} />
    <Text style={styles.partialText}>Come back tomorrow for a new quest!</Text>
    <ReturnToCastle onPress={onHome} />
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
  dailyBadgeIcon: { fontSize: 40, marginBottom: 4 },
  gameTitle: {
    color: "#E8C547",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
    marginVertical: 3,
  },
  scoreLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
  },
  finalScore: {
    color: "#E8C547",
    fontSize: 40,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  partialText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    fontStyle: "italic",
  },
})
