import React, { useEffect, useMemo, useRef, useState } from "react"
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated"
import { useCardBackColor } from "../context/ThemeContext"

export interface ICard {
  value: string
  suit: "hearts" | "diamonds" | "clubs" | "spades"
  displayValue: string
  visible: boolean
}

interface ICardProps {
  card?: ICard
  isOpen?: boolean
  onClick: (index: number) => void
  remove?: boolean
  disabled?: boolean
  alwaysEnabled?: boolean
  remaining?: number
  hinted?: boolean
  cardBackColor?: string
  index: number
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

const DEFAULT_BACK_COLOR = "#162A47"

const BACK_ICONS: Record<string, string> = {
  "#162A47": "⚔",
  "#4A1520": "🐉",
  "#1A3524": "🐺",
  "#3A2A10": "🦅",
  "#0A0A1A": "🐍",
  "#2A1540": "👑",
}

// Responsive card scaling
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 800, SCREEN_H / 400, 1)
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
        {
          backgroundColor: color,
          borderColor: color === "#162A47" ? "#1B3A5C" : `${color}CC`,
        },
      ]}
    >
      <View style={styles.backFrame} />
      <View style={styles.shield}>
        <Text style={styles.shieldIcon}>{icon}</Text>
      </View>
      <Text style={[styles.cornerOrn, { top: 5, left: 5 }]}>✦</Text>
      <Text style={[styles.cornerOrn, { top: 5, right: 5 }]}>✦</Text>
      <Text style={[styles.cornerOrn, { bottom: 5, left: 5 }]}>✦</Text>
      <Text style={[styles.cornerOrn, { bottom: 5, right: 5 }]}>✦</Text>
    </View>
  )
})

const CardFace = React.memo(({ card }: { card: ICard }) => {
  const icon = SUIT_ICONS[card.suit] ?? ""
  const color = SUIT_COLORS[card.suit] ?? "#333"
  return (
    <View
      style={[styles.cardFace, { borderColor: color + "60", borderWidth: 2 }]}
    >
      <View style={styles.cornerGroup}>
        <Text style={[styles.cornerValue, { color }]}>{card.displayValue}</Text>
        <Text style={styles.cornerIcon}>{icon}</Text>
      </View>
      <Text style={[styles.centerValue, { color }]}>{card.displayValue}</Text>
      <Text style={styles.centerIcon}>{icon}</Text>
      <View style={[styles.cornerGroup, styles.cornerBR]}>
        <Text style={[styles.cornerValue, { color }]}>{card.displayValue}</Text>
        <Text style={styles.cornerIcon}>{icon}</Text>
      </View>
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
  onDone,
}: {
  card: ICard
  backColor: string
  onDone: () => void
}) => {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(
      1,
      {
        duration: 100,
        easing: Easing.out(Easing.cubic),
      },
      () => runOnJS(onDone)(),
    )
  }, [])

  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 0.5, 1], [0, 90, 90])
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 0.95, 1])

    return {
      transform: [{ perspective: 900 }, { rotateY: `${rotate}deg` }, { scale }],
      opacity: progress.value < 0.5 ? 1 : 0,
      position: "absolute",
      width: "100%",
      height: "100%",
    }
  })

  const faceStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 0.5, 1], [-90, -90, 0])
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.95, 0.95, 1])

    return {
      transform: [{ perspective: 900 }, { rotateY: `${rotate}deg` }, { scale }],
      opacity: progress.value >= 0.5 ? 1 : 0,
      position: "absolute",
      width: "100%",
      height: "100%",
    }
  })

  return (
    <View style={styles.wrap}>
      <Animated.View style={backStyle}>
        <CardBackView color={backColor} />
      </Animated.View>

      <Animated.View style={faceStyle}>
        <CardFace card={card} />
      </Animated.View>
    </View>
  )
}

const FallingCard = ({
  card,
  isOpen,
  backColor,
  onDone,
}: {
  card?: ICard
  isOpen?: boolean
  backColor: string
  onDone: () => void
}) => {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(
      1,
      {
        duration: 90,
        easing: Easing.out(Easing.quad),
      },
      () => runOnJS(onDone)(),
    )
  }, [])

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [0, 90]),
        },
        {
          scale: interpolate(progress.value, [0, 1], [1, 0.92]),
        },
      ],
      opacity: interpolate(progress.value, [0, 0.8, 1], [1, 0.6, 0]),
    }
  })

  return (
    <Animated.View style={[styles.wrap, style]}>
      {isOpen && card ? (
        <CardFace card={card} />
      ) : (
        <CardBackView color={backColor} />
      )}
    </Animated.View>
  )
}
const HintGlow = () => <View style={styles.hintGlow} pointerEvents="none" />

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
    index,
  } = props
  const contextBackColor = useCardBackColor()
  const cardBackColor = useMemo(
    () => propBackColor || contextBackColor || DEFAULT_BACK_COLOR,
    [propBackColor, contextBackColor],
  )
  const prevRemove = useRef(remove)
  const prevIsOpen = useRef(isOpen)
  const [falling, setFalling] = useState(false)
  const [gone, setGone] = useState(!!remove)
  const [flipping, setFlipping] = useState(false)

  const [displayOpen, setDisplayOpen] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        setDisplayOpen(true)
      })
    } else {
      setDisplayOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!remove && prevRemove.current) {
      setFalling(false)
      setGone(false)
      setFlipping(false)
    } else if (remove && !prevRemove.current && !gone) {
      setFalling(true)
    } else if (!remove && gone) {
      setGone(false)
    }

    prevRemove.current = remove
  }, [remove, gone])

  // Synchronous flip detection — must be in render body to prevent blink
  if (
    isOpen &&
    !prevIsOpen.current &&
    !remove &&
    !falling &&
    !gone &&
    !flipping
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
          isOpen={displayOpen}
          backColor={cardBackColor}
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
          onDone={() => setFlipping(false)}
        />
      </View>
    )

  const isDeck = remaining !== undefined
  const isDisabled = !alwaysEnabled && (disabled || !isOpen)
  return (
    <Pressable
      onPress={() => onClick(index)}
      disabled={isDisabled}
      style={[
        isDeck ? styles.touchDeck : styles.touch,
        { zIndex: isOpen ? 2 : 1 },
      ]}
    >
      <View style={isDeck ? styles.wrapDeck : styles.wrap}>
        {isDeck ? (
          <DeckCard remaining={remaining!} backColor={cardBackColor} />
        ) : isOpen && card ? (
          <CardFace card={card} />
        ) : (
          <CardBackView color={cardBackColor} />
        )}
        {hinted && <HintGlow />}
      </View>
    </Pressable>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  wrapDeck: {
    width: DECK_W,
    height: DECK_H,
    borderRadius: CARD_RADIUS,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
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
  cornerGroup: { position: "absolute", top: 3, left: 4, alignItems: "center" },
  cornerBR: {
    top: undefined,
    left: undefined,
    bottom: 3,
    right: 4,
    transform: [{ rotate: "180deg" }],
  },
  cornerValue: {
    fontSize: Math.round(9 * CARD_SCALE),
    fontWeight: "900",
    lineHeight: Math.round(11 * CARD_SCALE),
  },
  cornerIcon: {
    fontSize: Math.round(7 * CARD_SCALE),
    lineHeight: Math.round(9 * CARD_SCALE),
    marginTop: -1,
  },
  centerValue: {
    fontSize: Math.round(28 * CARD_SCALE),
    fontWeight: "900",
    lineHeight: Math.round(32 * CARD_SCALE),
  },
  centerIcon: { fontSize: Math.round(14 * CARD_SCALE), marginTop: -2 },
  cardBack: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  backFrame: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: Math.max(3, CARD_RADIUS - 3),
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.25)",
  },
  shield: {
    width: Math.round(28 * CARD_SCALE),
    height: Math.round(28 * CARD_SCALE),
    borderRadius: Math.round(14 * CARD_SCALE),
    backgroundColor: "rgba(232,197,71,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  shieldIcon: {
    fontSize: Math.round(10 * CARD_SCALE),
    color: "rgba(232,197,71,0.6)",
  },
  cornerOrn: {
    position: "absolute",
    fontSize: Math.round(5 * CARD_SCALE),
    color: "rgba(232,197,71,0.3)",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  },
  deckCount: {
    fontSize: Math.round(12 * CARD_SCALE),
    fontWeight: "900",
    color: "#1a1a1a",
  },
  hintGlow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: CARD_RADIUS + 3,
    borderWidth: 2,
    borderColor: "#E8C547",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 12,
  },
})

export default Card
