// Between-levels — "The March" (DESIGN_PLAN §4.3, recomposed).
//
// The field result is sealed into a compact honor card (running TOTAL SPOILS as
// the hero number), and the campaign is rendered as a row of battle-cards — the
// cleared fields sealed in deep green, the next one pulsing, the rest face-down —
// instead of the old plain pips. Right column previews the next battlefield from
// LEVEL_CONFIG, offers Glory Hunt, and carries the march onward. Replaces the
// board (early return), so deal-in / pulse motion is free.

import React, { useEffect, useRef } from "react"
import {
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
import { LEVEL_CONFIG, TOTAL_LEVELS } from "../../game/config"
import { Icon } from "../../ui/Icon"
import { GoldButton } from "../../ui/GoldButton"
import { color, font } from "../../ui/theme"
import { HonorCard, TIER, withAlpha } from "../../ui/honor"
import type { ThemeConfig } from "../Armory"

// One battlefield in the march: sealed (cleared), next (igniting), or face-down.
const MarchCard = ({
  idx,
  level,
  w,
}: {
  idx: number
  level: number
  w: number
}) => {
  const done = idx <= level
  const isNext = idx === level + 1 && level < TOTAL_LEVELS
  const h = Math.round(w * 1.4)
  // The next field ignites — the march's one beat: it pops alight after the
  // result card has landed.
  const ignite = useRef(new Animated.Value(isNext ? 0 : 1)).current
  useEffect(() => {
    if (isNext) {
      Animated.timing(ignite, {
        toValue: 1,
        duration: 340,
        delay: 420,
        easing: Easing.out(Easing.back(2.6)),
        useNativeDriver: true,
      }).start()
    }
  }, [])
  if (done) {
    return (
      <View style={[mc.card, mc.done, { width: w, height: h }]}>
        <View style={[mc.frame, { borderColor: withAlpha(color.gold, 0.4) }]} />
        <Icon name="check-bold" size={Math.round(w * 0.5)} color={color.gold} />
      </View>
    )
  }
  if (isNext) {
    return (
      <Animated.View
        style={[
          mc.card,
          mc.next,
          {
            width: w,
            height: h,
            opacity: ignite,
            transform: [
              {
                scale: ignite.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[mc.frame, { borderColor: withAlpha(color.gold, 0.5) }]} />
        <Text style={mc.nextNum}>{idx}</Text>
      </Animated.View>
    )
  }
  return (
    <View style={[mc.card, mc.upcoming, { width: w, height: h }]}>
      <View style={[mc.frame, { borderColor: color.goldLine }]} />
      <Text style={mc.upNum}>{idx}</Text>
    </View>
  )
}

const mc = StyleSheet.create({
  card: {
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  frame: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  done: { backgroundColor: "#1A3D2A", borderColor: withAlpha(color.gold, 0.6) },
  next: {
    backgroundColor: "#14241A",
    borderColor: color.gold,
    borderWidth: 1.5,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
  upcoming: { backgroundColor: color.bgRaised, borderColor: color.goldLine },
  nextNum: { color: color.gold, fontFamily: font.heading, fontSize: 16 },
  upNum: { color: "rgba(232,197,71,0.3)", fontFamily: font.heading, fontSize: 15 },
})

export const BetweenLevelsScreen = ({
  theme,
  background,
  cleared,
  remaining,
  level,
  score,
  gloryActive,
  gloryCharges,
  arenaMode,
  arenaPlayers,
  uid,
  arenaCountdown,
  onActivateGlory,
  onNextLevel,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  cleared: boolean
  remaining: number
  level: number
  score: number
  gloryActive: boolean
  gloryCharges: number
  arenaMode?: boolean
  arenaPlayers: any[]
  uid?: string | null
  arenaCountdown: number | null
  onActivateGlory: () => void
  onNextLevel: () => void
}) => {
  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(15)).current
  const deal = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
    Animated.timing(deal, {
      toValue: 1,
      duration: 400,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    const loop = (v: Animated.Value, lo: number, hi: number, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: hi, duration: d, useNativeDriver: true }),
          Animated.timing(v, { toValue: lo, duration: d, useNativeDriver: true }),
        ]),
      ).start()
    loop(pulse, 0.3, 0.5, 1600)
    loop(float, 0, 1, 2200)
  }, [])

  const isFinal = level >= TOTAL_LEVELS
  const trim = cleared ? color.gold : TIER.steel

  // ── Geometry ──
  const padL = Math.max(14, insets.left)
  const padR = Math.max(14, insets.right)
  const shrineW = Math.round(Math.min(300, Math.max(220, winW * 0.36)))
  const cardH = Math.round(Math.min(winH - 156, 196))
  const cardW = Math.round(cardH / 1.46)
  const marchW = Math.round(
    Math.min(34, (winW - shrineW - padL - padR - 60) / TOTAL_LEVELS - 6),
  )

  const nextCfg = LEVEL_CONFIG[level + 1]
  const nextMult = (1 + level * 0.5).toFixed(1)

  const allReady =
    arenaMode &&
    arenaPlayers.length > 0 &&
    arenaPlayers.every((p: any) => (p.currentLevel || 0) >= level)

  const cardBody = (
    <>
      <Text style={[b.cardTitle, { color: trim }]} numberOfLines={1} adjustsFontSizeToFit>
        {cleared ? "FIELD CLEARED" : "RETREAT"}
      </Text>
      {!cleared && (
        <Text style={b.cardRemain}>
          {remaining} beast{remaining !== 1 ? "s" : ""} held the field
        </Text>
      )}
      <View style={{ flex: 1 }} />
      <Text style={[b.cardOverline, { color: withAlpha(trim, 0.55) }]}>
        TOTAL SPOILS
      </Text>
      <Text
        style={[b.cardScore, { textShadowColor: withAlpha(trim, 0.4) }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {score.toLocaleString()}
      </Text>
      <Text style={[b.cardSub, { color: withAlpha(trim, 0.6) }]}>
        FIELD {level} OF {TOTAL_LEVELS}
      </Text>
    </>
  )

  return (
    <View style={[b.container, { paddingLeft: padL, paddingRight: padR }]}>
      {background}

      <Animated.View
        style={[b.inner, { opacity: fade, transform: [{ translateY: slide }] }]}
      >
        <View style={b.contentRow}>
          {/* ── Left: the field result ── */}
          <View style={[b.shrine, { width: shrineW }]}>
            <View style={b.cardZone}>
              <Animated.View
                style={[
                  b.cardPool,
                  {
                    width: cardW * 1.7,
                    height: cardW * 1.7,
                    borderRadius: cardW * 0.85,
                    backgroundColor: withAlpha(trim, 0.05),
                    opacity: pulse,
                  },
                ]}
              />
              <HonorCard
                w={cardW}
                h={cardH}
                trim={trim}
                medallion={cleared ? "check-decagram" : "shield-half-full"}
                deal={deal}
                pulse={pulse}
                float={float}
              >
                {cardBody}
              </HonorCard>
            </View>
            <View style={b.shelf} />

            {/* the campaign march */}
            <View style={b.march}>
              {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
                <MarchCard key={i} idx={i + 1} level={level} w={marchW} />
              ))}
            </View>
          </View>

          {/* ── Right: onward ── */}
          <View style={b.right}>
            {arenaMode ? (
              <>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 4 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={b.boardTitle}>ARENA STANDINGS</Text>
                  {arenaPlayers.map((p: any, i: number) => (
                    <View
                      key={p.uid || i}
                      style={[b.arenaRow, p.uid === uid && b.arenaRowYou]}
                    >
                      <Text style={[b.arenaPos, p.uid === uid && { color: color.gold }]}>
                        {i + 1}
                      </Text>
                      <Text
                        style={[b.arenaName, p.uid === uid && { color: color.gold }]}
                        numberOfLines={1}
                      >
                        {p.heroName}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text style={b.arenaScore}>
                        {(p.currentLevel || 0) >= 1
                          ? (p.score || 0).toLocaleString()
                          : "…"}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                {allReady ? (
                  <View style={b.countdownBox}>
                    <Text style={b.countdownNum}>{arenaCountdown || "GO!"}</Text>
                    <Text style={b.countdownLabel}>NEXT BATTLE IN</Text>
                  </View>
                ) : (
                  <Text style={b.waiting}>
                    Waiting for warriors (
                    {
                      arenaPlayers.filter(
                        (p: any) => (p.currentLevel || 0) >= level || p.disconnected,
                      ).length
                    }
                    /{arenaPlayers.length})
                  </Text>
                )}
              </>
            ) : (
              <View style={{ flex: 1, justifyContent: "center" }}>
                {/* achievement chip */}
                {cleared ? (
                  <View style={[b.chip, b.chipPerfect]}>
                    <Icon name="star-four-points" size={14} color={color.goldBright} />
                    <Text style={b.chipTitle}>PERFECT CLEAR</Text>
                    <Text style={b.chipSub}>+50,000 spoils</Text>
                  </View>
                ) : gloryActive ? (
                  <View style={[b.chip, b.chipGlory]}>
                    <Icon name="lightning-bolt" size={14} color={color.ember} />
                    <Text style={[b.chipTitle, { color: color.ember }]}>
                      GLORY HUNT ACTIVE
                    </Text>
                    <Text style={[b.chipSub, { color: withAlpha(color.ember, 0.7) }]}>
                      2× spoils to run's end
                    </Text>
                  </View>
                ) : null}

                {/* next battlefield preview */}
                {!isFinal && nextCfg && (
                  <View style={b.preview}>
                    <Text style={b.previewLabel}>NEXT BATTLEFIELD</Text>
                    <Text style={b.previewName} numberOfLines={1}>
                      {nextCfg.name.toUpperCase()}
                    </Text>
                    <View style={b.previewStats}>
                      <View style={b.previewStat}>
                        <Text style={b.previewVal}>{nextMult}×</Text>
                        <Text style={b.previewKey}>SPOILS</Text>
                      </View>
                      <View style={b.previewDiv} />
                      <View style={b.previewStat}>
                        <Text style={b.previewVal}>{nextCfg.fieldCards}</Text>
                        <Text style={b.previewKey}>BEASTS</Text>
                      </View>
                      <View style={b.previewDiv} />
                      <View style={b.previewStat}>
                        <Text style={b.previewVal}>{nextCfg.time}s</Text>
                        <Text style={b.previewKey}>TIME</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* glory hunt opt-in */}
                {!isFinal && gloryCharges > 0 && !gloryActive && (
                  <TouchableOpacity
                    style={b.gloryBtn}
                    onPress={onActivateGlory}
                    activeOpacity={0.85}
                  >
                    <Icon name="lightning-bolt" size={18} color={color.ember} />
                    <View>
                      <Text style={b.gloryTxt}>Glory Hunt</Text>
                      <Text style={b.glorySub}>2× spoils · 50% time</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* onward */}
                <GoldButton
                  variant={gloryActive ? "ember" : "primary"}
                  icon={
                    isFinal
                      ? "trophy-variant"
                      : gloryActive
                        ? "lightning-bolt"
                        : "sword-cross"
                  }
                  label={
                    isFinal
                      ? "CLAIM VICTORY"
                      : gloryActive
                        ? "BEGIN GLORY HUNT"
                        : "NEXT BATTLE"
                  }
                  onPress={onNextLevel}
                />
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const b = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bgBase, paddingTop: 6 },
  inner: { flex: 1 },
  contentRow: { flex: 1, flexDirection: "row", gap: 14, alignItems: "center" },

  // Left
  shrine: { alignItems: "center", justifyContent: "center" },
  cardZone: { alignItems: "center", justifyContent: "center" },
  cardPool: { position: "absolute" },
  shelf: {
    width: "62%",
    height: 1.5,
    backgroundColor: color.goldLine,
    marginTop: 10,
    borderRadius: 1,
  },
  march: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    justifyContent: "center",
  },

  cardTitle: {
    fontFamily: font.display,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 6,
    marginHorizontal: 8,
  },
  cardRemain: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 2,
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
  cardSub: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 10,
  },

  // Right
  right: { flex: 1, justifyContent: "center" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  chipPerfect: {
    backgroundColor: withAlpha(color.goldBright, 0.07),
    borderColor: withAlpha(color.goldBright, 0.35),
  },
  chipGlory: {
    backgroundColor: withAlpha(color.ember, 0.07),
    borderColor: withAlpha(color.ember, 0.35),
  },
  chipTitle: {
    color: color.goldBright,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  chipSub: {
    color: withAlpha(color.goldBright, 0.6),
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  preview: {
    backgroundColor: color.goldWash,
    borderWidth: 1,
    borderColor: color.goldLine,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  previewLabel: {
    color: color.goldFaded,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
  },
  previewName: {
    fontFamily: font.heading,
    color: color.gold,
    fontSize: 15,
    letterSpacing: 1.5,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  previewStats: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  previewStat: { alignItems: "center", flex: 1 },
  previewVal: {
    fontFamily: font.heading,
    color: color.gold,
    fontSize: 18,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  previewKey: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 1,
  },
  previewDiv: { width: 1, height: 26, backgroundColor: color.goldLine },

  gloryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: withAlpha(color.ember, 0.1),
    borderWidth: 1.5,
    borderColor: withAlpha(color.ember, 0.4),
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginBottom: 10,
  },
  gloryTxt: {
    fontFamily: font.heading,
    color: color.ember,
    fontSize: 14,
    letterSpacing: 1,
  },
  glorySub: {
    color: withAlpha(color.ember, 0.5),
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // Arena
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
  arenaName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  arenaScore: { color: color.gold, fontSize: 13, fontWeight: "900", letterSpacing: 0.5 },
  countdownBox: { alignItems: "center", marginTop: 6 },
  countdownNum: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 40,
    includeFontPadding: false,
    textShadowColor: withAlpha(color.gold, 0.6),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  countdownLabel: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
  },
  waiting: {
    color: color.goldFaded,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 6,
  },
})
