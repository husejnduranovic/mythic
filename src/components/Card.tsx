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
}

const SUIT_ICONS: Record<string, string> = {
  hearts: "🐉",
  diamonds: "🦅",
  clubs: "🐺",
  spades: "🐍",
}
const SUIT_COLORS: Record<string, string> = {
  hearts: "#C0392B",
  diamonds: "#D4A017",
  clubs: "#2E86C1",
  spades: "#27AE60",
}
const SUIT_BG: Record<string, string> = {
  hearts: "#FDF5F5",
  diamonds: "#FDFAF0",
  clubs: "#F0F6FD",
  spades: "#F0FDF5",
}
const SUIT_BG_TOP: Record<string, string> = {
  hearts: "rgba(192,57,43,0.06)",
  diamonds: "rgba(212,160,23,0.06)",
  clubs: "rgba(46,134,193,0.06)",
  spades: "rgba(39,174,96,0.06)",
}
const FACE_TITLES: Record<string, string> = {
  J: "KNIGHT",
  Q: "QUEEN",
  K: "KING",
  A: "ACE",
}
const DEFAULT_BACK_COLOR = "#162A47"
const BACK_ICONS: Record<string, string> = {
  "#162A47": "⚔",
  "#5C1A1A": "🐉",
  "#1A3524": "🐺",
  "#4A3A10": "🦅",
  "#0A0A1A": "🐍",
  "#3A1A50": "👑",
  "#4A0A0A": "🌙",
  "#0A2A4A": "⛈",
  "#3A3A10": "ᚱ",
  "#4A3800": "✦",
  "#2A1040": "👻",
  "#4A1500": "🔥",
  "#3D2E0A": "📜",
}
const BACK_RUNES = ["ᚠ", "ᚦ", "ᚱ", "ᛟ"]

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 750, SCREEN_H / 340, 1)
const CARD_W = Math.round(52 * CARD_SCALE)
const CARD_H = Math.round(74 * CARD_SCALE)
const DECK_W = Math.round(56 * CARD_SCALE)
const DECK_H = Math.round(78 * CARD_SCALE)
const CARD_RADIUS = Math.round(10 * CARD_SCALE)

const CardBackView = React.memo(({ color }: { color: string }) => {
  const icon = BACK_ICONS[color] || "⚔"
  return (
    <View
      style={[
        styles.cardBack,
        { backgroundColor: color, borderColor: `${color}EE` },
      ]}
    >
      <View style={styles.backOuterFrame} />
      <View style={styles.backInnerFrame} />
      <View style={styles.backCrossH} />
      <View style={styles.backCrossV} />
      <View style={styles.backDiagonal1} />
      <View style={styles.backDiagonal2} />
      <View style={styles.shield}>
        <View style={styles.shieldRing}>
          <View style={styles.shieldInner}>
            <Text style={styles.shieldIcon}>{icon}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.cornerRune, { top: 4, left: 4 }]}>
        {BACK_RUNES[0]}
      </Text>
      <Text style={[styles.cornerRune, { top: 4, right: 4 }]}>
        {BACK_RUNES[1]}
      </Text>
      <Text style={[styles.cornerRune, { bottom: 4, left: 4 }]}>
        {BACK_RUNES[2]}
      </Text>
      <Text style={[styles.cornerRune, { bottom: 4, right: 4 }]}>
        {BACK_RUNES[3]}
      </Text>
      <View style={[styles.edgeDot, { top: 3, left: "48%" }]} />
      <View style={[styles.edgeDot, { bottom: 3, left: "48%" }]} />
      <View style={[styles.edgeDot, { top: "48%", left: 3 }]} />
      <View style={[styles.edgeDot, { top: "48%", right: 3 }]} />
    </View>
  )
})

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

const CardFace = React.memo(({ card }: { card: ICard }) => {
  const icon = SUIT_ICONS[card.suit] ?? ""
  const color = SUIT_COLORS[card.suit] ?? "#333"
  const bg = SUIT_BG[card.suit] ?? "#F8F5EC"
  const bgTop = SUIT_BG_TOP[card.suit] ?? "rgba(0,0,0,0.03)"
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
      <View style={[styles.cardFaceInner, { borderColor: color + "20" }]} />
      {isFaceCard && (
        <View style={[styles.faceCardTrim, { borderColor: color + "18" }]} />
      )}
      <Text
        style={[
          styles.watermarkIcon,
          {
            color: color + "0C",
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
})

const BountyCardFace = React.memo(({ card }: { card: ICard }) => {
  const bc = useBountyStyle()
  const color = bc.textColor
  const isFaceCard = ["J", "Q", "K", "A"].includes(card.displayValue)
  const isAce = card.displayValue === "A"
  const faceTitle = FACE_TITLES[card.displayValue]
  return (
    <View
      style={[
        styles.cardFace,
        { backgroundColor: bc.frontBg, borderColor: bc.accent, borderWidth: 2 },
      ]}
    >
      <View
        style={[styles.faceTintTop, { backgroundColor: bc.accent + "10" }]}
      />
      <View style={[styles.cardFaceInner, { borderColor: bc.accent + "40" }]} />
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
})

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

const HintGlow = () => {
  const pulse = useSharedValue(0.6)
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }))
  return <Animated.View style={[styles.hintGlow, style]} pointerEvents="none" />
}

const Card = React.memo((props: ICardProps) => {
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
  } = props
  const contextBackColor = useCardBackColor()
  const cardBackColor = propBackColor || contextBackColor || DEFAULT_BACK_COLOR
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
})

const styles = StyleSheet.create({
  emptySlot: { width: DECK_W, height: DECK_H, margin: 2, padding: 2 },
  touch: { margin: 2, padding: 2 },
  touchDeck: { margin: 3, padding: 2 },
  wrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  wrapDeck: {
    width: DECK_W,
    height: DECK_H,
    borderRadius: CARD_RADIUS,
    elevation: 3,
  },
  cardFace: {
    flex: 1,
    backgroundColor: "#F8F5EC",
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
    height: "35%",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
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
    textShadowColor: "rgba(0,0,0,0.12)",
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
  cardBack: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
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
    borderColor: "rgba(232,197,71,0.4)",
  },
  backInnerFrame: {
    position: "absolute",
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderRadius: Math.max(2, CARD_RADIUS - 6),
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.2)",
  },
  backCrossH: {
    position: "absolute",
    top: "50%",
    left: 8,
    right: 8,
    height: 0.5,
    backgroundColor: "rgba(232,197,71,0.06)",
  },
  backCrossV: {
    position: "absolute",
    left: "50%",
    top: 8,
    bottom: 8,
    width: 0.5,
    backgroundColor: "rgba(232,197,71,0.06)",
  },
  backDiagonal1: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
    backgroundColor: "rgba(232,197,71,0.06)",
    transform: [{ rotate: "30deg" }],
  },
  backDiagonal2: {
    position: "absolute",
    top: "50%",
    left: -10,
    right: -10,
    height: 0.5,
    backgroundColor: "rgba(232,197,71,0.06)",
    transform: [{ rotate: "-30deg" }],
  },
  shield: {
    width: Math.round(32 * CARD_SCALE),
    height: Math.round(32 * CARD_SCALE),
    borderRadius: Math.round(16 * CARD_SCALE),
    backgroundColor: "rgba(232,197,71,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shieldRing: {
    width: Math.round(26 * CARD_SCALE),
    height: Math.round(26 * CARD_SCALE),
    borderRadius: Math.round(13 * CARD_SCALE),
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.2)",
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
    color: "rgba(232,197,71,0.75)",
  },
  cornerRune: {
    position: "absolute",
    fontSize: Math.round(6 * CARD_SCALE),
    color: "rgba(232,197,71,0.4)",
  },
  edgeDot: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
  },
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
    borderColor: "#162A47",
    elevation: 4,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  deckCount: {
    fontSize: Math.round(12 * CARD_SCALE),
    fontWeight: "900",
    color: "#1a1a1a",
  },
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
