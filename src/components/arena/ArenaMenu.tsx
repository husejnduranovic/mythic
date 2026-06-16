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
import { Icon } from "../../ui/Icon"
import { color } from "../../ui/theme"

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
          <View style={styles.titleRow}>
            <Icon name="sword-cross" size={26} color={color.ember} />
            <Text style={styles.title}>ARENA</Text>
          </View>
          <Text style={styles.subtitle}>
            Same deck · Same battle · One champion
          </Text>
        </View>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={13} color="#FF6B6B" />
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
                <Icon name="sword-cross" size={24} color={color.gold} />
              </View>
              <Text style={styles.menuCardTitle}>Host Battle</Text>
              <Text style={styles.menuCardDesc}>
                Create a room and invite warriors
              </Text>
              <View style={[styles.cardActionBtn, { marginTop: "auto" }]}>
                <Text style={styles.cardActionText}>CREATE</Text>
              </View>
            </TouchableOpacity>

            {/* Join Room */}
            <View style={styles.menuCard}>
              <View style={styles.menuCardGlow} />
              <View style={styles.menuCardIconWrap}>
                <Icon name="shield" size={24} color={color.gold} />
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
                  styles.cardActionBtn,
                  { marginTop: 6 },
                  joinCode.length !== 4 && styles.cardActionDisabled,
                ]}
                onPress={onJoin}
                disabled={loading || joinCode.length !== 4}
                activeOpacity={0.85}
              >
                <Text style={styles.cardActionText}>JOIN</Text>
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
                <Icon name="sword-cross" size={20} color={color.steel} />
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
                      <Icon
                        name="sword-cross"
                        size={11}
                        color={color.goldFaded}
                      />
                    </View>
                    <Text style={styles.onlineCardName} numberOfLines={1}>
                      {p.heroName}
                    </Text>
                    {p.uid === uid && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
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
