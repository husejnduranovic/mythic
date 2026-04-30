import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
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
  const slideAnim = useRef(new Animated.Value(20)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current

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

  const Background = () => (
    <View style={s.bgLayer} pointerEvents="none">
      <Animated.View style={[s.bgGlow, { opacity: glowPulse }]} />
      <Text style={[s.bgRune, { top: "8%", left: "4%" }]}>ᚠ</Text>
      <Text style={[s.bgRune, { top: "12%", right: "6%" }]}>ᚦ</Text>
      <Text style={[s.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
      <Text style={[s.bgRune, { bottom: "20%", right: "5%" }]}>ᛟ</Text>
      <Text style={[s.bgBeast, { top: "22%", left: "12%" }]}>🏛</Text>
      <Text style={[s.bgBeast, { bottom: "25%", right: "10%" }]}>🏆</Text>
      <View style={s.bgHLine} />
    </View>
  )

  if (loading)
    return (
      <View style={s.containerCenter}>
        <Background />
        <ActivityIndicator size="large" color="#E8C547" />
        <Text style={s.loadText}>Loading tournament...</Text>
      </View>
    )

  // Joined — tournament view
  if (loungeCode && lounge) {
    return (
      <View style={s.containerRow}>
        <Background />

        <Animated.View
          style={[
            s.contentRow,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Left — Info + Play */}
          <View style={s.leftSection}>
            {/* Header ornament */}
            <View style={s.headerOrn}>
              <View style={s.ornLine} />
              <Text style={s.ornDot}>◆</Text>
              <View style={s.ornLine} />
            </View>

            {/* Lounge icon + name */}
            <View style={s.loungeIconWrap}>
              <Text style={s.loungeIcon}>🏛</Text>
            </View>
            <Text style={s.loungeName}>{lounge.name}</Text>

            {/* Tournament label */}
            <View style={s.tournamentBadge}>
              <Text style={s.tournamentLabel}>WEEKLY TOURNAMENT</Text>
            </View>

            {/* Timer */}
            <View style={s.timerBox}>
              <View style={s.timerDot} />
              <Text style={s.timerText}>
                {daysLeft === 0 ? "Final day!" : `${daysLeft} days remaining`}
              </Text>
            </View>

            {/* My position */}
            {myScore && (
              <View style={s.myScoreCard}>
                <Text style={s.myScoreLabel}>YOUR POSITION</Text>
                <View style={s.myScoreRow}>
                  <Text style={s.myRank}>#{myRank}</Text>
                  <View style={s.myScoreDivider} />
                  <Text style={s.myScoreValue}>
                    {myScore.score.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Play button */}
            <TouchableOpacity
              style={s.goldBtn}
              onPress={onPlay}
              activeOpacity={0.85}
            >
              <Text style={s.goldBtnIcon}>⚔</Text>
              <Text style={s.goldBtnText}>Enter Battle</Text>
            </TouchableOpacity>
            <Text style={s.hintText}>
              Every battle counts for this tournament
            </Text>
          </View>

          {/* Right — Leaderboard */}
          <View style={s.rightSection}>
            <View style={s.lbHeader}>
              <View style={s.ornLine} />
              <Text style={s.ornDot}>◆</Text>
              <View style={s.ornLineShort} />
            </View>
            <Text style={s.lbTitle}>WARRIORS THIS WEEK</Text>

            {scores.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={s.emptyIcon}>⚔</Text>
                <Text style={s.emptyText}>No warriors yet</Text>
                <Text style={s.emptyHint}>Be the first to battle!</Text>
              </View>
            ) : (
              <FlatList
                data={scores}
                keyExtractor={(_, i) => `ls-${i}`}
                style={s.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={[s.scoreRow, item.uid === uid && s.scoreRowYou]}>
                    <Text style={s.rank}>
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : `${index + 1}.`}
                    </Text>
                    <View style={s.playerNameCol}>
                      <Text
                        style={[
                          s.playerName,
                          item.uid === uid && s.playerNameYou,
                        ]}
                        numberOfLines={1}
                      >
                        {item.heroName}
                      </Text>
                    </View>
                    <Text style={s.playerCombo}>x{item.bestCombo}</Text>
                    <Text style={s.playerScore}>
                      {item.score.toLocaleString()}
                    </Text>
                  </View>
                )}
              />
            )}

            {/* Prize info */}
            <View style={s.prizeBox}>
              <Text style={s.prizeIcon}>🏆</Text>
              <Text style={s.prizeText}>#1 wins the weekly prize</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom buttons */}
        <TouchableOpacity style={s.backBtnAbs} onPress={onBack}>
          <Text style={s.backText}>← Return to Castle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.leaveBtnAbs} onPress={handleLeave}>
          <Text style={s.leaveBtnText}>🚪 Leave</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Not joined — join screen
  return (
    <View style={s.containerCenter}>
      <Background />

      <Animated.View
        style={[
          s.joinContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={s.headerOrn}>
          <View style={s.ornLine} />
          <Text style={s.ornDot}>◆</Text>
          <View style={s.ornLine} />
        </View>

        <View style={s.joinIconWrap}>
          <Text style={s.joinIconEmoji}>🏛</Text>
        </View>
        <Text style={s.joinTitle}>TOURNAMENT</Text>
        <Text style={s.joinSub}>
          Enter a lounge code to join their weekly battle
        </Text>

        {error !== "" && (
          <View style={s.errorBox}>
            <Text style={s.errorIcon}>⚠</Text>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Join card */}
        <View style={s.joinCard}>
          <Text style={s.joinCardLabel}>LOUNGE CODE</Text>
          <TextInput
            style={s.codeInput}
            value={joinInput}
            onChangeText={(t) => setJoinInput(t.toUpperCase())}
            placeholder="ENTER CODE"
            placeholderTextColor="rgba(232,197,71,0.2)"
            autoCapitalize="characters"
            maxLength={20}
          />
          <TouchableOpacity
            style={[s.joinBtn, joinInput.length < 3 && s.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={joinInput.length < 3}
            activeOpacity={0.85}
          >
            <Text style={s.joinBtnText}>JOIN TOURNAMENT →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <Text style={s.backText}>← Return to Castle</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  // Background
  bgLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "15%",
    left: "25%",
    width: "50%",
    height: "55%",
    borderRadius: 250,
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
    top: "52%",
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },

  // Containers
  containerRow: {
    flex: 1,
    backgroundColor: "#0B1410",
    paddingHorizontal: 20,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
  },
  containerCenter: {
    flex: 1,
    backgroundColor: "#0B1410",
    justifyContent: "center",
    alignItems: "center",
  },
  loadText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 2,
  },

  // Ornaments
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  ornLine: { width: 28, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  ornLineShort: {
    width: 14,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
  },
  ornDot: { color: "rgba(232,197,71,0.4)", fontSize: 7 },

  // Left section — tournament info
  leftSection: { alignItems: "center", gap: 6, flex: 1 },

  loungeIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "rgba(79,195,247,0.3)",
    backgroundColor: "rgba(79,195,247,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  loungeIcon: { fontSize: 26 },
  loungeName: {
    color: "#4FC3F7",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(79,195,247,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tournamentBadge: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
  },
  tournamentLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(79,195,247,0.06)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(79,195,247,0.15)",
  },
  timerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7BED9F",
  },
  timerText: {
    color: "#4FC3F7",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  myScoreCard: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  myScoreLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 3,
  },
  myScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  myRank: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  myScoreDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(232,197,71,0.15)",
  },
  myScoreValue: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
  },

  goldBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 180,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  goldBtnIcon: { fontSize: 16 },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  hintText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Right section — leaderboard
  rightSection: { flex: 1, maxHeight: 220 },
  lbHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  lbTitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 6,
    textAlign: "center",
  },
  list: { flex: 1 },
  emptyWrap: { alignItems: "center", gap: 4, marginTop: 20 },
  emptyIcon: { fontSize: 28 },
  emptyText: { color: "rgba(232,197,71,0.5)", fontSize: 13, fontWeight: "700" },
  emptyHint: { color: "rgba(255,255,255,0.2)", fontSize: 10 },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 2,
    borderRadius: 6,
    backgroundColor: "rgba(232,197,71,0.02)",
    gap: 8,
  },
  scoreRowYou: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
  },
  rank: {
    fontSize: 14,
    fontWeight: "800",
    width: 28,
    color: "rgba(232,197,71,0.45)",
    textAlign: "center",
  },
  playerNameCol: { flex: 1 },
  playerName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  playerNameYou: { color: "#E8C547" },
  playerCombo: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 11,
    fontWeight: "700",
    width: 35,
    textAlign: "center",
  },
  playerScore: {
    color: "#E8C547",
    fontSize: 15,
    fontWeight: "900",
    width: 75,
    textAlign: "right",
  },

  prizeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },
  prizeIcon: { fontSize: 12 },
  prizeText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Bottom buttons
  backBtnAbs: {
    position: "absolute",
    bottom: 8,
    right: 18,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  leaveBtnAbs: {
    position: "absolute",
    bottom: 8,
    left: 18,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.2)",
    backgroundColor: "rgba(255,100,100,0.04)",
  },
  leaveBtnText: {
    color: "rgba(255,100,100,0.6)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Join screen
  joinContent: { alignItems: "center" },
  joinIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(79,195,247,0.3)",
    backgroundColor: "rgba(79,195,247,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  joinIconEmoji: { fontSize: 30 },
  joinTitle: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  joinSub: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,75,75,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.25)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  errorIcon: { fontSize: 12 },
  errorText: { color: "#FF6B6B", fontSize: 11, fontWeight: "700" },

  joinCard: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  joinCardLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 4,
  },
  codeInput: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 6,
    textAlign: "center",
    width: 230,
  },
  joinBtn: {
    backgroundColor: "#E8C547",
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 10,
    minWidth: 200,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
  joinBtnText: {
    color: "#1a1a1a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },

  backBtn: { paddingVertical: 10, paddingHorizontal: 24, marginTop: 14 },
  backText: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
})

export default LoungeScreen
