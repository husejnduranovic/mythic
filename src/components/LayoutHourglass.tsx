import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayoutHourglassProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 12 — "The Hourglass" (30 cards) — SHELVED 2026-07-09
 *
 * Replaced by The Floodgates (LayoutFloodgates.tsx, same layout id) after the
 * owner playtest: the Last Grain — one card gating the entire bottom half —
 * stalled whole runs when the deck refused that one rank. Kept for reference
 * alongside the other shelved boards.
 *
 * Sand flows down. Replaces The Stronghold, which failed the layout audit:
 * its best moment was move 1 — the inverted pyramid NARROWS as you clear, so
 * the reveal rate decays all field long — and its archetype (two flanks +
 * central pyramid + open base) duplicated Battlements two levels earlier.
 *
 *     [0][1][2][3][4][5][6][7]      the reservoir — 8 OPEN
 *      [8][9][10][11][12][13][14]   the taper
 *              [15]                 THE LAST GRAIN — one card holds
 *            [16][17]               the entire bottom half
 *          [18][19][20]             the bloom — a widening fan,
 *        [21][22][23][24]           no tap down here is ever dead
 *      [25][26][27][28][29]
 *
 * Blocking (machine-verified clearable + mirror-isomorphic):
 *   taper:  8←0,1  9←1,2  10←2,3  11←3,4  12←4,5  13←5,6  14←6,7
 *           (brick — every reservoir clear advances two stones; the taper's
 *           edge stones 8/14 guard nothing and pool as late fuel)
 *   grain:  15←10,11,12 — the single waist card, the level's moment
 *   bloom:  16,17←15 (the grain pops TWO), then the fan widens —
 *           18←16 19←16,17 20←17 · 21←18 22←18,19 23←19,20 24←20 ·
 *           25←21 26←21,22 27←22,23 28←23,24 29←24
 *
 * The arc is the identity: abundance (8 choices) → the squeeze (reveals get
 * scarce approaching the waist — this is where a Free Draw bridges a dying
 * chain) → the grain pops → the bloom accelerates to a five-wide finish.
 * Lowest dead-tap share in the set (48%), best burst rate (21.8%), deepest
 * board in the game (7) — the climax arrives latest, and every clear below
 * the waist reveals something.
 *
 * Strategy: ration the reservoir so your chain is still alive AT the grain,
 * then ride the bloom — banners live in the wide rows at the bottom.
 */

const LayoutHourglass = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutHourglassProps) => {
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
        <View style={styles.glass}>
          {/* deepest first — each row is covered by the row above it */}
          {/* bloom — five wide */}
          <View style={[styles.absRow, { top: 172 }]}>
            <View style={styles.row}>
              {C(25, isOpen(cards, 21))}
              {C(26, isOpen(cards, 21, 22))}
              {C(27, isOpen(cards, 22, 23))}
              {C(28, isOpen(cards, 23, 24))}
              {C(29, isOpen(cards, 24))}
            </View>
          </View>
          {/* bloom — four */}
          <View style={[styles.absRow, { top: 144 }]}>
            <View style={styles.row}>
              {C(21, isOpen(cards, 18))}
              {C(22, isOpen(cards, 18, 19))}
              {C(23, isOpen(cards, 19, 20))}
              {C(24, isOpen(cards, 20))}
            </View>
          </View>
          {/* bloom — three */}
          <View style={[styles.absRow, { top: 116 }]}>
            <View style={styles.row}>
              {C(18, isOpen(cards, 16))}
              {C(19, isOpen(cards, 16, 17))}
              {C(20, isOpen(cards, 17))}
            </View>
          </View>
          {/* bloom — the pair the grain releases */}
          <View style={[styles.absRow, { top: 88 }]}>
            <View style={styles.row}>
              {C(16, isOpen(cards, 15))}
              {C(17, isOpen(cards, 15))}
            </View>
          </View>
          {/* THE LAST GRAIN */}
          <View style={[styles.absRow, { top: 58 }]}>
            <View style={styles.row}>{C(15, isOpen(cards, 10, 11, 12))}</View>
          </View>
          {/* the taper */}
          <View style={[styles.absRow, { top: 28 }]}>
            <View style={styles.row}>
              {C(8, isOpen(cards, 0, 1))}
              {C(9, isOpen(cards, 1, 2))}
              {C(10, isOpen(cards, 2, 3))}
              {C(11, isOpen(cards, 3, 4))}
              {C(12, isOpen(cards, 4, 5))}
              {C(13, isOpen(cards, 5, 6))}
              {C(14, isOpen(cards, 6, 7))}
            </View>
          </View>
          {/* the reservoir — 8 open */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, true)}
              {C(1, true)}
              {C(2, true)}
              {C(3, true)}
              {C(4, true)}
              {C(5, true)}
              {C(6, true)}
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
  glass: {
    width: "100%",
    height: 172 + CARD_H,
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

export default LayoutHourglass
