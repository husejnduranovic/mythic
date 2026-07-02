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
    name: "Cross of Clans (L2, active — FLAGGED)",
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
    name: "The Stronghold (L3, active — FLAGGED)",
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
    name: "The Siege (PROPOSED — replaces Cross of Clans, L2)",
    file: "LayoutSiege.tsx",
    n: 32,
    proposed: true,
    blockedBy: {
      // outer wall — top arc pockets (guards 0,2,4 open)
      1: [0, 2], 3: [2, 4],
      // outer wall — bottom arc pockets (guards 11,13,15 open)
      12: [11, 13], 14: [13, 15],
      // sides 5,6,7 (right) and 8,9,10 (left) all open
      // inner wall — each stone under two outer-wall stones (radiating covers)
      16: [0, 1], 17: [1, 2], 18: [2, 3], 19: [3, 4],
      20: [6], 21: [9], // posterns — quick side doors once the side wall falls
      22: [11, 12], 23: [12, 13], 24: [13, 14], 25: [14, 15],
      // the keep — north/south gates, then twin-keystone pops
      26: [17, 18], 27: [23, 24],
      28: [26, 27], 29: [26, 27],
      30: [28, 29], 31: [28, 29],
    },
    mirror: {
      0: 4, 1: 3, 5: 8, 6: 9, 7: 10, 11: 15, 12: 14,
      16: 19, 17: 18, 20: 21, 22: 25, 23: 24, 28: 29, 30: 31,
    },
  },
  {
    name: "The Hourglass (PROPOSED — replaces The Stronghold, L3)",
    file: "LayoutHourglass.tsx",
    n: 30,
    proposed: true,
    blockedBy: {
      // reservoir row (0..7) OPEN — sand at the top
      // taper row — brick under the reservoir
      8: [0, 1], 9: [1, 2], 10: [2, 3], 11: [3, 4], 12: [4, 5], 13: [5, 6], 14: [6, 7],
      // THE LAST GRAIN — one card holds the whole bottom half
      15: [10, 11, 12],
      // the bloom — widening fan, every clear reveals (no dead taps below)
      16: [15], 17: [15],
      18: [16], 19: [16, 17], 20: [17],
      21: [18], 22: [18, 19], 23: [19, 20], 24: [20],
      25: [21], 26: [21, 22], 27: [22, 23], 28: [23, 24], 29: [24],
    },
    mirror: {
      0: 7, 1: 6, 2: 5, 3: 4,
      8: 14, 9: 13, 10: 12,
      16: 17, 18: 20, 21: 24, 22: 23, 25: 29, 26: 28,
    },
  },
  {
    name: "The Mythic Peaks (PROPOSED — new finale, L7)",
    file: "LayoutPeaks.tsx",
    n: 28,
    proposed: true,
    blockedBy: {
      // three summits
      0: [3, 4], 1: [5, 6], 2: [7, 8],
      // shoulders
      3: [9, 10], 4: [10, 11], 5: [12, 13], 6: [13, 14], 7: [15, 16], 8: [16, 17],
      // slopes — the classic fused row: every foothill clear feeds two slopes
      9: [18, 19], 10: [19, 20], 11: [20, 21], 12: [21, 22], 13: [22, 23],
      14: [23, 24], 15: [24, 25], 16: [25, 26], 17: [26, 27],
      // foothills 18..27 all OPEN — the widest opening in the game
    },
    mirror: {
      0: 2, 3: 8, 4: 7, 5: 6,
      9: 17, 10: 16, 11: 15, 12: 14,
      18: 27, 19: 26, 20: 25, 21: 24, 22: 23,
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
