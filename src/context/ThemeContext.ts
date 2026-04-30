import { createContext, useContext } from "react"

export const CardBackColorContext = createContext<string>("#162A47")
export const useCardBackColor = () => useContext(CardBackColorContext)

export const BountyStyleContext = createContext<{
  backColor: string
  accent: string
  frontBg: string
  textColor: string
  icon: string
}>({
  backColor: "#0D0D0D",
  accent: "#DAA520",
  frontBg: "#FDF8E8",
  textColor: "#B8860B",
  icon: "💰",
})

export const useBountyStyle = () => useContext(BountyStyleContext)
