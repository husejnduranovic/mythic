import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_W, CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayoutPortcullisProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 14 — "The Portcullis" (30 cards) — level 3 (2.0×)
 *
 * The castle gate as interlocking jaws. Replaces The Floodgates (2026-07-10
 * owner verdict: Floodgates and the Peaks finale were the same funnel
 * silhouette, mirrored). Campaign beat: L2 you besiege the walls — L3 you
 * break the gate.
 *
 *   [0][1][2]   [3][4][5]   [6][7][8]    falling fangs — roots at the rail
 *     [9][10]    [11][12]    [13][14]    fang waists
 *      [15]  [16]  [17]  [18]  [19]      THE MEETING ROW (5 open)
 *        [20][21]      [22][23]          rising fangs — pairs off their tips
 *   [28]    [24]        [25]    [29]     hinge posts (open) pin the brackets
 *              [26][27]                  THE BAR — the gate falls as one beam
 *
 * Blocking (machine-verified clearable + mirror-isomorphic):
 *   waists: bricked ACROSS the meeting row — 9←15 · 10←15,16 · 11←16,17 ·
 *           12←17,18 · 13←18,19 · 14←19. The interlock: rising tips 16/18
 *           hold the falling waists on BOTH their sides. No other board
 *           bricks mid-board — every other course sits at a base or a rail.
 *   roots:  3-over-2 per fang (outer roots single — early reveals):
 *           0←9 · 1←9,10 · 2←10 · 3←11 · 4←11,12 · 5←12 · 6←13 · 7←13,14 · 8←14
 *   rising: each tip frees its pair — 20,21←16 · 22,23←18 (burst from move 1)
 *   lock:   THE TWO HINGES (2026-07-14 Task-3 rework — the old lock ran the
 *           brackets through the heart-stone at the TOP RAIL and the bar
 *           through posts at the meeting row's far edges: locked cards with
 *           no visible cover, then all four released at once). Now every
 *           dependency is local: a bracket tears free when its rising pair
 *           is out AND its own hinge post is pulled — 24←20,21,28 ·
 *           25←22,23,29 — and the bar drops only when BOTH brackets tear:
 *           26,27←24,25. The posts are open from move 1 (held fuel), so
 *           WHEN to spend each post is the endgame: each post is the key
 *           to its side's jaw.
 *
 * Feast-or-famine jaws: burst 24.5% and maxBurst 4 (both set-best),
 * first-5 5.1; the toll is dead taps on the fang roots (54%, high end of
 * the shipped set). One meeting-row tap can advance four cards: two waists
 * AND a rising pair. Depth 4; last-5 1.7 — the old 2.2 was the four-card
 * simultaneous collapse counting as a "climax"; the bar still lands last.
 *
 * Strategy: UNZIP THE INTERLOCK — order along the meeting row is the whole
 * game. A rising tip pays double (waists both sides + its own pair); the
 * hinge posts are fuel AND keys — spending one commits that jaw to tearing,
 * so hold the second post until the chain needs the bridge.
 */

// All geometry in card units so every device keeps the shape. A card's
// rendered footprint is CARD_W+4 (2px margins) and rows add a 2px gap, so
// adjacent centers sit one PITCH apart; span(cols) spaces its neighbors
// cols·PITCH apart.
const V = Math.round(CARD_H * 0.46)
const PITCH = CARD_W + 6
const span = (cols: number) => Math.round(cols * PITCH) - (CARD_W + 8)

const LayoutPortcullis = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutPortcullisProps) => {
    if (cards.length < 30) return null

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
        <View style={styles.gate}>
          {/* deepest first — the bar, then up through the lock */}
          <View style={[styles.absRow, { top: V * 5 }]}>
            <View style={styles.row}>
              {C(26, isOpen(cards, 24, 25))}
              {C(27, isOpen(cards, 24, 25))}
            </View>
          </View>

          {/* the jambs — hinge posts flanking the brackets they pin */}
          <View style={[styles.absRow, { top: V * 4 }]}>
            <View style={styles.row}>
              {C(28, true)}
              <View style={{ width: span(1.75) }} />
              {C(24, isOpen(cards, 20, 21, 28))}
              <View style={{ width: span(3.5) }} />
              {C(25, isOpen(cards, 22, 23, 29))}
              <View style={{ width: span(1.75) }} />
              {C(29, true)}
            </View>
          </View>

          {/* fang roots — three wedges hanging from the rail */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, isOpen(cards, 9))}
              {C(1, isOpen(cards, 9, 10))}
              {C(2, isOpen(cards, 10))}
              <View style={{ width: span(1.5) }} />
              {C(3, isOpen(cards, 11))}
              {C(4, isOpen(cards, 11, 12))}
              {C(5, isOpen(cards, 12))}
              <View style={{ width: span(1.5) }} />
              {C(6, isOpen(cards, 13))}
              {C(7, isOpen(cards, 13, 14))}
              {C(8, isOpen(cards, 14))}
            </View>
          </View>

          {/* fang waists */}
          <View style={[styles.absRow, { top: V }]}>
            <View style={styles.row}>
              {C(9, isOpen(cards, 15))}
              {C(10, isOpen(cards, 15, 16))}
              <View style={{ width: span(2.5) }} />
              {C(11, isOpen(cards, 16, 17))}
              {C(12, isOpen(cards, 17, 18))}
              <View style={{ width: span(2.5) }} />
              {C(13, isOpen(cards, 18, 19))}
              {C(14, isOpen(cards, 19))}
            </View>
          </View>

          {/* rising fangs — pairs off their tips */}
          <View style={[styles.absRow, { top: V * 3 }]}>
            <View style={styles.row}>
              {C(20, isOpen(cards, 16))}
              {C(21, isOpen(cards, 16))}
              <View style={{ width: span(2.5) }} />
              {C(22, isOpen(cards, 18))}
              {C(23, isOpen(cards, 18))}
            </View>
          </View>

          {/* THE MEETING ROW — falling tips and rising tips */}
          <View style={[styles.absRow, { top: V * 2 }]}>
            <View style={styles.row}>
              {C(15, true)}
              <View style={{ width: span(1.75) }} />
              {C(16, true)}
              <View style={{ width: span(1.75) }} />
              {C(17, true)}
              <View style={{ width: span(1.75) }} />
              {C(18, true)}
              <View style={{ width: span(1.75) }} />
              {C(19, true)}
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
  gate: {
    width: "100%",
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
})

export default LayoutPortcullis
