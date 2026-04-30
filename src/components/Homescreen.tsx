import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

interface HomeScreenProps {
  onPlay: () => void
  onScoreboard: () => void
  onArmory?: () => void
  heroName?: string
  uid?: string
  onDailyQuest?: () => void
  onLogout?: () => void
  onProfile?: () => void
  onArena?: () => void
  onLounge?: () => void
  loungeCode?: string | null
  loungeName?: string | null
}

const HomeScreen = ({
  onPlay,
  onScoreboard,
  onArmory,
  heroName,
  onDailyQuest,
  onLogout,
  onProfile,
  onArena,
  onLounge,
  loungeCode,
  loungeName,
}: HomeScreenProps) => {
  const titleOpacity = useRef(new Animated.Value(0)).current
  const titleY = useRef(new Animated.Value(-20)).current
  const cardsOpacity = useRef(new Animated.Value(0)).current
  const card1Rotate = useRef(new Animated.Value(0)).current
  const card2Rotate = useRef(new Animated.Value(0)).current
  const card3Rotate = useRef(new Animated.Value(0)).current
  const menuOpacity = useRef(new Animated.Value(0)).current
  const menuX = useRef(new Animated.Value(30)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current

  const [prizeModalVisible, setPrizeModalVisible] = useState(false)

  useEffect(() => {
    // Title slides in from top
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(titleY, {
        toValue: 0,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start()

    // Cards fade in and rotate to their positions
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(card1Rotate, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(card2Rotate, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(card3Rotate, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    // Menu slides in from right
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(menuOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(menuX, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    // Subtle pulsing glow behind cards
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

  const card1Rot = card1Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-15deg"],
  })
  const card2Rot = card2Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "0deg"],
  })
  const card3Rot = card3Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "15deg"],
  })

  return (
    <View style={styles.container}>
      {/* Background atmosphere */}
      <View style={styles.bgLayer} pointerEvents="none">
        <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />
        <Text style={[styles.bgRune, { top: "8%", left: "4%" }]}>ᚠ</Text>
        <Text style={[styles.bgRune, { top: "12%", right: "55%" }]}>ᚦ</Text>
        <Text style={[styles.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
        <Text style={[styles.bgRune, { bottom: "20%", right: "50%" }]}>ᛟ</Text>
        <Text style={[styles.bgRune, { top: "45%", left: "3%" }]}>ᚲ</Text>
        <View style={styles.bgHLine} />
      </View>

      {/* LEFT — Dramatic display */}
      <View style={styles.leftSection}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleWrap,
            { opacity: titleOpacity, transform: [{ translateY: titleY }] },
          ]}
        >
          <View style={styles.titleTopLine}>
            <View style={styles.titleLine} />
            <Text style={styles.titleDot}>◆</Text>
            <View style={styles.titleLine} />
          </View>
          <Text style={styles.titleMain}>MYTHIC</Text>
          <Text style={styles.titleSub}>PEAKS</Text>
          <Text style={styles.tagline}>A Card Game of Beasts & Glory</Text>
        </Animated.View>

        {/* Fanned cards display */}
        <Animated.View style={[styles.cardsDisplay, { opacity: cardsOpacity }]}>
          <Animated.View
            style={[
              styles.card,
              styles.cardLeft,
              { transform: [{ rotate: card1Rot }] },
            ]}
          >
            <View style={styles.cardInner}>
              <Text style={styles.cardCorner}>9</Text>
              <Text style={styles.cardIcon}>🐉</Text>
              <Text style={[styles.cardCorner, styles.cardCornerBottom]}>
                9
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardCenter,
              { transform: [{ rotate: card2Rot }, { translateY: -10 }] },
            ]}
          >
            <View style={styles.cardInner}>
              <Text style={styles.cardCorner}>K</Text>
              <Text style={styles.cardIcon}>🦅</Text>
              <Text style={[styles.cardCorner, styles.cardCornerBottom]}>
                K
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardRight,
              { transform: [{ rotate: card3Rot }] },
            ]}
          >
            <View style={styles.cardInner}>
              <Text style={styles.cardCorner}>4</Text>
              <Text style={styles.cardIcon}>🔥</Text>
              <Text style={[styles.cardCorner, styles.cardCornerBottom]}>
                4
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Hero greeting */}
        <Animated.View style={[styles.greetingWrap, { opacity: titleOpacity }]}>
          <View style={styles.greetingLine} />
          <Text style={styles.greetingText}>⚔ {heroName} ⚔</Text>
          <View style={styles.greetingLine} />
        </Animated.View>

        {/* Monthly Prize — below hero name */}
        <TouchableOpacity
          style={styles.prizeTag}
          onPress={() => setPrizeModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.prizeTagIcon}>🏆</Text>
          <Text style={styles.prizeTagText}>€100 MONTHLY PRIZE</Text>
          <View style={styles.prizeTagLive}>
            <Text style={styles.prizeTagLiveText}>LIVE</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* RIGHT — Organized menu */}
      <Animated.View
        style={[
          styles.rightSection,
          { opacity: menuOpacity, transform: [{ translateX: menuX }] },
        ]}
      >
        {/* Main action — Enter Battle */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={onPlay}
          activeOpacity={0.85}
        >
          <View style={styles.playBtnInner}>
            <Text style={styles.playIcon}>⚔</Text>
            <View>
              <Text style={styles.playText}>Enter Battle</Text>
              <Text style={styles.playSubtext}>Start a new conquest</Text>
            </View>
          </View>
          <Text style={styles.playArrow}>›</Text>
        </TouchableOpacity>

        {/* Daily Quest — featured */}
        <TouchableOpacity
          style={styles.dailyBtn}
          onPress={onDailyQuest}
          activeOpacity={0.85}
        >
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyBadge}>📜 TODAY</Text>
            <View style={styles.dailyLiveDot} />
          </View>
          <Text style={styles.dailyTitle}>Daily Quest</Text>
          <Text style={styles.dailyDesc}>Same deck for all warriors</Text>
        </TouchableOpacity>

        {/* Section divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>REALM</Text>
          <View style={styles.divLine} />
        </View>

        {/* Secondary menu grid */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onArena}
            activeOpacity={0.8}
          >
            <Text style={styles.gridIcon}>🏟</Text>
            <Text style={styles.gridLabel}>Arena</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onScoreboard}
            activeOpacity={0.8}
          >
            <Text style={styles.gridIcon}>🏆</Text>
            <Text style={styles.gridLabel}>Glory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.gridIcon}>👤</Text>
            <Text style={styles.gridLabel}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onArmory}
            activeOpacity={0.8}
          >
            <Text style={styles.gridIcon}>🛡</Text>
            <Text style={styles.gridLabel}>Armory</Text>
          </TouchableOpacity>
        </View>

        {/* Tournament — special callout */}
        <TouchableOpacity
          style={[styles.loungeBtn, loungeCode && styles.loungeBtnActive]}
          onPress={onLounge}
          activeOpacity={0.85}
        >
          <Text style={styles.loungeIcon}>🏛</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.loungeLabel}>
              {loungeCode ? loungeName : "Tournament"}
            </Text>
            <Text style={styles.loungeSubtext}>
              {loungeCode
                ? "Joined — compete for prizes"
                : "Join a lounge tournament"}
            </Text>
          </View>
          <Text style={styles.loungeArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Logout */}
      {onLogout && (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        6 Battlefields · 4 Beast Clans · €100 Monthly Prize
      </Text>

      {prizeModalVisible && (
        <View style={styles.prizeOverlay}>
          <View style={styles.prizeModal}>
            <ScrollView
              contentContainerStyle={styles.prizeModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.prizeModalOrn}>
                <View style={styles.prizeModalOrnLine} />
                <Text style={styles.prizeModalOrnDot}>◆</Text>
                <View style={styles.prizeModalOrnLine} />
              </View>
              <Text style={styles.prizeModalTrophy}>🏆</Text>
              <Text style={styles.prizeModalTitle}>MONTHLY PRIZE</Text>
              <Text style={styles.prizeModalAmount}>€100</Text>
              <View style={styles.prizeModalDivider} />
              <Text style={styles.prizeModalHow}>HOW IT WORKS</Text>
              <View style={styles.prizeModalSteps}>
                <Text style={styles.prizeModalStep}>
                  ⚔ Play battles and earn spoils
                </Text>
                <Text style={styles.prizeModalStep}>
                  📜 Complete Daily Quests for bonus
                </Text>
                <Text style={styles.prizeModalStep}>
                  🏆 Highest score at month's end wins
                </Text>
                <Text style={styles.prizeModalStep}>
                  💰 Winner receives €100 prize
                </Text>
              </View>
              <View style={styles.prizeModalDivider} />
              <Text style={styles.prizeModalNote}>
                Score resets monthly. All warriors start equal.
              </Text>
              <TouchableOpacity
                style={styles.prizeModalBtn}
                onPress={() => setPrizeModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.prizeModalBtnText}>⚔ Understood</Text>
              </TouchableOpacity>
              <View style={styles.prizeModalOrn}>
                <View style={styles.prizeModalOrnLine} />
                <Text style={styles.prizeModalOrnDot}>◆</Text>
                <View style={styles.prizeModalOrnLine} />
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1410",
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    top: "20%",
    left: "10%",
    width: "30%",
    height: "50%",
    borderRadius: 200,
    backgroundColor: "rgba(232,197,71,0.05)",
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.04)",
  },
  bgHLine: {
    position: "absolute",
    top: "50%",
    left: "55%",
    right: 0,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },

  // LEFT SECTION
  leftSection: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  titleWrap: {
    alignItems: "center",
  },
  titleTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  titleLine: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.3)",
  },
  titleDot: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
  },
  titleMain: {
    fontSize: 42,
    fontWeight: "900",
    color: "#E8C547",
    letterSpacing: 10,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleSub: {
    fontSize: 20,
    fontWeight: "300",
    color: "rgba(232,197,71,0.55)",
    letterSpacing: 16,
    marginTop: -8,
  },
  tagline: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
    marginTop: 4,
  },

  // Cards display
  cardsDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    height: 90,
  },
  card: {
    width: 52,
    height: 74,
    borderRadius: 6,
    backgroundColor: "#F5F5DC",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.6)",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  cardLeft: {
    marginRight: -12,
  },
  cardCenter: {
    zIndex: 2,
  },
  cardRight: {
    marginLeft: -12,
  },
  cardInner: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCorner: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8B1A1A",
    alignSelf: "flex-start",
  },
  cardCornerBottom: {
    alignSelf: "flex-end",
    transform: [{ rotate: "180deg" }],
  },
  cardIcon: {
    fontSize: 22,
  },

  // Greeting
  greetingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  greetingLine: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
  },
  greetingText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
  },

  // RIGHT SECTION
  rightSection: {
    flex: 1,
    gap: 7,
    justifyContent: "center",
    maxWidth: 340,
  },

  // Play button
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8C547",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playIcon: { fontSize: 22 },
  playText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: 1.5,
  },
  playSubtext: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(26,26,26,0.6)",
    letterSpacing: 1,
    marginTop: -1,
  },
  playArrow: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1a1a1a",
  },

  // Daily quest
  dailyBtn: {
    backgroundColor: "rgba(232,197,71,0.05)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dailyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  dailyBadge: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },
  dailyLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7BED9F",
    shadowColor: "#7BED9F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dailyTitle: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  dailyDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },

  // Section divider
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 1,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.08)",
  },
  divText: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 3,
  },

  // Menu grid
  menuGrid: {
    flexDirection: "row",
    gap: 5,
  },
  gridBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    backgroundColor: "rgba(232,197,71,0.03)",
    gap: 2,
  },
  gridIcon: { fontSize: 18 },
  gridLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(232,197,71,0.55)",
    letterSpacing: 1,
  },

  // Lounge
  loungeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(79,195,247,0.2)",
    backgroundColor: "rgba(79,195,247,0.04)",
    gap: 10,
  },
  loungeBtnActive: {
    borderColor: "rgba(79,195,247,0.5)",
    backgroundColor: "rgba(79,195,247,0.1)",
  },
  loungeIcon: { fontSize: 22 },
  loungeLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#4FC3F7",
    letterSpacing: 1.5,
  },
  loungeSubtext: {
    fontSize: 8,
    fontWeight: "600",
    color: "rgba(79,195,247,0.5)",
    letterSpacing: 1,
  },
  loungeArrow: {
    fontSize: 18,
    fontWeight: "900",
    color: "rgba(79,195,247,0.6)",
  },

  // Logout
  logoutBtn: {
    position: "absolute",
    bottom: 8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  logoutText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    color: "rgba(255,255,255,0.12)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    left: 20,
  },

  // Prize tag — below hero name
  prizeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "rgba(255,215,0,0.05)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
  },
  prizeTagIcon: {
    fontSize: 12,
  },
  prizeTagText: {
    color: "rgba(255,215,0,0.7)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },
  prizeTagLive: {
    backgroundColor: "rgba(123,237,159,0.15)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "rgba(123,237,159,0.3)",
  },
  prizeTagLiveText: {
    color: "#7BED9F",
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Prize modal
  prizeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  prizeModal: {
    alignItems: "center",
    backgroundColor: "#0D0A08",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,215,0,0.25)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 380,
    maxWidth: 440,
    maxHeight: "99%",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  prizeModalContent: {
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  prizeModalOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  prizeModalOrnLine: {
    width: 30,
    height: 1,
    backgroundColor: "rgba(255,215,0,0.2)",
  },
  prizeModalOrnDot: {
    color: "rgba(255,215,0,0.35)",
    fontSize: 6,
  },
  prizeModalTrophy: {
    fontSize: 28,
  },
  prizeModalTitle: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
  },
  prizeModalAmount: {
    color: "#FFD700",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(255,215,0,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  prizeModalDivider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(255,215,0,0.12)",
    marginVertical: 2,
  },
  prizeModalHow: {
    color: "rgba(255,215,0,0.45)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
  prizeModalSteps: {
    alignSelf: "stretch",
    gap: 6,
  },
  prizeModalStep: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  prizeModalNote: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
  },
  prizeModalBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 200,
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: "#D4A017",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  prizeModalBtnText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
})

export default HomeScreen
