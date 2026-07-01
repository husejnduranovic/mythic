import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayoutWarfrontProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 10 — "The Warfront" (32 cards) — level 5 (3.0×)
 *
 * The set's first ASYMMETRIC, NO-BASE-ROW board (GAMEPLAY.md §3.2: every other
 * active layout is mirror-symmetric and five of six share an open base that
 * homogenizes the opening). Three unequal structures with different economies —
 * the opening move is a genuine choice between them.
 *
 *   SIEGE TOWER (left, 9):      THE BREACH (center, 14):     SUPPLY LINE (right, 9):
 *     [0][1]                     [9][10][11][12][13]          [23] [26]  [31]
 *     [2][3]                      [14][15][16][17]            [24] [27] [29][30]
 *   [5][4][7]                      [18][19][20]               [25] [28]
 *    [6] [8]                        [21][22]
 *
 * SIEGE TOWER — guarded lane, one keystone:
 *   [0]←[2]  [1]←[3]  [2]←[4]  [3]←[4]  → keystone [4] OPEN (1→2→2 cascade)
 *   gate posts: [5]←[6]  [7]←[8]  → [6],[8] OPEN
 *
 * THE BREACH — escalating fan, the banner engine (inverse of the Stronghold
 * pyramid: it WIDENS as you climb):
 *   [9]←[14]  [10]←[14,15]  [11]←[15,16]  [12]←[16,17]  [13]←[17]
 *   [14]←[18]  [15]←[18,19]  [16]←[19,20]  [17]←[20]
 *   [18]←[21]  [19]←[21,22]  [20]←[22]
 *   keystones [21],[22] OPEN — cascade 2→3→4→5, the biggest escalation in the set
 *
 * SUPPLY LINE — shallow fuel you ration between cascade pushes:
 *   [23]←[24]←[25 OPEN]   [26]←[27]←[28 OPEN]   reserve tent: [31]←[29,30 OPEN]
 *
 * Open at start: 4, 6, 8, 21, 22, 25, 28, 29, 30 = 9 (matches Snake Eyes, the
 * proven "hard board" count — right for the 3.0× slot).
 *
 * Feel-gate evidence (§8 / GAMEPLAY §3.3 band 1.2–1.8 cards-opened-per-cleared
 * per cascade event): Breach 2→3 (1.5), 3→4 (1.33), 4→5 (1.25); Tower keystone
 * 1→2 (2.0) then 2→2 (1.0). Supply is deliberately flat (1:1 ×2, tent 2→1) —
 * 9 of 32 cards of chain fuel, the resource you spend to bridge between
 * cascade pushes; once it's gone the board goes tight. OWNER PLAYTEST GATE:
 * this board replaces the unnamed piles+wall (Layout2, shelved) and must pass
 * the same on-device feel judgment that picked the active six.
 *
 * Strategy: no safety base — every match comes from a structure. The Breach
 * rewards patient chain routing (deep flags, bounty detours), the Tower is a
 * guarded second lane, the Supply is tempo. Asymmetry means "which side first"
 * has no mirror-equivalent answer.
 */

const LayoutWarfront = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutWarfrontProps) => {
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
        <View style={styles.front}>
          {/* SIEGE TOWER */}
          <View style={styles.tower}>
            <View style={styles.towerInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 2))}
                  {C(1, isOpen(cards, 3))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 44 }]}>
                <View style={styles.row}>
                  {C(2, isOpen(cards, 4))}
                  {C(3, isOpen(cards, 4))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 88 }]}>
                <View style={styles.row}>
                  {C(5, isOpen(cards, 6))}
                  {C(4, true)}
                  {C(7, isOpen(cards, 8))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 132 }]}>
                <View style={styles.gateRow}>
                  {C(6, true)}
                  {C(8, true)}
                </View>
              </View>
            </View>
          </View>

          {/* THE BREACH — 5 over 4 over 3 over 2 keystones */}
          <View style={styles.breach}>
            <View style={styles.breachInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(9, isOpen(cards, 14))}
                  {C(10, isOpen(cards, 14, 15))}
                  {C(11, isOpen(cards, 15, 16))}
                  {C(12, isOpen(cards, 16, 17))}
                  {C(13, isOpen(cards, 17))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>
                  {C(14, isOpen(cards, 18))}
                  {C(15, isOpen(cards, 18, 19))}
                  {C(16, isOpen(cards, 19, 20))}
                  {C(17, isOpen(cards, 20))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>
                  {C(18, isOpen(cards, 21))}
                  {C(19, isOpen(cards, 21, 22))}
                  {C(20, isOpen(cards, 22))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 108 }]}>
                <View style={styles.row}>
                  {C(21, true)}
                  {C(22, true)}
                </View>
              </View>
            </View>
          </View>

          {/* SUPPLY LINE — two stacks + the reserve tent */}
          <View style={styles.supply}>
            <View style={styles.stackCol}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>{C(23, isOpen(cards, 24))}</View>
              </View>
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>{C(24, isOpen(cards, 25))}</View>
              </View>
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>{C(25, true)}</View>
              </View>
            </View>
            <View style={styles.stackCol}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>{C(26, isOpen(cards, 27))}</View>
              </View>
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>{C(27, isOpen(cards, 28))}</View>
              </View>
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>{C(28, true)}</View>
              </View>
            </View>
            <View style={styles.tentCol}>
              <View style={[styles.absRow, { top: 18 }]}>
                <View style={styles.row}>{C(31, isOpen(cards, 29, 30))}</View>
              </View>
              <View style={[styles.absRow, { top: 62 }]}>
                <View style={styles.row}>
                  {C(29, true)}
                  {C(30, true)}
                </View>
              </View>
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
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  front: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tower: { width: "23%", alignItems: "center" },
  towerInner: { height: 206, width: "100%", alignItems: "center" },
  breach: { width: "44%", alignItems: "center" },
  breachInner: { height: 184, width: "100%", alignItems: "center" },
  supply: {
    width: "32%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  stackCol: { width: 60, height: 148 },
  tentCol: { width: 122, height: 140 },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  // Gate opens sit a card-width apart so each lands under its own post.
  gateRow: { flexDirection: "row", justifyContent: "center", gap: 56 },
})

export default LayoutWarfront
