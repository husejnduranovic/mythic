import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout5Props {
  cards: ICard[]
  onClick: (index: number) => void
  hintedIndices?: Set<number>
}

/**
 * Layout 5 — "Colosseum" (32 cards) — EASIER version
 *
 * 3 arches with only 2 layers (not 3), pillars, and wide floor.
 *
 * LEFT ARCH:     [0][1]     ← blocked by [2,3]
 *                [2][3]     ← blocked by middle row [16,17]
 *
 * CENTER ARCH:   [4][5]     ← blocked by [6,7]
 *                [6][7]     ← blocked by middle row [19,20]
 *
 * RIGHT ARCH:    [8][9]     ← blocked by [10,11]
 *                [10][11]   ← blocked by middle row [21,22]
 *
 * LEFT PILLAR:   [12]←[13]  [13]=OPEN
 * RIGHT PILLAR:  [14]←[15]  [15]=OPEN
 *
 * MIDDLE ROW:    [16][17][18][19][20][21][22][23] ← blocked by bottom
 *   [16]←[24] [17]←[25] [18]←[26] [19]←[27]
 *   [20]←[28] [21]←[29] [22]←[30] [23]←[31]
 *
 * BOTTOM ROW:    [24][25][26][27][28][29][30][31] ← OPEN
 *
 * Open at start: 2 (pillars) + 8 (bottom) = 10
 * Only 1 arch layer blocked → clear 1 middle card → unlock 1 arch base → unlock 1 arch top
 * Much faster progression than before!
 */

const isCleared = (cards: ICard[], ...i: number[]) =>
  i.every((x) => !cards[x]?.visible)

const Layout5 = React.memo(
  ({ cards, onClick, hintedIndices = new Set() }: ILayout5Props) => {
    if (cards.length < 32) return null

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
          {/* Left pillar */}
          <View style={styles.pillar}>
            {C(12, isCleared(cards, 13))}
            {C(13, cards[13].visible)}
          </View>

          {/* Left arch — 2 layers */}
          <View style={styles.arch}>
            <View style={styles.archInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(0, isCleared(cards, 2))}
                  {C(1, isCleared(cards, 3))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 50 }]}>
                <View style={styles.row}>
                  {C(2, isCleared(cards, 16))}
                  {C(3, isCleared(cards, 17))}
                </View>
              </View>
            </View>
          </View>

          {/* Center arch — 2 layers */}
          <View style={styles.arch}>
            <View style={styles.archInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(4, isCleared(cards, 6))}
                  {C(5, isCleared(cards, 7))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 50 }]}>
                <View style={styles.row}>
                  {C(6, isCleared(cards, 19))}
                  {C(7, isCleared(cards, 20))}
                </View>
              </View>
            </View>
          </View>

          {/* Right arch — 2 layers */}
          <View style={styles.arch}>
            <View style={styles.archInner}>
              <View style={[styles.absRow, { top: 0 }]}>
                <View style={styles.row}>
                  {C(8, isCleared(cards, 10))}
                  {C(9, isCleared(cards, 11))}
                </View>
              </View>
              <View style={[styles.absRow, { top: 50 }]}>
                <View style={styles.row}>
                  {C(10, isCleared(cards, 21))}
                  {C(11, isCleared(cards, 22))}
                </View>
              </View>
            </View>
          </View>

          {/* Right pillar */}
          <View style={styles.pillar}>
            {C(14, isCleared(cards, 15))}
            {C(15, cards[15].visible)}
          </View>
        </View>

        {/* MIDDLE ROW — blocked by bottom, 1-to-1 */}
        <View style={styles.floorRow}>
          {C(16, isCleared(cards, 24))}
          {C(17, isCleared(cards, 25))}
          {C(18, isCleared(cards, 26))}
          {C(19, isCleared(cards, 27))}
          {C(20, isCleared(cards, 28))}
          {C(21, isCleared(cards, 29))}
          {C(22, isCleared(cards, 30))}
          {C(23, isCleared(cards, 31))}
        </View>

        {/* BOTTOM ROW — OPEN */}
        <View style={styles.floorRow}>
          {C(24, cards[24].visible)}
          {C(25, cards[25].visible)}
          {C(26, cards[26].visible)}
          {C(27, cards[27].visible)}
          {C(28, cards[28].visible)}
          {C(29, cards[29].visible)}
          {C(30, cards[30].visible)}
          {C(31, cards[31].visible)}
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
    alignItems: "flex-end",
    flex: 1,
  },
  pillar: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
    marginBottom: -60,
  },
  arch: { flex: 1, maxWidth: "28%" },
  archInner: { height: 110, alignItems: "center" },
  absRow: { position: "absolute", width: "100%" },
  row: { flexDirection: "row", justifyContent: "center" },
  floorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: -4,
  },
})

export default Layout5
