import { useFonts } from "expo-font"
import { Cinzel_700Bold, Cinzel_900Black } from "@expo-google-fonts/cinzel"
import { MedievalSharp_400Regular } from "@expo-google-fonts/medievalsharp"
import { MaterialCommunityIcons } from "@expo/vector-icons"

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
    // Glyph fonts for the sigil system (ui/sigils.tsx). MCI normally lazy-loads on
    // first render; preloading both here (splash already waits on fonts) guarantees
    // card sigils never flash tofu on the first deal. FA5's multi-style set exposes
    // no merged .font map, so the solid face is required directly under the family
    // name its component requests ("FontAwesome5Free-Solid").
    ...MaterialCommunityIcons.font,
    "FontAwesome5Free-Solid": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf"),
  })
}
