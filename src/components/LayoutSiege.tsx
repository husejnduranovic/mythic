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
 * A castle seen from above. 2026-07-09 rework (owner playtest): the old keep
 * was stacked between the walls and rendered as buried slivers — the twin
 * hearts, the level's climax, were nearly invisible — and the all-double
 * walls gave the slowest opening in the set (first-5: 1.5).
 *
 *                  [0][1][2][3][4]            outer wall — north arc
 *               [16]  [17][18]  [19]          inner wall (corner stones out)
 *   [8]                                [5]
 *   [9] [21]  [26][28][30][31][29][27]  [20] [6]   the courtyard: posterns,
 *   [10]      gate hall heart heart hall gate     [7]    gates, halls, HEARTS
 *               [22]  [23][24]  [25]          inner wall — south arc
 *                  [11][12][13][14][15]       outer wall — south arc
 *
 * Blocking (machine-verified clearable + mirror-isomorphic, L-R and N-S):
 *   outer arcs:  guards 0,2,4 / 11,13,15 OPEN; pockets under their CORNER
 *                guard alone — 1←0  3←4  12←11  14←15 (2026-07-14 easing:
 *                was two guards each; the center guards 2/13 are held fuel)
 *   flanks:      5,6,7 / 8,9,10 all OPEN
 *   inner wall:  CORNER BREACHES — the wall-end stones fall with their corner
 *                guard alone (16←0  19←4  22←11  25←15: one tap reveals from
 *                move 1); center stones under two (17←1,2  18←2,3  23←12,13
 *                24←13,14)
 *   posterns:    20←6  21←9 — side doors, open when the flank's center falls
 *   the keep:    one row standing clear in the courtyard, split into two
 *                INDEPENDENT flank chains (2026-07-14 endgame ease — the keep
 *                used to gate on BOTH walls at once and unwound single-file).
 *                West gate 26←16 (its TOP corner-breach alone) frees hall
 *                28←26 frees heart 30←28; east gate 27←19 → hall 29←27 →
 *                heart 31←29. Take a flank, take a heart.
 *
 * 12 open at start; first-5 3.9 with burst 13.3% (the 07-09 rework left the
 * opening at 2.9 / 11.5%; every corner guard is now a 2-card burst — its pocket
 * AND its breach stone fall with it). Dead taps 51%, inside the shipped 48–59%
 * band. The 2026-07-14 endgame ease pulled last-5 from 2.6 to 1.9 (into the
 * pack): the keep no longer waits on the whole ring, so the late reveals spread
 * instead of back-loading into a single-file wall. As the walls fall their
 * cards stop rendering, so the keep — half-buried behind masonry at the start
 * — stands fully revealed in the courtyard by the time it is playable: the
 * reveal IS the siege.
 *
 * Strategy: the four corner guards own the opening (two cards each); the
 * center guards are held fuel. The keep is now two independent flank chains —
 * take EITHER top corner and its gate → hall → heart run opens without waiting
 * on the far wall; the two heart pops are where the late banners live.
 */

// All geometry in card units so every device keeps the shape.
const V = Math.round(CARD_H * 0.46) // vertical band step
const U = Math.round(CARD_W / 2) // half-card spacer
const RING_W = Math.round(CARD_W * 12.6)
const EQUATOR = Math.round(V * 2.5)

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
          {/* the courtyard — deepest first: posterns, gates, halls, hearts */}
          <View style={[styles.absRow, { top: EQUATOR }]}>
            <View style={styles.row}>
              {C(21, isOpen(cards, 9))}
              <View style={{ width: U }} />
              {C(26, isOpen(cards, 16))}
              {C(28, isOpen(cards, 26))}
              {C(30, isOpen(cards, 28))}
              {C(31, isOpen(cards, 29))}
              {C(29, isOpen(cards, 27))}
              {C(27, isOpen(cards, 19))}
              <View style={{ width: U }} />
              {C(20, isOpen(cards, 6))}
            </View>
          </View>

          {/* inner wall — corner stones under their guards, centers bricked */}
          <View style={[styles.absRow, { top: V }]}>
            <View style={styles.row}>
              {C(16, isOpen(cards, 0))}
              <View style={{ width: U }} />
              {C(17, isOpen(cards, 1, 2))}
              {C(18, isOpen(cards, 2, 3))}
              <View style={{ width: U }} />
              {C(19, isOpen(cards, 4))}
            </View>
          </View>
          <View style={[styles.absRow, { top: V * 4 }]}>
            <View style={styles.row}>
              {C(22, isOpen(cards, 11))}
              <View style={{ width: U }} />
              {C(23, isOpen(cards, 12, 13))}
              {C(24, isOpen(cards, 13, 14))}
              <View style={{ width: U }} />
              {C(25, isOpen(cards, 15))}
            </View>
          </View>

          {/* outer wall — arcs on top of the inner courses */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, true)}
              {C(1, isOpen(cards, 0))}
              {C(2, true)}
              {C(3, isOpen(cards, 4))}
              {C(4, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: V * 5 }]}>
            <View style={styles.row}>
              {C(11, true)}
              {C(12, isOpen(cards, 11))}
              {C(13, true)}
              {C(14, isOpen(cards, 15))}
              {C(15, true)}
            </View>
          </View>

          {/* flanks — the ring bulges at the equator */}
          <View style={[styles.absRow, { top: EQUATOR - V }]}>
            <View style={styles.edges}>
              {C(8, true)}
              {C(5, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: EQUATOR }]}>
            <View style={styles.edges}>
              {C(9, true)}
              {C(6, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: EQUATOR + V }]}>
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
    height: V * 5 + CARD_H,
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
