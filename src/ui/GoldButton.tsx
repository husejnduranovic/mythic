// GoldButton — the shared primary-action button (DESIGN_PLAN §3 P1-1).
// Lifted from Home's "Enter Battle" CTA so every screen's main action carries
// the same craft: gold fill, an engraved inner pinstripe, a Cinzel label, and a
// coloured shadow. Variants: primary (gold), ember (Glory Hunt), danger (retreat).

import React from "react"
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { Icon, IconName } from "./Icon"
import { color, font } from "./theme"

type Variant = "primary" | "ember" | "danger"

const VARIANTS: Record<
  Variant,
  { bg: string; fg: string; border: string; pin: string; shadow: string }
> = {
  primary: {
    bg: color.gold,
    fg: color.ink,
    border: color.goldDeep,
    pin: "rgba(26,26,26,0.18)",
    shadow: color.gold,
  },
  ember: {
    bg: color.ember,
    fg: "#fff",
    border: "#C2410C",
    pin: "rgba(0,0,0,0.2)",
    shadow: color.ember,
  },
  // Restrained destructive action — outline, not a loud fill.
  danger: {
    bg: "rgba(192,57,43,0.1)",
    fg: "#D9604F",
    border: "rgba(192,57,43,0.5)",
    pin: "transparent",
    shadow: "transparent",
  },
}

interface GoldButtonProps {
  label: string
  onPress: () => void
  icon?: IconName
  variant?: Variant
  subtitle?: string
  style?: StyleProp<ViewStyle>
}

export const GoldButton = ({
  label,
  onPress,
  icon,
  variant = "primary",
  subtitle,
  style,
}: GoldButtonProps) => {
  const v = VARIANTS[variant]
  const danger = variant === "danger"
  return (
    <TouchableOpacity
      style={[
        gb.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          shadowColor: v.shadow,
          shadowOpacity: danger ? 0 : 0.45,
          elevation: danger ? 0 : 8,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {!danger && (
        <View style={[gb.pinstripe, { borderColor: v.pin }]} pointerEvents="none" />
      )}
      {icon && <Icon name={icon} size={16} color={v.fg} />}
      <View style={gb.labelWrap}>
        <Text style={[gb.label, { color: v.fg }]} numberOfLines={1}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[gb.subtitle, { color: v.fg }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const gb = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 230,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  // The engraved inset pinstripe — the Home CTA's signature detail.
  pinstripe: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 9,
    borderWidth: 1,
  },
  labelWrap: { alignItems: "center" },
  label: {
    fontFamily: font.heading,
    fontSize: 15,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    opacity: 0.7,
    marginTop: 1,
  },
})
