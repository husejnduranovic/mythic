// Honor-card grammar — the shared chassis behind the Hall podium (§4.6.2), the
// Profile crest (§4.5) and now the game-over / between-levels / pre-battle
// moments. One deep-green card in the app-icon language: engraved double frame,
// corner runes, a Cinzel playing-card corner index, a crest medallion with a
// breathing halo, parchment nameplate. Plus the muster-roll ledger row and the
// forge progress bar that travel with it.
//
// Scoreboard.tsx and Profile.tsx still carry their own (older) copies of this
// grammar; the migration sweep should collapse them onto this module so there is
// a single source of truth (DESIGN_PLAN §3). New screens consume this directly.
//
// Animation is RN Animated (matching the reference screens). These components
// only ever render on full-screen moments that replace the board — never on the
// live 28-card field — so they carry no per-frame board cost.

import React, { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View } from "react-native"
import { Icon, IconName } from "./Icon"
import { color, font } from "./theme"

// RN hex+alpha string concat breaks on rgba inputs (the §5 Profile blob bug) —
// alpha is always applied explicitly from plain-hex colors.
export const withAlpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// Five-metal tier ladder (§4.5.1) — shared by Profile rank + Hall avatars.
export const TIER = {
  bronze: "#B07B4F",
  iron: "#9BA3AB",
  steel: "#C9D1D9",
  gold: color.gold,
  mystic: color.mystic,
}

export const RANKS: { min: number; name: string; icon: IconName; color: string }[] =
  [
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

export const getRank = (games: number) => {
  let rank = RANKS[0]
  for (const r of RANKS) if (games >= r.min) rank = r
  return rank
}

// The icon's card green — the card is the lit centerpiece, not a flat panel.
export const CARD_FIELD = "#1A3D2A"
export const CARD_RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]

// ── HonorCard ────────────────────────────────────────────────────────────────
// The chassis: field, double frame, shine, free-corner runes, optional corner
// index, crest medallion + breathing halo. The body below the medallion is the
// caller's `children` (nameplate, score, etc.) so each screen composes its own.

interface HonorCardProps {
  w: number
  h: number
  trim: string // metal color
  medallion: IconName
  deal: Animated.Value
  pulse: Animated.Value // halo breathing
  float?: Animated.Value // optional levitate
  index?: string // playing-card corner index (TL + rotated BR)
  baseRot?: number // resting rotation, deg
  borderWidth?: number
  shine?: boolean
  badge?: string // parchment corner badge (e.g. "YOU")
  children?: React.ReactNode
}

export const HonorCard = ({
  w,
  h,
  trim,
  medallion,
  deal,
  pulse,
  float,
  index,
  baseRot = 0,
  borderWidth = 2,
  shine = true,
  badge,
  children,
}: HonorCardProps) => {
  const medal = Math.round(w * 0.42)
  const dealStyle = {
    opacity: deal,
    transform: [
      { translateY: deal.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
      {
        rotate: deal.interpolate({
          inputRange: [0, 1],
          outputRange: [`${baseRot * 2}deg`, `${baseRot}deg`],
        }),
      },
      { scale: deal.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  }
  const floatY = float
    ? float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })
    : 0

  return (
    <Animated.View style={dealStyle}>
      <Animated.View
        style={[
          hc.card,
          {
            width: w,
            height: h,
            borderColor: trim,
            borderWidth,
            shadowColor: trim,
            transform: [{ translateY: floatY }],
          },
        ]}
      >
        <View style={[hc.frame, { borderColor: withAlpha(trim, 0.45) }]} />
        <View style={[hc.frameInner, { borderColor: withAlpha(trim, 0.22) }]} />
        {shine && <View style={hc.shine} />}

        {/* runes on the free corners (the index owns TL/BR when present) */}
        <Text style={[hc.rune, { top: 14, right: 15, color: withAlpha(trim, 0.3) }]}>
          {CARD_RUNES[1]}
        </Text>
        <Text style={[hc.rune, { bottom: 14, left: 15, color: withAlpha(trim, 0.3) }]}>
          {CARD_RUNES[2]}
        </Text>

        {index != null && (
          <>
            <View style={[hc.index, { top: 6, left: 8 }]}>
              <Text style={[hc.indexNum, { color: trim }]}>{index}</Text>
              <Text style={[hc.indexDot, { color: withAlpha(trim, 0.7) }]}>◆</Text>
            </View>
            <View style={[hc.index, hc.indexBR, { bottom: 6, right: 8 }]}>
              <Text style={[hc.indexNum, { color: trim }]}>{index}</Text>
              <Text style={[hc.indexDot, { color: withAlpha(trim, 0.7) }]}>◆</Text>
            </View>
          </>
        )}

        {/* crest medallion with breathing halo */}
        <View style={[hc.medalZone, { marginTop: Math.round(h * 0.1) }]}>
          <Animated.View
            style={[
              hc.halo,
              {
                width: medal + 16,
                height: medal + 16,
                borderRadius: (medal + 16) / 2,
                backgroundColor: withAlpha(trim, 0.12),
                opacity: pulse,
              },
            ]}
          />
          <View
            style={[
              hc.medal,
              {
                width: medal,
                height: medal,
                borderRadius: medal / 2,
                backgroundColor: withAlpha(trim, 0.1),
                borderColor: withAlpha(trim, 0.8),
              },
            ]}
          >
            <View
              style={[
                hc.medalRing,
                { borderColor: withAlpha(trim, 0.4), borderRadius: medal / 2 },
              ]}
            />
            <Icon name={medallion} size={Math.round(medal * 0.5)} color={trim} />
          </View>
        </View>

        {children}

        {badge && (
          <View style={hc.badge}>
            <Text style={hc.badgeTxt}>{badge}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
}

// A parchment nameplate — the one light surface, like the icon's title band.
export const NamePlate = ({ children }: { children: React.ReactNode }) => (
  <View style={hc.plate}>
    <Text
      style={hc.plateTxt}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
    >
      {children}
    </Text>
  </View>
)

// ── LedgerRow ────────────────────────────────────────────────────────────────
// Muster-roll line: ringed icon, label, dotted leader, value. Cascades in.

export const LedgerRow = ({
  icon,
  label,
  value,
  index = 0,
  valueColor = color.gold,
}: {
  icon: IconName
  label: string
  value: string
  index?: number
  valueColor?: string
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
        hc.ledgerRow,
        {
          opacity: a,
          transform: [
            { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        },
      ]}
    >
      <View style={hc.ledgerRing}>
        <Icon name={icon} size={13} color={color.goldFaded} />
      </View>
      <Text style={hc.ledgerLabel}>{label}</Text>
      <Text style={hc.ledgerDots} numberOfLines={1} ellipsizeMode="clip">
        ································
      </Text>
      <Text style={[hc.ledgerValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </Animated.View>
  )
}

export const LedgerSep = () => <View style={hc.ledgerSep} />

// ── ForgeBar ─────────────────────────────────────────────────────────────────
// The next-unlock / next-goal progress ladder (§4.9.3). Names the prize.

export const ForgeBar = ({
  icon,
  label,
  cur,
  req,
  tint = color.gold,
  done,
}: {
  icon: IconName
  label: string
  cur?: number
  req?: number
  tint?: string
  done?: boolean
}) => {
  const pct =
    done || !req ? 100 : Math.min(100, Math.round(((cur || 0) / req) * 100))
  return (
    <View style={hc.forge}>
      <View style={hc.forgeRow}>
        <Icon name={icon} size={11} color={tint} />
        <Text style={[hc.forgeLabel, done && { color: color.gold }]} numberOfLines={1}>
          {label}
        </Text>
        {!done && req != null && (
          <Text style={[hc.forgeCount, { color: tint }]}>
            {cur}/{req}
          </Text>
        )}
      </View>
      <View style={hc.forgeTrack}>
        <View style={[hc.forgeFill, { width: `${pct}%`, backgroundColor: tint }]} />
      </View>
    </View>
  )
}

const hc = StyleSheet.create({
  card: {
    backgroundColor: CARD_FIELD,
    borderRadius: 12,
    alignItems: "stretch",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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
    height: "30%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  rune: { position: "absolute", fontSize: 8 },
  index: { position: "absolute", alignItems: "center", zIndex: 4 },
  indexBR: { transform: [{ rotate: "180deg" }] },
  indexNum: { fontFamily: font.heading, fontSize: 14, lineHeight: 17 },
  indexDot: { fontSize: 6, marginTop: -2 },
  medalZone: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute" },
  medal: { borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  medalRing: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 0.5,
  },
  badge: {
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
  badgeTxt: { color: color.ink, fontSize: 8, fontWeight: "900", letterSpacing: 1 },

  plate: {
    backgroundColor: color.parchment,
    borderRadius: 4,
    marginHorizontal: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  plateTxt: {
    color: color.ink,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // Ledger
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
  ledgerValue: { fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  ledgerSep: { height: 1, backgroundColor: "rgba(232,197,71,0.05)" },

  // Forge bar
  forge: { gap: 4 },
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
})
