import { ICard } from "../components/Card"

const SUITS: ICard["suit"][] = ["hearts", "diamonds", "clubs", "spades"]

const VALUES = [
  { value: "1", displayValue: "A" },
  { value: "2", displayValue: "2" },
  { value: "3", displayValue: "3" },
  { value: "4", displayValue: "4" },
  { value: "5", displayValue: "5" },
  { value: "6", displayValue: "6" },
  { value: "7", displayValue: "7" },
  { value: "8", displayValue: "8" },
  { value: "9", displayValue: "9" },
  { value: "10", displayValue: "10" },
  { value: "11", displayValue: "J" },
  { value: "12", displayValue: "Q" },
  { value: "13", displayValue: "K" },
]

// Standard random shuffle
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Seeded PRNG — mulberry32 (deterministic, same seed = same sequence)
const mulberry32 = (seed: number) => {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Convert a string to a numeric seed
const stringToSeed = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}

// Seeded shuffle — same seed always produces same order
const seededShuffle = <T>(arr: T[], seed: string): T[] => {
  const rng = mulberry32(stringToSeed(seed))
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const buildDeck = (): ICard[] => {
  const deck: ICard[] = []
  for (const suit of SUITS) {
    for (const { value, displayValue } of VALUES) {
      deck.push({ value, suit, displayValue, visible: true })
    }
  }
  return deck
}

// Regular random deck
export const generateDeck = (): ICard[] => shuffle(buildDeck())

// Daily deck — same for all players on the same date
// Seed format: "mythic-2026-03-27-level-1"
export const generateDailyDeck = (date: string, level: number): ICard[] => {
  const seed = `mythic-${date}-level-${level}`
  return seededShuffle(buildDeck(), seed)
}

// Get today's date string for daily challenge
export const getTodayString = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const isCardMatch = (a: ICard, b: ICard): boolean => {
  const av = parseInt(a.value)
  const bv = parseInt(b.value)
  if (av === 1) return bv === 2 || bv === 13
  if (bv === 1) return av === 2 || av === 13
  return Math.abs(av - bv) === 1
}
