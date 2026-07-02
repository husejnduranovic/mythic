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
import { color, font } from "../ui/theme"
import { Icon } from "../ui/Icon"

// ─────────────────────────────────────────────────────────────────────────────
// Home — "Crest Gate & War Table" (DESIGN_PLAN §4.1)
//
// Left column recreates the app icon: a fanned trio of big crest cards in the
// honor-card grammar (green fields, suit trims, Cinzel corner indices, runes,
// medallion crests), with identity (name/streak/prize) consolidated beneath.
// Right column is the war table: Enter Battle CTA, the Daily/Arena mode-card
// pair, and the five-slot meta rail (incl. the restored Lounge entry).
// ─────────────────────────────────────────────────────────────────────────────

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
  onlineCount: number
  currentStreak: number
  bestStreak?: number
  emberWarded?: boolean
  onHowToPlay?: () => void
}

const withAlpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// The icon's card green (shared visual language with the Hall of Glory podium).
const CARD_FIELD = "#1A3D2A"
const CARD_RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]
// The icon's signature teal-patina — used only for the center eagle crest.
// (Deliberate display-card accent; the icon itself breaks suit colour here.)
const VERDIGRIS = "#5E9E8A"

// ── Crest card (one card of the marquee fan) ────────────────────────────────

interface CrestCardProps {
  value: string
  beast: string
  trim: string
  w: number
  h: number
  isCenter?: boolean
}

const CrestCard = ({ value, beast, trim, w, h, isCenter }: CrestCardProps) => {
  const medal = Math.round(w * 0.5)
  return (
    <View
      style={[
        f.card,
        {
          width: w,
          height: h,
          borderColor: withAlpha(trim, isCenter ? 0.8 : 0.6),
          borderWidth: isCenter ? 2 : 1.5,
          elevation: isCenter ? 10 : 6,
        },
      ]}
    >
      {/* engraved inner pinstripe */}
      <View style={[f.frame, { borderColor: withAlpha(trim, 0.3) }]} />

      {/* corner runes */}
      <Text style={[f.rune, { top: 9, right: 9, color: withAlpha(trim, 0.28) }]}>
        {CARD_RUNES[1]}
      </Text>
      <Text style={[f.rune, { bottom: 9, left: 9, color: withAlpha(trim, 0.28) }]}>
        {CARD_RUNES[2]}
      </Text>

      {/* Cinzel corner index (TL + rotated BR, like a real card) */}
      <View style={[f.index, { top: 4, left: 7 }]}>
        <Text style={[f.indexNum, { color: trim }]}>{value}</Text>
        <Text style={[f.indexDot, { color: withAlpha(trim, 0.7) }]}>◆</Text>
      </View>
      <View style={[f.index, f.indexBR, { bottom: 4, right: 7 }]}>
        <Text style={[f.indexNum, { color: trim }]}>{value}</Text>
        <Text style={[f.indexDot, { color: withAlpha(trim, 0.7) }]}>◆</Text>
      </View>

      {/* beast crest in a medallion ring */}
      <View
        style={[
          f.medal,
          {
            width: medal,
            height: medal,
            borderRadius: medal / 2,
            backgroundColor: withAlpha(trim, 0.1),
            borderColor: withAlpha(trim, 0.55),
          },
        ]}
      >
        <View
          style={[
            f.medalRing,
            { borderColor: withAlpha(trim, 0.3), borderRadius: medal / 2 },
          ]}
        />
        <Text style={{ fontSize: Math.round(medal * 0.52) }}>{beast}</Text>
      </View>
    </View>
  )
}

const f = StyleSheet.create({
  card: {
    backgroundColor: CARD_FIELD,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  frame: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  rune: { position: "absolute", fontSize: 8 },
  index: { position: "absolute", alignItems: "center", zIndex: 2 },
  indexBR: { transform: [{ rotate: "180deg" }] },
  indexNum: { fontFamily: font.heading, fontSize: 13, lineHeight: 16 },
  indexDot: { fontSize: 5, marginTop: -2 },
  medal: {
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  medalRing: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 0.5,
  },
})

// ── Screen ──────────────────────────────────────────────────────────────────

// Press weight — the dais-punch grammar from the war table, applied to the
// menu's pressables: dip on press-in, spring back with a slight overshoot.
// Event-driven native-driver transforms only; nothing runs while idle.
const usePressPunch = (dip = 0.965) => {
  const scale = useRef(new Animated.Value(1)).current
  const pressIn = () =>
    Animated.spring(scale, {
      toValue: dip,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start()
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      speed: 24,
      bounciness: 9,
      useNativeDriver: true,
    }).start()
  return { scale, pressIn, pressOut }
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
  onlineCount,
  currentStreak,
  emberWarded,
  onHowToPlay,
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
  const fanFloat = useRef(new Animated.Value(0)).current
  const dotPulse = useRef(new Animated.Value(0.55)).current

  const playPunch = usePressPunch(0.97)
  const dailyPunch = usePressPunch()
  const arenaPunch = usePressPunch()

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

    // Cards fade in and fan out to their positions
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

    // The fan levitates gently — the marquee breathes
    Animated.loop(
      Animated.sequence([
        Animated.timing(fanFloat, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(fanFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()

    // Live dots breathe (daily + arena online)
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 0.55,
          duration: 900,
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
  const fanY = fanFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })

  const railItem = (
    icon: React.ComponentProps<typeof Icon>["name"],
    label: string,
    onPress?: () => void,
    dot?: boolean,
  ) =>
    onPress ? (
      <TouchableOpacity style={styles.railItem} onPress={onPress} activeOpacity={0.7}>
        <View>
          <Icon name={icon} size={20} color={color.goldFaded} />
          {dot && <View style={styles.railDot} />}
        </View>
        <Text style={styles.railLabel}>{label}</Text>
      </TouchableOpacity>
    ) : null

  return (
    <View style={styles.container}>
      {/* Background atmosphere — layered table-light pool under the crest
          fan (the battlefield's light grammar: hot core fading to dark edges;
          all three layers breathe on the one existing glowPulse loop). */}
      <View style={styles.bgLayer} pointerEvents="none">
        <Animated.View
          style={[
            styles.poolHalo,
            {
              opacity: glowPulse.interpolate({
                inputRange: [0.3, 0.5],
                outputRange: [0.55, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.poolMid,
            {
              opacity: glowPulse.interpolate({
                inputRange: [0.3, 0.5],
                outputRange: [0.5, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.poolCore,
            {
              opacity: glowPulse.interpolate({
                inputRange: [0.3, 0.5],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
        <Text style={[styles.bgRune, { top: "8%", left: "4%" }]}>ᚠ</Text>
        <Text style={[styles.bgRune, { top: "12%", right: "55%" }]}>ᚦ</Text>
        <Text style={[styles.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
        <Text style={[styles.bgRune, { bottom: "20%", right: "50%" }]}>ᛟ</Text>
        <Text style={[styles.bgRune, { top: "45%", left: "3%" }]}>ᚲ</Text>
        <View style={styles.bgHLine} />
      </View>

      {/* LEFT — the crest gate */}
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

        {/* Fanned crest cards — the icon, recreated */}
        <Animated.View
          style={[
            styles.cardsDisplay,
            { opacity: cardsOpacity, transform: [{ translateY: fanY }] },
          ]}
        >
          <Animated.View
            style={[styles.cardLeft, { transform: [{ rotate: card1Rot }] }]}
          >
            <CrestCard value="9" beast="🐉" trim="#C0392B" w={72} h={102} />
          </Animated.View>
          <Animated.View
            style={[styles.cardCenter, { transform: [{ rotate: card2Rot }, { translateY: -8 }] }]}
          >
            <CrestCard value="K" beast="🦅" trim={VERDIGRIS} w={82} h={116} isCenter />
          </Animated.View>
          <Animated.View
            style={[styles.cardRight, { transform: [{ rotate: card3Rot }] }]}
          >
            <CrestCard value="4" beast="🐺" trim="#1A5C8A" w={72} h={102} />
          </Animated.View>
        </Animated.View>

        {/* Shelf shadow — grounds the levitating fan; counter-breathes with
            it (fan rises → shadow tightens and lightens). */}
        <Animated.View
          style={[
            styles.fanShadow,
            {
              opacity: fanFloat.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.22],
              }),
              transform: [
                {
                  scaleX: fanFloat.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.92],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Identity — name, streak, prize */}
        <Animated.View style={[styles.greetingWrap, { opacity: titleOpacity }]}>
          <View style={styles.greetingLine} />
          <Icon name="sword-cross" size={12} color={color.gold} />
          <Text style={styles.greetingText}>{heroName}</Text>
          <Icon name="sword-cross" size={12} color={color.gold} />
          <View style={styles.greetingLine} />
        </Animated.View>

        {(currentStreak || 0) > 0 && (
          <TouchableOpacity
            style={styles.streakBadge}
            onPress={onProfile}
            activeOpacity={0.8}
          >
            {/* the ember flickers — rides the existing dotPulse loop */}
            <Animated.View
              style={{
                opacity: dotPulse.interpolate({
                  inputRange: [0.55, 1],
                  outputRange: [0.65, 1],
                }),
              }}
            >
              <Icon name="fire" size={13} color={color.ember} />
            </Animated.View>
            <Text style={styles.streakBadgeCount}>{currentStreak}</Text>
            <Text style={styles.streakBadgeLabel}>DAY STREAK</Text>
            {/* Ember Ward spent — the ember survived the night */}
            {emberWarded && (
              <Animated.View
                style={{
                  opacity: dotPulse.interpolate({
                    inputRange: [0.55, 1],
                    outputRange: [1, 0.65],
                  }),
                }}
              >
                <Icon
                  name="shield-half-full"
                  size={11}
                  color="rgba(255,140,0,0.75)"
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.prizeTag}
          onPress={() => setPrizeModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="trophy-variant" size={14} color="rgba(255,215,0,0.85)" />
          <Text style={styles.prizeTagText}>€100 MONTHLY PRIZE</Text>
          <View style={styles.prizeTagLive}>
            <Text style={styles.prizeTagLiveText}>LIVE</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* RIGHT — the war table */}
      <Animated.View
        style={[
          styles.rightSection,
          { opacity: menuOpacity, transform: [{ translateX: menuX }] },
        ]}
      >
        {/* Main action — Enter Battle (dais-punch press weight) */}
        <Animated.View style={{ transform: [{ scale: playPunch.scale }] }}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={onPlay}
            onPressIn={playPunch.pressIn}
            onPressOut={playPunch.pressOut}
            activeOpacity={0.92}
          >
            <View style={styles.playPinstripe} pointerEvents="none" />
            <View style={styles.playBtnInner}>
              <Icon name="sword-cross" size={22} color="#1a1a1a" />
              <View>
                <Text style={styles.playText}>Enter Battle</Text>
                <Text style={styles.playSubtext}>Start a new conquest</Text>
              </View>
            </View>
            <Text style={styles.playArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Mode pair — Daily Quest | Arena */}
        <View style={styles.modeRow}>
          <Animated.View
            style={{ flex: 1, transform: [{ scale: dailyPunch.scale }] }}
          >
          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardGold, styles.modeCardFill]}
            onPress={onDailyQuest}
            onPressIn={dailyPunch.pressIn}
            onPressOut={dailyPunch.pressOut}
            activeOpacity={0.9}
          >
            <View
              style={[styles.modePinstripe, { borderColor: "rgba(232,197,71,0.14)" }]}
              pointerEvents="none"
            />
            <View style={styles.modeHeader}>
              <Icon name="script-text-outline" size={12} color={color.goldFaded} />
              <Text style={styles.modeBadgeGold}>TODAY</Text>
              <Animated.View style={[styles.liveDot, { opacity: dotPulse }]} />
            </View>
            <Text style={styles.modeTitleGold}>Daily Quest</Text>
            <Text style={styles.modeDesc}>Same deck for all</Text>
          </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{ flex: 1, transform: [{ scale: arenaPunch.scale }] }}
          >
          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardEmber, styles.modeCardFill]}
            onPress={onArena}
            onPressIn={arenaPunch.pressIn}
            onPressOut={arenaPunch.pressOut}
            activeOpacity={0.9}
          >
            <View
              style={[styles.modePinstripe, { borderColor: "rgba(255,140,0,0.14)" }]}
              pointerEvents="none"
            />
            <View style={styles.modeHeader}>
              <Icon name="sword-cross" size={12} color="rgba(255,140,0,0.7)" />
              <Text style={styles.modeBadgeEmber}>2–6 PLAYERS</Text>
              {onlineCount > 0 && (
                <View style={styles.onlineBadge}>
                  <Animated.View style={[styles.liveDot, { opacity: dotPulse }]} />
                  <Text style={styles.onlineBadgeText}>{onlineCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.modeTitleEmber}>Arena</Text>
            <Text style={styles.modeDesc}>Real-time duels</Text>
          </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Section divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>REALM</Text>
          <View style={styles.divLine} />
        </View>

        {/* Meta rail — Glory · Profile · Armory · Lounge · Guide */}
        <View style={styles.iconRail}>
          {railItem("trophy-variant", "Glory", onScoreboard)}
          <View style={styles.railDivider} />
          {railItem("shield-account", "Profile", onProfile)}
          <View style={styles.railDivider} />
          {railItem("shield-half-full", "Armory", onArmory)}
          {onLounge && <View style={styles.railDivider} />}
          {railItem("pillar", "Lounge", onLounge, !!loungeCode)}
          <View style={styles.railDivider} />
          {railItem("script-text-outline", "Guide", onHowToPlay)}
        </View>
      </Animated.View>

      {/* Logout */}
      {onLogout && (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Icon name="logout-variant" size={11} color="rgba(255,255,255,0.3)" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      )}

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
              <Icon
                name="trophy-variant"
                size={30}
                color={color.gold}
                style={{ marginBottom: 2 }}
              />
              <Text style={styles.prizeModalTitle}>MONTHLY PRIZES</Text>
              <Text style={styles.prizeModalAmount}>€100</Text>
              <View style={styles.prizeModalDivider} />
              <Text style={styles.prizeModalHow}>HOW IT WORKS</Text>
              <View style={styles.prizeModalSteps}>
                <View style={styles.prizeModalStepRow}>
                  <Icon name="sword-cross" size={13} color={color.goldFaded} />
                  <Text style={styles.prizeModalStep}>
                    Play battles and earn spoils
                  </Text>
                </View>
                <View style={styles.prizeModalStepRow}>
                  <Icon
                    name="script-text-outline"
                    size={13}
                    color={color.goldFaded}
                  />
                  <Text style={styles.prizeModalStep}>
                    Complete Daily Quests for bonus
                  </Text>
                </View>
                <View style={styles.prizeModalStepRow}>
                  <Icon name="medal" size={13} color="#E8C547" />
                  <Text style={styles.prizeModalStep}>1st place — €50</Text>
                </View>
                <View style={styles.prizeModalStepRow}>
                  <Icon name="medal" size={13} color="#C9D1D9" />
                  <Text style={styles.prizeModalStep}>2nd place — €30</Text>
                </View>
                <View style={styles.prizeModalStepRow}>
                  <Icon name="medal" size={13} color="#B07B4F" />
                  <Text style={styles.prizeModalStep}>3rd place — €20</Text>
                </View>
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
                <Icon name="sword-cross" size={14} color="#1a1a1a" />
                <Text style={styles.prizeModalBtnText}>Understood</Text>
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
    backgroundColor: color.bgBase,
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
  // Table-light pool — three stacked layers, hot core to soft halo (the
  // in-game battlefield light grammar; replaces the old single hard blob).
  poolHalo: {
    position: "absolute",
    top: "18%",
    left: "5%",
    width: "42%",
    height: "60%",
    borderRadius: 999,
    backgroundColor: "rgba(232,197,71,0.035)",
  },
  poolMid: {
    position: "absolute",
    top: "28%",
    left: "10%",
    width: "32%",
    height: "42%",
    borderRadius: 999,
    backgroundColor: "rgba(232,197,71,0.045)",
  },
  poolCore: {
    position: "absolute",
    top: "36%",
    left: "16%",
    width: "20%",
    height: "26%",
    borderRadius: 999,
    backgroundColor: "rgba(240,210,110,0.06)",
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
    fontFamily: font.display,
    fontSize: 40,
    color: color.gold,
    letterSpacing: 4, // Cinzel carries the weight — no need to fake it with wide tracking
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleSub: {
    fontFamily: font.heading,
    fontSize: 18,
    color: "rgba(232,197,71,0.55)",
    letterSpacing: 8,
    marginTop: -2,
  },
  tagline: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
    marginTop: 4,
  },

  // Crest fan
  cardsDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    height: 126,
  },
  cardLeft: { marginRight: -16, zIndex: 1 },
  cardCenter: { zIndex: 2 },
  cardRight: { marginLeft: -16, zIndex: 1 },
  fanShadow: {
    width: 150,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#000",
    marginTop: 2,
  },

  // Greeting
  greetingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  greetingLine: {
    width: 24,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
  },
  greetingText: {
    color: color.gold,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
  },

  // Streak chip
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  streakBadgeCount: {
    color: "rgba(255,140,0,0.85)",
    fontSize: 12,
    fontWeight: "900",
  },
  streakBadgeLabel: {
    color: "rgba(255,140,0,0.5)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // Prize tag
  prizeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
    backgroundColor: "rgba(255,215,0,0.05)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
  },
  prizeTagText: {
    color: "rgba(255,215,0,0.75)",
    fontSize: 10,
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
    color: color.sage,
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // RIGHT SECTION
  rightSection: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
    maxWidth: 340,
  },

  // Play button
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: color.gold,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playPinstripe: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(26,26,26,0.18)",
  },
  playBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playText: {
    fontFamily: font.heading,
    fontSize: 16,
    color: color.ink,
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
    color: color.ink,
    marginRight: 4,
  },

  // Mode pair
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  // Inside the press-punch wrapper (which owns the row's flex:1) the card
  // must size by content, not flex — flex:1 in an auto-height parent collapses.
  modeCardFill: {
    flex: 0,
    width: "100%",
  },
  modeCardGold: {
    backgroundColor: "rgba(232,197,71,0.05)",
    borderColor: "rgba(232,197,71,0.22)",
  },
  modeCardEmber: {
    backgroundColor: "rgba(255,140,0,0.06)",
    borderColor: "rgba(255,140,0,0.3)",
    shadowColor: color.ember,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modePinstripe: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  modeBadgeGold: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    flex: 1,
  },
  modeBadgeEmber: {
    color: "rgba(255,140,0,0.55)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    flex: 1,
  },
  modeTitleGold: {
    fontFamily: font.heading,
    color: color.gold,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  modeTitleEmber: {
    fontFamily: font.heading,
    color: color.ember,
    fontSize: 14,
    letterSpacing: 1.5,
    textShadowColor: "rgba(255,140,0,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  modeDesc: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.sage,
    shadowColor: color.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(123,237,159,0.12)",
    borderWidth: 1,
    borderColor: "rgba(123,237,159,0.3)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  onlineBadgeText: {
    color: color.sage,
    fontSize: 9,
    fontWeight: "900",
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

  // Meta rail
  iconRail: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: "rgba(232,197,71,0.02)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },
  railItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
  },
  railLabel: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  railDivider: {
    width: 1,
    height: 22,
    backgroundColor: "rgba(232,197,71,0.08)",
  },
  railDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.sage,
  },

  // Logout
  logoutBtn: {
    position: "absolute",
    bottom: 8,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
  prizeModalTitle: {
    fontFamily: font.heading,
    color: "rgba(255,215,0,0.6)",
    fontSize: 12,
    letterSpacing: 4,
  },
  prizeModalAmount: {
    color: color.goldBright,
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
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  prizeModalStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    backgroundColor: color.gold,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: color.goldDeep,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  prizeModalBtnText: {
    fontFamily: font.heading,
    color: color.ink,
    fontSize: 14,
    letterSpacing: 2,
  },
})

export default HomeScreen
