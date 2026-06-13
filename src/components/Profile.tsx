import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getUserProfile, renameHero } from "../services/ScoreService"
import ReturnToCastle from "./ReturnToCastle"
import { Icon, IconName } from "../ui/Icon"
import { color, font } from "../ui/theme"

// ─────────────────────────────────────────────────────────────────────────────
// Profile — "The Warrior's Crest" (DESIGN_PLAN §4.5, recomposed)
//
// The player IS the card: one large honor card in the icon / Hall-of-Glory
// grammar (deep-green field, tier-metal trim, corner runes, Roman corner
// index, crest medallion with breathing halo, parchment nameplate — which
// doubles as the rename editor) levitating over a shelf, with a forge-style
// rank-ascent ladder beneath. Right column is the battle chronicle: streak
// brazier, open ledger rows with dotted leaders, pinned lifetime spoils.
// Landscape-first two-column; geometry from useWindowDimensions (§5 lesson).
// ─────────────────────────────────────────────────────────────────────────────

// RN hex+alpha string concat breaks on rgba inputs (the §5 blob bug) — alpha
// is always applied explicitly from plain-hex tier colors.
const withAlpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

interface ProfileProps {
  onBack: () => void
  uid: string
  heroName: string
  onNameChange?: (newName: string) => void
}

// Rank tiers (DESIGN_PLAN §4.5.1): five metals, one MCI icon ladder.
const TIER = {
  bronze: "#B07B4F",
  iron: "#9BA3AB",
  steel: "#C9D1D9",
  gold: color.gold,
  mystic: color.mystic,
}

const RANKS: { min: number; name: string; icon: IconName; color: string }[] = [
  { min: 0, name: "RECRUIT", icon: "bow-arrow", color: TIER.bronze },
  { min: 3, name: "FOOTMAN", icon: "sword", color: TIER.bronze },
  { min: 5, name: "APPRENTICE", icon: "script-text", color: TIER.iron },
  { min: 10, name: "PROVEN FIGHTER", icon: "shield-half-full", color: TIER.iron },
  { min: 25, name: "VETERAN WARRIOR", icon: "sword-cross", color: TIER.steel },
  { min: 50, name: "BATTLE MASTER", icon: "axe-battle", color: TIER.steel },
  { min: 75, name: "WARLORD", icon: "fire", color: TIER.gold },
  { min: 100, name: "LEGENDARY CHAMPION", icon: "crown", color: TIER.gold },
  { min: 150, name: "MYTHIC CONQUEROR", icon: "skull", color: TIER.gold },
  { min: 200, name: "IMMORTAL KING", icon: "chess-king", color: TIER.gold },
  { min: 300, name: "DIVINE RULER", icon: "lightning-bolt", color: TIER.mystic },
  { min: 500, name: "TITAN OF WAR", icon: "fire-alert", color: TIER.mystic },
  { min: 750, name: "ETERNAL OVERLORD", icon: "weather-hurricane", color: TIER.mystic },
  { min: 1000, name: "GOD OF THE PEAKS", icon: "star-four-points", color: TIER.mystic },
]

// Rank ordinal as a playing-card corner index, in card-Roman.
const ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII",
  "VIII", "IX", "X", "XI", "XII", "XIII", "XIV",
]

const getRank = (games: number) => {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (games >= r.min) rank = r
  }
  return rank
}

const getNextRank = (games: number) => {
  for (const r of RANKS) {
    if (games < r.min)
      return { name: r.name, icon: r.icon, color: r.color, needed: r.min - games, min: r.min }
  }
  return { name: "MAX RANK", icon: "star-four-points" as IconName, color: color.gold, needed: 0, min: 1000 }
}

// Ember-based streak ramp (DESIGN_PLAN §4.5.2).
const getStreakColor = (streak: number): string => {
  if (streak >= 60) return color.goldBright // #FFD700
  if (streak >= 42) return color.ember // #FF8C00
  if (streak >= 21) return "#E08A3C"
  if (streak >= 7) return "#C87533"
  return color.steel
}

const STREAK_MILESTONES: { days: number; label: string; name: string; icon: IconName }[] = [
  { days: 7, label: "7d", name: "FLAME\nBORN", icon: "fire" },
  { days: 21, label: "21d", name: "EMBER\nFORGED", icon: "fire-alert" },
  { days: 42, label: "42d", name: "INFERNO\nSWORN", icon: "lightning-bolt" },
  { days: 60, label: "60d", name: "ETERNAL\nFLAME", icon: "infinity" },
]

// The icon's card green — the card is the lit centerpiece, not a panel.
const CARD_FIELD = "#1A3D2A"
// Crimson lightened for legibility on the deep-green card field.
const CARD_ERROR = "#E8705F"

// ── Chronicle ledger row (muster-roll grammar: open line, dotted leader) ────

const ChronicleRow = ({
  icon,
  label,
  value,
  index,
}: {
  icon: IconName
  label: string
  value: string
  index: number
}) => {
  const a = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 240,
      delay: 120 + index * 45,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View
      style={[
        s.ledgerRow,
        {
          opacity: a,
          transform: [
            { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      <View style={s.ledgerRing}>
        <Icon name={icon} size={13} color={color.goldFaded} />
      </View>
      <Text style={s.ledgerLabel}>{label}</Text>
      <Text style={s.ledgerDots} numberOfLines={1} ellipsizeMode="clip">
        ································
      </Text>
      <Text style={s.ledgerValue} numberOfLines={1}>
        {value}
      </Text>
    </Animated.View>
  )
}

// ── Screen ──────────────────────────────────────────────────────────────────

const Profile = ({ onBack, uid, heroName, onNameChange }: ProfileProps) => {
  const insets = useSafeAreaInsets()
  const { width: winW, height: winH } = useWindowDimensions()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(heroName)
  const [nameError, setNameError] = useState("")
  const [nameSaving, setNameSaving] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(15)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const streakPulse = useRef(new Animated.Value(0.8)).current
  const deal = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current

  useEffect(() => {
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start()
    // The crest levitates gently — the marquee breathes (Home fan loop).
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  useEffect(() => {
    if (loading) return
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
    // The crest deals onto the shelf once the chronicle is summoned.
    Animated.timing(deal, {
      toValue: 1,
      duration: 380,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [loading])

  useEffect(() => {
    getUserProfile(uid).then((data) => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  const handleNameChange = async () => {
    const trimmed = newName.trim()
    if (trimmed.length < 2) {
      setNameError("Min 2 characters")
      return
    }
    if (trimmed.length > 16) {
      setNameError("Max 16 characters")
      return
    }
    if (trimmed === heroName) {
      setEditingName(false)
      return
    }

    setNameSaving(true)
    setNameError("")

    const res = await renameHero(uid, trimmed)
    setNameSaving(false)
    if (!res.success) {
      setNameError(res.error || "Failed to update")
      return
    }
    setEditingName(false)
    onNameChange?.(trimmed)
  }

  const edgePad = {
    paddingLeft: Math.max(14, insets.left),
    paddingRight: Math.max(14, insets.right),
  }

  if (loading)
    return (
      <View style={[s.container, edgePad, s.center]}>
        <ActivityIndicator size="large" color={color.gold} />
        <Text style={s.loadText}>Summoning warrior profile...</Text>
      </View>
    )

  const data = profile || {}
  const games = data.totalGames || 0
  const rank = getRank(games)
  const nextRank = getNextRank(games)
  const roman = ROMAN[RANKS.indexOf(rank)]
  const currentStreak = data.currentStreak || 0
  const bestStreak = data.bestStreak || 0
  const streakColor = getStreakColor(currentStreak)
  const flameSize =
    currentStreak >= 42 ? 34 : currentStreak >= 21 ? 30 : currentStreak >= 7 ? 26 : 22

  const progressPct =
    nextRank.needed === 0
      ? 100
      : ((games - rank.min) / (nextRank.min - rank.min)) * 100

  // Shrine geometry — fits without scrolling (header ~40 + return ~33 + pads).
  const shrineW = Math.min(320, Math.max(225, winW * 0.36))
  const availH = winH - 118
  const cardH = Math.round(Math.min(availH - 54, 198))
  const cardW = Math.round(cardH / 1.45)
  const medal = Math.round(cardW * 0.42)

  const dealStyle = {
    opacity: deal,
    transform: [
      { translateY: deal.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
      { rotate: deal.interpolate({ inputRange: [0, 1], outputRange: ["-5deg", "0deg"] }) },
      { scale: deal.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  }
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })

  const subLine =
    games === 0
      ? "THE CHRONICLE AWAITS YOUR FIRST BATTLE"
      : games === 1
        ? "FORGED IN 1 BATTLE"
        : `FORGED IN ${games} BATTLES`

  const cancelEdit = () => {
    setEditingName(false)
    setNewName(heroName)
    setNameError("")
  }

  return (
    <View style={[s.container, edgePad]}>
      {/* Background — the hall */}
      <View style={s.bg} pointerEvents="none">
        <Animated.View
          style={[
            s.bgGlow,
            { opacity: glowPulse, backgroundColor: withAlpha(rank.color, 0.04) },
          ]}
        />
        <Text style={[s.bgRune, { top: "7%", left: "4%" }]}>ᚠ</Text>
        <Text style={[s.bgRune, { top: "11%", right: "5%" }]}>ᚦ</Text>
        <Text style={[s.bgRune, { bottom: "18%", left: "6%" }]}>ᚱ</Text>
        <Text style={[s.bgRune, { bottom: "22%", right: "4%" }]}>ᛟ</Text>
      </View>

      <Animated.View
        style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.hOrn}>
            <View style={s.hLine} />
            <Text style={s.hDot}>◆</Text>
            <View style={s.hLineS} />
          </View>
          <View style={s.hCenter}>
            <View style={s.hTitleRow}>
              <Icon name={rank.icon} size={18} color={rank.color} />
              <Text style={s.hTitle}>WARRIOR'S CHRONICLE</Text>
            </View>
            <Text style={s.hSub} numberOfLines={1}>
              {subLine}
            </Text>
          </View>
          <View style={s.hOrn}>
            <View style={s.hLineS} />
            <Text style={s.hDot}>◆</Text>
            <View style={s.hLine} />
          </View>
        </View>

        <View style={s.contentRow}>
          {/* ── Left: the crest shrine ── */}
          <View style={[s.shrine, { width: shrineW }]}>
            <View style={s.cardZone}>
              <Animated.View
                style={[
                  s.cardPool,
                  {
                    width: cardW * 1.6,
                    height: cardW * 1.6,
                    borderRadius: cardW * 0.8,
                    backgroundColor: withAlpha(rank.color, 0.05),
                    opacity: glowPulse,
                  },
                ]}
              />
              <Animated.View style={dealStyle}>
                <Animated.View
                  style={[
                    s.card,
                    {
                      width: cardW,
                      height: cardH,
                      borderColor: rank.color,
                      shadowColor: rank.color,
                      transform: [{ translateY: floatY }],
                    },
                  ]}
                >
                  {/* engraved double frame (card-back grammar) */}
                  <View style={[s.cFrame, { borderColor: withAlpha(rank.color, 0.45) }]} />
                  <View style={[s.cFrameInner, { borderColor: withAlpha(rank.color, 0.22) }]} />
                  <View style={s.cShine} />

                  {/* runes on the free corners (indices own TL/BR) */}
                  <Text style={[s.cRune, { top: 14, right: 15, color: withAlpha(rank.color, 0.3) }]}>
                    ᚦ
                  </Text>
                  <Text style={[s.cRune, { bottom: 14, left: 15, color: withAlpha(rank.color, 0.3) }]}>
                    ᚱ
                  </Text>

                  {/* rank ordinal as Roman corner index (TL + rotated BR) */}
                  <View style={[s.cIndex, { top: 6, left: 8 }]}>
                    <Text style={[s.cIndexNum, { color: rank.color }]}>{roman}</Text>
                    <Text style={[s.cIndexDot, { color: withAlpha(rank.color, 0.7) }]}>◆</Text>
                  </View>
                  <View style={[s.cIndex, s.cIndexBR, { bottom: 6, right: 8 }]}>
                    <Text style={[s.cIndexNum, { color: rank.color }]}>{roman}</Text>
                    <Text style={[s.cIndexDot, { color: withAlpha(rank.color, 0.7) }]}>◆</Text>
                  </View>

                  {/* crest medallion with breathing halo */}
                  <View style={[s.cMedalZone, { marginTop: Math.round(cardH * 0.1) }]}>
                    <Animated.View
                      style={[
                        s.cHalo,
                        {
                          width: medal + 16,
                          height: medal + 16,
                          borderRadius: (medal + 16) / 2,
                          backgroundColor: withAlpha(rank.color, 0.12),
                          opacity: glowPulse,
                        },
                      ]}
                    />
                    <View
                      style={[
                        s.cMedal,
                        {
                          width: medal,
                          height: medal,
                          borderRadius: medal / 2,
                          backgroundColor: withAlpha(rank.color, 0.1),
                          borderColor: withAlpha(rank.color, 0.8),
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.cMedalRing,
                          { borderColor: withAlpha(rank.color, 0.4), borderRadius: medal / 2 },
                        ]}
                      />
                      <Icon
                        name={rank.icon}
                        size={Math.round(medal * 0.5)}
                        color={rank.color}
                      />
                    </View>
                  </View>

                  <Text
                    style={[s.cRankName, { color: rank.color }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {rank.name}
                  </Text>

                  <View style={{ flex: 1 }} />

                  {/* parchment nameplate — tap to rename */}
                  {editingName ? (
                    <View style={s.cPlate}>
                      <TextInput
                        style={s.cPlateInput}
                        value={newName}
                        onChangeText={setNewName}
                        maxLength={16}
                        autoFocus
                        selectionColor={color.goldDeep}
                        placeholderTextColor="rgba(26,26,26,0.35)"
                      />
                      <TouchableOpacity
                        style={s.plateBtn}
                        onPress={handleNameChange}
                        disabled={nameSaving}
                      >
                        <Icon
                          name={nameSaving ? "sync" : "check-bold"}
                          size={12}
                          color={color.forest}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.plateBtn} onPress={cancelEdit}>
                        <Icon name="close-thick" size={12} color={color.crimson} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.cPlate}
                      onPress={() => setEditingName(true)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={s.cPlateName}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {heroName}
                      </Text>
                      <Icon name="pencil" size={11} color="rgba(26,26,26,0.45)" />
                    </TouchableOpacity>
                  )}
                  {nameError !== "" && <Text style={s.cNameError}>{nameError}</Text>}

                  {/* best score + combo — same anatomy as the Hall podium cards */}
                  <Text style={[s.cScoreOver, { color: withAlpha(rank.color, 0.55) }]}>
                    BEST SPOILS
                  </Text>
                  <Text
                    style={[s.cScore, { textShadowColor: withAlpha(rank.color, 0.35) }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {(data.bestScore || 0).toLocaleString()}
                  </Text>
                  <Text style={[s.cCombo, { color: withAlpha(rank.color, 0.6) }]}>
                    x{data.bestCombo || 0} BEST COMBO
                  </Text>
                </Animated.View>
              </Animated.View>
            </View>

            {/* shelf the crest floats over */}
            <View style={s.shelf} />
            <View style={s.shelfGlow} />

            {/* rank-ascent ladder (forge grammar, §4.9.3) */}
            <View style={s.forge}>
              {nextRank.needed > 0 ? (
                <>
                  <View style={s.forgeRow}>
                    <Icon name={nextRank.icon} size={11} color={nextRank.color} />
                    <Text style={s.forgeLabel} numberOfLines={1}>
                      NEXT: {nextRank.name}
                    </Text>
                    <Text style={[s.forgeCount, { color: nextRank.color }]}>
                      {games}/{nextRank.min}
                    </Text>
                  </View>
                  <View style={s.forgeTrack}>
                    <View
                      style={[
                        s.forgeFill,
                        {
                          width: `${Math.min(progressPct, 100)}%`,
                          backgroundColor: nextRank.color,
                        },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={s.forgeRow}>
                    <Icon name="star-four-points" size={11} color={color.goldBright} />
                    <Text style={[s.forgeLabel, { color: color.gold }]} numberOfLines={1}>
                      HIGHEST RANK ACHIEVED
                    </Text>
                  </View>
                  <View style={s.forgeTrack}>
                    <View
                      style={[s.forgeFill, { width: "100%", backgroundColor: color.gold }]}
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── Right: the battle chronicle ── */}
          <View style={s.chronicle}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={s.chronicleScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* streak brazier */}
              <View
                style={[
                  s.brazier,
                  {
                    borderColor: withAlpha(streakColor, 0.3),
                    shadowColor: currentStreak >= 7 ? streakColor : "transparent",
                  },
                ]}
              >
                <View
                  style={[s.brazierGlow, { backgroundColor: withAlpha(streakColor, 0.03) }]}
                />
                <View style={s.brazierMain}>
                  <Animated.View style={{ opacity: streakPulse }}>
                    <Icon
                      name={currentStreak >= 1 ? "fire" : "candle"}
                      size={flameSize}
                      color={streakColor}
                    />
                  </Animated.View>
                  <View style={s.brazierCount}>
                    <Text style={[s.streakCount, { color: streakColor }]}>
                      {currentStreak}
                    </Text>
                    <Text style={s.streakLabel}>DAY STREAK</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <View style={s.streakBest}>
                    <Icon name="trophy-variant" size={12} color={color.goldFaded} />
                    <Text style={s.streakBestCount}>{bestStreak}</Text>
                    <Text style={s.streakBestLabel}>BEST</Text>
                  </View>
                </View>

                {/* milestone track */}
                <View style={s.streakTrack}>
                  {STREAK_MILESTONES.map((m, i) => {
                    const reached = bestStreak >= m.days
                    const active = currentStreak >= m.days
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <View
                            style={[
                              s.trackLine,
                              {
                                backgroundColor: reached
                                  ? withAlpha(streakColor, 0.25)
                                  : "rgba(255,255,255,0.06)",
                              },
                            ]}
                          />
                        )}
                        <View style={s.msWrap}>
                          <View
                            style={[
                              s.msDot,
                              reached && {
                                backgroundColor: withAlpha(streakColor, 0.12),
                                borderColor: streakColor,
                                shadowColor: streakColor,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: active ? 0.6 : 0.2,
                                shadowRadius: active ? 8 : 4,
                              },
                            ]}
                          >
                            <Icon
                              name={m.icon}
                              size={12}
                              color={reached ? streakColor : "rgba(255,255,255,0.25)"}
                            />
                          </View>
                          <Text style={[s.msDays, reached && { color: streakColor }]}>
                            {m.label}
                          </Text>
                          <Text
                            style={[
                              s.msName,
                              reached && { color: withAlpha(streakColor, 0.7) },
                            ]}
                          >
                            {m.name}
                          </Text>
                        </View>
                      </React.Fragment>
                    )
                  })}
                </View>
              </View>

              <View style={s.hintRow}>
                <Icon name="fire" size={9} color={color.ember} />
                <Text style={s.hintTxt}>
                  Streak milestones unlock exclusive Armory items
                </Text>
              </View>

              {/* the ledger */}
              <View style={s.ledger}>
                <ChronicleRow
                  icon="cards"
                  label="Cards Cleared"
                  value={(data.totalCardsCleared || 0).toLocaleString()}
                  index={0}
                />
                <View style={s.ledgerSep} />
                <ChronicleRow
                  icon="sword-cross"
                  label="Battles Fought"
                  value={String(games)}
                  index={1}
                />
                <View style={s.ledgerSep} />
                <ChronicleRow
                  icon="script-text-outline"
                  label="Daily Quests"
                  value={String(data.dailyQuestsPlayed || 0)}
                  index={2}
                />
                <View style={s.ledgerSep} />
                <ChronicleRow
                  icon="trophy-variant"
                  label="Avg Score"
                  value={
                    games > 0
                      ? Math.round((data.totalScore || 0) / games).toLocaleString()
                      : "0"
                  }
                  index={3}
                />
              </View>
            </ScrollView>

            {/* pinned total — the ledger's bottom line */}
            <View style={s.spoils}>
              <Icon name="sack" size={13} color={color.goldFaded} />
              <Text style={s.spoilsLabel}>LIFETIME SPOILS</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.spoilsValue}>{(data.totalScore || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <ReturnToCastle onPress={onBack} />
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bgBase,
    paddingTop: 6,
  },
  center: { justifyContent: "center", alignItems: "center" },
  loadText: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 12,
    marginTop: 10,
    letterSpacing: 2,
  },

  // Background
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "10%",
    left: "5%",
    width: "38%",
    height: "55%",
    borderRadius: 250,
  },
  bgRune: { position: "absolute", fontSize: 22, color: "rgba(232,197,71,0.05)" },
  inner: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 6,
  },
  hCenter: { alignItems: "center" },
  hTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hTitle: {
    color: color.gold,
    fontFamily: font.heading,
    fontSize: 17,
    letterSpacing: 3,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  hSub: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 1,
  },
  hOrn: { flexDirection: "row", alignItems: "center", flex: 1, gap: 4 },
  hLine: { flex: 1, height: 1, backgroundColor: "rgba(232,197,71,0.15)" },
  hLineS: { width: 10, height: 1, backgroundColor: "rgba(232,197,71,0.25)" },
  hDot: { color: "rgba(232,197,71,0.4)", fontSize: 6 },

  // Two-column content
  contentRow: { flex: 1, flexDirection: "row", gap: 12 },

  // Shrine (left)
  shrine: { alignItems: "center", justifyContent: "center" },
  cardZone: { alignItems: "center", justifyContent: "center" },
  cardPool: { position: "absolute" },
  card: {
    backgroundColor: CARD_FIELD,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "stretch",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cFrame: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  cFrameInner: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 5,
    borderWidth: 0.5,
  },
  cShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cRune: { position: "absolute", fontSize: 8 },
  cIndex: { position: "absolute", alignItems: "center", zIndex: 4 },
  cIndexBR: { transform: [{ rotate: "180deg" }] },
  cIndexNum: { fontFamily: font.heading, fontSize: 13, lineHeight: 16 },
  cIndexDot: { fontSize: 6, marginTop: -2 },
  cMedalZone: { alignItems: "center", justifyContent: "center" },
  cHalo: { position: "absolute" },
  cMedal: {
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  cMedalRing: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 0.5,
  },
  cRankName: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 6,
    marginHorizontal: 12,
  },
  cPlate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: color.parchment,
    borderRadius: 4,
    marginHorizontal: 9,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  cPlateName: {
    color: color.ink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    flexShrink: 1,
  },
  cPlateInput: {
    flex: 1,
    color: color.ink,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  plateBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(26,26,26,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  cNameError: {
    color: CARD_ERROR,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 2,
  },
  cScoreOver: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 5,
  },
  cScore: {
    color: color.gold,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cCombo: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 8,
  },
  shelf: {
    width: "62%",
    height: 1.5,
    backgroundColor: color.goldLine,
    marginTop: 10,
    borderRadius: 1,
  },
  shelfGlow: {
    width: "50%",
    height: 7,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 4,
    marginTop: -1,
  },

  // Rank-ascent ladder (forge grammar)
  forge: { width: "78%", marginTop: 8, gap: 4 },
  forgeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  forgeLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  forgeCount: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  forgeTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  forgeFill: { height: "100%", borderRadius: 2 },

  // Chronicle (right)
  chronicle: { flex: 1 },
  chronicleScroll: { paddingBottom: 4 },

  // Streak brazier
  brazier: {
    backgroundColor: "rgba(20,8,0,0.6)",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  brazierGlow: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  brazierMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  brazierCount: { alignItems: "center" },
  streakCount: { fontSize: 24, lineHeight: 27, fontWeight: "900" },
  streakLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },
  streakBest: { alignItems: "center", gap: 1 },
  streakBestCount: { color: color.goldFaded, fontSize: 14, fontWeight: "900" },
  streakBestLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },
  streakTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  trackLine: { flex: 1, height: 1.5, marginTop: 11, alignSelf: "flex-start" },
  msWrap: { alignItems: "center", gap: 3 },
  msDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  msDays: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  msName: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 9,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 5,
    marginBottom: 6,
  },
  hintTxt: {
    color: "rgba(150,150,180,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Ledger — open lines, dotted leaders (muster-roll grammar)
  ledger: { paddingHorizontal: 2 },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 8,
  },
  ledgerRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.goldLine,
    backgroundColor: color.goldWash,
    justifyContent: "center",
    alignItems: "center",
  },
  ledgerLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  ledgerDots: {
    flex: 1,
    color: "rgba(232,197,71,0.22)",
    fontSize: 9,
    letterSpacing: 3,
    textAlign: "center",
  },
  ledgerValue: {
    color: color.gold,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  ledgerSep: { height: 1, backgroundColor: "rgba(232,197,71,0.05)" },

  // Pinned lifetime spoils
  spoils: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.goldWash,
    borderWidth: 1,
    borderColor: color.goldLine,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 6,
    gap: 8,
  },
  spoilsLabel: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3,
  },
  spoilsValue: {
    color: color.gold,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
})

export default Profile
