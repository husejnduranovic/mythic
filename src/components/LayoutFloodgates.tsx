import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_W, CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayoutFloodgatesProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 12 — "The Floodgates" (30 cards) — level 3 (2.0×)
 *
 * Water held high, released through three gates. Replaces The Hourglass
 * (2026-07-09 owner playtest): its Last Grain — ONE card holding the entire
 * bottom half behind seven specific clears — stalled whole runs when the
 * deck refused that one rank. Same flow-downward identity, no global choke.
 *
 *    [0][1][2][3][4][5][6][7]       the reservoir — 8 OPEN
 *     [8][9][10][11][12][13][14]    the dam — brick courses
 *        [15]    [16]    [17]       THREE GATES: cheap center sluice (←11),
 *      [18][19][20][21][22][23]     heavy side gates (←two stones); each
 *       [24][25][26][27][28]        gate releases its own fall; the falls
 *              [29]                 merge into the base sheet — and the
 *                                   PLUNGE POOL waits under the merge
 *
 * Blocking (machine-verified clearable + mirror-isomorphic):
 *   dam:    8←1 (corner breach — one tap reveals from move 1)  9←1,2
 *           10←2,3  11←3,4  12←4,5  13←5,6  14←6 — reservoir corners 0/7
 *           guard nothing and pool as late fuel
 *   gates:  15←9,10 (west)  16←11 (the sluice — one stone)  17←12,13 (east)
 *   falls:  18,19←15 · 20,21←16 · 22,23←17 — every gate pops its PAIR
 *   base:   24←18,19  25←19,20  26←20,21  27←21,22  28←22,23 (the merge)
 *   pool:   29←26 — the deepest card in the game, under the center merge
 *
 * Dead taps 48% / burst 21.7% (both best-in-set), depth 6, and the opening
 * lives (first-5 2.6, was 2.2). The routing decision is WHICH gate: the
 * sluice opens fast but pays shallow; a side gate costs two stones and
 * cascades wider; any one gate un-dams a third of the bottom — no wall.
 *
 * Strategy: breach the dam corners early, pick your gate while the chain is
 * alive, and ride its fall into the merge — the pool under the center is
 * where the deep banners live. A Free Draw bridges a dying chain AT a gate.
 */

// All geometry in card units so every device keeps the shape.
const V = Math.round(CARD_H * 0.46) // vertical band step
const U = Math.round(CARD_W / 2) // half-card spacer

const LayoutFloodgates = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutFloodgatesProps) => {
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
        <View style={styles.weir}>
          {/* deepest first — the pool, then up the water */}
          <View style={[styles.absRow, { top: V * 5 }]}>
            <View style={styles.row}>{C(29, isOpen(cards, 26))}</View>
          </View>

          {/* the base sheet — five wide merge */}
          <View style={[styles.absRow, { top: V * 4 }]}>
            <View style={styles.row}>
              {C(24, isOpen(cards, 18, 19))}
              {C(25, isOpen(cards, 19, 20))}
              {C(26, isOpen(cards, 20, 21))}
              {C(27, isOpen(cards, 21, 22))}
              {C(28, isOpen(cards, 22, 23))}
            </View>
          </View>

          {/* the falls — three pairs, one sheet */}
          <View style={[styles.absRow, { top: V * 3 }]}>
            <View style={styles.row}>
              {C(18, isOpen(cards, 15))}
              {C(19, isOpen(cards, 15))}
              {C(20, isOpen(cards, 16))}
              {C(21, isOpen(cards, 16))}
              {C(22, isOpen(cards, 17))}
              {C(23, isOpen(cards, 17))}
            </View>
          </View>

          {/* THE THREE GATES */}
          <View style={[styles.absRow, { top: V * 2 }]}>
            <View style={styles.row}>
              {C(15, isOpen(cards, 9, 10))}
              <View style={{ width: U }} />
              {C(16, isOpen(cards, 11))}
              <View style={{ width: U }} />
              {C(17, isOpen(cards, 12, 13))}
            </View>
          </View>

          {/* the dam — brick courses under the reservoir */}
          <View style={[styles.absRow, { top: V }]}>
            <View style={styles.row}>
              {C(8, isOpen(cards, 1))}
              {C(9, isOpen(cards, 1, 2))}
              {C(10, isOpen(cards, 2, 3))}
              {C(11, isOpen(cards, 3, 4))}
              {C(12, isOpen(cards, 4, 5))}
              {C(13, isOpen(cards, 5, 6))}
              {C(14, isOpen(cards, 6))}
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
  weir: {
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

export default LayoutFloodgates
