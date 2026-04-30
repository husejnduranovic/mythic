import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import firestore from "@react-native-firebase/firestore"
import { getUserProfile } from "../services/Dailychallenge"

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
        <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />
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

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* LEFT SIDE — Hero identity */}
        <View style={styles.leftSection}>
          {/* Ornament */}
          <View style={styles.headerOrn}>
            <View style={styles.headerLine} />
            <Text style={styles.headerDot}>◆</Text>
            <View style={styles.headerLine} />
          </View>

          {/* Avatar ring */}
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatarGlow,
                { backgroundColor: rank.color + "20" },
              ]}
            />
            <View style={[styles.avatarRingOuter, { borderColor: rank.color }]}>
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

          {/* Rank title */}
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
            {nextRank.needed > 0 && (
              <Text style={styles.rankProgress}>
                {nextRank.needed} more to{" "}
                <Text style={{ color: rank.color }}>{nextRank.name}</Text>
              </Text>
            )}
            {nextRank.needed === 0 && (
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
        </View>

        {/* Divider */}
        <View style={styles.verticalDivider}>
          <View style={styles.vDividerLine} />
          <Text style={styles.vDividerDot}>◆</Text>
          <View style={styles.vDividerLine} />
        </View>

        {/* RIGHT SIDE — Stats */}
        <View style={styles.rightSection}>
          {/* Section header */}
          <View style={styles.statsHeader}>
            <View style={styles.headerOrn}>
              <View style={styles.headerLine} />
              <Text style={styles.headerDot}>◆</Text>
              <View style={styles.headerLine} />
            </View>
            <Text style={styles.statsTitle}>BATTLE STATISTICS</Text>
          </View>

          {/* Big stats */}
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

          {/* Stats list */}
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
              <Text style={styles.statValue}>{data.dailyWins || 0}</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🏆 Win Rate</Text>
              <Text style={styles.statValue}>
                {games > 0
                  ? `${Math.round(((data.totalCardsCleared || 0) / (games * 30)) * 100)}%`
                  : "0%"}
              </Text>
            </View>
          </View>

          {/* Total score */}
          <View style={styles.totalScoreBox}>
            <View style={styles.totalGlow} />
            <Text style={styles.totalScoreLabel}>LIFETIME SPOILS</Text>
            <Text style={styles.totalScoreValue}>
              {(data.totalScore || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Return to Castle</Text>
      </TouchableOpacity>
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
  },

  // Background
  bgLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgGlow: {
    position: "absolute",
    top: "20%",
    left: "25%",
    width: "50%",
    height: "55%",
    borderRadius: 300,
    backgroundColor: "rgba(232,197,71,0.04)",
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

  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
    maxWidth: 680,
  },

  // Headers
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  headerLine: {
    width: 20,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
  },
  headerDot: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 7,
  },

  // LEFT SECTION
  leftSection: { flex: 1, alignItems: "center" },

  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarRingOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  heroAvatarText: { fontSize: 28 },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroName: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  editIcon: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 13,
  },

  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
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

  // Rank badge
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  rankBadgeLine: {
    width: 16,
    height: 1,
  },
  rankName: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },

  // Progress
  rankBarOuter: { width: "80%", marginTop: 8, alignItems: "center" },
  rankBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 2,
    overflow: "hidden",
  },
  rankFill: { height: "100%", borderRadius: 2 },
  rankProgress: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    marginTop: 3,
    textAlign: "center",
    fontWeight: "600",
  },

  // Milestones
  milestoneRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  milestoneItem: { alignItems: "center" },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneCheck: { color: "#0B1410", fontSize: 8, fontWeight: "900" },
  milestoneLabel: { color: "rgba(255,255,255,0.2)", fontSize: 8, marginTop: 2 },

  // Divider
  verticalDivider: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  vDividerLine: {
    width: 1,
    height: 70,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  vDividerDot: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 8,
  },

  // RIGHT SECTION
  rightSection: { flex: 1, gap: 7 },
  statsHeader: { alignItems: "center", marginBottom: 2 },
  statsTitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
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
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bigStatLabel: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 7,
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
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
  },
  statValue: { color: "#E8C547", fontSize: 14, fontWeight: "900" },
  statSep: { height: 1, backgroundColor: "rgba(232,197,71,0.03)" },

  totalScoreBox: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    paddingVertical: 7,
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
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
  totalScoreValue: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  backBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  backText: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
})

export default Profile
