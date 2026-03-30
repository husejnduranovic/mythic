import { createContext, useContext } from "react"

export const CardBackColorContext = createContext<string>("#162A47")
export const useCardBackColor = () => useContext(CardBackColorContext)
