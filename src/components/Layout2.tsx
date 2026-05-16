import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout2Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 2 (30 cards)
 *
 * LEFT PILE (0-8):                CENTER WALL (18-25):     RIGHT PILE (9-17):
 *      [0]                          [18][19][20][21]            [9]
 *    [1][2]                          [22][23][24][25]         [10][11]
 *    [3][4]                                                   [12][13]
 *    [5][6]                                                   [14][15]
 *    [7][8]                                                   [16][17]
 *
 *                  BASE: [26][27][28][29]
 *
 * LEFT PILE:
 *   [0] OPEN
 *   [1,2,3,4] ← [0]   (upper 2x2 box blocked by top single)
 *   [5] ← [1]
 *   [6] ← [2]         (lower 2x2 box, column-direct from upper)
 *   [7] ← [3]
 *   [8] ← [4]
 *
 * RIGHT PILE (mirror):
 *   [9] OPEN
 *   [10,11,12,13] ← [9]
 *   [14] ← [10]
 *   [15] ← [11]
 *   [16] ← [12]
 *   [17] ← [13]
 *
 * CENTER WALL:
 *   [18] ← [22]   [19] ← [23]   [20] ← [24]   [21] ← [25]
 *   [22-25] OPEN
 *
 * BASE 26-29: all OPEN
 *
 * Open at start: 0, 9, 22, 23, 24, 25, 26, 27, 28, 29 = 10
 */

const Layout2 = React.memo(
  ({
    cards,
    onClick,
    hintedIndices = new Set(),
    bountyIndices = new Set(),
  }: ILayout2Props) => {
    if (cards.length < 30) return null

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
        <View style={styles.topSection}>
          {/* LEFT PILE — outer 2x2 wide, inner 2x2 squeezed in the middle overlapping outer corners */}
          <View style={styles.pile}>
            <View style={styles.pileInner}>
              {/* Top single — OPEN */}
              <View style={[styles.absRow, { top: 110 }]}>
                <View style={styles.row}>{C(0, true)}</View>
              </View>
              {/* Outer 2x2 — upper row, wide */}
              <View style={[styles.absRow, { top: 40 }]}>
                <View style={styles.outerRow}>
                  {C(1, isOpen(cards, 5))}
                  {C(2, isOpen(cards, 6))}
                </View>
              </View>
              {/* Inner 2x2 — upper row, squeezed in the middle, sits OVER outer corners */}
              <View style={[styles.absRow, { top: 70 }]}>
                <View style={styles.innerRow}>
                  {C(5, isOpen(cards, 0))}
                  {C(6, isOpen(cards, 0))}
                </View>
              </View>
              {/* Outer 2x2 — lower row, wide */}
              <View style={[styles.absRow, { top: 180 }]}>
                <View style={styles.outerRow}>
                  {C(3, isOpen(cards, 7))}
                  {C(4, isOpen(cards, 8))}
                </View>
              </View>
              {/* Inner 2x2 — lower row, squeezed in the middle */}
              <View style={[styles.absRow, { top: 140 }]}>
                <View style={styles.innerRow}>
                  {C(7, isOpen(cards, 0))}
                  {C(8, isOpen(cards, 0))}
                </View>
              </View>
            </View>
          </View>
          {/* CENTER WALL — 4 on 4 */}
          <View style={styles.wall}>
            <View style={styles.wallInner}>
              <View style={[styles.absRow, { top: -20 }]}>
                <View style={styles.row}>
                  {C(18, isOpen(cards, 22))}
                  {C(19, isOpen(cards, 23))}
                  {C(20, isOpen(cards, 24))}
                  {C(21, isOpen(cards, 25))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(22, true)}
                  {C(23, true)}
                  {C(24, true)}
                  {C(25, true)}
                </View>
              </View>
            </View>
          </View>

          {/* RIGHT PILE — mirror */}
          <View style={styles.pile}>
            <View style={styles.pileInner}>
              <View style={[styles.absRow, { top: 110 }]}>
                <View style={styles.row}>{C(9, true)}</View>
              </View>
              <View style={[styles.absRow, { top: 40 }]}>
                <View style={styles.outerRow}>
                  {C(10, isOpen(cards, 14))}
                  {C(11, isOpen(cards, 15))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 70 }]}>
                <View style={styles.innerRow}>
                  {C(14, isOpen(cards, 9))}
                  {C(15, isOpen(cards, 9))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 180 }]}>
                <View style={styles.outerRow}>
                  {C(12, isOpen(cards, 16))}
                  {C(13, isOpen(cards, 17))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 140 }]}>
                <View style={styles.innerRow}>
                  {C(16, isOpen(cards, 9))}
                  {C(17, isOpen(cards, 9))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* BASE */}
        <View style={styles.baseRow}>
          {C(26, true)}
          {C(27, true)}
          {C(28, true)}
          {C(29, true)}
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
  },
  pile: {
    width: "30%",
    alignItems: "center",
  },
  pileInner: {
    height: 460,
    width: "100%",
    alignItems: "center",
  },
  // 2x2 box row — two cards with a small gap between them
  boxRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  wall: {
    width: "32%",
    alignItems: "center",
    marginTop: 95,
  },
  wallInner: {
    height: 170,
    width: "100%",
    alignItems: "center",
  },
  absRow: {
    position: "absolute",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  baseRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 2,
  },
  // Outer row — wide, cards spread apart with a gap that inner cards will sit in
  outerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 60, // wide gap, inner cards sit here
  },
  // Inner row — squeezed in the middle, cards close together, overlaps outer corners
  innerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 22, // minimal gap between inner cards
    padding: 10,
  },
})

export default Layout2
