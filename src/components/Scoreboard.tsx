import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  DailyScore,
  getAllTimeLeaderboard,
  getDailyLeaderboard,
} from "../services/Dailychallenge"
import { SoundService } from "../services/SoundService"

interface ScoreboardProps {
  onBack: () => void
  uid?: string
}

const { width: SCREEN_W } = Dimensions.get("window")
const isWide = SCREEN_W > 600

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

const getRankTitle = (games: number): string => {
  if (games >= 1000) return "God of the Peaks"
  if (games >= 750) return "Eternal Overlord"
  if (games >= 500) return "Titan of War"
  if (games >= 300) return "Divine Ruler"
  if (games >= 200) return "Immortal King"
  if (games >= 150) return "Mythic Conqueror"
  if (games >= 100) return "Legendary Champion"
  if (games >= 75) return "Warlord"
  if (games >= 50) return "Battle Master"
  if (games >= 25) return "Veteran Warrior"
  if (games >= 10) return "Proven Fighter"
  if (games >= 5) return "Apprentice"
  if (games >= 3) return "Footman"
  return "Recruit"
}

const getRankIcon = (games: number): string => {
  if (games >= 100) return "👑"
  if (games >= 75) return "🔥"
  if (games >= 50) return "🐉"
  if (games >= 25) return "⚔"
  if (games >= 10) return "🛡"
  if (games >= 5) return "📜"
  return "🏹"
}

const MEDALS = ["🥇", "🥈", "🥉"]

const PODIUM_COLORS = [
  {
    accent: "#FFD700",
    bg: "rgba(255,215,0,0.05)",
    border: "rgba(255,215,0,0.2)",
    text: "#FFD700",
    pedBg: "rgba(255,215,0,0.08)",
    pedBorder: "rgba(255,215,0,0.25)",
  },
  {
    accent: "#C0C0C0",
    bg: "rgba(192,192,192,0.03)",
    border: "rgba(192,192,192,0.15)",
    text: "#D4D4D4",
    pedBg: "rgba(192,192,192,0.06)",
    pedBorder: "rgba(192,192,192,0.2)",
  },
  {
    accent: "#CD7F32",
    bg: "rgba(205,127,50,0.03)",
    border: "rgba(205,127,50,0.15)",
    text: "#E8A860",
    pedBg: "rgba(205,127,50,0.06)",
    pedBorder: "rgba(205,127,50,0.2)",
  },
]

const Scoreboard = ({ onBack, uid }: ScoreboardProps) => {
  const [tab, setTab] = useState<"daily" | "alltime">("daily")
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([])
  const [allTimeScores, setAllTimeScores] = useState<DailyScore[]>([])
  const [loadingDaily, setLoadingDaily] = useState(true)
  const [loadingAllTime, setLoadingAllTime] = useState(true)
  const [switching, setSwitching] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(15)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const crownPulse = useRef(new Animated.Value(0.7)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
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
        Animated.timing(crownPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(crownPulse, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

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

  const scores = tab === "daily" ? dailyScores : allTimeScores
  const isLoading = tab === "daily" ? loadingDaily : loadingAllTime

  // Find user's rank
  const myIndex = uid ? scores.findIndex((s) => s.uid === uid) : -1
  const myScore = myIndex >= 0 ? scores[myIndex] : null

  const renderYourRank = () => {
    if (!uid || !myScore) return null
    const rank = myIndex + 1
    return (
      <View style={z.yourRank}>
        <View style={z.yourRankLeft}>
          <Text style={z.yourRankPos}>#{rank}</Text>
          <View style={z.yourRankDivider} />
          <View>
            <Text style={z.yourRankName}>{myScore.heroName || "Unknown"}</Text>
            <Text style={z.yourRankTitle}>
              {getRankIcon(myScore.gamesPlayed || 0)}{" "}
              {getRankTitle(myScore.gamesPlayed || 0)}
            </Text>
          </View>
        </View>
        <View style={z.yourRankRight}>
          <Text style={z.yourRankScore}>{myScore.score.toLocaleString()}</Text>
          <Text style={z.yourRankCombo}>x{myScore.bestCombo || 0} combo</Text>
        </View>
      </View>
    )
  }

  const renderPodium = () => {
    if (scores.length === 0) return null
    const top = scores.slice(0, Math.min(3, scores.length))
    const order = top.length >= 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0]

    return (
      <View style={z.podiumSection}>
        <View style={z.podium}>
          {order.map((di) => {
            const item = top[di]
            if (!item) return <View key={`e${di}`} style={{ flex: 1 }} />
            const c = PODIUM_COLORS[di]
            const isYou = item.uid === uid
            const isFirst = di === 0

            return (
              <View
                key={`p${di}`}
                style={[z.podSlot, isFirst && z.podSlotFirst]}
              >
                {isFirst && (
                  <Animated.Text style={[z.podCrown, { opacity: crownPulse }]}>
                    👑
                  </Animated.Text>
                )}

                <Text style={{ fontSize: isFirst ? 24 : 18, marginBottom: 2 }}>
                  {MEDALS[di]}
                </Text>

                <Text
                  style={[
                    z.podScore,
                    {
                      color: c.text,
                      fontSize: isFirst ? 22 : 15,
                      textShadowColor: c.accent + "50",
                      textShadowRadius: isFirst ? 10 : 4,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item.score.toLocaleString()}
                </Text>

                <Text
                  style={[
                    z.podName,
                    {
                      color: isYou ? c.accent : "rgba(255,255,255,0.7)",
                      fontSize: isFirst ? 13 : 10,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.heroName || "Unknown"}
                </Text>

                <View
                  style={[z.podComboBadge, { borderColor: c.accent + "30" }]}
                >
                  <Text style={[z.podComboText, { color: c.accent + "60" }]}>
                    x{item.bestCombo || 0}
                  </Text>
                </View>

                <View
                  style={[
                    z.pedestal,
                    {
                      height: isFirst ? 32 : di === 1 ? 24 : 18,
                      backgroundColor: c.pedBg,
                      borderColor: c.pedBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      z.pedestalNum,
                      { color: c.accent, fontSize: isFirst ? 16 : 12 },
                    ]}
                  >
                    {di + 1}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    )
  }
  const renderRow = (item: DailyScore, index: number) => {
    if (index < 3) return null
    const isYou = item.uid === uid
    const pos = index + 1

    return (
      <View key={`r${index}`} style={[z.row, isYou && z.rowYou]}>
        <Text style={[z.rowPos, isYou && { color: "#FFD700" }]}>{pos}</Text>

        <View style={[z.rowIcon, isYou && z.rowIconYou]}>
          <Text style={{ fontSize: 14 }}>
            {getRankIcon(item.gamesPlayed || 0)}
          </Text>
        </View>

        <View style={z.rowInfo}>
          <Text style={[z.rowName, isYou && z.rowNameYou]} numberOfLines={1}>
            {item.heroName || "Unknown"}
          </Text>
          {/* <Text style={z.rowRank}>{getRankTitle(item.gamesPlayed || 0)}</Text> */}
        </View>

        <View style={z.rowComboBadge}>
          <Text style={z.rowCombo}>x{item.bestCombo || 0}</Text>
        </View>

        <Text
          style={[z.rowScore, isYou && z.rowScoreYou]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {item.score.toLocaleString()}
        </Text>
      </View>
    )
  }

  return (
    <View style={z.container}>
      {/* Background */}
      <View style={z.bg} pointerEvents="none">
        <Animated.View style={[z.bgGlow, { opacity: glowPulse }]} />
        <Text style={[z.bgRune, { top: "6%", left: "4%" }]}>ᚠ</Text>
        <Text style={[z.bgRune, { top: "10%", right: "5%" }]}>ᚦ</Text>
        <Text style={[z.bgRune, { bottom: "18%", left: "6%" }]}>ᚱ</Text>
        <Text style={[z.bgRune, { bottom: "22%", right: "4%" }]}>ᛟ</Text>
        <View style={z.bgLine} />
      </View>

      <Animated.View
        style={[
          z.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={z.header}>
          <View style={z.hOrn}>
            <View style={z.hLine} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLineS} />
          </View>
          <View style={z.hCenter}>
            <Text style={z.hIcon}>🏆</Text>
            <Text style={z.hTitle}>HALL OF GLORY</Text>
          </View>
          <View style={z.hOrn}>
            <View style={z.hLineS} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLine} />
          </View>
        </View>

        {/* Tabs */}
        <View style={z.tabs}>
          <TouchableOpacity
            style={[z.tab, tab === "daily" && z.tabOn]}
            onPress={() => {
              if (tab === "daily") return
              SoundService.playDeckDraw()
              setSwitching(true)
              setTimeout(() => {
                setTab("daily")
                setSwitching(false)
              }, 50)
            }}
            activeOpacity={0.85}
          >
            <Text style={[z.tabIco, tab !== "daily" && { opacity: 0.4 }]}>
              📜
            </Text>
            <Text style={[z.tabTxt, tab === "daily" && z.tabTxtOn]}>
              Daily Quest
            </Text>
          </TouchableOpacity>
          <View style={z.tabDiv} />
          <TouchableOpacity
            style={[z.tab, tab === "alltime" && z.tabOn]}
            onPress={() => {
              if (tab === "alltime") return
              SoundService.playDeckDraw()
              setSwitching(true)
              setTimeout(() => {
                setTab("alltime")
                setSwitching(false)
              }, 50)
            }}
            activeOpacity={0.85}
          >
            <Text style={[z.tabIco, tab !== "alltime" && { opacity: 0.4 }]}>
              ⚔
            </Text>
            <Text style={[z.tabTxt, tab === "alltime" && z.tabTxtOn]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading || switching ? (
          <View style={z.empty}>
            <ActivityIndicator size="large" color="#E8C547" />
            <Text style={z.loadText}>Summoning warriors...</Text>
          </View>
        ) : scores.length === 0 ? (
          <View style={z.empty}>
            <Text style={z.emptyIco}>{tab === "daily" ? "📜" : "⚔"}</Text>
            <Text style={z.emptyTxt}>
              {tab === "daily" ? "No warriors today" : "No battles recorded"}
            </Text>
            <Text style={z.emptyHint}>
              {tab === "daily"
                ? "Be the first to complete today's quest!"
                : "Complete battles to claim your glory"}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={z.scroll}
            contentContainerStyle={z.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {renderPodium()}

            {scores.length > 3 && (
              <View style={z.sep}>
                <View style={z.sepLine} />
                <Text style={z.sepDot}>◆</Text>
                <Text style={z.sepText}>OTHER WARRIORS</Text>
                <Text style={z.sepDot}>◆</Text>
                <View style={z.sepLine} />
              </View>
            )}

            {scores.length > 3 && (
              <View style={z.colHeaders}>
                <View style={{ width: 28 }} />
                <View style={{ width: 30 }} />
                <View style={{ flex: 1 }} />
                <Text style={[z.colLabel, { width: 40 }]}>COMBO</Text>
                <Text style={[z.colLabel, { width: 95, textAlign: "right" }]}>
                  SPOILS
                </Text>
              </View>
            )}

            {scores.map((item, i) => renderRow(item, i))}
          </ScrollView>
        )}

        {/* Back */}
        <TouchableOpacity style={z.backBtn} onPress={onBack}>
          <Text style={z.backText}>← Return to Castle</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const z = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1410",
    paddingTop: 6,
    paddingHorizontal: 12,
  },

  // Background
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "5%",
    left: "25%",
    width: "50%",
    height: "40%",
    borderRadius: 250,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.04)",
  },
  bgLine: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  inner: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    gap: 6,
  },
  hCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  hIcon: { fontSize: 16 },
  hTitle: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  hOrn: { flexDirection: "row", alignItems: "center", flex: 1, gap: 4 },
  hLine: { flex: 1, height: 1, backgroundColor: "rgba(232,197,71,0.12)" },
  hLineS: { width: 10, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  hDot: { color: "rgba(232,197,71,0.35)", fontSize: 6 },

  // Tabs
  tabs: {
    flexDirection: "row",
    marginBottom: 5,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
    padding: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  tabOn: { backgroundColor: "rgba(232,197,71,0.1)" },
  tabDiv: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(232,197,71,0.1)",
    alignSelf: "center",
  },
  tabIco: { fontSize: 11 },
  tabTxt: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tabTxtOn: { color: "#E8C547" },

  // Content — split layout
  contentRow: { flex: 1, flexDirection: "row", gap: 10 },
  leftCol: { flex: isWide ? 0.45 : 0.5, justifyContent: "flex-start", gap: 6 },
  rightCol: { flex: isWide ? 0.55 : 0.5 },

  // ── YOUR RANK CARD ──
  yourRank: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,215,0,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  yourRankLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  yourRankPos: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(255,215,0,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  yourRankDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,215,0,0.15)",
  },
  yourRankName: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  yourRankTitle: {
    color: "rgba(255,215,0,0.4)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 1,
  },
  yourRankRight: { alignItems: "flex-end" },
  yourRankScore: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "900",
    textShadowColor: "rgba(255,215,0,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  yourRankCombo: {
    color: "rgba(79,195,247,0.5)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },

  // ── PODIUM ──
  podiumSection: { alignItems: "center" },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: isWide ? 8 : 4,
    width: "100%",
  },
  podCrown: {
    fontSize: 16,
    marginBottom: -2,
    textShadowColor: "rgba(255,215,0,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  podCard: {
    width: "100%",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 1,
  },
  podCardFirst: {
    paddingVertical: 8,
  },

  podMeta: { alignItems: "center", marginTop: 1 },
  podRankText: { fontSize: 7, fontWeight: "700", letterSpacing: 1 },

  podComboBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  podComboText: { fontSize: 8, fontWeight: "900" },

  // Pedestal
  pedestal: {
    width: "90%",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 3,
  },
  pedestalNum: { fontWeight: "900", letterSpacing: 2 },

  // ── ROWS ──
  scroll: { flex: 1 },

  colHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 3,
    gap: 6,
  },
  colLabel: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 2,
    borderRadius: 8,
    backgroundColor: "rgba(232,197,71,0.02)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.04)",
    gap: 6,
  },
  rowYou: {
    backgroundColor: "rgba(255,215,0,0.05)",
    borderColor: "rgba(255,215,0,0.2)",
  },
  rowPos: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 13,
    fontWeight: "900",
    width: 28,
    textAlign: "center",
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  rowIconYou: {
    borderColor: "rgba(255,215,0,0.25)",
    backgroundColor: "rgba(255,215,0,0.06)",
  },
  rowInfo: { flex: 1 },
  rowName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  rowNameYou: { color: "#FFD700" },
  rowRank: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 1,
  },

  rowComboBadge: {
    width: 40,
    alignItems: "center",
    backgroundColor: "rgba(79,195,247,0.06)",
    borderRadius: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(79,195,247,0.12)",
  },
  rowCombo: { color: "rgba(79,195,247,0.6)", fontSize: 11, fontWeight: "900" },

  rowScore: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "900",
    width: 90,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  rowScoreYou: {
    color: "#FFD700",
    fontSize: 14,
    textShadowColor: "rgba(255,215,0,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  noMoreRows: { alignItems: "center", paddingVertical: 16 },
  noMoreText: {
    color: "rgba(255,255,255,0.12)",
    fontSize: 10,
    fontStyle: "italic",
    letterSpacing: 1,
  },

  // ── Empty / Loading ──
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  emptyIco: { fontSize: 32 },
  emptyTxt: { color: "#E8C547", fontSize: 15, fontWeight: "800" },
  emptyHint: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    textAlign: "center",
  },
  loadText: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 2,
  },

  // ── Back ──
  backBtn: {
    alignSelf: "center",
    paddingVertical: 5,
    paddingHorizontal: 20,
    marginBottom: 3,
  },
  backText: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // Remove these styles: contentRow, leftCol, rightCol, yourRank and all yourRank* styles

  // Add back scroll inner
  scrollInner: { paddingBottom: 8 },

  // Updated podium — no card boxes
  podSlot: { flex: 1, alignItems: "center", maxWidth: 140 },
  podSlotFirst: { marginTop: -4 },

  // Remove podCard and podCardFirst styles entirely

  podScore: {
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    marginBottom: 1,
  },
  podName: { fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },

  // Separator
  sep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  sepLine: { flex: 1, height: 1, backgroundColor: "rgba(232,197,71,0.08)" },
  sepDot: { color: "rgba(232,197,71,0.2)", fontSize: 5 },
  sepText: {
    color: "rgba(232,197,71,0.25)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
})

export default Scoreboard
