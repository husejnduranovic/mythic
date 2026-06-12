// Game-over / results screen. Extracted from Game.tsx (Step 1.6).

import React from "react"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import ReturnToCastle from "../ReturnToCastle"
import RecordCelebration from "../RecordCelebration"
import PersonalBestBanner from "../PersonalBestBanner"
import type { ThemeConfig } from "../Armory"

export const GameOverScreen = ({
  theme,
  background,
  score,
  bestCombo,
  totalCleared,
  totalFieldCards,
  dailyMode,
  arenaMode,
  arenaPlayers,
  uid,
  heroName,
  rank,
  dailyRank,
  isPersonalBest,
  isAllTimeRecord,
  previousBest,
  showCelebration,
  onPlayAgain,
  onConfirmQuit,
  onHome,
  onDismissCelebration,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  score: number
  bestCombo: number
  totalCleared: number
  totalFieldCards: number
  dailyMode: boolean
  arenaMode?: boolean
  arenaPlayers: any[]
  uid?: string | null
  heroName?: string | null
  rank: number | null
  dailyRank: number | null
  isPersonalBest: boolean
  isAllTimeRecord: boolean
  previousBest: number
  showCelebration: boolean
  onPlayAgain: () => void
  onConfirmQuit: () => void
  onHome: () => void
  onDismissCelebration: () => void
}) => {
  const clearPct =
    totalFieldCards > 0
      ? Math.round((totalCleared / totalFieldCards) * 100)
      : 0

  const isVictory = clearPct >= 80
  const isMidBattle = clearPct >= 50
  const outcomeIcon = isVictory ? "👑" : isMidBattle ? "⚔️" : "🛡"
  const allFinished = arenaMode
    ? arenaPlayers.every((p: any) => p.finished || p.disconnected)
    : true

  const myArenaRank = arenaMode
    ? arenaPlayers.findIndex((p: any) => p.uid === uid) + 1
    : 0

  const outcomeTitle = dailyMode
    ? "QUEST COMPLETE"
    : arenaMode
      ? !allFinished
        ? "FINALIZING..."
        : myArenaRank === 1
          ? "VICTORY"
          : `RANK #${myArenaRank}`
      : isVictory
        ? "VICTORY"
        : isMidBattle
          ? "BATTLE OVER"
          : "RETREAT"

  return (
    <View
      style={[
        styles.center,
        {
          backgroundColor: theme.battlefieldColor,
          flexDirection: "row",
          paddingHorizontal: 24,
          gap: 20,
          position: "relative",
          overflow: "hidden",
        },
      ]}
    >
      {isPersonalBest && !isAllTimeRecord && (
        <PersonalBestBanner newScore={score} previousBest={previousBest} />
      )}
      {background}

      {/* Left — Result + Score */}
      <View style={styles.gameOverLeft}>
        {isAllTimeRecord ? (
          <View style={styles.recordBanner}>
            <Text style={styles.recordStars}>✦ ✦ ✦ ✦ ✦</Text>
            <Text style={styles.recordIcon}>🏆</Text>
            <Text style={styles.recordTitle}>ALL-TIME RECORD</Text>
            <Text style={styles.recordSub}>You are the #1 warrior!</Text>
            <Text style={styles.recordStars}>✦ ✦ ✦ ✦ ✦</Text>
          </View>
        ) : (
          <>
            {/* Outcome icon with ring — much bigger */}
            <View style={styles.outcomeIconWrap}>
              <View
                style={[
                  styles.outcomeIconRing,
                  {
                    borderColor: isVictory
                      ? "rgba(255,215,0,0.3)"
                      : isMidBattle
                        ? "rgba(232,197,71,0.2)"
                        : "rgba(255,255,255,0.1)",
                  },
                ]}
              />
              <Text style={styles.outcomeIcon}>{outcomeIcon}</Text>
            </View>

            {/* Title */}
            <Text
              style={[styles.gameTitle, isVictory && styles.gameTitleVictory]}
            >
              {outcomeTitle}
            </Text>
          </>
        )}

        <View style={styles.divider} />

        {/* Rank */}
        {!arenaMode &&
          uid &&
          (dailyRank !== null || rank !== null ? (
            <Text style={styles.rankText}>
              #{dailyMode ? dailyRank : rank}{" "}
              {dailyMode ? "in today's quest" : "among all warriors"}
            </Text>
          ) : (
            <Text style={styles.rankLoading}>Calculating rank...</Text>
          ))}

        {/* Final score */}
        <Text style={styles.finalScore}>{score.toLocaleString()}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{clearPct}%</Text>
            <Text style={styles.statLabel}>CLEARED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>x{bestCombo}</Text>
            <Text style={styles.statLabel}>BEST COMBO</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalCleared}</Text>
            <Text style={styles.statLabel}>CARDS</Text>
          </View>
        </View>

        {!arenaMode && uid && (
          <Text style={styles.dailySubmitted}>
            {dailyMode
              ? "✓ Score submitted to daily leaderboard"
              : "✓ Score saved to Hall of Glory"}
          </Text>
        )}
      </View>

      {/* Right — Buttons + Arena */}
      <View style={styles.gameOverRight}>
        {/* Arena final rankings */}
        {arenaMode && arenaPlayers.length > 0 && (
          <View style={styles.arenaBoard}>
            <Text style={styles.arenaBoardTitle}>🏆 FINAL RANKINGS</Text>
            <ScrollView style={styles.arenaScroll} nestedScrollEnabled>
              {arenaPlayers.map((p: any, i: number) => (
                <View
                  key={p.uid || i}
                  style={[styles.arenaRow, p.uid === uid && styles.arenaRowYou]}
                >
                  <Text style={styles.arenaRank}>
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}.`}
                  </Text>
                  <Text
                    style={[
                      styles.arenaName,
                      p.uid === uid && styles.arenaNameYou,
                    ]}
                  >
                    {p.heroName}
                  </Text>
                  <Text style={styles.arenaCombo}>x{p.bestCombo || 0}</Text>
                  <Text style={styles.arenaScore}>
                    {(p.score || 0).toLocaleString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Play again / return */}
        {!arenaMode && (
          <TouchableOpacity style={styles.goldBtn} onPress={onPlayAgain}>
            <Text style={styles.goldBtnText}>⚔ BATTLE AGAIN</Text>
          </TouchableOpacity>
        )}

        {arenaMode && (
          <TouchableOpacity style={styles.goldBtn} onPress={onConfirmQuit}>
            <Text style={styles.goldBtnText}>🏰 Return to Castle</Text>
          </TouchableOpacity>
        )}

        {!arenaMode && <ReturnToCastle onPress={onHome} />}

        {!dailyMode && !arenaMode && (
          <View style={styles.hallHint}>
            <Text style={styles.hallHintText}>
              ⚔ Check Hall of Glory for rankings
            </Text>
          </View>
        )}
      </View>

      {showCelebration && (
        <RecordCelebration
          score={score}
          heroName={heroName || "Unknown"}
          onDismiss={onDismissCelebration}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 32,
  },
  gameOverLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  gameOverRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  outcomeIconWrap: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  outcomeIconRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  outcomeIcon: {
    fontSize: 64,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
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
  gameTitleVictory: {
    color: "#FFD700",
    textShadowColor: "rgba(255,215,0,0.5)",
    fontSize: 34,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
    marginVertical: 3,
  },
  finalScore: {
    color: "#E8C547",
    fontSize: 40,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 4,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  statBox: { alignItems: "center" },
  statValue: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statLabel: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  dailySubmitted: {
    color: "rgba(123,237,159,0.65)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    paddingBottom: 2,
  },
  arenaBoard: {
    width: "100%",
    maxWidth: 350,
    marginVertical: 6,
  },
  arenaBoardTitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 4,
    textAlign: "center",
  },
  arenaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 2,
    gap: 8,
    backgroundColor: "rgba(232,197,71,0.02)",
  },
  arenaRowYou: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
  },
  arenaRank: { fontSize: 15, width: 28 },
  arenaName: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.5,
  },
  arenaNameYou: { color: "#E8C547" },
  arenaCombo: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 8,
  },
  arenaScore: {
    color: "#E8C547",
    fontSize: 15,
    fontWeight: "900",
  },
  arenaScroll: { maxHeight: 110 },
  rankText: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rankLoading: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 12,
    fontWeight: "700",
    fontStyle: "italic",
  },
  recordBanner: {
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.06)",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.35)",
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingVertical: 14,
    marginBottom: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  recordStars: {
    color: "#FFD700",
    fontSize: 12,
    letterSpacing: 8,
    textShadowColor: "rgba(255,215,0,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  recordIcon: {
    fontSize: 42,
  },
  recordTitle: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowColor: "rgba(255,215,0,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  recordSub: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
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
  hallHint: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hallHintText: {
    color: "rgba(232,197,71,0.25)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
})
