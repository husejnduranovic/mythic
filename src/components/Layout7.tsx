import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout7Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
}

/**
 * Layout 7 — "The Stronghold" (30 cards)
 *
 * LEFT SIDE (0-7):       CENTER PYRAMID (8-17):      RIGHT SIDE (18-25):
 *  [0][1][2][3]           [8][9][10][11]             [18][19][20][21]
 *   [4][5][6]             [12][13][14]                [22][23][24]
 *     [7]                  [15][16]                      [25]
 *                           [17]
 *
 *                    BASE: [26][27][28][29]
 *
 * LEFT SIDE:
 *   [0][1][2][3]  ← closed, blocked by [4,5,6]
 *   [4][5][6]     ← closed, blocked by [7]
 *   [7]           ← OPEN — clearing this opens 4,5,6 which open 0,1,2,3
 *
 *   Blocking:
 *   [0]←[4]  [1]←[4,5]  [2]←[5,6]  [3]←[6]
 *   [4]←[7]  [5]←[7]  [6]←[7]
 *   [7] = OPEN
 *
 * CENTER PYRAMID (inverted — top open, cascades down):
 *   [8][9][10][11]  ← OPEN
 *   [12]←[8,9]  [13]←[9,10]  [14]←[10,11]
 *   [15]←[12,13]  [16]←[13,14]
 *   [17]←[15,16]
 *
 * RIGHT SIDE (mirror of left):
 *   [18][19][20][21]  ← closed, blocked by [22,23,24]
 *   [22][23][24]      ← closed, blocked by [25]
 *   [25]              ← OPEN — clearing this opens 22,23,24 which open 18-21
 *
 *   Blocking:
 *   [18]←[22]  [19]←[22,23]  [20]←[23,24]  [21]←[24]
 *   [22]←[25]  [23]←[25]  [24]←[25]
 *   [25] = OPEN
 *
 * BASE (26-29): 4 cards, all OPEN
 *
 * Open from start: 7, 8, 9, 10, 11, 25, 26, 27, 28, 29 = 10 open cards
 *
 * Strategy:
 * - Center pyramid: 4 open cards cascade DOWN through shared blockers
 * - Side keystones (7 and 25): clearing one opens 3 cards, then those 3 open 4 more
 *   That's a 1→3→4 cascade = 8 cards from one move!
 * - Wild card on keystone 7 or 25 = massive cascade
 * - Different feel on each side: pyramid is gradual, sides are explosive
 */

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

const Layout7 = React.memo(
  ({ cards, onClick, hintedIndices = new Set() }: ILayout7Props) => {
    if (cards.length < 30) return null

    const C = (i: number, open: boolean) => (
      <Card
        card={cards[i]}
        isOpen={open}
        remove={!cards[i].visible}
        onClick={() => onClick(i)}
        hinted={hintedIndices.has(i)}
      />
    )

    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          {/* Left side: 4-3-1 */}
          <View style={styles.side}>
            <View style={styles.sideInner}>
              {/* Top row — 4 closed */}
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 4))}
                  {C(1, isOpen(cards, 4, 5))}
                  {C(2, isOpen(cards, 5, 6))}
                  {C(3, isOpen(cards, 6))}
                </View>
              </View>
              {/* Middle row — 3 closed */}
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>
                  {C(4, isOpen(cards, 7))}
                  {C(5, isOpen(cards, 7))}
                  {C(6, isOpen(cards, 7))}
                </View>
              </View>
              {/* Bottom — 1 OPEN keystone */}
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>{C(7, true)}</View>
              </View>
            </View>
          </View>

          {/* Center inverted pyramid: 4-3-2-1 */}
          <View style={styles.pyramid}>
            <View style={styles.pyramidInner}>
              {/* Row 1: 4 OPEN */}
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(8, true)}
                  {C(9, true)}
                  {C(10, true)}
                  {C(11, true)}
                </View>
              </View>
              {/* Row 2: 3 closed */}
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>
                  {C(12, isOpen(cards, 8, 9))}
                  {C(13, isOpen(cards, 9, 10))}
                  {C(14, isOpen(cards, 10, 11))}
                </View>
              </View>
              {/* Row 3: 2 closed */}
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>
                  {C(15, isOpen(cards, 12, 13))}
                  {C(16, isOpen(cards, 13, 14))}
                </View>
              </View>
              {/* Row 4: 1 closed — tip */}
              <View style={[styles.absRow, { top: 108 }]}>
                <View style={styles.row}>{C(17, isOpen(cards, 15, 16))}</View>
              </View>
            </View>
          </View>

          {/* Right side: 4-3-1 (mirror) */}
          <View style={styles.side}>
            <View style={styles.sideInner}>
              {/* Top row — 4 closed */}
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(18, isOpen(cards, 22))}
                  {C(19, isOpen(cards, 22, 23))}
                  {C(20, isOpen(cards, 23, 24))}
                  {C(21, isOpen(cards, 24))}
                </View>
              </View>
              {/* Middle row — 3 closed */}
              <View style={[styles.absRow, { top: 36 }]}>
                <View style={styles.row}>
                  {C(22, isOpen(cards, 25))}
                  {C(23, isOpen(cards, 25))}
                  {C(24, isOpen(cards, 25))}
                </View>
              </View>
              {/* Bottom — 1 OPEN keystone */}
              <View style={[styles.absRow, { top: 72 }]}>
                <View style={styles.row}>{C(25, true)}</View>
              </View>
            </View>
          </View>
        </View>

        {/* Base row — 4 cards */}
        <View style={styles.baseRow}>
          {C(26, true)}
          {C(27, true)}
          {C(28, true)}
          {C(29, true)}
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
    paddingTop: 4,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    gap: 8,
  },
  side: {
    width: "26%",
    alignItems: "center",
  },
  sideInner: {
    height: 115,
    width: "100%",
    alignItems: "center",
  },
  pyramid: {
    width: "36%",
    alignItems: "center",
  },
  pyramidInner: {
    height: 148,
    width: "100%",
    alignItems: "center",
  },
  absRow: {
    position: "absolute",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  baseRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 2,
  },
})

export default Layout7
