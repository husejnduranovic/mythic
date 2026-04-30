import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import {
  Room,
  RoomPlayer,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  onRoomUpdate,
  getRoomOnce,
} from "../services/ArenaService"
import database from "@react-native-firebase/database"

interface ArenaScreenProps {
  onBack: () => void
  onGameStart: (roomCode: string, isHost: boolean) => void
  uid: string
  heroName: string
}

const ArenaScreen = ({
  onBack,
  onGameStart,
  uid,
  heroName,
}: ArenaScreenProps) => {
  const [mode, setMode] = useState<"menu" | "lobby">("menu")
  const [roomCode, setRoomCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const unsubRef = useRef<(() => void) | null>(null)

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

    // Subtle pulsing glow
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

  const gameStartedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current()
      if (roomCode && !gameStartedRef.current) leaveRoom(roomCode, uid)
    }
  }, [roomCode])

  useEffect(() => {
    if (room?.state === "playing") {
      gameStartedRef.current = true
      onGameStart(roomCode, room.hostUid === uid)
    }
  }, [room?.state])

  const subscribeToRoom = (code: string) => {
    if (unsubRef.current) unsubRef.current()
    unsubRef.current = onRoomUpdate(code, (r) => {
      if (!r) {
        setMode("menu")
        setRoomCode("")
        setRoom(null)
        setError("Host left the room")
      } else {
        setRoom(r)
      }
    })
  }

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    try {
      const code = await createRoom(uid, heroName)
      setRoomCode(code)
      // @ts-ignore
      const snapshot = await database().ref(`rooms/${code}`).once("value")
      if (snapshot.exists()) {
        setRoom(snapshot.val() as Room)
      }
      setMode("lobby")
      subscribeToRoom(code)
    } catch (err) {
      setError("Failed to create room")
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (joinCode.length !== 4) {
      setError("Enter a 4-digit code")
      return
    }
    setLoading(true)
    setError("")
    const result = await joinRoom(joinCode, uid, heroName)
    if (result.success) {
      setRoomCode(joinCode)
      const roomData = await getRoomOnce(joinCode)
      if (roomData) setRoom(roomData)
      setMode("lobby")
      subscribeToRoom(joinCode)
    } else {
      setError(result.error || "Failed to join")
    }
    setLoading(false)
  }

  const handleStart = async () => {
    if (!roomCode) return
    await startGame(roomCode)
  }

  const handleLeave = async () => {
    if (unsubRef.current) unsubRef.current()
    await leaveRoom(roomCode, uid)
    setRoomCode("")
    setRoom(null)
    setMode("menu")
  }

  const isHost = room?.hostUid === uid
  const players = room?.players ? Object.values(room.players) : []

  // Background decoration component
  const BackgroundDecor = () => (
    <View style={styles.bgLayer} pointerEvents="none">
      <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />
      <Text style={[styles.bgRune, { top: "10%", left: "5%" }]}>ᚠ</Text>
      <Text style={[styles.bgRune, { top: "15%", right: "8%" }]}>ᚦ</Text>
      <Text style={[styles.bgRune, { bottom: "18%", left: "10%" }]}>ᚱ</Text>
      <Text style={[styles.bgRune, { bottom: "22%", right: "5%" }]}>ᛟ</Text>
      <Text style={[styles.bgRune, { top: "50%", left: "3%" }]}>ᚲ</Text>
      <Text style={[styles.bgBeast, { top: "20%", left: "15%" }]}>⚔</Text>
      <Text style={[styles.bgBeast, { bottom: "25%", right: "12%" }]}>🛡</Text>
      <View style={styles.bgHLine} />
    </View>
  )

  if (mode === "lobby" && room) {
    return (
      <View style={styles.container}>
        <BackgroundDecor />
        <Animated.View
          style={[
            styles.lobbyContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.lobbyHeaderWrap}>
            <View style={styles.headerOrnRow}>
              <View style={styles.headerLine} />
              <Text style={styles.headerDiamond}>◆</Text>
              <View style={styles.headerLine} />
            </View>
            <Text style={styles.lobbyTitle}>ARENA LOBBY</Text>
          </View>

          {/* Split layout */}
          <View style={styles.lobbyBody}>
            {/* Left — Code + Actions */}
            <View style={styles.lobbyLeft}>
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>ROOM CODE</Text>
                <View style={styles.codeDisplay}>
                  {roomCode.split("").map((digit, i) => (
                    <View key={i} style={styles.codeDigitBox}>
                      <Text style={styles.codeDigit}>{digit}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.codeHint}>Share this code with allies</Text>
              </View>

              <View style={styles.lobbyActions}>
                {isHost ? (
                  <TouchableOpacity
                    style={[
                      styles.goldBtn,
                      players.length < 2 && styles.goldBtnDisabled,
                    ]}
                    onPress={handleStart}
                    disabled={players.length < 2}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.goldBtnIcon}>⚔</Text>
                    <Text style={styles.goldBtnText}>
                      {players.length < 2 ? "Need 2+ warriors" : "Start Battle"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.waitingBox}>
                    <View style={styles.waitingDot} />
                    <Text style={styles.waitingText}>Waiting for host...</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
                  <Text style={styles.leaveBtnText}>🚪 Leave Room</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right — Players */}
            <View style={styles.lobbyRight}>
              <View style={styles.playersSectionHeader}>
                <View style={styles.sectionLine} />
                <Text style={styles.playersTitle}>
                  WARRIORS · {players.length}/6
                </Text>
                <View style={styles.sectionLine} />
              </View>
              <ScrollView
                style={styles.playersScroll}
                showsVerticalScrollIndicator={false}
              >
                {players.map((p: RoomPlayer) => {
                  const isPlayerHost = p.uid === room.hostUid
                  const isYou = p.uid === uid
                  return (
                    <View
                      key={p.uid}
                      style={[
                        styles.playerRow,
                        isPlayerHost && styles.playerRowHost,
                        isYou && styles.playerRowYou,
                      ]}
                    >
                      <View
                        style={[
                          styles.playerAvatar,
                          isPlayerHost && styles.playerAvatarHost,
                        ]}
                      >
                        <Text style={styles.playerIcon}>
                          {isPlayerHost ? "👑" : "⚔"}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.playerName,
                          isYou && styles.playerNameYou,
                        ]}
                      >
                        {p.heroName}
                      </Text>
                      {isPlayerHost && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>HOST</Text>
                        </View>
                      )}
                      {isYou && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                  )
                })}
                {Array.from({ length: Math.max(0, 2 - players.length) }).map(
                  (_, i) => (
                    <View key={`empty-${i}`} style={styles.playerRowEmpty}>
                      <View style={styles.playerAvatarEmpty}>
                        <Text style={styles.emptySlotIcon}>?</Text>
                      </View>
                      <Text style={styles.emptySlotText}>
                        Waiting for warrior...
                      </Text>
                    </View>
                  ),
                )}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backText}>← Return to Castle</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    )
  }

  // Menu — Create or Join
  return (
    <View style={styles.container}>
      <BackgroundDecor />

      <Animated.View
        style={[
          styles.innerContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.headerOrnRow}>
            <View style={styles.headerLine} />
            <Text style={styles.headerDiamond}>◆</Text>
            <View style={styles.headerLine} />
          </View>
          <Text style={styles.title}>🏟 ARENA</Text>
          <Text style={styles.subtitle}>
            Same deck · Same battle · One champion
          </Text>
        </View>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Two cards side by side */}
        <View style={styles.menuRow}>
          {/* Create Room */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.menuCardGlow} />
            <View style={styles.menuCardIconWrap}>
              <Text style={styles.menuCardIcon}>⚔</Text>
            </View>
            <Text style={styles.menuCardTitle}>Host Battle</Text>
            <Text style={styles.menuCardDesc}>
              Create a room and invite warriors
            </Text>
            <View style={styles.menuCardFooter}>
              <Text style={styles.menuCardAction}>CREATE →</Text>
            </View>
          </TouchableOpacity>

          {/* Join Room */}
          <View style={styles.menuCard}>
            <View style={styles.menuCardGlow} />
            <View style={styles.menuCardIconWrap}>
              <Text style={styles.menuCardIcon}>🛡</Text>
            </View>
            <Text style={styles.menuCardTitle}>Join Battle</Text>
            <Text style={styles.menuCardDesc}>Enter room code to join</Text>

            <View style={styles.codeInputWrap}>
              <TextInput
                style={styles.codeInput}
                value={joinCode}
                onChangeText={(t) =>
                  setJoinCode(t.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="----"
                placeholderTextColor="rgba(232,197,71,0.2)"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.joinBtn,
                joinCode.length !== 4 && styles.joinBtnDisabled,
              ]}
              onPress={handleJoin}
              disabled={loading || joinCode.length !== 4}
              activeOpacity={0.85}
            >
              <Text style={styles.joinBtnText}>JOIN →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Return to Castle</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1410",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
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
    top: "15%",
    left: "30%",
    width: "40%",
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

  innerContent: { alignItems: "center", width: "100%" },

  // Header
  headerWrap: { alignItems: "center", marginBottom: 16 },
  headerOrnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerLine: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
  },
  headerDiamond: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
  },
  title: {
    color: "#E8C547",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    marginTop: 4,
  },

  // Error
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

  // Menu cards
  menuRow: { flexDirection: "row", gap: 18 },
  menuCard: {
    backgroundColor: "rgba(232,197,71,0.04)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    width: 200,
    gap: 6,
    overflow: "hidden",
  },
  menuCardGlow: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(232,197,71,0.05)",
  },
  menuCardIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.3)",
    backgroundColor: "rgba(232,197,71,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  menuCardIcon: { fontSize: 26 },
  menuCardTitle: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  menuCardDesc: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    textAlign: "center",
    letterSpacing: 0.5,
    minHeight: 22,
  },
  menuCardFooter: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(232,197,71,0.08)",
    width: "100%",
    alignItems: "center",
  },
  menuCardAction: {
    color: "#E8C547",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Join code input
  codeInputWrap: {
    marginTop: 4,
    width: 140,
  },
  codeInput: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "#E8C547",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 10,
    textAlign: "center",
  },
  joinBtn: {
    backgroundColor: "#E8C547",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 6,
    marginTop: 4,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  joinBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
  joinBtnText: {
    color: "#1a1a1a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // LOBBY
  lobbyHeaderWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  lobbyTitle: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 5,
    marginTop: 2,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Code box
  codeBox: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    width: "100%",
  },
  codeLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
  },
  codeDisplay: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  codeDigitBox: {
    width: 36,
    height: 46,
    borderRadius: 6,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  codeDigit: {
    color: "#E8C547",
    fontSize: 28,
    fontWeight: "900",
  },
  codeHint: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Players section
  playersSection: { width: "100%", maxWidth: 450 },
  playersSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  playersTitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3,
  },
  playersList: { gap: 4 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },
  playerRowHost: {
    backgroundColor: "rgba(232,197,71,0.05)",
    borderColor: "rgba(232,197,71,0.2)",
  },
  playerRowYou: {
    borderColor: "rgba(79,195,247,0.3)",
  },
  playerRowEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.04)",
    borderStyle: "dashed",
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  playerAvatarHost: {
    borderColor: "#E8C547",
    backgroundColor: "rgba(232,197,71,0.15)",
  },
  playerAvatarEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  playerIcon: { fontSize: 13 },
  emptySlotIcon: {
    color: "rgba(232,197,71,0.2)",
    fontSize: 14,
    fontWeight: "900",
  },
  playerName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 1,
  },
  playerNameYou: { color: "#E8C547" },
  emptySlotText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
    fontStyle: "italic",
    flex: 1,
  },
  hostBadge: {
    backgroundColor: "rgba(232,197,71,0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostBadgeText: {
    color: "#E8C547",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  youBadge: {
    backgroundColor: "rgba(79,195,247,0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  youBadgeText: {
    color: "#4FC3F7",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Actions
  goldBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 220,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  goldBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  goldBtnIcon: { fontSize: 16 },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },

  waitingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7BED9F",
  },
  waitingText: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  leaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.2)",
    backgroundColor: "rgba(255,100,100,0.04)",
  },
  leaveBtnText: {
    color: "rgba(255,100,100,0.6)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  backBtn: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  backText: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  lobbyContent: {
    alignItems: "center",
    width: "100%",
    maxWidth: 600,
  },
  lobbyBody: {
    flexDirection: "row",
    width: "100%",
    gap: 16,
    marginTop: 8,
  },
  lobbyLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  lobbyRight: {
    flex: 1,
  },
  playersScroll: {
    maxHeight: 200,
  },
  lobbyActions: {
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
})

export default ArenaScreen
