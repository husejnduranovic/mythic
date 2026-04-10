import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout1Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 1 — "Battlements" (30 cards)
 *
 * Cascade blocking — 1 card opens 2-3 above:
 *
 * LEFT TOWER (6):       BRIDGE (12):              RIGHT TOWER (6):
 * [0][1][2]          [12][13][14][15]             [6][7][8]
 *   [3]               [16][17][18]                  [9]
 *  [4][5]              [19][20]                   [10][11]
 *                       [21]
 *
 * BASE ROW: [22][23][24][25][26][27]  — all OPEN
 * PAIRS: [28]←[29], [29] open
 *
 * LEFT: [0]←[3], [1]←[3], [2]←[3]  ← clearing [3] opens THREE
 *       [3]←[4,5]
 *       [4],[5] open
 *
 * BRIDGE: [12]←[16], [13]←[16,17], [14]←[17,18], [15]←[18]
 *         [16]←[19], [17]←[19,20], [18]←[20]
 *         [19]←[21], [20]←[21]
 *         [21] open
 *
 * RIGHT: [6]←[9], [7]←[9], [8]←[9]  ← clearing [9] opens THREE
 *        [9]←[10,11]
 *        [10],[11] open
 *
 * Open: 4,5,10,11,21,22,23,24,25,26,27,29 = 12 open cards
 */

const Layout1 = React.memo(
  ({ cards, onClick, hintedIndices = new Set() }: ILayout1Props) => {
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
        <View style={styles.topSection}>
          {/* Left tower — cascade */}
          <View style={styles.tower}>
            <View style={styles.towerInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 3))}
                  {C(1, isOpen(cards, 3))}
                  {C(2, isOpen(cards, 3))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 50 }]}>
                <View style={styles.row}>{C(3, isOpen(cards, 4, 5))}</View>
              </View>
              <View style={[styles.absRow, { top: 100 }]}>
                <View style={styles.row}>
                  {C(4, true)}
                  {C(5, true)}
                </View>
              </View>
            </View>
          </View>

          {/* Left pair */}
          <View style={styles.singlePair}>
            <View style={styles.pairInner}>
              <View style={[styles.absRow, { top: 20 }]}>
                <View style={styles.row}>{C(28, isOpen(cards, 29))}</View>
              </View>
              <View style={[styles.absRow, { top: 66 }]}>
                <View style={styles.row}>{C(29, true)}</View>
              </View>
            </View>
          </View>

          {/* Center bridge */}
          <View style={styles.bridge}>
            <View style={styles.bridgeInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(12, isOpen(cards, 16))}
                  {C(13, isOpen(cards, 16, 17))}
                  {C(14, isOpen(cards, 17, 18))}
                  {C(15, isOpen(cards, 18))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 50 }]}>
                <View style={styles.row}>
                  {C(16, isOpen(cards, 19))}
                  {C(17, isOpen(cards, 19, 20))}
                  {C(18, isOpen(cards, 20))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 100 }]}>
                <View style={styles.row}>
                  {C(19, isOpen(cards, 21))}
                  {C(20, isOpen(cards, 21))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 140 }]}>
                <View style={styles.row}>{C(21, true)}</View>
              </View>
            </View>
          </View>

          {/* Right pair */}
          <View style={styles.singlePair}>
            <View style={styles.pairInner}>
              <View style={[styles.absRow, { top: 20 }]}>
                <View style={styles.row}>{C(22, isOpen(cards, 23))}</View>
              </View>
              <View style={[styles.absRow, { top: 66 }]}>
                <View style={styles.row}>{C(23, true)}</View>
              </View>
            </View>
          </View>

          {/* Right tower — cascade */}
          <View style={styles.tower}>
            <View style={styles.towerInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(6, isOpen(cards, 9))}
                  {C(7, isOpen(cards, 9))}
                  {C(8, isOpen(cards, 9))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 50 }]}>
                <View style={styles.row}>{C(9, isOpen(cards, 10, 11))}</View>
              </View>
              <View style={[styles.absRow, { top: 100 }]}>
                <View style={styles.row}>
                  {C(10, true)}
                  {C(11, true)}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* BASE ROW */}
        <View style={styles.baseRow}>
          {C(24, true)}
          {C(25, true)}
          {C(26, true)}
          {C(27, true)}
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: 4 },
  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    paddingTop: 4,
  },
  tower: { width: "18%", alignItems: "center" },
  towerInner: { height: 160, width: "100%", alignItems: "center" },
  singlePair: { width: "8%", alignItems: "center" },
  pairInner: { height: 120, width: "100%", alignItems: "center" },
  bridge: { width: "36%", alignItems: "center" },
  bridgeInner: { height: 180, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout1
