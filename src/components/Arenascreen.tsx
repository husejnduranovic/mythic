import React, { useEffect, useRef, useState } from "react"
import { Animated, Easing } from "react-native"
import {
  Room,
  RoomPlayer,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  onRoomUpdate,
  getRoomOnce,
  subscribeToOnlineUsers,
  subscribeToMyInvites,
  clearArenaInvite,
  sendArenaInvite,
} from "../services/ArenaService"
import database from "@react-native-firebase/database"
import ArenaMenu from "./arena/ArenaMenu"
import ArenaLobby from "./arena/ArenaLobby"

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

  const [incomingInvite, setIncomingInvite] = useState<{
    fromName: string
    roomCode: string
  } | null>(null)

  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set())

  const [onlinePlayers, setOnlinePlayers] = useState<
    { uid: string; heroName: string }[]
  >([])

  useEffect(() => {
    if (mode !== "menu") return
    const unsub = subscribeToOnlineUsers((players) => {
      setOnlinePlayers(players)
    })
    return unsub
  }, [mode, uid])

  useEffect(() => {
    const unsub = subscribeToMyInvites(uid, (invite) => {
      // Ne prikazuj poziv ako si već u sobi
      if (mode === "menu" && invite) setIncomingInvite(invite)
      else if (!invite) setIncomingInvite(null)
    })
    return unsub
  }, [uid, mode])

  const handleAcceptInvite = async () => {
    if (!incomingInvite) return
    const code = incomingInvite.roomCode
    await clearArenaInvite(uid)
    setIncomingInvite(null)
    setJoinCode(code)
    // joinaj odmah
    const result = await joinRoom(code, uid, heroName)
    if (result.success) {
      setRoomCode(code)
      const roomData = await getRoomOnce(code)
      if (roomData) setRoom(roomData)
      setMode("lobby")
      subscribeToRoom(code)
    } else {
      setError(result.error || "Room no longer available")
    }
  }

  const handleDeclineInvite = async () => {
    await clearArenaInvite(uid)
    setIncomingInvite(null)
  }

  const handleSendInvite = async (toUid: string) => {
    await sendArenaInvite(toUid, heroName, roomCode || "1234")
    setInvitedUids((prev) => new Set(prev).add(toUid))
  }

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

  useEffect(() => {
    const unsub = subscribeToOnlineUsers((players) => {
      setOnlinePlayers(players)
    })
    return unsub
  }, [])

  const isHost = room?.hostUid === uid
  const players: RoomPlayer[] = room?.players ? Object.values(room.players) : []

  if (mode === "lobby" && room) {
    return (
      <ArenaLobby
        room={room}
        roomCode={roomCode}
        uid={uid}
        players={players}
        isHost={isHost}
        onlinePlayers={onlinePlayers}
        invitedUids={invitedUids}
        incomingInvite={incomingInvite}
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        glowPulse={glowPulse}
        onStart={handleStart}
        onLeave={handleLeave}
        onSendInvite={handleSendInvite}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
        onBack={onBack}
      />
    )
  }

  // Menu — Create or Join
  return (
    <ArenaMenu
      uid={uid}
      joinCode={joinCode}
      error={error}
      loading={loading}
      onlinePlayers={onlinePlayers}
      fadeAnim={fadeAnim}
      slideAnim={slideAnim}
      glowPulse={glowPulse}
      onJoinCodeChange={setJoinCode}
      onCreate={handleCreate}
      onJoin={handleJoin}
      onBack={onBack}
    />
  )
}

export default ArenaScreen
