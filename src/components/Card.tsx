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
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated"
import { useBountyStyle, useCardBackColor } from "../context/ThemeContext"
import { BACK_ICONS } from "./Armory"

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
  hinted?: boolean
  cardBackColor?: string
  bounty?: boolean
  bountyConfig?: {
    backColor: string
    accent: string
    frontBg: string
    textColor: string
  }
  pending?: boolean
}

// ─── REPLACE THESE CONSTANTS at the top of Card.tsx ───

const SUIT_ICONS: Record<string, string> = {
  hearts: "🐉",
  diamonds: "🦅",
  clubs: "🐺",
  spades: "🐍",
}

// Deeper, more medieval — still clearly distinct
const SUIT_COLORS: Record<string, string> = {
  hearts: "#B02020", // deep crimson (was bright red)
  diamonds: "#B8860B", // dark gold/amber (was bright yellow)
  clubs: "#1A5C8A", // deep steel blue (was bright blue)
  spades: "#1E6B3A", // deep forest green (was bright green)
}

// Warm parchment base — same for all suits, medieval feel
const SUIT_BG: Record<string, string> = {
  hearts: "#F2E8D5",
  diamonds: "#F2E8D5",
  clubs: "#F2E8D5",
  spades: "#F2E8D5",
}

// Subtle tint at top — just a whisper of the suit color
const SUIT_BG_TOP: Record<string, string> = {
  hearts: "rgba(176,32,32,0.07)",
  diamonds: "rgba(184,134,11,0.07)",
  clubs: "rgba(26,92,138,0.07)",
  spades: "rgba(30,107,58,0.07)",
}

// Pre-computed suit style packs — one object lookup instead of four per card render
const SUIT_STYLES: Record<
  string,
  { icon: string; color: string; bg: string; bgTop: string }
> = {
  hearts: {
    icon: SUIT_ICONS.hearts,
    color: SUIT_COLORS.hearts,
    bg: SUIT_BG.hearts,
    bgTop: SUIT_BG_TOP.hearts,
  },
  diamonds: {
    icon: SUIT_ICONS.diamonds,
    color: SUIT_COLORS.diamonds,
    bg: SUIT_BG.diamonds,
    bgTop: SUIT_BG_TOP.diamonds,
  },
  clubs: {
    icon: SUIT_ICONS.clubs,
    color: SUIT_COLORS.clubs,
    bg: SUIT_BG.clubs,
    bgTop: SUIT_BG_TOP.clubs,
  },
  spades: {
    icon: SUIT_ICONS.spades,
    color: SUIT_COLORS.spades,
    bg: SUIT_BG.spades,
    bgTop: SUIT_BG_TOP.spades,
  },
}

const DEFAULT_SUIT_STYLE = {
  icon: "",
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
// const BACK_ICONS: Record<string, string> = {
//   "#162A47": "🛡",
//   "#3A1212": "🐉",
//   "#1A3524": "🐺",
//   "#3D3008": "🦅",
//   "#150D30": "🐍",
//   "#2A1045": "👑",
//   "#3A0A18": "🌙",
//   "#0A1A3D": "🌩",
//   "#2D2D0A": "📜",
//   "#3A2800": "⚜️",
//   "#1A0D30": "👻",
//   "#3A1500": "🔥",
//   "#3D2E0A": "📜",
// }
const BACK_RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 780, SCREEN_H / 360, 1)
const CARD_W = Math.round(52 * CARD_SCALE)
const CARD_H = Math.round(74 * CARD_SCALE)
const DECK_W = Math.round(56 * CARD_SCALE)
const DECK_H = Math.round(78 * CARD_SCALE)
const CARD_RADIUS = Math.round(10 * CARD_SCALE)

// ─── REPLACE CardBackView in Card.tsx ───

const CardBackView = React.memo(
  ({ color }: { color: string }) => {
    const icon = BACK_ICONS[color] || "⚔"

    // Derive a lighter version of the card color for borders/accents
    // We overlay white at low opacity to "lighten" the base color
    const borderColor = color + "FF" // full opacity base
    const frameOuter = color // will use with white overlay trick in style

    return (
      <View
        style={[
          styles.cardBack,
          {
            backgroundColor: color,
            borderColor: "rgba(255,255,255,0.18)", // subtle white edge — works on ANY color
          },
        ]}
      >
        {/* Outer frame — lighter than bg */}
        <View
          style={[
            styles.backOuterFrame,
            { borderColor: "rgba(255,255,255,0.22)" },
          ]}
        />
        {/* Inner frame — even subtler */}
        <View
          style={[
            styles.backInnerFrame,
            { borderColor: "rgba(255,255,255,0.12)" },
          ]}
        />
        {/* Cross lines */}
        <View
          style={[
            styles.backCrossH,
            { backgroundColor: "rgba(255,255,255,0.06)" },
          ]}
        />
        <View
          style={[
            styles.backCrossV,
            { backgroundColor: "rgba(255,255,255,0.06)" },
          ]}
        />
        {/* Diagonals */}
        <View
          style={[
            styles.backDiagonal1,
            { backgroundColor: "rgba(255,255,255,0.04)" },
          ]}
        />
        <View
          style={[
            styles.backDiagonal2,
            { backgroundColor: "rgba(255,255,255,0.04)" },
          ]}
        />
        {/* Center medallion */}
        <View
          style={[
            styles.shield,
            {
              backgroundColor: "rgba(255,255,255,0.07)",
              borderColor: "rgba(255,255,255,0.25)",
            },
          ]}
        >
          <View
            style={[
              styles.shieldRing,
              { borderColor: "rgba(255,255,255,0.15)" },
            ]}
          >
            <View style={styles.shieldInner}>
              <Text style={styles.shieldIcon}>{icon}</Text>
            </View>
          </View>
        </View>
        {/* Corner runes */}
        <Text
          style={[
            styles.cornerRune,
            { top: 3, left: 3, color: "rgba(255,255,255,0.35)" },
          ]}
        >
          {BACK_RUNES[0]}
        </Text>
        <Text
          style={[
            styles.cornerRune,
            { top: 3, right: 3, color: "rgba(255,255,255,0.35)" },
          ]}
        >
          {BACK_RUNES[1]}
        </Text>
        <Text
          style={[
            styles.cornerRune,
            { bottom: 3, left: 3, color: "rgba(255,255,255,0.35)" },
          ]}
        >
          {BACK_RUNES[2]}
        </Text>
        <Text
          style={[
            styles.cornerRune,
            { bottom: 3, right: 3, color: "rgba(255,255,255,0.35)" },
          ]}
        >
          {BACK_RUNES[3]}
        </Text>
        {/* Edge dots */}
        <View
          style={[
            styles.edgeDot,
            { top: 3, left: "46%", backgroundColor: "rgba(255,255,255,0.25)" },
          ]}
        />
        <View
          style={[
            styles.edgeDot,
            {
              bottom: 3,
              left: "46%",
              backgroundColor: "rgba(255,255,255,0.25)",
            },
          ]}
        />
        <View
          style={[
            styles.edgeDot,
            { top: "46%", left: 3, backgroundColor: "rgba(255,255,255,0.25)" },
          ]}
        />
        <View
          style={[
            styles.edgeDot,
            { top: "46%", right: 3, backgroundColor: "rgba(255,255,255,0.25)" },
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
            <Text
              style={[
                styles.shieldIcon,
                { color: bc.accent, fontSize: Math.round(14 * CARD_SCALE) },
              ]}
            >
              {bc.icon}
            </Text>
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

const CardFace = React.memo(
  ({ card }: { card: ICard }) => {
    const suitStyle = SUIT_STYLES[card.suit] || DEFAULT_SUIT_STYLE
    const { icon, color, bg, bgTop } = suitStyle
    const isFaceCard = ["J", "Q", "K", "A"].includes(card.displayValue)
    const isAce = card.displayValue === "A"
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
        {isFaceCard && (
          <View style={[styles.faceCardTrim, { borderColor: color + "18" }]} />
        )}
        <Text
          style={[
            styles.watermarkIcon,
            {
              color: color + "22",
              fontSize: isAce
                ? Math.round(50 * CARD_SCALE)
                : Math.round(40 * CARD_SCALE),
            },
          ]}
        >
          {icon}
        </Text>
        <View
          style={[styles.faceDividerTop, { backgroundColor: color + "10" }]}
        />
        <View
          style={[styles.faceDividerBottom, { backgroundColor: color + "10" }]}
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
          <Text style={styles.cornerIcon}>{icon}</Text>
        </View>
        <View style={styles.centerWrap}>
          {isAce ? (
            <>
              <Text
                style={[
                  styles.centerIcon,
                  { fontSize: Math.round(22 * CARD_SCALE), marginBottom: -2 },
                ]}
              >
                {icon}
              </Text>
              <Text
                style={[
                  styles.centerValue,
                  {
                    color,
                    fontSize: Math.round(24 * CARD_SCALE),
                    lineHeight: Math.round(28 * CARD_SCALE),
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
                    fontSize: isFaceCard
                      ? Math.round(26 * CARD_SCALE)
                      : Math.round(28 * CARD_SCALE),
                    lineHeight: isFaceCard
                      ? Math.round(30 * CARD_SCALE)
                      : Math.round(32 * CARD_SCALE),
                  },
                ]}
              >
                {card.displayValue}
              </Text>
              <Text
                style={[
                  styles.centerIcon,
                  { fontSize: Math.round(14 * CARD_SCALE) },
                ]}
              >
                {icon}
              </Text>
            </>
          )}
          {faceTitle && (
            <Text style={[styles.faceTitle, { color: color + "40" }]}>
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
          <Text style={styles.cornerIcon}>{icon}</Text>
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
    const color = bc.textColor
    const isFaceCard = ["J", "Q", "K", "A"].includes(card.displayValue)
    const isAce = card.displayValue === "A"
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
        <Text
          style={[
            styles.watermarkIcon,
            {
              color: bc.accent + "1A",
              fontSize: isAce
                ? Math.round(50 * CARD_SCALE)
                : Math.round(40 * CARD_SCALE),
            },
          ]}
        >
          {bc.icon}
        </Text>
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
          <Text style={styles.cornerIcon}>{bc.icon}</Text>
        </View>
        <View style={styles.centerWrap}>
          {isAce ? (
            <>
              <Text
                style={[
                  styles.centerIcon,
                  { fontSize: Math.round(22 * CARD_SCALE), marginBottom: -2 },
                ]}
              >
                {bc.icon}
              </Text>
              <Text
                style={[
                  styles.centerValue,
                  {
                    color,
                    fontSize: Math.round(24 * CARD_SCALE),
                    lineHeight: Math.round(28 * CARD_SCALE),
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
                    fontSize: isFaceCard
                      ? Math.round(26 * CARD_SCALE)
                      : Math.round(28 * CARD_SCALE),
                    lineHeight: isFaceCard
                      ? Math.round(30 * CARD_SCALE)
                      : Math.round(32 * CARD_SCALE),
                  },
                ]}
              >
                {card.displayValue}
              </Text>
              <Text
                style={[
                  styles.centerIcon,
                  { fontSize: Math.round(14 * CARD_SCALE) },
                ]}
              >
                {bc.icon}
              </Text>
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
          <Text style={styles.cornerIcon}>{bc.icon}</Text>
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
      { duration: 200, easing: Easing.inOut(Easing.cubic) },
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
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      {
        rotateY: `${interpolate(progress.value, [0, 0.5, 1], [-90, -90, 0])}deg`,
      },
      { scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.05, 1]) },
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
  useEffect(() => {
    y.value = withTiming(80, { duration: 180, easing: Easing.in(Easing.quad) })
    sc.value = withTiming(0.6, { duration: 180 })
    r.value = withTiming((Math.random() - 0.5) * 30, { duration: 180 })
    o.value = withTiming(0, { duration: 170 }, () => {
      runOnJS(onDone)()
    })
  }, [])
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { scale: sc.value },
      { rotate: `${r.value}deg` },
    ],
    opacity: o.value,
  }))
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
      hinted = false,
      cardBackColor: propBackColor,
      bounty,
      pending,
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
          { zIndex: pending ? 10 : isOpen ? 2 : 1 },
        ]}
      >
        <View
          style={[
            isDeck ? styles.wrapDeck : styles.wrap,
            pending && styles.wrapPending,
          ]}
        >
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
    if (prev.hinted !== next.hinted) return false
    if (prev.isOpen !== next.isOpen) return false
    if (prev.remove !== next.remove) return false
    if (prev.bounty !== next.bounty) return false
    if (prev.alwaysEnabled !== next.alwaysEnabled) return false
    if (prev.remaining !== next.remaining) return false
    if (prev.cardBackColor !== next.cardBackColor) return false
    if (prev.pending !== next.pending) return false
    // if (prev.onClick !== next.onClick) return false // ← ADD THIS

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

// ─── REPLACE the StyleSheet.create({}) in Card.tsx ───

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
  wrapPending: {
    transform: [{ scale: 1.15 }],
    borderWidth: 2,
    borderColor: "#E8C547",
    borderRadius: CARD_RADIUS,
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
    borderWidth: 0.5,
  },
  watermarkIcon: {
    position: "absolute",
    fontSize: Math.round(40 * CARD_SCALE),
  },
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
  cornerValue: {
    fontSize: Math.round(10 * CARD_SCALE),
    fontWeight: "900",
    lineHeight: Math.round(11 * CARD_SCALE),
  },
  cornerIcon: {
    fontSize: Math.round(7 * CARD_SCALE),
    lineHeight: Math.round(9 * CARD_SCALE),
    marginTop: -1,
  },
  centerWrap: { alignItems: "center", justifyContent: "center" },
  centerValue: {
    fontSize: Math.round(28 * CARD_SCALE),
    fontWeight: "900",
    lineHeight: Math.round(32 * CARD_SCALE),
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerIcon: { fontSize: Math.round(14 * CARD_SCALE), marginTop: -2 },
  faceTitle: {
    fontSize: Math.round(5 * CARD_SCALE),
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 1,
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
  backOuterFrame: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: Math.max(3, CARD_RADIUS - 3),
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.55)", // was 0.4 — more visible
  },
  backInnerFrame: {
    position: "absolute",
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: Math.max(2, CARD_RADIUS - 6),
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.3)", // was 0.2
  },
  backCrossH: {
    position: "absolute",
    top: "50%",
    left: 8,
    right: 8,
    height: 0.5,
    backgroundColor: "rgba(232,197,71,0.12)", // was 0.06 — actually visible now
  },
  backCrossV: {
    position: "absolute",
    left: "50%",
    top: 8,
    bottom: 8,
    width: 0.5,
    backgroundColor: "rgba(232,197,71,0.12)",
  },
  backDiagonal1: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
    backgroundColor: "rgba(232,197,71,0.08)", // was 0.06
    transform: [{ rotate: "30deg" }],
  },
  backDiagonal2: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
    backgroundColor: "rgba(232,197,71,0.08)",
    transform: [{ rotate: "-30deg" }],
  },
  shield: {
    width: Math.round(32 * CARD_SCALE),
    height: Math.round(32 * CARD_SCALE),
    borderRadius: Math.round(16 * CARD_SCALE),
    backgroundColor: "rgba(232,197,71,0.12)", // was 0.08
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.5)", // was 0.3 — more defined
    justifyContent: "center",
    alignItems: "center",
  },
  shieldRing: {
    width: Math.round(26 * CARD_SCALE),
    height: Math.round(26 * CARD_SCALE),
    borderRadius: Math.round(13 * CARD_SCALE),
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.3)", // was 0.2
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
  shieldIcon: {
    fontSize: Math.round(12 * CARD_SCALE),
    color: "rgba(255,255,255,0.80)", // was rgba(232,197,71,0.9)
  },
  cornerRune: {
    position: "absolute",
    fontSize: Math.round(6 * CARD_SCALE),
    color: "rgba(255,255,255,0.35)", // base — overridden inline above anyway
  },
  edgeDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(232,197,71,0.35)", // was 0.2
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

  // ── Hint Glow ──
  hintGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: CARD_RADIUS + 4,
    borderWidth: 2,
    borderColor: "#E8C547",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
})

export default Card
