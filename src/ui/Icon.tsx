// Shared icon wrapper — one family (MaterialCommunityIcons) for the whole app so
// chrome icons stay visually consistent and on-palette. Replaces system emoji used
// as UI chrome (DESIGN_PLAN §2). Card-face beasts (🐉🦅🐺🐍) are illustration and
// stay as-is until the art pass.
//
// @expo/vector-icons ships with Expo (no extra dependency) and loads its own glyph
// font via expo-font, so no manual font wiring is needed.

import React from "react"
import { StyleProp, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { color as palette } from "./theme"

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"]

interface IconProps {
  name: IconName
  size?: number
  color?: string
  style?: StyleProp<TextStyle>
}

export const Icon = ({
  name,
  size = 20,
  color = palette.goldFaded,
  style,
}: IconProps) => (
  <MaterialCommunityIcons name={name} size={size} color={color} style={style} />
)
