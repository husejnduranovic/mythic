// The battlefield felt — reimagined 2026-07-02 (the "does it feel like the
// icon?" pass). The old felt was a uniform dark sheet with hairline doodles:
// no light, no depth, no per-field identity. Now the table has LIGHT — a
// stacked accent-tinted pool that breathes (hot center, dark edges, the only
// idle loop here), a giant per-battlefield heraldic crest watermarked under
// the cards, forged corner brackets instead of floating ◆ glyphs, and deeper
// corner shadows. Every Armory battlefield finally reads as its own place,
// not a recolor: volcanic glows warm, the coast glows cold, the royal hall
// gold.
//
// Fixes a latent bug while it's here: the old theme table was keyed by ids
// (`forest`, `ocean`, `volcano`…) that never matched the real battlefield ids
// (`forest_camp`, `coastal_hold`, `volcanic_rise`…), so every field silently
// fell back to the same look.
//
// Perf contract: memoized — re-renders only on battlefield change; ~45 static
// views; ONE native-driver opacity loop shared by the light pool and crest
// (UI-thread compositor work, zero per-frame JS). Cards render above; the
// felt stays silent underneath them.

import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { Sigil, SigilSpec } from "../../ui/sigils"

// Keyed by the REAL battlefield ids (Armory BATTLEFIELDS). accent mirrors the
// item's Armory accent; the crest gives each field its heraldic identity.
const FIELD_THEMES: Record<string, { accent: string; sigil: SigilSpec }> = {
  training_yard: { accent: "#B89968", sigil: { fam: "mci", name: "sword-cross" } },
  stone_keep: { accent: "#A8B0BC", sigil: { fam: "mci", name: "castle" } },
  forest_camp: { accent: "#4DCC6A", sigil: { fam: "mci", name: "pine-tree" } },
  mountain_pass: { accent: "#88DDFF", sigil: { fam: "mci", name: "image-filter-hdr" } },
  coastal_hold: { accent: "#2299FF", sigil: { fam: "mci", name: "waves" } },
  volcanic_rise: { accent: "#FF4400", sigil: { fam: "mci", name: "fire" } },
  royal_hall: { accent: "#DDAA33", sigil: { fam: "mci", name: "crown" } },
  ember_court: { accent: "#FF5500", sigil: { fam: "mci", name: "campfire" } },
  moonlit_vale: { accent: "#BFCFE8", sigil: { fam: "mci", name: "moon-waning-crescent" } },
  sorcerers_spire: { accent: "#A385E8", sigil: { fam: "mci", name: "crystal-ball" } },
}

const DEFAULT_THEME = FIELD_THEMES.forest_camp

// One forged corner bracket — two bars meeting in an L.
const Bracket = ({
  pos,
  color,
}: {
  pos: { top?: number; bottom?: number; left?: number; right?: number }
  color: string
}) => (
  <View style={[s.bracket, pos]}>
    <View
      style={[
        s.bracketBar,
        s.bracketH,
        { backgroundColor: color },
        pos.right !== undefined && { right: 0 },
      ]}
    />
    <View
      style={[
        s.bracketBar,
        s.bracketV,
        { backgroundColor: color },
        pos.bottom !== undefined && { bottom: 0 },
      ]}
    />
  </View>
)

export const Battlefield = React.memo(
  ({ battlefieldId }: { battlefieldId?: string }) => {
    const t = FIELD_THEMES[battlefieldId || "forest_camp"] || DEFAULT_THEME
    const a = t.accent

    // The table breathes: one slow shared pulse on the light pool + crest.
    const breath = useRef(new Animated.Value(0.7)).current
    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(breath, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(breath, {
            toValue: 0.7,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
      )
      loop.start()
      return () => loop.stop()
    }, [])

    return (
      <View style={s.container} pointerEvents="none">
        {/* Unifying shade over the field color */}
        <View style={s.shade} />

        {/* TABLE LIGHT — stacked accent pool, hot warm core, breathing */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { opacity: breath }]}
        >
          <View style={[s.lightOuter, { backgroundColor: a + "0C" }]} />
          <View style={[s.lightMid, { backgroundColor: a + "0E" }]} />
          <View style={s.lightCore} />
        </Animated.View>

        {/* THE CREST — the field's heraldry, watermarked under the cards */}
        <Animated.View style={[s.crestWrap, { opacity: breath }]}>
          <View style={[s.crestRing, { borderColor: a + "17" }]} />
          <View style={[s.crestRingInner, { borderColor: a + "10" }]} />
          <Sigil sigil={t.sigil} size={92} color={a + "17"} />
        </Animated.View>

        {/* ENGRAVED RIM — double frame + forged corner brackets */}
        <View style={s.borderTop} />
        <View style={s.borderBottom} />
        <View style={s.borderLeft} />
        <View style={s.borderRight} />
        <View style={s.innerFrame} />
        <Bracket pos={{ top: 7, left: 7 }} color={a + "38"} />
        <Bracket pos={{ top: 7, right: 7 }} color={a + "38"} />
        <Bracket pos={{ bottom: 59, left: 7 }} color={a + "38"} />
        <Bracket pos={{ bottom: 59, right: 7 }} color={a + "38"} />

        {/* TABLE HISTORY — ghost cards + war scratches, quiet */}
        <View
          style={[
            s.ghostCard,
            { top: "13%", left: "27%", transform: [{ rotate: "-14deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { top: "16%", left: "29%", transform: [{ rotate: "5deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { bottom: "27%", right: "26%", transform: [{ rotate: "18deg" }] },
          ]}
        />
        <View
          style={[
            s.ghostCard,
            { bottom: "29%", right: "28%", transform: [{ rotate: "-7deg" }] },
          ]}
        />
        <View
          style={[
            s.scratch,
            { top: "33%", left: "22%", width: 22, transform: [{ rotate: "38deg" }] },
          ]}
        />
        <View
          style={[
            s.scratch,
            { top: "34%", left: "23%", width: 15, transform: [{ rotate: "33deg" }] },
          ]}
        />
        <View
          style={[
            s.scratch,
            { bottom: "34%", right: "21%", width: 20, transform: [{ rotate: "-22deg" }] },
          ]}
        />
        <View
          style={[
            s.scratch,
            { bottom: "33%", right: "22%", width: 13, transform: [{ rotate: "-17deg" }] },
          ]}
        />

        {/* CARVED RUNES — the felt's only glyph motif */}
        {["ᚠ", "ᚦ", "ᚱ", "ᛟ", "ᛊ", "ᛏ", "ᚨ", "ᛞ"].map((r, i) => (
          <Text
            key={`r${i}`}
            style={[
              s.rune,
              {
                top: `${(i * 23 + 9) % 68}%`,
                left: `${(i * 29 + 11) % 84}%`,
                fontSize: 10 + (i % 3) * 4,
                transform: [{ rotate: `${i * 47}deg` }],
              },
            ]}
          >
            {r}
          </Text>
        ))}

        {/* DARKNESS — corner shades (rotated squares) + side vignettes */}
        <View style={[s.cornerShade, { top: -46, left: -46 }]} />
        <View style={[s.cornerShade, { top: -46, right: -46 }]} />
        <View style={[s.cornerShade, { bottom: 8, left: -46 }]} />
        <View style={[s.cornerShade, { bottom: 8, right: -46 }]} />
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
  shade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6,10,7,0.30)",
  },

  // The light pool — three stacked ellipses, edges → core.
  lightOuter: {
    position: "absolute",
    top: "4%",
    bottom: "22%",
    left: "5%",
    right: "5%",
    borderRadius: 999,
  },
  lightMid: {
    position: "absolute",
    top: "14%",
    bottom: "32%",
    left: "18%",
    right: "18%",
    borderRadius: 999,
  },
  lightCore: {
    position: "absolute",
    top: "24%",
    bottom: "42%",
    left: "30%",
    right: "30%",
    borderRadius: 999,
    backgroundColor: "rgba(255,232,176,0.05)",
  },

  // The crest — centered in the card field (above the war bar).
  crestWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  crestRing: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.5,
  },
  crestRingInner: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 0.5,
  },

  // Rim
  borderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(232,197,71,0.12)",
  },
  borderBottom: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.07)",
  },
  borderLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 52,
    width: 2,
    backgroundColor: "rgba(232,197,71,0.09)",
  },
  borderRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 52,
    width: 2,
    backgroundColor: "rgba(232,197,71,0.09)",
  },
  innerFrame: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 57,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.045)",
  },

  // Forged corner brackets — two bars in an L, in the field's accent metal.
  bracket: { position: "absolute", width: 26, height: 26, zIndex: 2 },
  bracketBar: { position: "absolute", borderRadius: 1.5 },
  bracketH: { width: 26, height: 3, top: 0, left: 0 },
  bracketV: { width: 3, height: 26, top: 0, left: 0 },

  // Table history
  ghostCard: {
    position: "absolute",
    width: 18,
    height: 26,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.07)",
    backgroundColor: "rgba(232,197,71,0.025)",
  },
  scratch: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.045)",
    borderRadius: 1,
  },

  // Runes
  rune: { position: "absolute", color: "rgba(232,197,71,0.09)" },

  // Darkness
  cornerShade: {
    position: "absolute",
    width: 110,
    height: 110,
    backgroundColor: "rgba(4,8,5,0.32)",
    transform: [{ rotate: "45deg" }],
    borderRadius: 18,
  },
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
    height: 26,
    backgroundColor: "rgba(8,12,8,0.28)",
  },
  vigLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 52,
    width: 18,
    backgroundColor: "rgba(8,12,8,0.18)",
  },
  vigRight: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 52,
    width: 18,
    backgroundColor: "rgba(8,12,8,0.18)",
  },
})
