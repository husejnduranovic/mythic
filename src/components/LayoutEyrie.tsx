import React from "react"
import { StyleSheet, View } from "react-native"
import Card, { CARD_W, CARD_H } from "./Card"
import { ICard } from "./Card"

interface ILayoutEyrieProps {
  cards: ICard[]
  onClick: (index: number) => void
  bountyIndices?: Set<number>
}

const isOpen = (cards: ICard[], ...blockers: number[]) =>
  blockers.every((i) => !cards[i]?.visible)

/**
 * Layout 15 — "The Eyrie" (29 cards) — level 7 (4.0×), the finale
 *
 * The war eagle mantling on the summit — the eyrie IS the top of the Mythic
 * Peaks. Replaces the tri-peaks funnel (2026-07-10 owner verdict: the Peaks
 * finale and the Floodgates were the same silhouette, mirrored). The wings
 * cascade OUTWARD — the inverse of every converging shape in the set — and
 * the campaign ends on one fused apex card.
 *
 *    [0]              [1]              [2]      pinions + THE APEX
 *  [3][4][5][6]       [7]      [8][9][10][11]   mids (4/wing) + the head
 *   [12][13][14]   [15][16]   [17][18][19]      coverts + the perch
 * [27]  [20][21][22][23][24][25][26]  [28]      body (7 OPEN) + talons
 *
 * Blocking (machine-verified clearable + mirror-isomorphic). 2026-07-14
 * Task-3 rework — THE GRIP AND THE WEAVE: the first cut played itself (two
 * independent wing cascades that contested nothing, talons that were pure
 * free fuel, inner mids that blocked nothing — no "spend it or hold it"
 * anywhere on the 4.0× finale):
 *   talons:  27,28 OPEN crag pockets — but each now PINS its wing's EDGE
 *            FEATHER (the outermost mid at the top of its column: talon →
 *            leading covert → edge mid, rising outward). The eagle must
 *            release its grip to spread the wing: spending a talon is fuel
 *            AND the key to that wing's pinion route; holding it is
 *            insurance for a dying chain. The toll is the dilemma — and
 *            both grips must open before the eagle can be crowned.
 *   coverts: rooted under the shoulder — 12←20 · 13←20,21 · 14←21,22 and
 *            mirrored 19←26 · 18←26,25 · 17←25,24
 *   mids:    bricked 4-over-3, the band WIDENS outward (the wing sweep);
 *            the edge mid needs its covert AND the grip released:
 *            3←12,27 · 4←12,13 · 5←13,14 · 6←14, mirrored 11←19,28 /10/9/8
 *   perch:   under the body's center trio — 15←22,23 · 16←23,24 (keystone
 *            23: clearing it last of the trio pops BOTH perch cards)
 *   head:    7←6,8,15,16 — the head lifts once the mantling wings PART
 *            (the inner mids flanking it on its own row) and the perch is
 *            clear. The center ascent runs THROUGH both wings' feathers.
 *   pinions: each wingtip rises off its two outermost mids — 0←3,4 · 2←10,11
 *   APEX:    1←0,2,7 — the eagle crowned: BOTH pinions and the head must
 *            stand before the campaign's last card (depth 5; the old three
 *            summits reborn as one crowning moment)
 *
 * Dead taps 48% (set-best), burst 17.4%, first-5 2.6, last-5 2.4 — the
 * finale climaxes (only the Siege ends livelier), depth 5.
 *
 * Strategy: TWO ROUTES UP, both through the wings. The outer route is
 * talon-keyed (grip → edge mids → pinion); the inner route climbs the
 * center (perch → part the feathers → head); the apex demands all three
 * tops. Spend a talon to commit a wing, hold one to bridge a dying chain,
 * and time the crown onto a banner.
 */

// All geometry in card units so every device keeps the shape. A card's
// rendered footprint is CARD_W+4 (2px margins) and rows add a 2px gap, so
// adjacent centers sit one PITCH apart; span(cols) spaces its neighbors
// cols·PITCH apart.
const V = Math.round(CARD_H * 0.46)
const PITCH = CARD_W + 6
const span = (cols: number) => Math.round(cols * PITCH) - (CARD_W + 8)

const LayoutEyrie = React.memo(
  ({ cards, onClick, bountyIndices = new Set() }: ILayoutEyrieProps) => {
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
        <View style={styles.summit}>
          {/* deepest first — pinions and the apex */}
          <View style={[styles.absRow, { top: 0 }]}>
            <View style={styles.row}>
              {C(0, isOpen(cards, 3, 4))}
              <View style={{ width: span(4) }} />
              {C(1, isOpen(cards, 0, 2, 7))}
              <View style={{ width: span(4) }} />
              {C(2, isOpen(cards, 10, 11))}
            </View>
          </View>

          {/* mids — the wings sweep out — and the head */}
          <View style={[styles.absRow, { top: V }]}>
            <View style={styles.row}>
              {C(3, isOpen(cards, 12, 27))}
              {C(4, isOpen(cards, 12, 13))}
              {C(5, isOpen(cards, 13, 14))}
              {C(6, isOpen(cards, 14))}
              <View style={{ width: span(1.5) }} />
              {C(7, isOpen(cards, 6, 8, 15, 16))}
              <View style={{ width: span(1.5) }} />
              {C(8, isOpen(cards, 17))}
              {C(9, isOpen(cards, 17, 18))}
              {C(10, isOpen(cards, 18, 19))}
              {C(11, isOpen(cards, 19, 28))}
            </View>
          </View>

          {/* coverts and the perch */}
          <View style={[styles.absRow, { top: V * 2 }]}>
            <View style={styles.row}>
              {C(12, isOpen(cards, 20))}
              {C(13, isOpen(cards, 20, 21))}
              {C(14, isOpen(cards, 21, 22))}
              <View style={{ width: span(1.5) }} />
              {C(15, isOpen(cards, 22, 23))}
              {C(16, isOpen(cards, 23, 24))}
              <View style={{ width: span(1.5) }} />
              {C(17, isOpen(cards, 24, 25))}
              {C(18, isOpen(cards, 25, 26))}
              {C(19, isOpen(cards, 26))}
            </View>
          </View>

          {/* the body — 7 open — flanked by the talons */}
          <View style={[styles.absRow, { top: V * 3 }]}>
            <View style={styles.row}>
              {C(27, true)}
              <View style={{ width: span(1.5) }} />
              {C(20, true)}
              {C(21, true)}
              {C(22, true)}
              {C(23, true)}
              {C(24, true)}
              {C(25, true)}
              {C(26, true)}
              <View style={{ width: span(1.5) }} />
              {C(28, true)}
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
  summit: {
    width: "100%",
    height: V * 3 + CARD_H,
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

export default LayoutEyrie
