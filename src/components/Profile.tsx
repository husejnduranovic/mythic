import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { getUserProfile } from "../services/Dailychallenge"

interface ProfileProps {
  onBack: () => void
  uid: string
  heroName: string
}

const getRankName = (games: number): string => {
  if (games >= 100) return "LEGENDARY CHAMPION"
  if (games >= 50) return "BATTLE MASTER"
  if (games >= 25) return "VETERAN WARRIOR"
  if (games >= 10) return "PROVEN FIGHTER"
  if (games >= 5) return "APPRENTICE"
  return "RECRUIT"
}

const getRankIcon = (games: number): string => {
  if (games >= 100) return "👑"
  if (games >= 50) return "🐉"
  if (games >= 25) return "⚔"
  if (games >= 10) return "🛡"
  if (games >= 5) return "🗡"
  return "🏹"
}

const getRankColor = (games: number): string => {
  if (games >= 100) return "#FFD700"
  if (games >= 50) return "#FF4757"
  if (games >= 25) return "#FF6B35"
  if (games >= 10) return "#7BED9F"
  if (games >= 5) return "#4FC3F7"
  return "rgba(232,197,71,0.5)"
}

const getNextRank = (games: number): { name: string; needed: number } => {
  if (games >= 100) return { name: "MAX RANK", needed: 0 }
  if (games >= 50) return { name: "Legendary Champion", needed: 100 - games }
  if (games >= 25) return { name: "Battle Master", needed: 50 - games }
  if (games >= 10) return { name: "Veteran Warrior", needed: 25 - games }
  if (games >= 5) return { name: "Proven Fighter", needed: 10 - games }
  return { name: "Apprentice", needed: 5 - games }
}

const Profile = ({ onBack, uid, heroName }: ProfileProps) => {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const leftOpacity = useRef(new Animated.Value(0)).current
  const rightOpacity = useRef(new Animated.Value(0)).current
  const leftSlide = useRef(new Animated.Value(-20)).current
  const rightSlide = useRef(new Animated.Value(20)).current

  useEffect(() => {
    if (!loading) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(leftSlide, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rightOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rightSlide, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start()
    }
  }, [loading])

  useEffect(() => {
    getUserProfile(uid).then((data) => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  if (loading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E8C547" />
      </View>
    )

  const data = profile || {}
  const games = data.totalGames || 0
  const rankColor = getRankColor(games)
  const nextRank = getNextRank(games)
  const milestones = [
    { threshold: 5, label: "5", reached: games >= 5 },
    { threshold: 10, label: "10", reached: games >= 10 },
    { threshold: 25, label: "25", reached: games >= 25 },
    { threshold: 50, label: "50", reached: games >= 50 },
    { threshold: 100, label: "100", reached: games >= 100 },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* LEFT — Hero identity + rank */}
        <Animated.View
          style={[
            styles.leftSection,
            { opacity: leftOpacity, transform: [{ translateX: leftSlide }] },
          ]}
        >
          <View style={[styles.heroAvatar, { borderColor: rankColor }]}>
            <Text style={styles.heroAvatarText}>{getRankIcon(games)}</Text>
          </View>
          <Text style={styles.heroName}>{heroName}</Text>
          <Text style={[styles.rankName, { color: rankColor }]}>
            {getRankName(games)}
          </Text>

          <View style={styles.rankBarOuter}>
            <View style={styles.rankBarTrack}>
              <View
                style={[
                  styles.rankFill,
                  {
                    width: `${Math.min((games / 100) * 100, 100)}%`,
                    backgroundColor: rankColor,
                  },
                ]}
              />
            </View>
          </View>
          {nextRank.needed > 0 && (
            <Text style={styles.rankProgress}>
              {nextRank.needed} more battles to {nextRank.name}
            </Text>
          )}

          {/* Milestone dots */}
          <View style={styles.milestoneRow}>
            {milestones.map((m, i) => (
              <View key={i} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneDot,
                    m.reached && {
                      backgroundColor: rankColor,
                      borderColor: rankColor,
                    },
                  ]}
                >
                  {m.reached && <Text style={styles.milestoneCheck}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.milestoneLabel,
                    m.reached && { color: rankColor },
                  ]}
                >
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={styles.verticalDivider} />

        {/* RIGHT — Stats */}
        <Animated.View
          style={[
            styles.rightSection,
            { opacity: rightOpacity, transform: [{ translateX: rightSlide }] },
          ]}
        >
          <Text style={styles.statsTitle}>⚔ BATTLE STATISTICS</Text>

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
              <Text style={styles.statValue}>{data.dailyWins || 0}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Return to Castle</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A12",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    width: "100%",
    maxWidth: 600,
  },

  leftSection: { alignItems: "center", flex: 1 },
  heroAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  heroAvatarText: { fontSize: 32 },
  heroName: {
    color: "#E8C547",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  rankName: { fontSize: 11, fontWeight: "900", letterSpacing: 3, marginTop: 4 },

  rankBarOuter: { width: "80%", marginTop: 8 },
  rankBarTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  rankFill: { height: "100%", borderRadius: 3 },
  rankProgress: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
  },

  milestoneRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  milestoneItem: { alignItems: "center" },
  milestoneDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneCheck: { color: "#0F1A12", fontSize: 9, fontWeight: "900" },
  milestoneLabel: { color: "rgba(255,255,255,0.2)", fontSize: 8, marginTop: 2 },

  verticalDivider: {
    width: 1,
    height: 160,
    backgroundColor: "rgba(232,197,71,0.08)",
  },

  rightSection: { flex: 1, gap: 10 },
  statsTitle: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 4,
  },

  bigStatRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  bigStat: { alignItems: "center" },
  bigStatValue: { color: "#E8C547", fontSize: 22, fontWeight: "900" },
  bigStatLabel: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  bigStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(232,197,71,0.08)",
  },

  statsList: {
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: { color: "#E8C547", fontSize: 16, fontWeight: "900" },
  statSep: { height: 1, backgroundColor: "rgba(232,197,71,0.04)" },

  backBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24 },
  backText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
})

export default Profile
