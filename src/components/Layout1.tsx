import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_W, CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayout1Props {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 1 — "Battlements" (29 cards)
 *
 * LEFT TOWER (5):    PAIR:   BRIDGE (10):         PAIR:   RIGHT TOWER (5):
 *  [0][1][2]         [20]   [10][11][12][13]      [22]     [5][6][7]
 *   [3][4]           [21]    [14][15][16]         [23]      [8][9]
 *                              [17][18]
 *                               [19]
 *
 * BASE ROW: [24][25][26][27][28]  — 5 OPEN
 *
 * Blocking unchanged since the 2026-07-02 audit (machine-verified in
 * scripts/verify-layouts.js). 2026-07-09 spacing pass: the old geometry mixed
 * three different row steps (46/44/40) and %-width columns that drifted apart
 * on wide screens and collided on narrow ones — and none of it scaled with
 * CARD_SCALE. Every offset is now derived from CARD_W/CARD_H (the exact
 * half-card convention the newer boards use), so the structure holds its
 * shape on every device.
 */

// One uniform vertical step for every stacked group — a covered card always
// peeks the same band, and the whole board scales with the cards.
const V = Math.round(CARD_H * 0.46)
// Breathing room between the five groups (towers / pairs / bridge).
const G = Math.round(CARD_W * 0.35)

const Layout1 = React.memo(
  ({
    cards,
    onClick,
    bountyIndices = new Set(),
  }: ILayout1Props) => {
    if (cards.length < 29) return null

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
        <View style={styles.topSection}>
          {/* Left tower — 3 on 2 */}
          <View style={styles.tower}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(0, isOpen(cards, 3))}
                {C(1, isOpen(cards, 3, 4))}
                {C(2, isOpen(cards, 4))}
              </View>
            </View>
            <View style={[styles.absRow, { top: V }]}>
              <View style={styles.row}>
                {C(3, true)}
                {C(4, true)}
              </View>
            </View>
          </View>

          <View style={{ width: G }} />

          {/* Left pair — seated between tower and bridge heights */}
          <View style={styles.singlePair}>
            <View style={[styles.absRow, { top: Math.round(V * 0.5) }]}>
              <View style={styles.row}>{C(20, isOpen(cards, 21))}</View>
            </View>
            <View style={[styles.absRow, { top: Math.round(V * 1.5) }]}>
              <View style={styles.row}>{C(21, true)}</View>
            </View>
          </View>

          <View style={{ width: G }} />

          {/* Center bridge — 4 rows, uniform step */}
          <View style={styles.bridge}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(10, isOpen(cards, 14))}
                {C(11, isOpen(cards, 14, 15))}
                {C(12, isOpen(cards, 15, 16))}
                {C(13, isOpen(cards, 16))}
              </View>
            </View>
            <View style={[styles.absRow, { top: V }]}>
              <View style={styles.row}>
                {C(14, isOpen(cards, 17))}
                {C(15, isOpen(cards, 17, 18))}
                {C(16, isOpen(cards, 18))}
              </View>
            </View>
            <View style={[styles.absRow, { top: V * 2 }]}>
              <View style={styles.row}>
                {C(17, isOpen(cards, 19))}
                {C(18, isOpen(cards, 19))}
              </View>
            </View>
            <View style={[styles.absRow, { top: V * 3 }]}>
              <View style={styles.row}>{C(19, true)}</View>
            </View>
          </View>

          <View style={{ width: G }} />

          {/* Right pair */}
          <View style={styles.singlePair}>
            <View style={[styles.absRow, { top: Math.round(V * 0.5) }]}>
              <View style={styles.row}>{C(22, isOpen(cards, 23))}</View>
            </View>
            <View style={[styles.absRow, { top: Math.round(V * 1.5) }]}>
              <View style={styles.row}>{C(23, true)}</View>
            </View>
          </View>

          <View style={{ width: G }} />

          {/* Right tower — 3 on 2 */}
          <View style={styles.tower}>
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(5, isOpen(cards, 8))}
                {C(6, isOpen(cards, 8, 9))}
                {C(7, isOpen(cards, 9))}
              </View>
            </View>
            <View style={[styles.absRow, { top: V }]}>
              <View style={styles.row}>
                {C(8, true)}
                {C(9, true)}
              </View>
            </View>
          </View>
        </View>

        {/* BASE ROW — 5 cards */}
        <View style={styles.baseRow}>
          {C(24, true)}
          {C(25, true)}
          {C(26, true)}
          {C(27, true)}
          {C(28, true)}
        </View>
      </View>
    )
  },
)

// Group widths hug their content (cards carry a 2px margin each side; rows
// add a 2px gap), so the groups center as one composed structure instead of
// drifting apart on wide screens.
const CARD_SLOT = CARD_W + 4
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: 4 },
  topSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    paddingTop: 4,
  },
  tower: {
    width: CARD_SLOT * 3 + 4,
    height: V + CARD_H,
    alignItems: "center",
  },
  singlePair: {
    width: CARD_SLOT,
    height: Math.round(V * 1.5) + CARD_H,
    alignItems: "center",
  },
  bridge: {
    width: CARD_SLOT * 4 + 6,
    height: V * 3 + CARD_H,
    alignItems: "center",
  },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center", gap: 2 },
  baseRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 2,
    paddingBottom: 2,
  },
})

export default Layout1
