import React, { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

interface ILayout4Props {
  cards: ICard[]
  onClick: (index: number) => void
  levelId?: number
}

/**
 * Layout 4 — "Dragon's Spine" (28 cards)
 *
 * A winding formation across the screen with no repeating sections.
 *
 *       [0]                    [7][8][9][10]              [17]
 *     [1] [2]    [4]          [11][12][13]      [15]    [18][19]
 *       [3]     [5]                             [16]      [20]
 *              [6]
 *
 *     [21] [22] [23] [24] [25] [26] [27]   ← OPEN base
 *
 * LEFT DIAMOND (0-3):   [0]←[1,2]  [1]←[3]  [2]←[3]  [3]=OPEN
 * LEFT CHAIN (4-6):     [4]←[5]  [5]←[6]  [6]=OPEN
 * CENTER CROWN (7-13):  [7]←[11]  [8]←[11,12]  [9]←[12,13]  [10]←[13]
 *                        [11],[12],[13]=OPEN
 * RIGHT CHAIN (14-16):  [14]←[15]  [15]←[16]  [16]=OPEN
 * RIGHT DIAMOND (17-20): [17]←[18,19]  [18]←[20]  [19]←[20]  [20]=OPEN
 * BASE (21-27):          all OPEN
 */

const isCleared = (cards: ICard[], ...i: number[]) =>
  i.every((x) => !cards[x]?.visible)

const Layout4 = React.memo(({ cards, onClick, levelId }: ILayout4Props) => {
  if (cards.length < 28) return null

  const handleClick = React.useCallback(
    (index: number) => {
      onClick(index)
    },
    [onClick],
  )

  const layoutProgress = useSharedValue(0)

  useEffect(() => {
    layoutProgress.value = 0
    layoutProgress.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    })
  }, [levelId])

  const layoutStyle = useAnimatedStyle(() => ({
    opacity: layoutProgress.value,
    transform: [
      {
        translateY: (1 - layoutProgress.value) * 20,
      },
      {
        scale: 0.98 + 0.02 * layoutProgress.value,
      },
    ],
  }))

  const C = (i: number, open: boolean) => (
    <Card
      card={cards[i]}
      isOpen={open}
      remove={!cards[i].visible}
      onClick={handleClick}
      index={i}
    />
  )

  return (
    <Animated.View style={[styles.container, layoutStyle]}>
      {/* TOP FORMATIONS */}
      <View style={styles.topRow}>
        {/* Left diamond */}
        <View style={styles.diamond}>
          <View style={styles.diamondInner}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>{C(0, isCleared(cards, 1, 2))}</View>
            </View>
            <View style={[styles.absRow, { top: 46 }]}>
              <View style={styles.row}>
                {C(1, isCleared(cards, 3))}
                {C(2, isCleared(cards, 3))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 92 }]}>
              <View style={styles.row}>{C(3, cards[3].visible)}</View>
            </View>
          </View>
        </View>

        {/* Left chain — diagonal stepping down */}
        <View style={styles.chain}>
          <View style={styles.chainInner}>
            <View style={[styles.absRow, { top: 10 }]}>
              <View style={styles.row}>{C(4, isCleared(cards, 5))}</View>
            </View>
            <View style={[styles.absRow, { top: 56 }]}>
              <View style={styles.row}>{C(5, isCleared(cards, 6))}</View>
            </View>
            <View style={[styles.absRow, { top: 102 }]}>
              <View style={styles.row}>{C(6, cards[6].visible)}</View>
            </View>
          </View>
        </View>

        {/* Center crown — inverted triangle */}
        <View style={styles.crown}>
          <View style={styles.crownInner}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(7, isCleared(cards, 11))}
                {C(8, isCleared(cards, 11, 12))}
                {C(9, isCleared(cards, 12, 13))}
                {C(10, isCleared(cards, 13))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 50 }]}>
              <View style={styles.row}>
                {C(11, cards[11].visible)}
                {C(12, cards[12].visible)}
                {C(13, cards[13].visible)}
              </View>
            </View>
          </View>
        </View>

        {/* Right chain — diagonal stepping down */}
        <View style={styles.chain}>
          <View style={styles.chainInner}>
            <View style={[styles.absRow, { top: 10 }]}>
              <View style={styles.row}>{C(14, isCleared(cards, 15))}</View>
            </View>
            <View style={[styles.absRow, { top: 56 }]}>
              <View style={styles.row}>{C(15, isCleared(cards, 16))}</View>
            </View>
            <View style={[styles.absRow, { top: 102 }]}>
              <View style={styles.row}>{C(16, cards[16].visible)}</View>
            </View>
          </View>
        </View>

        {/* Right diamond */}
        <View style={styles.diamond}>
          <View style={styles.diamondInner}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>{C(17, isCleared(cards, 18, 19))}</View>
            </View>
            <View style={[styles.absRow, { top: 46 }]}>
              <View style={styles.row}>
                {C(18, isCleared(cards, 20))}
                {C(19, isCleared(cards, 20))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 92 }]}>
              <View style={styles.row}>{C(20, cards[20].visible)}</View>
            </View>
          </View>
        </View>
      </View>

      {/* BASE ROW — always open */}
      <View style={styles.baseRow}>
        {C(21, cards[21].visible)}
        {C(22, cards[22].visible)}
        {C(23, cards[23].visible)}
        {C(24, cards[24].visible)}
        {C(25, cards[25].visible)}
        {C(26, cards[26].visible)}
        {C(27, cards[27].visible)}
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: 4 },
  topRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    paddingTop: 4,
  },
  diamond: { width: "15%", alignItems: "center" },
  diamondInner: { height: 150, width: "100%", alignItems: "center" },
  chain: { width: "10%", alignItems: "center" },
  chainInner: { height: 160, width: "100%", alignItems: "center" },
  crown: { width: "30%", alignItems: "center" },
  crownInner: { height: 120, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout4
