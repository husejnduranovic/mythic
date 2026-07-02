// Between-levels — "The Breath" (rebuilt 2026-07-02).
//
// Not a report — a breath between battles, staged in three beats on a single
// center axis: (1) EXHALE — the outcome stamps in and the spoils just taken
// count into the campaign total; (2) ANTICIPATION — the next battlefield
// arrives face-down and FLIPS to reveal its name, multiplier, beasts and
// time, in the same flip grammar as the game's own cards; (3) ONWARD — the
// ghost line (ahead/behind your best run at this exact point), the march
// track, Glory and the CTA. Everything is skippable instantly — the button
// never waits for the theatre. Replaces the board (early return): motion is
// free here.
//
// Arena keeps its standings ledger beside a smaller reveal card, on the same
// skeleton.

import React, { useEffect, useRef, useState } from "react"
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
import { Icon, IconName } from "../../ui/Icon"
import { GoldButton } from "../../ui/GoldButton"
import { color, font } from "../../ui/theme"
import { CARD_FIELD, TIER, withAlpha } from "../../ui/honor"
import { Sigil } from "../../ui/sigils"
import type { ThemeConfig } from "../Armory"

const ROMAN = ["I", "II", "III", "IV", "V", "VI"]

// Count-up on a static full-screen moment — no board cost.
const useCountUp = (target: number, duration = 650, delay = 200) => {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target <= 0) {
      setVal(target)
      return
    }
    let interval: ReturnType<typeof setInterval> | null = null
    const steps = 20
    let i = 0
    const t = setTimeout(() => {
      interval = setInterval(() => {
        i++
        const eased = 1 - Math.pow(1 - i / steps, 3)
        setVal(Math.round(target * eased))
        if (i >= steps && interval) clearInterval(interval)
      }, duration / steps)
    }, delay)
    return () => {
      clearTimeout(t)
      if (interval) clearInterval(interval)
    }
  }, [target])
  return val
}

// ── The reveal — next battlefield dealt face-down, then flipped ─────────────
const FlipCard = ({
  w,
  h,
  level,
  isFinal,
}: {
  w: number
  h: number
  level: number
  isFinal: boolean
}) => {
  const deal = useRef(new Animated.Value(0)).current
  const flip = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(deal, {
      toValue: 1,
      duration: 300,
      delay: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    Animated.timing(flip, {
      toValue: 1,
      duration: 430,
      delay: 740,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [])

  const nextCfg = LEVEL_CONFIG[level + 1]
  const nextMult = (1 + level * 0.5).toFixed(1)

  const backStyle = {
    opacity: flip.interpolate({
      inputRange: [0, 0.499, 0.5, 1],
      outputRange: [1, 1, 0, 0],
    }),
    transform: [
      { perspective: 900 },
      {
        rotateY: flip.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ["0deg", "90deg", "90deg"],
        }),
      },
      {
        scale: flip.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.06, 1],
        }),
      },
    ],
  }
  const frontStyle = {
    opacity: flip.interpolate({
      inputRange: [0, 0.499, 0.5, 1],
      outputRange: [0, 0, 1, 1],
    }),
    transform: [
      { perspective: 900 },
      {
        rotateY: flip.interpolate({
          inputRange: [0, 0.5, 0.88, 1],
          outputRange: ["-90deg", "-90deg", "6deg", "0deg"],
        }),
      },
      {
        scale: flip.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.06, 1],
        }),
      },
    ],
  }

  const trim = isFinal ? color.goldBright : color.gold
  const index = isFinal ? "★" : ROMAN[level] || `${level + 1}`

  return (
    <Animated.View
      style={{
        width: w,
        height: h,
        opacity: deal,
        transform: [
          {
            translateY: deal.interpolate({
              inputRange: [0, 1],
              outputRange: [26, 0],
            }),
          },
        ],
      }}
    >
      {/* face-down */}
      <Animated.View style={[f.face, backStyle]}>
        <View style={f.backRoot}>
          <View style={[f.frame, { borderColor: withAlpha(color.gold, 0.3) }]} />
          <View
            style={[f.frameInner, { borderColor: withAlpha(color.gold, 0.14) }]}
          />
          <Text style={[f.backRune, { top: 8, left: 10 }]}>ᚠ</Text>
          <Text style={[f.backRune, { top: 8, right: 10 }]}>ᚦ</Text>
          <Text style={[f.backRune, { bottom: 8, left: 10 }]}>ᚱ</Text>
          <Text style={[f.backRune, { bottom: 8, right: 10 }]}>ᛟ</Text>
          <View style={f.backMedal}>
            <Sigil
              sigil={{ fam: "mci", name: "sword-cross" }}
              size={Math.round(w * 0.3)}
              color={withAlpha(color.gold, 0.4)}
            />
          </View>
        </View>
      </Animated.View>

      {/* the reveal */}
      <Animated.View style={[f.face, frontStyle]}>
        <View style={[f.frontRoot, { borderColor: trim }]}>
          <View style={[f.frame, { borderColor: withAlpha(trim, 0.45) }]} />
          <View style={[f.frameInner, { borderColor: withAlpha(trim, 0.2) }]} />
          <View style={f.shine} />
          <View style={[f.index, { top: 7, left: 9 }]}>
            <Text style={[f.indexTxt, { color: trim }]}>{index}</Text>
          </View>
          <View style={[f.index, f.indexBR, { bottom: 7, right: 9 }]}>
            <Text style={[f.indexTxt, { color: trim }]}>{index}</Text>
          </View>

          {isFinal ? (
            <>
              <Text style={[f.overline, { color: withAlpha(trim, 0.6) }]}>
                THE CAMPAIGN ENDS
              </Text>
              <Icon
                name="trophy-variant"
                size={Math.round(w * 0.26)}
                color={trim}
              />
              <Text
                style={[f.name, { color: trim }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                VICTORY
              </Text>
              <Text style={f.stats}>ALL SPOILS COUNTED</Text>
            </>
          ) : (
            <>
              <Text style={[f.overline, { color: withAlpha(trim, 0.6) }]}>
                NEXT BATTLEFIELD
              </Text>
              <Text
                style={[f.name, { color: trim }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {(nextCfg?.name || "").toUpperCase()}
              </Text>
              <Text style={[f.mult, { textShadowColor: withAlpha(trim, 0.45) }]}>
                {nextMult}×
              </Text>
              <Text style={[f.multKey, { color: withAlpha(trim, 0.55) }]}>
                SPOILS
              </Text>
              <View style={[f.div, { backgroundColor: withAlpha(trim, 0.2) }]} />
              <Text style={f.stats}>
                {nextCfg?.fieldCards} BEASTS · {nextCfg?.time}s
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const f = StyleSheet.create({
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: "hidden",
  },
  backRoot: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: withAlpha(color.gold, 0.35),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0E1B12",
  },
  frontRoot: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: CARD_FIELD,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
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
    height: "28%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  backRune: {
    position: "absolute",
    fontSize: 11,
    color: withAlpha(color.gold, 0.3),
  },
  backMedal: {
    width: "52%",
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: withAlpha(color.gold, 0.25),
    justifyContent: "center",
    alignItems: "center",
  },
  index: { position: "absolute", zIndex: 3 },
  indexBR: { transform: [{ rotate: "180deg" }] },
  indexTxt: { fontFamily: font.heading, fontSize: 13 },
  overline: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginBottom: 3,
  },
  name: {
    fontFamily: font.heading,
    fontSize: 15,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 2,
  },
  mult: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 32,
    includeFontPadding: false,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  multKey: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: -1,
  },
  div: { width: "46%", height: 1, marginVertical: 6 },
  stats: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
})

// ── The exhale itemized — one spoils-source chip, dealt in on its beat ───────
const LedgerChip = ({
  icon,
  label,
  value,
  tint,
  delay,
}: {
  icon: IconName
  label: string
  value: number
  tint: string
  delay: number
}) => {
  const a = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 240,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [])
  return (
    <Animated.View
      style={[
        c.chip,
        {
          opacity: a,
          transform: [
            {
              translateY: a.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Icon name={icon} size={9} color={tint} />
      <Text style={[c.chipVal, { color: tint }]}>
        +{value.toLocaleString()}
      </Text>
      <Text style={c.chipLabel}>{label}</Text>
    </Animated.View>
  )
}

const c = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(4,8,5,0.5)",
    borderWidth: 1,
    borderColor: color.goldLine,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipVal: { fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },
  chipLabel: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
  },
})

// ── The march — six small field chips ────────────────────────────────────────
const MarchDot = ({ idx, level }: { idx: number; level: number }) => {
  const done = idx <= level
  const isNext = idx === level + 1 && level < TOTAL_LEVELS
  if (done) {
    return (
      <View style={[m.dot, m.dotDone]}>
        <Icon name="check-bold" size={9} color={color.gold} />
      </View>
    )
  }
  return (
    <View style={[m.dot, isNext ? m.dotNext : m.dotFar]}>
      <Text style={[m.dotNum, isNext && { color: color.gold }]}>{idx}</Text>
    </View>
  )
}

const m = StyleSheet.create({
  dot: {
    width: 19,
    height: 26,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dotDone: { backgroundColor: CARD_FIELD, borderColor: withAlpha(color.gold, 0.5) },
  dotNext: {
    backgroundColor: "#14241A",
    borderColor: color.gold,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  dotFar: { backgroundColor: color.bgRaised, borderColor: color.goldLine },
  dotNum: {
    color: "rgba(232,197,71,0.35)",
    fontFamily: font.heading,
    fontSize: 11,
  },
})

// ── Screen ───────────────────────────────────────────────────────────────────
export const BetweenLevelsScreen = ({
  theme,
  background,
  cleared,
  remaining,
  level,
  score,
  fieldSpoils = 0,
  fieldLedger = null,
  unbroken = false,
  ghostAt = null,
  freeDraws = 0,
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
  fieldSpoils?: number
  fieldLedger?: {
    combat: number
    time: number
    deck: number
    perfect: number
    unbroken: number
  } | null
  unbroken?: boolean
  ghostAt?: number | null
  freeDraws?: number
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
  const stamp = useRef(new Animated.Value(0)).current
  const late = useRef(new Animated.Value(0)).current

  const takenDisplay = useCountUp(fieldSpoils)

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
    // Beat 1 — the outcome stamps.
    Animated.timing(stamp, {
      toValue: 1,
      duration: 280,
      delay: 60,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    }).start()
    // Beat 3 — ghost line, march, notes settle after the flip.
    Animated.timing(late, {
      toValue: 1,
      duration: 320,
      delay: 1040,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [])

  const isFinal = level >= TOTAL_LEVELS
  const isUnbroken = cleared && unbroken
  const trim = isUnbroken
    ? color.goldBright
    : cleared
      ? color.gold
      : TIER.steel

  // The exhale itemized — skip zero sources, deal chips in on 110ms beats.
  const ledgerChips: {
    icon: IconName
    label: string
    value: number
    tint: string
  }[] = fieldLedger
    ? [
        {
          icon: "sword-cross" as IconName,
          label: "COMBAT",
          value: fieldLedger.combat,
          tint: color.gold,
        },
        {
          icon: "timer-sand" as IconName,
          label: "TIME",
          value: fieldLedger.time,
          tint: TIER.steel,
        },
        {
          icon: "cards" as IconName,
          label: "DECK",
          value: fieldLedger.deck,
          tint: TIER.steel,
        },
        {
          icon: "star-four-points" as IconName,
          label: "PERFECT",
          value: fieldLedger.perfect,
          tint: color.sage,
        },
        {
          icon: "link-variant" as IconName,
          label: "UNBROKEN",
          value: fieldLedger.unbroken,
          tint: color.goldBright,
        },
      ].filter((chip) => chip.value > 0)
    : []

  const padL = Math.max(16, insets.left)
  const padR = Math.max(16, insets.right)

  const cardH = Math.round(
    Math.min(winH - (arenaMode ? 208 : 196), arenaMode ? 150 : 178),
  )
  const cardW = Math.round(cardH / 1.42)

  // Ghost delta at this exact point of the campaign.
  const ghostDelta = ghostAt !== null ? score - ghostAt : null
  const ahead = (ghostDelta ?? 0) >= 0

  const lateStyle = {
    opacity: late,
    transform: [
      {
        translateY: late.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
      },
    ],
  }

  const allReady =
    arenaMode &&
    arenaPlayers.length > 0 &&
    arenaPlayers.every((p: any) => (p.currentLevel || 0) >= level)

  return (
    <View style={[b.container, { paddingLeft: padL, paddingRight: padR }]}>
      {background}

      <Animated.View style={[b.inner, { opacity: fade }]}>
        {/* ── Beat 1: the exhale ── */}
        <Animated.View
          style={[
            b.header,
            {
              opacity: stamp,
              transform: [
                {
                  scale: stamp.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.35, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={b.outcomeRow}>
            <Icon
              name={
                isUnbroken
                  ? "link-variant"
                  : cleared
                    ? "check-decagram"
                    : "shield-half-full"
              }
              size={17}
              color={trim}
            />
            <Text style={[b.outcomeTxt, { color: trim }]}>
              {isUnbroken
                ? "UNBROKEN CONQUEST"
                : cleared
                  ? "FIELD CLEARED"
                  : "THE FIELD HOLDS"}
            </Text>
          </View>
          <Text style={b.takenTxt}>
            +{takenDisplay.toLocaleString()}
            <Text style={b.takenKey}>  SPOILS TAKEN</Text>
          </Text>
          <Text style={b.totalTxt}>
            {!cleared && remaining > 0
              ? `${remaining} beast${remaining !== 1 ? "s" : ""} held their ground  ·  `
              : ""}
            CAMPAIGN TOTAL {score.toLocaleString()}
          </Text>
          {ledgerChips.length > 0 && (
            <View style={c.chipRow}>
              {ledgerChips.map((chip, i) => (
                <LedgerChip
                  key={chip.label}
                  icon={chip.icon}
                  label={chip.label}
                  value={chip.value}
                  tint={chip.tint}
                  delay={340 + i * 110}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Beat 2: the reveal ── */}
        <View style={b.stage}>
          {arenaMode ? (
            <View style={b.arenaRow}>
              <FlipCard w={cardW} h={cardH} level={level} isFinal={isFinal} />
              <View style={b.standings}>
                <Text style={b.boardTitle}>ARENA STANDINGS</Text>
                <ScrollView
                  style={{ flexGrow: 0 }}
                  showsVerticalScrollIndicator={false}
                >
                  {arenaPlayers.map((p: any, i: number) => (
                    <View
                      key={p.uid || i}
                      style={[b.arenaRowItem, p.uid === uid && b.arenaRowYou]}
                    >
                      <Text
                        style={[b.arenaPos, p.uid === uid && { color: color.gold }]}
                      >
                        {i + 1}
                      </Text>
                      <Text
                        style={[
                          b.arenaName,
                          p.uid === uid && { color: color.gold },
                        ]}
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
              </View>
            </View>
          ) : (
            <>
              <FlipCard w={cardW} h={cardH} level={level} isFinal={isFinal} />
              {/* ── Beat 3: the shadow ── */}
              <Animated.View style={[b.notes, lateStyle]}>
                {ghostDelta !== null && (
                  <View style={b.ghostRow}>
                    <Icon
                      name={ahead ? "chevron-double-up" : "chevron-double-down"}
                      size={13}
                      color={ahead ? color.sage : TIER.steel}
                    />
                    <Text
                      style={[
                        b.ghostTxt,
                        { color: ahead ? color.sage : TIER.steel },
                      ]}
                    >
                      {Math.abs(ghostDelta).toLocaleString()}{" "}
                      {ahead ? "AHEAD OF" : "BEHIND"} YOUR BEST RUN
                    </Text>
                  </View>
                )}
                {!ahead && ghostDelta !== null && !isFinal && (
                  <Text style={b.ghostNote}>
                    the fields ahead pay up to 3.5× — the run is alive
                  </Text>
                )}
                {freeDraws > 0 && !isFinal && (
                  <View style={b.bankRow}>
                    <Icon name="restore" size={11} color={color.goldFaded} />
                    <Text style={b.bankTxt}>
                      FREE DRAW BANKED — NEXT FIELD STARTS WITH{" "}
                      {Math.min(freeDraws + 1, 2)}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </>
          )}
        </View>

        {/* ── Onward ── */}
        <View style={b.bottomRow}>
          <View style={b.march}>
            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
              <MarchDot key={i} idx={i + 1} level={level} />
            ))}
          </View>

          {arenaMode ? (
            allReady ? (
              <View style={b.countdownBox}>
                <Text style={b.countdownNum}>{arenaCountdown || "GO!"}</Text>
                <Text style={b.countdownLabel}>NEXT BATTLE</Text>
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
            )
          ) : (
            <View style={b.actions}>
              {!isFinal && gloryCharges > 0 && !gloryActive && (
                <TouchableOpacity
                  style={b.gloryChip}
                  onPress={onActivateGlory}
                  activeOpacity={0.85}
                >
                  <Icon name="lightning-bolt" size={14} color={color.ember} />
                  <Text style={b.gloryTxt}>GLORY 2× · ½ TIME</Text>
                </TouchableOpacity>
              )}
              {gloryActive && (
                <View style={[b.gloryChip, b.gloryChipArmed]}>
                  <Icon name="lightning-bolt" size={14} color={color.ember} />
                  <Text style={b.gloryTxt}>GLORY ARMED</Text>
                </View>
              )}
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
                style={b.cta}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  )
}

const b = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bgBase },
  inner: { flex: 1, paddingTop: 10, paddingBottom: 10 },

  // The exhale
  header: { alignItems: "center", gap: 1 },
  outcomeRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  outcomeTxt: {
    fontFamily: font.display,
    fontSize: 19,
    letterSpacing: 2.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  takenTxt: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 20,
    includeFontPadding: false,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  takenKey: {
    fontSize: 9,
    color: color.goldFaded,
    letterSpacing: 2,
  },
  totalTxt: {
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 1,
  },

  // The reveal stage
  stage: { flex: 1, justifyContent: "center", alignItems: "center", gap: 9 },
  notes: { alignItems: "center", gap: 3, minHeight: 34 },
  ghostRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ghostTxt: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  ghostNote: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 9,
    fontStyle: "italic",
    letterSpacing: 0.4,
  },
  bankRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  bankTxt: {
    color: color.goldFaded,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  // Onward
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  march: { flexDirection: "row", gap: 5 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  gloryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: withAlpha(color.ember, 0.1),
    borderWidth: 1.5,
    borderColor: withAlpha(color.ember, 0.4),
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  gloryChipArmed: {
    backgroundColor: withAlpha(color.ember, 0.2),
    borderColor: color.ember,
  },
  gloryTxt: {
    color: color.ember,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  cta: { minWidth: 196, paddingHorizontal: 18 },

  // Arena
  arenaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    width: "100%",
    justifyContent: "center",
  },
  standings: { width: "46%", maxHeight: 190 },
  boardTitle: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 3.5,
    marginBottom: 5,
    textAlign: "center",
  },
  arenaRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: "900",
    width: 18,
    textAlign: "right",
  },
  arenaName: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  arenaScore: {
    color: color.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  countdownBox: { alignItems: "center" },
  countdownNum: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 34,
    includeFontPadding: false,
    textShadowColor: withAlpha(color.gold, 0.6),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  countdownLabel: {
    color: color.goldFaded,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 4,
  },
  waiting: {
    color: color.goldFaded,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
})
