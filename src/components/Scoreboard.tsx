import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { DailyScore, getDailyLeaderboard } from "../services/DailyQuestService"
import { getAllTimeLeaderboard } from "../services/ScoreService"
import { SoundService } from "../services/SoundService"
import ReturnToCastle from "./ReturnToCastle"
import { Icon, IconName } from "../ui/Icon"
import { color, font } from "../ui/theme"

// ─────────────────────────────────────────────────────────────────────────────
// Hall of Glory — "Champions' Cards" (DESIGN_PLAN §4.6)
//
// The podium recreates the app icon: the top-3 players are rendered as a fanned
// trio of honor-cards in the icon's deep green, built from the in-game card-back
// grammar (corner indices, runes, central crest medallion, double gold frame).
// Landscape-first composition: left "shrine" column (the trio), right "muster
// roll" column (tabs, open ledger rows with leader dots, pinned self-standing).
// ─────────────────────────────────────────────────────────────────────────────

interface ScoreboardProps {
  onBack: () => void
  uid?: string
}

// RN hex+alpha string concat breaks on rgba inputs (Profile blob bug, §5) —
// alpha is always applied explicitly from plain-hex tier colors.
const withAlpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// Rank avatars share Profile's five-metal tier ladder (§4.5.1): one MCI icon
// ladder, on-palette tier colour per games-played bracket.
const TIER = {
  bronze: "#B07B4F",
  iron: "#9BA3AB",
  steel: "#C9D1D9",
  gold: color.gold,
  mystic: color.mystic,
}

const RANK_VISUALS: { min: number; icon: IconName; color: string }[] = [
  { min: 0, icon: "bow-arrow", color: TIER.bronze },
  { min: 3, icon: "sword", color: TIER.bronze },
  { min: 5, icon: "script-text", color: TIER.iron },
  { min: 10, icon: "shield-half-full", color: TIER.iron },
  { min: 25, icon: "sword-cross", color: TIER.steel },
  { min: 50, icon: "axe-battle", color: TIER.steel },
  { min: 75, icon: "fire", color: TIER.gold },
  { min: 100, icon: "crown", color: TIER.gold },
  { min: 150, icon: "skull", color: TIER.gold },
  { min: 200, icon: "chess-king", color: TIER.gold },
  { min: 300, icon: "lightning-bolt", color: TIER.mystic },
  { min: 500, icon: "fire-alert", color: TIER.mystic },
  { min: 750, icon: "weather-hurricane", color: TIER.mystic },
  { min: 1000, icon: "star-four-points", color: TIER.mystic },
]

const getRankVisual = (games: number) => {
  let v = RANK_VISUALS[0]
  for (const r of RANK_VISUALS) if (games >= r.min) v = r
  return v
}

// Honor-card trim per podium place: gold / steel / bronze metals.
const PLACE = [
  { trim: color.gold, score: color.gold },
  { trim: TIER.steel, score: TIER.steel },
  { trim: TIER.bronze, score: "#E8A860" },
]

// The icon's card green — deliberately richer than bgRaised so the trio reads
// as the lit centerpiece of the hall (the cards are the art).
const CARD_FIELD = "#1A3D2A"
const CARD_RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]

// ── Honor card (one podium plaque) ──────────────────────────────────────────

interface HonorCardProps {
  item: DailyScore
  place: 1 | 2 | 3
  w: number
  h: number
  isYou: boolean
  deal: Animated.Value
  pulse: Animated.Value
}

const HonorCard = ({ item, place, w, h, isYou, deal, pulse }: HonorCardProps) => {
  const p = PLACE[place - 1]
  const rv = getRankVisual(item.gamesPlayed || 0)
  const isFirst = place === 1
  const baseRot = place === 1 ? 0 : place === 2 ? -7 : 7
  const medal = Math.round(w * 0.42)

  const dealStyle = {
    opacity: deal,
    transform: [
      {
        translateY: deal.interpolate({
          inputRange: [0, 1],
          outputRange: [26, 0],
        }),
      },
      {
        rotate: deal.interpolate({
          inputRange: [0, 1],
          outputRange: [`${baseRot * 2}deg`, `${baseRot}deg`],
        }),
      },
      {
        scale: deal.interpolate({
          inputRange: [0, 1],
          outputRange: [isFirst ? 0.94 : 1, 1],
        }),
      },
    ],
  }

  return (
    <Animated.View
      style={[
        c.card,
        {
          width: w,
          height: h,
          borderColor: isFirst ? p.trim : withAlpha(p.trim, 0.7),
          borderWidth: isFirst ? 2 : 1.5,
          zIndex: isFirst ? 3 : 1,
          elevation: isFirst ? 10 : 5,
          shadowColor: isFirst ? color.gold : "#000",
        },
        dealStyle,
      ]}
    >
      {/* engraved double frame (card-back grammar) */}
      <View style={[c.frame, { borderColor: withAlpha(p.trim, 0.45) }]} />
      <View style={[c.frameInner, { borderColor: withAlpha(p.trim, 0.22) }]} />
      {isFirst && <View style={c.shine} />}

      {/* corner runes */}
      <Text style={[c.rune, { top: 14, left: 15, color: withAlpha(p.trim, 0.3) }]}>
        {CARD_RUNES[0]}
      </Text>
      <Text style={[c.rune, { top: 14, right: 15, color: withAlpha(p.trim, 0.3) }]}>
        {CARD_RUNES[1]}
      </Text>
      <Text style={[c.rune, { bottom: 14, left: 15, color: withAlpha(p.trim, 0.3) }]}>
        {CARD_RUNES[2]}
      </Text>
      <Text style={[c.rune, { bottom: 14, right: 15, color: withAlpha(p.trim, 0.3) }]}>
        {CARD_RUNES[3]}
      </Text>

      {/* rank as playing-card corner index (TL + rotated BR) */}
      <View style={[c.index, { top: 5, left: 8 }]}>
        <Text style={[c.indexNum, { color: p.trim, fontSize: isFirst ? 17 : 14 }]}>
          {place}
        </Text>
        <Text style={[c.indexDot, { color: withAlpha(p.trim, 0.7) }]}>◆</Text>
      </View>
      <View style={[c.index, c.indexBR, { bottom: 5, right: 8 }]}>
        <Text style={[c.indexNum, { color: p.trim, fontSize: isFirst ? 17 : 14 }]}>
          {place}
        </Text>
        <Text style={[c.indexDot, { color: withAlpha(p.trim, 0.7) }]}>◆</Text>
      </View>

      {/* crest medallion with breathing halo */}
      <View style={[c.medalZone, { marginTop: h * 0.13 }]}>
        <Animated.View
          style={[
            c.medalHalo,
            {
              width: medal + 16,
              height: medal + 16,
              borderRadius: (medal + 16) / 2,
              backgroundColor: withAlpha(p.trim, 0.12),
              opacity: pulse,
            },
          ]}
        />
        <View
          style={[
            c.medal,
            {
              width: medal,
              height: medal,
              borderRadius: medal / 2,
              backgroundColor: withAlpha(p.trim, 0.1),
              borderColor: withAlpha(p.trim, 0.8),
            },
          ]}
        >
          <View
            style={[c.medalRing, { borderColor: withAlpha(p.trim, 0.4), borderRadius: medal / 2 }]}
          />
          <Icon name={rv.icon} size={Math.round(medal * 0.5)} color={p.trim} />
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* parchment nameplate — the one light surface, like the icon's title */}
      <View style={c.namePlate}>
        <Text
          style={[c.nameTxt, { fontSize: isFirst ? 11 : 10 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {item.heroName || "Unknown"}
        </Text>
      </View>

      <Text
        style={[
          c.score,
          {
            color: p.score,
            fontSize: isFirst ? 17 : 13,
            textShadowColor: withAlpha(p.trim, 0.35),
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item.score.toLocaleString()}
      </Text>
      <Text style={[c.combo, { color: withAlpha(p.trim, 0.6) }]}>
        x{item.bestCombo || 0}
      </Text>

      {isYou && (
        <View style={c.youBadge}>
          <Text style={c.youBadgeTxt}>YOU</Text>
        </View>
      )}
    </Animated.View>
  )
}

// Empty podium slot — a face-down outline awaiting a champion.
const GhostCard = ({ w, h }: { w: number; h: number }) => (
  <View style={[c.ghost, { width: w, height: h }]}>
    <Icon name="help" size={20} color={withAlpha("#8FA3B0", 0.5)} />
  </View>
)

const c = StyleSheet.create({
  card: {
    backgroundColor: CARD_FIELD,
    borderRadius: 12,
    alignItems: "stretch",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  frame: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  frameInner: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 5,
    borderWidth: 0.5,
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  rune: { position: "absolute", fontSize: 8 },
  index: { position: "absolute", alignItems: "center", zIndex: 4 },
  indexBR: { transform: [{ rotate: "180deg" }] },
  indexNum: { fontFamily: font.heading, lineHeight: 18 },
  indexDot: { fontSize: 6, marginTop: -3 },
  medalZone: { alignItems: "center", justifyContent: "center" },
  medalHalo: { position: "absolute" },
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
  namePlate: {
    backgroundColor: color.parchment,
    borderRadius: 4,
    marginHorizontal: 8,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  nameTxt: {
    color: color.ink,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  score: {
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  combo: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 8,
  },
  youBadge: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: color.parchment,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: color.bgBase,
    zIndex: 6,
    elevation: 11,
  },
  youBadgeTxt: { color: color.ink, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  ghost: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: color.goldLine,
    justifyContent: "center",
    alignItems: "center",
  },
})

// ── Ledger row (ranks 4+) ───────────────────────────────────────────────────

const LedgerRow = ({
  item,
  index,
  isYou,
}: {
  item: DailyScore
  index: number
  isYou: boolean
}) => {
  const a = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 240,
      delay: Math.min(index - 3, 8) * 36,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [])

  const rv = getRankVisual(item.gamesPlayed || 0)

  return (
    <Animated.View
      style={[
        z.row,
        isYou && z.rowYou,
        {
          opacity: a,
          transform: [
            { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      <Text style={[z.rowPos, isYou && { color: color.gold }]}>{index + 1}</Text>

      <View
        style={[
          z.rowRing,
          {
            borderColor: withAlpha(rv.color, 0.45),
            backgroundColor: withAlpha(rv.color, 0.08),
          },
        ]}
      >
        <Icon name={rv.icon} size={13} color={rv.color} />
      </View>

      <Text style={[z.rowName, isYou && { color: color.gold }]} numberOfLines={1}>
        {item.heroName || "Unknown"}
      </Text>
      {isYou && (
        <View style={z.youChip}>
          <Text style={z.youChipTxt}>YOU</Text>
        </View>
      )}

      {/* ledger leader dots */}
      <Text style={z.rowDots} numberOfLines={1} ellipsizeMode="clip">
        ································
      </Text>

      <View style={z.rowComboBadge}>
        <Text style={z.rowCombo}>x{item.bestCombo || 0}</Text>
      </View>

      <Text style={z.rowScore} numberOfLines={1} adjustsFontSizeToFit>
        {item.score.toLocaleString()}
      </Text>
    </Animated.View>
  )
}

// ── Screen ──────────────────────────────────────────────────────────────────

const Scoreboard = ({ onBack, uid }: ScoreboardProps) => {
  const [tab, setTab] = useState<"daily" | "alltime">("daily")
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([])
  const [allTimeScores, setAllTimeScores] = useState<DailyScore[]>([])
  const [loadingDaily, setLoadingDaily] = useState(true)
  const [loadingAllTime, setLoadingAllTime] = useState(true)
  const scrollRef = useRef<ScrollView>(null)

  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(15)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const crownPulse = useRef(new Animated.Value(0.7)).current
  // One deal value per podium place; staggered like dealing a hand.
  const deals = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current

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
        Animated.timing(crownPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(crownPulse, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  // Refetch the active tab's leaderboard whenever it becomes active (mount +
  // every switch), not just once on mount. The daily score is written
  // fire-and-forget at game over, so a one-shot mount fetch could freeze a
  // snapshot taken before that write landed — and since nothing re-queried, a
  // freshly submitted score never showed up on returning to the Daily tab.
  // The cancel guard drops stale resolutions from rapid toggles; loading is
  // only ever set false (never back to true), so a return renders the cached
  // rows immediately and refreshes them in place — no spinner flash.
  useEffect(() => {
    let cancelled = false
    const fetchScores = tab === "daily" ? getDailyLeaderboard : getAllTimeLeaderboard
    const setScores = tab === "daily" ? setDailyScores : setAllTimeScores
    const setLoading = tab === "daily" ? setLoadingDaily : setLoadingAllTime
    fetchScores()
      .then((s) => {
        if (cancelled) return
        // A transient empty/failed read must not blank out rows we already
        // show (e.g. on a tab-switch refresh) — keep the last good list.
        setScores((prev) => (s.length === 0 && prev.length > 0 ? prev : s))
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab])

  const scores = tab === "daily" ? dailyScores : allTimeScores
  const isLoading = tab === "daily" ? loadingDaily : loadingAllTime
  const showContent = !isLoading && scores.length > 0

  // Deal the trio in whenever fresh content shows (mount, tab switch, or a
  // background refresh that changes the roster): sides first, champion lands
  // last. stopAnimation() before setValue() is essential — these values are
  // native-driven, and re-issuing setValue() on a value that has already run a
  // native animation can fail to propagate, which left the champion card
  // stranded at opacity 0 (invisible) when returning to a tab. Stopping first
  // clears the native animation so the reset + re-deal reliably reaches 1. The
  // cleanup cancels an in-flight deal so overlapping staggers can't fight.
  useEffect(() => {
    if (!showContent) return
    const t = (i: number, dur = 300) =>
      Animated.timing(deals[i], {
        toValue: 1,
        duration: dur,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    deals.forEach((d) => {
      d.stopAnimation()
      d.setValue(0)
    })
    const anim = Animated.stagger(90, [t(1), t(2), t(0, 340)])
    anim.start()
    return () => anim.stop()
  }, [showContent, tab, scores.length])

  const myIndex = uid ? scores.findIndex((s) => s.uid === uid) : -1

  // ── Shrine geometry (landscape-first, fits without scrolling) ──
  const shrineW = Math.min(330, Math.max(250, winW * 0.4))
  const availH = winH - 118
  const centerH = Math.round(Math.min(((shrineW - 16) / 2.4) * 1.45, availH - 30, 196))
  const centerW = Math.round(centerH / 1.45)
  const sideH = Math.round(centerH * 0.86)
  const sideW = Math.round(centerW * 0.86)
  const overlap = Math.round(centerW * 0.14)

  const top = scores.slice(0, 3)
  const crownOpacity = Animated.multiply(crownPulse, deals[0])

  const switchTab = (next: "daily" | "alltime") => {
    if (tab === next) return
    SoundService.playDeckDraw()
    // Reset before the re-render so the new tab's cards never flash at full
    // opacity for a frame before the deal effect kicks in. stopAnimation()
    // first so a still-running native deal can't strand the value (see effect).
    deals.forEach((d) => {
      d.stopAnimation()
      d.setValue(0)
    })
    scrollRef.current?.scrollTo({ y: 0, animated: false })
    setTab(next)
  }

  const countLine = !showContent
    ? " "
    : tab === "daily"
      ? `${scores.length} WARRIORS ANSWERED TODAY'S CALL`
      : `${scores.length} LEGENDS ETCHED IN THE HALL`

  const renderTab = (key: "daily" | "alltime", icon: IconName, label: string) => {
    const on = tab === key
    return (
      <TouchableOpacity
        style={[z.tab, on && z.tabOn]}
        onPress={() => switchTab(key)}
        activeOpacity={0.85}
      >
        <Icon name={icon} size={13} color={on ? color.ink : color.goldFaded} />
        <Text style={[z.tabTxt, on && z.tabTxtOn]}>{label}</Text>
      </TouchableOpacity>
    )
  }

  const myScore = myIndex >= 3 ? scores[myIndex] : null

  return (
    <View
      style={[
        z.container,
        {
          paddingLeft: Math.max(12, insets.left),
          paddingRight: Math.max(12, insets.right),
        },
      ]}
    >
      {/* Background — the hall */}
      <View style={z.bg} pointerEvents="none">
        <Animated.View style={[z.bgGlow, { opacity: glowPulse }]} />
        <Text style={[z.bgRune, { top: "6%", left: "4%" }]}>ᚠ</Text>
        <Text style={[z.bgRune, { top: "10%", right: "5%" }]}>ᚦ</Text>
        <Text style={[z.bgRune, { bottom: "18%", left: "6%" }]}>ᚱ</Text>
        <Text style={[z.bgRune, { bottom: "22%", right: "4%" }]}>ᛟ</Text>
      </View>

      <Animated.View
        style={[
          z.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={z.header}>
          <View style={z.hOrn}>
            <View style={z.hLine} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLineS} />
          </View>
          <View style={z.hCenter}>
            <View style={z.hTitleRow}>
              <Icon name="trophy-variant" size={19} color={color.goldBright} />
              <Text style={z.hTitle}>HALL OF GLORY</Text>
            </View>
            <Text style={z.hSub} numberOfLines={1}>
              {countLine}
            </Text>
          </View>
          <View style={z.hOrn}>
            <View style={z.hLineS} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLine} />
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={z.empty}>
            <ActivityIndicator size="large" color={color.gold} />
            <Text style={z.loadText}>Summoning warriors...</Text>
          </View>
        ) : scores.length === 0 ? (
          <View style={z.empty}>
            <Icon
              name={tab === "daily" ? "script-text-outline" : "sword-cross"}
              size={36}
              color={color.goldFaded}
            />
            <Text style={z.emptyTxt}>
              {tab === "daily" ? "No warriors today" : "No battles recorded"}
            </Text>
            <Text style={z.emptyHint}>
              {tab === "daily"
                ? "Be the first to complete today's quest!"
                : "Complete battles to claim your glory"}
            </Text>
            <View style={z.emptyTabs}>
              {renderTab("daily", "script-text-outline", "Daily Quest")}
              {renderTab("alltime", "sword-cross", "All Time")}
            </View>
          </View>
        ) : (
          <View style={z.contentRow}>
            {/* ── Left: the shrine ── */}
            <View style={[z.shrine, { width: shrineW }]}>
              <View style={z.trioWrap}>
                <Animated.View style={[z.crown, { opacity: crownOpacity }]}>
                  <Icon name="crown" size={20} color={color.goldBright} />
                </Animated.View>
                <View style={z.trio}>
                  {top[1] ? (
                    <HonorCard
                      item={top[1]}
                      place={2}
                      w={sideW}
                      h={sideH}
                      isYou={top[1].uid === uid}
                      deal={deals[1]}
                      pulse={glowPulse}
                    />
                  ) : (
                    <GhostCard w={sideW} h={sideH} />
                  )}
                  <View style={{ marginHorizontal: -overlap, zIndex: 3 }}>
                    <HonorCard
                      item={top[0]}
                      place={1}
                      w={centerW}
                      h={centerH}
                      isYou={top[0].uid === uid}
                      deal={deals[0]}
                      pulse={glowPulse}
                    />
                  </View>
                  {top[2] ? (
                    <HonorCard
                      item={top[2]}
                      place={3}
                      w={sideW}
                      h={sideH}
                      isYou={top[2].uid === uid}
                      deal={deals[2]}
                      pulse={glowPulse}
                    />
                  ) : (
                    <GhostCard w={sideW} h={sideH} />
                  )}
                </View>
                {/* shelf the trio stands on */}
                <View style={z.shelf} />
                <View style={z.shelfGlow} />
              </View>
            </View>

            {/* ── Right: the muster roll ── */}
            <View style={z.roll}>
              <View style={z.tabs}>
                {renderTab("daily", "script-text-outline", "Daily Quest")}
                {renderTab("alltime", "sword-cross", "All Time")}
              </View>

              <ScrollView
                ref={scrollRef}
                style={z.scroll}
                contentContainerStyle={z.scrollInner}
                showsVerticalScrollIndicator={false}
              >
                {scores.map((item, i) =>
                  i < 3 ? null : (
                    <LedgerRow
                      key={`${tab}-${item.uid || i}`}
                      item={item}
                      index={i}
                      isYou={item.uid === uid}
                    />
                  ),
                )}
                {scores.length <= 3 && (
                  <View style={z.rollEmpty}>
                    <Text style={z.rollEmptyTxt}>
                      The roll awaits more warriors…
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Pinned standing — always visible when you're off the podium */}
              {myScore && (
                <View style={z.standing}>
                  <Text style={z.standingPos}>#{myIndex + 1}</Text>
                  <View style={z.standingDiv} />
                  <Text style={z.standingName} numberOfLines={1}>
                    {myScore.heroName || "Unknown"}
                  </Text>
                  <View style={z.youChip}>
                    <Text style={z.youChipTxt}>YOU</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={z.standingCombo}>x{myScore.bestCombo || 0}</Text>
                  <Text style={z.standingScore}>
                    {myScore.score.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Back */}
        <ReturnToCastle onPress={onBack} />
      </Animated.View>
    </View>
  )
}

const z = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bgBase,
    paddingTop: 6,
  },

  // Background
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "8%",
    left: "6%",
    width: "38%",
    height: "55%",
    borderRadius: 250,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.05)",
  },
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
  contentRow: { flex: 1, flexDirection: "row", gap: 10 },

  // Shrine (left)
  shrine: { justifyContent: "center", alignItems: "center" },
  trioWrap: { alignItems: "center", paddingTop: 22 },
  crown: { position: "absolute", top: 0, zIndex: 9 },
  trio: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  shelf: {
    width: "72%",
    height: 1.5,
    backgroundColor: color.goldLine,
    marginTop: 10,
    borderRadius: 1,
  },
  shelfGlow: {
    width: "60%",
    height: 7,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 4,
    marginTop: -1,
  },

  // Roll (right)
  roll: { flex: 1 },

  // Tabs — face-down / face-up: active tab flips to parchment
  tabs: {
    flexDirection: "row",
    marginBottom: 6,
    backgroundColor: color.bgSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.goldLine,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  tabOn: { backgroundColor: color.parchment },
  tabTxt: {
    color: color.goldFaded,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tabTxtOn: { color: color.ink },

  // Scroll
  scroll: { flex: 1 },
  scrollInner: { paddingBottom: 4 },

  // Ledger rows — open lines, no boxes
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
  },
  rowYou: {
    backgroundColor: color.goldWash,
    borderWidth: 1,
    borderColor: color.goldLine,
    borderRadius: 10,
  },
  rowPos: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "900",
    width: 22,
    textAlign: "right",
  },
  rowRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rowName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  rowDots: {
    flex: 1,
    color: "rgba(232,197,71,0.22)",
    fontSize: 9,
    letterSpacing: 3,
    textAlign: "center",
  },
  rowComboBadge: {
    minWidth: 34,
    alignItems: "center",
    backgroundColor: color.goldWash,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: color.goldLine,
  },
  rowCombo: {
    color: color.goldFaded,
    fontSize: 10,
    fontWeight: "900",
  },
  rowScore: {
    color: color.gold,
    fontSize: 13,
    fontWeight: "900",
    width: 84,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  rollEmpty: { alignItems: "center", paddingVertical: 18 },
  rollEmptyTxt: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 1,
  },

  // Parchment YOU chip
  youChip: {
    backgroundColor: color.parchment,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  youChipTxt: {
    color: color.ink,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // Pinned standing strip
  standing: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.goldWash,
    borderWidth: 1,
    borderColor: color.goldLine,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 6,
    gap: 8,
  },
  standingPos: { color: color.gold, fontSize: 15, fontWeight: "900" },
  standingDiv: { width: 1, height: 18, backgroundColor: color.goldLine },
  standingName: {
    color: color.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  standingCombo: {
    color: color.goldFaded,
    fontSize: 10,
    fontWeight: "800",
  },
  standingScore: {
    color: color.gold,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Empty / Loading
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyTxt: {
    color: color.gold,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  emptyHint: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyTabs: {
    flexDirection: "row",
    marginTop: 10,
    backgroundColor: color.bgSunken,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.goldLine,
    padding: 3,
    width: 280,
  },
  loadText: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 12,
    marginTop: 6,
    letterSpacing: 2,
  },
})

export default Scoreboard
