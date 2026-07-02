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
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SoundService } from "../services/SoundService"
import { StorageKeys } from "../services/storageKeys"
import { logError } from "../services/logError"
import ReturnToCastle from "./ReturnToCastle"
import { Icon, IconName } from "../ui/Icon"
import { color, font } from "../ui/theme"
import {
  BACK_STYLES,
  BOUNTY_FALLBACK_SIGIL,
  DEFAULT_BACK_STYLE,
  Sigil,
  SigilSpec,
} from "../ui/sigils"

// ─────────────────────────────────────────────────────────────────────────────
// Armory — "Quartermaster's Stage" (DESIGN_PLAN §4.9)
//
// Landscape two-column. Left: the war-kit stage — a live diorama of the
// player's equipped cosmetics built from the real in-game grammar: the
// battlefield felt as backdrop, the war table as shelf (plank + battlements),
// and the equipped card back + bounty card standing fanned on it — the app
// icon, recreated from the player's own gear. Right: the racks — parchment-
// active tabs over a grid where every tile is a true miniature of the item's
// in-game render (Card.tsx back grammar, Game.tsx war bar). Locked items stay
// visible but dimmed so the next unlock has something to want.
// ─────────────────────────────────────────────────────────────────────────────

const withAlpha = (hex: string, a: number): string => {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

interface ArmoryProps {
  onBack: () => void
}

export interface ThemeConfig {
  cardBack: string
  cardBackColor: string
  battlefield: string
  battlefieldColor: string
  warTable?: string
  bountyStyle?: string
}

// Back medallion icons moved to ui/sigils.tsx (BACK_STYLES) — monochrome glyphs
// keyed by the same back colors, plus each item's accent for the frame engraving.
//
// Wild styles deleted 2026-07-01: the wild-card mechanic left the game in
// 158f5c9 and the six styles (incl. the 42-day Inferno Bolt) were unreachable
// inventory — selling styles for a card that never renders. The old
// @mythic_wild_style storage value is simply orphaned (harmless).

export const WAR_TABLE_CONFIG: Record<
  string,
  { color: string; accent: string }
> = {
  oak_plank: { color: "#2A1C0E", accent: "#B89968" },
  iron_banded: { color: "#15181C", accent: "#8899AA" },
  crimson_velvet: { color: "#200810", accent: "#CC3344" },
  marble: { color: "#1E1E1E", accent: "#D8D8D8" },
  royal_gold: { color: "#1C1600", accent: "#CCA800" },
  obsidian: { color: "#0A0A0C", accent: "#5566AA" },
}

interface ArmoryItem {
  id: string
  name: string
  icon: string
  color: string
  accent: string
  unlockReq: number
  streakReq?: number
  // Skill gates (2026-07-01): mastery unlocks that no amount of grinding
  // reaches — a lifetime-best combo or a single-battle spoils threshold.
  comboReq?: number
  scoreReq?: number
  unlockLabel?: string
}

const CARD_BACKS: ArmoryItem[] = [
  {
    id: "oak_shield",
    name: "Oak Shield",
    icon: "🛡",
    color: "#1A1410",
    accent: "#B89968",
    unlockReq: 0,
  },
  {
    id: "steel_bastion",
    name: "Steel Bastion",
    icon: "🏰",
    color: "#0E1A2E",
    accent: "#6B9FD4",
    unlockReq: 0,
  },
  {
    id: "hearthwood",
    name: "Hearthwood",
    icon: "🏠",
    color: "#2A0E0A",
    accent: "#D47755",
    unlockReq: 0,
  },
  {
    id: "wolf_sigil",
    name: "Wolf Sigil",
    icon: "🐺",
    color: "#0C2218",
    accent: "#4DCC6A",
    unlockReq: 3,
    unlockLabel: "3 battles",
  },
  {
    id: "dragon_crest",
    name: "Dragon Crest",
    icon: "🐉",
    color: "#3D0D0D",
    accent: "#FF4422",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "eagle_pennant",
    name: "Eagle Pennant",
    icon: "🦅",
    color: "#2A1C00",
    accent: "#E8B84B",
    unlockReq: 0,
    comboReq: 12,
    unlockLabel: "×12 combo",
  },
  {
    id: "royal_banner",
    name: "Royal Banner",
    icon: "👑",
    color: "#1E0A3C",
    accent: "#C87DFF",
    unlockReq: 0,
    comboReq: 20,
    unlockLabel: "×20 combo",
  },
  {
    id: "flame_sworn",
    name: "Flame Sworn",
    icon: "🔥",
    color: "#1A0500",
    accent: "#FF6600",
    unlockReq: 0,
    streakReq: 7,
    unlockLabel: "7 day streak",
  },
]

const BATTLEFIELDS: ArmoryItem[] = [
  {
    id: "training_yard",
    name: "Training Yard",
    icon: "🏟",
    color: "#1A1408",
    accent: "#B89968",
    unlockReq: 0,
  },
  {
    id: "stone_keep",
    name: "Stone Keep",
    icon: "🏰",
    color: "#1C1C20",
    accent: "#A8B0BC",
    unlockReq: 0,
  },
  {
    id: "forest_camp",
    name: "Forest Camp",
    icon: "🌲",
    color: "#0A1F10",
    accent: "#4DCC6A",
    unlockReq: 0,
  },
  {
    id: "mountain_pass",
    name: "Mountain Pass",
    icon: "🏔",
    color: "#0C1E2C",
    accent: "#88DDFF",
    unlockReq: 3,
    unlockLabel: "3 battles",
  },
  {
    id: "coastal_hold",
    name: "Coastal Hold",
    icon: "🌊",
    color: "#060F28",
    accent: "#2299FF",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "volcanic_rise",
    name: "Volcanic Rise",
    icon: "🌋",
    color: "#2A0A00",
    accent: "#FF4400",
    unlockReq: 25,
    unlockLabel: "25 battles",
  },
  {
    id: "royal_hall",
    name: "Royal Hall",
    icon: "🏛",
    color: "#1E1400",
    accent: "#DDAA33",
    unlockReq: 60,
    unlockLabel: "60 battles",
  },
  {
    id: "ember_court",
    name: "Ember Court",
    icon: "🔥",
    color: "#1A0600",
    accent: "#FF5500",
    unlockReq: 0,
    streakReq: 21,
    unlockLabel: "21 day streak",
  },
]

const WAR_TABLES: ArmoryItem[] = [
  {
    id: "oak_plank",
    name: "Oak Plank",
    icon: "🪵",
    color: "#2A1C0E",
    accent: "#B89968",
    unlockReq: 0,
  },
  {
    id: "iron_banded",
    name: "Iron Banded",
    icon: "⚙️",
    color: "#15181C",
    accent: "#8899AA",
    unlockReq: 0,
  },
  {
    id: "crimson_velvet",
    name: "Crimson Velvet",
    icon: "🩸",
    color: "#200810",
    accent: "#CC3344",
    unlockReq: 5,
    unlockLabel: "5 battles",
  },
  {
    id: "marble",
    name: "White Marble",
    icon: "🏺",
    color: "#1E1E1E",
    accent: "#D8D8D8",
    unlockReq: 20,
    unlockLabel: "20 battles",
  },
  {
    id: "royal_gold",
    name: "Royal Gold",
    icon: "⚜️",
    color: "#1C1600",
    accent: "#CCA800",
    unlockReq: 60,
    unlockLabel: "60 battles",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    icon: "🖤",
    color: "#0A0A0C",
    accent: "#5566AA",
    unlockReq: 0,
    comboReq: 28,
    unlockLabel: "×28 combo",
  },
]

const BOUNTY_STYLES: ArmoryItem[] = [
  {
    id: "gold_coin",
    name: "Gold Coin",
    icon: "💰",
    color: "#1A1000",
    accent: "#DAA520",
    unlockReq: 0,
  },
  {
    id: "silver_cache",
    name: "Silver Cache",
    icon: "🪙",
    color: "#1A1E22",
    accent: "#C0CCDA",
    unlockReq: 0,
  },
  {
    id: "ruby",
    name: "Ruby",
    icon: "💎",
    color: "#220808",
    accent: "#FF2244",
    unlockReq: 5,
    unlockLabel: "5 battles",
  },
  {
    id: "emerald",
    name: "Emerald",
    icon: "💚",
    color: "#051A0A",
    accent: "#22DD66",
    unlockReq: 20,
    unlockLabel: "20 battles",
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: "💠",
    color: "#080E1E",
    accent: "#99EEFF",
    unlockReq: 0,
    scoreReq: 1000000,
    unlockLabel: "1M spoils in a battle",
  },
  {
    id: "eternal_crown",
    name: "Eternal Crown",
    icon: "👑",
    color: "#200840",
    accent: "#FFCC00",
    unlockReq: 0,
    streakReq: 60,
    unlockLabel: "60 day streak",
  },
]

// `sigil` is the monochrome treasure glyph both the in-game card and the rack
// miniatures now render (ui/sigils.tsx). The old emoji `icon` field was retired
// when MiniBounty adopted the Sigil — nothing reads it anymore.
export const BOUNTY_STYLE_CONFIG: Record<
  string,
  {
    backColor: string
    accent: string
    frontBg: string
    textColor: string
    sigil: SigilSpec
  }
> = {
  gold_coin: {
    backColor: "#2A1A04",
    accent: "#DAA520",
    frontBg: "#FFF8E8",
    textColor: "#8B6200",
    sigil: { fam: "mci", name: "sack" },
  },
  silver_cache: {
    backColor: "#1A1E22",
    accent: "#C0CCDA",
    frontBg: "#F4F6F8",
    textColor: "#445566",
    sigil: { fam: "mci", name: "circle-multiple" },
  },
  ruby: {
    backColor: "#360A0A",
    accent: "#FF2244",
    frontBg: "#FFF0F0",
    textColor: "#AA0022",
    sigil: { fam: "mci", name: "diamond-stone" },
  },
  emerald: {
    backColor: "#082A10",
    accent: "#22DD66",
    frontBg: "#EEFFF4",
    textColor: "#116622",
    sigil: { fam: "mci", name: "diamond-stone" },
  },
  diamond: {
    backColor: "#0C1830",
    accent: "#99EEFF",
    frontBg: "#EEF8FF",
    textColor: "#1166AA",
    sigil: { fam: "mci", name: "diamond-stone" },
  },
  eternal_crown: {
    // 60-day streak
    backColor: "#200840",
    accent: "#FFCC00",
    frontBg: "#FFFAEE",
    textColor: "#AA7700",
    sigil: { fam: "mci", name: "crown" },
  },
}

const STORAGE_KEYS = {
  gamesPlayed: StorageKeys.gamesPlayed,
  selectedBack: StorageKeys.cardBack,
  selectedField: StorageKeys.battlefield,
  selectedTable: StorageKeys.warTable,
  selectedBounty: StorageKeys.bountyStyle,
  bestStreak: StorageKeys.bestStreak,
}

type TabType = "cards" | "fields" | "bounty" | "table"

const TAB_CONFIG: { key: TabType; icon: IconName; label: string }[] = [
  { key: "cards", icon: "cards", label: "Backs" },
  { key: "fields", icon: "image-filter-hdr", label: "Fields" },
  { key: "bounty", icon: "sack", label: "Bounty" },
  { key: "table", icon: "table-furniture", label: "Table" },
]

const RACKS: Record<TabType, ArmoryItem[]> = {
  cards: CARD_BACKS,
  fields: BATTLEFIELDS,
  bounty: BOUNTY_STYLES,
  table: WAR_TABLES,
}

const ALL_PIECES = [
  ...CARD_BACKS,
  ...BATTLEFIELDS,
  ...BOUNTY_STYLES,
  ...WAR_TABLES,
]

const findOr = (arr: ArmoryItem[], id: string) =>
  arr.find((i) => i.id === id) || arr[0]

// One-time migration: clears legacy cosmetic IDs that no longer exist.
// Players will see defaults but can re-pick any unlocked item.
const ARMORY_MIGRATION_KEY = StorageKeys.armoryMigratedV2

export const migrateArmoryIfNeeded = async () => {
  try {
    const done = await AsyncStorage.getItem(ARMORY_MIGRATION_KEY)
    if (done) return

    const validIds = {
      [STORAGE_KEYS.selectedBack]: CARD_BACKS.map((i) => i.id),
      [STORAGE_KEYS.selectedField]: BATTLEFIELDS.map((i) => i.id),
      [STORAGE_KEYS.selectedTable]: WAR_TABLES.map((i) => i.id),
      [STORAGE_KEYS.selectedBounty]: BOUNTY_STYLES.map((i) => i.id),
    }

    for (const [key, valid] of Object.entries(validIds)) {
      const current = await AsyncStorage.getItem(key)
      if (current && !valid.includes(current)) {
        await AsyncStorage.removeItem(key)
      }
    }

    await AsyncStorage.setItem(ARMORY_MIGRATION_KEY, "1")
  } catch (err) {
    logError("Armory.migrateArmoryIfNeeded", err)
  }
}

export const getSelectedTheme = async (): Promise<ThemeConfig> => {
  try {
    const backId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedBack)) || "oak_shield"
    const fieldId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedField)) || "forest_camp"
    const tableId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedTable)) || "oak_plank"
    const bountyId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedBounty)) || "gold_coin"
    const back = CARD_BACKS.find((b) => b.id === backId) || CARD_BACKS[0]
    const field = BATTLEFIELDS.find((f) => f.id === fieldId) || BATTLEFIELDS[0]
    return {
      cardBack: back.id,
      cardBackColor: back.color,
      battlefield: field.id,
      battlefieldColor: field.color,
      warTable: tableId,
      bountyStyle: bountyId,
    }
  } catch {
    return {
      cardBack: "oak_shield",
      cardBackColor: "#1A1410",
      battlefield: "forest_camp",
      battlefieldColor: "#0A1F10",
      warTable: "oak_plank",
      bountyStyle: "gold_coin",
    }
  }
}

// The equipped loadout as ArmoryItems — lets other screens (pre-battle muster)
// render the player's real kit through the same MiniBack/MiniBounty renderers.
export const getEquippedKit = (theme: ThemeConfig) => ({
  back: findOr(CARD_BACKS, theme.cardBack),
  bounty: findOr(BOUNTY_STYLES, theme.bountyStyle || "gold_coin"),
  table: findOr(WAR_TABLES, theme.warTable || "oak_plank"),
  field: findOr(BATTLEFIELDS, theme.battlefield),
})

export const incrementGamesPlayed = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.gamesPlayed)
    const count = (raw ? parseInt(raw) : 0) + 1
    await AsyncStorage.setItem(STORAGE_KEYS.gamesPlayed, count.toString())
    return count
  } catch {
    return 1
  }
}

// ── Miniature renderers ──────────────────────────────────────────────────────
// Every rack tile and stage prop re-renders the item's true in-game look
// (Card.tsx back grammar, Game.tsx war bar) at preview scale. Fine engraving
// (runes, diagonals, edge dots) only appears above the legibility threshold.

const RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]
const RUNE_POS = [
  { top: 4, left: 5 },
  { top: 4, right: 5 },
  { bottom: 4, left: 5 },
  { bottom: 4, right: 5 },
] as const

const inset = (n: number) =>
  ({ position: "absolute", top: n, left: n, right: n, bottom: n }) as const

// In-game CardBackView in miniature: every engraving line takes the equipped
// item's accent metal (ui/sigils.tsx BACK_STYLES) and the crest is the same
// monochrome Sigil the live card inks — a true mirror, not an emoji-in-a-circle.
// Exported so the pre-battle "war kit" muster can reuse the canonical renderer.
export const MiniBack = ({ item, w, h }: { item: ArmoryItem; w: number; h: number }) => {
  const back = BACK_STYLES[item.color] || DEFAULT_BACK_STYLE
  const a = back.accent
  const detailed = w >= 70
  const r = Math.round(Math.min(w, 52) * 0.19)
  const medal = Math.round(w * 0.58)
  return (
    <View
      style={[
        m.backRoot,
        { width: w, height: h, borderRadius: r, backgroundColor: item.color, borderColor: a + "59" },
      ]}
    >
      <View
        style={[
          inset(Math.max(3, Math.round(w * 0.055))),
          m.backFrameOuter,
          { borderRadius: Math.max(3, r - 3), borderColor: a + "8C" },
        ]}
      />
      <View
        style={[
          inset(Math.max(6, Math.round(w * 0.11))),
          m.backFrameInner,
          { borderRadius: Math.max(2, r - 6), borderColor: a + "45" },
        ]}
      />
      <View style={[m.backCrossH, { backgroundColor: a + "1A" }]} />
      <View style={[m.backCrossV, { backgroundColor: a + "1A" }]} />
      {detailed && (
        <View style={[m.backDiag, { transform: [{ rotate: "30deg" }], backgroundColor: a + "12" }]} />
      )}
      {detailed && (
        <View style={[m.backDiag, { transform: [{ rotate: "-30deg" }], backgroundColor: a + "12" }]} />
      )}
      <View
        style={[
          m.backMedal,
          { width: medal, height: medal, borderRadius: medal / 2, borderColor: a + "B3" },
        ]}
      >
        <View
          style={[
            inset(Math.max(2, Math.round(medal * 0.09))),
            m.backMedalRing,
            { borderRadius: medal / 2, borderColor: a + "59" },
          ]}
        />
        <Sigil sigil={back.sigil} size={Math.round(medal * 0.46)} color={a + "F0"} />
      </View>
      {detailed &&
        RUNES.map((g, i) => (
          <Text key={g} style={[m.backRune, RUNE_POS[i], { color: a + "73" }]}>
            {g}
          </Text>
        ))}
    </View>
  )
}

// In-game BountyCardBack in miniature: accent-jeweled frames, ✦ corners.
export const MiniBounty = ({ item, w, h }: { item: ArmoryItem; w: number; h: number }) => {
  const bc = BOUNTY_STYLE_CONFIG[item.id] || {
    backColor: item.color,
    accent: item.accent,
    sigil: BOUNTY_FALLBACK_SIGIL,
  }
  const detailed = w >= 70
  const r = Math.round(Math.min(w, 52) * 0.19)
  const medal = Math.round(w * 0.56)
  return (
    <View
      style={[
        m.bountyRoot,
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: bc.backColor,
          borderColor: bc.accent,
        },
      ]}
    >
      <View
        style={[
          inset(Math.max(3, Math.round(w * 0.055))),
          { borderRadius: Math.max(3, r - 3), borderWidth: 1, borderColor: withAlpha(bc.accent, 0.55) },
        ]}
      />
      <View
        style={[
          inset(Math.max(6, Math.round(w * 0.11))),
          { borderRadius: Math.max(2, r - 6), borderWidth: 0.5, borderColor: withAlpha(bc.accent, 0.3) },
        ]}
      />
      <View style={[m.backCrossH, { backgroundColor: withAlpha(bc.accent, 0.1) }]} />
      <View style={[m.backCrossV, { backgroundColor: withAlpha(bc.accent, 0.1) }]} />
      <View
        style={[
          m.backMedal,
          {
            width: medal,
            height: medal,
            borderRadius: medal / 2,
            backgroundColor: withAlpha(bc.accent, 0.13),
            borderColor: bc.accent,
          },
        ]}
      >
        <View
          style={[
            inset(Math.max(2, Math.round(medal * 0.09))),
            m.backMedalRing,
            { borderRadius: medal / 2, borderColor: withAlpha(bc.accent, 0.45) },
          ]}
        />
        <Sigil
          sigil={bc.sigil || BOUNTY_FALLBACK_SIGIL}
          size={Math.round(medal * 0.44)}
          color={bc.accent}
        />
      </View>
      {detailed &&
        RUNE_POS.map((pos, i) => (
          <Text key={i} style={[m.bountyStar, pos, { color: bc.accent }]}>
            ✦
          </Text>
        ))}
      {detailed && (
        <View style={[m.bountyShine, { backgroundColor: withAlpha(bc.accent, 0.04) }]} />
      )}
    </View>
  )
}

// Battlefield felt swatch: vignette, emblem watermark, accent horizon.
const MiniField = ({ item, w, h }: { item: ArmoryItem; w: number; h: number }) => (
  <View style={[m.fieldRoot, { width: w, height: h, backgroundColor: item.color }]}>
    <View style={[inset(2), m.fieldVignette]} />
    <View style={[m.fieldShade]} />
    <Text style={[m.fieldMark, { fontSize: Math.round(h * 0.42) }]}>{item.icon}</Text>
    <View
      style={[m.fieldHorizon, { bottom: Math.round(h * 0.2), backgroundColor: withAlpha(item.accent, 0.35) }]}
    />
  </View>
)

// Battlement teeth — the in-game war bar's crenellated top edge (Wall.tsx).
const Teeth = ({ tint, count }: { tint: string; count: number }) => (
  <View style={m.teethRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[m.tooth, { backgroundColor: tint }]} />
    ))}
  </View>
)

// War-table plank with battlements, accent hairline and wood grain.
const MiniTable = ({ item, w, h }: { item: ArmoryItem; w: number; h: number }) => {
  const plankH = Math.round(h * 0.52)
  return (
    <View style={[m.tableRoot, { width: w, height: h }]}>
      <View
        style={[
          m.tablePlank,
          {
            height: plankH,
            backgroundColor: item.color,
            borderTopColor: withAlpha(item.accent, 0.4),
          },
        ]}
      >
        <View style={[m.tableGrain, { top: "32%" }]} />
        <View style={[m.tableGrain, { top: "66%" }]} />
        <Text style={[m.tableDot, { color: withAlpha(item.accent, 0.6) }]}>◆</Text>
      </View>
      <View style={[m.tableTeethWrap, { bottom: plankH }]}>
        <Teeth tint={item.color} count={Math.max(3, Math.floor(w / 20))} />
      </View>
    </View>
  )
}

const m = StyleSheet.create({
  // Engraving colors (root border, frames, cross, diagonals, medallion rings,
  // runes) are passed inline from the back's accent metal — see MiniBack/MiniBounty.
  backRoot: {
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  backFrameOuter: { borderWidth: 1 },
  backFrameInner: { borderWidth: 0.5 },
  backCrossH: {
    position: "absolute",
    top: "50%",
    left: 7,
    right: 7,
    height: 0.5,
  },
  backCrossV: {
    position: "absolute",
    left: "50%",
    top: 7,
    bottom: 7,
    width: 0.5,
  },
  backDiag: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
  },
  // Dark well so the accent Sigil reads as inlaid metal (matches Card.tsx shield).
  backMedal: {
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  backMedalRing: { borderWidth: 0.5 },
  backRune: { position: "absolute", fontSize: 7 },

  bountyRoot: {
    borderWidth: 1.5,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  bountyStar: { position: "absolute", fontSize: 7 },
  bountyShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },

  fieldRoot: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldVignette: { borderRadius: 6, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.25)" },
  fieldShade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "26%",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  fieldMark: { opacity: 0.55 },
  fieldHorizon: { position: "absolute", left: 7, right: 7, height: 1 },

  teethRow: { flexDirection: "row", justifyContent: "center", gap: 7 },
  tooth: { width: 11, height: 5, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  tableRoot: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "#081009",
    overflow: "hidden",
  },
  tablePlank: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    justifyContent: "center",
  },
  tableGrain: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tableDot: { alignSelf: "center", fontSize: 7 },
  tableTeethWrap: { position: "absolute", left: 0, right: 0 },
})

// ── Rack tile ────────────────────────────────────────────────────────────────
// Outer chrome shared by every category: ◆ corners, gold selection border +
// check badge, dimmed miniature + lock/key chip when locked. Remounts per tab
// (keyed `${tab}-${id}`) so the cascade replays on every rack swap.

interface RackTileProps {
  item: ArmoryItem
  index: number
  w: number
  h: number
  miniH: number
  selected: boolean
  unlocked: boolean
  onPress: () => void
  children: React.ReactNode
}

const RackTile = ({
  item,
  index,
  w,
  h,
  miniH,
  selected,
  unlocked,
  onPress,
  children,
}: RackTileProps) => {
  const a = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 220,
      delay: Math.min(index, 10) * 30,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [])

  const streakLock = !unlocked && !!item.streakReq
  const skillLock = !unlocked && (!!item.comboReq || !!item.scoreReq)

  return (
    <Animated.View
      style={{
        opacity: a,
        transform: [
          { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          t.tile,
          { width: w, height: h },
          unlocked ? t.tileOn : streakLock ? t.tileStreak : t.tileLocked,
          selected && t.tileSel,
        ]}
        onPress={onPress}
        disabled={!unlocked}
        activeOpacity={0.8}
      >
        {unlocked && (
          <>
            <Text style={[t.corn, { top: 3, left: 5 }]}>◆</Text>
            <Text style={[t.corn, { top: 3, right: 5 }]}>◆</Text>
            <Text style={[t.corn, { bottom: 3, left: 5 }]}>◆</Text>
            <Text style={[t.corn, { bottom: 3, right: 5 }]}>◆</Text>
          </>
        )}

        <View style={[t.miniWrap, { height: miniH }]}>
          <View style={!unlocked && { opacity: 0.3 }}>{children}</View>
          {!unlocked && (
            <View style={[t.lockChip, streakLock && t.lockChipStreak]}>
              <Icon
                name={
                  streakLock
                    ? "key-variant"
                    : item.comboReq
                      ? "flag-variant"
                      : item.scoreReq
                        ? "sack"
                        : "lock"
                }
                size={18}
                color={
                  streakLock
                    ? color.ember
                    : skillLock
                      ? color.gold
                      : color.steel
                }
              />
            </View>
          )}
        </View>

        <Text
          style={[
            t.name,
            {
              color: unlocked
                ? item.accent
                : streakLock
                  ? "rgba(255,140,0,0.55)"
                  : skillLock
                    ? "rgba(232,197,71,0.55)"
                    : color.steel,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {item.name}
        </Text>
        {!unlocked && (
          <Text
            style={[
              t.req,
              streakLock && { color: "rgba(255,140,0,0.4)" },
              skillLock && { color: "rgba(232,197,71,0.45)" },
            ]}
          >
            {(item.unlockLabel || "").toUpperCase()}
          </Text>
        )}

        {selected && (
          <View style={t.check}>
            <Icon name="check" size={12} color={color.ink} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

const t = StyleSheet.create({
  tile: {
    borderRadius: 10,
    alignItems: "center",
    paddingTop: 7,
    overflow: "hidden",
  },
  tileOn: {
    backgroundColor: color.bgRaised,
    borderWidth: 1,
    borderColor: color.goldLine,
  },
  tileLocked: {
    backgroundColor: "rgba(10,15,12,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tileStreak: {
    backgroundColor: "rgba(40,10,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,100,0,0.15)",
  },
  tileSel: {
    borderWidth: 2,
    borderColor: color.gold,
    shadowColor: color.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  corn: { position: "absolute", fontSize: 6, color: color.goldLine, zIndex: 2 },
  miniWrap: {
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  // Prominent lock medallion — sits clearly on top of the dimmed preview so a
  // locked item never reads as selectable.
  lockChip: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(6,12,7,0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(143,163,176,0.5)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  lockChipStreak: { borderColor: "rgba(255,140,0,0.5)" },
  name: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 4,
    maxWidth: "92%",
    textAlign: "center",
  },
  req: {
    color: "rgba(143,163,176,0.6)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 1,
  },
  check: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: color.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: color.bgBase,
    zIndex: 3,
  },
})

// ── Screen ───────────────────────────────────────────────────────────────────

const Armory = ({ onBack }: ArmoryProps) => {
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [selectedBack, setSelectedBack] = useState("oak_shield")
  const [selectedField, setSelectedField] = useState("forest_camp")
  const [selectedTable, setSelectedTable] = useState("oak_plank")
  const [selectedBounty, setSelectedBounty] = useState("gold_coin")
  const [tab, setTab] = useState<TabType>("cards")
  // Felt cross-fade: base layer holds the previous colour, the overlay fades
  // the new one in (opacity stays on the native driver; bg colour can't).
  const [felt, setFelt] = useState({ base: "#0A1F10", over: "#0A1F10" })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current
  const feltFade = useRef(new Animated.Value(1)).current
  const dealBack = useRef(new Animated.Value(0)).current
  const dealBounty = useRef(new Animated.Value(0)).current
  const shelfDeal = useRef(new Animated.Value(0)).current
  // The forge moment — equipping strikes the stage: a gold flash spikes and
  // decays, a FORGED stamp punches in and fades. Event-driven, idle at 0.
  const forgeFlash = useRef(new Animated.Value(0)).current
  const forgeStamp = useRef(new Animated.Value(0)).current

  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    ;(async () => {
      const gamesStr = await AsyncStorage.getItem(STORAGE_KEYS.gamesPlayed)
      const streakStr = await AsyncStorage.getItem(STORAGE_KEYS.bestStreak)
      setGamesPlayed(gamesStr ? parseInt(gamesStr) : 0)
      setBestStreak(streakStr ? parseInt(streakStr) : 0)
      // Skill-gate stats: lifetime best combo (written by Game.tsx) and the
      // best single-battle score from the local score history.
      const comboStr = await AsyncStorage.getItem(StorageKeys.bestComboEver)
      setBestCombo(comboStr ? parseInt(comboStr) : 0)
      try {
        const scoresRaw = await AsyncStorage.getItem(StorageKeys.localScores)
        const scores = scoresRaw ? JSON.parse(scoresRaw) : []
        setBestScore(scores[0]?.score || 0)
      } catch {
        setBestScore(0)
      }
      setSelectedBack(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedBack)) || "oak_shield",
      )
      const fieldId =
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedField)) ||
        "forest_camp"
      setSelectedField(fieldId)
      const fieldColor = findOr(BATTLEFIELDS, fieldId).color
      setFelt({ base: fieldColor, over: fieldColor })
      setSelectedTable(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedTable)) || "oak_plank",
      )
      setSelectedBounty(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedBounty)) ||
          "gold_coin",
      )
    })()
  }, [])

  useEffect(() => {
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
    // The kit deals onto the stage: shelf seats first, then the bounty card,
    // the equipped back lands last (champion-last, like the Hall's trio).
    const seat = (v: Animated.Value, dur: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: dur,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    Animated.stagger(110, [seat(shelfDeal, 260), seat(dealBounty, 300), seat(dealBack, 340)]).start()
  }, [])

  const redeal = (v: Animated.Value) => {
    v.setValue(0)
    Animated.timing(v, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }

  // The strike: forge sound + hammer haptic, the stage flashes gold, the
  // FORGED stamp punches in (back-eased) and fades while the gear re-deals.
  const forgeMoment = () => {
    SoundService.playForge()
    forgeFlash.setValue(0)
    Animated.sequence([
      Animated.timing(forgeFlash, {
        toValue: 1,
        duration: 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(forgeFlash, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
    forgeStamp.setValue(0)
    Animated.sequence([
      Animated.spring(forgeStamp, {
        toValue: 1,
        speed: 26,
        bounciness: 14,
        useNativeDriver: true,
      }),
      Animated.delay(520),
      Animated.timing(forgeStamp, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start()
  }

  const selectItem = async (id: string) => {
    try {
      switch (tab) {
        case "cards":
          if (id !== selectedBack) {
            setSelectedBack(id)
            redeal(dealBack)
            forgeMoment()
          }
          await AsyncStorage.setItem(STORAGE_KEYS.selectedBack, id)
          break
        case "fields":
          if (id !== selectedField) {
            setFelt((f) => ({ base: f.over, over: findOr(BATTLEFIELDS, id).color }))
            feltFade.setValue(0)
            Animated.timing(feltFade, {
              toValue: 1,
              duration: 260,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start()
            setSelectedField(id)
            forgeMoment()
          }
          await AsyncStorage.setItem(STORAGE_KEYS.selectedField, id)
          break
        case "bounty":
          if (id !== selectedBounty) {
            setSelectedBounty(id)
            redeal(dealBounty)
            forgeMoment()
          }
          await AsyncStorage.setItem(STORAGE_KEYS.selectedBounty, id)
          break
        case "table":
          if (id !== selectedTable) {
            setSelectedTable(id)
            redeal(shelfDeal)
            forgeMoment()
          }
          await AsyncStorage.setItem(STORAGE_KEYS.selectedTable, id)
          break
      }
    } catch (err) {
      logError("Armory.selectItem", err)
    }
  }

  const switchTab = (next: TabType) => {
    if (next === tab) return
    SoundService.playDeckDraw()
    setTab(next)
  }

  const isUnlocked = (i: ArmoryItem) =>
    i.streakReq
      ? bestStreak >= i.streakReq
      : i.comboReq
        ? bestCombo >= i.comboReq
        : i.scoreReq
          ? bestScore >= i.scoreReq
          : gamesPlayed >= i.unlockReq

  const items = RACKS[tab]
  const selectedByTab: Record<TabType, string> = {
    cards: selectedBack,
    fields: selectedField,
    bounty: selectedBounty,
    table: selectedTable,
  }
  const selected = selectedByTab[tab]

  const unlockedTotal = ALL_PIECES.filter(isUnlocked).length
  const nextLock = items.find((i) => !isUnlocked(i))

  const backItem = findOr(CARD_BACKS, selectedBack)
  const fieldItem = findOr(BATTLEFIELDS, selectedField)
  const tableItem = findOr(WAR_TABLES, selectedTable)
  const bountyItem = findOr(BOUNTY_STYLES, selectedBounty)

  // ── Geometry (landscape-first; §5 lesson: no module-scope Dimensions) ──
  const padL = Math.max(14, insets.left)
  const padR = Math.max(14, insets.right)
  const stageW = Math.round(Math.min(300, Math.max(246, winW * 0.33)))
  const dioramaH = Math.max(170, winH - 158)

  const rackW = winW - padL - padR - stageW - 12
  const cols = rackW >= 4 * 104 + 24 ? 4 : 3
  const tileW = Math.min(134, Math.floor((rackW - (cols - 1) * 8) / cols))
  const tileH = Math.round(tileW * 0.94)
  const miniH = tileH - 40

  // Stage prop sizes — the duo stands on the shelf seam.
  const shelfH = Math.max(44, Math.round(dioramaH * 0.27))
  const backH = Math.round(Math.min(dioramaH * 0.56, 132))
  const backW = Math.round(backH / 1.42)
  const bountyH = Math.round(backH * 0.85)
  const bountyW = Math.round(bountyH / 1.42)

  const dealStyle = (v: Animated.Value, rot: number) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      {
        rotate: v.interpolate({
          inputRange: [0, 1],
          outputRange: [`${rot * 2.4}deg`, `${rot}deg`],
        }),
      },
    ],
  })

  const renderMini = (item: ArmoryItem) => {
    switch (tab) {
      case "cards":
        return <MiniBack item={item} w={Math.round(miniH / 1.42)} h={miniH} />
      case "bounty":
        return <MiniBounty item={item} w={Math.round(miniH / 1.42)} h={miniH} />
      case "fields":
        return <MiniField item={item} w={tileW - 18} h={miniH} />
      case "table":
        return <MiniTable item={item} w={tileW - 18} h={miniH} />
    }
  }

  // Next-unlock ladder for the active rack (§4.9.3 progress bar). Ladder kind
  // mirrors the gate: streak = ember fire, combo = banner flag, spoils = sack,
  // battles = crossed swords.
  const progress = nextLock
    ? nextLock.streakReq
      ? {
          icon: "fire" as IconName,
          tint: color.ember,
          cur: Math.min(bestStreak, nextLock.streakReq),
          req: nextLock.streakReq,
        }
      : nextLock.comboReq
        ? {
            icon: "flag-variant" as IconName,
            tint: color.gold,
            cur: Math.min(bestCombo, nextLock.comboReq),
            req: nextLock.comboReq,
          }
        : nextLock.scoreReq
          ? {
              icon: "sack" as IconName,
              tint: color.gold,
              cur: Math.min(bestScore, nextLock.scoreReq),
              req: nextLock.scoreReq,
            }
          : {
              icon: "sword-cross" as IconName,
              tint: color.gold,
              cur: Math.min(gamesPlayed, nextLock.unlockReq),
              req: nextLock.unlockReq,
            }
    : null

  return (
    <View style={[z.container, { paddingLeft: padL, paddingRight: padR }]}>
      {/* Background — the armoury vault */}
      <View style={z.bg} pointerEvents="none">
        <Animated.View style={[z.bgGlow, { opacity: glowPulse }]} />
        <Text style={[z.bgRune, { top: "8%", left: "3%" }]}>ᚠ</Text>
        <Text style={[z.bgRune, { top: "12%", right: "4%" }]}>ᚦ</Text>
        <Text style={[z.bgRune, { bottom: "16%", left: "5%" }]}>ᚱ</Text>
        <Text style={[z.bgRune, { bottom: "20%", right: "3%" }]}>ᛟ</Text>
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
              <Icon name="shield-half-full" size={18} color={color.gold} />
              <Text style={z.hTitle}>ARMORY</Text>
            </View>
            <Text style={z.hSub} numberOfLines={1}>
              {gamesPlayed} BATTLES WAGED · {unlockedTotal}/{ALL_PIECES.length}{" "}
              PIECES CLAIMED
            </Text>
          </View>
          <View style={z.hOrn}>
            <View style={z.hLineS} />
            <Text style={z.hDot}>◆</Text>
            <View style={z.hLine} />
          </View>
        </View>

        <View style={z.contentRow}>
          {/* ── Left: the war-kit stage ── */}
          <View style={{ width: stageW }}>
            <View style={[z.stage, { height: dioramaH }]}>
              {/* battlefield felt (cross-fades on re-equip) */}
              <View style={[inset(0), { backgroundColor: felt.base }]} />
              <Animated.View
                style={[inset(0), { backgroundColor: felt.over, opacity: feltFade }]}
              />
              <View style={[inset(5), z.stageVignette]} pointerEvents="none" />

              {/* emblem watermark breathes on the shared pulse */}
              <Animated.Text
                style={[
                  z.stageMark,
                  {
                    fontSize: Math.round(dioramaH * 0.3),
                    top: Math.round(dioramaH * 0.08),
                    opacity: glowPulse.interpolate({
                      inputRange: [0.3, 0.5],
                      outputRange: [0.09, 0.16],
                    }),
                  },
                ]}
              >
                {fieldItem.icon}
              </Animated.Text>

              <Text style={z.stageLabel}>YOUR WAR KIT</Text>

              {/* the equipped duo, standing on the shelf */}
              <View
                style={[z.duoRow, { bottom: shelfH - 12 }]}
                pointerEvents="none"
              >
                <Animated.View style={[z.duoFront, dealStyle(dealBack, -6)]}>
                  <MiniBack item={backItem} w={backW} h={backH} />
                </Animated.View>
                <Animated.View
                  style={[
                    z.duoRear,
                    { marginLeft: -Math.round(backW * 0.3) },
                    dealStyle(dealBounty, 9),
                  ]}
                >
                  <MiniBounty item={bountyItem} w={bountyW} h={bountyH} />
                </Animated.View>
              </View>

              {/* war-table shelf: battlements + plank (in-game war bar) */}
              <Animated.View
                style={[
                  z.shelfWrap,
                  { height: shelfH },
                  {
                    opacity: shelfDeal,
                    transform: [
                      {
                        translateY: shelfDeal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Teeth tint={tableItem.color} count={Math.floor(stageW / 20)} />
                <View style={z.shelfGoldLine} />
                <View
                  style={[
                    z.plank,
                    {
                      backgroundColor: tableItem.color,
                      borderTopColor: withAlpha(tableItem.accent, 0.25),
                    },
                  ]}
                >
                  <View style={[z.plankGrain, { top: "30%" }]} />
                  <View style={[z.plankGrain, { top: "64%" }]} />
                  <Text style={[z.plankDot, { color: withAlpha(tableItem.accent, 0.55) }]}>
                    ◆
                  </Text>
                </View>
              </Animated.View>

              {/* the forge strike — flash + stamp, idle at opacity 0 */}
              <Animated.View
                pointerEvents="none"
                style={[
                  inset(0),
                  z.forgeFlashOverlay,
                  {
                    opacity: forgeFlash.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.32],
                    }),
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  z.forgeStamp,
                  {
                    opacity: forgeStamp,
                    transform: [
                      {
                        scale: forgeStamp.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1.6, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Icon name="anvil" size={13} color={color.gold} />
                <Text style={z.forgeStampText}>FORGED</Text>
              </Animated.View>
            </View>

            {/* next-unlock ladder for the active rack */}
            <View style={z.forge}>
              {nextLock && progress ? (
                <>
                  <View style={z.forgeRow}>
                    <Icon name={progress.icon} size={11} color={progress.tint} />
                    <Text style={z.forgeLabel} numberOfLines={1}>
                      NEXT: {nextLock.name.toUpperCase()}
                    </Text>
                    <Text style={[z.forgeCount, { color: progress.tint }]}>
                      {progress.cur}/{progress.req}
                    </Text>
                  </View>
                  <View style={z.forgeTrack}>
                    <View
                      style={[
                        z.forgeFill,
                        {
                          backgroundColor: progress.tint,
                          width: `${Math.round(
                            Math.min(1, progress.cur / progress.req) * 100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={z.forgeRow}>
                    <Icon name="check-decagram" size={11} color={color.gold} />
                    <Text style={z.forgeLabel}>RACK FULLY CLAIMED</Text>
                  </View>
                  <View style={z.forgeTrack}>
                    <View
                      style={[
                        z.forgeFill,
                        { backgroundColor: color.goldFaded, width: "100%" },
                      ]}
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── Right: the racks ── */}
          <View style={z.rack}>
            <View style={z.tabs}>
              {TAB_CONFIG.map((tc) => {
                const on = tab === tc.key
                return (
                  <TouchableOpacity
                    key={tc.key}
                    style={[z.tab, on && z.tabOn]}
                    onPress={() => switchTab(tc.key)}
                    activeOpacity={0.85}
                  >
                    <Icon
                      name={tc.icon}
                      size={13}
                      color={on ? color.ink : color.goldFaded}
                    />
                    <Text style={[z.tabTxt, on && z.tabTxtOn]}>{tc.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <ScrollView
              style={z.scroll}
              contentContainerStyle={z.grid}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item, i) => (
                <RackTile
                  key={`${tab}-${item.id}`}
                  item={item}
                  index={i}
                  w={tileW}
                  h={tileH}
                  miniH={miniH}
                  selected={selected === item.id}
                  unlocked={isUnlocked(item)}
                  onPress={() => selectItem(item.id)}
                >
                  {renderMini(item)}
                </RackTile>
              ))}
            </ScrollView>
          </View>
        </View>

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
    top: "10%",
    left: "5%",
    width: "36%",
    height: "55%",
    borderRadius: 250,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.04)",
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
  contentRow: { flex: 1, flexDirection: "row", gap: 12 },

  // Stage (left)
  stage: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.goldLine,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  stageVignette: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.22)",
  },
  stageMark: { position: "absolute", alignSelf: "center" },
  stageLabel: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  // The forge strike
  forgeFlashOverlay: {
    backgroundColor: "#F0D26E",
    borderRadius: 14,
  },
  forgeStamp: {
    position: "absolute",
    alignSelf: "center",
    top: "38%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(8,16,9,0.88)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.7)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  forgeStampText: {
    fontFamily: font.heading,
    color: color.gold,
    fontSize: 12,
    letterSpacing: 3,
  },
  duoRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 2,
  },
  duoFront: {
    zIndex: 2,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  duoRear: {
    zIndex: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  shelfWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  shelfGoldLine: {
    height: 1,
    backgroundColor: "rgba(232,197,71,0.16)",
  },
  plank: {
    flex: 1,
    borderTopWidth: 1,
    justifyContent: "center",
  },
  plankGrain: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  plankDot: { alignSelf: "center", fontSize: 9 },

  // Next-unlock ladder under the stage
  forge: {
    marginTop: 6,
    paddingHorizontal: 2,
    gap: 4,
  },
  forgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  forgeLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  forgeCount: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  forgeTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(232,197,71,0.12)",
    overflow: "hidden",
  },
  forgeFill: { height: 3, borderRadius: 2 },

  // Rack (right)
  rack: { flex: 1 },

  // Tabs — face-down / face-up: the active tab flips to parchment (§3 TabBar)
  tabs: {
    flexDirection: "row",
    marginBottom: 8,
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
    gap: 5,
  },
  tabOn: { backgroundColor: color.parchment },
  tabTxt: {
    color: color.goldFaded,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tabTxtOn: { color: color.ink },

  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 8,
  },
})

export default Armory
