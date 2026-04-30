import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout1Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 1 — "Battlements" (29 cards)
 *
 * LEFT TOWER (5):    PAIR:   BRIDGE (10):         PAIR:   RIGHT TOWER (5):
 *  [0][1][2]         [20]   [10][11][12][13]      [22]     [5][6][7]
 *   [3][4]           [21]    [14][15][16]         [23]      [8][9]
 *                              [17][18]
 *                               [19]
 *
 * BASE ROW: [24][25][26][27][28]  — 5 OPEN
 */

const Layout1 = React.memo(
  ({
    cards,
    onClick,
    hintedIndices = new Set(),
    bountyIndices = new Set(),
  }: ILayout1Props) => {
    if (cards.length < 29) return null

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
          {/* Left tower — 3 on 2 */}
          <View style={styles.tower}>
            <View style={styles.towerInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 3))}
                  {C(1, isOpen(cards, 3, 4))}
                  {C(2, isOpen(cards, 4))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 46 }]}>
                <View style={styles.row}>
                  {C(3, true)}
                  {C(4, true)}
                </View>
              </View>
            </View>
          </View>

          {/* Left pair */}
          <View style={styles.singlePair}>
            <View style={styles.pairInner}>
              <View style={[styles.absRow, { top: 8 }]}>
                <View style={styles.row}>{C(20, isOpen(cards, 21))}</View>
              </View>
              <View style={[styles.absRow, { top: 52 }]}>
                <View style={styles.row}>{C(21, true)}</View>
              </View>
            </View>
          </View>

          {/* Center bridge — rows spaced further apart to prevent overlap */}
          <View style={styles.bridge}>
            <View style={styles.bridgeInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(10, isOpen(cards, 14))}
                  {C(11, isOpen(cards, 14, 15))}
                  {C(12, isOpen(cards, 15, 16))}
                  {C(13, isOpen(cards, 16))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 40 }]}>
                <View style={styles.row}>
                  {C(14, isOpen(cards, 17))}
                  {C(15, isOpen(cards, 17, 18))}
                  {C(16, isOpen(cards, 18))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 80 }]}>
                <View style={styles.row}>
                  {C(17, isOpen(cards, 19))}
                  {C(18, isOpen(cards, 19))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 120 }]}>
                <View style={styles.row}>{C(19, true)}</View>
              </View>
            </View>
          </View>

          {/* Right pair */}
          <View style={styles.singlePair}>
            <View style={styles.pairInner}>
              <View style={[styles.absRow, { top: 8 }]}>
                <View style={styles.row}>{C(22, isOpen(cards, 23))}</View>
              </View>
              <View style={[styles.absRow, { top: 52 }]}>
                <View style={styles.row}>{C(23, true)}</View>
              </View>
            </View>
          </View>

          {/* Right tower — 3 on 2 */}
          <View style={styles.tower}>
            <View style={styles.towerInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(5, isOpen(cards, 8))}
                  {C(6, isOpen(cards, 8, 9))}
                  {C(7, isOpen(cards, 9))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 46 }]}>
                <View style={styles.row}>
                  {C(8, true)}
                  {C(9, true)}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* BASE ROW — 5 cards */}
        <View style={styles.baseRow}>
          {C(24, true)}
          {C(25, true)}
          {C(26, true)}
          {C(27, true)}
          {C(28, true)}
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
  tower: { width: "20%", alignItems: "center" },
  towerInner: { height: 100, width: "100%", alignItems: "center" },
  singlePair: { width: "8%", alignItems: "center" },
  pairInner: { height: 100, width: "100%", alignItems: "center" },
  bridge: { width: "36%", alignItems: "center" },
  bridgeInner: { height: 160, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout1
