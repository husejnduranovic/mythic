// Between-levels (field cleared / retreat) screen. Extracted from Game.tsx (Step 1.6).

import React from "react"
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { TOTAL_LEVELS } from "../../game/config"
import type { ThemeConfig } from "../Armory"

export const BetweenLevelsScreen = ({
  theme,
  background,
  cleared,
  remaining,
  level,
  score,
  gloryActive,
  gloryCharges,
  arenaMode,
  arenaPlayers,
  uid,
  arenaCountdown,
  onActivateGlory,
  onNextLevel,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  cleared: boolean
  remaining: number
  level: number
  score: number
  gloryActive: boolean
  gloryCharges: number
  arenaMode?: boolean
  arenaPlayers: any[]
  uid?: string | null
  arenaCountdown: number | null
  onActivateGlory: () => void
  onNextLevel: () => void
}) => (
  <View
    style={[
      styles.center,
      {
        flex: 1,
        backgroundColor: theme.battlefieldColor,
        flexDirection: "row",
        paddingHorizontal: 24,
        gap: 20,
        position: "relative",
        overflow: "hidden",
      },
    ]}
  >
    {background}

    {/* Left — Result + Score */}
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 36 }}>{cleared ? "⚔" : "🛡"}</Text>
      <View style={styles.banner}>
        <View style={styles.bannerEdge} />
        <View style={styles.bannerBody}>
          <Text style={styles.bannerTitle}>
            {cleared ? "FIELD CLEARED" : "RETREAT"}
          </Text>
          <Text style={styles.bannerSub}>
            Battlefield {level} of {TOTAL_LEVELS}
          </Text>
        </View>
        <View style={styles.bannerEdge} />
      </View>
      {!cleared && (
        <Text style={styles.partialText}>
          {remaining} beast{remaining !== 1 ? "s" : ""} remained
        </Text>
      )}
      <View style={styles.divider} />
      <View style={styles.spoilsCard}>
        <Text style={styles.spoilsCardLabel}>TOTAL SPOILS</Text>
        <Text style={styles.spoilsCardValue}>{score.toLocaleString()}</Text>
      </View>

      {/* Consolidated achievement banner — shows the single most exciting thing
    that happened this layout, prioritized */}
      {(() => {
        // Priority: Perfect Clear > Glory Hunt
        if (cleared) {
          return (
            <View style={[styles.achievementBanner, styles.achievementPerfect]}>
              <Text style={{ fontSize: 18 }}>✨</Text>
              <View style={styles.achievementCenter}>
                <Text style={styles.achievementTitle}>PERFECT CLEAR</Text>
                <Text style={styles.achievementSub}>+50,000 spoils bonus</Text>
              </View>
              <Text style={{ fontSize: 18 }}>✨</Text>
            </View>
          )
        }
        if (gloryActive) {
          return (
            <View style={[styles.achievementBanner, styles.achievementGlory]}>
              <Text style={{ fontSize: 18 }}>⚡</Text>
              <View style={styles.achievementCenter}>
                <Text style={[styles.achievementTitle, { color: "#FF8C00" }]}>
                  GLORY HUNT ACTIVE
                </Text>
                <Text
                  style={[
                    styles.achievementSub,
                    { color: "rgba(255,140,0,0.6)" },
                  ]}
                >
                  2× spoils until end of run
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>⚡</Text>
            </View>
          )
        }
        return null
      })()}

      {/* Progress dots */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i < level && styles.progressDotFilled]}
          >
            {i < level && <Text style={styles.progressCheck}>✓</Text>}
          </View>
        ))}
      </View>
    </View>

    {/* Right — Actions */}
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {/* Arena scoreboard */}
      {arenaMode && arenaPlayers.length > 0 && (
        <View style={styles.arenaBoard}>
          <Text style={styles.arenaBoardTitle}>⚔ ARENA STANDINGS</Text>
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
                <Text style={styles.arenaScore}>
                  {(p.currentLevel || 0) >= 1
                    ? (p.score || 0).toLocaleString()
                    : "..."}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Info card — next multiplier */}
      {level < TOTAL_LEVELS && (
        <View style={styles.nextBattleInfo}>
          <Text style={styles.nextBattleLabel}>NEXT BATTLEFIELD</Text>
          <Text style={styles.nextBattleMultiplier}>
            {(1 + level * 0.5).toFixed(1)}x spoils
          </Text>
        </View>
      )}

      {/* Glory Hunt */}
      {level < TOTAL_LEVELS && gloryCharges > 0 && !gloryActive && (
        <TouchableOpacity
          style={styles.gloryBtn}
          onPress={onActivateGlory}
          activeOpacity={0.8}
        >
          <Text style={styles.gloryBtnIcon}>⚡</Text>
          <View>
            <Text style={styles.gloryBtnText}>Glory Hunt</Text>
            <Text style={styles.gloryBtnSub}>
              2x points · 50% time ({gloryCharges} left)
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Next Battle / Arena */}
      {arenaMode ? (
        (() => {
          const allReady =
            arenaPlayers.length > 0 &&
            arenaPlayers.every((p: any) => (p.currentLevel || 0) >= level)
          return allReady ? (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownText}>{arenaCountdown || "GO!"}</Text>
              <Text style={styles.countdownLabel}>NEXT BATTLE IN</Text>
            </View>
          ) : (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingArenaText}>
                Waiting... (
                {
                  arenaPlayers.filter(
                    (p: any) =>
                      (p.currentLevel || 0) >= level || p.disconnected,
                  ).length
                }
                /{arenaPlayers.length})
              </Text>
            </View>
          )
        })()
      ) : (
        <TouchableOpacity style={styles.nextBattleBtn} onPress={onNextLevel}>
          <Text style={styles.nextBattleBtnText}>
            {level >= TOTAL_LEVELS
              ? "🏆 Claim Victory"
              : gloryActive
                ? "⚡ Begin Glory Hunt"
                : "⚔ Next Battle"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
  partialText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    fontStyle: "italic",
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
    marginVertical: 3,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bannerEdge: {
    width: 36,
    height: 2,
    backgroundColor: "#E8C547",
    borderRadius: 1,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  bannerBody: {
    paddingHorizontal: 18,
    alignItems: "center",
  },
  bannerTitle: {
    color: "#E8C547",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
  },
  spoilsCard: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginVertical: 2,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  spoilsCardLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 5,
  },
  spoilsCardValue: {
    color: "#E8C547",
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  achievementBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    width: "100%",
    marginVertical: 2,
  },
  achievementPerfect: {
    backgroundColor: "rgba(255,215,0,0.08)",
    borderColor: "rgba(255,215,0,0.4)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  achievementGlory: {
    backgroundColor: "rgba(255,140,0,0.07)",
    borderColor: "rgba(255,140,0,0.35)",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementCenter: {
    alignItems: "center",
  },
  achievementTitle: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(255,215,0,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  achievementSub: {
    color: "rgba(255,215,0,0.55)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  progressRow: { flexDirection: "row", gap: 10, marginVertical: 8 },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotFilled: {
    backgroundColor: "rgba(232,197,71,0.15)",
    borderColor: "#E8C547",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  progressCheck: {
    color: "#E8C547",
    fontSize: 11,
    fontWeight: "900",
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
  arenaScore: {
    color: "#E8C547",
    fontSize: 15,
    fontWeight: "900",
  },
  arenaScroll: { maxHeight: 110 },
  countdownBox: { alignItems: "center", marginVertical: 4 },
  countdownText: {
    color: "#E8C547",
    fontSize: 48,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownLabel: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
  },
  waitingArenaText: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  waitingBox: { paddingVertical: 10 },
  nextBattleInfo: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  nextBattleLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
  nextBattleMultiplier: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  gloryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,140,0,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,140,0,0.4)",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 220,
  },
  gloryBtnIcon: { fontSize: 20 },
  gloryBtnText: {
    color: "#FF8C00",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  gloryBtnSub: {
    color: "rgba(255,140,0,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 1,
  },
  nextBattleBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 32,
    paddingVertical: 13,
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
  nextBattleBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
})
