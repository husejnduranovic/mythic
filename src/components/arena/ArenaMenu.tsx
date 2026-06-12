import React from "react"
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import ReturnToCastle from "../ReturnToCastle"
import BackgroundDecor from "./BackgroundDecor"
import { styles } from "./arenaStyles"

interface Props {
  uid: string
  joinCode: string
  error: string
  loading: boolean
  onlinePlayers: { uid: string; heroName: string }[]
  fadeAnim: Animated.Value
  slideAnim: Animated.Value
  glowPulse: Animated.Value
  onJoinCodeChange: (code: string) => void
  onCreate: () => void
  onJoin: () => void
  onBack: () => void
}

const ArenaMenu = ({
  uid,
  joinCode,
  error,
  loading,
  onlinePlayers,
  fadeAnim,
  slideAnim,
  glowPulse,
  onJoinCodeChange,
  onCreate,
  onJoin,
  onBack,
}: Props) => {
  return (
    <View style={styles.container}>
      <BackgroundDecor glowPulse={glowPulse} />

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
              onPress={onCreate}
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
                    onJoinCodeChange(t.replace(/[^0-9]/g, "").slice(0, 4))
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
                onPress={onJoin}
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

export default ArenaMenu
