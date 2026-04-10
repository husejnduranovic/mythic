import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import {
  getSavedLoungeCode,
  getLoungeInfo,
  getLoungeLeaderboard,
  joinLounge,
  leaveLounge,
  getDaysLeftInWeek,
  Lounge,
  LoungeScore,
} from "../services/LoungeService"

interface LoungeScreenProps {
  onBack: () => void
  onPlay: () => void
  uid: string
  heroName: string
}

const LoungeScreen = ({ onBack, uid, heroName, onPlay }: LoungeScreenProps) => {
  const [loungeCode, setLoungeCode] = useState<string | null>(null)
  const [lounge, setLounge] = useState<Lounge | null>(null)
  const [scores, setScores] = useState<LoungeScore[]>([])
  const [joinInput, setJoinInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
    loadLounge()
  }, [])

  const loadLounge = async () => {
    setLoading(true)
    const code = await getSavedLoungeCode()
    if (code) {
      setLoungeCode(code)
      const info = await getLoungeInfo(code)
      setLounge(info)
      const lb = await getLoungeLeaderboard(code)
      setScores(lb)
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (joinInput.length < 3) {
      setError("Enter a valid lounge code")
      return
    }
    setLoading(true)
    setError("")
    const result = await joinLounge(joinInput)
    if (result.success) {
      setLoungeCode(joinInput.toUpperCase())
      setLounge(result.lounge || null)
      const lb = await getLoungeLeaderboard(joinInput.toUpperCase())
      setScores(lb)
    } else {
      setError(result.error || "Failed to join")
    }
    setLoading(false)
  }

  const handleLeave = async () => {
    await leaveLounge()
    setLoungeCode(null)
    setLounge(null)
    setScores([])
  }

  const daysLeft = getDaysLeftInWeek()
  const myScore = scores.find((s) => s.uid === uid)
  const myRank = scores.findIndex((s) => s.uid === uid) + 1

  if (loading)
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#E8C547" />
      </View>
    )

  // Joined a lounge — show tournament
  if (loungeCode && lounge) {
    return (
      <Animated.View style={[styles.containerRow, { opacity: fadeAnim }]}>
        {/* Left — Info + Play */}
        <View style={styles.leftSection}>
          <Text style={styles.loungeIcon}>🏛</Text>
          <Text style={styles.loungeName}>{lounge.name}</Text>
          <Text style={styles.tournamentLabel}>WEEKLY TOURNAMENT</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerText}>
              {daysLeft === 0 ? "Last day!" : `${daysLeft} days left`}
            </Text>
          </View>
          {myScore && (
            <View style={styles.myScoreRow}>
              <Text style={styles.myRank}>#{myRank}</Text>
              <Text style={styles.myScoreValue}>
                {myScore.score.toLocaleString()}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.goldBtn} onPress={onPlay}>
            <Text style={styles.goldBtnText}>⚔ Enter Battle</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>Scores count for this tournament</Text>
        </View>

        {/* Right — Leaderboard */}
        <View style={styles.rightSection}>
          <Text style={styles.lbTitle}>⚔ WARRIORS THIS WEEK</Text>
          {scores.length === 0 ? (
            <Text style={styles.emptyText}>No scores yet — be the first!</Text>
          ) : (
            <FlatList
              data={scores}
              keyExtractor={(_, i) => `ls-${i}`}
              style={styles.list}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.scoreRow,
                    item.uid === uid && styles.scoreRowYou,
                  ]}
                >
                  <Text style={styles.rank}>
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `${index + 1}.`}
                  </Text>
                  <Text
                    style={[
                      styles.playerName,
                      item.uid === uid && styles.playerNameYou,
                    ]}
                  >
                    {item.heroName}
                  </Text>
                  <Text style={styles.playerCombo}>x{item.bestCombo}</Text>
                  <Text style={styles.playerScore}>
                    {item.score.toLocaleString()}
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Bottom buttons */}
        <TouchableOpacity style={styles.backBtnAbs} onPress={onBack}>
          <Text style={styles.backText}>← Return to Castle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.leaveBtnAbs} onPress={handleLeave}>
          <Text style={styles.leaveBtnText}>Leave Tournament</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Not joined — show join screen
  return (
    <View style={styles.containerCenter}>
      <Animated.View style={[styles.joinContent, { opacity: fadeAnim }]}>
        <Text style={styles.joinIcon}>🏛</Text>
        <Text style={styles.joinTitle}>LOUNGE TOURNAMENT</Text>
        <Text style={styles.joinSub}>
          Enter a lounge code to join their weekly tournament
        </Text>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.joinCard}>
          <TextInput
            style={styles.codeInput}
            value={joinInput}
            onChangeText={(t) => setJoinInput(t.toUpperCase())}
            placeholder="LOUNGE CODE"
            placeholderTextColor="rgba(232,197,71,0.25)"
            autoCapitalize="characters"
            maxLength={20}
          />
          <TouchableOpacity
            style={[
              styles.joinBtn,
              joinInput.length < 3 && styles.joinBtnDisabled,
            ]}
            onPress={handleJoin}
            disabled={joinInput.length < 3}
          >
            <Text style={styles.joinBtnText}>Join Tournament</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Return to Castle</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Joined — horizontal layout
  containerRow: {
    flex: 1,
    backgroundColor: "#0F1A12",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 30,
  },
  leftSection: { alignItems: "center", gap: 14, flex: 1 },
  rightSection: { flex: 1, maxHeight: 180, paddingTop: 8 },

  // Not joined — centered
  containerCenter: {
    flex: 1,
    backgroundColor: "#0F1A12",
    justifyContent: "center",
    alignItems: "center",
  },
  joinContent: { alignItems: "center" },

  // Lounge info
  loungeIcon: { fontSize: 28 },
  loungeName: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
  },
  tournamentLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
  },
  timerBox: {
    backgroundColor: "rgba(79,195,247,0.1)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(79,195,247,0.2)",
  },
  timerText: { color: "#4FC3F7", fontSize: 11, fontWeight: "800" },

  myScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  myRank: { color: "#E8C547", fontSize: 22, fontWeight: "900" },
  myScoreValue: { color: "#E8C547", fontSize: 18, fontWeight: "900" },

  // Leaderboard
  lbTitle: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 6,
    textAlign: "center",
  },
  list: { flex: 1 },
  emptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232,197,71,0.04)",
    gap: 8,
  },
  scoreRowYou: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 6,
    borderBottomWidth: 0,
  },
  rank: {
    fontSize: 14,
    fontWeight: "800",
    width: 30,
    color: "rgba(232,197,71,0.5)",
  },
  playerName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  playerNameYou: { color: "#E8C547" },
  playerCombo: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 11,
    fontWeight: "700",
  },
  playerScore: { color: "#E8C547", fontSize: 15, fontWeight: "900" },

  // Buttons
  goldBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 170,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  hintText: { color: "rgba(255,255,255,0.2)", fontSize: 9 },

  backBtnAbs: {
    position: "absolute",
    bottom: 10,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  leaveBtnAbs: {
    position: "absolute",
    bottom: 10,
    left: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
  },
  leaveBtnText: {
    color: "rgba(255,100,100,0.4)",
    fontSize: 10,
    fontWeight: "700",
  },
  backBtn: { paddingVertical: 10, paddingHorizontal: 24, marginTop: 10 },
  backText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Join screen
  joinIcon: { fontSize: 40, marginBottom: 8 },
  joinTitle: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3,
  },
  joinSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "rgba(255,75,75,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.2)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
  },
  errorText: { color: "#FF4B4B", fontSize: 12, fontWeight: "700" },
  joinCard: { alignItems: "center", gap: 10 },
  codeInput: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
    width: 220,
  },
  joinBtn: {
    backgroundColor: "#E8C547",
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 10,
    minWidth: 180,
    alignItems: "center",
  },
  joinBtnDisabled: { opacity: 0.3 },
  joinBtnText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
})

export default LoungeScreen
