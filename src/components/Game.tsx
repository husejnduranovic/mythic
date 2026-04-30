import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import {
  generateDeck,
  generateDailyDeck,
  getTodayString,
  isCardMatch,
} from "../services/CardService"
import { SoundService } from "../services/SoundService"
import { ICard } from "./Card"
import Card from "./Card"
import Layout1 from "./Layout1"
import Layout2 from "./Layout2"
import Layout3 from "./Layout3"
import Timer from "./Timer"
import { saveScore } from "./Scoreboard"
import {
  BOUNTY_STYLE_CONFIG,
  getSelectedTheme,
  incrementGamesPlayed,
  ThemeConfig,
} from "./Armory"
import {
  hasPlayedToday,
  submitAllTimeScore,
  submitDailyScore,
  submitGameScore,
  updateUserProfile,
} from "../services/Dailychallenge"
import {
  BountyStyleContext,
  CardBackColorContext,
} from "../context/ThemeContext"
import {
  leaveRoom,
  onRoomUpdate,
  resetRoomForRematch,
  setPlayerRematch,
  updatePlayerScore,
} from "../services/ArenaService"
import {
  getSavedLoungeCode,
  submitLoungeScore,
} from "../services/LoungeService"
import { firestore } from "../services/Firebase"
import RecordCelebration from "./RecordCelebration"
import Layout5 from "./Layout5"
import Layout7 from "./Layout7"
import Layout9 from "./Layout9"
import Layout8 from "./Layout8"

interface GameProps {
  onHome?: () => void
  dailyMode?: boolean
  uid?: string
  heroName?: string
  arenaMode?: boolean
  roomCode?: string
}

const LEVEL_CONFIG: Record<
  number,
  { fieldCards: number; deckStart: number; time: number; layout: number }
> = {
  1: { fieldCards: 29, deckStart: 29, time: 75, layout: 1 },
  2: { fieldCards: 30, deckStart: 30, time: 85, layout: 2 },
  3: { fieldCards: 30, deckStart: 30, time: 80, layout: 7 },
  4: { fieldCards: 32, deckStart: 32, time: 80, layout: 8 },
  5: { fieldCards: 32, deckStart: 32, time: 85, layout: 9 },
  6: { fieldCards: 28, deckStart: 28, time: 75, layout: 5 },
}

const WILD_STYLE_CONFIG: Record<
  string,
  { color: string; accent: string; icon: string }
> = {
  classic: { color: "#1A0F05", accent: "#E8C547", icon: "⚡" },
  frost: { color: "#0A1525", accent: "#90CAF9", icon: "❄️" },
  venom: { color: "#0A1A0A", accent: "#4ADE80", icon: "🐍" },
  inferno: { color: "#2A0A00", accent: "#FF6B35", icon: "🔥" },
  arcane: { color: "#1A0A2A", accent: "#C084FC", icon: "🔮" },
  divine: { color: "#2A1A00", accent: "#FFD700", icon: "👑" },
  void: { color: "#050505", accent: "#8B5CF6", icon: "🌑" },
  dragon: { color: "#2A0500", accent: "#FF4444", icon: "🐉" },
}

const WAR_TABLE_CONFIG: Record<string, { color: string; accent: string }> = {
  classic: { color: "#18120E", accent: "#8B7355" },
  iron: { color: "#12141A", accent: "#78909C" },
  marble: { color: "#1A1A1A", accent: "#E0E0E0" },
  crimson: { color: "#1A0808", accent: "#C0392B" },
  gold: { color: "#1A1505", accent: "#FFD700" },
  obsidian: { color: "#0A0A0A", accent: "#424242" },
  jade: { color: "#0A1A10", accent: "#4CAF50" },
  celestial: { color: "#0A0A20", accent: "#7DD3FC" },
}

const TOTAL_LEVELS = Object.keys(LEVEL_CONFIG).length
const BASE_CARD_VALUE = 500
const SECOND_CARD_COMBO = 2
const WILD_COMBO_THRESHOLD = 10
const WILD_SECOND_THRESHOLD = 20

const COMBO_MILESTONES: Record<
  number,
  { text: string; color: string; icon: string }
> = {
  5: { text: "WORTHY!", color: "#7BED9F", icon: "⚔" },
  10: { text: "VALIANT!", color: "#FFD700", icon: "🛡" },
  15: { text: "GLORIOUS!", color: "#FF6B35", icon: "👑" },
  20: { text: "LEGENDARY!", color: "#FF4757", icon: "🐉" },
  25: { text: "RAMPAGE!", color: "#FF00FF", icon: "⚡" },
  30: { text: "BEYOND MYTHIC!", color: "#FFFFFF", icon: "💀" },
  35: { text: "TRANSCENDENT!", color: "#00FFFF", icon: "🌀" },
}

const getComboMultiplier = (c: number) => {
  if (c >= 35) return 150
  if (c >= 30) return 100
  if (c >= 25) return 65
  if (c >= 20) return 40
  if (c >= 15) return 24
  if (c >= 12) return 15
  if (c >= 10) return 12
  if (c >= 7) return 6
  if (c >= 5) return 4
  if (c >= 3) return 2.5
  if (c >= 2) return 1.5
  return 1
}

const RUNES = [
  "ᚠ",
  "ᚢ",
  "ᚦ",
  "ᚨ",
  "ᚱ",
  "ᚲ",
  "ᚷ",
  "ᚹ",
  "ᚺ",
  "ᚾ",
  "ᛁ",
  "ᛃ",
  "ᛈ",
  "ᛊ",
  "ᛏ",
  "ᛒ",
  "ᛞ",
  "ᛟ",
]

const PulsingCard = ({ children }: { children: React.ReactNode }) => {
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start()
    return () => pulse.stopAnimation()
  }, [])

  return <Animated.View style={{ opacity: pulse }}>{children}</Animated.View>
}

const LayoutEntrance = ({
  children,
  layoutKey,
}: {
  children: React.ReactNode
  layoutKey: string
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current

  useEffect(() => {
    opacity.setValue(0)
    scale.setValue(0.92)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }, [layoutKey])

  return (
    <Animated.View
      style={{
        flex: 1,
        justifyContent: "center",
        opacity,
        transform: [{ scale }],
      }}
    >
      {children}
    </Animated.View>
  )
}

// BATTLEFIELD — Replace the Battlefield component in Game.tsx with this
// Drop-in replacement — same props, same usage

const Battlefield = React.memo(
  ({ battlefieldId }: { battlefieldId?: string }) => {
    const themeDetails: Record<
      string,
      {
        icons: string[]
        accent: string
        tableColor: string
        weaponIcons: string[]
      }
    > = {
      forest: {
        icons: ["🌲", "🍃", "🌿", "🐺"],
        accent: "rgba(100,180,100,0.08)",
        tableColor: "rgba(30,60,35,0.3)",
        weaponIcons: ["🏹", "🗡", "⚔", "🛡"],
      },
      dungeon: {
        icons: ["🏰", "⛓", "🗝", "💀"],
        accent: "rgba(180,160,120,0.08)",
        tableColor: "rgba(50,40,30,0.3)",
        weaponIcons: ["⛓", "🔑", "⚔", "🛡"],
      },
      ocean: {
        icons: ["🌊", "🐚", "⚓", "🦑"],
        accent: "rgba(80,150,200,0.08)",
        tableColor: "rgba(20,40,60,0.3)",
        weaponIcons: ["⚓", "🔱", "⚔", "🛡"],
      },
      volcano: {
        icons: ["🌋", "🔥", "💎", "🐉"],
        accent: "rgba(200,80,50,0.08)",
        tableColor: "rgba(50,20,15,0.3)",
        weaponIcons: ["🔥", "💎", "⚔", "🛡"],
      },
      frost: {
        icons: ["❄️", "🏔", "⛄", "🐻‍❄️"],
        accent: "rgba(150,200,230,0.08)",
        tableColor: "rgba(20,35,50,0.3)",
        weaponIcons: ["❄️", "🏔", "⚔", "🛡"],
      },
      void: {
        icons: ["🌑", "✨", "🕳", "👁"],
        accent: "rgba(120,80,180,0.08)",
        tableColor: "rgba(15,10,30,0.3)",
        weaponIcons: ["✨", "👁", "⚔", "🛡"],
      },
      swamp: {
        icons: ["🐸", "🍄", "🌾", "🐍"],
        accent: "rgba(80,150,60,0.08)",
        tableColor: "rgba(20,40,15,0.3)",
        weaponIcons: ["🍄", "🌾", "⚔", "🛡"],
      },
      temple: {
        icons: ["🏛", "🕯", "📜", "⚱️"],
        accent: "rgba(200,180,100,0.08)",
        tableColor: "rgba(40,35,20,0.3)",
        weaponIcons: ["🕯", "📜", "⚔", "🛡"],
      },
      shadow: {
        icons: ["🌘", "🦇", "🕸", "👻"],
        accent: "rgba(100,80,150,0.08)",
        tableColor: "rgba(15,12,25,0.3)",
        weaponIcons: ["🦇", "🕸", "⚔", "🛡"],
      },
      celestial: {
        icons: ["⭐", "🌙", "☄️", "🔮"],
        accent: "rgba(100,100,200,0.08)",
        tableColor: "rgba(20,20,45,0.3)",
        weaponIcons: ["🌙", "🔮", "⚔", "🛡"],
      },
      crimson: {
        icons: ["💀", "🩸", "⚰️", "🗡"],
        accent: "rgba(180,50,80,0.08)",
        tableColor: "rgba(40,10,20,0.3)",
        weaponIcons: ["💀", "🗡", "⚔", "🛡"],
      },
      eternal: {
        icons: ["♾", "🔥", "👑", "⚡"],
        accent: "rgba(200,150,50,0.08)",
        tableColor: "rgba(40,25,10,0.3)",
        weaponIcons: ["👑", "⚡", "⚔", "🛡"],
      },
    }

    const theme = themeDetails[battlefieldId || "forest"] || themeDetails.forest
    const icons = theme.icons
    const weapons = theme.weaponIcons

    return (
      <View style={s.container} pointerEvents="none">
        <View style={[s.tableOverlay, { backgroundColor: theme.tableColor }]} />

        {/* TABLE BORDERS — double gold frame */}
        <View style={s.borderTop} />
        <View style={s.borderBottom} />
        <View style={s.borderLeft} />
        <View style={s.borderRight} />
        <View style={s.innerTop} />
        <View style={s.innerLeft} />
        <View style={s.innerRight} />

        {/* CORNER ORNAMENTS */}
        <View style={[s.corner, { top: 1, left: 1 }]}>
          <Text style={s.cornerIcon}>◆</Text>
        </View>
        <View style={[s.corner, { top: 1, right: 1 }]}>
          <Text style={s.cornerIcon}>◆</Text>
        </View>
        <View style={[s.corner, { bottom: 53, left: 1 }]}>
          <Text style={s.cornerIcon}>◆</Text>
        </View>
        <View style={[s.corner, { bottom: 53, right: 1 }]}>
          <Text style={s.cornerIcon}>◆</Text>
        </View>

        {/* EDGE ORNAMENTS — mid points */}
        <Text style={[s.edgeOrn, { top: 1, left: "48%" }]}>◇</Text>
        <Text style={[s.edgeOrn, { left: 1, top: "38%" }]}>◇</Text>
        <Text style={[s.edgeOrn, { right: 1, top: "38%" }]}>◇</Text>

        {/* CENTER EMBLEM — double ring shield */}
        <View style={[s.ringOuter, { borderColor: theme.accent }]} />
        <View style={[s.ringInner, { borderColor: theme.accent }]} />
        <View style={s.emblem}>
          <View style={s.emblemRing}>
            <View style={s.emblemCore}>
              <Text style={s.emblemIcon}>⚔</Text>
            </View>
          </View>
        </View>

        {/* CROSS LINES + DIAGONALS */}
        <View style={s.crossH} />
        <View style={s.crossV} />
        <View style={s.diagA} />
        <View style={s.diagB} />

        {/* CLAN BANNERS — four corners with pole + flag + stripe */}
        {[
          { pos: { top: "5%", left: "4%" }, icon: icons[0] },
          { pos: { top: "5%", right: "4%" }, icon: icons[1] },
          { pos: { bottom: "18%", left: "4%" }, icon: icons[2] },
          { pos: { bottom: "18%", right: "4%" }, icon: icons[3] },
        ].map((b, i) => (
          <View key={`b${i}`} style={[s.banner, b.pos as any]}>
            <View style={[s.pole, { backgroundColor: theme.accent }]} />
            <View style={[s.flag, { borderColor: theme.accent }]}>
              <Text style={s.flagIcon}>{b.icon}</Text>
              <View style={[s.flagStripe, { backgroundColor: theme.accent }]} />
            </View>
          </View>
        ))}

        {/* WEAPON RACKS — left and right sides */}
        <View style={[s.weaponRack, { top: "28%", left: "1.5%" }]}>
          <Text style={s.weaponEmoji}>{weapons[0]}</Text>
          <View style={s.weaponBar} />
          <Text style={s.weaponEmoji}>{weapons[1]}</Text>
        </View>
        <View style={[s.weaponRack, { top: "28%", right: "1.5%" }]}>
          <Text style={s.weaponEmoji}>{weapons[2]}</Text>
          <View style={s.weaponBar} />
          <Text style={s.weaponEmoji}>{weapons[3]}</Text>
        </View>

        {/* GHOST CARDS — card silhouettes on table */}
        <View
          style={[
            s.ghostCard,
            { top: "12%", left: "28%", transform: [{ rotate: "-14deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { top: "14%", left: "30%", transform: [{ rotate: "4deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { bottom: "26%", right: "26%", transform: [{ rotate: "20deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { bottom: "28%", right: "28%", transform: [{ rotate: "-6deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { top: "45%", left: "22%", transform: [{ rotate: "8deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { top: "20%", right: "35%", transform: [{ rotate: "-22deg" }] },
          ]}
        />

        {/* TORCH GLOW — warm light circles at top */}
        <View style={[s.torchGlow, { top: -15, left: 8 }]} />
        <View style={[s.torchGlow, { top: -15, right: 8 }]} />
        <Text style={[s.torch, { top: 3, left: 18 }]}>🕯</Text>
        <Text style={[s.torch, { top: 3, right: 18 }]}>🕯</Text>

        {/* RUNES — carved into surface, scattered */}
        {["ᚠ", "ᚦ", "ᚱ", "ᛟ", "ᚲ", "ᛊ", "ᚹ", "ᛏ", "ᚨ", "ᛃ", "ᛈ", "ᛞ"].map(
          (r, i) => (
            <Text
              key={`r${i}`}
              style={[
                s.rune,
                {
                  top: `${(i * 17 + 8) % 72}%`,
                  left: `${(i * 21 + 12) % 82}%`,
                  fontSize: 10 + (i % 3) * 4,
                  transform: [{ rotate: `${i * 31}deg` }],
                },
              ]}
            >
              {r}
            </Text>
          ),
        )}

        {/* CHAIN DECORATIONS — top area */}
        <View style={[s.chain, { top: 7, left: "18%" }]}>
          <Text style={s.chainText}>─⊕─⊕─⊕─</Text>
        </View>
        <View style={[s.chain, { top: 7, right: "18%" }]}>
          <Text style={s.chainText}>─⊕─⊕─⊕─</Text>
        </View>

        {/* WAR SCRATCHES — claw marks on table */}
        <View
          style={[
            s.scratch,
            {
              top: "33%",
              left: "24%",
              width: 22,
              transform: [{ rotate: "38deg" }],
            },
          ]}
        />
        <View
          style={[
            s.scratch,
            {
              top: "34%",
              left: "25%",
              width: 16,
              transform: [{ rotate: "32deg" }],
            },
          ]}
        />
        <View
          style={[
            s.scratch,
            {
              top: "35%",
              left: "26%",
              width: 10,
              transform: [{ rotate: "28deg" }],
            },
          ]}
        />
        <View
          style={[
            s.scratch,
            {
              bottom: "35%",
              right: "22%",
              width: 20,
              transform: [{ rotate: "-22deg" }],
            },
          ]}
        />
        <View
          style={[
            s.scratch,
            {
              bottom: "34%",
              right: "23%",
              width: 14,
              transform: [{ rotate: "-18deg" }],
            },
          ]}
        />

        {/* VIGNETTES — all four sides for depth */}
        <View style={s.vigBottom} />
        <View style={s.vigTop} />
        <View style={s.vigLeft} />
        <View style={s.vigRight} />
      </View>
    )
  },
)

const s = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  tableOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  // Borders
  borderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  borderBottom: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.06)",
  },
  borderLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 52,
    width: 2,
    backgroundColor: "rgba(232,197,71,0.08)",
  },
  borderRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 52,
    width: 2,
    backgroundColor: "rgba(232,197,71,0.08)",
  },
  innerTop: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  innerLeft: {
    position: "absolute",
    top: 5,
    left: 5,
    bottom: 56,
    width: 1,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  innerRight: {
    position: "absolute",
    top: 5,
    right: 5,
    bottom: 56,
    width: 1,
    backgroundColor: "rgba(232,197,71,0.04)",
  },

  // Corners
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  cornerIcon: { color: "rgba(232,197,71,0.25)", fontSize: 10 },

  // Edge ornaments
  edgeOrn: {
    position: "absolute",
    color: "rgba(232,197,71,0.12)",
    fontSize: 8,
    zIndex: 2,
  },

  // Center rings
  ringOuter: {
    position: "absolute",
    top: "16%",
    left: "20%",
    width: "60%",
    height: "62%",
    borderRadius: 9999,
    borderWidth: 1,
  },
  ringInner: {
    position: "absolute",
    top: "26%",
    left: "30%",
    width: "40%",
    height: "44%",
    borderRadius: 9999,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  // Emblem
  emblem: { position: "absolute", top: "41%", left: "46%" },
  emblemRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(232,197,71,0.025)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  emblemCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(232,197,71,0.025)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  emblemIcon: { fontSize: 14, color: "rgba(232,197,71,0.12)" },

  // Cross lines
  crossH: {
    position: "absolute",
    top: "48%",
    left: "12%",
    width: "76%",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  crossV: {
    position: "absolute",
    left: "50%",
    top: "10%",
    width: 1,
    height: "68%",
    backgroundColor: "rgba(232,197,71,0.03)",
  },
  diagA: {
    position: "absolute",
    top: "28%",
    left: "28%",
    width: "44%",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.02)",
    transform: [{ rotate: "45deg" }],
  },
  diagB: {
    position: "absolute",
    top: "28%",
    left: "28%",
    width: "44%",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.02)",
    transform: [{ rotate: "-45deg" }],
  },

  // Banners
  banner: { position: "absolute", alignItems: "center" },
  pole: { width: 2, height: 10, borderRadius: 1 },
  flag: {
    width: 34,
    height: 32,
    borderRadius: 4,
    backgroundColor: "rgba(232,197,71,0.02)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  flagIcon: { fontSize: 16, opacity: 0.12 },
  flagStripe: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },

  // Weapon racks
  weaponRack: { position: "absolute", alignItems: "center", gap: 2 },
  weaponEmoji: { fontSize: 14, opacity: 0.08 },
  weaponBar: { width: 18, height: 1, backgroundColor: "rgba(232,197,71,0.06)" },

  // Ghost cards
  ghostCard: {
    position: "absolute",
    width: 18,
    height: 26,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.035)",
    backgroundColor: "rgba(232,197,71,0.012)",
  },

  // Torch
  torchGlow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,200,80,0.03)",
  },
  torch: { position: "absolute", fontSize: 14, opacity: 0.18 },

  // Runes
  rune: { position: "absolute", color: "rgba(232,197,71,0.055)" },

  // Chains
  chain: { position: "absolute" },
  chainText: { color: "rgba(232,197,71,0.055)", fontSize: 6, letterSpacing: 1 },

  // Scratches
  scratch: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 1,
  },

  // Vignettes
  vigBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(8,12,8,0.45)",
  },
  vigTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: "rgba(8,12,8,0.25)",
  },
  vigLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 52,
    width: 18,
    backgroundColor: "rgba(8,12,8,0.15)",
  },
  vigRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 52,
    width: 18,
    backgroundColor: "rgba(8,12,8,0.15)",
  },
})

// BOTTOM BAR — Replace the Battlements, WallTexture components and wall JSX in Game.tsx
// This file contains the new components and their styles
// The wall section in the main render should use these

// New battlements — ornate with gold accents
export const Battlements = React.memo(() => (
  <View style={bs.battlements}>
    {Array.from({ length: 22 }).map((_, i) => (
      <View key={i} style={i % 2 === 0 ? bs.merlon : bs.crenel} />
    ))}
    {/* Gold accent line under battlements */}
    <View style={bs.goldLine} />
  </View>
))

// New wall texture — more detailed surface
export const WallTexture = React.memo(() => (
  <View style={bs.wallTexture} pointerEvents="none">
    {/* Horizontal grain lines */}
    <View style={[bs.grainLine, { top: "25%" }]} />
    <View style={[bs.grainLine, { top: "50%" }]} />
    <View style={[bs.grainLine, { top: "75%" }]} />
    {/* Subtle dot pattern */}
    {Array.from({ length: 8 }).map((_, i) => (
      <View
        key={i}
        style={[
          bs.textureDot,
          {
            top: `${(i * 31 + 15) % 80}%`,
            left: `${(i * 23 + 8) % 90}%`,
            width: 1.5 + (i % 2),
            height: 1.5 + (i % 2),
            opacity: 0.03 + (i % 3) * 0.01,
          },
        ]}
      />
    ))}
  </View>
))

// Styles for bottom bar
export const bottomBarStyles = StyleSheet.create({
  // Wall container
  wallContainer: { width: "100%" },

  // Wall — dark premium base
  wall: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "#14100C",
    overflow: "hidden",
  },

  // Daily wall variant
  wallDaily: {
    backgroundColor: "#18140E",
    borderTopColor: "rgba(232,197,71,0.15)",
  },

  // Sections
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
  },
  spoilsBox: {
    justifyContent: "center",
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },

  // Center active cards area
  centerCards: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  openCardGlow: {
    position: "absolute",
    top: -8,
    left: -14,
    right: -14,
    bottom: -8,
    borderRadius: 14,
    backgroundColor: "rgba(232,197,71,0.02)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.05)",
  },
  openCardGlowWild: {
    backgroundColor: "rgba(232,197,71,0.08)",
    borderColor: "rgba(232,197,71,0.25)",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  // Right section — timer + combo
  rightBox: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 72,
    zIndex: 2,
  },

  // Labels
  label: {
    color: "rgba(232,197,71,0.55)",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 3,
  },
  scoreValue: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  comboValue: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
})

// Internal styles for battlements/texture
const bs = StyleSheet.create({
  battlements: {
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  merlon: {
    width: 12,
    height: 5,
    backgroundColor: "#14100C",
  },
  crenel: {
    width: 8,
    height: 5,
    backgroundColor: "transparent",
  },
  goldLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },

  wallTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  grainLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.02)",
  },
  textureDot: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: "rgba(232,197,71,0.05)",
  },
})

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 800, SCREEN_H / 400, 1)
const CARD_W = Math.round(52 * CARD_SCALE)
const CARD_H = Math.round(74 * CARD_SCALE)

const Game = ({
  onHome,
  dailyMode = false,
  uid,
  heroName,
  arenaMode,
  roomCode,
}: GameProps) => {
  const [theme, setTheme] = useState<ThemeConfig>({
    cardBack: "classic",
    cardBackColor: "#162A47",
    battlefield: "forest",
    battlefieldColor: "#0F1A12",
    wildStyle: "classic",
    warTable: "classic",
  })
  const [cards, setCards] = useState<ICard[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [level, setLevel] = useState(1)
  const [round, setRound] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [deckIndex, setDeckIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [totalCleared, setTotalCleared] = useState(0)
  const [totalFieldCards, setTotalFieldCards] = useState(0)
  const [betweenLevels, setBetweenLevels] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [secondCard, setSecondCard] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [wildCount, setWildCount] = useState(0)
  const [wildActive, setWildActive] = useState(false)
  const [wildFirstEarned, setWildFirstEarned] = useState(false)
  const [wildSecondEarned, setWildSecondEarned] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [alreadyPlayedScore, setAlreadyPlayedScore] = useState(0)
  const wildPulse = useRef(new Animated.Value(1)).current
  const [milestoneText, setMilestoneText] = useState("")
  const [milestoneIcon, setMilestoneIcon] = useState("")
  const [milestoneColor, setMilestoneColor] = useState("#fff")
  const milestoneOpacity = useRef(new Animated.Value(0)).current
  const milestoneScale = useRef(new Animated.Value(0.5)).current
  const levelCompleteRef = useRef(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointsOpacity = useRef(new Animated.Value(0)).current
  const pointsMove = useRef(new Animated.Value(0)).current
  const [showPoints, setShowPoints] = useState(false)
  const [lastPoints, setLastPoints] = useState(0)
  const comboPulse = useRef(new Animated.Value(1)).current
  const scorePulse = useRef(new Animated.Value(1)).current
  const deckScale = useRef(new Animated.Value(1)).current
  const [timerFrozen, setTimerFrozen] = useState(false)
  const freezeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeLeftRef = useRef(0)
  const [arenaPlayers, setArenaPlayers] = useState<any[]>([])
  const arenaUnsubRef = useRef<(() => void) | null>(null)
  const [arenaCountdown, setArenaCountdown] = useState<number | null>(null)
  const freezePulse = useRef(new Animated.Value(0)).current
  const comboGlowOpacity = useRef(new Animated.Value(0)).current
  const [rank, setRank] = useState<number | null>(null)
  const [dailyRank, setDailyRank] = useState<number | null>(null)
  const [isAllTimeRecord, setIsAllTimeRecord] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const [preBattle, setPreBattle] = useState(true)
  const [gloryCharges, setGloryCharges] = useState(1)
  const [gloryActive, setGloryActive] = useState(false)

  const gloryActiveRef = useRef(false)

  const [bountyIndices, setBountyIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!arenaMode || !betweenLevels || arenaPlayers.length === 0) return
    const allReady = arenaPlayers.every(
      (p: any) => (p.currentLevel || 0) >= level,
    )
    if (allReady && arenaCountdown === null) {
      setArenaCountdown(3)
    }
  }, [arenaPlayers, betweenLevels, level, arenaMode])

  useEffect(() => {
    if (arenaCountdown === null) return
    if (arenaCountdown <= 0) {
      setArenaCountdown(null)
      handleNextLevel()
      return
    }
    const timer = setTimeout(
      () => setArenaCountdown((c) => (c !== null ? c - 1 : null)),
      1000,
    )
    return () => clearTimeout(timer)
  }, [arenaCountdown])

  // Check if already played daily
  useEffect(() => {
    getSelectedTheme().then(setTheme)
    if (dailyMode && uid) {
      setLoading(true)
      hasPlayedToday(uid).then((result) => {
        if (result.played) {
          setAlreadyPlayed(true)
          setAlreadyPlayedScore(result.score || 0)
        }
        setLoading(false)
      })
    }
  }, [])

  useEffect(() => {
    if (arenaMode && roomCode) {
      arenaUnsubRef.current = onRoomUpdate(roomCode, (room) => {
        if (room?.players) {
          console.log("ARENA PLAYERS:", JSON.stringify(room.players))
          const sorted = Object.values(room.players).sort(
            (a: any, b: any) => b.score - a.score,
          )
          setArenaPlayers(sorted)
        }
      })
    }
    return () => {
      if (arenaUnsubRef.current) arenaUnsubRef.current()
    }
  }, [arenaMode, roomCode])

  useEffect(() => {
    if (gameOver && !scoreSaved) {
      setScoreSaved(true)
      const clearPct =
        totalFieldCards > 0
          ? Math.round((totalCleared / totalFieldCards) * 100)
          : 0
      if (uid && heroName) {
        // Check if this is a new ALL-TIME record before saving
        firestore()
          .collection("allTimeScores")
          .orderBy("score", "desc")
          .limit(1)
          .get()
          .then((snap) => {
            if (snap.empty || score > (snap.docs[0].data().score || 0)) {
              setIsAllTimeRecord(true)
              setShowCelebration(true)
            }
          })
          .catch(() => {})

        submitGameScore(uid, heroName, score, bestCombo, dailyMode)
        submitAllTimeScore(uid, heroName, score, bestCombo)
        getSavedLoungeCode().then((code) => {
          if (code && uid && heroName) {
            submitLoungeScore(code, uid, heroName, score, bestCombo)
          }
        })
        updateUserProfile(uid, score, bestCombo, totalCleared)
        if (dailyMode) {
          submitDailyScore(uid, heroName, score, bestCombo, clearPct)
          firestore()
            .collection("dailyScores")
            .where("date", "==", getTodayString())
            .where("score", ">", score)
            .get()
            .then((snap) => {
              setDailyRank(snap.size + 1)
            })
            .catch(() => setDailyRank(null))
        }
        if (arenaMode && roomCode) {
          updatePlayerScore(roomCode, uid, score, bestCombo, TOTAL_LEVELS, true)
        }

        // Fetch rank for this game
        firestore()
          .collection("gameScores")
          .where("score", ">", score)
          .get()
          .then((snap) => {
            setRank(snap.size + 1)
          })
          .catch(() => setRank(null))
      }
      if (score > 0) {
        saveScore(score, bestCombo)
        incrementGamesPlayed()
      }
    }
  }, [gameOver])

  useEffect(() => {
    if (combo > 0) {
      if (combo > bestCombo) setBestCombo(combo)
      if (combo >= 10) {
        comboGlowOpacity.setValue(0.8)
        Animated.timing(comboGlowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }).start()
      } else {
        comboGlowOpacity.setValue(0)
      }
      Animated.sequence([
        Animated.timing(comboPulse, {
          toValue: 1.4,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(comboPulse, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start()
      const m = COMBO_MILESTONES[combo]
      if (m) showMilestone(m.text, m.color, m.icon)
      // Freeze timer on combo milestones
      if (combo === 5) freezeTimerForCombo(3)
      else if (combo === 10) freezeTimerForCombo(5)
      else if (combo === 15) freezeTimerForCombo(3)
      else if (combo === 20) freezeTimerForCombo(5)
      else if (combo === 25) freezeTimerForCombo(3)
      else if (combo === 30) freezeTimerForCombo(5)
      if (
        combo >= WILD_SECOND_THRESHOLD &&
        wildFirstEarned &&
        !wildSecondEarned
      ) {
        setWildCount((c) => Math.min(c + 1, 2))
        setWildSecondEarned(true)
        showMilestone("2nd WILD!", "#FF4757", "🃏🃏")
      } else if (combo >= WILD_COMBO_THRESHOLD && !wildFirstEarned) {
        setWildCount(1)
        setWildFirstEarned(true)
        showMilestone("WILD CARD!", "#E8C547", "🃏")
      }
    }
  }, [combo])
  useEffect(() => {
    if (wildActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wildPulse, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(wildPulse, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else wildPulse.setValue(1)
  }, [wildActive])
  useEffect(() => {
    if (score > 0)
      Animated.sequence([
        Animated.timing(scorePulse, {
          toValue: 1.15,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(scorePulse, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
  }, [score])

  const showMilestone = (text: string, color: string, icon: string) => {
    setMilestoneText(text)
    setMilestoneColor(color)
    setMilestoneIcon(icon)
    milestoneOpacity.setValue(0)
    milestoneScale.setValue(0.85)

    Animated.parallel([
      Animated.timing(milestoneOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(milestoneScale, {
        toValue: 1,
        friction: 8,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(milestoneOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }, 600)
    })
  }

  const freezeTimerForCombo = (seconds: number) => {
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setTimerFrozen(true)
    freezeTimer.current = setTimeout(() => {
      setTimerFrozen(false)
    }, seconds * 1000)
    freezePulse.setValue(0.8)
    Animated.timing(freezePulse, {
      toValue: 0.2,
      duration: 3000,
      useNativeDriver: true,
    }).start()
    SoundService.playFreeze()
  }

  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[1]
  const wildConfig =
    WILD_STYLE_CONFIG[theme.wildStyle || "classic"] || WILD_STYLE_CONFIG.classic
  const tableConfig =
    WAR_TABLE_CONFIG[theme.warTable || "classic"] || WAR_TABLE_CONFIG.classic

  // Inside Game component, after the wildConfig/tableConfig lines:
  const bountyConfig =
    BOUNTY_STYLE_CONFIG[theme.bountyStyle || "classic"] ||
    BOUNTY_STYLE_CONFIG.classic

  const advanceLevel = useCallback(() => {
    if (levelCompleteRef.current) return
    levelCompleteRef.current = true
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setTimerFrozen(false)
    const cl = cards
      .slice(0, config.fieldCards)
      .filter((c) => !c.visible).length
    setTotalCleared((p) => p + cl)
    setTotalFieldCards((p) => p + config.fieldCards)

    // Time bonus — 50 points per second remaining
    const gloryMult = gloryActiveRef.current ? 2 : 1
    const timeBonus = timeLeftRef.current * 50 * gloryMult
    if (timeBonus > 0) setScore((s) => s + timeBonus)

    const deckRemaining = cards.length - deckIndex
    const deckBonus = deckRemaining * 200 * gloryMult
    if (deckBonus > 0) setScore((s) => s + deckBonus)

    const allCleared = cards
      .slice(0, config.fieldCards)
      .every((c) => !c.visible)
    if (allCleared) {
      const layoutMultiplier = 1 + (level - 1) * 0.5
      const gloryMult = gloryActiveRef.current ? 2 : 1
      const perfectBonus = Math.round(50000 * layoutMultiplier * gloryMult)
      setScore((s) => s + perfectBonus)
      showMilestone("PERFECT CLEAR!", "#7BED9F", "✨")
    }

    SoundService.playLevelComplete()
    // Sync score to arena room
    if (arenaMode && roomCode && uid) {
      updatePlayerScore(
        roomCode,
        uid,
        score,
        bestCombo,
        level,
        level >= TOTAL_LEVELS,
      )
    }
    if (arenaMode && roomCode && uid) {
      updatePlayerScore(
        roomCode,
        uid,
        score,
        bestCombo,
        level,
        level >= TOTAL_LEVELS,
      )
    }
    setArenaCountdown(null)
    setGloryActive(false)
    gloryActiveRef.current = false
    setWildCount(0)
    setWildFirstEarned(false)
    setWildSecondEarned(false)
    setBountyIndices(new Set())
    setBetweenLevels(true)
  }, [cards, config.fieldCards])

  const initLevel = useCallback(() => {
    if (alreadyPlayed) return
    setLoading(true)
    setWildActive(false)
    // setGloryActive(false)
    setReady(false)
    levelCompleteRef.current = false
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    const deck = dailyMode
      ? generateDailyDeck(getTodayString(), level)
      : arenaMode && roomCode
        ? generateDailyDeck(`${roomCode}-${round}`, level)
        : generateDeck()
    setCards(deck.map((c, i) => ({ ...c, visible: i < config.fieldCards })))
    const shuffledIndices = Array.from(
      { length: config.fieldCards },
      (_, i) => i,
    ).sort(() => Math.random() - 0.5)
    setBountyIndices(new Set(shuffledIndices.slice(0, 2)))
    setCurrentIndex(config.deckStart)
    setDeckIndex(config.deckStart + 1)
    setCombo(0)
    setSecondCard(null)
    setShowHints(false)
    setWildActive(false)
    setTimerFrozen(false)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      SoundService.playShuffle()
      setTimeout(() => setReady(true), 50)
    }, 20)
  }, [level, config.fieldCards, config.deckStart, dailyMode, alreadyPlayed])

  useEffect(() => {
    if (!alreadyPlayed && !preBattle) initLevel()
  }, [level, round, alreadyPlayed, preBattle])
  useEffect(
    () => () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
      if (freezeTimer.current) clearTimeout(freezeTimer.current)
    },
    [],
  )
  useEffect(() => {
    if (!ready || !cards.length || levelCompleteRef.current) return
    if (cards.slice(0, config.fieldCards).every((c) => !c.visible))
      advanceLevel()
  }, [cards, ready])
  useEffect(() => {
    if (!ready || !cards.length || levelCompleteRef.current) return
    if (deckIndex < cards.length) return
    const hv = cards.slice(0, config.fieldCards).some((c) => c.visible)
    if (!hv) {
      advanceLevel()
      return
    }
    const cur = cards[currentIndex]
    const sec = secondCard !== null ? cards[secondCard] : null
    if (!cur) {
      advanceLevel()
      return
    }
    const hm = cards.slice(0, config.fieldCards).some((c) => {
      if (!c.visible) return false
      return isCardMatch(cur, c) || (sec && isCardMatch(sec, c))
    })
    if (hm) {
      if (!autoAdvanceTimer.current) {
        autoAdvanceTimer.current = setTimeout(() => {
          if (!levelCompleteRef.current) advanceLevel()
        }, 2000)
      }
      return
    }
    if (!hm && !wildActive) {
      if (wildCount <= 0) {
        advanceLevel()
        return
      }
      // Has wild but no matches — give 3 seconds to use it
      if (!autoAdvanceTimer.current) {
        autoAdvanceTimer.current = setTimeout(() => {
          if (!levelCompleteRef.current) advanceLevel()
        }, 2000)
      }
      return
    }
  }, [deckIndex, cards, currentIndex, secondCard, ready, wildActive, wildCount])

  const showPointsAnimation = (pts: number) => {
    requestAnimationFrame(() => {
      setLastPoints(pts)
      setShowPoints(true)
      pointsOpacity.setValue(1)
      pointsMove.setValue(0)
      Animated.parallel([
        Animated.timing(pointsOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pointsMove, {
          toValue: -35,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => setShowPoints(false))
    })
  }

  const [wildPlacing, setWildPlacing] = useState(false)
  const [wildPendingIndex, setWildPendingIndex] = useState<number | null>(null)

  const handleCardPress = useCallback(
    (index: number) => {
      setCards((prev) => {
        const cur = prev[currentIndex]
        const tapped = prev[index]
        if (!cur || !tapped) return prev
        const isW = wildActive
        const mc = isCardMatch(cur, tapped)
        const ms = secondCard !== null && isCardMatch(prev[secondCard], tapped)
        if (!mc && !ms && !isW) return prev
        if (autoAdvanceTimer.current) {
          clearTimeout(autoAdvanceTimer.current)
          autoAdvanceTimer.current = null
        }
        const nc = combo + 1
        const layoutMultiplier = 1 + (level - 1) * 0.5 // L1=1x, L2=1.5x, L3=2x, L4=2.5x, L5=3x
        const gloryMultiplier = gloryActive ? 2 : 1
        const isBounty = bountyIndices.has(index)
        const bountyMultiplier = isBounty ? 5 : 1
        const pts = Math.round(
          BASE_CARD_VALUE *
            getComboMultiplier(nc) *
            layoutMultiplier *
            gloryMultiplier *
            bountyMultiplier,
        )
        if (isBounty) {
          showMilestone("BOUNTY!", "#FFD700", "💰")
        }
        SoundService.playMatch(nc)
        showPointsAnimation(pts)
        const u = [...prev]
        u[index] = { ...u[index], visible: false }
        setCombo(nc)
        setScore((s) => s + pts)
        setShowHints(false)
        // In handleCardPress, replace the wild (isW) branch:
        if (isW) {
          setWildActive(false)
          if (secondCard !== null) {
            // Two active cards — need user to pick placement
            setWildPendingIndex(index) // store which field card was matched
            setWildPlacing(true) // trigger placement UI
          } else {
            // Only one active card — auto place
            setTimerFrozen(false)
            setCurrentIndex(index)
          }
        } else if (mc) {
          if (nc >= SECOND_CARD_COMBO && secondCard === null)
            setSecondCard(currentIndex)
          setCurrentIndex(index)
        } else setSecondCard(index)
        return u
      })
    },
    [currentIndex, secondCard, combo, wildActive, gloryActive, bountyIndices],
  )

  const activateGloryHunt = () => {
    if (gloryCharges <= 0) return
    setGloryCharges((c) => c - 1)
    setGloryActive(true)
    gloryActiveRef.current = true
    SoundService.playFreeze()
  }

  const handleDeckPress = useCallback(() => {
    if (deckIndex >= cards.length) return
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }
    SoundService.playDeckDraw()
    Animated.sequence([
      Animated.timing(deckScale, {
        toValue: 0.9,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(deckScale, {
        toValue: 1,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start()
    setCurrentIndex(deckIndex)
    setDeckIndex((i) => i + 1)
    setCombo(0)
    setTimerFrozen(false)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setSecondCard(null)
    setShowHints(false)
    setWildActive(false)
  }, [deckIndex, cards.length])

  const [wildSelecting, setWildSelecting] = useState(false)

  const handleWildSelectFirst = () => {
    // Wild replaces first card — second card stays
    setWildSelecting(false)
    setWildActive(true)
    // currentIndex stays, secondCard stays
  }

  const handleWildSelectSecond = () => {
    // Wild replaces second card — first card stays
    setCurrentIndex(secondCard!)
    setSecondCard(currentIndex) // ← keep old first as second
    setWildSelecting(false)
    setWildActive(true)
  }

  const handleWildPlaceFirst = () => {
    SoundService.playDeckDraw()
    // New card replaces first slot, old first becomes second stays
    setSecondCard(currentIndex)
    setCurrentIndex(wildPendingIndex!)
    setWildPlacing(false)
    setWildPendingIndex(null)
    setTimerFrozen(false)
  }

  const handleWildPlaceSecond = () => {
    SoundService.playDeckDraw()
    // New card replaces second slot, first stays
    setSecondCard(wildPendingIndex!)
    setCurrentIndex(currentIndex) // stays
    setWildPlacing(false)
    setWildPendingIndex(null)
    setTimerFrozen(false)
  }

  const handleWild = () => {
    if (wildCount <= 0 || wildActive) return
    setWildCount((c) => c - 1)
    setTimerFrozen(true)
    setWildActive(true)
  }
  const handleNextLevel = () => {
    setBetweenLevels(false)
    level >= TOTAL_LEVELS ? setGameOver(true) : setLevel((l) => l + 1)
  }
  const handlePlayAgain = () => {
    if (dailyMode) {
      onHome?.()
      return
    }
    setScore(0)
    setBestCombo(0)
    setTotalCleared(0)
    setTotalFieldCards(0)
    setLevel(1)
    setGameOver(false)
    setScoreSaved(false)
    setWildCount(0)
    setWildFirstEarned(false)
    setWildSecondEarned(false)
    setWildActive(false)
    setWildActive(false)
    setRound((r) => r + 1)
    setPreBattle(true)
    setGloryCharges(1)
    setGloryActive(false)
    setBountyIndices(new Set())
  }
  const handleBackPress = () => {
    setShowQuitConfirm(true)
  }
  const handleResumeFromQuit = () => {
    setShowQuitConfirm(false)
  }
  const handleConfirmQuit = async () => {
    setShowQuitConfirm(false)
    setPaused(false)
    if (arenaMode && roomCode && uid) {
      await leaveRoom(roomCode, uid)
    }
    onHome?.()
  }

  const [wantsRematch, setWantsRematch] = useState(false)

  const handleArenaRematch = async () => {
    if (!arenaMode || !roomCode || !uid || wantsRematch) return
    setWantsRematch(true)
    await setPlayerRematch(roomCode, uid)
  }

  useEffect(() => {
    if (!arenaMode || !roomCode || !uid) return

    // Watch rematchCount — when it reaches player count, first player to see it resets
    const db = require("@react-native-firebase/database").default()
    const rematchRef = db.ref(`rooms/${roomCode}/rematchCount`)

    const onRematchCount = rematchRef.on("value", async (snap: any) => {
      const count = snap.val() ?? 0
      const total = arenaPlayers.length
      if (total > 0 && count >= total && wantsRematch) {
        // Use a transaction on a "resetting" flag so only ONE player triggers the reset
        const resetFlagRef = db.ref(`rooms/${roomCode}/isResetting`)
        resetFlagRef.transaction(
          (current: boolean | null) => {
            return current ? undefined : true // undefined = abort if already true
          },
          async (err: any, committed: boolean) => {
            if (!committed) return // another player got here first
            await resetRoomForRematch(roomCode)
          },
        )
      }
    })

    return () => rematchRef.off("value", onRematchCount)
  }, [arenaMode, roomCode, uid, arenaPlayers.length, wantsRematch])

  // Watch room state — when it flips back to "playing", restart the game
  useEffect(() => {
    if (!arenaMode || !roomCode || !gameOver) return

    const db = require("@react-native-firebase/database").default()
    const stateRef = db.ref(`rooms/${roomCode}/state`)

    const onState = stateRef.on("value", (snap: any) => {
      const state = snap.val()
      if (state === "playing" && wantsRematch) {
        // Reset all local state and restart
        setScore(0)
        setBestCombo(0)
        setTotalCleared(0)
        setTotalFieldCards(0)
        setLevel(1)
        setGameOver(false)
        setScoreSaved(false)
        setWildCount(0)
        setWildFirstEarned(false)
        setWildSecondEarned(false)
        setWildActive(false)
        setWantsRematch(false)
        setRound((r) => r + 1)
      }
    })

    return () => stateRef.off("value", onState)
  }, [arenaMode, roomCode, gameOver, wantsRematch])

  const remaining = cards.length - deckIndex
  const hintedIndices = useMemo(() => {
    const s = new Set<number>()
    if (!cards.length || !showHints) return s
    const cur = cards[currentIndex]
    const sec = secondCard !== null ? cards[secondCard] : null
    cards.slice(0, config.fieldCards).forEach((c, i) => {
      if (c.visible && (isCardMatch(cur, c) || (sec && isCardMatch(sec, c))))
        s.add(i)
    })
    return s
  }, [cards, currentIndex, secondCard, showHints, config.fieldCards])

  const layoutKey = `${level}-${round}`
  const getLayout = () => {
    const p = {
      cards,
      onClick: handleCardPress,
      hintedIndices,
      bountyIndices,
      bountyConfig,
    }

    switch (config.layout) {
      case 9:
        return <Layout9 key={layoutKey} {...p} />
      case 8:
        return <Layout8 key={layoutKey} {...p} />
      case 7:
        return <Layout7 key={layoutKey} {...p} />
      case 5:
        return <Layout5 key={layoutKey} {...p} />
      case 2:
        return <Layout2 key={layoutKey} {...p} />
      default:
        return <Layout1 key={layoutKey} {...p} />
    }
  }
  const comboColor =
    combo >= 10
      ? "#FF4757"
      : combo >= 7
        ? "#FF6B35"
        : combo >= 5
          ? "#FFD700"
          : combo >= 3
            ? "#7BED9F"
            : "#E8C547"

  // Already played daily
  if (alreadyPlayed)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        <Battlefield battlefieldId={theme.battlefield} />
        <Text style={styles.dailyBadgeIcon}>📜</Text>
        <Text style={styles.gameTitle}>QUEST COMPLETE</Text>
        <Text style={styles.partialText}>
          You already fought today's battle
        </Text>
        <View style={styles.divider} />
        <Text style={styles.scoreLabel}>YOUR SCORE</Text>
        <Text style={styles.finalScore}>
          {alreadyPlayedScore.toLocaleString()}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.partialText}>
          Come back tomorrow for a new quest!
        </Text>
        <TouchableOpacity style={styles.goldBtn} onPress={onHome}>
          <Text style={styles.goldBtnText}>🏰 Return to Castle</Text>
        </TouchableOpacity>
      </View>
    )

  if (preBattle && level === 1 && !alreadyPlayed)
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.battlefieldColor,
            flexDirection: "row",
            paddingHorizontal: 24,
            gap: 20,
          },
        ]}
      >
        <Battlefield battlefieldId={theme.battlefield} />

        {/* Left — Title + Info */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 42 }}>⚔</Text>
          <Text style={styles.gameTitle}>PREPARE</Text>
          <Text style={styles.gameTitle}>FOR BATTLE</Text>
          <View style={styles.divider} />
          <Text style={styles.partialText}>
            {dailyMode ? "Daily Quest" : `${TOTAL_LEVELS} battlefields await`}
          </Text>

          {/* Layout preview — progress dots */}
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
              <View key={i} style={styles.progressDot} />
            ))}
          </View>
        </View>

        {/* Right — Glory Hunt + Enter */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {/* Glory Hunt option */}
          {!dailyMode && gloryCharges > 0 && (
            <TouchableOpacity
              style={[styles.gloryBtn, gloryActive && styles.gloryBtnActive]}
              onPress={activateGloryHunt}
              disabled={gloryActive}
              activeOpacity={0.8}
            >
              <Text style={styles.gloryBtnIcon}>⚡</Text>
              <View>
                <Text style={styles.gloryBtnText}>
                  {gloryActive ? "GLORY HUNT ACTIVE" : "Glory Hunt"}
                </Text>
                <Text style={styles.gloryBtnSub}>
                  {gloryActive
                    ? "2x points · 50% time"
                    : `2x points · 50% time (${gloryCharges} charge)`}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {gloryActive && !gloryCharges && (
            <View style={styles.gloryBonusBox}>
              <Text style={styles.gloryBonusText}>⚡ GLORY HUNT READY</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.goldBtn}
            onPress={() => setPreBattle(false)}
          >
            <Text style={styles.goldBtnText}>
              {gloryActive ? "⚡ Begin Glory Hunt" : "⚔ Enter Battle"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onHome}>
            <Text style={styles.ghostBtnText}>🏰 Return to Castle</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  if (loading)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        <Battlefield battlefieldId={theme.battlefield} />
        <Text style={styles.loadText}>
          ⚔ {dailyMode ? "Preparing daily quest..." : "Preparing the field..."}
        </Text>
      </View>
    )

  if (gameOver) {
    const clearPct =
      totalFieldCards > 0
        ? Math.round((totalCleared / totalFieldCards) * 100)
        : 0

    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.battlefieldColor,
            flexDirection: "row",
            paddingHorizontal: 24,
            gap: 20,
          },
        ]}
      >
        <Battlefield battlefieldId={theme.battlefield} />

        {/* Left — Score + Stats */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {isAllTimeRecord ? (
            <View style={styles.recordBanner}>
              <Text style={styles.recordStars}>✦ ✦ ✦ ✦ ✦</Text>
              <Text style={styles.recordIcon}>🏆</Text>
              <Text style={styles.recordTitle}>ALL-TIME RECORD</Text>
              <Text style={styles.recordSub}>You are the #1 warrior!</Text>
              <Text style={styles.recordStars}>✦ ✦ ✦ ✦ ✦</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 36 }}>
                {clearPct >= 80 ? "👑" : clearPct >= 50 ? "⚔" : "🛡"}
              </Text>
              <Text style={styles.gameTitle}>
                {dailyMode
                  ? "QUEST COMPLETE"
                  : clearPct >= 80
                    ? "VICTORY"
                    : clearPct >= 50
                      ? "BATTLE OVER"
                      : "RETREAT"}
              </Text>
            </>
          )}

          <View style={styles.divider} />

          {/* Rank */}
          {!arenaMode &&
            uid &&
            (dailyMode ? (
              dailyRank !== null ? (
                <Text style={styles.rankText}>
                  #{dailyRank} in today's quest
                </Text>
              ) : (
                <Text style={styles.rankLoading}>Calculating rank...</Text>
              )
            ) : rank !== null ? (
              <Text style={styles.rankText}>#{rank} among all warriors</Text>
            ) : (
              <Text style={styles.rankLoading}>Calculating rank...</Text>
            ))}

          {/* Final score */}
          <Text style={styles.finalScore}>{score.toLocaleString()}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{clearPct}%</Text>
              <Text style={styles.statLabel}>CLEARED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>x{bestCombo}</Text>
              <Text style={styles.statLabel}>BEST COMBO</Text>
            </View>
          </View>

          {!arenaMode && uid && (
            <Text style={styles.dailySubmitted}>
              {dailyMode
                ? "✓ Score submitted to daily leaderboard"
                : "✓ Score saved to Hall of Glory"}
            </Text>
          )}
        </View>

        {/* Right — Rankings + Buttons */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {/* Arena final rankings */}
          {arenaMode && arenaPlayers.length > 0 && (
            <View style={styles.arenaBoard}>
              <Text style={styles.arenaBoardTitle}>🏆 FINAL RANKINGS</Text>
              <ScrollView style={styles.arenaScroll} nestedScrollEnabled>
                {arenaPlayers.map((p: any, i: number) => (
                  <View
                    key={p.uid || i}
                    style={[
                      styles.arenaRow,
                      p.uid === uid && styles.arenaRowYou,
                    ]}
                  >
                    <Text style={styles.arenaRank}>
                      {i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `${i + 1}.`}
                    </Text>
                    <Text
                      style={[
                        styles.arenaName,
                        p.uid === uid && styles.arenaNameYou,
                      ]}
                    >
                      {p.heroName}
                    </Text>
                    <Text style={styles.arenaCombo}>x{p.bestCombo || 0}</Text>
                    <Text style={styles.arenaScore}>
                      {(p.score || 0).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity style={styles.goldBtn} onPress={handlePlayAgain}>
            <Text style={styles.goldBtnText}>
              {dailyMode ? "🏰 Return to Castle" : "⚔ Battle Again"}
            </Text>
          </TouchableOpacity>

          {!dailyMode && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={arenaMode ? handleConfirmQuit : onHome}
            >
              <Text style={styles.ghostBtnText}>🏰 Return to Castle</Text>
            </TouchableOpacity>
          )}

          {!dailyMode && !arenaMode && (
            <Text style={styles.partialText}>
              Check Hall of Glory for rankings
            </Text>
          )}
        </View>

        {showCelebration && (
          <RecordCelebration
            score={score}
            heroName={heroName || "Unknown"}
            onDismiss={() => setShowCelebration(false)}
          />
        )}
      </View>
    )
  }

  if (betweenLevels) {
    const cleared = cards.slice(0, config.fieldCards).every((c) => !c.visible)
    const rem =
      config.fieldCards -
      cards.slice(0, config.fieldCards).filter((c) => !c.visible).length

    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.battlefieldColor,
            flexDirection: "row",
            paddingHorizontal: 24,
            gap: 20,
          },
        ]}
      >
        <Battlefield battlefieldId={theme.battlefield} />

        {/* Left — Result + Score */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 36 }}>{cleared ? "⚔" : "🛡"}</Text>
          <View style={styles.banner}>
            <View style={styles.bannerEdge} />
            <View style={styles.bannerBody}>
              <Text style={styles.bannerTitle}>
                {cleared ? "FIELD CLEARED" : "RETREAT"}
              </Text>
              <Text style={styles.bannerSub}>
                Battlefield {level} of {TOTAL_LEVELS}
              </Text>
            </View>
            <View style={styles.bannerEdge} />
          </View>
          {!cleared && (
            <Text style={styles.partialText}>
              {rem} beast{rem !== 1 ? "s" : ""} remained
            </Text>
          )}
          <View style={styles.divider} />
          <View style={styles.spoilsCard}>
            <Text style={styles.spoilsCardLabel}>TOTAL SPOILS</Text>
            <Text style={styles.spoilsCardValue}>{score.toLocaleString()}</Text>
          </View>

          {gloryActive && (
            <View style={styles.gloryBonusBox}>
              <Text style={styles.gloryBonusText}>⚡ GLORY HUNT — 2x</Text>
            </View>
          )}

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < level && styles.progressDotFilled,
                ]}
              >
                {i < level && <Text style={styles.progressCheck}>✓</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Right — Actions */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {/* Arena scoreboard */}
          {arenaMode && arenaPlayers.length > 0 && (
            <View style={styles.arenaBoard}>
              <Text style={styles.arenaBoardTitle}>⚔ ARENA STANDINGS</Text>
              <ScrollView style={styles.arenaScroll} nestedScrollEnabled>
                {arenaPlayers.map((p: any, i: number) => (
                  <View
                    key={p.uid || i}
                    style={[
                      styles.arenaRow,
                      p.uid === uid && styles.arenaRowYou,
                    ]}
                  >
                    <Text style={styles.arenaRank}>
                      {i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `${i + 1}.`}
                    </Text>
                    <Text
                      style={[
                        styles.arenaName,
                        p.uid === uid && styles.arenaNameYou,
                      ]}
                    >
                      {p.heroName}
                    </Text>
                    <Text style={styles.arenaScore}>
                      {(p.currentLevel || 0) >= 1
                        ? (p.score || 0).toLocaleString()
                        : "..."}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Info card — next multiplier */}
          {level < TOTAL_LEVELS && (
            <View style={styles.nextBattleInfo}>
              <Text style={styles.nextBattleLabel}>NEXT BATTLEFIELD</Text>
              <Text style={styles.nextBattleMultiplier}>
                {(1 + level * 0.5).toFixed(1)}x spoils
              </Text>
            </View>
          )}

          {/* Glory Hunt */}
          {level < TOTAL_LEVELS - 1 && gloryCharges > 0 && !gloryActive && (
            <TouchableOpacity
              style={styles.gloryBtn}
              onPress={activateGloryHunt}
              activeOpacity={0.8}
            >
              <Text style={styles.gloryBtnIcon}>⚡</Text>
              <View>
                <Text style={styles.gloryBtnText}>Glory Hunt</Text>
                <Text style={styles.gloryBtnSub}>
                  2x points · 50% time ({gloryCharges} left)
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {gloryActive && (
            <View style={styles.gloryBonusBox}>
              <Text style={styles.gloryBonusText}>⚡ GLORY HUNT READY</Text>
            </View>
          )}

          {/* Next Battle / Arena */}
          {arenaMode ? (
            (() => {
              const allReady =
                arenaPlayers.length > 0 &&
                arenaPlayers.every((p: any) => (p.currentLevel || 0) >= level)
              return allReady ? (
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownText}>
                    {arenaCountdown || "GO!"}
                  </Text>
                  <Text style={styles.countdownLabel}>NEXT BATTLE IN</Text>
                </View>
              ) : (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingArenaText}>
                    Waiting... (
                    {
                      arenaPlayers.filter(
                        (p: any) => (p.currentLevel || 0) >= level,
                      ).length
                    }
                    /{arenaPlayers.length})
                  </Text>
                </View>
              )
            })()
          ) : (
            <TouchableOpacity
              style={styles.nextBattleBtn}
              onPress={handleNextLevel}
            >
              <Text style={styles.nextBattleBtnText}>
                {level >= TOTAL_LEVELS
                  ? "🏆 Claim Victory"
                  : gloryActive
                    ? "⚡ Begin Glory Hunt"
                    : "⚔ Next Battle"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  if (paused)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        <Battlefield battlefieldId={theme.battlefield} />
        <Text style={styles.gameTitle}>⏸ PAUSED</Text>
        <Text style={styles.pauseScore}>{score.toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.goldBtn}
          onPress={() => setPaused(false)}
        >
          <Text style={styles.goldBtnText}>▶ Resume</Text>
        </TouchableOpacity>
        {!dailyMode && (
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              setPaused(false)
              setScore(0)
              setLevel(1)
              setRound((r) => r + 1)
            }}
          >
            <Text style={styles.ghostBtnText}>↺ Restart</Text>
          </TouchableOpacity>
        )}
        {onHome && (
          <TouchableOpacity style={styles.ghostBtn} onPress={onHome}>
            <Text style={styles.ghostBtnText}>🏰 Home</Text>
          </TouchableOpacity>
        )}
      </View>
    )

  return (
    <CardBackColorContext.Provider
      value={dailyMode ? "#3D2E0A" : theme.cardBackColor}
    >
      <BountyStyleContext.Provider value={bountyConfig}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: dailyMode ? "#0F0A05" : theme.battlefieldColor },
          ]}
        >
          <Battlefield battlefieldId={theme.battlefield} />
          {combo >= 10 && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor:
                    combo >= 25
                      ? "rgba(200,50,255,0.12)"
                      : combo >= 15
                        ? "rgba(255,70,70,0.1)"
                        : "rgba(255,200,50,0.06)",
                  opacity: comboGlowOpacity,
                },
              ]}
            />
          )}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBackPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>

          {wildActive && (
            <Animated.View
              style={[
                styles.wildBorder,
                {
                  transform: [{ scale: wildPulse }],
                  borderColor: wildConfig.accent + "40",
                },
              ]}
              pointerEvents="none"
            />
          )}
          {wildActive && (
            <View
              style={[
                styles.wildActiveLabel,
                {
                  borderColor: wildConfig.accent + "60",
                  backgroundColor: wildConfig.color + "E6",
                },
              ]}
            >
              <Text style={styles.wildActiveBolt}>{wildConfig.icon}</Text>
              <View>
                <Text
                  style={[styles.wildActiveText, { color: wildConfig.accent }]}
                >
                  WILD CARD
                </Text>
                <Text
                  style={[
                    styles.wildActiveSub,
                    { color: wildConfig.accent + "70" },
                  ]}
                >
                  Tap any card to match
                </Text>
              </View>
            </View>
          )}
          {gloryActive && (
            <View style={styles.gloryBadge}>
              <Text style={styles.gloryBadgeText}>⚡ GLORY HUNT · 2X</Text>
            </View>
          )}

          <View style={styles.field}>
            {ready ? (
              <LayoutEntrance key={layoutKey} layoutKey={layoutKey}>
                {getLayout()}
              </LayoutEntrance>
            ) : null}
          </View>

          {wildPlacing && (
            <View style={styles.wildSelectBanner}>
              <Text style={styles.wildSelectBannerText}>
                ⚡ TAP CARD TO REPLACE
              </Text>
            </View>
          )}

          <View style={styles.wallContainer}>
            <Battlements />
            <View
              style={[
                styles.wall,
                {
                  backgroundColor: dailyMode ? "#1A1510" : tableConfig.color,
                  borderTopColor: tableConfig.accent + "18",
                },
                dailyMode && styles.wallDaily,
              ]}
            >
              <WallTexture />
              <View style={styles.leftSection}>
                <Animated.View style={{ transform: [{ scale: deckScale }] }}>
                  <Card
                    remaining={remaining > 0 ? remaining : 0}
                    alwaysEnabled={remaining > 0}
                    disabled={remaining <= 0}
                    onClick={handleDeckPress}
                    cardBackColor={dailyMode ? "#3D2E0A" : theme.cardBackColor}
                  />
                </Animated.View>
                <View style={styles.spoilsBox}>
                  <Text style={styles.label}>SPOILS</Text>
                  <Animated.Text
                    style={[
                      styles.scoreValue,
                      { transform: [{ scale: scorePulse }] },
                    ]}
                  >
                    {score.toLocaleString()}
                  </Animated.Text>
                </View>
              </View>
              <View style={styles.centerCards}>
                <View
                  style={[
                    styles.openCardGlow,
                    wildActive && styles.openCardGlowWild,
                  ]}
                />
                {wildPlacing ? (
                  <>
                    <TouchableOpacity
                      onPress={handleWildPlaceFirst}
                      activeOpacity={0.7}
                    >
                      <PulsingCard>
                        <Card
                          card={cards[currentIndex]}
                          isOpen
                          disabled
                          cardBackColor={theme.cardBackColor}
                        />
                      </PulsingCard>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleWildPlaceSecond}
                      activeOpacity={0.7}
                    >
                      <PulsingCard>
                        <Card
                          card={cards[secondCard!]}
                          isOpen
                          disabled
                          cardBackColor={theme.cardBackColor}
                        />
                      </PulsingCard>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Card
                      card={cards[currentIndex]}
                      isOpen
                      disabled
                      cardBackColor={theme.cardBackColor}
                    />
                    {secondCard !== null && (
                      <Card
                        card={cards[secondCard]}
                        isOpen
                        disabled
                        cardBackColor={theme.cardBackColor}
                      />
                    )}
                  </>
                )}
              </View>
              {/* Wild cards between center and timer */}
              {wildCount > 0 && !wildActive && (
                <TouchableOpacity
                  style={styles.wildBarBtn}
                  onPress={handleWild}
                >
                  <View
                    style={[
                      styles.wildCard,
                      {
                        backgroundColor: wildConfig.color,
                        borderColor: wildConfig.accent,
                        shadowColor: wildConfig.accent,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.wildCardFrame,
                        { borderColor: wildConfig.accent + "40" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.wildCardSymbol,
                        {
                          color: wildConfig.accent,
                          textShadowColor: wildConfig.accent + "80",
                        },
                      ]}
                    >
                      {wildConfig.icon}
                    </Text>
                    <Text
                      style={[
                        styles.wildCardLabel,
                        { color: wildConfig.accent + "90" },
                      ]}
                    >
                      WILD
                    </Text>
                  </View>
                  {wildCount > 1 && (
                    <View
                      style={[
                        styles.wildCard,
                        styles.wildCard2,
                        {
                          backgroundColor: wildConfig.color,
                          borderColor: wildConfig.accent,
                          shadowColor: wildConfig.accent,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.wildCardFrame,
                          { borderColor: wildConfig.accent + "40" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.wildCardSymbol,
                          {
                            color: wildConfig.accent,
                            textShadowColor: wildConfig.accent + "80",
                          },
                        ]}
                      >
                        {wildConfig.icon}
                      </Text>
                      <Text
                        style={[
                          styles.wildCardLabel,
                          { color: wildConfig.accent + "90" },
                        ]}
                      >
                        WILD
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <View style={styles.rightBox}>
                <Timer
                  key={layoutKey}
                  initialTime={
                    gloryActiveRef.current
                      ? Math.round(config.time * 0.5)
                      : config.time
                  }
                  onTimeUp={advanceLevel}
                  paused={
                    paused || betweenLevels || showQuitConfirm || wildPlacing
                  }
                  frozen={timerFrozen}
                  onTick={(t) => {
                    timeLeftRef.current = t
                  }}
                />
                <View style={styles.comboWrap}>
                  <Text style={styles.label}>COMBO</Text>
                  <View style={styles.comboRow}>
                    {combo >= 3 && (
                      <View
                        style={[
                          styles.comboBar,
                          {
                            width: Math.min(combo * 2.5, 45),
                            backgroundColor: comboColor,
                          },
                        ]}
                      />
                    )}
                    <Animated.Text
                      style={[
                        styles.comboValue,
                        {
                          transform: [{ scale: comboPulse }],
                          color: comboColor,
                          fontSize:
                            combo >= 25
                              ? 28
                              : combo >= 15
                                ? 24
                                : combo >= 10
                                  ? 22
                                  : 18,
                          textShadowColor:
                            combo >= 10 ? comboColor : "transparent",
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius:
                            combo >= 25
                              ? 24
                              : combo >= 15
                                ? 16
                                : combo >= 10
                                  ? 10
                                  : 0,
                        },
                      ]}
                    >
                      x{combo}
                    </Animated.Text>
                  </View>
                  {combo >= 5 && (
                    <Text
                      style={[
                        styles.comboTitle,
                        {
                          color: comboColor + "80",
                        },
                      ]}
                    >
                      {combo >= 30
                        ? "MYTHIC"
                        : combo >= 25
                          ? "RAMPAGE"
                          : combo >= 20
                            ? "LEGENDARY"
                            : combo >= 15
                              ? "GLORIOUS"
                              : combo >= 10
                                ? "VALIANT"
                                : "WORTHY"}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {showPoints && (
            <Animated.View
              style={[
                styles.pointsPopup,
                {
                  opacity: pointsOpacity,
                  transform: [{ translateY: pointsMove }],
                },
              ]}
            >
              <Text
                style={[
                  styles.pointsText,
                  {
                    fontSize:
                      combo >= 25
                        ? 40
                        : combo >= 15
                          ? 34
                          : combo >= 10
                            ? 30
                            : 26,
                    color:
                      combo >= 25
                        ? "#FF00FF"
                        : combo >= 15
                          ? "#FF4757"
                          : combo >= 10
                            ? "#FFD700"
                            : "#E8C547",
                  },
                ]}
              >
                +{lastPoints.toLocaleString()}
              </Text>
              {combo >= 5 && (
                <Text
                  style={{
                    fontSize: combo >= 25 ? 14 : combo >= 15 ? 12 : 10,
                    fontWeight: "900",
                    letterSpacing: 2,
                    color:
                      combo >= 25
                        ? "rgba(200,50,255,0.7)"
                        : combo >= 15
                          ? "rgba(255,70,70,0.6)"
                          : "rgba(255,200,50,0.5)",
                  }}
                >
                  {combo >= 25
                    ? "RAMPAGE"
                    : combo >= 20
                      ? "LEGENDARY"
                      : combo >= 15
                        ? "GLORIOUS"
                        : combo >= 10
                          ? "VALIANT"
                          : "WORTHY"}
                </Text>
              )}
            </Animated.View>
          )}
          <Animated.View
            style={[
              styles.milestone,
              {
                opacity: milestoneOpacity,
                transform: [{ scale: milestoneScale }],
                borderColor: milestoneColor + "30",
                shadowColor: milestoneColor,
              },
            ]}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.milestoneIcon,
                { fontSize: combo >= 20 ? 30 : 24 },
              ]}
            >
              {milestoneIcon}
            </Text>
            <View style={styles.milestoneTextWrap}>
              <Text
                style={[
                  styles.milestoneText,
                  {
                    color: milestoneColor,
                    fontSize:
                      combo >= 25
                        ? 28
                        : combo >= 20
                          ? 24
                          : combo >= 15
                            ? 20
                            : 18,
                  },
                ]}
              >
                {milestoneText}
              </Text>
              <Text
                style={[
                  styles.milestoneMultiplier,
                  { color: milestoneColor + "80" },
                ]}
              >
                x{combo} COMBO
              </Text>
            </View>
          </Animated.View>
          {showQuitConfirm && (
            <View style={styles.quitOverlay}>
              <View style={styles.quitCard}>
                {/* Top ornament */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 1,
                      backgroundColor: "rgba(192,57,43,0.3)",
                    }}
                  />
                  <Text style={{ color: "rgba(192,57,43,0.4)", fontSize: 8 }}>
                    ◆
                  </Text>
                  <View
                    style={{
                      width: 30,
                      height: 1,
                      backgroundColor: "rgba(192,57,43,0.3)",
                    }}
                  />
                </View>
                <Text style={styles.quitTitle}>Abandon Battle?</Text>
                <Text style={styles.quitSub}>
                  {dailyMode
                    ? "You will lose your daily attempt!"
                    : "Your progress on this run will be lost."}
                </Text>
                <View
                  style={{
                    width: 60,
                    height: 1,
                    backgroundColor: "rgba(232,197,71,0.1)",
                    marginVertical: 2,
                  }}
                />
                <Text style={styles.quitScore}>
                  Current spoils: {score.toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.goldBtn}
                  onPress={handleResumeFromQuit}
                >
                  <Text style={styles.goldBtnText}>⚔ Keep Fighting</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quitBtn}
                  onPress={handleConfirmQuit}
                >
                  <Text style={styles.quitBtnText}>🚪 Leave Battle</Text>
                </TouchableOpacity>
                {/* Bottom ornament */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 1,
                      backgroundColor: "rgba(192,57,43,0.2)",
                    }}
                  />
                  <Text style={{ color: "rgba(192,57,43,0.3)", fontSize: 6 }}>
                    ◆
                  </Text>
                  <View
                    style={{
                      width: 20,
                      height: 1,
                      backgroundColor: "rgba(192,57,43,0.2)",
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </BountyStyleContext.Provider>
    </CardBackColorContext.Provider>
  )
}

// GAME STYLES UPGRADE — Replace the styles StyleSheet in your Game.tsx with this
// All game logic remains untouched — only visual styling changes

const styles = StyleSheet.create({
  // ─────────────────────────────────────
  //  MAIN GAME CONTAINER
  // ─────────────────────────────────────
  container: { flex: 1 },
  field: { flex: 1, width: "100%", justifyContent: "center" },

  // ─────────────────────────────────────
  //  BATTLEFIELD BACKGROUND — Atmospheric
  // ─────────────────────────────────────
  bgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgRune: {
    position: "absolute",
    color: "rgba(232,197,71,0.1)",
  },
  arenaRing: {
    position: "absolute",
    top: "16%",
    left: "20%",
    width: "60%",
    height: "62%",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.08)",
  },
  arenaRingInner: {
    position: "absolute",
    top: "24%",
    left: "28%",
    width: "44%",
    height: "48%",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.05)",
    borderStyle: "dashed",
  },
  centerShield: {
    position: "absolute",
    top: "42%",
    left: "47%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(232,197,71,0.03)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },
  centerShieldIcon: { fontSize: 18, color: "rgba(232,197,71,0.08)" },
  compassLine: {
    position: "absolute",
    backgroundColor: "rgba(232,197,71,0.02)",
  },
  compassH: {
    top: "48%",
    left: "10%",
    width: "80%",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  compassV: { left: "50%", top: "10%", width: 1, height: "75%" },
  compassD1: {
    top: "26%",
    left: "26%",
    width: "48%",
    height: 1,
    transform: [{ rotate: "45deg" }],
  },
  compassD2: {
    top: "26%",
    left: "26%",
    width: "48%",
    height: 1,
    transform: [{ rotate: "-45deg" }],
  },
  torch: { position: "absolute", fontSize: 16, opacity: 0.2 },
  bgBeast: { position: "absolute", fontSize: 28, opacity: 0.1 },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: "rgba(8,12,8,0.5)",
  },

  // ─────────────────────────────────────
  //  BACK (X) BUTTON — Top left
  // ─────────────────────────────────────
  backBtn: {
    position: "absolute",
    top: 6,
    left: 8,
    zIndex: 100,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
  },
  backBtnText: {
    color: "rgba(232,197,71,0.7)",
    fontSize: 13,
    fontWeight: "700",
  },

  // ─────────────────────────────────────
  //  DAILY BADGE
  // ─────────────────────────────────────
  dailyBadge: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    zIndex: 100,
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
  },
  dailyBadgeText: {
    color: "#E8C547",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  dailyBadgeIcon: { fontSize: 40, marginBottom: 4 },
  dailySubmitted: {
    color: "rgba(123,237,159,0.65)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    paddingBottom: 2,
  },

  // ─────────────────────────────────────
  //  WILD CARD — Active overlay
  // ─────────────────────────────────────
  wildBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,197,71,0.15)",
    borderRadius: 12,
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: "#E8C547",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  wildIcon: { fontSize: 20 },

  // ═══════════════════════════════════════════
  //  ██  BOTTOM BAR — COMPLETE REDESIGN  ██
  // ═══════════════════════════════════════════
  wallContainer: { width: "100%" },
  battlements: { flexDirection: "row", justifyContent: "center" },
  merlon: {
    width: 14,
    height: 6,
    backgroundColor: "#18120E",
    borderTopWidth: 1,
    borderTopColor: "rgba(232,197,71,0.12)",
  },
  crenel: { width: 10, height: 6, backgroundColor: "transparent" },
  wall: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#18120E",
    borderTopWidth: 1.5,
    borderTopColor: "rgba(232,197,71,0.1)",
    overflow: "hidden",
  },
  wallTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stoneDot: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: "rgba(232,197,71,0.025)",
  },
  mortarLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.03)",
  },

  // Deck + Spoils
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
  },
  spoilsBox: {
    justifyContent: "center",
  },

  // Center active cards
  centerCards: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  openCardGlow: {
    position: "absolute",
    top: -8,
    left: -12,
    right: -12,
    bottom: -8,
    borderRadius: 14,
    backgroundColor: "rgba(232,197,71,0.025)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.06)",
  },
  openCardGlowWild: {
    backgroundColor: "rgba(232,197,71,0.08)",
    borderColor: "rgba(232,197,71,0.25)",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  // Timer + Combo
  rightBox: {
    alignItems: "flex-end",
    gap: 2,
    minWidth: 70,
    zIndex: 2,
  },
  label: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
  scoreValue: {
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // ═══════════════════════════════════════════
  //  ██  POINTS POPUP & MILESTONES  ██
  // ═══════════════════════════════════════════
  pointsText: {
    color: "#E8C547",
    fontSize: 26,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // ═══════════════════════════════════════════
  //  ██  CENTER SCREENS  ██
  //  Game Over, Between Levels, Pause, Quit
  // ═══════════════════════════════════════════
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 32,
  },
  loadText: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // ── Victory / Defeat Icons ──
  crownIcon: { fontSize: 38 },
  lvlIcon: { fontSize: 40 },

  // ── Main title (VICTORY, RETREAT, etc.) ──
  gameTitle: {
    color: "#E8C547",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 6,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  // ── Divider ──
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
    marginVertical: 3,
  },

  // ── Score displays ──
  scoreLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
  },
  finalScore: {
    color: "#E8C547",
    fontSize: 40,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  scoreText: {
    color: "#E8C547",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pauseScore: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 16,
    fontWeight: "700",
  },
  partialText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    fontStyle: "italic",
  },

  // ── Stats row (CLEARED + COMBO) ──
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginVertical: 4,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  statBox: { alignItems: "center" },
  statValue: {
    color: "#E8C547",
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statLabel: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(232,197,71,0.1)",
  },

  // ═══════════════════════════════════════════
  //  ██  BETWEEN LEVELS SCREEN  ██
  // ═══════════════════════════════════════════
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bannerEdge: {
    width: 28,
    height: 2,
    backgroundColor: "#E8C547",
    borderRadius: 1,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  bannerBody: {
    paddingHorizontal: 18,
    alignItems: "center",
  },
  bannerTitle: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },

  // Progress dots
  progressRow: { flexDirection: "row", gap: 10, marginVertical: 8 },
  progressDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotFilled: {
    backgroundColor: "rgba(232,197,71,0.12)",
    borderColor: "#E8C547",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  progressCheck: {
    color: "#E8C547",
    fontSize: 9,
    fontWeight: "900",
  },

  // Time bonus
  timeBonusBox: {
    alignItems: "center",
    backgroundColor: "rgba(79,195,247,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(79,195,247,0.15)",
    shadowColor: "#4FC3F7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  timeBonusText: {
    color: "#4FC3F7",
    fontSize: 15,
    fontWeight: "900",
  },
  timeBonusLabel: {
    color: "rgba(79,195,247,0.4)",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 2,
  },

  // ═══════════════════════════════════════════
  //  ██  BUTTONS  ██
  // ═══════════════════════════════════════════
  goldBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D4A017",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  goldBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  ghostBtn: {
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  ghostBtnText: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // ═══════════════════════════════════════════
  //  ██  WILD CARDS IN BOTTOM BAR  ██
  // ═══════════════════════════════════════════
  wildCardStack: {
    position: "relative",
    width: CARD_W * 0.7,
    height: CARD_H * 0.7,
  },
  wildCardIcon: { fontSize: Math.round(26 * CARD_SCALE) },

  // ═══════════════════════════════════════════
  //  ██  ARENA  ██
  // ═══════════════════════════════════════════
  arenaBoard: {
    width: "100%",
    maxWidth: 350,
    marginVertical: 6,
  },
  arenaBoardTitle: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 4,
    textAlign: "center",
  },
  arenaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 2,
    gap: 8,
    backgroundColor: "rgba(232,197,71,0.02)",
  },
  arenaRowYou: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
  },
  arenaRank: { fontSize: 15, width: 28 },
  arenaName: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.5,
  },
  arenaNameYou: { color: "#E8C547" },
  arenaCombo: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 8,
  },
  arenaScore: {
    color: "#E8C547",
    fontSize: 15,
    fontWeight: "900",
  },
  arenaScroll: { maxHeight: 110 },
  countdownBox: { alignItems: "center", marginVertical: 4 },
  countdownText: {
    color: "#E8C547",
    fontSize: 48,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownLabel: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
  },
  waitingArenaText: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  waitingBox: { paddingVertical: 10 },

  // Daily wall variant
  wallDaily: {
    backgroundColor: "#1A1510",
    borderTopColor: "rgba(232,197,71,0.18)",
  },

  // ═══════════════════════════════════════════
  //  ██  RANK & RECORD  ██
  // ═══════════════════════════════════════════
  rankText: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rankLoading: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 12,
    fontWeight: "700",
    fontStyle: "italic",
  },
  recordBanner: {
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.06)",
    borderWidth: 2,
    borderColor: "rgba(255,215,0,0.35)",
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingVertical: 14,
    marginBottom: 4,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  recordStars: {
    color: "#FFD700",
    fontSize: 12,
    letterSpacing: 8,
    textShadowColor: "rgba(255,215,0,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  recordIcon: {
    fontSize: 42,
  },
  recordTitle: {
    color: "#FFD700",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 5,
    textShadowColor: "rgba(255,215,0,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  recordSub: {
    color: "rgba(255,215,0,0.6)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // ═══════════════════════════════════════════
  //  ██  FLOATING BUTTONS (Hint/Wild)  ██
  // ═══════════════════════════════════════════
  floatingLeft: { position: "absolute", left: 8, bottom: 55, zIndex: 50 },
  floatingRight: { position: "absolute", right: 8, bottom: 55, zIndex: 50 },
  hintFloatBtn: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.06)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
  },
  hintBtnOff: { opacity: 0.2 },
  hintBtnIcon: { fontSize: 16 },
  hintBtnCount: {
    color: "#E8C547",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1,
  },

  // Glory Hunt button — same width as others
  gloryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,140,0,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,140,0,0.3)",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 220,
  },
  gloryBtnActive: {
    backgroundColor: "rgba(255,140,0,0.15)",
    borderColor: "rgba(255,140,0,0.5)",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gloryBtnIcon: {
    fontSize: 18,
  },
  gloryBtnText: {
    color: "#FF8C00",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  gloryBtnSub: {
    color: "rgba(255,140,0,0.5)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Glory Hunt badge during gameplay
  gloryBadge: {
    position: "absolute",
    top: 4,
    right: 8,
    zIndex: 100,
    backgroundColor: "rgba(255,140,0,0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,140,0,0.3)",
  },
  gloryBadgeText: {
    color: "#FF8C00",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // Glory Hunt bonus indicator on between-levels
  gloryBonusBox: {
    alignItems: "center",
    backgroundColor: "rgba(255,140,0,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,140,0,0.15)",
  },
  gloryBonusText: {
    color: "#FF8C00",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },

  wildBarBtn: {
    position: "absolute",
    right: 100,
    bottom: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    flexDirection: "row",
    gap: 4,
  },
  wildCard: {
    width: Math.round(38 * CARD_SCALE),
    height: Math.round(52 * CARD_SCALE),
    borderRadius: Math.round(7 * CARD_SCALE),
    backgroundColor: "#1A0F05",
    borderWidth: 1.5,
    borderColor: "#E8C547",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  wildCard2: { marginLeft: 4 },
  wildCardFrame: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: Math.round(4 * CARD_SCALE),
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.3)",
  },
  wildCardSymbol: {
    fontSize: Math.round(18 * CARD_SCALE),
    color: "#E8C547",
    textShadowColor: "rgba(232,197,71,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  wildCardLabel: {
    fontSize: Math.round(5 * CARD_SCALE),
    fontWeight: "900",
    color: "rgba(232,197,71,0.6)",
    letterSpacing: 2,
    marginTop: -1,
  },

  // ── Wild Active Overlay ──
  wildActiveLabel: {
    position: "absolute",
    bottom: 58, // ← was top: 4
    alignSelf: "center",
    zIndex: 100,
    backgroundColor: "rgba(30,20,5,0.9)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.4)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  wildActiveBolt: {
    fontSize: 16,
  },
  wildActiveText: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  wildActiveSub: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  wildBorder: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(232,197,71,0.25)",
    zIndex: 1,
  },

  // ── Combo Display — Bottom bar ──
  comboWrap: {
    alignItems: "flex-end",
  },
  comboRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comboBar: {
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  comboValue: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right",
  },
  comboTitle: {
    fontSize: Math.round(6 * CARD_SCALE),
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "right",
    marginTop: -1,
  },

  // ── Milestone Popup — Dramatic banner ──
  milestone: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    backgroundColor: "rgba(10,8,5,0.85)",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  milestoneIcon: {
    fontSize: 24,
  },
  milestoneTextWrap: {
    alignItems: "flex-start",
  },
  milestoneText: {
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  milestoneMultiplier: {
    fontSize: Math.round(7 * CARD_SCALE),
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 1,
  },

  // ── Points Popup — Keep existing but adjust position ──
  pointsPopup: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    alignItems: "center",
  },

  // ═══════════════════════════════════════════
  //  ██  QUIT DIALOG — Dramatic Medieval  ██
  // ═══════════════════════════════════════════
  quitOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  quitCard: {
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D0A08",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(192,57,43,0.3)",
    paddingHorizontal: 36,
    paddingVertical: 24,
    minWidth: 280,
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  quitIcon: {
    fontSize: 42,
    marginBottom: 4,
  },
  quitTitle: {
    color: "#C0392B",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(192,57,43,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  quitSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  quitScore: {
    color: "rgba(232,197,71,0.6)",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 1,
  },
  quitBtn: {
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(192,57,43,0.35)",
    backgroundColor: "rgba(192,57,43,0.08)",
  },
  quitBtnText: {
    color: "rgba(192,57,43,0.8)",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  nextBattleInfo: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  nextBattleLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
  },
  nextBattleMultiplier: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Next battle button — between levels
  nextBattleBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D4A017",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBattleBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  spoilsCard: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginVertical: 2,
  },
  spoilsCardLabel: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 4,
  },
  spoilsCardValue: {
    color: "#E8C547",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  wildSelectBanner: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    zIndex: 200,
    backgroundColor: "rgba(30,20,5,0.92)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.4)",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  wildSelectBannerText: {
    color: "#E8C547",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },
})

export default Game
