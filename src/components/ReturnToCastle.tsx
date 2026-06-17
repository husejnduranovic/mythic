// ─── components/ReturnTocastle.tsx ───

import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Icon } from "../ui/Icon"
import { color } from "../ui/theme"

interface ReturnToCastleProps {
  onPress: () => void
  label?: string
}

const ReturnToCastle = ({
  onPress,
  label = "RETURN TO CASTLE",
}: ReturnToCastleProps) => (
  <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.ornLine} />
    <Icon name="castle" size={14} color={color.goldFaded} />
    <Text style={styles.text}>{label}</Text>
    <View style={styles.ornLine} />
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  ornLine: {
    width: 24,
    height: 1,
    backgroundColor: color.goldLine,
  },
  text: {
    color: color.goldFaded,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
})

export default ReturnToCastle
