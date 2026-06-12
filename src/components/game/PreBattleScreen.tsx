// Pre-battle / daily-quest intro screen. Extracted from Game.tsx (Step 1.6).

import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import ReturnToCastle from "../ReturnToCastle"
import { TOTAL_LEVELS } from "../../game/config"
import type { ThemeConfig } from "../Armory"

export const PreBattleScreen = ({
  theme,
  background,
  dailyMode,
  gloryCharges,
  gloryActive,
  onActivateGlory,
  onEnter,
  onHome,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  dailyMode: boolean
  gloryCharges: number
  gloryActive: boolean
  onActivateGlory: () => void
  onEnter: () => void
  onHome: () => void
}) => (
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
    {background}

    {/* Left — Title + Info */}
    <View style={styles.preBattleLeft}>
      {/* Top ornament */}
      <View style={styles.screenOrnRow}>
        <View style={styles.screenOrnLine} />
        <Text style={styles.screenOrnDot}>◆</Text>
        <View style={styles.screenOrnLine} />
      </View>

      {/* Main icon — much bigger, with ring */}
      <View style={styles.preBattleIconWrap}>
        <View style={styles.preBattleIconRingOuter} />
        <View style={styles.preBattleIconRingInner} />
        <Text style={styles.preBattleIcon}>⚔️</Text>
      </View>

      {/* Title */}
      <Text style={styles.preBattleTitle}>
        {dailyMode ? "DAILY QUEST" : "PREPARE FOR BATTLE"}
      </Text>

      <View style={styles.screenOrnRow}>
        <View style={styles.screenOrnLine} />
        <Text style={styles.screenOrnRune}>ᚠ</Text>
        <View style={styles.screenOrnLine} />
        <Text style={styles.screenOrnRune}>ᚦ</Text>
        <View style={styles.screenOrnLine} />
      </View>

      <Text style={styles.preBattleSub}>
        {dailyMode
          ? "One attempt · Seeded deck · Glory awaits"
          : `${TOTAL_LEVELS} battlefields await your conquest`}
      </Text>

      {/* Progress dots — with level numbers */}
      {!dailyMode && (
        <View style={styles.preBattleLevels}>
          {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
            <View key={i} style={styles.preBattleLevel}>
              <View style={styles.progressDot}>
                <Text style={styles.preBattleLevelNum}>{i + 1}</Text>
              </View>
              <View
                style={[
                  styles.preBattleLevelLine,
                  i === TOTAL_LEVELS - 1 && { opacity: 0 },
                ]}
              />
            </View>
          ))}
        </View>
      )}

      {/* Bottom ornament */}
      <View style={styles.screenOrnRow}>
        <View style={styles.screenOrnLine} />
        <Text style={styles.screenOrnDot}>◆</Text>
        <View style={styles.screenOrnLine} />
      </View>
    </View>

    {/* Right — Glory Hunt + Enter */}
    <View style={styles.preBattleRight}>
      {/* Daily mode badge */}
      {dailyMode && (
        <View style={styles.dailyQuestBadge}>
          <Text style={styles.dailyQuestIcon}>📜</Text>
          <View>
            <Text style={styles.dailyQuestLabel}>DAILY QUEST</Text>
            <Text style={styles.dailyQuestSub}>Resets at midnight</Text>
          </View>
        </View>
      )}

      {/* Glory Hunt */}
      {!dailyMode && gloryCharges > 0 && (
        <TouchableOpacity
          style={[styles.gloryBtn, gloryActive && styles.gloryBtnActive]}
          onPress={onActivateGlory}
          disabled={gloryActive}
          activeOpacity={0.8}
        >
          <Text style={styles.gloryBtnIcon}>⚡</Text>
          <View>
            <Text style={styles.gloryBtnText}>
              {gloryActive ? "GLORY HUNT ACTIVE" : "Glory Hunt"}
            </Text>
            <Text style={styles.gloryBtnSub}>
              {gloryActive
                ? "2x points · 50% time"
                : `2x points · 50% time (${gloryCharges} charge)`}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Enter battle */}
      <TouchableOpacity style={styles.goldBtn} onPress={onEnter}>
        <Text style={[styles.goldBtnText, gloryActive && { color: "#fff" }]}>
          {gloryActive ? "⚡ BEGIN GLORY HUNT" : "⚔ ENTER BATTLE"}
        </Text>
      </TouchableOpacity>

      <ReturnToCastle onPress={onHome} />
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
  screenOrnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  screenOrnLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  screenOrnDot: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 7,
  },
  screenOrnRune: {
    color: "rgba(232,197,71,0.25)",
    fontSize: 12,
  },
  preBattleLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  preBattleRight: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  preBattleIconWrap: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  preBattleIconRingOuter: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
    borderStyle: "dashed",
  },
  preBattleIconRingInner: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
  },
  preBattleIcon: {
    fontSize: 52,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  preBattleTitle: {
    color: "#E8C547",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 5,
    textAlign: "center",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  preBattleSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 18,
  },
  preBattleLevels: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  preBattleLevel: {
    flexDirection: "row",
    alignItems: "center",
  },
  preBattleLevelNum: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
  },
  preBattleLevelLine: {
    width: 12,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  dailyQuestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,197,71,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },
  dailyQuestIcon: { fontSize: 22 },
  dailyQuestLabel: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  dailyQuestSub: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
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
  gloryBtnActive: {
    backgroundColor: "rgba(255,140,0,0.18)",
    borderColor: "#FF8C00",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
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
})
