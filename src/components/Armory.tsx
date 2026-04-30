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

const CARD_BACKS = [
  {
    id: "classic",
    name: "Classic Shield",
    icon: "🛡",
    color: "#162A47",
    accent: "#4A6FA5",
    unlockReq: 0,
  },
  {
    id: "crimson",
    name: "Dragon Fire",
    icon: "🐉",
    color: "#5C1A1A",
    accent: "#E84545",
    unlockReq: 0,
  },
  {
    id: "forest",
    name: "Wolf Den",
    icon: "🐺",
    color: "#1A3524",
    accent: "#4CAF50",
    unlockReq: 5,
    unlockLabel: "5 battles",
  },
  {
    id: "golden",
    name: "Eagle's Crest",
    icon: "🦅",
    color: "#4A3A10",
    accent: "#FFB800",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "midnight",
    name: "Serpent Shadow",
    icon: "🐍",
    color: "#0A0A1A",
    accent: "#6B4EC7",
    unlockReq: 20,
    unlockLabel: "20 battles",
  },
  {
    id: "royal",
    name: "Royal Purple",
    icon: "👑",
    color: "#3A1A50",
    accent: "#C084FC",
    unlockReq: 35,
    unlockLabel: "35 battles",
  },
  {
    id: "blood",
    name: "Blood Moon",
    icon: "🌙",
    color: "#4A0A0A",
    accent: "#FF6B6B",
    unlockReq: 50,
    unlockLabel: "50 battles",
  },
  {
    id: "storm",
    name: "Storm Caller",
    icon: "⛈",
    color: "#0A2A4A",
    accent: "#4FC3F7",
    unlockReq: 75,
    unlockLabel: "75 battles",
  },
  {
    id: "ancient",
    name: "Ancient Runes",
    icon: "ᚱ",
    color: "#3A3A10",
    accent: "#D4AF37",
    unlockReq: 100,
    unlockLabel: "100 battles",
  },
  {
    id: "mythic",
    name: "Mythic Gold",
    icon: "✦",
    color: "#4A3800",
    accent: "#FFD700",
    unlockReq: 150,
    unlockLabel: "150 battles",
  },
  {
    id: "phantom",
    name: "Phantom Veil",
    icon: "👻",
    color: "#2A1040",
    accent: "#B388FF",
    unlockReq: 200,
    unlockLabel: "200 battles",
  },
  {
    id: "inferno",
    name: "Inferno Core",
    icon: "🔥",
    color: "#4A1500",
    accent: "#FF6D00",
    unlockReq: 300,
    unlockLabel: "300 battles",
  },
]

const BATTLEFIELDS = [
  {
    id: "forest",
    name: "Dark Forest",
    icon: "🌲",
    color: "#0F1A12",
    accent: "#4CAF50",
    unlockReq: 0,
  },
  {
    id: "dungeon",
    name: "Stone Dungeon",
    icon: "🏰",
    color: "#1A1510",
    accent: "#A89078",
    unlockReq: 0,
  },
  {
    id: "ocean",
    name: "Deep Abyss",
    icon: "🌊",
    color: "#081520",
    accent: "#4FC3F7",
    unlockReq: 8,
    unlockLabel: "8 battles",
  },
  {
    id: "volcano",
    name: "Dragon's Lair",
    icon: "🌋",
    color: "#200A0A",
    accent: "#FF4444",
    unlockReq: 15,
    unlockLabel: "15 battles",
  },
  {
    id: "frost",
    name: "Frozen Peaks",
    icon: "❄️",
    color: "#0A1520",
    accent: "#90CAF9",
    unlockReq: 25,
    unlockLabel: "25 battles",
  },
  {
    id: "void",
    name: "The Void",
    icon: "🌑",
    color: "#050508",
    accent: "#8B5CF6",
    unlockReq: 40,
    unlockLabel: "40 battles",
  },
  {
    id: "swamp",
    name: "Cursed Swamp",
    icon: "🐸",
    color: "#0A1A08",
    accent: "#84CC16",
    unlockReq: 60,
    unlockLabel: "60 battles",
  },
  {
    id: "temple",
    name: "Lost Temple",
    icon: "🏛",
    color: "#1A1510",
    accent: "#E8C547",
    unlockReq: 80,
    unlockLabel: "80 battles",
  },
  {
    id: "shadow",
    name: "Shadow Realm",
    icon: "🌘",
    color: "#08080F",
    accent: "#9061F9",
    unlockReq: 120,
    unlockLabel: "120 battles",
  },
  {
    id: "celestial",
    name: "Celestial Hall",
    icon: "⭐",
    color: "#10102A",
    accent: "#7DD3FC",
    unlockReq: 160,
    unlockLabel: "160 battles",
  },
  {
    id: "crimson",
    name: "Crimson Throne",
    icon: "💀",
    color: "#200510",
    accent: "#F43F5E",
    unlockReq: 220,
    unlockLabel: "220 battles",
  },
  {
    id: "eternal",
    name: "Eternal Flame",
    icon: "♾",
    color: "#201000",
    accent: "#FB923C",
    unlockReq: 300,
    unlockLabel: "300 battles",
  },
]

const WILD_STYLES = [
  {
    id: "classic",
    name: "Lightning",
    icon: "⚡",
    color: "#1A0F05",
    accent: "#E8C547",
    unlockReq: 0,
  },
  {
    id: "frost",
    name: "Frost Strike",
    icon: "❄️",
    color: "#0A1525",
    accent: "#90CAF9",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "venom",
    name: "Venom Fang",
    icon: "🐍",
    color: "#0A1A0A",
    accent: "#4ADE80",
    unlockReq: 25,
    unlockLabel: "25 battles",
  },
  {
    id: "inferno",
    name: "Hellfire",
    icon: "🔥",
    color: "#2A0A00",
    accent: "#FF6B35",
    unlockReq: 45,
    unlockLabel: "45 battles",
  },
  {
    id: "arcane",
    name: "Arcane Surge",
    icon: "🔮",
    color: "#1A0A2A",
    accent: "#C084FC",
    unlockReq: 70,
    unlockLabel: "70 battles",
  },
  {
    id: "divine",
    name: "Divine Wrath",
    icon: "👑",
    color: "#2A1A00",
    accent: "#FFD700",
    unlockReq: 100,
    unlockLabel: "100 battles",
  },
  {
    id: "void",
    name: "Void Tear",
    icon: "🌑",
    color: "#050505",
    accent: "#8B5CF6",
    unlockReq: 150,
    unlockLabel: "150 battles",
  },
  {
    id: "dragon",
    name: "Dragon Breath",
    icon: "🐉",
    color: "#2A0500",
    accent: "#FF4444",
    unlockReq: 200,
    unlockLabel: "200 battles",
  },
]

const WAR_TABLES = [
  {
    id: "classic",
    name: "Dark Oak",
    icon: "🪵",
    color: "#18120E",
    accent: "#8B7355",
    unlockReq: 0,
  },
  {
    id: "iron",
    name: "Iron Forge",
    icon: "⚒",
    color: "#12141A",
    accent: "#78909C",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "marble",
    name: "White Marble",
    icon: "🏛",
    color: "#1A1A1A",
    accent: "#E0E0E0",
    unlockReq: 30,
    unlockLabel: "30 battles",
  },
  {
    id: "crimson",
    name: "Crimson Velvet",
    icon: "🩸",
    color: "#1A0808",
    accent: "#C0392B",
    unlockReq: 50,
    unlockLabel: "50 battles",
  },
  {
    id: "gold",
    name: "Royal Gold",
    icon: "👑",
    color: "#1A1505",
    accent: "#FFD700",
    unlockReq: 80,
    unlockLabel: "80 battles",
  },
  {
    id: "obsidian",
    name: "Obsidian Slab",
    icon: "🌑",
    color: "#0A0A0A",
    accent: "#424242",
    unlockReq: 120,
    unlockLabel: "120 battles",
  },
  {
    id: "jade",
    name: "Jade Emperor",
    icon: "🐉",
    color: "#0A1A10",
    accent: "#4CAF50",
    unlockReq: 175,
    unlockLabel: "175 battles",
  },
  {
    id: "celestial",
    name: "Star Table",
    icon: "⭐",
    color: "#0A0A20",
    accent: "#7DD3FC",
    unlockReq: 250,
    unlockLabel: "250 battles",
  },
]

const BOUNTY_STYLES = [
  {
    id: "classic",
    name: "Classic Gold",
    icon: "💰",
    color: "#0D0D0D",
    accent: "#DAA520",
    unlockReq: 0,
  },
  {
    id: "diamond",
    name: "Diamond",
    icon: "💎",
    color: "#0A1525",
    accent: "#B0C4DE",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "ruby",
    name: "Ruby Treasure",
    icon: "❤️‍🔥",
    color: "#1A0808",
    accent: "#DC143C",
    unlockReq: 25,
    unlockLabel: "25 battles",
  },
  {
    id: "emerald",
    name: "Emerald Hoard",
    icon: "🪲",
    color: "#0A1A0A",
    accent: "#50C878",
    unlockReq: 45,
    unlockLabel: "45 battles",
  },
  {
    id: "shadow",
    name: "Shadow Loot",
    icon: "🌑",
    color: "#0A0A14",
    accent: "#9370DB",
    unlockReq: 70,
    unlockLabel: "70 battles",
  },
  {
    id: "celestial",
    name: "Star Bounty",
    icon: "⭐",
    color: "#0A0A1A",
    accent: "#87CEEB",
    unlockReq: 100,
    unlockLabel: "100 battles",
  },
  {
    id: "inferno",
    name: "Molten Spoils",
    icon: "🔥",
    color: "#1A0A00",
    accent: "#FF6347",
    unlockReq: 150,
    unlockLabel: "150 battles",
  },
  {
    id: "royal",
    name: "Royal Bounty",
    icon: "👑",
    color: "#1A0A20",
    accent: "#E8C547",
    unlockReq: 200,
    unlockLabel: "200 battles",
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
  classic: {
    backColor: "#0D0D0D",
    accent: "#DAA520",
    frontBg: "#FDF8E8",
    textColor: "#B8860B",
    icon: "💰",
  },
  diamond: {
    backColor: "#0A1525",
    accent: "#B0C4DE",
    frontBg: "#F0F4F8",
    textColor: "#4682B4",
    icon: "💎",
  },
  ruby: {
    backColor: "#1A0808",
    accent: "#DC143C",
    frontBg: "#FDF0F0",
    textColor: "#B22222",
    icon: "❤️‍🔥",
  },
  emerald: {
    backColor: "#0A1A0A",
    accent: "#50C878",
    frontBg: "#F0FDF4",
    textColor: "#2E8B57",
    icon: "🪲",
  },
  shadow: {
    backColor: "#0A0A14",
    accent: "#9370DB",
    frontBg: "#F5F0FF",
    textColor: "#6A5ACD",
    icon: "🌑",
  },
  celestial: {
    backColor: "#0A0A1A",
    accent: "#87CEEB",
    frontBg: "#F0F8FF",
    textColor: "#4682B4",
    icon: "⭐",
  },
  inferno: {
    backColor: "#1A0A00",
    accent: "#FF6347",
    frontBg: "#FFF5F0",
    textColor: "#CD4F39",
    icon: "🔥",
  },
  royal: {
    backColor: "#1A0A20",
    accent: "#E8C547",
    frontBg: "#FFFDF0",
    textColor: "#B8960B",
    icon: "👑",
  },
}

const STORAGE_KEYS = {
  gamesPlayed: "@mythic_games_played",
  selectedBack: "@mythic_card_back",
  selectedField: "@mythic_battlefield",
  selectedWild: "@mythic_wild_style",
  selectedTable: "@mythic_war_table",
  selectedBounty: "@mythic_bounty_style",
}

type TabType = "cards" | "fields" | "wild" | "bounty" | "table"

const TAB_CONFIG: { key: TabType; icon: string; label: string }[] = [
  { key: "cards", icon: "🃏", label: "Backs" },
  { key: "fields", icon: "🏟", label: "Fields" },
  { key: "wild", icon: "⚡", label: "Wild" },
  { key: "bounty", icon: "💰", label: "Bounty" },
  { key: "table", icon: "⚒", label: "Table" },
]

export const getSelectedTheme = async (): Promise<ThemeConfig> => {
  try {
    const backId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedBack)) || "classic"
    const fieldId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedField)) || "forest"
    const wildId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedWild)) || "classic"
    const tableId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedTable)) || "classic"
    const bountyId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedBounty)) || "classic"
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
      cardBack: "classic",
      cardBackColor: "#162A47",
      battlefield: "forest",
      battlefieldColor: "#0F1A12",
      wildStyle: "classic",
      warTable: "classic",
      bountyStyle: "classic",
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

  useEffect(() => {
    ;(async () => {
      const gamesStr = await AsyncStorage.getItem(STORAGE_KEYS.gamesPlayed)
      setGamesPlayed(gamesStr ? parseInt(gamesStr) : 0)
      setSelectedBack(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedBack)) || "classic",
      )
      setSelectedField(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedField)) || "forest",
      )
      setSelectedWild(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedWild)) || "classic",
      )
      setSelectedTable(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedTable)) || "classic",
      )
      setSelectedBounty(
        (await AsyncStorage.getItem(STORAGE_KEYS.selectedBounty)) || "classic",
      )
    })()
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
      case "wild":
        setSelectedWild(id)
        await AsyncStorage.setItem(STORAGE_KEYS.selectedWild, id)
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
      case "wild":
        return WILD_STYLES
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
      case "wild":
        return selectedWild
      case "bounty":
        return selectedBounty
      case "table":
        return selectedTable
    }
  }

  const items = getItems()
  const selected = getSelected()
  const unlockedCount = items.filter((i) => gamesPlayed >= i.unlockReq).length
  const nextLock = items.find((i) => gamesPlayed < i.unlockReq)

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
              Next unlock at {nextLock.unlockReq} battles
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
            const unlocked = gamesPlayed >= item.unlockReq
            const isSel = selected === item.id
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  z.itemCard,
                  {
                    backgroundColor: unlocked
                      ? item.color
                      : "rgba(10,15,12,0.5)",
                    borderColor: isSel
                      ? item.accent
                      : unlocked
                        ? "rgba(232,197,71,0.15)"
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
                  {unlocked ? item.icon : "🔒"}
                </Text>
                <Text
                  style={[
                    z.itemName,
                    unlocked && { color: item.accent },
                    !unlocked && z.itemLocked,
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
                  <View style={z.lockBadge}>
                    <Text style={z.lockTxt}>LOCKED</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <TouchableOpacity style={z.backBtn} onPress={onBack}>
          <Text style={z.backTxt}>← Return to Castle</Text>
        </TouchableOpacity>
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
