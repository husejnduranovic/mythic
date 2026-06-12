import React from "react"
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { Room, RoomPlayer } from "../../services/ArenaService"
import ReturnToCastle from "../ReturnToCastle"
import BackgroundDecor from "./BackgroundDecor"
import { styles } from "./arenaStyles"
import { Icon } from "../../ui/Icon"
import { color } from "../../ui/theme"

interface Props {
  room: Room
  roomCode: string
  uid: string
  players: RoomPlayer[]
  isHost: boolean
  onlinePlayers: { uid: string; heroName: string }[]
  invitedUids: Set<string>
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
  glowPulse: Animated.Value
  onStart: () => void
  onLeave: () => void
  onSendInvite: (toUid: string) => void
  onBack: () => void
}

const ArenaLobby = ({
  room,
  roomCode,
  uid,
  players,
  isHost,
  onlinePlayers,
  invitedUids,
  fadeAnim,
  slideAnim,
  glowPulse,
  onStart,
  onLeave,
  onSendInvite,
  onBack,
}: Props) => {
  return (
    <View style={styles.container}>
      <BackgroundDecor glowPulse={glowPulse} />
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
                  onPress={onStart}
                  disabled={players.length < 2}
                  activeOpacity={0.85}
                >
                  <Icon name="sword-cross" size={16} color="#1a1a1a" />
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
              <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
                <Icon
                  name="door-open"
                  size={12}
                  color="rgba(255,100,100,0.6)"
                />
                <Text style={styles.leaveBtnText}>Leave Room</Text>
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
                      {isPlayerHost ? (
                        <Icon name="crown" size={14} color={color.goldBright} />
                      ) : (
                        <Icon
                          name="sword-cross"
                          size={13}
                          color={color.goldFaded}
                        />
                      )}
                    </View>
                    <Text
                      style={[styles.playerName, isYou && styles.playerNameYou]}
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
                      <Icon
                        name="help"
                        size={14}
                        color="rgba(232,197,71,0.3)"
                      />
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
                const invitable = onlinePlayers.filter((p) => !inRoom.has(p.uid))

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
                            <Icon
                              name="sword-cross"
                              size={11}
                              color={color.goldFaded}
                            />
                          </View>
                          <Text style={styles.inviteName} numberOfLines={1}>
                            {p.heroName}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.inviteBtn,
                              sent && styles.inviteBtnSent,
                            ]}
                            onPress={() => onSendInvite(p.uid)}
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

export default ArenaLobby
