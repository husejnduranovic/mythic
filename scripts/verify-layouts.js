// Layout blocking-graph verifier — Mythic Peaks
//
// Every active (and proposed) layout's blocking graph is encoded here as data
// and machine-checked. Run with:  node scripts/verify-layouts.js
//
// Checks per layout:
//   1. Graph sanity     — every index 0..N-1 exists, blockers are valid indices
//   2. Clearable        — blocking graph is acyclic AND a full peel succeeds
//   3. Mirror-isomorphic — the left-right mirror map is an involution and
//                          blockedBy(mirror(i)) === mirror(blockedBy(i)) —
//                          i.e. the symmetry holds at the RULES level, not just
//                          visually (owner constraint: symmetric shapes only)
//   4. Feel metrics     — Monte-Carlo random peels measure what a player
//                          actually experiences (GAMEPLAY.md §3.3 feel-gate):
//        opens        — entry choices at field start
//        depth        — longest blocker chain (how late the climax arrives)
//        deadTap%     — share of taps that reveal NOTHING (boredom metric;
//                       Cross of Clans fails here — that is why it was cut)
//        burst%       — share of taps that reveal 2+ at once (payoff metric)
//        maxBurst     — biggest single-tap reveal
//        open5        — average cards revealed by the first 5 taps
//        close5       — average cards revealed by the LAST 5 taps: does the
//                       board CLIMAX (reveals late) or DECAY (dies early)?
//                       The Stronghold fails here — its best moment is move 1
//
// IMPORTANT: these graphs are hand-copied from the Layout*.tsx components.
// If a layout's isOpen() calls change, change it here too — this file is the
// audit trail that the shipped board matches the verified design.

"use strict"

// ── deterministic PRNG (mulberry32, same as CardService) ─────────────────
const mulberry32 = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ── layout graph definitions ──────────────────────────────────────────────
// blockedBy: { cardIndex: [indices that must be cleared first] } — cards not
// listed are OPEN at start. mirror: left-right mirror as index pairs; cards on
// the axis map to themselves and may be omitted.

const LAYOUTS = [
  {
    name: "Battlements (L1, active)",
    file: "Layout1.tsx",
    n: 29,
    blockedBy: {
      0: [3], 1: [3, 4], 2: [4],
      5: [8], 6: [8, 9], 7: [9],
      10: [14], 11: [14, 15], 12: [15, 16], 13: [16],
      14: [17], 15: [17, 18], 16: [18],
      17: [19], 18: [19],
      20: [21], 22: [23],
    },
    mirror: {
      0: 7, 1: 6, 2: 5, 3: 9, 4: 8,
      10: 13, 11: 12, 14: 16, 17: 18,
      20: 22, 21: 23, 24: 28, 25: 27,
    },
  },
  {
    name: "Cross of Clans (SHELVED 2026-07-02 — was L2)",
    file: "Layout9.tsx",
    n: 32,
    blockedBy: (() => {
      const b = {}
      for (const base of [0, 8, 16, 24]) {
        b[base] = [base + 1, base + 2, base + 3]
        for (const m of [1, 2, 3]) b[base + m] = [base + 4, base + 5, base + 6]
        b[base + 7] = [base + 4, base + 5, base + 6]
      }
      return b
    })(),
    mirror: (() => {
      // clusters A(0)↔D(24), B(8)↔C(16); within a cluster m1↔m3, d1↔d3
      const m = {}
      const pair = (a, d) => {
        m[a + 0] = d + 0
        m[a + 1] = d + 3
        m[a + 2] = d + 2
        m[a + 3] = d + 1
        m[a + 4] = d + 6
        m[a + 5] = d + 5
        m[a + 6] = d + 4
        m[a + 7] = d + 7
      }
      pair(0, 24)
      pair(8, 16)
      return m
    })(),
  },
  {
    name: "The Stronghold (SHELVED 2026-07-02 — was L3)",
    file: "Layout7.tsx",
    n: 30,
    blockedBy: {
      0: [4], 1: [4, 5], 2: [5, 6], 3: [6],
      4: [7], 5: [7], 6: [7],
      12: [8, 9], 13: [9, 10], 14: [10, 11],
      15: [12, 13], 16: [13, 14], 17: [15, 16],
      18: [22], 19: [22, 23], 20: [23, 24], 21: [24],
      22: [25], 23: [25], 24: [25],
    },
    mirror: {
      0: 21, 1: 20, 2: 19, 3: 18, 4: 24, 5: 23, 6: 22, 7: 25,
      8: 11, 9: 10, 12: 14, 15: 16, 26: 29, 27: 28,
    },
  },
  {
    name: "Snake Eyes (L4, active)",
    file: "Layout8.tsx",
    n: 32,
    blockedBy: {
      0: [2, 3], 1: [4, 5],
      2: [6], 3: [6, 7], 4: [6, 7], 5: [7],
      8: [9, 10], 9: [11], 10: [12], 11: [13], 12: [14], 13: [15], 14: [15],
      16: [20, 21], 17: [22, 23],
      20: [24], 21: [24, 25], 22: [24, 25], 23: [25],
      18: [6], 19: [7], 26: [24], 27: [25],
    },
    mirror: {
      0: 17, 1: 16, 2: 23, 3: 22, 4: 21, 5: 20, 6: 25, 7: 24,
      9: 10, 11: 12, 13: 14, 18: 27, 19: 26, 28: 31, 29: 30,
    },
  },
  {
    name: "The Citadel (L5, active)",
    file: "LayoutCitadel.tsx",
    n: 32,
    blockedBy: {
      0: [5], 1: [5, 6], 2: [6, 7], 3: [7, 8], 4: [8],
      5: [9], 6: [9, 10], 7: [10, 11], 8: [11],
      9: [12], 10: [12, 13], 11: [13],
      14: [15], 15: [16],
      17: [20], 18: [20, 21], 19: [21],
      23: [24], 24: [25],
      26: [29], 27: [29, 30], 28: [30],
    },
    mirror: {
      0: 4, 1: 3, 5: 8, 6: 7, 9: 11, 12: 13,
      14: 23, 15: 24, 16: 25, 17: 28, 18: 27, 19: 26,
      20: 30, 21: 29, 22: 31,
    },
  },
  {
    name: "Dragon's Spine (L6, active)",
    file: "Layout5.tsx",
    n: 28,
    blockedBy: {
      0: [1, 2], 1: [3], 2: [3],
      4: [5], 5: [6],
      7: [11], 8: [11, 12], 9: [12, 13], 10: [13],
      14: [15], 15: [16],
      17: [18, 19], 18: [20], 19: [20],
      22: [21, 23], 24: [23, 25], 26: [25, 27],
    },
    mirror: {
      0: 17, 1: 19, 2: 18, 3: 20, 4: 14, 5: 15, 6: 16,
      7: 10, 8: 9, 11: 13,
      21: 27, 22: 26, 23: 25,
    },
  },

  // ── PROPOSED (2026-07-02 layout redesign) ────────────────────────────────
  {
    name: "The Siege (L2, active — 2026-07-09 rework: corner breaches + courtyard keep)",
    file: "LayoutSiege.tsx",
    n: 32,
    blockedBy: {
      // outer wall — top arc pockets (guards 0,2,4 open)
      1: [0, 2], 3: [2, 4],
      // outer wall — bottom arc pockets (guards 11,13,15 open)
      12: [11, 13], 14: [13, 15],
      // sides 5,6,7 (right) and 8,9,10 (left) all open
      // inner wall — CORNER BREACHES: the wall-end stones fall with their
      // corner guard alone (one tap = one reveal from move 1 — the 2026-07-09
      // easier-opening fix; the old all-double walls gave a 1.5 first-5, the
      // slowest opening in the set); center stones stay under two.
      16: [0], 17: [1, 2], 18: [2, 3], 19: [4],
      20: [6], 21: [9], // posterns — quick side doors once the flank center falls
      22: [11], 23: [12, 13], 24: [13, 14], 25: [15],
      // the keep — ONE row in the courtyard: west/east gates open when BOTH
      // wall-ends on that side fall (commit to a flank), each gate frees its
      // hall, both halls free the twin hearts (pop-pop finish)
      26: [16, 22], 27: [19, 25],
      28: [26], 29: [27],
      30: [28, 29], 31: [28, 29],
    },
    mirror: {
      0: 4, 1: 3, 5: 8, 6: 9, 7: 10, 11: 15, 12: 14,
      16: 19, 17: 18, 20: 21, 22: 25, 23: 24, 26: 27, 28: 29, 30: 31,
    },
  },
  {
    name: "The Floodgates (SHELVED 2026-07-10 — was L3; mirrored the Peaks funnel)",
    file: "LayoutFloodgates.tsx",
    n: 30,
    blockedBy: {
      // reservoir row (0..7) OPEN — the water held high
      // taper row — brick under the reservoir; the END stones fall with one
      // inner neighbor alone (corner breaches — first-move reveals), leaving
      // the reservoir corners 0/7 as free late fuel
      8: [1], 9: [1, 2], 10: [2, 3], 11: [3, 4], 12: [4, 5], 13: [5, 6], 14: [6],
      // THREE GATES, not one grain — the Hourglass's single choke (one card
      // holding 14) stalled whole runs in play. The center sluice is cheap
      // (one stone), the side gates heavy (two) — routing, not a wall.
      15: [9, 10], 16: [11], 17: [12, 13],
      // each gate releases its own fall...
      18: [15], 19: [15], 20: [16], 21: [16], 22: [17], 23: [17],
      // ...and the falls merge into one base sheet
      24: [18, 19], 25: [19, 20], 26: [20, 21], 27: [21, 22], 28: [22, 23],
      // the plunge pool — the deepest card in the game sits under the merge
      29: [26],
    },
    mirror: {
      0: 7, 1: 6, 2: 5, 3: 4,
      8: 14, 9: 13, 10: 12,
      15: 17, 18: 23, 19: 22, 20: 21,
      24: 28, 25: 27,
    },
  },
  {
    name: "The Mythic Peaks (L7, active — 2026-07-09 rework: the apex finale)",
    file: "LayoutPeaks.tsx",
    n: 28,
    blockedBy: {
      // THE APEX — one card above the center summit, blocked by ALL THREE
      // summits: the run's final ascent ends on top of the namesake. The old
      // flat classic board (depth 4, burst 12.9%, maxBurst 2) read as an
      // anticlimax in the owner playtest — this rework gives the finale a
      // fourth act.
      0: [1, 2, 3],
      // summits — west, center, east
      1: [4, 5], 2: [6, 7], 3: [8, 9],
      // shoulders — the west/east peaks are binary trees; the CENTER pair is
      // a keystone bridging the valley: both center shoulders hang on the two
      // valley-edge slopes (13,14) and pop TOGETHER when the valley cracks
      4: [10, 11], 5: [12, 13], 6: [13, 14], 7: [13, 14], 8: [14, 15], 9: [16, 17],
      // slopes — bricked over the base, with the CENTER SEAM SKIPPED (the
      // valley): the range splits west/east and only the center peak spans
      // it. The outermost slopes (10,17) and the valley-edge slopes (13,14)
      // fall with ONE base card — corner breaches at the range's ends and at
      // the pass, so the opening reveals from move 1; base corners 18/27 and
      // the valley pair 22/23 pool as free chain fuel.
      10: [19], 11: [19, 20], 12: [20, 21], 13: [21],
      14: [24], 15: [24, 25], 16: [25, 26], 17: [26],
      // base 18..27 all OPEN — the widest opening in the game stays
    },
    mirror: {
      1: 3, 4: 9, 5: 8, 6: 7,
      10: 17, 11: 16, 12: 15, 13: 14,
      18: 27, 19: 26, 20: 25, 21: 24, 22: 23,
    },
  },

  // ── PROPOSED (2026-07-10 L3/L7 redesign — the two funnels replaced) ──────
  {
    name: "The Portcullis (L3, proposed — interlocked jaws, the gate)",
    file: "LayoutPortcullis.tsx",
    n: 30,
    blockedBy: {
      // falling fangs — three wedges hanging from the top rail; each waist
      // pair is bricked ACROSS the meeting row (the interlock: rising tips
      // 16/18 hold the falling waists on BOTH their sides)
      9: [15], 10: [15, 16], 11: [16, 17], 12: [17, 18], 13: [18, 19], 14: [19],
      // fang roots — bricked over their own waist pair (outer roots single)
      0: [9], 1: [9, 10], 2: [10],
      3: [11], 4: [11, 12], 5: [12],
      6: [13], 7: [13, 14], 8: [14],
      // rising fangs — each tip frees its pair (burst from move 1)
      20: [16], 21: [16], 22: [18], 23: [18],
      // the gate-lock — a bracket tears free when its rising fang is out AND
      // the gate's heart-stone (center root 4) is pulled; the BAR cannot drop
      // while a hinge pin (post 28/29) still holds (depth 5 — the last stand)
      24: [20, 21, 4], 25: [22, 23, 4],
      26: [24, 25, 28], 27: [24, 25, 29],
      // meeting row 15..19 OPEN · hinge posts 28,29 OPEN
    },
    mirror: {
      0: 8, 1: 7, 2: 6, 3: 5,
      9: 14, 10: 13, 11: 12,
      15: 19, 16: 18,
      20: 23, 21: 22, 24: 25, 26: 27, 28: 29,
    },
  },
]

// ── verification ──────────────────────────────────────────────────────────

const fail = (msg) => {
  console.error("  ✗ " + msg)
  return false
}

function verify(layout) {
  const { n, blockedBy, mirror } = layout
  let ok = true
  const blockers = (i) => blockedBy[i] || []

  // 1. sanity
  for (const [card, list] of Object.entries(blockedBy)) {
    const c = Number(card)
    if (c < 0 || c >= n) ok = fail(`card ${c} out of range`)
    for (const b of list) {
      if (b < 0 || b >= n) ok = fail(`card ${c}: blocker ${b} out of range`)
      if (b === c) ok = fail(`card ${c} blocks itself`)
    }
    if (new Set(list).size !== list.length)
      ok = fail(`card ${c}: duplicate blockers`)
  }

  // 2. clearable — acyclic + full peel
  const cleared = new Set()
  const isOpen = (i) => blockers(i).every((b) => cleared.has(b))
  let progress = true
  while (progress && cleared.size < n) {
    progress = false
    for (let i = 0; i < n; i++) {
      if (!cleared.has(i) && isOpen(i)) {
        cleared.add(i)
        progress = true
      }
    }
  }
  if (cleared.size !== n) {
    const stuck = [...Array(n).keys()].filter((i) => !cleared.has(i))
    ok = fail(`NOT fully clearable — deadlocked cards: ${stuck.join(", ")}`)
  }

  // 3. mirror-isomorphism
  const mir = new Map()
  for (const [a, b] of Object.entries(mirror)) {
    mir.set(Number(a), b)
    mir.set(b, Number(a))
  }
  for (let i = 0; i < n; i++) if (!mir.has(i)) mir.set(i, i) // axis cards
  for (let i = 0; i < n; i++) {
    if (mir.get(mir.get(i)) !== i)
      ok = fail(`mirror is not an involution at ${i}`)
    const want = blockers(i).map((b) => mir.get(b)).sort((x, y) => x - y)
    const got = blockers(mir.get(i)).slice().sort((x, y) => x - y)
    if (want.length !== got.length || want.some((v, k) => v !== got[k]))
      ok = fail(
        `mirror breaks blocking at ${i}→${mir.get(i)}: ` +
          `mirror(blockedBy(${i}))=[${want}] but blockedBy(${mir.get(i)})=[${got}]`,
      )
  }

  // 4. metrics
  const opens = [...Array(n).keys()].filter((i) => blockers(i).length === 0)

  // depth — longest blocker chain (memoized DFS; graph verified acyclic)
  const depthMemo = new Map()
  const depth = (i) => {
    if (depthMemo.has(i)) return depthMemo.get(i)
    const d = 1 + Math.max(0, ...blockers(i).map(depth))
    depthMemo.set(i, d)
    return d
  }
  const maxDepth = Math.max(...[...Array(n).keys()].map(depth))

  // Monte-Carlo random peels
  const RUNS = 2000
  const rng = mulberry32(0xc0ffee)
  let dead = 0
  let burst = 0
  let taps = 0
  let maxBurst = 0
  let open5 = 0
  let close5 = 0
  for (let r = 0; r < RUNS; r++) {
    const gone = new Set()
    const openNow = () =>
      [...Array(n).keys()].filter(
        (i) => !gone.has(i) && blockers(i).every((b) => gone.has(b)),
      )
    let avail = openNow()
    let tapNo = 0
    while (avail.length > 0) {
      const pick = avail[Math.floor(rng() * avail.length)]
      gone.add(pick)
      const after = openNow()
      const revealed = after.length - (avail.length - 1)
      taps++
      tapNo++
      if (revealed === 0) dead++
      if (revealed >= 2) burst++
      if (revealed > maxBurst) maxBurst = revealed
      if (tapNo <= 5) open5 += revealed
      if (tapNo > n - 5) close5 += revealed
      avail = after
    }
  }

  return {
    ok,
    opens: opens.length,
    maxDepth,
    deadPct: ((dead / taps) * 100).toFixed(0),
    burstPct: ((burst / taps) * 100).toFixed(1),
    maxBurst,
    open5: (open5 / RUNS).toFixed(1),
    close5: (close5 / RUNS).toFixed(1),
  }
}

// ── report ────────────────────────────────────────────────────────────────

console.log("Mythic Peaks — layout blocking-graph audit\n")
const rows = []
let allOk = true
for (const layout of LAYOUTS) {
  console.log(`■ ${layout.name}`)
  const r = verify(layout)
  allOk = allOk && r.ok
  if (r.ok) console.log("  ✓ clearable · mirror-isomorphic · graph sane")
  rows.push({
    layout: layout.name.split(" (")[0],
    cards: layout.n,
    opens: r.opens,
    depth: r.maxDepth,
    "dead taps": r.deadPct + "%",
    "burst taps": r.burstPct + "%",
    maxBurst: r.maxBurst,
    "first-5": r.open5,
    "last-5": r.close5,
  })
  console.log()
}

console.table(rows)
console.log(
  "\ndead taps  = taps revealing nothing (boredom) · burst taps = taps revealing 2+ (payoff)" +
    "\nfirst-5    = cards revealed by the first five taps (opening liveliness)\n",
)

if (!allOk) {
  console.error("VERIFICATION FAILED")
  process.exit(1)
}
console.log("All layouts verified.")
