// Heraldic sigils — the monochrome engraving language of the deck (DESIGN_PLAN §4.2.8).
// Replaces the full-color system emoji (🐉🦅🐺🐍, back/bounty icons) that ignored the
// palette and rendered platform-dependent. Every sigil is a glyph from a font already
// shipped with @expo/vector-icons (no new dependency, no prebuild): tintable to any ink,
// same render cost as the Text emoji it replaces. Fonts are preloaded in useGameFonts().
//
// Shared by Card.tsx today; Armory miniatures + Game chrome adopt it in their next
// slices so rack tiles stay true miniatures of the in-game render.

import React from "react"
import { StyleProp, TextStyle } from "react-native"
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"

// fam "mci" = MaterialCommunityIcons; "fa5" = FontAwesome5 Free (solid weight) —
// FA5 covers the beasts MCI lacks (dragon, corvid eagle).
export type SigilSpec = { fam: "mci" | "fa5"; name: string }

export const Sigil = ({
  sigil,
  size,
  color,
  style,
}: {
  sigil: SigilSpec
  size: number
  color: string
  style?: StyleProp<TextStyle>
}) =>
  sigil.fam === "fa5" ? (
    <FontAwesome5 name={sigil.name as any} size={size} color={color} style={style} solid />
  ) : (
    <MaterialCommunityIcons name={sigil.name as any} size={size} color={color} style={style} />
  )

// The four suit beasts. Wolf is rendered as its hunting mark (paw) — no glyph font
// in the build carries a wolf head; the paw stays crisp at 7px corner size where a
// full beast silhouette would mush.
export const SUIT_SIGILS: Record<string, SigilSpec> = {
  hearts: { fam: "fa5", name: "dragon" },
  diamonds: { fam: "fa5", name: "crow" },
  clubs: { fam: "mci", name: "paw" },
  spades: { fam: "mci", name: "snake" },
}

// Per-back engraving style, keyed by the back's base color — the only theming value
// that reaches Card.tsx (CardBackColorContext / cardBackColor prop). accent mirrors
// the item's CARD_BACKS entry (Armory.tsx) so each back frames itself in its own
// metal instead of the old washed white overlays.
export const BACK_STYLES: Record<string, { accent: string; sigil: SigilSpec }> = {
  "#1A1410": { accent: "#B89968", sigil: { fam: "mci", name: "shield" } }, // oak_shield
  "#0E1A2E": { accent: "#6B9FD4", sigil: { fam: "mci", name: "castle" } }, // steel_bastion
  "#2A0E0A": { accent: "#D47755", sigil: { fam: "mci", name: "fireplace" } }, // hearthwood
  "#0C2218": { accent: "#4DCC6A", sigil: { fam: "mci", name: "paw" } }, // wolf_sigil
  "#3D0D0D": { accent: "#FF4422", sigil: { fam: "fa5", name: "dragon" } }, // dragon_crest
  "#2A1C00": { accent: "#E8B84B", sigil: { fam: "fa5", name: "crow" } }, // eagle_pennant
  "#1E0A3C": { accent: "#C87DFF", sigil: { fam: "mci", name: "crown" } }, // royal_banner
  "#1A0500": { accent: "#FF6600", sigil: { fam: "mci", name: "fire" } }, // flame_sworn
  "#3D2E0A": { accent: "#C9A86A", sigil: { fam: "mci", name: "script-text" } }, // daily quest deck (Game.tsx dailyMode)
}

// Legacy/unknown back colors (e.g. old default #162A47) fall back to brand gold + crossed swords.
export const DEFAULT_BACK_STYLE: { accent: string; sigil: SigilSpec } = {
  accent: "#E8C547",
  sigil: { fam: "mci", name: "sword-cross" },
}

// Bounty styles carry their own `sigil` in BOUNTY_STYLE_CONFIG (Armory.tsx); this is
// the fallback for the context default / configs persisted before the field existed.
export const BOUNTY_FALLBACK_SIGIL: SigilSpec = { fam: "mci", name: "sack" }
