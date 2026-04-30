import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout9Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  bountyIndices?: Set<number>
}

/**
 * Layout 9 — "Bunches" (32 cards)
 *
 * Three bunches — side bunches have 3 open base cards.
 * No dangling chains. More base cards.
 *
 * BUNCH 1 (left):     BUNCH 2 (center):      BUNCH 3 (right):
 *  [0][1][2]          [9][10][11][12]          [19][20][21]
 *   [3][4]             [13][14][15]             [22][23]
 *    [5]                [16][17]                  [24]
 *  [6][7][8]             [18]                 [25][26][27]
 *
 *               BASE: [28][29][30][31]
 *
 * BUNCH 1 (0-8):
 *   [0]←[3]  [1]←[3,4]  [2]←[4]
 *   [3]←[5]  [4]←[5]
 *   [5]←[6,7,8]     ← keystone: clear any combo of 6,7,8
 *   Actually: [5]←[6,7]  — blocked by left two open cards
 *   [6],[7],[8] = OPEN
 *
 * Wait — with 3 open cards below, blocking needs to make sense.
 * [5] sits centered above [6][7][8], so it's blocked by [7] (directly below)
 * But that's too easy — one card opens keystone.
 * Better: [5]←[6,7] — need to clear both left cards to open keystone
 * [8] is independent open card for matching.
 *
 * BUNCH 1 blocking:
 *   [0]←[3]  [1]←[3,4]  [2]←[4]
 *   [3]←[5]  [4]←[5]
 *   [5]←[6,7]
 *   [6],[7],[8] = OPEN
 *
 * BUNCH 2 (9-18, center):
 *   [9]←[13]  [10]←[13,14]  [11]←[14,15]  [12]←[15]
 *   [13]←[16]  [14]←[16,17]  [15]←[17]
 *   [16]←[18]  [17]←[18]
 *   [18] = OPEN
 *
 * BUNCH 3 (19-27, mirror of bunch 1):
 *   [19]←[22]  [20]←[22,23]  [21]←[23]
 *   [22]←[24]  [23]←[24]
 *   [24]←[25,26]
 *   [25],[26],[27] = OPEN
 *
 * BASE (28-31): 4 cards, all OPEN
 *
 * Open: 6,7,8,18,25,26,27,28,29,30,31 = 11 open cards
 *
 * Strategy:
 * - Side bunches: 3 open base cards give more matching options
 *   Clear [6]+[7] → keystone [5] opens → [3]+[4] open → top row cascades
 * - Center bunch: deepest (4 rows), single keystone [18]
 * - Three independent areas + base = always have options
 * - 32 cards = good length game
 */

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

const Layout9 = React.memo(
  ({
    cards,
    onClick,
    hintedIndices = new Set(),
    bountyIndices = new Set(),
  }: ILayout9Props) => {
    if (cards.length < 32) return null

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
          {/* Bunch 1 — left */}
          <View style={styles.bunch}>
            <View style={styles.bunchInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 3))}
                  {C(1, isOpen(cards, 3, 4))}
                  {C(2, isOpen(cards, 4))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 32 }]}>
                <View style={styles.row}>
                  {C(3, isOpen(cards, 5))}
                  {C(4, isOpen(cards, 5))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 64 }]}>
                <View style={styles.row}>{C(5, isOpen(cards, 6, 7))}</View>
              </View>
              <View style={[styles.absRow, { top: 96 }]}>
                <View style={styles.row}>
                  {C(6, true)}
                  {C(7, true)}
                  {C(8, true)}
                </View>
              </View>
            </View>
          </View>

          {/* Bunch 2 — center */}
          <View style={styles.bunchCenter}>
            <View style={styles.bunchCenterInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(9, isOpen(cards, 13))}
                  {C(10, isOpen(cards, 13, 14))}
                  {C(11, isOpen(cards, 14, 15))}
                  {C(12, isOpen(cards, 15))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 32 }]}>
                <View style={styles.row}>
                  {C(13, isOpen(cards, 16))}
                  {C(14, isOpen(cards, 16, 17))}
                  {C(15, isOpen(cards, 17))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 64 }]}>
                <View style={styles.row}>
                  {C(16, isOpen(cards, 18))}
                  {C(17, isOpen(cards, 18))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 96 }]}>
                <View style={styles.row}>{C(18, true)}</View>
              </View>
            </View>
          </View>

          {/* Bunch 3 — right (mirror) */}
          <View style={styles.bunch}>
            <View style={styles.bunchInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(19, isOpen(cards, 22))}
                  {C(20, isOpen(cards, 22, 23))}
                  {C(21, isOpen(cards, 23))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 32 }]}>
                <View style={styles.row}>
                  {C(22, isOpen(cards, 24))}
                  {C(23, isOpen(cards, 24))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 64 }]}>
                <View style={styles.row}>{C(24, isOpen(cards, 25, 26))}</View>
              </View>
              <View style={[styles.absRow, { top: 96 }]}>
                <View style={styles.row}>
                  {C(25, true)}
                  {C(26, true)}
                  {C(27, true)}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Base */}
        <View style={styles.baseRow}>
          {C(28, true)}
          {C(29, true)}
          {C(30, true)}
          {C(31, true)}
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    gap: 6,
  },
  bunch: { width: "28%", alignItems: "center" },
  bunchInner: { height: 140, width: "100%", alignItems: "center" },
  bunchCenter: { width: "34%", alignItems: "center" },
  bunchCenterInner: { height: 140, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout9
