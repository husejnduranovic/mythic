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
 * The classic tri-peaks board itself — the game's namesake, saved for last.
 * The campaign ends by summiting the Mythic Peaks.
 *
 *      [0]         [1]         [2]        the three summits
 *    [3][4]      [5][6]      [7][8]       shoulders
 *   [9][10][11][12][13][14][15][16][17]   slopes — the fused row
 *  [18][19][20][21][22][23][24][25][26][27]  foothills — 10 OPEN
 *
 * Blocking (machine-verified clearable + mirror-isomorphic):
 *   summits:    0←3,4  1←5,6  2←7,8
 *   shoulders:  3←9,10  4←10,11  5←12,13  6←13,14  7←15,16  8←16,17
 *   slopes:     9←18,19  10←19,20  11←20,21  12←21,22  13←22,23
 *               14←23,24  15←24,25  16←25,26  17←26,27
 *
 * No structure in the set works like this: ten contiguous open cards — the
 * widest chain freedom in the game, exactly what the 4.0× banner hunt wants —
 * and a true radiating web: every foothill clear advances TWO slopes, every
 * slope TWO shoulders. Three summit pops are the three-front climax; the
 * run's last card is a summit.
 *
 * Strategy: pure aggression pays here like nowhere else. With ten entries a
 * long chain is always live — the finale is greed management: ride the chain
 * toward 100×, route it through the bounties, and time the summits so the
 * board ends on a banner.
 */

// Classic tri-peaks geometry in half-card units: summits sit two cards apart,
// shoulder pairs one card apart, each row bricked exactly over the next.
const U = Math.round(CARD_W / 2)

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
          {/* deepest first — summits, then down the mountain */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, isOpen(cards, 3, 4))}
              <View style={{ width: 4 * U }} />
              {C(1, isOpen(cards, 5, 6))}
              <View style={{ width: 4 * U }} />
              {C(2, isOpen(cards, 7, 8))}
            </View>
          </View>

          <View style={[styles.absRow, { top: 34 }]}>
            <View style={styles.row}>
              {C(3, isOpen(cards, 9, 10))}
              {C(4, isOpen(cards, 10, 11))}
              <View style={{ width: 2 * U }} />
              {C(5, isOpen(cards, 12, 13))}
              {C(6, isOpen(cards, 13, 14))}
              <View style={{ width: 2 * U }} />
              {C(7, isOpen(cards, 15, 16))}
              {C(8, isOpen(cards, 16, 17))}
            </View>
          </View>

          <View style={[styles.absRow, { top: 68 }]}>
            <View style={styles.row}>
              {C(9, isOpen(cards, 18, 19))}
              {C(10, isOpen(cards, 19, 20))}
              {C(11, isOpen(cards, 20, 21))}
              {C(12, isOpen(cards, 21, 22))}
              {C(13, isOpen(cards, 22, 23))}
              {C(14, isOpen(cards, 23, 24))}
              {C(15, isOpen(cards, 24, 25))}
              {C(16, isOpen(cards, 25, 26))}
              {C(17, isOpen(cards, 26, 27))}
            </View>
          </View>

          {/* foothills — the widest opening in the game */}
          <View style={[styles.absRow, { top: 102 }]}>
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
    height: 102 + CARD_H,
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
