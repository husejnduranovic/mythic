// The "one more battle" goal — DESIGN_PLAN §6.5, completed 2026-07-13.
//
// One goal, imminence-first: a countable number of battles beats a closable
// spoils gap beats a distant dream. Never more than one goal — a single
// near-miss is a hook, a dashboard is homework. Pure and unit-testable; the
// game-over screen supplies the data and owns the rendering.

export interface GoalInputs {
  // A completed run's context. previousBest is the player's standing best
  // (whether or not this run beat it); 0 = no best known.
  score: number
  previousBest: number
  // Local games count AFTER this run, when known.
  gamesPlayed: number | null
  // Nearest battle-gated Armory piece still locked (req = battles needed).
  armoryNext: { name: string; req: number } | null
  // Next games-count rank tier (needed = battles to it). needed <= 0 = maxed.
  rankNext: { name: string; needed: number } | null
  // The player one seat above on the all-time board (fetched above the
  // player's own best, so overtaking them is a real seat gained).
  rival: { name: string; score: number } | null
  // The best run's final total (the shadow), when one exists.
  ghostFinal: number | null
}

export interface NextGoal {
  kind: "battles-armory" | "battles-rank" | "pb" | "rival" | "shadow"
  // Rendered as <em>{em}</em>{rest} — em carries the number or the name.
  em: string
  rest: string
  // 0..1 progress toward the goal, null = no bar.
  pct: number | null
  // The same goal shortened into the Battle Again button's subtitle.
  sub: string
}

const plural = (n: number) => (n === 1 ? "battle" : "battles")

export const pickNextGoal = (i: GoalInputs): NextGoal | null => {
  const games = i.gamesPlayed

  // 1./2. A countable number of runs — the strongest "one more" trigger.
  // When both an Armory piece and a rank tier are ≤3 battles out, the
  // smaller count wins; a tie goes to the piece (a thing beats a title).
  const armoryNeeded =
    games !== null && i.armoryNext ? i.armoryNext.req - games : Infinity
  const rankNeeded =
    i.rankNext && i.rankNext.needed > 0 ? i.rankNext.needed : Infinity
  const battleGoal = Math.min(armoryNeeded, rankNeeded)
  if (battleGoal >= 1 && battleGoal <= 3) {
    if (armoryNeeded <= rankNeeded && i.armoryNext && games !== null) {
      return {
        kind: "battles-armory",
        em: `${armoryNeeded}`,
        rest: ` ${plural(armoryNeeded)} to ${i.armoryNext.name}`,
        pct: Math.min(1, games / i.armoryNext.req),
        sub: `${armoryNeeded} ${plural(armoryNeeded).toUpperCase()} TO ${i.armoryNext.name.toUpperCase()}`,
      }
    }
    if (i.rankNext) {
      return {
        kind: "battles-rank",
        em: `${rankNeeded}`,
        rest: ` ${plural(rankNeeded)} to ${i.rankNext.name}`,
        pct:
          games !== null && games + rankNeeded > 0
            ? Math.min(1, games / (games + rankNeeded))
            : null,
        sub: `${rankNeeded} ${plural(rankNeeded).toUpperCase()} TO ${i.rankNext.name}`,
      }
    }
  }

  // 3. Personal best within reach (≥60% of it — a gap that demoralizes is
  // not a goal).
  if (
    i.previousBest > i.score &&
    i.score >= 0.6 * i.previousBest
  ) {
    return {
      kind: "pb",
      em: (i.previousBest - i.score).toLocaleString(),
      rest: " spoils from your personal best",
      pct: Math.min(1, i.score / i.previousBest),
      sub: `${(i.previousBest - i.score).toLocaleString()} FROM YOUR BEST`,
    }
  }

  // 4. A named rival one seat up, closable in roughly one good run.
  if (i.rival) {
    const myBest = Math.max(i.score, i.previousBest)
    const gap = i.rival.score - myBest
    if (gap > 0 && gap <= Math.max(myBest, 1)) {
      return {
        kind: "rival",
        em: i.rival.name,
        rest: ` holds the seat above — ${gap.toLocaleString()} spoils up`,
        pct: Math.min(1, myBest / i.rival.score),
        sub: `UNSEAT ${i.rival.name.toUpperCase()}`,
      }
    }
  }

  // 5. The shadow (your best run) still stands above this one.
  if (i.ghostFinal !== null && i.ghostFinal > i.score) {
    return {
      kind: "shadow",
      em: "THE SHADOW",
      rest: ` stands at ${i.ghostFinal.toLocaleString()} — race it`,
      pct: i.ghostFinal > 0 ? Math.min(1, i.score / i.ghostFinal) : null,
      sub: "RACE THE SHADOW",
    }
  }

  return null
}
