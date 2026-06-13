import React from "react"
import { StyleSheet, View } from "react-native"
import Card from "./Card"
import { ICard } from "./Card"

interface ILayout9Props {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
  pendingIndex?: number | null
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 5 — "Cross of Clans" (32 cards)
 *
 * Four layered plus-cross clusters across the screen.
 *
 * Each cluster (8 cards):
 *       [TOP]            ← blocked by middle row
 *    [M][M][M]           ← middle row, blocked by deep row
 *    [D][D][D]           ← deep row, OPEN
 *       [BOT]            ← blocked by deep row
 *
 * Cluster A: 0-7      Cluster B: 8-15      Cluster C: 16-23      Cluster D: 24-31
 *
 * Per-cluster indices (cluster A example):
 *   [0] = top         blocked by [1,2,3]
 *   [1][2][3] = mid   blocked by [4,5,6]
 *   [4][5][6] = deep  OPEN
 *   [7] = bottom      blocked by [4,5,6]
 *
 * Cascade per cluster:
 *   3 deep cards open at start
 *   Clear all 3 → top AND bottom open simultaneously (4 new openings total)
 *     Wait — middle row [1,2,3] also opens at same time as bottom
 *   Re-reading: after deep cleared, [1,2,3] open AND [7] opens (4 cards revealed)
 *   Clear all 3 middle → [0] (top) opens
 *
 * Total cluster cascade: 3 → 4 → 1 = 8 cards
 *
 * Open at start: 4 clusters × 3 deep cards = 12 entry points
 *
 * Strategy:
 *   - Real choice: which of 4 clusters to attack first
 *   - Real choice within a cluster: order to clear the 3 deep cards
 *   - Big payoff: clearing 3 deep opens 4 cards at once
 *   - Wild on a deep card = kills one shared blocker, partial opening
 *   - No base row safety net — every match must come from a cluster
 */

const Layout9 = React.memo(
  ({
    cards,
    onClick,
    bountyIndices = new Set(),
    pendingIndex,
  }: ILayout9Props) => {
    if (cards.length < 32) return null

    const C = (i: number, open: boolean) => (
      <Card
        card={cards[i]}
        isOpen={open}
        remove={!cards[i].visible}
        onClick={() => onClick(i)}
        bounty={bountyIndices?.has(i)}
        pending={pendingIndex === i}
      />
    )

    // One plus-cluster — takes the starting index, renders the 8-card cross
    const Cluster = (base: number) => {
      const top = base + 0
      const m1 = base + 1
      const m2 = base + 2
      const m3 = base + 3
      const d1 = base + 4
      const d2 = base + 5
      const d3 = base + 6
      const bot = base + 7

      return (
        <View style={styles.cluster}>
          <View style={styles.clusterInner}>
            {/* Top */}
            <View style={[styles.absRow, { top: 0 }]}>
              <View style={styles.row}>
                {C(top, isOpen(cards, m1, m2, m3))}
              </View>
            </View>
            {/* Middle row */}
            <View style={[styles.absRow, { top: 60 }]}>
              <View style={styles.tripleRow}>
                {C(m1, isOpen(cards, d1, d2, d3))}
                {C(m2, isOpen(cards, d1, d2, d3))}
                {C(m3, isOpen(cards, d1, d2, d3))}
              </View>
            </View>
            {/* Deep row — OPEN */}
            <View style={[styles.absRow, { top: 120 }]}>
              <View style={styles.tripleRow}>
                {C(d1, true)}
                {C(d2, true)}
                {C(d3, true)}
              </View>
            </View>
            {/* Bottom */}
            <View style={[styles.absRow, { top: 180 }]}>
              <View style={styles.row}>
                {C(bot, isOpen(cards, d1, d2, d3))}
              </View>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <View style={styles.row4}>
          {Cluster(0)}
          {Cluster(8)}
          {Cluster(16)}
          {Cluster(24)}
        </View>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  row4: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  cluster: {
    width: "23%",
    alignItems: "center",
  },
  clusterInner: {
    height: 260,
    width: "100%",
    alignItems: "center",
  },
  tripleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  absRow: {
    position: "absolute",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
})

export default Layout9
