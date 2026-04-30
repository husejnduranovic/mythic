import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout3Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  bountyIndices?: Set<number>
}

/**
 * Layout 3 — "Fortress" (36 cards)
 *
 * LEFT TOWER (12 cards, straight column blocking):
 *   [0] [1] [2]      ← [0]←[3]  [1]←[4]  [2]←[5]
 *   [3] [4] [5]      ← [3]←[6]  [4]←[7]  [5]←[8]
 *   [6] [7] [8]      ← [6]←[9]  [7]←[10] [8]←[11]
 *   [9] [10] [11]    ← OPEN
 *
 * BRIDGE (12 cards, 1-to-1 blocking):
 *   [12][13][14][15][16][17]  ← each blocked by card directly below
 *   [18][19][20][21][22][23]  ← OPEN
 *
 *   [12]←[18]  [13]←[19]  [14]←[20]
 *   [15]←[21]  [16]←[22]  [17]←[23]
 *
 * RIGHT TOWER (12 cards, mirror of left):
 *   [24][25][26]  [27][28][29]  [30][31][32]  [33][34][35]←OPEN
 */

const isCleared = (cards: ICard[], ...i: number[]) =>
  i.every((x) => !cards[x]?.visible)

const Layout3 = React.memo(
  ({
    cards,
    onClick,
    hintedIndices = new Set(),
    bountyIndices = new Set(),
  }: ILayout3Props) => {
    if (cards.length < 36) return null

    const C = (i: number, open: boolean) => (
      <Card
        card={cards[i]}
        isOpen={open}
        remove={!cards[i].visible}
        onClick={() => onClick(i)}
        hinted={hintedIndices.has(i)}
        bounty={bountyIndices?.has(i)}
      />
    )

    return (
      <View style={styles.container}>
        {/* LEFT TOWER */}
        <View style={styles.tower}>
          <View style={styles.inner}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(0, isCleared(cards, 3))}
                {C(1, isCleared(cards, 4))}
                {C(2, isCleared(cards, 5))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 50 }]}>
              <View style={styles.row}>
                {C(3, isCleared(cards, 6))}
                {C(4, isCleared(cards, 7))}
                {C(5, isCleared(cards, 8))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 100 }]}>
              <View style={styles.row}>
                {C(6, isCleared(cards, 9))}
                {C(7, isCleared(cards, 10))}
                {C(8, isCleared(cards, 11))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 150 }]}>
              <View style={styles.row}>
                {C(9, cards[9].visible)}
                {C(10, cards[10].visible)}
                {C(11, cards[11].visible)}
              </View>
            </View>
          </View>
        </View>

        {/* BRIDGE — 1-to-1 blocking */}
        <View style={styles.bridge}>
          <View style={styles.inner}>
            <View style={[styles.absRow, { top: 60 }]}>
              <View style={styles.row}>
                {C(12, isCleared(cards, 18))}
                {C(13, isCleared(cards, 19))}
                {C(14, isCleared(cards, 20))}
                {C(15, isCleared(cards, 21))}
                {C(16, isCleared(cards, 22))}
                {C(17, isCleared(cards, 23))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 110 }]}>
              <View style={styles.row}>
                {C(18, cards[18].visible)}
                {C(19, cards[19].visible)}
                {C(20, cards[20].visible)}
                {C(21, cards[21].visible)}
                {C(22, cards[22].visible)}
                {C(23, cards[23].visible)}
              </View>
            </View>
          </View>
        </View>

        {/* RIGHT TOWER */}
        <View style={styles.tower}>
          <View style={styles.inner}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(24, isCleared(cards, 27))}
                {C(25, isCleared(cards, 28))}
                {C(26, isCleared(cards, 29))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 50 }]}>
              <View style={styles.row}>
                {C(27, isCleared(cards, 30))}
                {C(28, isCleared(cards, 31))}
                {C(29, isCleared(cards, 32))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 100 }]}>
              <View style={styles.row}>
                {C(30, isCleared(cards, 33))}
                {C(31, isCleared(cards, 34))}
                {C(32, isCleared(cards, 35))}
              </View>
            </View>
            <View style={[styles.absRow, { top: 150 }]}>
              <View style={styles.row}>
                {C(33, cards[33].visible)}
                {C(34, cards[34].visible)}
                {C(35, cards[35].visible)}
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 30,
  },
  tower: { width: "22%" },
  bridge: { flex: 1, paddingHorizontal: 2 },
  inner: { flex: 1, alignItems: "center", justifyContent: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
})

export default Layout3
