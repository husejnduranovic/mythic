// Pure card-match rule — no React. Moved from CardService.ts (Step 1.2).

import { ICard } from "../components/Card"

export const isCardMatch = (a: ICard, b: ICard): boolean => {
  const av = parseInt(a.value)
  const bv = parseInt(b.value)
  if (av === 1) return bv === 2 || bv === 13
  if (bv === 1) return av === 2 || av === 13
  return Math.abs(av - bv) === 1
}
