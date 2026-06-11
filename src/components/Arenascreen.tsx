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
  subscribeToOnlineUsers,
  subscribeToMyInvites,
  clearArenaInvite,
  sendArenaInvite,
} from "../services/ArenaService"
import database from "@react-native-firebase/database"
import ReturnToCastle from "./ReturnToCastle"

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
        {incomingInvite && (
          <View style={styles.inviteModalOverlay}>
            <View style={styles.inviteModalCard}>
              <Text style={styles.inviteModalIcon}>⚔</Text>
              <Text style={styles.inviteModalTitle}>BATTLE INVITE</Text>
              <Text style={styles.inviteModalText}>
                {incomingInvite.fromName} is calling you to the arena
              </Text>
              <View style={styles.inviteModalCode}>
                <Text style={styles.inviteModalCodeText}>
                  #{incomingInvite.roomCode}
                </Text>
              </View>
              <View style={styles.inviteModalBtns}>
                <TouchableOpacity
                  style={styles.inviteAcceptBtn}
                  onPress={handleAcceptInvite}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inviteAcceptText}>⚔ JOIN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inviteDeclineBtn}
                  onPress={handleDeclineInvite}
                  activeOpacity={0.85}
                >
                  <Text style={styles.inviteDeclineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
              {/* Invite online players */}
              <View style={styles.inviteSection}>
                <View style={styles.playersSectionHeader}>
                  <View style={styles.sectionLine} />
                  <Text style={styles.playersTitle}>INVITE ONLINE</Text>
                  <View style={styles.sectionLine} />
                </View>

                {(() => {
                  const inRoom = new Set(players.map((p: RoomPlayer) => p.uid))
                  const invitable = onlinePlayers.filter(
                    (p) => !inRoom.has(p.uid),
                  )

                  if (invitable.length === 0) {
                    return (
                      <Text style={styles.inviteEmptyText}>
                        No other warriors online
                      </Text>
                    )
                  }

                  return (
                    <ScrollView
                      style={styles.inviteScroll}
                      contentContainerStyle={{ gap: 4 }}
                      showsVerticalScrollIndicator={false}
                    >
                      {invitable.map((p, i) => {
                        const sent = invitedUids.has(p.uid)
                        return (
                          <View key={`${p.uid}-${i}`} style={styles.inviteRow}>
                            <View style={styles.onlineCardAvatar}>
                              <Text style={styles.onlineCardAvatarText}>⚔</Text>
                            </View>
                            <Text style={styles.inviteName} numberOfLines={1}>
                              {p.heroName}
                            </Text>
                            <TouchableOpacity
                              style={[
                                styles.inviteBtn,
                                sent && styles.inviteBtnSent,
                              ]}
                              onPress={() => handleSendInvite(p.uid)}
                              disabled={sent}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.inviteBtnText,
                                  sent && styles.inviteBtnTextSent,
                                ]}
                              >
                                {sent ? "SENT" : "INVITE"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
                      })}
                    </ScrollView>
                  )
                })()}
              </View>
            </View>
          </View>

          <ReturnToCastle onPress={onBack} />
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

        {/* Two-column layout: cards (left 72%) + online list (right 28%) */}
        <View style={styles.menuLayout}>
          {/* LEFT — Host + Join cards */}
          <View style={styles.menuLeft}>
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

          {/* RIGHT — Online warriors list */}
          <View style={styles.menuRight}>
            <View style={styles.onlineHeaderRow}>
              <View style={styles.onlineLiveDot} />
              <Text style={styles.onlineHeaderText}>
                ONLINE · {onlinePlayers.length}
              </Text>
            </View>

            {onlinePlayers.length === 0 ? (
              <View style={styles.emptyOnline}>
                <Text style={styles.emptyOnlineIcon}>⚔</Text>
                <Text style={styles.emptyOnlineText}>No warriors waiting</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.onlineListScroll}
                contentContainerStyle={styles.onlineListContent}
                showsVerticalScrollIndicator={false}
              >
                {onlinePlayers.map((p, i) => (
                  <View key={`${p.uid}-${i}`} style={styles.onlineCard}>
                    <View style={styles.onlineCardAvatar}>
                      <Text style={styles.onlineCardAvatarText}>⚔</Text>
                    </View>
                    <Text style={styles.onlineCardName} numberOfLines={1}>
                      {p.uid === uid ? `${p.heroName} (you)` : p.heroName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <ReturnToCastle onPress={onBack} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  // Two-column layout
  menuLayout: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 780,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  menuLeft: {
    flexDirection: "row",
    gap: 10,
    flex: 0.72,
    justifyContent: "center",
  },
  menuRight: {
    flex: 0.28,
    minWidth: 140,
  },

  // Online warriors panel (right column)
  onlineHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  onlineLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7BED9F",
    shadowColor: "#7BED9F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  onlineHeaderText: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },
  emptyOnline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    backgroundColor: "rgba(232,197,71,0.02)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
    borderStyle: "dashed",
    gap: 6,
  },
  emptyOnlineIcon: {
    fontSize: 20,
    opacity: 0.3,
  },
  emptyOnlineText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
  onlineListScroll: {
    maxHeight: 220,
  },
  onlineListContent: {
    gap: 4,
  },
  onlineCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
  },
  onlineCardAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineCardAvatarText: {
    fontSize: 10,
    color: "rgba(232,197,71,0.6)",
  },
  onlineCardName: {
    flex: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  onlineCardCode: {
    color: "#E8C547",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    maxWidth: 480,
    marginTop: 4,
    marginBottom: 12,
  },
  hostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.3)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  hostBtnIcon: {
    fontSize: 22,
  },
  hostBtnTextWrap: {
    flex: 1,
  },
  hostBtnLabel: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
  },
  hostBtnHint: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  joinSection: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  joinInput: {
    flex: 1,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
  },
  joinBtnNew: {
    backgroundColor: "#E8C547",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnNewDisabled: {
    opacity: 0.3,
    shadowOpacity: 0,
  },
  joinBtnNewText: {
    color: "#1a1a1a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Section divider
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    width: "100%",
    maxWidth: 480,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  sectionDividerText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3,
  },

  // Online section — main attraction
  onlineSectionWrap: {
    width: "100%",
    maxWidth: 480,
    flex: 1,
    marginBottom: 12,
  },

  emptyOnlineSubtext: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  onlineCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  onlineCardInfo: {
    flex: 1,
  },

  onlineCardStatus: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  onlineCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  onlineCardCodeLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 2,
  },
  onlineCardCodeValue: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 1,
  },
  onlineCardArrow: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 16,
    fontWeight: "900",
  },
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
    borderRadius: 12,
    padding: 12, // was 16
    alignItems: "center",
    width: 160, // was 200
    gap: 4, // was 6
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
    width: 44, // was 54
    height: 44, // was 54
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.3)",
    backgroundColor: "rgba(232,197,71,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2, // was 4
  },
  menuCardIcon: { fontSize: 22 }, // was 26
  menuCardTitle: {
    color: "#E8C547",
    fontSize: 12, // was 14
    fontWeight: "900",
    letterSpacing: 2,
  },
  menuCardDesc: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8, // was 9
    textAlign: "center",
    letterSpacing: 0.5,
    minHeight: 20, // was 22
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
    marginTop: 2,
    width: 120, // was 140
  },
  codeInput: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "#E8C547",
    fontSize: 18, // was 22
    fontWeight: "900",
    letterSpacing: 8, // was 10
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
  onlineSection: {
    width: "100%",
    maxWidth: 420,
    marginTop: 16,
    alignItems: "center",
  },
  onlineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    width: "100%",
  },
  onlineHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.12)",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7BED9F",
  },
  onlineTitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3,
  },
  onlineScroll: {
    maxHeight: 140,
    width: "100%",
  },
  onlineList: {
    gap: 4,
    paddingHorizontal: 4,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
  },
  onlineAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineAvatarText: {
    fontSize: 10,
    color: "rgba(232,197,71,0.6)",
  },
  onlineName: {
    flex: 1,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  onlineCodeBadge: {
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
  },
  onlineCodeText: {
    color: "#E8C547",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  inviteSection: { marginTop: 10 },
  inviteScroll: { maxHeight: 100 },
  inviteEmptyText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
  },
  inviteName: {
    flex: 1,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
  },
  inviteBtn: {
    backgroundColor: "#E8C547",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inviteBtnSent: {
    backgroundColor: "rgba(232,197,71,0.12)",
  },
  inviteBtnText: {
    color: "#1a1a1a",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  inviteBtnTextSent: {
    color: "rgba(232,197,71,0.6)",
  },
  inviteModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  inviteModalCard: {
    backgroundColor: "#14100C",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.4)",
    paddingHorizontal: 28,
    paddingVertical: 20,
    alignItems: "center",
    gap: 6,
    maxWidth: 320,
  },
  inviteModalIcon: { fontSize: 32 },
  inviteModalTitle: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
  },
  inviteModalText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  inviteModalCode: {
    backgroundColor: "rgba(232,197,71,0.1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginVertical: 4,
  },
  inviteModalCodeText: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  inviteModalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  inviteAcceptBtn: {
    backgroundColor: "#E8C547",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  inviteAcceptText: {
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  inviteDeclineBtn: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.3)",
  },
  inviteDeclineText: {
    color: "rgba(255,100,100,0.6)",
    fontSize: 12,
    fontWeight: "700",
  },
})

export default ArenaScreen
