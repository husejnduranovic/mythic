import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getUserProfile, renameHero } from "../services/ScoreService"
import ReturnToCastle from "./ReturnToCastle"
import { Icon, IconName } from "../ui/Icon"
import { color, font } from "../ui/theme"

// RN has no radial gradients, so "glows" are low-alpha fills. Earlier code built the
// alpha by string-concatenating onto the color (`rank.color + "18"`), which silently
// produced an invalid string when the color was already rgba(...) — RN then fell back
// to the base rgba at full intent alpha, rendering an ~8× hard-edged blob (DESIGN_PLAN §5).
// Tier colors are now plain hex and alpha is applied here, explicitly and safely.
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

// Rank tiers (DESIGN_PLAN §4.5.1): five metals replace the 14-colour neon rainbow.
// bronze → iron → steel → gold → mystic. Icons are one MCI ladder (no emoji chrome).
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
      return { name: r.name, needed: r.min - games, min: r.min }
  }
  return { name: "MAX RANK", needed: 0, min: 1000 }
}

const getMilestones = (games: number) => {
  const thresholds = [5, 10, 25, 50, 100, 200, 500, 1000]
  const lastReachedIdx = thresholds.findLastIndex((t) => games >= t)
  const start = Math.max(0, lastReachedIdx - 2)
  const end = Math.min(thresholds.length, start + 6)
  return thresholds.slice(start, end).map((t) => ({
    threshold: t,
    label: t.toString(),
    reached: games >= t,
  }))
}

// Ember-based streak ramp (DESIGN_PLAN §4.5.2) — replaces the steel-grey ramp.
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

const Profile = ({ onBack, uid, heroName, onNameChange }: ProfileProps) => {
  const insets = useSafeAreaInsets()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  // Auto-fit: measure the space between the top and Return button (availH) and the
  // content's natural height (contentH), then shrink to fit so the screen never
  // scrolls (DESIGN_PLAN §5 cause 2 — the per-render scale option). transform:scale
  // doesn't affect layout, so contentH stays stable and this never feedback-loops.
  const [availH, setAvailH] = useState(0)
  const [contentH, setContentH] = useState(0)
  const fitScale =
    availH > 0 && contentH > 0 ? Math.min(1, availH / contentH) : 1
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(heroName)
  const [nameError, setNameError] = useState("")
  const [nameSaving, setNameSaving] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const streakPulse = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [loading])

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
  }, [])

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

  // Edge padding for landscape punch-hole / cutout devices (DESIGN_PLAN §5 cause 3).
  const edgePad = {
    paddingLeft: 24 + insets.left,
    paddingRight: 24 + insets.right,
  }

  if (loading)
    return (
      <View style={[styles.container, edgePad, { justifyContent: "center" }]}>
        <View style={styles.bgLayer} pointerEvents="none">
          <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />
        </View>
        <ActivityIndicator size="large" color={color.gold} />
        <Text style={styles.loadingText}>Loading warrior profile...</Text>
      </View>
    )

  const data = profile || {}
  const games = data.totalGames || 0
  const rank = getRank(games)
  const nextRank = getNextRank(games)
  const milestones = getMilestones(games)
  const currentStreak = data.currentStreak || 0
  const bestStreak = data.bestStreak || 0
  const streakColor = getStreakColor(currentStreak)

  const currentRankMin = rank.min
  const nextRankMin = nextRank.min
  const progressPct =
    nextRank.needed === 0
      ? 100
      : ((games - currentRankMin) / (nextRankMin - currentRankMin)) * 100

  return (
    <View style={[styles.container, edgePad]}>
      {/* Background */}
      <View style={styles.bgLayer} pointerEvents="none">
        <Animated.View
          style={[
            styles.bgGlow,
            {
              opacity: glowPulse,
              backgroundColor: withAlpha(rank.color, 0.05),
            },
          ]}
        />
        <Text style={[styles.bgRune, { top: "10%", left: "4%" }]}>ᚠ</Text>
        <Text style={[styles.bgRune, { top: "12%", right: "5%" }]}>ᚦ</Text>
        <Text style={[styles.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
        <Text style={[styles.bgRune, { bottom: "18%", right: "6%" }]}>ᛟ</Text>
        <View style={styles.bgHLine} />
      </View>

      <View
        style={styles.fitWrap}
        onLayout={(e) => setAvailH(e.nativeEvent.layout.height)}
      >
        <Animated.View
          onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: fitScale }],
            },
          ]}
        >
          {/* LEFT SIDE */}
          <View style={styles.leftSection}>
            <View style={styles.headerOrn}>
              <View style={styles.headerLine} />
              <Text style={styles.headerDot}>◆</Text>
              <View style={styles.headerLine} />
            </View>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View
                style={[
                  styles.avatarGlow,
                  { backgroundColor: withAlpha(rank.color, 0.06) },
                ]}
              />
              <View
                style={[styles.avatarRingOuter, { borderColor: rank.color }]}
              >
                <View style={[styles.heroAvatar, { borderColor: rank.color }]}>
                  <Icon name={rank.icon} size={26} color={rank.color} />
                </View>
              </View>
            </View>

            {/* Name */}
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  maxLength={16}
                  autoFocus
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
                <TouchableOpacity
                  style={styles.nameSaveBtn}
                  onPress={handleNameChange}
                  disabled={nameSaving}
                >
                  <Text style={styles.nameSaveBtnText}>
                    {nameSaving ? "..." : "✓"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nameCancelBtn}
                  onPress={() => {
                    setEditingName(false)
                    setNewName(heroName)
                    setNameError("")
                  }}
                >
                  <Text style={styles.nameCancelBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setEditingName(true)}
                style={styles.nameRow}
              >
                <Text style={styles.heroName}>{heroName}</Text>
                <Icon name="pencil" size={13} color={color.goldFaded} />
              </TouchableOpacity>
            )}
            {nameError !== "" && (
              <Text style={styles.nameError}>{nameError}</Text>
            )}

            {/* Rank */}
            <View style={styles.rankBadge}>
              <View
                style={[styles.rankBadgeLine, { backgroundColor: rank.color }]}
              />
              <Text style={[styles.rankName, { color: rank.color }]}>
                {rank.name}
              </Text>
              <View
                style={[styles.rankBadgeLine, { backgroundColor: rank.color }]}
              />
            </View>

            {/* Progress bar */}
            <View style={styles.rankBarOuter}>
              <View style={styles.rankBarTrack}>
                <View
                  style={[
                    styles.rankFill,
                    {
                      width: `${Math.min(progressPct, 100)}%`,
                      backgroundColor: rank.color,
                    },
                  ]}
                />
              </View>
              {nextRank.needed > 0 ? (
                <Text style={styles.rankProgress}>
                  {nextRank.needed} more to{" "}
                  <Text style={{ color: rank.color }}>{nextRank.name}</Text>
                </Text>
              ) : (
                <Text style={[styles.rankProgress, { color: rank.color }]}>
                  Maximum rank achieved
                </Text>
              )}
            </View>

            {/* Milestones */}
            <View style={styles.milestoneRow}>
              {milestones.map((m, i) => (
                <View key={i} style={styles.milestoneItem}>
                  <View
                    style={[
                      styles.milestoneDot,
                      m.reached && {
                        backgroundColor: rank.color,
                        borderColor: rank.color,
                      },
                    ]}
                  >
                    {m.reached && <Text style={styles.milestoneCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      m.reached && { color: rank.color },
                    ]}
                  >
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── STREAK ── */}
            <View style={styles.streakWrap}>
              <View style={styles.streakOrnRow}>
                <View style={styles.streakOrnLine} />
                <Text style={styles.streakOrnDot}>◆</Text>
                <View style={styles.streakOrnLine} />
              </View>

              {/* Main streak display */}
              <View
                style={[
                  styles.streakBox,
                  {
                    borderColor: withAlpha(streakColor, 0.3),
                    shadowColor:
                      currentStreak >= 7 ? streakColor : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.streakGlow,
                    { backgroundColor: withAlpha(streakColor, 0.03) },
                  ]}
                />

                {/* Left — fire icon, bigger at higher streaks */}
                <Animated.View style={{ opacity: streakPulse }}>
                  <Icon
                    name={currentStreak >= 1 ? "fire" : "candle"}
                    size={
                      currentStreak >= 42
                        ? 38
                        : currentStreak >= 21
                          ? 34
                          : currentStreak >= 7
                            ? 30
                            : 26
                    }
                    color={streakColor}
                  />
                </Animated.View>

                {/* Center — big number */}
                <View style={styles.streakCenter}>
                  <Text style={[styles.streakCount, { color: streakColor }]}>
                    {currentStreak}
                  </Text>
                  <Text style={styles.streakLabel}>DAY STREAK</Text>
                </View>

                {/* Right — best streak */}
                <View style={styles.streakBestWrap}>
                  <Icon name="trophy-variant" size={13} color={color.goldFaded} />
                  <Text
                    style={[
                      styles.streakBestCount,
                      { color: color.goldFaded },
                    ]}
                  >
                    {bestStreak}
                  </Text>
                  <Text style={styles.streakBestLabel}>BEST</Text>
                </View>
              </View>

              {/* Milestone track */}
              <View style={styles.streakTrack}>
                {STREAK_MILESTONES.map((m, i) => {
                  const reached = bestStreak >= m.days
                  const active = currentStreak >= m.days
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <View
                          style={[
                            styles.streakTrackLine,
                            {
                              backgroundColor: reached
                                ? withAlpha(streakColor, 0.25)
                                : "rgba(255,255,255,0.06)",
                            },
                          ]}
                        />
                      )}
                      <View style={styles.streakMilestoneWrap}>
                        <View
                          style={[
                            styles.streakMilestoneDot,
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
                            size={14}
                            color={
                              reached ? streakColor : "rgba(255,255,255,0.25)"
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.streakMilestoneDays,
                            reached && { color: streakColor },
                          ]}
                        >
                          {m.label}
                        </Text>
                        <Text
                          style={[
                            styles.streakMilestoneName,
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

              {/* Unlock hint */}
              <View style={styles.streakHintRow}>
                <Icon name="fire" size={10} color={color.ember} />
                <Text style={styles.streakUnlockHint}>
                  Streak milestones unlock exclusive Armory items
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.verticalDivider}>
            <View style={styles.vDividerLine} />
            <Text style={styles.vDividerDot}>◆</Text>
            <View style={styles.vDividerLine} />
          </View>

          {/* RIGHT SIDE */}
          <View style={styles.rightSection}>
            <View style={styles.statsHeader}>
              <View style={styles.headerOrn}>
                <View style={styles.headerLine} />
                <Text style={styles.headerDot}>◆</Text>
                <View style={styles.headerLine} />
              </View>
              <Text style={styles.statsTitle}>BATTLE STATISTICS</Text>
            </View>

            <View style={styles.bigStatRow}>
              <View style={styles.bigStat}>
                <Text style={styles.bigStatValue}>
                  {(data.bestScore || 0).toLocaleString()}
                </Text>
                <Text style={styles.bigStatLabel}>BEST SCORE</Text>
              </View>
              <View style={styles.bigStatDivider} />
              <View style={styles.bigStat}>
                <Text style={styles.bigStatValue}>x{data.bestCombo || 0}</Text>
                <Text style={styles.bigStatLabel}>BEST COMBO</Text>
              </View>
            </View>

            <View style={styles.statsList}>
              <View style={styles.statRow}>
                <View style={styles.statLabelRow}>
                  <Icon name="cards" size={14} color={color.goldFaded} />
                  <Text style={styles.statLabel}>Cards Cleared</Text>
                </View>
                <Text style={styles.statValue}>
                  {(data.totalCardsCleared || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statRow}>
                <View style={styles.statLabelRow}>
                  <Icon name="sword-cross" size={14} color={color.goldFaded} />
                  <Text style={styles.statLabel}>Battles Fought</Text>
                </View>
                <Text style={styles.statValue}>{games}</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statRow}>
                <View style={styles.statLabelRow}>
                  <Icon
                    name="script-text-outline"
                    size={14}
                    color={color.goldFaded}
                  />
                  <Text style={styles.statLabel}>Daily Quests</Text>
                </View>
                <Text style={styles.statValue}>
                  {data.dailyQuestsPlayed || 0}
                </Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statRow}>
                <View style={styles.statLabelRow}>
                  <Icon name="trophy-variant" size={14} color={color.goldFaded} />
                  <Text style={styles.statLabel}>Avg Score</Text>
                </View>
                <Text style={styles.statValue}>
                  {games > 0
                    ? Math.round(
                        (data.totalScore || 0) / games,
                      ).toLocaleString()
                    : "0"}
                </Text>
              </View>
            </View>

            <View style={styles.totalScoreBox}>
              <View style={styles.totalGlow} />
              <Text style={styles.totalScoreLabel}>LIFETIME SPOILS</Text>
              <Text style={styles.totalScoreValue}>
                {(data.totalScore || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <ReturnToCastle onPress={onBack} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bgBase,
    alignItems: "center",
    paddingBottom: 8,
  },
  fitWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  milestoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.goldLine,
    justifyContent: "center",
    alignItems: "center",
  },
  milestoneCheck: { color: color.bgBase, fontSize: 8, fontWeight: "900" },
  milestoneLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    marginTop: 1,
    fontWeight: "700",
  },

  // Streak section — tighter
  streakWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  streakBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(20,8,0,0.6)",
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  streakCount: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "900",
  },
  streakLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 1,
  },
  streakBestCount: {
    fontSize: 14,
    fontWeight: "900",
  },
  streakBestLabel: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Milestone track — smaller dots
  streakMilestoneDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
  },
  streakMilestoneDays: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  streakMilestoneName: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 10,
  },
  streakHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakUnlockHint: {
    color: "rgba(150,150,180,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },

  // content gap tighter
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 680,
  },

  // avatarWrap tighter
  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bgLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "20%",
    left: "25%",
    width: "50%",
    height: "55%",
    borderRadius: 300,
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: color.goldWash,
  },
  bgHLine: {
    position: "absolute",
    top: "55%",
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  loadingText: {
    color: color.goldFaded,
    fontSize: 12,
    marginTop: 14,
    letterSpacing: 2,
  },
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  headerLine: { width: 20, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  headerDot: { color: color.goldFaded, fontSize: 7 },

  // LEFT
  leftSection: { flex: 1, alignItems: "center" },

  avatarGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarRingOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.goldWash,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroName: {
    color: color.gold,
    fontSize: 18,
    fontFamily: font.heading,
    letterSpacing: 1.5,
    textShadowColor: "rgba(232,197,71,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  nameInput: {
    color: color.gold,
    fontSize: 16,
    fontFamily: font.heading,
    borderBottomWidth: 1,
    borderBottomColor: color.gold,
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 100,
    textAlign: "center",
  },
  nameSaveBtn: {
    backgroundColor: "rgba(123,237,159,0.15)",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(123,237,159,0.4)",
  },
  nameSaveBtnText: { color: color.sage, fontSize: 11, fontWeight: "900" },
  nameCancelBtn: {
    backgroundColor: "rgba(192,57,43,0.12)",
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(192,57,43,0.4)",
  },
  nameCancelBtnText: {
    color: color.crimson,
    fontSize: 11,
    fontWeight: "900",
  },
  nameError: {
    color: color.crimson,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  rankBadgeLine: { width: 16, height: 1 },
  rankName: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  rankBarOuter: { width: "85%", marginTop: 4, alignItems: "center" },

  rankBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: color.goldWash,
    borderRadius: 2,
    overflow: "hidden",
  },
  rankFill: { height: "100%", borderRadius: 2 },
  rankProgress: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
    fontWeight: "600",
  },
  milestoneRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  milestoneItem: { alignItems: "center", gap: 3 },

  // DIVIDER
  verticalDivider: { alignItems: "center", justifyContent: "center", gap: 4 },
  vDividerLine: {
    width: 1,
    height: 80,
    backgroundColor: color.goldLine,
  },
  vDividerDot: { color: color.goldFaded, fontSize: 9 },

  // RIGHT
  rightSection: { flex: 1, gap: 5 },
  statsHeader: { alignItems: "center", marginBottom: 2 },
  statsTitle: {
    color: "rgba(232,197,71,0.65)",
    fontSize: 12,
    fontFamily: font.heading,
    letterSpacing: 3,
    marginBottom: 2,
  },
  bigStatRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingVertical: 6,
  },
  bigStat: { alignItems: "center" },
  bigStatValue: {
    color: color.gold,
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bigStatLabel: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 2,
  },
  bigStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: color.goldWash,
  },
  statsList: {
    backgroundColor: "rgba(232,197,71,0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    color: color.gold,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  statSep: { height: 1, backgroundColor: "rgba(232,197,71,0.03)" },
  totalScoreBox: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  totalGlow: {
    position: "absolute",
    top: -20,
    left: "30%",
    width: 80,
    height: 60,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 40,
  },
  totalScoreLabel: {
    color: "rgba(232,197,71,0.55)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 2,
  },
  totalScoreValue: {
    color: color.gold,
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  streakOrnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "80%",
  },
  streakOrnLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  streakOrnDot: { color: color.goldFaded, fontSize: 6 },

  streakGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  streakCenter: { flex: 1, alignItems: "center" },

  streakBestWrap: { alignItems: "center", gap: 1 },

  streakTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  streakTrackLine: {
    flex: 1,
    height: 1.5,
    marginTop: 18,
    alignSelf: "flex-start",
  },
  streakMilestoneWrap: { alignItems: "center", gap: 4 },
})

export default Profile
