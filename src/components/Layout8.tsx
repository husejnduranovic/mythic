import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout8Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
  bountyIndices?: Set<number>
}

/**
 * Layout 4A — "Snake Eyes" (32 cards)
 *
 * Two interlocking eye shapes with a shared center column.
 * Inspired by the Snake Eyes layout reference.
 *
 * LEFT EYE:            CENTER:         RIGHT EYE:
 *   [0][1]              [8]             [16][17]
 * [2][3][4][5]        [9][10]        [20][21][22][23]
 *   [6][7]            [11][12]          [24][25]
 *                     [13][14]
 *                      [15]
 *
 *          [18][19]            [26][27]
 *
 *              [28][29][30][31]
 *
 * LEFT EYE (0-7):
 *   [0]←[2,3]  [1]←[4,5]
 *   [2]←[6]  [3]←[6,7]  [4]←[6,7]  [5]←[7]
 *   [6],[7] = OPEN
 *
 * CENTER SPINE (8-15):
 *   [8]←[9,10]
 *   [9]←[11]  [10]←[12]
 *   [11]←[13]  [12]←[14]
 *   [13]←[15]  [14]←[15]   ← [15] is keystone
 *   [15] = OPEN
 *
 * RIGHT EYE (16-25):
 *   [16]←[20,21]  [17]←[22,23]
 *   [20]←[24]  [21]←[24,25]  [22]←[24,25]  [23]←[25]
 *   [24],[25] = OPEN
 *
 * BRIDGE PAIRS:
 *   [18]←[6]  [19]←[7]     ← left bridge, blocked by left eye base
 *   [26]←[24]  [27]←[25]   ← right bridge, blocked by right eye base
 *
 * BASE (28-31): 4 cards, all OPEN
 *
 * Open: 6,7,15,24,25,28,29,30,31 = 9 open cards
 *
 * Strategy:
 * - Two eyes play independently — attack either one
 * - Center spine is deepest (5 levels) — big combo potential
 * - Bridge pairs connect eyes to base — clearing eye base opens bridge
 * - Shared blockers in eyes ([3,4] both blocked by [6,7])
 */

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

const Layout8 = React.memo(
  ({
    cards,
    onClick,
    hintedIndices = new Set(),
    bountyIndices = new Set(),
  }: ILayout8Props) => {
    if (cards.length < 32) return null

    const C = (i: number, open: boolean) => (
      <Card
        card={cards[i]}
        isOpen={open}
        remove={!cards[i].visible}
        onClick={() => onClick(i)}
        hinted={hintedIndices.has(i)}
        bounty={bountyIndices?.has(i)}
      />
    )

    return (
      <View style={styles.container}>
        <View style={styles.topSection}>
          {/* Left eye */}
          <View style={styles.eye}>
            <View style={styles.eyeInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isOpen(cards, 2, 3))}
                  {C(1, isOpen(cards, 4, 5))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 34 }]}>
                <View style={styles.row}>
                  {C(2, isOpen(cards, 6))}
                  {C(3, isOpen(cards, 6, 7))}
                  {C(4, isOpen(cards, 6, 7))}
                  {C(5, isOpen(cards, 7))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 68 }]}>
                <View style={styles.row}>
                  {C(6, true)}
                  {C(7, true)}
                </View>
              </View>
            </View>
          </View>

          {/* Center spine */}
          <View style={styles.spine}>
            <View style={styles.spineInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>{C(8, isOpen(cards, 9, 10))}</View>
              </View>
              <View style={[styles.absRow, { top: 30 }]}>
                <View style={styles.row}>
                  {C(9, isOpen(cards, 11))}
                  {C(10, isOpen(cards, 12))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 60 }]}>
                <View style={styles.row}>
                  {C(11, isOpen(cards, 13))}
                  {C(12, isOpen(cards, 14))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 90 }]}>
                <View style={styles.row}>
                  {C(13, isOpen(cards, 15))}
                  {C(14, isOpen(cards, 15))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 120 }]}>
                <View style={styles.row}>{C(15, true)}</View>
              </View>
            </View>
          </View>

          {/* Right eye */}
          <View style={styles.eye}>
            <View style={styles.eyeInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(16, isOpen(cards, 20, 21))}
                  {C(17, isOpen(cards, 22, 23))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 34 }]}>
                <View style={styles.row}>
                  {C(20, isOpen(cards, 24))}
                  {C(21, isOpen(cards, 24, 25))}
                  {C(22, isOpen(cards, 24, 25))}
                  {C(23, isOpen(cards, 25))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 68 }]}>
                <View style={styles.row}>
                  {C(24, true)}
                  {C(25, true)}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bridge pairs */}
        <View style={styles.bridgeRow}>
          <View style={styles.bridgePair}>
            {C(18, isOpen(cards, 6))}
            {C(19, isOpen(cards, 7))}
          </View>
          <View style={styles.bridgePair}>
            {C(26, isOpen(cards, 24))}
            {C(27, isOpen(cards, 25))}
          </View>
        </View>

        {/* Base */}
        <View style={styles.baseRow}>
          {C(28, true)}
          {C(29, true)}
          {C(30, true)}
          {C(31, true)}
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
    paddingTop: 2,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    gap: 4,
  },
  eye: { width: "30%", alignItems: "center" },
  eyeInner: { height: 110, width: "100%", alignItems: "center" },
  spine: { width: "18%", alignItems: "center" },
  spineInner: { height: 158, width: "100%", alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  bridgeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 30,
    marginTop: -10,
  },
  bridgePair: { flexDirection: "row", gap: 2 },
  baseRow: { flexDirection: "row", justifyContent: "center", paddingBottom: 2 },
})

export default Layout8
