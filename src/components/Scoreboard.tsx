import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  DailyScore,
  getAllTimeLeaderboard,
  getDailyLeaderboard,
} from "../services/Dailychallenge"

interface ScoreboardProps {
  onBack: () => void
}

const LOCAL_STORAGE_KEY = "@mythic_peaks_scores"

export const saveScore = async (score: number, bestCombo: number = 0) => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY)
    const scores = raw ? JSON.parse(raw) : []
    scores.push({ score, bestCombo, date: new Date().toLocaleDateString() })
    scores.sort((a: any, b: any) => b.score - a.score)
    await AsyncStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(scores.slice(0, 30)),
    )
  } catch {}
}

const Scoreboard = ({ onBack }: ScoreboardProps) => {
  const [tab, setTab] = useState<"daily" | "alltime">("daily")
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([])
  const [allTimeScores, setAllTimeScores] = useState<DailyScore[]>([])
  const [loadingDaily, setLoadingDaily] = useState(true)
  const [loadingAllTime, setLoadingAllTime] = useState(true)

  useEffect(() => {
    getDailyLeaderboard()
      .then((s) => {
        setDailyScores(s)
        setLoadingDaily(false)
      })
      .catch(() => setLoadingDaily(false))
    getAllTimeLeaderboard()
      .then((s) => {
        setAllTimeScores(s)
        setLoadingAllTime(false)
      })
      .catch(() => setLoadingAllTime(false))
  }, [])

  const getMedal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`
  const getRankColor = (i: number) =>
    i === 0
      ? "#FFD700"
      : i === 1
        ? "#C0C0C0"
        : i === 2
          ? "#CD7F32"
          : "rgba(232,197,71,0.4)"

  const scores = tab === "daily" ? dailyScores : allTimeScores
  const isLoading = tab === "daily" ? loadingDaily : loadingAllTime

  const renderRow = ({ item, index }: { item: DailyScore; index: number }) => (
    <View style={[styles.row, index === 0 && styles.topRow]}>
      <Text style={[styles.rank, { color: getRankColor(index) }]}>
        {getMedal(index)}
      </Text>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowHero, index === 0 && styles.topHero]}>
          {item.heroName || "Unknown"}
        </Text>
      </View>
      <Text style={[styles.rowComboCenter, index === 0 && styles.topCombo]}>
        Best combo — {item.bestCombo || 0}x
      </Text>
      <Text style={[styles.rowScore, index === 0 && styles.topScore]}>
        {item.score.toLocaleString()}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLine} />
        <Text style={styles.title}>🏆 HALL OF GLORY</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "daily" && styles.tabActive]}
          onPress={() => setTab("daily")}
        >
          <Text
            style={[styles.tabText, tab === "daily" && styles.tabTextActive]}
          >
            📜 Daily Arena
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "alltime" && styles.tabActive]}
          onPress={() => setTab("alltime")}
        >
          <Text
            style={[styles.tabText, tab === "alltime" && styles.tabTextActive]}
          >
            ⚔ All Time
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#E8C547" />
        </View>
      ) : scores.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{tab === "daily" ? "📜" : "⚔"}</Text>
          <Text style={styles.emptyText}>
            {tab === "daily" ? "No warriors today" : "No battles recorded"}
          </Text>
          <Text style={styles.emptyHint}>
            {tab === "daily"
              ? "Be the first to complete today's quest!"
              : "Complete battles to appear here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={scores}
          keyExtractor={(_, i) => `s-${i}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={renderRow}
        />
      )}

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
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    gap: 10,
  },
  headerLine: { flex: 1, height: 1, backgroundColor: "rgba(232,197,71,0.12)" },
  title: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
  },

  tabRow: { flexDirection: "row", marginBottom: 10, gap: 6 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
  },
  tabActive: {
    backgroundColor: "rgba(232,197,71,0.12)",
    borderColor: "#E8C547",
  },
  tabText: { color: "rgba(232,197,71,0.4)", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#E8C547" },

  list: { flex: 1 },
  listContent: { paddingBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,197,71,0.05)",
  },
  topRow: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  rank: { fontSize: 16, fontWeight: "800", width: 36 },
  rowInfo: { minWidth: 80 },
  rowHero: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "700" },
  topHero: { color: "#E8C547", fontSize: 14 },
  rowCombo: { color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 1 },
  rowScore: { color: "#E8C547", fontSize: 18, fontWeight: "900" },
  topScore: { fontSize: 22 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: "#E8C547", fontSize: 16, fontWeight: "800" },
  emptyHint: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    textAlign: "center",
  },

  backBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  backText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  rowComboCenter: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    flex: 1,
    textAlign: "center",
  },
  topCombo: { color: "#E8C547", fontSize: 13 },
})

export default Scoreboard
