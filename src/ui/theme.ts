// Mythic Peaks design tokens — single source of truth for color, type, spacing.
// Introduced in Phase 3 (DESIGN_PLAN.md §2). New/touched UI should consume these
// instead of inlining hex values. Static theme — no provider needed.
//
// Rollout note: as of commit 1 only Home consumes `font`; the rest of the app is
// migrated screen-by-screen in later Phase 3 commits.

export const color = {
  // ── Surfaces ──
  bgBase: "#0B1410", // app background
  bgRaised: "#122019", // panels / cards on base
  bgSunken: "#081009", // wells, code-digit cells
  bgBar: "#18120E", // in-game bottom bar
  parchment: "#F2E8D5", // card faces, active tabs, "YOU" chip
  parchmentDk: "#E0D2B8", // pressed parchment
  ink: "#1A1A1A", // text on gold / parchment

  // ── Brand gold ramp ──
  goldBright: "#FFD700", // record / celebration moments ONLY
  gold: "#E8C547", // primary brand: CTAs, titles, key numbers
  goldDeep: "#D4A017", // pressed CTA, strong borders
  goldFaded: "rgba(232,197,71,0.55)", // secondary text
  goldLine: "rgba(232,197,71,0.18)", // hairline borders
  goldWash: "rgba(232,197,71,0.06)", // subtle fills

  // ── Semantic accents (replace all neon) ──
  ember: "#FF8C00", // Glory Hunt, streak fire, Arena accent
  crimson: "#C0392B", // danger, Leave Room, retreat
  blood: "#8B1A1A", // deep red detail
  sage: "#7BED9F", // success / LIVE / online
  forest: "#1E6B3A", // cleared / serpent suit
  frost: "#9FD8EF", // timer-freeze ONLY
  steel: "#8FA3B0", // neutral secondary info
  mystic: "#9A7FD4", // reserved: top rank tier + storm wild style
} as const

// Font family names — must match the keys loaded by useGameFonts() (hooks/Fonts.ts).
// Body text and numerals deliberately stay on the system face (Cinzel numerals/lowercase
// are titling-only); use fontWeight for those.
export const font = {
  display: "Cinzel_900Black", // screen titles, hero moments
  heading: "Cinzel_700Bold", // section headers, CTA labels
} as const

// Type scale. Entries with `fontFamily` are serif (Cinzel); the rest stay system.
export const type = {
  overline: { fontSize: 10, letterSpacing: 2.5, fontWeight: "800" },
  caption: { fontSize: 11, fontWeight: "600" },
  body: { fontSize: 13, fontWeight: "600" },
  emphasis: { fontSize: 15, fontWeight: "800" },
  title: { fontSize: 18, fontFamily: font.heading },
  stat: { fontSize: 22, fontWeight: "900" },
  hero: { fontSize: 28, fontFamily: font.display },
  display: { fontSize: 38, fontFamily: font.display },
} as const

export const space = [0, 4, 8, 12, 16, 24, 32] as const
export const radius = { sm: 6, md: 10, lg: 14, round: 999 } as const
export const border = { hair: 1, std: 1.5, bold: 2 } as const
