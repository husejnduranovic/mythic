import React, { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface ArmoryProps {
  onBack: () => void
}

export interface ThemeConfig {
  cardBack: string
  cardBackColor: string
  battlefield: string
  battlefieldColor: string
}

const CARD_BACKS = [
  {
    id: "classic",
    name: "Classic Shield",
    icon: "🛡",
    color: "#162A47",
    unlockReq: 0,
  },
  {
    id: "crimson",
    name: "Dragon Fire",
    icon: "🐉",
    color: "#5C1A1A",
    unlockReq: 0,
  },
  {
    id: "forest",
    name: "Wolf Den",
    icon: "🐺",
    color: "#1A3524",
    unlockReq: 3,
    unlockLabel: "3 battles",
  },
  {
    id: "golden",
    name: "Eagle's Crest",
    icon: "🦅",
    color: "#4A3A10",
    unlockReq: 5,
    unlockLabel: "5 battles",
  },
  {
    id: "midnight",
    name: "Serpent Shadow",
    icon: "🐍",
    color: "#0A0A1A",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "royal",
    name: "Royal Purple",
    icon: "👑",
    color: "#3A1A50",
    unlockReq: 20,
    unlockLabel: "20 battles",
  },
  {
    id: "blood",
    name: "Blood Moon",
    icon: "🌙",
    color: "#4A0A0A",
    unlockReq: 35,
    unlockLabel: "35 battles",
  },
  {
    id: "storm",
    name: "Storm Caller",
    icon: "⛈",
    color: "#0A2A4A",
    unlockReq: 50,
    unlockLabel: "50 battles",
  },
  {
    id: "ancient",
    name: "Ancient Runes",
    icon: "ᚱ",
    color: "#3A3A10",
    unlockReq: 75,
    unlockLabel: "75 battles",
  },
  {
    id: "mythic",
    name: "Mythic Gold",
    icon: "✦",
    color: "#4A3800",
    unlockReq: 100,
    unlockLabel: "100 battles",
  },
  {
    id: "phantom",
    name: "Phantom Veil",
    icon: "👻",
    color: "#2A1040",
    unlockReq: 150,
    unlockLabel: "150 battles",
  },
  {
    id: "inferno",
    name: "Inferno Core",
    icon: "🔥",
    color: "#4A1500",
    unlockReq: 200,
    unlockLabel: "200 battles",
  },
]

const BATTLEFIELDS = [
  {
    id: "forest",
    name: "Dark Forest",
    icon: "🌲",
    color: "#0F1A12",
    unlockReq: 0,
  },
  {
    id: "dungeon",
    name: "Stone Dungeon",
    icon: "🏰",
    color: "#1A1510",
    unlockReq: 0,
  },
  {
    id: "ocean",
    name: "Deep Abyss",
    icon: "🌊",
    color: "#081520",
    unlockReq: 5,
    unlockLabel: "5 battles",
  },
  {
    id: "volcano",
    name: "Dragon's Lair",
    icon: "🌋",
    color: "#200A0A",
    unlockReq: 10,
    unlockLabel: "10 battles",
  },
  {
    id: "frost",
    name: "Frozen Peaks",
    icon: "❄️",
    color: "#0A1520",
    unlockReq: 15,
    unlockLabel: "15 battles",
  },
  {
    id: "void",
    name: "The Void",
    icon: "🌑",
    color: "#050508",
    unlockReq: 25,
    unlockLabel: "25 battles",
  },
  {
    id: "swamp",
    name: "Cursed Swamp",
    icon: "🐸",
    color: "#0A1A08",
    unlockReq: 40,
    unlockLabel: "40 battles",
  },
  {
    id: "temple",
    name: "Lost Temple",
    icon: "🏛",
    color: "#1A1510",
    unlockReq: 60,
    unlockLabel: "60 battles",
  },
  {
    id: "shadow",
    name: "Shadow Realm",
    icon: "🌘",
    color: "#08080F",
    unlockReq: 80,
    unlockLabel: "80 battles",
  },
  {
    id: "celestial",
    name: "Celestial Hall",
    icon: "⭐",
    color: "#10102A",
    unlockReq: 100,
    unlockLabel: "100 battles",
  },
  {
    id: "crimson",
    name: "Crimson Throne",
    icon: "💀",
    color: "#200510",
    unlockReq: 150,
    unlockLabel: "150 battles",
  },
  {
    id: "eternal",
    name: "Eternal Flame",
    icon: "♾",
    color: "#201000",
    unlockReq: 200,
    unlockLabel: "200 battles",
  },
]

const STORAGE_KEYS = {
  gamesPlayed: "@mythic_games_played",
  selectedBack: "@mythic_card_back",
  selectedField: "@mythic_battlefield",
}

export const getSelectedTheme = async (): Promise<ThemeConfig> => {
  try {
    const backId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedBack)) || "classic"
    const fieldId =
      (await AsyncStorage.getItem(STORAGE_KEYS.selectedField)) || "forest"
    const back = CARD_BACKS.find((b) => b.id === backId) || CARD_BACKS[0]
    const field = BATTLEFIELDS.find((f) => f.id === fieldId) || BATTLEFIELDS[0]
    return {
      cardBack: back.id,
      cardBackColor: back.color,
      battlefield: field.id,
      battlefieldColor: field.color,
    }
  } catch {
    return {
      cardBack: "classic",
      cardBackColor: "#162A47",
      battlefield: "forest",
      battlefieldColor: "#0F1A12",
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
  const [tab, setTab] = useState<"cards" | "fields">("cards")

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
    })()
  }, [])

  const selectBack = async (id: string) => {
    setSelectedBack(id)
    await AsyncStorage.setItem(STORAGE_KEYS.selectedBack, id)
  }
  const selectField = async (id: string) => {
    setSelectedField(id)
    await AsyncStorage.setItem(STORAGE_KEYS.selectedField, id)
  }

  const items = tab === "cards" ? CARD_BACKS : BATTLEFIELDS
  const selected = tab === "cards" ? selectedBack : selectedField
  const onSelect = tab === "cards" ? selectBack : selectField

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLine} />
        <Text style={styles.title}>🛡 ARMORY</Text>
        <View style={styles.headerLine} />
      </View>

      <Text style={styles.gamesCount}>⚔ {gamesPlayed} battles fought</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "cards" && styles.tabActive]}
          onPress={() => setTab("cards")}
        >
          <Text
            style={[styles.tabText, tab === "cards" && styles.tabTextActive]}
          >
            🃏 Card Backs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "fields" && styles.tabActive]}
          onPress={() => setTab("fields")}
        >
          <Text
            style={[styles.tabText, tab === "fields" && styles.tabTextActive]}
          >
            ⚔ Battlefields
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        {items.map((item: any) => {
          const unlocked = gamesPlayed >= item.unlockReq
          const isSelected = selected === item.id
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: unlocked ? item.color : "#111" },
                isSelected && styles.itemSelected,
                !unlocked && styles.itemLocked,
              ]}
              onPress={() => unlocked && onSelect(item.id)}
              disabled={!unlocked}
              activeOpacity={0.7}
            >
              <Text style={styles.itemIcon}>{unlocked ? item.icon : "🔒"}</Text>
              <Text
                style={[styles.itemName, !unlocked && styles.itemNameLocked]}
              >
                {unlocked ? item.name : item.unlockLabel}
              </Text>
              {isSelected && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← Return to Castle</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A12",
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    gap: 10,
  },
  headerLine: { flex: 1, height: 1, backgroundColor: "rgba(232,197,71,0.12)" },
  title: {
    color: "#E8C547",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 3,
  },
  gamesCount: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },

  tabRow: { flexDirection: "row", marginBottom: 10, gap: 6 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
  },
  tabActive: {
    backgroundColor: "rgba(232,197,71,0.12)",
    borderColor: "#E8C547",
  },
  tabText: { color: "rgba(232,197,71,0.4)", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#E8C547" },

  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingBottom: 10,
  },

  itemCard: {
    width: 100,
    height: 80,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.08)",
    position: "relative",
  },
  itemSelected: { borderColor: "#E8C547", borderWidth: 2 },
  itemLocked: { opacity: 0.35 },
  itemIcon: { fontSize: 24, marginBottom: 4 },
  itemName: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  itemNameLocked: { color: "rgba(255,255,255,0.3)", fontSize: 8 },
  checkMark: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E8C547",
    justifyContent: "center",
    alignItems: "center",
  },
  checkText: { fontSize: 9, fontWeight: "900", color: "#1a1a1a" },

  backBtn: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  backText: {
    color: "#E8C547",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
})

export default Armory
