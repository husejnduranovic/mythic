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
 * Layout 2 — "War Council" (30 cards)
 *
 * Two wide side piles with cascade blocking, a small center stack,
 * and a base row. Multiple entry points — never stuck going one way.
 *
 * LEFT PILE (10):              CENTER (4):           RIGHT PILE (10):
 *  [0] [1] [2] [3]              [20]                [10][11][12][13]
 *   [4] [5] [6]                 [21]                 [14][15][16]
 *    [7] [8]                   [22]                   [17][18]
 *     [9]                      [23]                    [19]
 *
 * BASE ROW: [24][25][26][27][28][29] — all OPEN
 *
 * LEFT PILE blocking (wide pyramid):
 *   [0]←[4]  [1]←[4,5]  [2]←[5,6]  [3]←[6]
 *   [4]←[7]  [5]←[7,8]  [6]←[8]
 *   [7]←[9]  [8]←[9]
 *   [9] = OPEN  ← KEYSTONE: clearing 9 opens 7+8, then cascade up
 *
 * RIGHT PILE blocking (mirror):
 *   [10]←[14]  [11]←[14,15]  [12]←[15,16]  [13]←[16]
 *   [14]←[17]  [15]←[17,18]  [16]←[18]
 *   [17]←[19]  [18]←[19]
 *   [19] = OPEN  ← KEYSTONE: clearing 19 opens 17+18
 *
 * CENTER STACK (simple chain):
 *   [20]←[21]  [21]←[22]  [22]←[23]
 *   [23] = OPEN
 *
 * Open from start: 9, 19, 23, 24, 25, 26, 27, 28, 29 = 9 open cards
 *
 * Keystones: card 9 (left) and card 19 (right) — clearing either
 * opens 2 cards which each open more above. Full cascade potential.
 *
 * Multiple paths: attack left pile, right pile, center chain, or
 * base row — you always have options from different areas.
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
          {/* Left pile — wide pyramid */}
          <View style={styles.pile}>
            <View style={styles.pileInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 4))}
                  {C(1, isOpen(cards, 4, 5))}
                  {C(2, isOpen(cards, 5, 6))}
                  {C(3, isOpen(cards, 6))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 38 }]}>
                <View style={styles.row}>
                  {C(4, isOpen(cards, 7))}
                  {C(5, isOpen(cards, 7, 8))}
                  {C(6, isOpen(cards, 8))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 76 }]}>
                <View style={styles.row}>
                  {C(7, isOpen(cards, 9))}
                  {C(8, isOpen(cards, 9))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 114 }]}>
                <View style={styles.row}>{C(9, true)}</View>
              </View>
            </View>
          </View>

          {/* Center stack — simple chain */}
          <View style={styles.center}>
            <View style={styles.centerInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>{C(20, isOpen(cards, 21))}</View>
              </View>
              <View style={[styles.absRow, { top: 38 }]}>
                <View style={styles.row}>{C(21, isOpen(cards, 22))}</View>
              </View>
              <View style={[styles.absRow, { top: 76 }]}>
                <View style={styles.row}>{C(22, isOpen(cards, 23))}</View>
              </View>
              <View style={[styles.absRow, { top: 114 }]}>
                <View style={styles.row}>{C(23, true)}</View>
              </View>
            </View>
          </View>

          {/* Right pile — wide pyramid (mirror) */}
          <View style={styles.pile}>
            <View style={styles.pileInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(10, isOpen(cards, 14))}
                  {C(11, isOpen(cards, 14, 15))}
                  {C(12, isOpen(cards, 15, 16))}
                  {C(13, isOpen(cards, 16))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 38 }]}>
                <View style={styles.row}>
                  {C(14, isOpen(cards, 17))}
                  {C(15, isOpen(cards, 17, 18))}
                  {C(16, isOpen(cards, 18))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 76 }]}>
                <View style={styles.row}>
                  {C(17, isOpen(cards, 19))}
                  {C(18, isOpen(cards, 19))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 114 }]}>
                <View style={styles.row}>{C(19, true)}</View>
              </View>
            </View>
          </View>
        </View>

        {/* Base row — all open */}
        <View style={styles.baseRow}>
          {C(24, true)}
          {C(25, true)}
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
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: 4 },
  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    paddingTop: 4,
  },
  pile: { width: "35%", alignItems: "center" },
  pileInner: { height: 160, width: "100%", alignItems: "center" },
  center: { width: "14%", alignItems: "center" },
  centerInner: { height: 160, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout2
