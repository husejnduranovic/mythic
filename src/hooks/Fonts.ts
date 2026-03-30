import { useFonts } from "expo-font"
import { Cinzel_700Bold, Cinzel_900Black } from "@expo-google-fonts/cinzel"
import { MedievalSharp_400Regular } from "@expo-google-fonts/medievalsharp"

export const FONTS = {
  title: "Cinzel_900Black",
  titleBold: "Cinzel_700Bold",
  game: "MedievalSharp_400Regular",
}

export const useGameFonts = () => {
  return useFonts({
    Cinzel_700Bold,
    Cinzel_900Black,
    MedievalSharp_400Regular,
  })
}
