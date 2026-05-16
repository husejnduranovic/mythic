// ─── components/ReturnTocastle.tsx ───

import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

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
    <Text style={styles.icon}>🏰</Text>
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
    backgroundColor: "rgba(232,197,71,0.2)",
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: "rgba(232,197,71,0.55)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
})

export default ReturnToCastle
