import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import firestore from "@react-native-firebase/firestore"
import { getUserProfile } from "../services/ScoreService"
import ReturnToCastle from "./ReturnToCastle"

import { Dimensions } from "react-native"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
// Profile je dizajniran za ~360px visine landscape ekrana.
// Na manjem ekranu, sve se smanji proporcionalno.
const UI_SCALE = Math.min(SCREEN_H / 360, 1)
const ms = (size: number) => Math.round(size * UI_SCALE)

interface ProfileProps {
  onBack: () => void
  uid: string
  heroName: string
  onNameChange?: (newName: string) => void
}

const RANKS = [
  { min: 0, name: "RECRUIT", icon: "🏹", color: "rgba(232,197,71,0.4)" },
  { min: 3, name: "FOOTMAN", icon: "🗡", color: "#8B7355" },
  { min: 5, name: "APPRENTICE", icon: "📜", color: "#4FC3F7" },
  { min: 10, name: "PROVEN FIGHTER", icon: "🛡", color: "#7BED9F" },
  { min: 25, name: "VETERAN WARRIOR", icon: "⚔", color: "#FF6B35" },
  { min: 50, name: "BATTLE MASTER", icon: "🐉", color: "#FF4757" },
  { min: 75, name: "WARLORD", icon: "🔥", color: "#E040FB" },
  { min: 100, name: "LEGENDARY CHAMPION", icon: "👑", color: "#FFD700" },
  { min: 150, name: "MYTHIC CONQUEROR", icon: "💀", color: "#FF1744" },
  { min: 200, name: "IMMORTAL KING", icon: "♚", color: "#E8C547" },
  { min: 300, name: "DIVINE RULER", icon: "⚡", color: "#00E5FF" },
  { min: 500, name: "TITAN OF WAR", icon: "🌋", color: "#FF6D00" },
  { min: 750, name: "ETERNAL OVERLORD", icon: "🌀", color: "#D500F9" },
  { min: 1000, name: "GOD OF THE PEAKS", icon: "✦", color: "#FFFFFF" },
]

const getRank = (games: number) => {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (games >= r.min) rank = r
  }
  return rank
}

const getNextRank = (games: number) => {
  for (const r of RANKS) {
    if (games < r.min)
      return { name: r.name, needed: r.min - games, min: r.min }
  }
  return { name: "MAX RANK", needed: 0, min: 1000 }
}

const getMilestones = (games: number) => {
  const thresholds = [5, 10, 25, 50, 100, 200, 500, 1000]
  const lastReachedIdx = thresholds.findLastIndex((t) => games >= t)
  const start = Math.max(0, lastReachedIdx - 2)
  const end = Math.min(thresholds.length, start + 6)
  return thresholds.slice(start, end).map((t) => ({
    threshold: t,
    label: t.toString(),
    reached: games >= t,
  }))
}

const getStreakColor = (streak: number): string => {
  if (streak >= 60) return "#E8E8F0" // near white
  if (streak >= 42) return "#C8C8D8" // light steel
  if (streak >= 21) return "#A8A8C0" // medium steel
  if (streak >= 7) return "#9090A8" // steel blue-grey
  if (streak >= 3) return "#787890" // muted steel
  return "#606078" // dark steel
}

const getStreakIcon = (streak: number): string => {
  if (streak >= 30) return "🔥"
  if (streak >= 14) return "🔥"
  if (streak >= 7) return "🔥"
  if (streak >= 3) return "🔥"
  return "🕯"
}

const Profile = ({ onBack, uid, heroName, onNameChange }: ProfileProps) => {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(heroName)
  const [nameError, setNameError] = useState("")
  const [nameSaving, setNameSaving] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const streakPulse = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [loading])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  useEffect(() => {
    getUserProfile(uid).then((data) => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  const handleNameChange = async () => {
    const trimmed = newName.trim()
    if (trimmed.length < 2) {
      setNameError("Min 2 characters")
      return
    }
    if (trimmed.length > 16) {
      setNameError("Max 16 characters")
      return
    }
    if (trimmed === heroName) {
      setEditingName(false)
      return
    }

    setNameSaving(true)
    setNameError("")

    try {
      const existing = await firestore()
        .collection("users")
        .where("heroName", "==", trimmed)
        .limit(1)
        .get()

      if (!existing.empty && existing.docs[0].id !== uid) {
        setNameError("Name already taken")
        setNameSaving(false)
        return
      }

      await firestore()
        .collection("users")
        .doc(uid)
        .update({ heroName: trimmed })

      const allTimeDoc = await firestore()
        .collection("allTimeScores")
        .doc(uid)
        .get()
      if (allTimeDoc.exists()) {
        await firestore()
          .collection("allTimeScores")
          .doc(uid)
          .update({ heroName: trimmed })
      }

      const gameScoreDocs = await firestore()
        .collection("gameScores")
        .where("uid", "==", uid)
        .get()
      for (const doc of gameScoreDocs.docs) {
        await doc.ref.update({ heroName: trimmed })
      }

      const dailyDocs = await firestore()
        .collection("dailyScores")
        .where("uid", "==", uid)
        .get()
      for (const doc of dailyDocs.docs) {
        await doc.ref.update({ heroName: trimmed })
      }

      setEditingName(false)
      setNameSaving(false)
      onNameChange?.(trimmed)
    } catch (err) {
      setNameError("Failed to update")
      console.log("err name update", err)
      setNameSaving(false)
    }
  }

  if (loading)
    return (
      <View style={styles.container}>
        <View style={styles.bgLayer} pointerEvents="none">
          <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />
        </View>
        <ActivityIndicator size="large" color="#E8C547" />
        <Text style={styles.loadingText}>Loading warrior profile...</Text>
      </View>
    )

  const data = profile || {}
  const games = data.totalGames || 0
  const rank = getRank(games)
  const nextRank = getNextRank(games)
  const milestones = getMilestones(games)
  const currentStreak = data.currentStreak || 0
  const bestStreak = data.bestStreak || 0
  const streakColor = getStreakColor(currentStreak)
  const streakIcon = getStreakIcon(currentStreak)

  const currentRankMin = rank.min
  const nextRankMin = nextRank.min
  const progressPct =
    nextRank.needed === 0
      ? 100
      : ((games - currentRankMin) / (nextRankMin - currentRankMin)) * 100

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgLayer} pointerEvents="none">
        <Animated.View
          style={[
            styles.bgGlow,
            {
              opacity: glowPulse,
              backgroundColor: rank.color + "18",
            },
          ]}
        />
        <Text style={[styles.bgRune, { top: "10%", left: "4%" }]}>ᚠ</Text>
        <Text style={[styles.bgRune, { top: "12%", right: "5%" }]}>ᚦ</Text>
        <Text style={[styles.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
        <Text style={[styles.bgRune, { bottom: "18%", right: "6%" }]}>ᛟ</Text>
        <Text style={[styles.bgBeast, { top: "25%", left: "12%" }]}>⚔</Text>
        <Text style={[styles.bgBeast, { bottom: "28%", right: "10%" }]}>
          🏆
        </Text>
        <View style={styles.bgHLine} />
      </View>

      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* LEFT SIDE */}
          <View style={styles.leftSection}>
            <View style={styles.headerOrn}>
              <View style={styles.headerLine} />
              <Text style={styles.headerDot}>◆</Text>
              <View style={styles.headerLine} />
            </View>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatarGlow,
                  { backgroundColor: rank.color + "20" },
                ]}
              />
              <View
                style={[styles.avatarRingOuter, { borderColor: rank.color }]}
              >
                <View style={[styles.heroAvatar, { borderColor: rank.color }]}>
                  <Text style={styles.heroAvatarText}>{rank.icon}</Text>
                </View>
              </View>
            </View>

            {/* Name */}
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  maxLength={16}
                  autoFocus
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
                <TouchableOpacity
                  style={styles.nameSaveBtn}
                  onPress={handleNameChange}
                  disabled={nameSaving}
                >
                  <Text style={styles.nameSaveBtnText}>
                    {nameSaving ? "..." : "✓"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nameCancelBtn}
                  onPress={() => {
                    setEditingName(false)
                    setNewName(heroName)
                    setNameError("")
                  }}
                >
                  <Text style={styles.nameCancelBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setEditingName(true)}
                style={styles.nameRow}
              >
                <Text style={styles.heroName}>{heroName}</Text>
                <Text style={styles.editIcon}>✎</Text>
              </TouchableOpacity>
            )}
            {nameError !== "" && (
              <Text style={styles.nameError}>{nameError}</Text>
            )}

            {/* Rank */}
            <View style={styles.rankBadge}>
              <View
                style={[styles.rankBadgeLine, { backgroundColor: rank.color }]}
              />
              <Text style={[styles.rankName, { color: rank.color }]}>
                {rank.name}
              </Text>
              <View
                style={[styles.rankBadgeLine, { backgroundColor: rank.color }]}
              />
            </View>

            {/* Progress bar */}
            <View style={styles.rankBarOuter}>
              <View style={styles.rankBarTrack}>
                <View
                  style={[
                    styles.rankFill,
                    {
                      width: `${Math.min(progressPct, 100)}%`,
                      backgroundColor: rank.color,
                    },
                  ]}
                />
              </View>
              {nextRank.needed > 0 ? (
                <Text style={styles.rankProgress}>
                  {nextRank.needed} more to{" "}
                  <Text style={{ color: rank.color }}>{nextRank.name}</Text>
                </Text>
              ) : (
                <Text style={[styles.rankProgress, { color: rank.color }]}>
                  Maximum rank achieved
                </Text>
              )}
            </View>

            {/* Milestones */}
            <View style={styles.milestoneRow}>
              {milestones.map((m, i) => (
                <View key={i} style={styles.milestoneItem}>
                  <View
                    style={[
                      styles.milestoneDot,
                      m.reached && {
                        backgroundColor: rank.color,
                        borderColor: rank.color,
                      },
                    ]}
                  >
                    {m.reached && <Text style={styles.milestoneCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      m.reached && { color: rank.color },
                    ]}
                  >
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── STREAK ── */}
            {/* ── STREAK ── */}
            <View style={styles.streakWrap}>
              <View style={styles.streakOrnRow}>
                <View style={styles.streakOrnLine} />
                <Text style={styles.streakOrnDot}>◆</Text>
                <View style={styles.streakOrnLine} />
              </View>

              {/* Main streak display */}
              <View
                style={[
                  styles.streakBox,
                  {
                    borderColor: streakColor + "50",
                    shadowColor:
                      currentStreak >= 7 ? streakColor : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.streakGlow,
                    { backgroundColor: streakColor + "08" },
                  ]}
                />

                {/* Left — fire icon, bigger at higher streaks */}
                <Animated.Text
                  style={[
                    styles.streakFireIcon,
                    {
                      opacity: streakPulse,
                      fontSize:
                        currentStreak >= 42
                          ? 40
                          : currentStreak >= 21
                            ? 36
                            : currentStreak >= 7
                              ? 32
                              : 26,
                    },
                  ]}
                >
                  {currentStreak >= 1 ? "🔥" : "🕯"}
                </Animated.Text>

                {/* Center — big number */}
                <View style={styles.streakCenter}>
                  <Text style={[styles.streakCount, { color: streakColor }]}>
                    {currentStreak}
                  </Text>
                  <Text style={styles.streakLabel}>DAY STREAK</Text>
                </View>

                {/* Right — best streak */}
                <View style={styles.streakBestWrap}>
                  <Text style={styles.streakBestIcon}>🏆</Text>
                  <Text
                    style={[
                      styles.streakBestCount,
                      { color: "rgba(232,197,71,0.7)" },
                    ]}
                  >
                    {bestStreak}
                  </Text>
                  <Text style={styles.streakBestLabel}>BEST</Text>
                </View>
              </View>

              {/* Milestone track */}
              <View style={styles.streakTrack}>
                {[
                  { days: 7, label: "7d", name: "FLAME\nBORN", icon: "🔥" },
                  { days: 21, label: "21d", name: "EMBER\nFORGED", icon: "🌋" },
                  {
                    days: 42,
                    label: "42d",
                    name: "INFERNO\nSWORN",
                    icon: "⚡",
                  },
                  { days: 60, label: "60d", name: "ETERNAL\nFLAME", icon: "♾" },
                ].map((m, i) => {
                  const reached = bestStreak >= m.days
                  const active = currentStreak >= m.days
                  const milestoneColor = reached
                    ? streakColor
                    : "rgba(255,255,255,0.1)"
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <View
                          style={[
                            styles.streakTrackLine,
                            {
                              backgroundColor:
                                bestStreak >= m.days
                                  ? streakColor + "40"
                                  : "rgba(255,255,255,0.06)",
                            },
                          ]}
                        />
                      )}
                      <View style={styles.streakMilestoneWrap}>
                        <View
                          style={[
                            styles.streakMilestoneDot,
                            reached && {
                              backgroundColor: streakColor + "20",
                              borderColor: streakColor,
                              shadowColor: streakColor,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: active ? 0.6 : 0.2,
                              shadowRadius: active ? 8 : 4,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.streakMilestoneIcon,
                              { opacity: reached ? 1 : 0.25 },
                            ]}
                          >
                            {m.icon}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.streakMilestoneDays,
                            reached && { color: streakColor },
                          ]}
                        >
                          {m.label}
                        </Text>
                        <Text
                          style={[
                            styles.streakMilestoneName,
                            reached && { color: streakColor + "80" },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </View>
                    </React.Fragment>
                  )
                })}
              </View>

              {/* Unlock hint */}
              <Text style={styles.streakUnlockHint}>
                🔥 Streak milestones unlock exclusive Armory items
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.verticalDivider}>
            <View style={styles.vDividerLine} />
            <Text style={styles.vDividerDot}>◆</Text>
            <View style={styles.vDividerLine} />
          </View>

          {/* RIGHT SIDE */}
          <View style={styles.rightSection}>
            <View style={styles.statsHeader}>
              <View style={styles.headerOrn}>
                <View style={styles.headerLine} />
                <Text style={styles.headerDot}>◆</Text>
                <View style={styles.headerLine} />
              </View>
              <Text style={styles.statsTitle}>BATTLE STATISTICS</Text>
            </View>

            <View style={styles.bigStatRow}>
              <View style={styles.bigStat}>
                <Text style={styles.bigStatValue}>
                  {(data.bestScore || 0).toLocaleString()}
                </Text>
                <Text style={styles.bigStatLabel}>BEST SCORE</Text>
              </View>
              <View style={styles.bigStatDivider} />
              <View style={styles.bigStat}>
                <Text style={styles.bigStatValue}>x{data.bestCombo || 0}</Text>
                <Text style={styles.bigStatLabel}>BEST COMBO</Text>
              </View>
            </View>

            <View style={styles.statsList}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>🃏 Cards Cleared</Text>
                <Text style={styles.statValue}>
                  {(data.totalCardsCleared || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>⚔ Battles Fought</Text>
                <Text style={styles.statValue}>{games}</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>📜 Daily Quests</Text>
                <Text style={styles.statValue}>
                  {data.dailyQuestsPlayed || 0}
                </Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>🏆 Avg Score</Text>
                <Text style={styles.statValue}>
                  {games > 0
                    ? Math.round(
                        (data.totalScore || 0) / games,
                      ).toLocaleString()
                    : "0"}
                </Text>
              </View>
            </View>

            <View style={styles.totalScoreBox}>
              <View style={styles.totalGlow} />
              <Text style={styles.totalScoreLabel}>LIFETIME SPOILS</Text>
              <Text style={styles.totalScoreValue}>
                {(data.totalScore || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <ReturnToCastle onPress={onBack} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1410",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 8, // add this
  },
  milestoneDot: {
    width: 16, // was 20
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneCheck: { color: "#0B1410", fontSize: 7, fontWeight: "900" }, // was 9
  milestoneLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 7, // was 9
    marginTop: 1,
    fontWeight: "700",
  },

  // Streak section — tighter
  streakWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: ms(6),
    gap: ms(6),
  },
  streakBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(20,8,0,0.6)",
    borderWidth: 1.5,
    paddingHorizontal: 12, // was 16
    paddingVertical: ms(8),
    borderRadius: ms(10), // was 12
    gap: 6, // was 8
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  streakFireIcon: {
    fontSize: 22, // was dynamic, cap it at 22
    textShadowColor: "rgba(150,150,180,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  streakCount: {
    fontSize: ms(26),
    lineHeight: ms(30),
  },
  streakLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 7, // was 8
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 1,
  },
  streakBestCount: {
    fontSize: 14, // was 18
    fontWeight: "900",
  },
  streakBestIcon: { fontSize: 11 }, // was 14
  streakBestLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 6, // was 7
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Milestone track — smaller dots
  streakMilestoneDot: {
    width: 28, // was 36
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  streakMilestoneIcon: { fontSize: 13 }, // was 18
  streakMilestoneDays: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  streakMilestoneName: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 6, // was 7
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 8, // was 10
  },
  streakUnlockHint: {
    color: "rgba(150,150,180,0.4)",
    fontSize: 8, // was 9
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },

  // content gap tighter
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    width: "100%",
    maxWidth: 680,
  },

  // avatarWrap tighter
  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4, // was 6
  },
  bgLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "20%",
    left: "25%",
    width: "50%",
    height: "55%",
    borderRadius: 300,
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.04)",
  },
  bgBeast: {
    position: "absolute",
    fontSize: 42,
    color: "rgba(232,197,71,0.035)",
  },
  bgHLine: {
    position: "absolute",
    top: "55%",
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  loadingText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 12,
    marginTop: 14,
    letterSpacing: 2,
  },
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  headerLine: { width: 20, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  headerDot: { color: "rgba(232,197,71,0.4)", fontSize: 7 },

  // LEFT
  leftSection: { flex: 1, alignItems: "center" },

  avatarGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarRingOuter: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  heroAvatar: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  heroAvatarText: { fontSize: ms(22) }, // was 28
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroName: {
    color: "#E8C547",
    fontSize: 17, // was 22
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(232,197,71,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  editIcon: { color: "rgba(232,197,71,0.3)", fontSize: 13 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  nameInput: {
    color: "#E8C547",
    fontSize: 16,
    fontWeight: "900",
    borderBottomWidth: 1,
    borderBottomColor: "#E8C547",
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 100,
    textAlign: "center",
  },
  nameSaveBtn: {
    backgroundColor: "rgba(123,237,159,0.15)",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(123,237,159,0.4)",
  },
  nameSaveBtnText: { color: "#7BED9F", fontSize: 11, fontWeight: "900" },
  nameCancelBtn: {
    backgroundColor: "rgba(255,100,100,0.1)",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.3)",
  },
  nameCancelBtnText: {
    color: "rgba(255,100,100,0.7)",
    fontSize: 11,
    fontWeight: "900",
  },
  nameError: {
    color: "#FF4757",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  rankBadgeLine: { width: 16, height: 1 },
  rankName: { fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  rankBarOuter: { width: "85%", marginTop: 4, alignItems: "center" }, // was marginTop: 8

  rankBarTrack: {
    width: "100%",
    height: 4, // was 5
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  rankFill: { height: "100%", borderRadius: 2 },
  rankProgress: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8, // was 10
    marginTop: 2, // was 4
    textAlign: "center",
    fontWeight: "600",
  },
  milestoneRow: {
    flexDirection: "row",
    gap: 5, // was 6
    marginTop: 6, // was 12
    flexWrap: "wrap",
    justifyContent: "center",
  },
  milestoneItem: { alignItems: "center", gap: 3 },

  // ── STREAK ──

  streakIcon: { fontSize: 28 },

  streakBest: { alignItems: "center" },
  streakBestValue: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 13,
    fontWeight: "900",
  },
  streakMilestones: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  streakMilestoneItem: { alignItems: "center", gap: 3 },
  streakMilestoneCheck: { color: "#0B1410", fontSize: 8, fontWeight: "900" },
  streakMilestoneLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 8,
    fontWeight: "700",
  },

  // DIVIDER
  verticalDivider: { alignItems: "center", justifyContent: "center", gap: 4 },
  vDividerLine: {
    width: 1,
    height: 80,
    backgroundColor: "rgba(232,197,71,0.15)",
  },
  vDividerDot: { color: "rgba(232,197,71,0.4)", fontSize: 9 },

  // RIGHT
  rightSection: { flex: 1, gap: 7 },
  statsHeader: { alignItems: "center", marginBottom: 2 },
  statsTitle: {
    color: "rgba(232,197,71,0.65)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 2,
  },
  bigStatRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingVertical: 8,
  },
  bigStat: { alignItems: "center" },
  bigStatValue: {
    color: "#E8C547",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bigStatLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 2,
  },
  bigStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(232,197,71,0.08)",
  },
  statsList: {
    backgroundColor: "rgba(232,197,71,0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statSep: { height: 1, backgroundColor: "rgba(232,197,71,0.03)" },
  totalScoreBox: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  totalGlow: {
    position: "absolute",
    top: -20,
    left: "30%",
    width: 80,
    height: 60,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 40,
  },
  totalScoreLabel: {
    color: "rgba(232,197,71,0.55)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 2,
  },
  totalScoreValue: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  streakOrnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "80%",
  },
  streakOrnLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  streakOrnDot: { color: "rgba(232,197,71,0.3)", fontSize: 6 },

  streakGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  streakCenter: { flex: 1, alignItems: "center" },

  streakBestWrap: { alignItems: "center", gap: 1 },

  streakTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  streakTrackLine: {
    flex: 1,
    height: 1.5,
    marginTop: 18,
    alignSelf: "flex-start",
  },
  streakMilestoneWrap: { alignItems: "center", gap: 4 },
})

export default Profile
