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
