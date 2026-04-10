import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Cleanup on unmount — only leave if going back, not starting game
  const gameStartedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current()
      if (roomCode && !gameStartedRef.current) leaveRoom(roomCode, uid)
    }
  }, [roomCode])

  // Watch for game start
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
        // Room was deleted (host left)
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

      // Get room data directly
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

  if (mode === "lobby" && room) {
    return (
      <View style={styles.container}>
        <View style={styles.lobbyHeader}>
          <Text style={styles.lobbyTitle}>⚔ ARENA LOBBY</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>ROOM CODE</Text>
            <Text style={styles.codeText}>{roomCode}</Text>
            <Text style={styles.codeHint}>Share this code with friends</Text>
          </View>
        </View>

        <View style={styles.playersSection}>
          <Text style={styles.playersTitle}>WARRIORS ({players.length}/6)</Text>
          <View style={styles.playersList}>
            {players.map((p: RoomPlayer, i: number) => (
              <View
                key={p.uid}
                style={[styles.playerRow, i === 0 && styles.playerRowFirst]}
              >
                <Text style={styles.playerIcon}>
                  {p.uid === room.hostUid ? "👑" : "⚔"}
                </Text>
                <Text style={styles.playerName}>{p.heroName}</Text>
                {p.uid === room.hostUid && (
                  <Text style={styles.hostBadge}>HOST</Text>
                )}
                {p.uid === uid && <Text style={styles.youBadge}>YOU</Text>}
              </View>
            ))}
          </View>
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
              activeOpacity={0.8}
            >
              <Text style={styles.goldBtnText}>
                {players.length < 2
                  ? "Waiting for players..."
                  : "⚔ Start Battle"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingText}>
                Waiting for host to start...
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.leaveBtnText}>🚪 Leave Room</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Menu — Create or Join
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.innerContent,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>🏟 ARENA</Text>
        <Text style={styles.subtitle}>
          Same deck. Same battle. Who's the best?
        </Text>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.menuRow}>
          {/* Create Room */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={handleCreate}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.menuCardIcon}>⚔</Text>
            <Text style={styles.menuCardTitle}>Create Room</Text>
            <Text style={styles.menuCardDesc}>
              Host a battle and invite friends
            </Text>
          </TouchableOpacity>

          {/* Join Room */}
          <View style={styles.menuCard}>
            <Text style={styles.menuCardIcon}>🛡</Text>
            <Text style={styles.menuCardTitle}>Join Room</Text>
            <TextInput
              style={styles.codeInput}
              value={joinCode}
              onChangeText={(t) =>
                setJoinCode(t.replace(/[^0-9]/g, "").slice(0, 4))
              }
              placeholder="4-digit code"
              placeholderTextColor="rgba(232,197,71,0.25)"
              keyboardType="number-pad"
              maxLength={4}
            />
            <TouchableOpacity
              style={[
                styles.joinBtn,
                joinCode.length !== 4 && styles.joinBtnDisabled,
              ]}
              onPress={handleJoin}
              disabled={loading || joinCode.length !== 4}
            >
              <Text style={styles.joinBtnText}>Join</Text>
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
    backgroundColor: "#0F1A12",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  innerContent: { alignItems: "center" },
  title: {
    color: "#E8C547",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 4,
  },
  subtitle: {
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

  menuRow: { flexDirection: "row", gap: 16 },
  menuCard: {
    backgroundColor: "rgba(232,197,71,0.04)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    width: 180,
    gap: 6,
  },
  menuCardIcon: { fontSize: 28 },
  menuCardTitle: {
    color: "#E8C547",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  menuCardDesc: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    textAlign: "center",
  },

  codeInput: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
    width: 140,
  },
  joinBtn: {
    backgroundColor: "#E8C547",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  joinBtnDisabled: { opacity: 0.3 },
  joinBtnText: { color: "#1a1a1a", fontSize: 13, fontWeight: "900" },

  // Lobby
  lobbyHeader: { alignItems: "center", marginBottom: 16 },
  lobbyTitle: {
    color: "#E8C547",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
  },
  codeBox: {
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
  },
  codeLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 3,
  },
  codeText: {
    color: "#E8C547",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 12,
  },
  codeHint: { color: "rgba(255,255,255,0.2)", fontSize: 9, marginTop: 2 },

  playersSection: { width: "100%", maxWidth: 400 },
  playersTitle: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  playersList: { gap: 4 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },
  playerRowFirst: { borderColor: "rgba(232,197,71,0.15)" },
  playerIcon: { fontSize: 16 },
  playerName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  hostBadge: {
    color: "#E8C547",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadge: {
    color: "#4FC3F7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    backgroundColor: "rgba(79,195,247,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  lobbyActions: { alignItems: "center", marginTop: 16, gap: 8 },
  goldBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 200,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  goldBtnDisabled: { opacity: 0.4 },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },

  waitingBox: { paddingVertical: 10 },
  waitingText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  leaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.15)",
  },
  leaveBtnText: {
    color: "rgba(255,100,100,0.5)",
    fontSize: 12,
    fontWeight: "700",
  },

  backBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 24 },
  backText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
})

export default ArenaScreen
