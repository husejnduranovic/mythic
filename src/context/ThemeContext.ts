import { createContext, useContext } from "react"
import { BOUNTY_FALLBACK_SIGIL, SigilSpec } from "../ui/sigils"

export const CardBackColorContext = createContext<string>("#162A47")
export const useCardBackColor = () => useContext(CardBackColorContext)

export const BountyStyleContext = createContext<{
  backColor: string
  accent: string
  frontBg: string
  textColor: string
  // Monochrome treasure glyph rendered on the bounty card, in-game and in the
  // Armory miniatures alike (ui/sigils.tsx). The old emoji `icon` field is gone.
  sigil?: SigilSpec
}>({
  backColor: "#0D0D0D",
  accent: "#DAA520",
  frontBg: "#FDF8E8",
  textColor: "#B8860B",
  sigil: BOUNTY_FALLBACK_SIGIL,
})

export const useBountyStyle = () => useContext(BountyStyleContext)

// Combo tier at the moment a card is vanquished, read by the capture flash.
// Deliberately a ref-in-context: the value object is stable, so combo changes
// never re-render the 28 memoized field cards — FallingCard reads .current
// once, at the instant it mounts.
export const VanquishTierContext = createContext<{ current: number }>({
  current: 0,
})

export const useVanquishTier = () => useContext(VanquishTierContext)
