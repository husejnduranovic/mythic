import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { styles } from "./arenaStyles"
import { Icon } from "../../ui/Icon"
import { color } from "../../ui/theme"

interface Props {
  invite: { fromName: string; roomCode: string }
  onAccept: () => void
  onDecline: () => void
}

const InviteModal = ({ invite, onAccept, onDecline }: Props) => (
  <View style={styles.inviteModalOverlay}>
    <View style={styles.inviteModalCard}>
      <Icon name="sword-cross" size={32} color={color.gold} />
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
          <Icon name="sword-cross" size={13} color="#1a1a1a" />
          <Text style={styles.inviteAcceptText}>JOIN</Text>
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
