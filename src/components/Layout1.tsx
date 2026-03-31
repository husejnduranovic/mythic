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

interface ILayout1Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  levelId?: number
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

const Layout1 = React.memo(({ cards, onClick, levelId }: ILayout1Props) => {
  if (cards.length < 18) return null

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

  return (
    <Animated.View style={[styles.container, layoutStyle]}>
      {/* LEFT TOWER */}
      <View style={styles.tower}>
        <View style={styles.row}>
          <Card
            card={cards[1]}
            isOpen={true}
            remove={!cards[1].visible}
            onClick={handleClick}
            index={1}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[0]}
            isOpen={isOpen(cards, 1)}
            remove={!cards[0].visible}
            onClick={handleClick}
            index={0}
          />
          <Card
            card={cards[2]}
            isOpen={isOpen(cards, 1)}
            remove={!cards[2].visible}
            onClick={handleClick}
            index={2}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[3]}
            isOpen={true}
            remove={!cards[3].visible}
            onClick={handleClick}
            index={3}
          />
        </View>
      </View>

      {/* CENTER PYRAMID */}
      <View style={styles.pyramid}>
        <View style={styles.row}>
          <Card
            card={cards[4]}
            isOpen={true}
            remove={!cards[4].visible}
            onClick={() => onClick(4)}
            index={4}
          />
          <Card
            card={cards[5]}
            isOpen={true}
            remove={!cards[5].visible}
            onClick={() => onClick(5)}
            index={5}
          />
          <Card
            card={cards[6]}
            isOpen={true}
            remove={!cards[6].visible}
            onClick={() => onClick(6)}
            index={6}
          />
          <Card
            card={cards[7]}
            isOpen={true}
            remove={!cards[7].visible}
            onClick={() => onClick(7)}
            index={7}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[8]}
            isOpen={isOpen(cards, 4, 5)}
            remove={!cards[8].visible}
            onClick={() => onClick(8)}
            index={8}
          />
          <Card
            card={cards[9]}
            isOpen={isOpen(cards, 5, 6)}
            remove={!cards[9].visible}
            onClick={() => onClick(9)}
            index={9}
          />
          <Card
            card={cards[10]}
            isOpen={isOpen(cards, 6, 7)}
            remove={!cards[10].visible}
            onClick={() => onClick(10)}
            index={10}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[11]}
            isOpen={isOpen(cards, 8, 9)}
            remove={!cards[11].visible}
            onClick={() => onClick(11)}
            index={11}
          />
          <Card
            card={cards[12]}
            isOpen={isOpen(cards, 9, 10)}
            remove={!cards[12].visible}
            onClick={() => onClick(12)}
            index={12}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[13]}
            isOpen={isOpen(cards, 11, 12)}
            remove={!cards[13].visible}
            onClick={() => onClick(13)}
            index={13}
          />
        </View>
      </View>

      {/* RIGHT TOWER */}
      <View style={styles.tower}>
        <View style={styles.row}>
          <Card
            card={cards[16]}
            isOpen={true}
            remove={!cards[16].visible}
            onClick={() => onClick(16)}
            index={16}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[14]}
            isOpen={isOpen(cards, 16)}
            remove={!cards[14].visible}
            onClick={() => onClick(14)}
            index={14}
          />
          <Card
            card={cards[17]}
            isOpen={isOpen(cards, 16)}
            remove={!cards[17].visible}
            onClick={() => onClick(17)}
            index={17}
          />
        </View>
        <View style={[styles.row, styles.overlapUp]}>
          <Card
            card={cards[15]}
            isOpen={true}
            remove={!cards[15].visible}
            onClick={() => onClick(15)}
            index={15}
          />
        </View>
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tower: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  pyramid: {
    alignItems: "center",
    marginHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 2,
  },
  overlapUp: {
    marginTop: -14,
  },
})

export default Layout1
