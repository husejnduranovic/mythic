import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout4CProps {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  bountyIndices?: Set<number>
}

/**
 * Layout 4C — "Reverse Tripeaks" (36 cards)
 *
 * Three inverted pyramids — wide open tops cascading down to tips.
 * 36 cards for maximum combo potential.
 * Inspired by the Reverse Tripeaks reference.
 *
 * PEAK 1 (left):     PEAK 2 (center):      PEAK 3 (right):
 *  [0][1][2]         [12][13][14][15]        [24][25][26]
 *   [3][4]            [16][17][18]            [27][28]
 *    [5]               [19][20]                [29]
 *                       [21]
 *
 *   [6][7]            [22][23]              [30][31]
 *
 *              [8][9][10][11]  ← wings
 *                                [32][33][34][35]  ← wings
 *
 * Wait — let me simplify. Three clean inverted pyramids + shared base.
 *
 * PEAK 1 (0-5, inverted):
 *   [0][1][2]    ← OPEN (wide top)
 *    [3][4]      ← [3]←[0,1]  [4]←[1,2]
 *     [5]        ← [5]←[3,4]  — tip
 *
 * PEAK 2 (6-12, inverted, wider):
 *   [6][7][8][9]  ← OPEN (wide top)
 *    [10][11][12] ← [10]←[6,7]  [11]←[7,8]  [12]←[8,9]
 *     [13][14]    ← [13]←[10,11]  [14]←[11,12]
 *      [15]       ← [15]←[13,14]  — tip
 *
 * PEAK 3 (16-21, inverted, mirror of 1):
 *   [16][17][18]  ← OPEN (wide top)
 *    [19][20]     ← [19]←[16,17]  [20]←[17,18]
 *     [21]        ← [21]←[19,20]  — tip
 *
 * CONNECTORS (22-27):
 *   [22]←[5]   [23]←[5]      ← left tip opens two connectors
 *   [24]←[15]  [25]←[15]     ← center tip opens two connectors
 *   [26]←[21]  [27]←[21]     ← right tip opens two connectors
 *
 * BASE (28-35): 8 cards, all OPEN
 *
 * Open: 0,1,2,6,7,8,9,16,17,18,28,29,30,31,32,33,34,35 = 18 open cards
 *
 * Strategy:
 * - Three inverted pyramids with open tops — immediate action
 * - Cascading DOWN through shared blockers to tips
 * - Each tip is a keystone — clearing it opens TWO connector cards
 * - Center pyramid is deepest (4 rows) — hardest but most rewarding
 * - 36 cards total — longest layout, biggest combo potential
 * - 18 open cards = tons of matching options
 */

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

const Layout4C = React.memo(
  ({
    cards,
    onClick,
    hintedIndices = new Set(),
    bountyIndices = new Set(),
  }: ILayout4CProps) => {
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
        <View style={styles.topSection}>
          {/* Peak 1 — left inverted */}
          <View style={styles.peak}>
            <View style={styles.peakInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, true)}
                  {C(1, true)}
                  {C(2, true)}
                </View>
              </View>
              <View style={[styles.absRow, { top: 34 }]}>
                <View style={styles.row}>
                  {C(3, isOpen(cards, 0, 1))}
                  {C(4, isOpen(cards, 1, 2))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 68 }]}>
                <View style={styles.row}>{C(5, isOpen(cards, 3, 4))}</View>
              </View>
            </View>
          </View>

          {/* Peak 2 — center inverted (wider) */}
          <View style={styles.peakCenter}>
            <View style={styles.peakCenterInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(6, true)}
                  {C(7, true)}
                  {C(8, true)}
                  {C(9, true)}
                </View>
              </View>
              <View style={[styles.absRow, { top: 34 }]}>
                <View style={styles.row}>
                  {C(10, isOpen(cards, 6, 7))}
                  {C(11, isOpen(cards, 7, 8))}
                  {C(12, isOpen(cards, 8, 9))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 68 }]}>
                <View style={styles.row}>
                  {C(13, isOpen(cards, 10, 11))}
                  {C(14, isOpen(cards, 11, 12))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 102 }]}>
                <View style={styles.row}>{C(15, isOpen(cards, 13, 14))}</View>
              </View>
            </View>
          </View>

          {/* Peak 3 — right inverted */}
          <View style={styles.peak}>
            <View style={styles.peakInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(16, true)}
                  {C(17, true)}
                  {C(18, true)}
                </View>
              </View>
              <View style={[styles.absRow, { top: 34 }]}>
                <View style={styles.row}>
                  {C(19, isOpen(cards, 16, 17))}
                  {C(20, isOpen(cards, 17, 18))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 68 }]}>
                <View style={styles.row}>{C(21, isOpen(cards, 19, 20))}</View>
              </View>
            </View>
          </View>
        </View>

        {/* Connector row — opened by pyramid tips */}
        <View style={styles.connectorRow}>
          <View style={styles.connectorPair}>
            {C(22, isOpen(cards, 5))}
            {C(23, isOpen(cards, 5))}
          </View>
          <View style={styles.connectorPair}>
            {C(24, isOpen(cards, 15))}
            {C(25, isOpen(cards, 15))}
          </View>
          <View style={styles.connectorPair}>
            {C(26, isOpen(cards, 21))}
            {C(27, isOpen(cards, 21))}
          </View>
        </View>

        {/* Base row — 8 cards */}
        <View style={styles.baseRow}>
          {C(28, true)}
          {C(29, true)}
          {C(30, true)}
          {C(31, true)}
          {C(32, true)}
          {C(33, true)}
          {C(34, true)}
          {C(35, true)}
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
  peak: { width: "24%", alignItems: "center" },
  peakInner: { height: 110, width: "100%", alignItems: "center" },
  peakCenter: { width: "36%", alignItems: "center" },
  peakCenterInner: { height: 140, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  connectorRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: -6,
  },
  connectorPair: { flexDirection: "row", gap: 2 },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout4C
