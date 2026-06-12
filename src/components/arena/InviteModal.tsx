import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { styles } from "./arenaStyles"

interface Props {
  invite: { fromName: string; roomCode: string }
  onAccept: () => void
  onDecline: () => void
}

const InviteModal = ({ invite, onAccept, onDecline }: Props) => (
  <View style={styles.inviteModalOverlay}>
    <View style={styles.inviteModalCard}>
      <Text style={styles.inviteModalIcon}>⚔</Text>
      <Text style={styles.inviteModalTitle}>BATTLE INVITE</Text>
      <Text style={styles.inviteModalText}>
        {invite.fromName} is calling you to the arena
      </Text>
      <View style={styles.inviteModalCode}>
        <Text style={styles.inviteModalCodeText}>#{invite.roomCode}</Text>
      </View>
      <View style={styles.inviteModalBtns}>
        <TouchableOpacity
          style={styles.inviteAcceptBtn}
          onPress={onAccept}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteAcceptText}>⚔ JOIN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inviteDeclineBtn}
          onPress={onDecline}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteDeclineText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)

export default InviteModal
