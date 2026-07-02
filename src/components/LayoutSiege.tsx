import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_W, CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayoutSiegeProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 11 — "The Siege" (32 cards) — level 2 (1.5×)
 *
 * A castle seen from above. Replaces Cross of Clans, which failed the layout
 * audit (75% dead taps, an opening that reveals 0.8 cards in five moves, four
 * identical clusters with zero shared covers — scripts/verify-layouts.js).
 *
 *                 [0][1][2][3][4]           outer wall — north arc
 *          [21] [16][17][18][19] [20]       inner wall + posterns
 *       [8]          [26]            [5]    the north gatehouse
 *       [9]     [28][30][31][29]     [6]    halls + the twin hearts
 *       [10]         [27]            [7]    the south gatehouse
 *              [22][23][24][25]             inner wall — south arc
 *                 [11][12][13][14][15]      outer wall — south arc
 *
 * Blocking (machine-verified clearable + mirror-isomorphic — the graph is
 * double-symmetric, left-right AND north-south):
 *   outer arcs:  guards 0,2,4 / 11,13,15 OPEN; pockets 1←0,2  3←2,4
 *                12←11,13  14←13,15 — two adjacent guards free the pocket
 *   flanks:      5,6,7 / 8,9,10 all OPEN
 *   inner wall:  16←0,1  17←1,2  18←2,3  19←3,4 (each stone under TWO outer
 *                stones — one tap advances up to four different cards)
 *                22←11,12  23←12,13  24←13,14  25←14,15
 *   posterns:    20←6  21←9 — side doors, open when the flank's center falls
 *   the keep:    gates 26←17,18  27←23,24, then twin-keystone pops:
 *                halls 28,29 ← both gates (the second gate opens BOTH halls)
 *                hearts 30,31 ← both halls (the second hall opens BOTH hearts)
 *
 * 12 open at start — ties Battlements for the most generous opening — and the
 * only board in the set whose reveals RISE toward the end (last-5 taps reveal
 * 3.4 cards vs 1.4–1.8 everywhere else): walls fall stone by stone, then the
 * keep collapses pop-pop-pop.
 *
 * Strategy: choose WHERE to breach (pockets reward planned adjacency), which
 * DIRECTION around the ring, and time the chain to still be alive when the
 * keep cracks — the hearts are where the late banners live.
 */

// Ring geometry. Vertically mirrored around y=78; deeper cards render first
// so every blocker visually covers what it blocks.
const RING_W = Math.round(CARD_W * 9.4)
const U = Math.round(CARD_W / 2)

const LayoutSiege = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutSiegeProps) => {
    if (cards.length < 32) return null

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
        <View style={styles.ring}>
          {/* the keep — deepest first: hearts+halls, then the gatehouses */}
          <View style={[styles.absRow, { top: 78 }]}>
            <View style={styles.row}>
              {C(28, isOpen(cards, 26, 27))}
              {C(30, isOpen(cards, 28, 29))}
              {C(31, isOpen(cards, 28, 29))}
              {C(29, isOpen(cards, 26, 27))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 50 }]}>
            <View style={styles.row}>{C(26, isOpen(cards, 17, 18))}</View>
          </View>
          <View style={[styles.absRow, { top: 106 }]}>
            <View style={styles.row}>{C(27, isOpen(cards, 23, 24))}</View>
          </View>

          {/* inner wall — north arc + posterns, south arc */}
          <View style={[styles.absRow, { top: 30 }]}>
            <View style={styles.row}>
              {C(21, isOpen(cards, 9))}
              <View style={{ width: U }} />
              {C(16, isOpen(cards, 0, 1))}
              {C(17, isOpen(cards, 1, 2))}
              {C(18, isOpen(cards, 2, 3))}
              {C(19, isOpen(cards, 3, 4))}
              <View style={{ width: U }} />
              {C(20, isOpen(cards, 6))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 126 }]}>
            <View style={styles.row}>
              {C(22, isOpen(cards, 11, 12))}
              {C(23, isOpen(cards, 12, 13))}
              {C(24, isOpen(cards, 13, 14))}
              {C(25, isOpen(cards, 14, 15))}
            </View>
          </View>

          {/* outer wall — arcs on top of the inner wall */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, true)}
              {C(1, isOpen(cards, 0, 2))}
              {C(2, true)}
              {C(3, isOpen(cards, 2, 4))}
              {C(4, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: 156 }]}>
            <View style={styles.row}>
              {C(11, true)}
              {C(12, isOpen(cards, 11, 13))}
              {C(13, true)}
              {C(14, isOpen(cards, 13, 15))}
              {C(15, true)}
            </View>
          </View>

          {/* flanks — the ring bulges at the equator */}
          <View style={[styles.absRow, { top: 44 }]}>
            <View style={styles.edges}>
              {C(8, true)}
              {C(5, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: 78 }]}>
            <View style={styles.edges}>
              {C(9, true)}
              {C(6, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: 112 }]}>
            <View style={styles.edges}>
              {C(10, true)}
              {C(7, true)}
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
  ring: {
    width: RING_W,
    height: 156 + CARD_H,
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
  edges: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 2,
  },
})

export default LayoutSiege
