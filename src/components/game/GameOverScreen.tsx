// Game-over / results — "The Spoils Card" (DESIGN_PLAN §4.4, recomposed).
//
// The finished run is sealed into an honor card in the exact Hall-of-Glory
// podium grammar (deep-green field, outcome-metal trim, crest medallion with a
// breathing halo, the SPOILS as the hero number) so the result visually rhymes
// with the leaderboard the player is climbing. Right column is the battle
// chronicle: an async rank slot that shimmers until the rank resolves (no layout
// jump), dotted-leader ledger rows, a "one more battle" goal line (§6.5), and the
// actions. Landscape-first; this screen replaces the board, so it carries no
// 28-card cost and motion is free.

import React, { useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ReturnToCastle from "../ReturnToCastle"
import RecordCelebration from "../RecordCelebration"
import PersonalBestBanner from "../PersonalBestBanner"
import { Icon, IconName } from "../../ui/Icon"
import { GoldButton } from "../../ui/GoldButton"
import { color, font } from "../../ui/theme"
import {
  HonorCard,
  LedgerRow,
  LedgerSep,
  TIER,
  withAlpha,
} from "../../ui/honor"
import type { ThemeConfig } from "../Armory"

export const GameOverScreen = ({
  theme,
  background,
  score,
  bestCombo,
  totalCleared,
  totalFieldCards,
  dailyMode,
  arenaMode,
  arenaPlayers,
  uid,
  heroName,
  rank,
  dailyRank,
  isPersonalBest,
  isAllTimeRecord,
  previousBest,
  showCelebration,
  onPlayAgain,
  onConfirmQuit,
  onHome,
  onDismissCelebration,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  score: number
  bestCombo: number
  totalCleared: number
  totalFieldCards: number
  dailyMode: boolean
  arenaMode?: boolean
  arenaPlayers: any[]
  uid?: string | null
  heroName?: string | null
  rank: number | null
  dailyRank: number | null
  isPersonalBest: boolean
  isAllTimeRecord: boolean
  previousBest: number
  showCelebration: boolean
  onPlayAgain: () => void
  onConfirmQuit: () => void
  onHome: () => void
  onDismissCelebration: () => void
}) => {
  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(15)).current
  const deal = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0.3)).current
  const crownPulse = useRef(new Animated.Value(0.7)).current
  const shimmer = useRef(new Animated.Value(0.35)).current

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
    Animated.timing(deal, {
      toValue: 1,
      duration: 420,
      delay: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    const loop = (v: Animated.Value, lo: number, hi: number, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: hi,
            duration: d,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: lo,
            duration: d,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    loop(pulse, 0.3, 0.5, 2000)
    loop(crownPulse, 0.7, 1, 1500)
    loop(shimmer, 0.35, 0.85, 700)
    loop(float, 0, 1, 2200)
  }, [])

  const clearPct =
    totalFieldCards > 0 ? Math.round((totalCleared / totalFieldCards) * 100) : 0
  const isVictory = clearPct >= 80
  const isMidBattle = clearPct >= 50

  const allFinished = arenaMode
    ? arenaPlayers.every((p: any) => p.finished || p.disconnected)
    : true
  const myArenaRank = arenaMode
    ? arenaPlayers.findIndex((p: any) => p.uid === uid) + 1
    : 0

  // Outcome → metal + crest medallion (mirrors the podium place metals).
  const outcome: { title: string; trim: string; medallion: IconName } =
    isAllTimeRecord
      ? {
          title: "ALL-TIME RECORD",
          trim: color.goldBright,
          medallion: "trophy-variant",
        }
      : dailyMode
        ? {
            title: "QUEST COMPLETE",
            trim: color.gold,
            medallion: "script-text",
          }
        : arenaMode
          ? !allFinished
            ? { title: "FINALIZING", trim: TIER.steel, medallion: "timer-sand" }
            : myArenaRank === 1
              ? { title: "VICTORY", trim: color.gold, medallion: "crown" }
              : {
                  title: `RANK #${myArenaRank}`,
                  trim: TIER.steel,
                  medallion: "sword-cross",
                }
          : isVictory
            ? { title: "VICTORY", trim: color.gold, medallion: "crown" }
            : isMidBattle
              ? {
                  title: "BATTLE OVER",
                  trim: TIER.steel,
                  medallion: "sword-cross",
                }
              : {
                  title: "RETREAT",
                  trim: TIER.bronze,
                  medallion: "shield-half-full",
                }

  const crowned = isAllTimeRecord || (!arenaMode && isVictory && !dailyMode)

  // ── Geometry ──
  const padL = Math.max(14, insets.left)
  const padR = Math.max(14, insets.right)
  const shrineW = Math.round(Math.min(326, Math.max(238, winW * 0.4)))
  const cardH = Math.round(Math.min(winH - 150, 208))
  const cardW = Math.round(cardH / 1.46)

  // ── Async rank slot ──
  const rankResolved =
    !arenaMode && (dailyMode ? dailyRank !== null : rank !== null)
  const rankValue = dailyMode ? dailyRank : rank
  const rankLabel = dailyMode ? "IN TODAY'S QUEST" : "AMONG ALL WARRIORS"

  // ── "One more battle" goal (§6.5, lite — uses data already on screen) ──
  const pbDelta = previousBest > 0 ? score - previousBest : 0
  const goalStruck = isPersonalBest && !isAllTimeRecord
  const goalGap =
    !goalStruck && !isAllTimeRecord && previousBest > 0 && score < previousBest
      ? previousBest - score
      : 0

  const cardBody = (
    <>
      <Text
        style={[g.cardTitle, { color: outcome.trim }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {outcome.title}
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={[g.cardOverline, { color: withAlpha(outcome.trim, 0.55) }]}>
        SPOILS
      </Text>
      <Text
        style={[g.cardScore, { textShadowColor: withAlpha(outcome.trim, 0.4) }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {score.toLocaleString()}
      </Text>
      <Text style={[g.cardCombo, { color: withAlpha(outcome.trim, 0.6) }]}>
        x{bestCombo} BEST COMBO
      </Text>
    </>
  )

  return (
    <View style={[g.container, { paddingLeft: padL, paddingRight: padR }]}>
      {background}
      {isPersonalBest && !isAllTimeRecord && (
        <PersonalBestBanner newScore={score} previousBest={previousBest} />
      )}

      <Animated.View
        style={[g.inner, { opacity: fade, transform: [{ translateY: slide }] }]}
      >
        <View style={g.contentRow}>
          {/* ── Left: the spoils card ── */}
          <View style={[g.shrine, { width: shrineW }]}>
            <View style={g.cardZone}>
              <Animated.View
                style={[
                  g.cardPool,
                  {
                    width: cardW * 1.7,
                    height: cardW * 1.7,
                    borderRadius: cardW * 0.85,
                    backgroundColor: withAlpha(outcome.trim, 0.05),
                    opacity: pulse,
                  },
                ]}
              />
              {crowned && (
                <Animated.View style={[g.crown, { opacity: crownPulse }]}>
                  <Icon name="crown" size={22} color={color.goldBright} />
                </Animated.View>
              )}
              <HonorCard
                w={cardW}
                h={cardH}
                trim={outcome.trim}
                medallion={outcome.medallion}
                deal={deal}
                pulse={pulse}
                float={float}
                index={rankResolved && rankValue ? `#${rankValue}` : undefined}
                badge={isAllTimeRecord ? "RECORD" : undefined}
              >
                {cardBody}
              </HonorCard>
            </View>
            <View style={g.shelf} />
            <View style={g.shelfGlow} />
          </View>

          {/* ── Right: the chronicle ── */}
          <View style={g.chronicle}>
            {arenaMode ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={g.boardTitle}>FINAL RANKINGS</Text>
                {arenaPlayers.map((p: any, i: number) => (
                  <View
                    key={p.uid || i}
                    style={[g.arenaRow, p.uid === uid && g.arenaRowYou]}
                  >
                    <Text
                      style={[
                        g.arenaPos,
                        p.uid === uid && { color: color.gold },
                      ]}
                    >
                      {i + 1}
                    </Text>
                    <View
                      style={[
                        g.arenaRing,
                        i === 0 && {
                          borderColor: color.gold,
                          backgroundColor: color.goldWash,
                        },
                      ]}
                    >
                      <Icon
                        name={i === 0 ? "crown" : "sword-cross"}
                        size={12}
                        color={i === 0 ? color.gold : color.goldFaded}
                      />
                    </View>
                    <Text
                      style={[
                        g.arenaName,
                        p.uid === uid && { color: color.gold },
                      ]}
                      numberOfLines={1}
                    >
                      {p.heroName}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Text style={g.arenaCombo}>x{p.bestCombo || 0}</Text>
                    <Text style={g.arenaScore}>
                      {(p.score || 0).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>
                {/* async rank slot — reserved height, shimmer until resolved */}
                <View style={g.rankSlot}>
                  {rankResolved ? (
                    <View style={g.rankResolved}>
                      <Icon
                        name="trophy-variant"
                        size={14}
                        color={color.goldBright}
                      />
                      <Text style={g.rankNum}>#{rankValue}</Text>
                      <Text style={g.rankLabel}>{rankLabel}</Text>
                    </View>
                  ) : (
                    <Animated.Text
                      style={[g.rankShimmer, { opacity: shimmer }]}
                    >
                      — counting ranks —
                    </Animated.Text>
                  )}
                </View>

                {/* ledger */}
                <View style={g.ledger}>
                  <LedgerRow
                    icon="grid"
                    label="Field Cleared"
                    value={`${clearPct}%`}
                    index={0}
                  />
                  <LedgerSep />
                  <LedgerRow
                    icon="sword-cross"
                    label="Beasts Captured"
                    value={totalCleared.toLocaleString()}
                    index={1}
                  />
                  <LedgerSep />
                  <LedgerRow
                    icon="fire"
                    label="Best Combo"
                    value={`x${bestCombo}`}
                    index={2}
                  />
                </View>

                {/* one-more-battle goal */}
                {goalStruck ? (
                  <View style={[g.goal, g.goalStruck]}>
                    <Icon
                      name="star-four-points"
                      size={12}
                      color={color.goldBright}
                    />
                    <Text style={g.goalStruckTxt}>
                      NEW PERSONAL BEST
                      {pbDelta > 0 ? `  ·  +${pbDelta.toLocaleString()}` : ""}
                    </Text>
                  </View>
                ) : goalGap > 0 ? (
                  <View style={g.goal}>
                    <Text style={g.goalTxt}>
                      <Text style={g.goalNum}>{goalGap.toLocaleString()}</Text>{" "}
                      spoils from your personal best
                    </Text>
                    <View style={g.goalTrack}>
                      <View
                        style={[
                          g.goalFill,
                          {
                            width: `${Math.min(100, (score / previousBest) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ) : null}

                {uid ? (
                  <View style={g.savedRow}>
                    <Icon name="check-decagram" size={11} color={color.sage} />
                    <Text style={g.savedTxt}>
                      {dailyMode
                        ? "Submitted to today's quest"
                        : "Sealed in the Hall of Glory"}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            )}

            {/* actions */}
            <View style={g.actions}>
              {arenaMode ? (
                <GoldButton
                  label="RETURN TO CASTLE"
                  icon="castle"
                  onPress={onConfirmQuit}
                />
              ) : (
                <>
                  <GoldButton
                    label={dailyMode ? "RETURN TO CASTLE" : "BATTLE AGAIN"}
                    icon={dailyMode ? "castle" : "sword-cross"}
                    onPress={onPlayAgain}
                  />
                  {!dailyMode && <ReturnToCastle onPress={onHome} />}
                </>
              )}
            </View>
          </View>
        </View>
      </Animated.View>

      {showCelebration && (
        <RecordCelebration
          score={score}
          heroName={heroName || "Unknown"}
          onDismiss={onDismissCelebration}
        />
      )}
    </View>
  )
}

const g = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bgBase, paddingTop: 6 },
  inner: { flex: 1 },
  contentRow: { flex: 1, flexDirection: "row", gap: 14, alignItems: "center" },

  // Left shrine
  shrine: { alignItems: "center", justifyContent: "center" },
  cardZone: { alignItems: "center", justifyContent: "center" },
  cardPool: { position: "absolute" },
  crown: { position: "absolute", top: -14, zIndex: 9 },
  shelf: {
    width: "62%",
    height: 1.5,
    backgroundColor: color.goldLine,
    marginTop: 12,
    borderRadius: 1,
  },
  shelfGlow: {
    width: "50%",
    height: 7,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 4,
    marginTop: -1,
  },

  // Card body
  cardTitle: {
    fontFamily: font.display,
    fontSize: 20,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 6,
    marginHorizontal: 8,
  },
  cardOverline: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 4,
  },
  cardScore: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 0.5,
    includeFontPadding: false,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginHorizontal: 8,
  },
  cardCombo: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 10,
  },

  // Right chronicle
  chronicle: { flex: 1, justifyContent: "center" },

  rankSlot: { height: 26, justifyContent: "center", marginBottom: 2 },
  rankResolved: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  rankNum: {
    fontFamily: font.display,
    color: color.goldBright,
    fontSize: 18,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  rankLabel: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
  rankShimmer: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 11,
    fontStyle: "italic",
    letterSpacing: 2,
    textAlign: "center",
  },

  ledger: { paddingHorizontal: 2, marginVertical: 2 },

  goal: { marginTop: 8, paddingHorizontal: 8, gap: 4 },
  goalStruck: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: withAlpha(color.goldBright, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(color.goldBright, 0.35),
    borderRadius: 8,
    paddingVertical: 6,
  },
  goalStruckTxt: {
    color: color.goldBright,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  goalTxt: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  goalNum: { color: color.gold, fontWeight: "900" },
  goalTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  goalFill: { height: "100%", borderRadius: 2, backgroundColor: color.gold },

  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  savedTxt: {
    color: withAlpha("#7BED9F", 0.7),
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Actions
  actions: { alignItems: "center", gap: 6, marginTop: 8 },

  // Arena rankings
  boardTitle: {
    color: color.goldFaded,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 6,
  },
  arenaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  arenaRowYou: {
    backgroundColor: color.goldWash,
    borderWidth: 1,
    borderColor: color.goldLine,
  },
  arenaPos: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "900",
    width: 20,
    textAlign: "right",
  },
  arenaRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.goldLine,
    backgroundColor: color.goldWash,
    justifyContent: "center",
    alignItems: "center",
  },
  arenaName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  arenaCombo: {
    color: color.goldFaded,
    fontSize: 10,
    fontWeight: "800",
    marginRight: 6,
  },
  arenaScore: {
    color: color.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
})
