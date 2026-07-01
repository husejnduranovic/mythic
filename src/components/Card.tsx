import React, { useEffect, useRef, useState } from "react"
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated"
import {
  useBountyStyle,
  useCardBackColor,
  useVanquishTier,
} from "../context/ThemeContext"
import {
  BACK_STYLES,
  BOUNTY_FALLBACK_SIGIL,
  DEFAULT_BACK_STYLE,
  Sigil,
  SigilSpec,
  SUIT_SIGILS,
} from "../ui/sigils"
import { color as palette, font } from "../ui/theme"

export interface ICard {
  value: string
  suit: "hearts" | "diamonds" | "clubs" | "spades"
  displayValue: string
  visible: boolean
}

interface ICardProps {
  card?: ICard
  isOpen?: boolean
  onClick?: () => void
  remove?: boolean
  disabled?: boolean
  alwaysEnabled?: boolean
  remaining?: number
  cardBackColor?: string
  bounty?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// The Engraver's Deck (DESIGN_PLAN §4.2.8)
//
// Faces are parchment plates: the value engraved in Cinzel capitals with the
// suit beast inked monochrome behind it (heraldic sigil, not emoji), courts
// sealed in gold leaf, the ace a beast showcase. Backs are tooled leather:
// double frame, lattice, corner runes and a crested medallion, all in the
// equipped item's own accent metal (ui/sigils.tsx BACK_STYLES).
//
// Perf contract: ~28 instances live on the field at once. Sigils are Text
// glyphs (same cost as the emoji they replaced), view count is unchanged, and
// the only animations remain the existing one-card-at-a-time flip/fall
// transitions. No idle loops.
// ─────────────────────────────────────────────────────────────────────────────

// Suit inks — deep heraldic metals on warm parchment. Pre-computed packs: one
// object lookup per card render.
const SUIT_STYLES: Record<
  string,
  { sigil: SigilSpec; color: string; bg: string; bgTop: string }
> = {
  hearts: {
    sigil: SUIT_SIGILS.hearts, // dragon
    color: "#8E1717", // deep crimson — darkened for legibility on parchment
    bg: "#F2E8D5",
    bgTop: "rgba(142,23,23,0.07)",
  },
  diamonds: {
    sigil: SUIT_SIGILS.diamonds, // eagle
    color: "#8A6308", // dark amber — was #B8860B, too pale on cream
    bg: "#F2E8D5",
    bgTop: "rgba(138,99,8,0.07)",
  },
  clubs: {
    sigil: SUIT_SIGILS.clubs, // wolf (hunting mark)
    color: "#134A70", // deep steel blue
    bg: "#F2E8D5",
    bgTop: "rgba(19,74,112,0.07)",
  },
  spades: {
    sigil: SUIT_SIGILS.spades, // serpent
    color: "#15542B", // deep forest green
    bg: "#F2E8D5",
    bgTop: "rgba(21,84,43,0.07)",
  },
}

const DEFAULT_SUIT_STYLE: (typeof SUIT_STYLES)[string] = {
  sigil: { fam: "mci", name: "sword-cross" },
  color: "#333",
  bg: "#F8F5EC",
  bgTop: "rgba(0,0,0,0.03)",
}

const FACE_TITLES: Record<string, string> = {
  J: "KNIGHT",
  Q: "QUEEN",
  K: "KING",
  A: "ACE",
}
const DEFAULT_BACK_COLOR = "#162A47"
const BACK_RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 780, SCREEN_H / 360, 1)
const CARD_W = Math.round(52 * CARD_SCALE)
const CARD_H = Math.round(74 * CARD_SCALE)
const DECK_W = Math.round(56 * CARD_SCALE)
const DECK_H = Math.round(78 * CARD_SCALE)
const CARD_RADIUS = Math.round(10 * CARD_SCALE)

// Tooled-leather back. Every engraving line takes the equipped item's accent
// metal (BACK_STYLES) — the old universal white overlays read washed-out and
// made all eight Armory backs feel like recolors of the same card.
const CardBackView = React.memo(
  ({ color }: { color: string }) => {
    const back = BACK_STYLES[color] || DEFAULT_BACK_STYLE
    const a = back.accent

    return (
      <View
        style={[
          styles.cardBack,
          { backgroundColor: color, borderColor: a + "59" },
        ]}
      >
        {/* Double engraving frame */}
        <View style={[styles.backOuterFrame, { borderColor: a + "8C" }]} />
        <View style={[styles.backInnerFrame, { borderColor: a + "45" }]} />
        {/* Lattice */}
        <View style={[styles.backCrossH, { backgroundColor: a + "1A" }]} />
        <View style={[styles.backCrossV, { backgroundColor: a + "1A" }]} />
        <View style={[styles.backDiagonal1, { backgroundColor: a + "12" }]} />
        <View style={[styles.backDiagonal2, { backgroundColor: a + "12" }]} />
        {/* Crest medallion — dark well so the sigil reads as inlaid metal */}
        <View style={[styles.shield, { borderColor: a + "B3" }]}>
          <View style={[styles.shieldRing, { borderColor: a + "59" }]}>
            <View style={styles.shieldInner}>
              <Sigil
                sigil={back.sigil}
                size={Math.round(13 * CARD_SCALE)}
                color={a + "F0"}
              />
            </View>
          </View>
        </View>
        {/* Corner runes */}
        <Text style={[styles.cornerRune, { top: 3, left: 3, color: a + "73" }]}>
          {BACK_RUNES[0]}
        </Text>
        <Text
          style={[styles.cornerRune, { top: 3, right: 3, color: a + "73" }]}
        >
          {BACK_RUNES[1]}
        </Text>
        <Text
          style={[styles.cornerRune, { bottom: 3, left: 3, color: a + "73" }]}
        >
          {BACK_RUNES[2]}
        </Text>
        <Text
          style={[styles.cornerRune, { bottom: 3, right: 3, color: a + "73" }]}
        >
          {BACK_RUNES[3]}
        </Text>
        {/* Edge dots */}
        <View
          style={[
            styles.edgeDot,
            { top: 3, left: "46%", backgroundColor: a + "66" },
          ]}
        />
        <View
          style={[
            styles.edgeDot,
            { bottom: 3, left: "46%", backgroundColor: a + "66" },
          ]}
        />
        <View
          style={[
            styles.edgeDot,
            { top: "46%", left: 3, backgroundColor: a + "66" },
          ]}
        />
        <View
          style={[
            styles.edgeDot,
            { top: "46%", right: 3, backgroundColor: a + "66" },
          ]}
        />
      </View>
    )
  },
  (prev, next) => prev.color === next.color,
)

const BountyCardBack = React.memo(() => {
  const bc = useBountyStyle()
  return (
    <View
      style={[
        styles.cardBack,
        {
          backgroundColor: bc.backColor,
          borderColor: bc.accent,
          borderWidth: 2,
        },
      ]}
    >
      <View
        style={[
          styles.backOuterFrame,
          { borderColor: bc.accent + "90", borderWidth: 1.5 },
        ]}
      />
      <View
        style={[
          styles.backInnerFrame,
          { borderColor: bc.accent + "50", borderWidth: 1 },
        ]}
      />
      <View
        style={[styles.backCrossH, { backgroundColor: bc.accent + "1A" }]}
      />
      <View
        style={[styles.backCrossV, { backgroundColor: bc.accent + "1A" }]}
      />
      <View
        style={[styles.backDiagonal1, { backgroundColor: bc.accent + "14" }]}
      />
      <View
        style={[styles.backDiagonal2, { backgroundColor: bc.accent + "14" }]}
      />
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: -10,
          right: -10,
          height: 0.5,
          backgroundColor: bc.accent + "10",
          transform: [{ rotate: "60deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: -10,
          right: -10,
          height: 0.5,
          backgroundColor: bc.accent + "10",
          transform: [{ rotate: "-60deg" }],
        }}
      />
      <View
        style={[
          styles.shield,
          {
            backgroundColor: bc.accent + "20",
            borderColor: bc.accent,
            borderWidth: 2,
          },
        ]}
      >
        <View
          style={[
            styles.shieldRing,
            { borderColor: bc.accent + "70", borderWidth: 1 },
          ]}
        >
          <View style={styles.shieldInner}>
            <Sigil
              sigil={bc.sigil || BOUNTY_FALLBACK_SIGIL}
              size={Math.round(14 * CARD_SCALE)}
              color={bc.accent}
            />
          </View>
        </View>
      </View>
      <Text
        style={[
          styles.cornerRune,
          {
            top: 4,
            left: 4,
            color: bc.accent,
            fontSize: Math.round(7 * CARD_SCALE),
          },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.cornerRune,
          {
            top: 4,
            right: 4,
            color: bc.accent,
            fontSize: Math.round(7 * CARD_SCALE),
          },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.cornerRune,
          {
            bottom: 4,
            left: 4,
            color: bc.accent,
            fontSize: Math.round(7 * CARD_SCALE),
          },
        ]}
      >
        ✦
      </Text>
      <Text
        style={[
          styles.cornerRune,
          {
            bottom: 4,
            right: 4,
            color: bc.accent,
            fontSize: Math.round(7 * CARD_SCALE),
          },
        ]}
      >
        ✦
      </Text>
      <View
        style={[
          styles.edgeDot,
          {
            top: 3,
            left: "48%",
            backgroundColor: bc.accent,
            width: 3,
            height: 3,
            borderRadius: 1.5,
          },
        ]}
      />
      <View
        style={[
          styles.edgeDot,
          {
            bottom: 3,
            left: "48%",
            backgroundColor: bc.accent,
            width: 3,
            height: 3,
            borderRadius: 1.5,
          },
        ]}
      />
      <View
        style={[
          styles.edgeDot,
          {
            top: "48%",
            left: 3,
            backgroundColor: bc.accent,
            width: 3,
            height: 3,
            borderRadius: 1.5,
          },
        ]}
      />
      <View
        style={[
          styles.edgeDot,
          {
            top: "48%",
            right: 3,
            backgroundColor: bc.accent,
            width: 3,
            height: 3,
            borderRadius: 1.5,
          },
        ]}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "40%",
          borderTopLeftRadius: CARD_RADIUS - 2,
          borderTopRightRadius: CARD_RADIUS - 2,
          backgroundColor: bc.accent + "08",
        }}
      />
    </View>
  )
})

// Parchment plate. Value engraved in Cinzel, beast watermarked in suit ink
// behind it; courts sealed with a gold-leaf trim; the ace shows its beast
// solid — the one card in each suit where the engraving is the hero, echoing
// the app icon's crested cards.
const CardFace = React.memo(
  ({ card }: { card: ICard }) => {
    const suitStyle = SUIT_STYLES[card.suit] || DEFAULT_SUIT_STYLE
    const { sigil, color, bg, bgTop } = suitStyle
    const isFaceCard = ["J", "Q", "K", "A"].includes(card.displayValue)
    const isAce = card.displayValue === "A"
    const twoChar = card.displayValue.length > 1 // "10" — Cinzel capitals run wide
    const faceTitle = FACE_TITLES[card.displayValue]
    return (
      <View
        style={[
          styles.cardFace,
          {
            backgroundColor: bg,
            borderColor: isFaceCard ? color + "60" : color + "40",
            borderWidth: isFaceCard ? 2 : 1.5,
          },
        ]}
      >
        <View style={[styles.faceTintTop, { backgroundColor: bgTop }]} />
        <View style={[styles.faceTintBottom, { backgroundColor: bgTop }]} />
        <View style={[styles.cardFaceInner, { borderColor: color + "20" }]} />
        {isFaceCard && <View style={styles.faceCardTrim} />}
        {!isAce && (
          <Sigil
            sigil={sigil}
            size={Math.round(38 * CARD_SCALE)}
            color={color + "1F"}
            style={styles.watermark}
          />
        )}
        <View
          style={[styles.faceDividerTop, { backgroundColor: color + "10" }]}
        />
        <View style={[styles.faceDividerBottom, { backgroundColor: color + "10" }]} />
        <View style={styles.cornerGroup}>
          <Text
            style={[
              styles.cornerValue,
              {
                color,
                fontSize: isFaceCard
                  ? Math.round(11 * CARD_SCALE)
                  : Math.round(10 * CARD_SCALE),
              },
            ]}
          >
            {card.displayValue}
          </Text>
          <Sigil
            sigil={sigil}
            size={Math.round(7 * CARD_SCALE)}
            color={color + "CC"}
          />
        </View>
        <View style={styles.centerWrap}>
          {isAce ? (
            <>
              <Sigil
                sigil={sigil}
                size={Math.round(22 * CARD_SCALE)}
                color={color + "E6"}
                style={styles.aceSigil}
              />
              <Text
                style={[
                  styles.centerValue,
                  {
                    color,
                    fontSize: Math.round(22 * CARD_SCALE),
                    lineHeight: Math.round(27 * CARD_SCALE),
                  },
                ]}
              >
                {card.displayValue}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.centerValue,
                  {
                    color,
                    fontSize: Math.round(
                      (isFaceCard ? 24 : twoChar ? 23 : 26) * CARD_SCALE,
                    ),
                    lineHeight: Math.round(
                      (isFaceCard ? 29 : twoChar ? 28 : 31) * CARD_SCALE,
                    ),
                    letterSpacing: twoChar ? -0.5 : 0,
                  },
                ]}
              >
                {card.displayValue}
              </Text>
              <Sigil
                sigil={sigil}
                size={Math.round(12 * CARD_SCALE)}
                color={color + "D9"}
                style={styles.centerSigil}
              />
            </>
          )}
          {faceTitle && (
            <Text style={[styles.faceTitle, { color: color + "59" }]}>
              {faceTitle}
            </Text>
          )}
        </View>
        <View style={[styles.cornerGroup, styles.cornerBR]}>
          <Text
            style={[
              styles.cornerValue,
              {
                color,
                fontSize: isFaceCard
                  ? Math.round(11 * CARD_SCALE)
                  : Math.round(10 * CARD_SCALE),
              },
            ]}
          >
            {card.displayValue}
          </Text>
          <Sigil
            sigil={sigil}
            size={Math.round(7 * CARD_SCALE)}
            color={color + "CC"}
          />
        </View>
        <View
          style={[
            styles.faceCornerDot,
            { backgroundColor: color + "12", top: 3, right: 4 },
          ]}
        />
        <View
          style={[
            styles.faceCornerDot,
            { backgroundColor: color + "12", bottom: 3, left: 4 },
          ]}
        />
      </View>
    )
  },
  (prev, next) =>
    prev.card.displayValue === next.card.displayValue &&
    prev.card.suit === next.card.suit,
)

const BountyCardFace = React.memo(
  ({ card }: { card: ICard }) => {
    const bc = useBountyStyle()
    const sigil = bc.sigil || BOUNTY_FALLBACK_SIGIL
    const color = bc.textColor
    const isFaceCard = ["J", "Q", "K", "A"].includes(card.displayValue)
    const isAce = card.displayValue === "A"
    const twoChar = card.displayValue.length > 1
    const faceTitle = FACE_TITLES[card.displayValue]
    return (
      <View
        style={[
          styles.cardFace,
          {
            backgroundColor: bc.frontBg,
            borderColor: bc.accent,
            borderWidth: 2,
          },
        ]}
      >
        <View
          style={[styles.faceTintTop, { backgroundColor: bc.accent + "10" }]}
        />
        <View
          style={[styles.faceTintBottom, { backgroundColor: bc.accent + "10" }]}
        />
        <View
          style={[styles.cardFaceInner, { borderColor: bc.accent + "40" }]}
        />
        {isFaceCard && (
          <View
            style={[styles.faceCardTrim, { borderColor: bc.accent + "30" }]}
          />
        )}
        {!isAce && (
          <Sigil
            sigil={sigil}
            size={Math.round(38 * CARD_SCALE)}
            color={bc.accent + "1A"}
            style={styles.watermark}
          />
        )}
        <View
          style={[styles.faceDividerTop, { backgroundColor: bc.accent + "25" }]}
        />
        <View
          style={[
            styles.faceDividerBottom,
            { backgroundColor: bc.accent + "25" },
          ]}
        />
        <View style={styles.cornerGroup}>
          <Text
            style={[
              styles.cornerValue,
              {
                color,
                fontSize: isFaceCard
                  ? Math.round(11 * CARD_SCALE)
                  : Math.round(10 * CARD_SCALE),
              },
            ]}
          >
            {card.displayValue}
          </Text>
          <Sigil
            sigil={sigil}
            size={Math.round(7 * CARD_SCALE)}
            color={color + "CC"}
          />
        </View>
        <View style={styles.centerWrap}>
          {isAce ? (
            <>
              <Sigil
                sigil={sigil}
                size={Math.round(22 * CARD_SCALE)}
                color={color + "E6"}
                style={styles.aceSigil}
              />
              <Text
                style={[
                  styles.centerValue,
                  {
                    color,
                    fontSize: Math.round(22 * CARD_SCALE),
                    lineHeight: Math.round(27 * CARD_SCALE),
                  },
                ]}
              >
                {card.displayValue}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.centerValue,
                  {
                    color,
                    fontSize: Math.round(
                      (isFaceCard ? 24 : twoChar ? 23 : 26) * CARD_SCALE,
                    ),
                    lineHeight: Math.round(
                      (isFaceCard ? 29 : twoChar ? 28 : 31) * CARD_SCALE,
                    ),
                    letterSpacing: twoChar ? -0.5 : 0,
                  },
                ]}
              >
                {card.displayValue}
              </Text>
              <Sigil
                sigil={sigil}
                size={Math.round(12 * CARD_SCALE)}
                color={color + "D9"}
                style={styles.centerSigil}
              />
            </>
          )}
          {faceTitle && (
            <Text style={[styles.faceTitle, { color: bc.accent + "70" }]}>
              {faceTitle}
            </Text>
          )}
        </View>
        <View style={[styles.cornerGroup, styles.cornerBR]}>
          <Text
            style={[
              styles.cornerValue,
              {
                color,
                fontSize: isFaceCard
                  ? Math.round(11 * CARD_SCALE)
                  : Math.round(10 * CARD_SCALE),
              },
            ]}
          >
            {card.displayValue}
          </Text>
          <Sigil
            sigil={sigil}
            size={Math.round(7 * CARD_SCALE)}
            color={color + "CC"}
          />
        </View>
        <View
          style={[
            styles.faceCornerDot,
            { backgroundColor: bc.accent + "30", top: 3, right: 4 },
          ]}
        />
        <View
          style={[
            styles.faceCornerDot,
            { backgroundColor: bc.accent + "30", bottom: 3, left: 4 },
          ]}
        />
      </View>
    )
  },
  (prev, next) =>
    prev.card.displayValue === next.card.displayValue &&
    prev.card.suit === next.card.suit,
)

const DeckCard = React.memo(
  ({ remaining, backColor }: { remaining: number; backColor: string }) => (
    <View style={styles.deckCard}>
      <CardBackView color={backColor} />
      <View style={styles.deckBadge}>
        <Text style={styles.deckCount}>{remaining}</Text>
      </View>
    </View>
  ),
)

const FlippingCard = ({
  card,
  backColor,
  bounty,
  onDone,
}: {
  card: ICard
  backColor: string
  bounty?: boolean
  onDone: () => void
}) => {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 240, easing: Easing.inOut(Easing.cubic) },
      () => {
        runOnJS(onDone)()
      },
    )
  }, [])
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(progress.value, [0, 0.5, 1], [0, 90, 90])}deg`,
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
    opacity: progress.value < 0.5 ? 1 : 0,
    position: "absolute" as const,
    width: "100%",
    height: "100%",
  }))
  // The reveal lands with a slight over-rotation settle — the card snaps flat
  // like it was dealt, instead of easing to a stop.
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(
          progress.value,
          [0, 0.5, 0.86, 1],
          [-90, -90, 7, 0],
        )}deg`,
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.06, 1]) },
    ],
    opacity: progress.value >= 0.5 ? 1 : 0,
    position: "absolute" as const,
    width: "100%",
    height: "100%",
  }))
  return (
    <View style={styles.wrap}>
      <Animated.View style={backStyle}>
        {bounty ? <BountyCardBack /> : <CardBackView color={backColor} />}
      </Animated.View>
      <Animated.View style={faceStyle}>
        {bounty ? <BountyCardFace card={card} /> : <CardFace card={card} />}
      </Animated.View>
    </View>
  )
}

// Tier colors for the capture flash — mirrors the HUD combo ramp.
const TIER_FLASH = ["", "#E8C547", "#FF8C00", "#FF4757"]

const FallingCard = ({
  card,
  isOpen,
  backColor,
  bounty,
  onDone,
}: {
  card?: ICard
  isOpen?: boolean
  backColor: string
  bounty?: boolean
  onDone: () => void
}) => {
  const y = useSharedValue(0),
    o = useSharedValue(1),
    sc = useSharedValue(1),
    r = useSharedValue(0)
  const ring = useSharedValue(0)
  // Combo tier at capture, read once at mount from the ref-context (no
  // reactivity → combo changes never touch the other 27 memoized cards).
  const tier = useVanquishTier().current
  useEffect(() => {
    // Vanquish — a quick recoil pop (which punches up the combo feel), then the
    // card shrinks and rises as it dissolves, instead of a flat drop-and-fade.
    // One card at a time, entirely on the UI thread (transform + opacity).
    // Higher combo tiers recoil harder and throw a shockwave ring.
    const pop = tier >= 3 ? 1.18 : tier >= 2 ? 1.15 : 1.12
    sc.value = withSequence(
      withTiming(pop, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(0.45, { duration: 175, easing: Easing.in(Easing.cubic) }),
    )
    y.value = withDelay(
      45,
      withTiming(-28, { duration: 190, easing: Easing.out(Easing.quad) }),
    )
    r.value = withDelay(
      45,
      withTiming((Math.random() - 0.5) * 32, { duration: 190 }),
    )
    o.value = withDelay(
      80,
      withTiming(0, { duration: 165 }, (finished) => {
        if (finished) runOnJS(onDone)()
      }),
    )
    if (tier > 0) {
      ring.value = withTiming(1, {
        duration: 230,
        easing: Easing.out(Easing.quad),
      })
    }
  }, [])
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { scale: sc.value },
      { rotate: `${r.value}deg` },
    ],
    opacity: o.value,
  }))
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.15, 1], [0, 0.7, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.85, 1.5]) }],
  }))
  const flash = TIER_FLASH[Math.min(tier, 3)]
  return (
    <Animated.View style={[styles.wrap, style]}>
      {isOpen && card ? (
        bounty ? (
          <BountyCardFace card={card} />
        ) : (
          <CardFace card={card} />
        )
      ) : bounty ? (
        <BountyCardBack />
      ) : (
        <CardBackView color={backColor} />
      )}
      {tier > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.captureRing,
            { borderColor: flash, shadowColor: flash },
            ringStyle,
          ]}
        />
      )}
    </Animated.View>
  )
}

const Card = React.memo(
  (props: ICardProps) => {
    const {
      card,
      isOpen,
      onClick,
      remove,
      disabled = false,
      alwaysEnabled = false,
      remaining,
      cardBackColor: propBackColor,
      bounty,
    } = props
    const contextBackColor = useCardBackColor()
    const cardBackColor =
      propBackColor || contextBackColor || DEFAULT_BACK_COLOR
    const prevRemove = useRef(remove)
    const prevIsOpen = useRef(isOpen)
    const [falling, setFalling] = useState(false)
    const [gone, setGone] = useState(!!remove)
    const [flipping, setFlipping] = useState(false)

    if (!remove && prevRemove.current) {
      setFalling(false)
      setGone(false)
      setFlipping(false)
    } else if (remove && !prevRemove.current && !falling && !gone) {
      setFalling(true)
    } else if (!remove && gone) {
      setGone(false)
    }
    prevRemove.current = remove

    if (
      isOpen &&
      !prevIsOpen.current &&
      !remove &&
      !falling &&
      !gone &&
      !flipping &&
      prevRemove.current === remove
    ) {
      setFlipping(true)
    }
    prevIsOpen.current = isOpen

    if (gone && !alwaysEnabled) return <View style={styles.emptySlot} />
    if (falling && !alwaysEnabled)
      return (
        <View style={styles.touch}>
          <FallingCard
            card={card}
            isOpen={isOpen}
            backColor={cardBackColor}
            bounty={bounty}
            onDone={() => {
              setFalling(false)
              setGone(true)
            }}
          />
        </View>
      )
    if (flipping && card)
      return (
        <View style={[styles.touch, { zIndex: 3 }]}>
          <FlippingCard
            card={card}
            backColor={cardBackColor}
            bounty={bounty}
            onDone={() => setFlipping(false)}
          />
        </View>
      )

    const isDeck = remaining !== undefined
    const isDisabled = !alwaysEnabled && (disabled || !isOpen)
    return (
      <TouchableOpacity
        onPress={onClick}
        disabled={isDisabled}
        activeOpacity={0.65}
        delayPressIn={0}
        delayPressOut={0}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={[
          isDeck ? styles.touchDeck : styles.touch,
          { zIndex: isOpen ? 2 : 1 },
        ]}
      >
        <View style={isDeck ? styles.wrapDeck : styles.wrap}>
          {isDeck ? (
            <DeckCard remaining={remaining!} backColor={cardBackColor} />
          ) : isOpen && card ? (
            bounty ? (
              <BountyCardFace card={card} />
            ) : (
              <CardFace card={card} />
            )
          ) : bounty ? (
            <BountyCardBack />
          ) : (
            <CardBackView color={cardBackColor} />
          )}
        </View>
      </TouchableOpacity>
    )
  },
  (prev, next) => {
    if (prev.disabled !== next.disabled) return false
    if (prev.isOpen !== next.isOpen) return false
    if (prev.remove !== next.remove) return false
    if (prev.bounty !== next.bounty) return false
    if (prev.alwaysEnabled !== next.alwaysEnabled) return false
    if (prev.remaining !== next.remaining) return false
    if (prev.cardBackColor !== next.cardBackColor) return false

    const pc = prev.card
    const nc = next.card
    if (pc === nc) return true
    if (!pc || !nc) return pc === nc
    return (
      pc.displayValue === nc.displayValue &&
      pc.suit === nc.suit &&
      pc.visible === nc.visible
    )
  },
)

const styles = StyleSheet.create({
  emptySlot: { width: DECK_W, height: DECK_H, margin: 2, padding: 2 },
  touch: { margin: 2, padding: 2 },
  touchDeck: { margin: 3, padding: 2 },
  wrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45, // was 0.25 — deeper shadow for depth
    shadowRadius: 5, // was 3
  },
  // Shockwave ring thrown by high-tier captures — mounted only on the one
  // falling card, for the 230ms of its fall.
  captureRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: CARD_RADIUS + 4,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  wrapDeck: {
    width: DECK_W,
    height: DECK_H,
    borderRadius: CARD_RADIUS,
    elevation: 5,
  },

  // ── Card Face ──
  cardFace: {
    flex: 1,
    backgroundColor: "#F2E8D5", // warm parchment — replaces white
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  faceTintTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "10%",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
  },
  faceTintBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "10%",
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
  },
  cardFaceInner: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: Math.max(2, CARD_RADIUS - 2),
    borderWidth: 0.5,
  },
  faceCardTrim: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: Math.max(2, CARD_RADIUS - 4),
    borderWidth: 1,
    // Gold-leaf court seal; the bounty face overrides with its accent inline.
    borderColor: palette.goldDeep + "6B",
  },
  watermark: { position: "absolute" },
  faceDividerTop: {
    position: "absolute",
    top: "28%",
    left: 6,
    right: 6,
    height: 0.5,
  },
  faceDividerBottom: {
    position: "absolute",
    bottom: "28%",
    left: 6,
    right: 6,
    height: 0.5,
  },
  faceCornerDot: { position: "absolute", width: 4, height: 4, borderRadius: 2 },
  cornerGroup: { position: "absolute", top: 3, left: 4, alignItems: "center" },
  cornerBR: {
    top: undefined,
    left: undefined,
    bottom: 3,
    right: 4,
    transform: [{ rotate: "180deg" }],
  },
  // Values/captions engrave in Cinzel. expo-google-fonts registers each weight
  // as its own family, so no fontWeight alongside; includeFontPadding off keeps
  // the titling capitals optically centered at these sizes.
  cornerValue: {
    fontFamily: font.display,
    fontSize: Math.round(10 * CARD_SCALE),
    lineHeight: Math.round(13 * CARD_SCALE),
    includeFontPadding: false,
  },
  centerWrap: { alignItems: "center", justifyContent: "center" },
  centerValue: {
    fontFamily: font.display,
    fontSize: Math.round(26 * CARD_SCALE),
    lineHeight: Math.round(31 * CARD_SCALE),
    includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },
  centerSigil: { marginTop: 1 },
  aceSigil: { marginBottom: 1 },
  faceTitle: {
    fontFamily: font.heading,
    fontSize: Math.round(6 * CARD_SCALE),
    letterSpacing: 1.5,
    marginTop: 1,
    includeFontPadding: false,
  },

  // ── Card Back ──
  cardBack: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1, // was 2
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  // Engraving colors (frames, lattice, runes, dots, medallion rings) are set
  // inline per card from the back's accent metal — see CardBackView/BountyCardBack.
  backOuterFrame: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: Math.max(3, CARD_RADIUS - 3),
    borderWidth: 1,
  },
  backInnerFrame: {
    position: "absolute",
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: Math.max(2, CARD_RADIUS - 6),
    borderWidth: 0.5,
  },
  backCrossH: {
    position: "absolute",
    top: "50%",
    left: 8,
    right: 8,
    height: 0.5,
  },
  backCrossV: {
    position: "absolute",
    left: "50%",
    top: 8,
    bottom: 8,
    width: 0.5,
  },
  backDiagonal1: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
    transform: [{ rotate: "30deg" }],
  },
  backDiagonal2: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
    transform: [{ rotate: "-30deg" }],
  },
  shield: {
    width: Math.round(32 * CARD_SCALE),
    height: Math.round(32 * CARD_SCALE),
    borderRadius: Math.round(16 * CARD_SCALE),
    // Dark well behind the crest so the accent sigil reads as inlaid metal
    // (the bounty back overrides with its jewel tint inline).
    backgroundColor: "rgba(0,0,0,0.30)",
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  shieldRing: {
    width: Math.round(26 * CARD_SCALE),
    height: Math.round(26 * CARD_SCALE),
    borderRadius: Math.round(13 * CARD_SCALE),
    borderWidth: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  shieldInner: {
    width: Math.round(20 * CARD_SCALE),
    height: Math.round(20 * CARD_SCALE),
    borderRadius: Math.round(10 * CARD_SCALE),
    justifyContent: "center",
    alignItems: "center",
  },
  cornerRune: {
    position: "absolute",
    fontSize: Math.round(6 * CARD_SCALE),
  },
  edgeDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
  },

  // ── Deck Card ──
  deckCard: { flex: 1, position: "relative" },
  deckBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    minWidth: Math.round(26 * CARD_SCALE),
    height: Math.round(26 * CARD_SCALE),
    borderRadius: Math.round(13 * CARD_SCALE),
    backgroundColor: "#E8C547",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0B1410", // match game bg — was #162A47
    elevation: 4,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  deckCount: {
    fontSize: Math.round(12 * CARD_SCALE),
    fontWeight: "900",
    color: "#1a1a1a",
  },
})

export default Card
