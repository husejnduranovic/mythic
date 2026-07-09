import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_W, CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayoutPeaksProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 13 — "The Mythic Peaks" (28 cards) — level 7 (4.0×), the finale
 *
 * The namesake range, reworked 2026-07-09: the first cut was the flat classic
 * tri-peaks board (depth 4, the set's lowest burst rate, no late drama) and
 * the owner playtest read it as an anticlimax. The rework raises the range —
 * a fourth act above the summits.
 *
 *                  [0]                     THE APEX — over the center summit,
 *        [1]       [2]       [3]           blocked by ALL THREE summits: the
 *      [4]   [5] [6] [7] [8]   [9]         run's last climb is the namesake
 *   [10][11][12][13]   [14][15][16][17]    slopes — split by THE VALLEY
 *  [18][19][20][21][22][23][24][25][26][27]   base — 10 OPEN, the widest
 *
 * Blocking (machine-verified clearable + mirror-isomorphic):
 *   apex:      0←1,2,3 — summit all three peaks, then crown the run
 *   summits:   1←4,5   2←6,7   3←8,9
 *   shoulders: west/east peaks are binary trees (4←10,11  5←12,13  8←14,15
 *              9←16,17); the CENTER pair 6,7 BOTH hang on the valley-edge
 *              slopes 13,14 — when the valley cracks, both pop at once
 *   slopes:    bricked over the base with the center seam SKIPPED (the
 *              valley). Corner breaches at the range ends and the pass:
 *              10←19  13←21  14←24  17←26 fall with ONE base card; the
 *              center bricks stay double (11←19,20  12←20,21  15←24,25
 *              16←25,26). Base corners 18/27 + valley pair 22/23 = free fuel.
 *
 * Ten contiguous opens (the widest chain freedom in the game — the 4.0×
 * banner hunt), first-5 2.6 AND last-5 2.6: the only board that opens lively
 * and STILL climaxes latest. Depth 5, maxBurst 3.
 *
 * Strategy: pure aggression pays here like nowhere else — but the finale now
 * has a shape: breach the ends and the pass, crack the valley for the double
 * shoulder pop, take the summits three-front, and end the campaign standing
 * on the apex. Time it so the last card lands on a banner.
 */

// All geometry in card units. A card's rendered footprint is CARD_W+4
// (2px margins) and rows add a 2px gap, so adjacent centers sit one PITCH
// apart; a spacer of span(cols) puts its neighbors cols·PITCH apart.
const V = Math.round(CARD_H * 0.46)
const PITCH = CARD_W + 6
const span = (cols: number) => Math.round(cols * PITCH) - (CARD_W + 8)

const LayoutPeaks = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutPeaksProps) => {
    if (cards.length < 28) return null

    const C = (i: number, open: boolean) => (
      <Card
        card={cards[i]}
        isOpen={open}
        remove={!cards[i].visible}
        onClick={() => onClick(i)}
        bounty={bountyIndices?.has(i)}
      />
    )

    return (
      <View style={styles.container}>
        <View style={styles.range}>
          {/* deepest first — the apex, then down the mountain */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>{C(0, isOpen(cards, 1, 2, 3))}</View>
          </View>

          {/* summits */}
          <View style={[styles.absRow, { top: V }]}>
            <View style={styles.row}>
              {C(1, isOpen(cards, 4, 5))}
              <View style={{ width: span(2.5) }} />
              {C(2, isOpen(cards, 6, 7))}
              <View style={{ width: span(2.5) }} />
              {C(3, isOpen(cards, 8, 9))}
            </View>
          </View>

          {/* shoulders — the center pair bridges the valley */}
          <View style={[styles.absRow, { top: V * 2 }]}>
            <View style={styles.row}>
              {C(4, isOpen(cards, 10, 11))}
              <View style={{ width: span(2) }} />
              {C(5, isOpen(cards, 12, 13))}
              {C(6, isOpen(cards, 13, 14))}
              {C(7, isOpen(cards, 13, 14))}
              {C(8, isOpen(cards, 14, 15))}
              <View style={{ width: span(2) }} />
              {C(9, isOpen(cards, 16, 17))}
            </View>
          </View>

          {/* slopes — west face, THE VALLEY, east face */}
          <View style={[styles.absRow, { top: V * 3 }]}>
            <View style={styles.row}>
              {C(10, isOpen(cards, 19))}
              {C(11, isOpen(cards, 19, 20))}
              {C(12, isOpen(cards, 20, 21))}
              {C(13, isOpen(cards, 21))}
              <View style={{ width: span(2) }} />
              {C(14, isOpen(cards, 24))}
              {C(15, isOpen(cards, 24, 25))}
              {C(16, isOpen(cards, 25, 26))}
              {C(17, isOpen(cards, 26))}
            </View>
          </View>

          {/* base — the widest opening in the game */}
          <View style={[styles.absRow, { top: V * 4 }]}>
            <View style={styles.row}>
              {C(18, true)}
              {C(19, true)}
              {C(20, true)}
              {C(21, true)}
              {C(22, true)}
              {C(23, true)}
              {C(24, true)}
              {C(25, true)}
              {C(26, true)}
              {C(27, true)}
            </View>
          </View>
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  range: {
    width: "100%",
    height: V * 4 + CARD_H,
  },
  absRow: {
    position: "absolute",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 2,
  },
})

export default LayoutPeaks
