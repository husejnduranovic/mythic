import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout2Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 2 — "Throne Room" (30 cards)
 *
 * Three wide diamond formations, 3 rows each:
 *
 * LEFT (10):           CENTER (10):           RIGHT (10):
 *  [0] [1] [2]        [10][11][12][13]         [20][21][22]
 * [3][4][5][6]          [14][15][16]           [23][24][25][26]
 *  [7] [8] [9]          [17][18][19]            [27][28][29]
 *
 * LEFT blocking:
 * [0]←[3,4], [1]←[4,5], [2]←[5,6]
 * [3]←[7], [4]←[7,8], [5]←[8,9], [6]←[9]
 * [7],[8],[9] open
 *
 * CENTER blocking:
 * [10]←[14], [11]←[14,15], [12]←[15,16], [13]←[16]
 * [14]←[17,18], [15]←[18], [16]←[18,19]
 * [17],[18],[19] open
 *
 * RIGHT blocking (mirror of left):
 * [20]←[23,24], [21]←[24,25], [22]←[25,26]
 * [23]←[27], [24]←[27,28], [25]←[28,29], [26]←[29]
 * [27],[28],[29] open
 *
 * Open from start: 7,8,9,17,18,19,27,28,29 = 9 open cards
 */

const Layout2 = React.memo(
  ({ cards, onClick, hintedIndices = new Set() }: ILayout2Props) => {
    if (cards.length < 30) return null

    const C = (i: number, open: boolean) => (
      <Card
        card={cards[i]}
        isOpen={open}
        remove={!cards[i].visible}
        onClick={() => onClick(i)}
        hinted={hintedIndices.has(i)}
      />
    )

    return (
      <View style={styles.container}>
        {/* LEFT — diamond */}
        <View style={styles.section}>
          <View style={styles.row}>
            {C(0, isOpen(cards, 3, 4))}
            {C(1, isOpen(cards, 4, 5))}
            {C(2, isOpen(cards, 5, 6))}
          </View>
          <View style={[styles.row, styles.overlapUp]}>
            {C(3, isOpen(cards, 7))}
            {C(4, isOpen(cards, 7, 8))}
            {C(5, isOpen(cards, 8, 9))}
            {C(6, isOpen(cards, 9))}
          </View>
          <View style={[styles.row, styles.overlapUp]}>
            {C(7, true)}
            {C(8, true)}
            {C(9, true)}
          </View>
        </View>

        {/* CENTER — wide diamond */}
        <View style={styles.centerSection}>
          <View style={styles.row}>
            {C(10, isOpen(cards, 14))}
            {C(11, isOpen(cards, 14, 15))}
            {C(12, isOpen(cards, 15, 16))}
            {C(13, isOpen(cards, 16))}
          </View>
          <View style={[styles.row, styles.overlapUp]}>
            {C(14, isOpen(cards, 17, 18))}
            {C(15, isOpen(cards, 18))}
            {C(16, isOpen(cards, 18, 19))}
          </View>
          <View style={[styles.row, styles.overlapUp]}>
            {C(17, true)}
            {C(18, true)}
            {C(19, true)}
          </View>
        </View>

        {/* RIGHT — diamond mirror */}
        <View style={styles.section}>
          <View style={styles.row}>
            {C(20, isOpen(cards, 23, 24))}
            {C(21, isOpen(cards, 24, 25))}
            {C(22, isOpen(cards, 25, 26))}
          </View>
          <View style={[styles.row, styles.overlapUp]}>
            {C(23, isOpen(cards, 27))}
            {C(24, isOpen(cards, 27, 28))}
            {C(25, isOpen(cards, 28, 29))}
            {C(26, isOpen(cards, 29))}
          </View>
          <View style={[styles.row, styles.overlapUp]}>
            {C(27, true)}
            {C(28, true)}
            {C(29, true)}
          </View>
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  section: { alignItems: "center", marginHorizontal: 2 },
  centerSection: { alignItems: "center", marginHorizontal: 6 },
  row: { flexDirection: "row", justifyContent: "center", gap: 2 },
  overlapUp: { marginTop: -14 },
})

export default Layout2
