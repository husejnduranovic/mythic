// Decorative battlefield backdrop — purely visual, theme-driven. Extracted from
// Game.tsx (Step 1.3), drop-in: same props, same rendering.

import React from "react"
import { StyleSheet, Text, View } from "react-native"

export const Battlefield = React.memo(
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
  // Corner ornaments — more visible
  cornerIcon: { color: "rgba(232,197,71,0.4)", fontSize: 10 }, // was 0.25

  // Edge ornaments
  edgeOrn: {
    position: "absolute",
    color: "rgba(232,197,71,0.22)", // was 0.12
    fontSize: 8,
    zIndex: 2,
  },

  // Center rings
  // Rings — more visible
  ringOuter: {
    position: "absolute",
    top: "16%",
    left: "20%",
    width: "60%",
    height: "62%",
    borderRadius: 9999,
    borderWidth: 1,
    opacity: 0.35, // add this — was just borderColor opacity doing the work
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
    opacity: 0.25,
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
  emblemIcon: { fontSize: 14, color: "rgba(232,197,71,0.25)" }, // was 0.12

  // Cross lines — slightly more visible
  crossH: {
    position: "absolute",
    top: "48%",
    left: "12%",
    width: "76%",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.06)", // was 0.03
  },
  crossV: {
    position: "absolute",
    left: "50%",
    top: "10%",
    width: 1,
    height: "68%",
    backgroundColor: "rgba(232,197,71,0.06)", // was 0.03
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
  // Banners — more visible
  flagIcon: { fontSize: 16, opacity: 0.22 }, // was 0.12
  flagStripe: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },

  // Weapon racks
  weaponRack: { position: "absolute", alignItems: "center", gap: 2 },
  weaponEmoji: { fontSize: 14, opacity: 0.14 }, // was 0.08
  weaponBar: { width: 18, height: 1, backgroundColor: "rgba(232,197,71,0.06)" },

  // Ghost cards
  ghostCard: {
    position: "absolute",
    width: 18,
    height: 26,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.07)", // was 0.035
    backgroundColor: "rgba(232,197,71,0.025)", // was 0.012
  },

  // Torch
  torchGlow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,200,80,0.03)",
  },
  // Torch — more visible
  torch: { position: "absolute", fontSize: 14, opacity: 0.28 }, // was 0.18

  // Runes — more visible
  rune: { position: "absolute", color: "rgba(232,197,71,0.1)" }, // was 0.055

  // Chains
  chain: { position: "absolute" },
  // Chains — more visible
  chainText: { color: "rgba(232,197,71,0.1)", fontSize: 6, letterSpacing: 1 },

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
