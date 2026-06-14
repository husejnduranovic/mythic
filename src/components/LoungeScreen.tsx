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
import {
  getSavedLoungeCode,
  getLoungeInfo,
  getLoungeLeaderboard,
  joinLounge,
  leaveLounge,
  getDaysLeftInWeek,
  Lounge,
  LoungeScore,
} from "../services/LoungeService"
import ReturnToCastle from "./ReturnToCastle"
import { Icon, IconName } from "../ui/Icon"
import { GoldButton } from "../ui/GoldButton"
import { color, font } from "../ui/theme"
import { HonorCard, TIER, withAlpha } from "../ui/honor"

// ─────────────────────────────────────────────────────────────────────────────
// Lounge — venue weekly tournament. Shares the Hall's two-column board chassis
// (left shrine = your standing card, right muster roll), but carries its own
// identity: a dusky-sapphire venue accent on the chrome, and a standing card
// that leads with your RANK ("#3 · OF 12") instead of echoing Glory's
// "YOUR STANDING" hero-title. Reuses src/ui/honor.tsx + GoldButton.
// ─────────────────────────────────────────────────────────────────────────────

// The venue's signature accent — a muted sapphire, deliberately off the
// gold/green spine for freshness (not the old neon #4FC3F7, and not Glory's
// gold). Carried by the header ornament, venue glyph, self-rows, shelf and join
// well; the standing card itself stays rank-metal so place still reads at a glance.
const VENUE = "#5A86C0"
const VENUE_LINE = withAlpha(VENUE, 0.28) // hairline borders / shelf
const VENUE_WASH = withAlpha(VENUE, 0.08) // subtle fills (self-row)
const PLACE = [color.gold, TIER.steel, TIER.bronze]

interface LoungeScreenProps {
  onBack: () => void
  onPlay: () => void
  uid: string
  heroName: string
}

// One muster-roll line — rank, place/tier ring, name, dotted leader, combo, score.
const LoungeRow = ({
  item,
  index,
  isYou,
}: {
  item: LoungeScore
  index: number
  isYou: boolean
}) => {
  const a = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 240,
      delay: Math.min(index, 8) * 36,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [])
  const ring = index < 3 ? PLACE[index] : color.goldFaded
  const ico: IconName = index === 0 ? "crown" : index < 3 ? "medal" : "sword-cross"
  return (
    <Animated.View
      style={[
        lr.row,
        isYou && lr.rowYou,
        {
          opacity: a,
          transform: [
            { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      <Text style={[lr.pos, isYou && { color: VENUE }]}>{index + 1}</Text>
      <View
        style={[
          lr.ring,
          index < 3 && { borderColor: withAlpha(ring, 0.5), backgroundColor: withAlpha(ring, 0.08) },
        ]}
      >
        <Icon name={ico} size={13} color={index < 3 ? ring : color.goldFaded} />
      </View>
      <Text style={[lr.name, isYou && { color: VENUE }]} numberOfLines={1}>
        {item.heroName}
      </Text>
      {isYou && (
        <View style={lr.youChip}>
          <Text style={lr.youChipTxt}>YOU</Text>
        </View>
      )}
      <Text style={lr.dots} numberOfLines={1} ellipsizeMode="clip">
        ································
      </Text>
      <View style={lr.comboPill}>
        <Text style={lr.combo}>x{item.bestCombo || 0}</Text>
      </View>
      <Text style={lr.score} numberOfLines={1} adjustsFontSizeToFit>
        {item.score.toLocaleString()}
      </Text>
    </Animated.View>
  )
}

const LoungeScreen = ({ onBack, uid, heroName, onPlay }: LoungeScreenProps) => {
  const [loungeCode, setLoungeCode] = useState<string | null>(null)
  const [lounge, setLounge] = useState<Lounge | null>(null)
  const [scores, setScores] = useState<LoungeScore[]>([])
  const [joinInput, setJoinInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(15)).current
  const glow = useRef(new Animated.Value(0.3)).current
  const deal = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
    const loop = (v: Animated.Value, lo: number, hi: number, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: hi, duration: d, useNativeDriver: true }),
          Animated.timing(v, { toValue: lo, duration: d, useNativeDriver: true }),
        ]),
      ).start()
    loop(glow, 0.3, 0.5, 2000)
    loop(float, 0, 1, 2200)
    loadLounge()
  }, [])

  useEffect(() => {
    Animated.timing(deal, {
      toValue: 1,
      duration: 420,
      delay: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [lounge])

  const loadLounge = async () => {
    setLoading(true)
    const code = await getSavedLoungeCode()
    if (code) {
      setLoungeCode(code)
      const info = await getLoungeInfo(code)
      setLounge(info)
      const lb = await getLoungeLeaderboard(code)
      setScores(lb)
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (joinInput.length < 3) {
      setError("Enter a valid lounge code")
      return
    }
    setLoading(true)
    setError("")
    const result = await joinLounge(joinInput)
    if (result.success) {
      setLoungeCode(joinInput.toUpperCase())
      setLounge(result.lounge || null)
      const lb = await getLoungeLeaderboard(joinInput.toUpperCase())
      setScores(lb)
    } else {
      setError(result.error || "Failed to join")
    }
    setLoading(false)
  }

  const handleLeave = async () => {
    await leaveLounge()
    setLoungeCode(null)
    setLounge(null)
    setScores([])
  }

  const daysLeft = getDaysLeftInWeek()
  const myScore = scores.find((s) => s.uid === uid)
  const myRank = scores.findIndex((s) => s.uid === uid) + 1

  const padL = Math.max(14, insets.left)
  const padR = Math.max(14, insets.right)

  const Background = () => (
    <View style={z.bg} pointerEvents="none">
      <Animated.View style={[z.bgGlow, { opacity: glow }]} />
      <Text style={[z.bgRune, { top: "8%", left: "4%" }]}>ᚠ</Text>
      <Text style={[z.bgRune, { top: "12%", right: "6%" }]}>ᚦ</Text>
      <Text style={[z.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
      <Text style={[z.bgRune, { bottom: "20%", right: "5%" }]}>ᛟ</Text>
    </View>
  )

  if (loading)
    return (
      <View style={[z.container, z.center, { paddingLeft: padL, paddingRight: padR }]}>
        <Background />
        <ActivityIndicator size="large" color={color.gold} />
        <Text style={z.loadText}>Summoning the tournament…</Text>
      </View>
    )

  // ── Joined — tournament board ──
  if (loungeCode && lounge) {
    const trim = myRank >= 1 && myRank <= 3 ? PLACE[myRank - 1] : myScore ? color.gold : color.steel
    const cardH = Math.round(Math.min(winH - 188, 178))
    const cardW = Math.round(cardH / 1.46)
    const shrineW = Math.round(Math.min(312, Math.max(224, winW * 0.36)))

    return (
      <View style={[z.container, { paddingLeft: padL, paddingRight: padR }]}>
        <Background />
        <Animated.View
          style={[z.inner, { opacity: fade, transform: [{ translateY: slide }] }]}
        >
          {/* Header — venue identity */}
          <View style={z.header}>
            <View style={z.hOrn}>
              <View style={z.hLine} />
              <Text style={z.hDot}>◆</Text>
              <View style={z.hLineS} />
            </View>
            <View style={z.hCenter}>
              <View style={z.hTitleRow}>
                <Icon name="pillar" size={17} color={VENUE} />
                <Text style={z.hTitle} numberOfLines={1}>
                  {lounge.name.toUpperCase()}
                </Text>
              </View>
              <Text style={z.hSub} numberOfLines={1}>
                WEEKLY TOURNAMENT · {scores.length}{" "}
                {scores.length === 1 ? "WARRIOR" : "WARRIORS"} ·{" "}
                {daysLeft === 0 ? "FINAL DAY" : `${daysLeft} DAYS LEFT`}
              </Text>
            </View>
            <View style={z.hOrn}>
              <View style={z.hLineS} />
              <Text style={z.hDot}>◆</Text>
              <View style={z.hLine} />
            </View>
          </View>

          <View style={z.contentRow}>
            {/* Left — your standing */}
            <View style={[z.shrine, { width: shrineW }]}>
              <View style={z.cardZone}>
                <Animated.View
                  style={[
                    z.cardPool,
                    {
                      width: cardW * 1.7,
                      height: cardW * 1.7,
                      borderRadius: cardW * 0.85,
                      backgroundColor: withAlpha(trim, 0.05),
                      opacity: glow,
                    },
                  ]}
                />
                <HonorCard
                  w={cardW}
                  h={cardH}
                  trim={trim}
                  medallion={myRank === 1 ? "crown" : myScore ? "trophy-variant" : "sword-cross"}
                  deal={deal}
                  pulse={glow}
                  float={float}
                >
                  {myScore ? (
                    <>
                      {/* Where do I stand — the rank IS the headline, not a title */}
                      <Text
                        style={[
                          z.rankBig,
                          { color: trim, textShadowColor: withAlpha(trim, 0.45) },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        #{myRank}
                      </Text>
                      <Text style={[z.rankOf, { color: withAlpha(trim, 0.7) }]}>
                        OF {scores.length} {scores.length === 1 ? "WARRIOR" : "WARRIORS"}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <View style={[z.spoilsDiv, { backgroundColor: withAlpha(trim, 0.3) }]} />
                      <Text
                        style={[z.cardScore, { textShadowColor: withAlpha(trim, 0.4) }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {myScore.score.toLocaleString()}
                      </Text>
                      <Text style={[z.cardCombo, { color: withAlpha(trim, 0.6) }]}>
                        x{myScore.bestCombo || 0} BEST COMBO
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[z.cardTitle, { color: trim }]}>UNRANKED</Text>
                      <View style={{ flex: 1 }} />
                      <Text style={z.cardPrompt}>
                        Win a battle this week{"\n"}to join the board
                      </Text>
                      <View style={{ height: 10 }} />
                    </>
                  )}
                </HonorCard>
              </View>
              <View style={z.shelf} />
              <GoldButton
                label="ENTER BATTLE"
                icon="sword-cross"
                onPress={onPlay}
                style={[z.shrineCta, { width: Math.min(shrineW, 240) }]}
              />
            </View>

            {/* Right — the muster roll */}
            <View style={z.roll}>
              <Text style={z.rollTitle}>WARRIORS THIS WEEK</Text>
              {scores.length === 0 ? (
                <View style={z.empty}>
                  <Icon name="sword-cross" size={30} color={color.goldFaded} />
                  <Text style={z.emptyTxt}>No warriors yet</Text>
                  <Text style={z.emptyHint}>Be the first to claim this venue</Text>
                </View>
              ) : (
                <ScrollView
                  style={z.scroll}
                  contentContainerStyle={{ paddingBottom: 4 }}
                  showsVerticalScrollIndicator={false}
                >
                  {scores.map((item, i) => (
                    <LoungeRow
                      key={`ls-${item.uid || i}`}
                      item={item}
                      index={i}
                      isYou={item.uid === uid}
                    />
                  ))}
                </ScrollView>
              )}
              <View style={z.prize}>
                <Icon name="trophy-variant" size={12} color={withAlpha(color.gold, 0.5)} />
                <Text style={z.prizeTxt}>#1 takes the weekly prize</Text>
              </View>
            </View>
          </View>

          <ReturnToCastle onPress={onBack} />
        </Animated.View>

        <TouchableOpacity style={z.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
          <Icon name="logout-variant" size={11} color="#D9604F" />
          <Text style={z.leaveTxt}>Leave</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Not joined — join a venue ──
  return (
    <View style={[z.container, z.center, { paddingLeft: padL, paddingRight: padR }]}>
      <Background />
      <Animated.View
        style={[z.joinWrap, { opacity: fade, transform: [{ translateY: slide }] }]}
      >
        <View style={z.header}>
          <View style={z.hOrn}>
            <View style={z.hLine} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLineS} />
          </View>
          <View style={z.hCenter}>
            <View style={z.hTitleRow}>
              <Icon name="pillar" size={18} color={VENUE} />
              <Text style={z.hTitle}>HOOKAH LOUNGE</Text>
            </View>
            <Text style={z.hSub}>ENTER A VENUE CODE TO JOIN ITS WEEKLY BATTLE</Text>
          </View>
          <View style={z.hOrn}>
            <View style={z.hLineS} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLine} />
          </View>
        </View>

        {error !== "" && (
          <View style={z.errorBox}>
            <Icon name="alert" size={13} color="#D9604F" />
            <Text style={z.errorTxt}>{error}</Text>
          </View>
        )}

        <View style={z.joinCard}>
          <Text style={z.joinLabel}>LOUNGE CODE</Text>
          <TextInput
            style={z.codeInput}
            value={joinInput}
            onChangeText={(t) => setJoinInput(t.toUpperCase())}
            placeholder="ENTER CODE"
            placeholderTextColor={withAlpha(VENUE, 0.35)}
            autoCapitalize="characters"
            maxLength={20}
            selectionColor={VENUE}
          />
          <GoldButton
            label="JOIN TOURNAMENT"
            icon="pillar"
            onPress={handleJoin}
            style={joinInput.length < 3 ? z.joinDisabled : undefined}
          />
        </View>

        <ReturnToCastle onPress={onBack} />
      </Animated.View>
    </View>
  )
}

const lr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  rowYou: {
    backgroundColor: VENUE_WASH,
    borderWidth: 1,
    borderColor: withAlpha(VENUE, 0.3),
    borderRadius: 10,
  },
  pos: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: "900",
    width: 22,
    textAlign: "right",
  },
  ring: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: color.goldLine,
    backgroundColor: color.goldWash,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  dots: {
    flex: 1,
    color: "rgba(232,197,71,0.22)",
    fontSize: 9,
    letterSpacing: 3,
    textAlign: "center",
  },
  youChip: {
    backgroundColor: color.parchment,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  youChipTxt: { color: color.ink, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  comboPill: {
    minWidth: 34,
    alignItems: "center",
    backgroundColor: color.goldWash,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: color.goldLine,
  },
  combo: { color: color.goldFaded, fontSize: 10, fontWeight: "900" },
  score: {
    color: color.gold,
    fontSize: 13,
    fontWeight: "900",
    width: 80,
    textAlign: "right",
    letterSpacing: 0.5,
  },
})

const z = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bgBase, paddingTop: 6 },
  center: { justifyContent: "center", alignItems: "center" },
  loadText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 2,
  },

  // Background
  bg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "10%",
    left: "6%",
    width: "38%",
    height: "55%",
    borderRadius: 250,
    backgroundColor: withAlpha(VENUE, 0.05),
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
  hCenter: { alignItems: "center", maxWidth: "70%" },
  hTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hTitle: {
    color: color.gold,
    fontFamily: font.heading,
    fontSize: 17,
    letterSpacing: 3,
    textShadowColor: withAlpha(VENUE, 0.5),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    flexShrink: 1,
  },
  hSub: {
    color: color.steel,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 1,
  },
  hOrn: { flexDirection: "row", alignItems: "center", flex: 1, gap: 4 },
  hLine: { flex: 1, height: 1, backgroundColor: withAlpha(VENUE, 0.18) },
  hLineS: { width: 10, height: 1, backgroundColor: withAlpha(VENUE, 0.3) },
  hDot: { color: withAlpha(VENUE, 0.55), fontSize: 6 },

  contentRow: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },

  // Left shrine
  shrine: { alignItems: "center", justifyContent: "center" },
  cardZone: { alignItems: "center", justifyContent: "center" },
  cardPool: { position: "absolute" },
  shelf: {
    width: "60%",
    height: 1.5,
    backgroundColor: VENUE_LINE,
    marginTop: 10,
    borderRadius: 1,
  },
  cardTitle: {
    fontFamily: font.display,
    fontSize: 16,
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 6,
  },
  // Rank-forward standing card — the rank is the hero number (where do I stand)
  rankBig: {
    fontFamily: font.display,
    fontSize: 32,
    letterSpacing: 1,
    textAlign: "center",
    includeFontPadding: false,
    marginTop: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  rankOf: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2.5,
    textAlign: "center",
    marginTop: 1,
  },
  spoilsDiv: {
    width: "44%",
    height: 1,
    alignSelf: "center",
    marginBottom: 6,
  },
  cardScore: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 0.5,
    includeFontPadding: false,
    marginHorizontal: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cardCombo: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 10,
  },
  cardPrompt: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },

  // Right muster roll
  roll: { flex: 1, alignSelf: "stretch", justifyContent: "center" },
  rollTitle: {
    color: color.goldFaded,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 6 },
  emptyTxt: { color: color.gold, fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  emptyHint: { color: "rgba(255,255,255,0.25)", fontSize: 11 },
  // Prize line — a quiet caption under the roll, not a boxed pill. Boxed, it read
  // as a second button stacked above the CTA.
  prize: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  prizeTxt: {
    color: color.goldFaded,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Primary CTA lives under the standing card (see shrine) so it reads as "your
  // move", anchored to your card — not a button floating centred under both columns.
  shrineCta: { marginTop: 14, minWidth: 0 },

  // Leave (corner) — de-emphasised destructive chip
  leaveBtn: {
    position: "absolute",
    bottom: 10,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: withAlpha(color.crimson, 0.4),
    backgroundColor: withAlpha(color.crimson, 0.08),
  },
  leaveTxt: { color: "#D9604F", fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  // Join view
  joinWrap: { alignItems: "center", maxWidth: 420 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: withAlpha(color.crimson, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(color.crimson, 0.25),
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  errorTxt: { color: "#D9806F", fontSize: 11, fontWeight: "700" },
  joinCard: {
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(18,32,25,0.85)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(VENUE, 0.25),
    paddingHorizontal: 26,
    paddingVertical: 18,
  },
  joinLabel: {
    color: color.goldFaded,
    fontFamily: font.heading,
    fontSize: 9,
    letterSpacing: 4,
  },
  codeInput: {
    backgroundColor: color.bgSunken,
    borderWidth: 1.5,
    borderColor: withAlpha(VENUE, 0.4),
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 9,
    color: color.gold,
    fontFamily: font.display,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    width: 250,
  },
  joinDisabled: { opacity: 0.4 },
})

export default LoungeScreen
