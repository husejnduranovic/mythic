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

interface ILayout2Props {
  cards: ICard[]
  onClick: (index: number) => void
  levelId?: number
}

/**
 * Layout 2 — "Crown & Valley"
 *
 * 30 field cards in 3 sections, each 10 cards.
 *
 * LEFT — Inverted Pyramid (wide top, narrows to free cards at bottom):
 *   [0] [1] [2] [3]   <- blocked by row below
 *     [4] [5] [6]     <- blocked by row below
 *       [7] [8]       <- blocked by bottom
 *       [9]           <- OPEN (tip)
 *
 *   Blocking: [0]←[4], [1]←[4,5], [2]←[5,6], [3]←[6]
 *             [4]←[7], [5]←[7,8], [6]←[8]
 *             [7]←[9], [8]←[9]
 *             [9] always open
 *
 * CENTER — Diamond (narrow top, widens, narrows again, free at bottom):
 *     [10] [11]       <- blocked by row below
 *   [12] [13] [14]    <- blocked by row below
 *     [15] [16]       <- blocked by row below
 *   [17] [18] [19]    <- OPEN (base)
 *
 *   Blocking: [10]←[12,13], [11]←[13,14]
 *             [12]←[15], [13]←[15,16], [14]←[16]
 *             [15]←[17,18], [16]←[18,19]
 *             [17],[18],[19] always open
 *
 * RIGHT — Normal Pyramid (narrow top, widens to free cards at bottom):
 *       [20]          <- blocked by row below
 *     [21] [22]       <- blocked by row below
 *   [23] [24] [25]    <- blocked by row below
 *   [26] [27] [28] [29] <- OPEN (base)
 *
 *   Blocking: [20]←[21,22]
 *             [21]←[23,24], [22]←[24,25]
 *             [23]←[26,27], [24]←[27,28], [25]←[28,29]
 *             [26],[27],[28],[29] always open
 */

const isCleared = (cards: ICard[], ...indices: number[]) =>
  indices.every((i) => !cards[i]?.visible)

const Layout2 = React.memo(({ cards, onClick, levelId }: ILayout2Props) => {
  if (cards.length < 30) return null

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
      {/* ═══ LEFT — Inverted Pyramid ═══ */}
      <View style={styles.section}>
        <View style={styles.inner}>
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, isCleared(cards, 4))}
              {C(1, isCleared(cards, 4, 5))}
              {C(2, isCleared(cards, 5, 6))}
              {C(3, isCleared(cards, 6))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 50 }]}>
            <View style={styles.row}>
              {C(4, isCleared(cards, 7))}
              {C(5, isCleared(cards, 7, 8))}
              {C(6, isCleared(cards, 8))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 100 }]}>
            <View style={styles.row}>
              {C(7, isCleared(cards, 9))}
              {C(8, isCleared(cards, 9))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 150 }]}>
            <View style={styles.row}>{C(9, cards[9].visible)}</View>
          </View>
        </View>
      </View>

      {/* ═══ CENTER — Diamond ═══ */}
      <View style={styles.section}>
        <View style={styles.inner}>
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(10, isCleared(cards, 12, 13))}
              {C(11, isCleared(cards, 13, 14))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 50 }]}>
            <View style={styles.row}>
              {C(12, isCleared(cards, 15))}
              {C(13, isCleared(cards, 15, 16))}
              {C(14, isCleared(cards, 16))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 100 }]}>
            <View style={styles.row}>
              {C(15, isCleared(cards, 17, 18))}
              {C(16, isCleared(cards, 18, 19))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 150 }]}>
            <View style={styles.row}>
              {C(17, cards[17].visible)}
              {C(18, cards[18].visible)}
              {C(19, cards[19].visible)}
            </View>
          </View>
        </View>
      </View>

      {/* ═══ RIGHT — Normal Pyramid ═══ */}
      <View style={styles.section}>
        <View style={styles.inner}>
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>{C(20, isCleared(cards, 21, 22))}</View>
          </View>
          <View style={[styles.absRow, { top: 50 }]}>
            <View style={styles.row}>
              {C(21, isCleared(cards, 23, 24))}
              {C(22, isCleared(cards, 24, 25))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 100 }]}>
            <View style={styles.row}>
              {C(23, isCleared(cards, 26, 27))}
              {C(24, isCleared(cards, 27, 28))}
              {C(25, isCleared(cards, 28, 29))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 150 }]}>
            <View style={styles.row}>
              {C(26, cards[26].visible)}
              {C(27, cards[27].visible)}
              {C(28, cards[28].visible)}
              {C(29, cards[29].visible)}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 30,
  },
  section: {
    flex: 1,
    paddingHorizontal: 2,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  absRow: {
    position: "absolute",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
})

export default Layout2
