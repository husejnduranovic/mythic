import React, { useEffect, useRef, useState } from "react"
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SoundService } from "../services/SoundService"
import { StorageKeys } from "../services/storageKeys"
import { logError } from "../services/logError"
import ReturnToCastle from "./ReturnToCastle"

interface ArmoryProps {
  onBack: () => void
}

export interface ThemeConfig {
  cardBack: string
  cardBackColor: string
  battlefield: string
  battlefieldColor: string
  wildStyle?: string
  warTable?: string
  bountyStyle?: string
}

export const BACK_ICONS: Record<string, string> = {
  "#1A1410": "🛡", // oak_shield
  "#0E1A2E": "⚔", // steel_bastion
  "#2A0E0A": "🏠", // hearthwood
  "#0C2218": "🐺", // wolf_sigil
  "#3D0D0D": "🐉", // dragon_crest
  "#2A1C00": "🦅", // eagle_pennant
  "#1E0A3C": "👑", // royal_banner
  "#1A0500": "🔥", // flame_sworn (7-day streak)
}

export const WILD_STYLE_CONFIG: Record<
  string,
  { color: string; accent: string; icon: string }
> = {
  spark: { color: "#1C1200", accent: "#FFD700", icon: "⚡" },
  steel: { color: "#1A1A1E", accent: "#C0C8D0", icon: "⚔" },
  frost: { color: "#061C2A", accent: "#66DDFF", icon: "❄️" },
  venom: { color: "#081A08", accent: "#44FF66", icon: "☠️" },
  storm: { color: "#110820", accent: "#AA66FF", icon: "🌩" },
  inferno_bolt: { color: "#1E0400", accent: "#FF4400", icon: "🔥" }, // 42-day streak
}

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

const CARD_BACKS: {
  id: string
  name: string
  icon: string
  color: string
  accent: string
  unlockReq: number
  streakReq?: number
  unlockLabel?: string
}[] = [
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
    unlockReq: 25,
    unlockLabel: "25 battles",
  },
  {
    id: "royal_banner",
    name: "Royal Banner",
    icon: "👑",
    color: "#1E0A3C",
    accent: "#C87DFF",
    unlockReq: 60,
    unlockLabel: "60 battles",
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

const BATTLEFIELDS: {
  id: string
  name: string
  icon: string
  color: string
  accent: string
  unlockReq: number
  streakReq?: number
  unlockLabel?: string
}[] = [
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

const WILD_STYLES: {
  id: string
  name: string
  icon: string
  color: string
  accent: string
  unlockReq: number
  streakReq?: number
  unlockLabel?: string
}[] = [
  {
    id: "spark",
    name: "Spark",
    icon: "⚡",
    color: "#1C1200",
    accent: "#FFD700",
    unlockReq: 0,
  },
  {
    id: "steel",
    name: "Steel Clash",
    icon: "⚔",
    color: "#1A1A1E",
    accent: "#C0C8D0",
    unlockReq: 0,
  },
  {
    id: "frost",
    name: "Frost Strike",
    icon: "❄️",
    color: "#061C2A",
    accent: "#66DDFF",
    unlockReq: 5,
    unlockLabel: "5 battles",
  },
  {
    id: "venom",
    name: "Venom Fang",
    icon: "☠️",
    color: "#081A08",
    accent: "#44FF66",
    unlockReq: 20,
    unlockLabel: "20 battles",
  },
  {
    id: "storm",
    name: "Storm Surge",
    icon: "🌩",
    color: "#110820",
    accent: "#AA66FF",
    unlockReq: 60,
    unlockLabel: "60 battles",
  },
  {
    id: "inferno_bolt",
    name: "Inferno Bolt",
    icon: "🔥",
    color: "#1E0400",
    accent: "#FF4400",
    unlockReq: 0,
    streakReq: 42,
    unlockLabel: "42 day streak",
  },
]

const WAR_TABLES: {
  id: string
  name: string
  icon: string
  color: string
  accent: string
  unlockReq: number
  streakReq?: number
  unlockLabel?: string
}[] = [
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
    unlockReq: 120,
    unlockLabel: "120 battles",
  },
]

const BOUNTY_STYLES: {
  id: string
  name: string
  icon: string
  color: string
  accent: string
  unlockReq: number
  streakReq?: number
  unlockLabel?: string
}[] = [
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
    unlockReq: 60,
    unlockLabel: "60 battles",
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

export const BOUNTY_STYLE_CONFIG: Record<
  string,
  {
    backColor: string
    accent: string
    frontBg: string
    textColor: string
    icon: string
  }
> = {
  gold_coin: {
    backColor: "#2A1A04",
    accent: "#DAA520",
    frontBg: "#FFF8E8",
    textColor: "#8B6200",
    icon: "💰",
  },
  silver_cache: {
    backColor: "#1A1E22",
    accent: "#C0CCDA",
    frontBg: "#F4F6F8",
    textColor: "#445566",
    icon: "🪙",
  },
  ruby: {
    backColor: "#360A0A",
    accent: "#FF2244",
    frontBg: "#FFF0F0",
    textColor: "#AA0022",
    icon: "💎",
  },
  emerald: {
    backColor: "#082A10",
    accent: "#22DD66",
    frontBg: "#EEFFF4",
    textColor: "#116622",
    icon: "💚",
  },
  diamond: {
    backColor: "#0C1830",
    accent: "#99EEFF",
    frontBg: "#EEF8FF",
    textColor: "#1166AA",
    icon: "💠",
  },
  eternal_crown: {
    // 60-day streak
    backColor: "#200840",
    accent: "#FFCC00",
    frontBg: "#FFFAEE",
    textColor: "#AA7700",
    icon: "👑",
  },
}

const STORAGE_KEYS = {
  gamesPlayed: StorageKeys.gamesPlayed,
  selectedBack: StorageKeys.cardBack,
  selectedField: StorageKeys.battlefield,
  selectedWild: StorageKeys.wildStyle,
  selectedTable: StorageKeys.warTable,
  selectedBounty: StorageKeys.bountyStyle,
  bestStreak: StorageKeys.bestStreak,
}

type TabType = "cards" | "fields" | "bounty" | "table"

const TAB_CONFIG: { key: TabType; icon: string; label: string }[] = [
  { key: "cards", icon: "🃏", label: "Backs" },
  { key: "fields", icon: "🏟", label: "Fields" },
  { key: "bounty", icon: "💰", label: "Bounty" },
  { key: "table", icon: "⚒", label: "Table" },
]

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
      [STORAGE_KEYS.selectedWild]: WILD_STYLES.map((i) => i.id),
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
    const wildId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedWild)) || "spark"
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
      wildStyle: wildId,
      warTable: tableId,
      bountyStyle: bountyId,
    }
  } catch {
    return {
      cardBack: "oak_shield",
      cardBackColor: "#1A1410",
      battlefield: "forest_camp",
      battlefieldColor: "#0A1F10",
      wildStyle: "spark",
      warTable: "oak_plank",
      bountyStyle: "gold_coin",
    }
  }
}

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

const Armory = ({ onBack }: ArmoryProps) => {
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [selectedBack, setSelectedBack] = useState("classic")
  const [selectedField, setSelectedField] = useState("forest")
  const [selectedWild, setSelectedWild] = useState("classic")
  const [selectedTable, setSelectedTable] = useState("classic")
  const [selectedBounty, setSelectedBounty] = useState("classic")
  const [tab, setTab] = useState<TabType>("cards")

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const glowPulse = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    ;(async () => {
      const gamesStr = await AsyncStorage.getItem(STORAGE_KEYS.gamesPlayed)
      const streakStr = await AsyncStorage.getItem(STORAGE_KEYS.bestStreak)
      setGamesPlayed(gamesStr ? parseInt(gamesStr) : 0)
      setBestStreak(streakStr ? parseInt(streakStr) : 0)
      setSelectedBack(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedBack)) || "oak_shield",
      )
      setSelectedField(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedField)) ||
          "forest_camp",
      )
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
  }, [])

  const selectItem = async (id: string) => {
    SoundService.playDeckDraw()
    switch (tab) {
      case "cards":
        setSelectedBack(id)
        await AsyncStorage.setItem(STORAGE_KEYS.selectedBack, id)
        break
      case "fields":
        setSelectedField(id)
        await AsyncStorage.setItem(STORAGE_KEYS.selectedField, id)
        break
      case "bounty":
        setSelectedBounty(id)
        await AsyncStorage.setItem(STORAGE_KEYS.selectedBounty, id)
        break
      case "table":
        setSelectedTable(id)
        await AsyncStorage.setItem(STORAGE_KEYS.selectedTable, id)
        break
    }
  }

  const getItems = () => {
    switch (tab) {
      case "cards":
        return CARD_BACKS
      case "fields":
        return BATTLEFIELDS
      case "bounty":
        return BOUNTY_STYLES
      case "table":
        return WAR_TABLES
    }
  }

  const getSelected = () => {
    switch (tab) {
      case "cards":
        return selectedBack
      case "fields":
        return selectedField
      case "bounty":
        return selectedBounty
      case "table":
        return selectedTable
    }
  }

  const items = getItems()
  const selected = getSelected()

  const unlockedCount = items.filter((i: any) =>
    i.streakReq ? bestStreak >= i.streakReq : gamesPlayed >= i.unlockReq,
  ).length

  const nextLock = items.find((i: any) =>
    i.streakReq ? bestStreak < i.streakReq : gamesPlayed < i.unlockReq,
  )

  return (
    <View style={z.container}>
      <View style={z.bgLayer} pointerEvents="none">
        <Animated.View style={[z.bgGlow, { opacity: glowPulse }]} />
        <Text style={[z.bgRune, { top: "10%", left: "4%" }]}>ᚠ</Text>
        <Text style={[z.bgRune, { top: "12%", right: "5%" }]}>ᚦ</Text>
        <Text style={[z.bgRune, { bottom: "15%", left: "8%" }]}>ᚱ</Text>
        <Text style={[z.bgRune, { bottom: "18%", right: "6%" }]}>ᛟ</Text>
        <Text style={[z.bgBeast, { top: "25%", left: "12%" }]}>🛡</Text>
        <Text style={[z.bgBeast, { bottom: "28%", right: "10%" }]}>⚔</Text>
        <View style={z.bgHLine} />
      </View>

      <Animated.View
        style={[
          z.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={z.headerWrap}>
          <View style={z.headerOrn}>
            <View style={z.headerLine} />
            <Text style={z.headerDot}>◆</Text>
            <View style={z.headerLine} />
          </View>
          <Text style={z.title}>🛡 ARMORY</Text>
          <Text style={z.statsText}>
            ⚔ {gamesPlayed} battles · {unlockedCount}/{items.length} unlocked
          </Text>
          {nextLock && (
            <Text style={z.nextUnlock}>
              {(nextLock as any).streakReq
                ? `Next streak unlock at ${(nextLock as any).streakReq} day streak`
                : `Next unlock at ${nextLock.unlockReq} battles`}
            </Text>
          )}
        </View>

        <View style={z.tabRow}>
          {TAB_CONFIG.map((t, i) => (
            <React.Fragment key={t.key}>
              {i > 0 && <View style={z.tabDiv} />}
              <TouchableOpacity
                style={[z.tab, tab === t.key && z.tabOn]}
                onPress={() => {
                  SoundService.playDeckDraw()
                  setTab(t.key)
                }}
                activeOpacity={0.85}
              >
                <Text style={[z.tabIco, tab !== t.key && { opacity: 0.4 }]}>
                  {t.icon}
                </Text>
                <Text style={[z.tabTxt, tab === t.key && z.tabTxtOn]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <ScrollView
          style={z.scroll}
          contentContainerStyle={z.grid}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item: any) => {
            const unlocked = item.streakReq
              ? bestStreak >= item.streakReq
              : gamesPlayed >= item.unlockReq
            const isSel = selected === item.id

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  z.itemCard,
                  {
                    backgroundColor: unlocked
                      ? item.color
                      : item.streakReq
                        ? "rgba(40,10,0,0.6)"
                        : "rgba(10,15,12,0.5)",
                    borderColor: isSel
                      ? item.accent
                      : unlocked
                        ? "rgba(232,197,71,0.15)"
                        : item.streakReq
                          ? "rgba(255,100,0,0.15)"
                          : "rgba(255,255,255,0.05)",
                    borderWidth: isSel ? 2 : 1,
                  },
                  isSel && {
                    shadowColor: item.accent,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    elevation: 6,
                  },
                ]}
                onPress={() => unlocked && selectItem(item.id)}
                disabled={!unlocked}
                activeOpacity={0.8}
              >
                {unlocked && (
                  <>
                    <Text
                      style={[
                        z.corn,
                        { top: 2, left: 3, color: item.accent + "60" },
                      ]}
                    >
                      ✦
                    </Text>
                    <Text
                      style={[
                        z.corn,
                        { top: 2, right: 3, color: item.accent + "60" },
                      ]}
                    >
                      ✦
                    </Text>
                    <Text
                      style={[
                        z.corn,
                        { bottom: 2, left: 3, color: item.accent + "60" },
                      ]}
                    >
                      ✦
                    </Text>
                    <Text
                      style={[
                        z.corn,
                        { bottom: 2, right: 3, color: item.accent + "60" },
                      ]}
                    >
                      ✦
                    </Text>
                  </>
                )}

                <Text
                  style={[
                    z.itemIcon,
                    unlocked && {
                      textShadowColor: item.accent,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    },
                  ]}
                >
                  {unlocked ? item.icon : item.streakReq ? "🗝" : "🔒"}
                </Text>

                <Text
                  style={[
                    z.itemName,
                    unlocked && { color: item.accent },
                    !unlocked && z.itemLocked,
                    !unlocked &&
                      item.streakReq && { color: "rgba(255,140,0,0.5)" },
                  ]}
                  numberOfLines={1}
                >
                  {unlocked ? item.name : item.unlockLabel}
                </Text>

                {isSel && (
                  <View style={[z.check, { backgroundColor: item.accent }]}>
                    <Text style={z.checkTxt}>✓</Text>
                  </View>
                )}

                {!unlocked && (
                  <View
                    style={[
                      z.lockBadge,
                      item.streakReq && {
                        borderColor: "rgba(255,100,0,0.2)",
                        backgroundColor: "rgba(255,100,0,0.05)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        z.lockTxt,
                        item.streakReq && { color: "rgba(255,140,0,0.5)" },
                      ]}
                    >
                      {item.streakReq ? "🔥 STREAK" : "LOCKED"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <ReturnToCastle onPress={onBack} />
      </Animated.View>
    </View>
  )
}

const z = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1410",
    paddingTop: 8,
    paddingHorizontal: 18,
  },
  bgLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "15%",
    left: "25%",
    width: "50%",
    height: "60%",
    borderRadius: 300,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  bgRune: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(232,197,71,0.04)",
  },
  bgBeast: {
    position: "absolute",
    fontSize: 42,
    color: "rgba(232,197,71,0.03)",
  },
  bgHLine: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  inner: { flex: 1 },

  headerWrap: { alignItems: "center", marginBottom: 6 },
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  headerLine: { width: 30, height: 1, backgroundColor: "rgba(232,197,71,0.2)" },
  headerDot: { color: "rgba(232,197,71,0.4)", fontSize: 7 },
  title: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  statsText: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 3,
  },
  nextUnlock: {
    color: "rgba(232,197,71,0.25)",
    fontSize: 8,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 1,
  },

  tabRow: {
    flexDirection: "row",
    marginBottom: 6,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  tabOn: { backgroundColor: "rgba(232,197,71,0.12)" },
  tabDiv: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(232,197,71,0.1)",
    alignSelf: "center",
  },
  tabIco: { fontSize: 11 },
  tabTxt: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tabTxtOn: { color: "#E8C547" },

  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 8,
  },

  itemCard: {
    width: 92,
    height: 84,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: 4,
  },
  corn: { position: "absolute", fontSize: 6 },
  itemIcon: { fontSize: 26, marginBottom: 4 },
  itemName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  itemLocked: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontWeight: "700",
  },

  check: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0B1410",
  },
  checkTxt: { fontSize: 10, fontWeight: "900", color: "#0B1410" },

  lockBadge: {
    position: "absolute",
    bottom: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  lockTxt: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 1,
  },

  backBtn: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  backTxt: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
})

export default Armory
