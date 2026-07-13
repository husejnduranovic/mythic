// The €100 monthly prize (MARKET.md §5) as displayable facts — the amounts
// already live in the Guide and the Home prize modal; this is the single
// source for the surfaces where the money is actually decided (Hall of Glory
// all-time tab, game-over when a seat is held).
export const PRIZE_SEATS = [50, 30, 20] as const

export const prizeForSeat = (rank: number): number | null =>
  rank >= 1 && rank <= PRIZE_SEATS.length ? PRIZE_SEATS[rank - 1] : null
