// GoldButton — the shared primary-action button (DESIGN_PLAN §3 P1-1).
// Lifted from Home's "Enter Battle" CTA so every screen's main action carries
// the same craft: gold fill, an engraved inner pinstripe, a Cinzel label, and a
// coloured shadow. Variants: primary (gold), ember (Glory Hunt), danger (retreat).
// Presses carry the war table's dais-punch weight: dip on press-in, spring back
// with overshoot — event-driven native transforms, inert while idle.

import React, { useRef } from "react"
import {
  Animated,
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
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export const GoldButton = ({
  label,
  onPress,
  icon,
  variant = "primary",
  subtitle,
  disabled = false,
  style,
}: GoldButtonProps) => {
  const v = VARIANTS[variant]
  const danger = variant === "danger"

  const scale = useRef(new Animated.Value(1)).current
  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 40,
      bounciness: 0,
      useNativeDriver: true,
    }).start()
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      speed: 24,
      bounciness: 9,
      useNativeDriver: true,
    }).start()

  // Disabled per the §3 spec — a washed engraving, unmistakably inert (the
  // old callers faked it with opacity, which kept the "looks enabled" glow).
  const fg = disabled ? "rgba(232,197,71,0.35)" : v.fg

  // Caller layout styles (margins, width, flex, absolute) stay on the outer
  // animated wrapper — the same node position as before — while the touchable
  // stretches to fill it, so existing call sites lay out identically.
  return (
    <Animated.View style={[gb.wrap, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        style={[
          gb.btn,
          disabled
            ? {
                backgroundColor: "rgba(232,197,71,0.10)",
                borderColor: color.goldLine,
                shadowOpacity: 0,
                elevation: 0,
              }
            : {
                backgroundColor: v.bg,
                borderColor: v.border,
                shadowColor: v.shadow,
                shadowOpacity: danger ? 0 : 0.45,
                elevation: danger ? 0 : 8,
              },
        ]}
        onPress={onPress}
        onPressIn={disabled ? undefined : pressIn}
        onPressOut={disabled ? undefined : pressOut}
        activeOpacity={0.92}
        disabled={disabled}
      >
        {!danger && !disabled && (
          <View style={[gb.pinstripe, { borderColor: v.pin }]} pointerEvents="none" />
        )}
        {icon && <Icon name={icon} size={16} color={fg} />}
        <View style={gb.labelWrap}>
          <Text style={[gb.label, { color: fg }]} numberOfLines={1}>
            {label}
          </Text>
          {subtitle && (
            <Text style={[gb.subtitle, { color: fg }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const gb = StyleSheet.create({
  // minWidth lives on the wrapper so caller overrides (minWidth: 0, flex,
  // width) keep working — the touchable stretches to whatever the wrapper is.
  wrap: {
    minWidth: 230,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 12,
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
