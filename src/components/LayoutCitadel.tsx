import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayoutCitadelProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 10 — "The Citadel" (32 cards) — level 5 (3.0×)
 *
 * Mirror-symmetric successor to the (unshipped, asymmetric) Warfront — the
 * owner's constraint is symmetric shapes only, matching the rest of the set.
 * The Warfront's signature survives: THE BREACH, an escalating fan that WIDENS
 * as you climb (the inverse of the Stronghold's narrowing pyramid), now flanked
 * by two identical bastions. Still no base row (only Cross of Clans shares
 * that): every opening move is a structural choice.
 *
 *      LEFT BASTION          THE BREACH (center)         RIGHT BASTION
 *   [14]  [17][18][19]      [0][1][2][3][4]        [26][27][28]  [23]
 *   [15]   [20][21]          [5][6][7][8]           [29][30]     [24]
 *   [16]     [22]             [9][10][11]              [31]      [25]
 *                              [12][13]
 *
 * THE BREACH (14) — 2→3→4→5 escalating cascade, the set's biggest late bloom:
 *   [0]←[5]  [1]←[5,6]  [2]←[6,7]  [3]←[7,8]  [4]←[8]
 *   [5]←[9]  [6]←[9,10]  [7]←[10,11]  [8]←[11]
 *   [9]←[12]  [10]←[12,13]  [11]←[13]
 *   keystones [12],[13] OPEN
 *
 * BASTIONS (9 each, identical, mirrored) — three economies per side:
 *   supply chain (tempo):  [14]←[15]←[16 OPEN]      / [23]←[24]←[25 OPEN]
 *   tower (mid cascade):   [17]←[20]  [18]←[20,21]  / [26]←[29]  [27]←[29,30]
 *                          [19]←[21]  [20],[21] OPEN /[28]←[30]  [29],[30] OPEN
 *   picket (free tap):     [22 OPEN]                 / [31 OPEN]
 *
 * Open at start: 12,13,16,20,21,22,25,29,30,31 = 10 (band: Snake Eyes 9 –
 * Battlements 12; right for the 3.0× slot).
 *
 * Feel-gate evidence (GAMEPLAY §3.3 band 1.2–1.8 per cascade event): Breach
 * 2→3 (1.5), 3→4 (1.33), 4→5 (1.25); towers 2→3 (1.5). Supply chains are
 * deliberately flat 1:1 — six cards of fuel you ration to keep chains alive
 * between fan rows. Blocking graph machine-verified fully clearable.
 * OWNER PLAYTEST GATE — same judgment that picked the active six.
 *
 * Strategy: the board pays at the END — crack the keystones early and time
 * your chain so it's alive when the fan's wide rows open (where the banners
 * are). Fuel is finite; spend the pickets and supply to bridge, not to graze.
 */

const LayoutCitadel = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutCitadelProps) => {
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

    // One bastion — supply chain on the outer edge, tower inner, picket below.
    // `s` = supply base index (+0,+1,+2), `t` = tower base index (+0..+4),
    // `p` = picket index. mirrored=true puts the supply on the right edge.
    const Bastion = (s: number, t: number, p: number, mirrored: boolean) => (
      <View style={[styles.bastion, mirrored && styles.bastionMirror]}>
        <View style={styles.supplyCol}>
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>{C(s, isOpen(cards, s + 1))}</View>
          </View>
          <View style={[styles.absRow, { top: 36 }]}>
            <View style={styles.row}>{C(s + 1, isOpen(cards, s + 2))}</View>
          </View>
          <View style={[styles.absRow, { top: 72 }]}>
            <View style={styles.row}>{C(s + 2, true)}</View>
          </View>
        </View>
        <View style={styles.towerCol}>
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(t, isOpen(cards, t + 3))}
              {C(t + 1, isOpen(cards, t + 3, t + 4))}
              {C(t + 2, isOpen(cards, t + 4))}
            </View>
          </View>
          <View style={[styles.absRow, { top: 44 }]}>
            <View style={styles.row}>
              {C(t + 3, true)}
              {C(t + 4, true)}
            </View>
          </View>
          <View style={[styles.absRow, { top: 88 }]}>
            <View style={styles.row}>{C(p, true)}</View>
          </View>
        </View>
      </View>
    )

    return (
      <View style={styles.container}>
        <View style={styles.front}>
          {Bastion(14, 17, 22, false)}

          {/* THE BREACH — 5 over 4 over 3 over 2 keystones */}
          <View style={styles.breach}>
            <View style={styles.breachInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 5))}
                  {C(1, isOpen(cards, 5, 6))}
                  {C(2, isOpen(cards, 6, 7))}
                  {C(3, isOpen(cards, 7, 8))}
                  {C(4, isOpen(cards, 8))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>
                  {C(5, isOpen(cards, 9))}
                  {C(6, isOpen(cards, 9, 10))}
                  {C(7, isOpen(cards, 10, 11))}
                  {C(8, isOpen(cards, 11))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>
                  {C(9, isOpen(cards, 12))}
                  {C(10, isOpen(cards, 12, 13))}
                  {C(11, isOpen(cards, 13))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 108 }]}>
                <View style={styles.row}>
                  {C(12, true)}
                  {C(13, true)}
                </View>
              </View>
            </View>
          </View>

          {Bastion(23, 26, 31, true)}
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  front: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  // Bastion: supply column on the OUTER edge, tower + picket inner. The right
  // bastion reverses row order so the whole board mirrors.
  bastion: {
    width: "27%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  bastionMirror: { flexDirection: "row-reverse" },
  supplyCol: { width: 60, height: 148 },
  towerCol: { width: 176, height: 164 },
  breach: { width: "44%", alignItems: "center" },
  breachInner: { height: 184, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
})

export default LayoutCitadel
