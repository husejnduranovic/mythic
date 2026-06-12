// Quit / retreat confirmation modal. Extracted from Game.tsx (Step 1.6).

import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const QuitConfirmModal = ({
  dailyMode,
  score,
  onResume,
  onConfirmQuit,
}: {
  dailyMode: boolean
  score: number
  onResume: () => void
  onConfirmQuit: () => void
}) => (
  <View style={styles.quitOverlay}>
    <View style={styles.quitCard}>
      {/* Animated glow behind card — atmospheric */}
      <View style={styles.quitGlow} />

      {/* Top rune row */}
      <View style={styles.quitRuneRow}>
        <Text style={styles.quitRune}>ᚠ</Text>
        <View style={styles.quitOrnLine} />
        <Text style={styles.quitRune}>ᚦ</Text>
        <View style={styles.quitOrnLine} />
        <Text style={styles.quitRune}>ᚱ</Text>
      </View>

      {/* Main icon — skull on crossed swords */}
      <View style={styles.quitIconWrap}>
        <Text style={styles.quitIconBehind}>⚔️</Text>
        <Text style={styles.quitIconFront}>💀</Text>
      </View>

      {/* Title */}
      <Text style={styles.quitTitle}>RETREAT?</Text>
      <Text style={styles.quitSubtitle}>Your battle will be abandoned</Text>

      <View style={styles.quitDivider} />

      {/* Warning for daily */}
      {dailyMode && (
        <View style={styles.quitWarningBox}>
          <Text style={styles.quitWarningIcon}>⚠️</Text>
          <Text style={styles.quitWarningText}>
            Daily attempt will be lost!
          </Text>
        </View>
      )}

      {/* Score at stake */}
      {score > 0 && (
        <View style={styles.quitScoreBox}>
          <Text style={styles.quitScoreLabel}>⚔ SPOILS AT STAKE</Text>
          <Text style={styles.quitScoreValue}>{score.toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.quitDivider} />

      {/* Keep fighting — primary */}
      <TouchableOpacity
        style={styles.quitFightBtn}
        onPress={onResume}
        activeOpacity={0.85}
      >
        <Text style={styles.quitFightIcon}>⚔️</Text>
        <Text style={styles.quitFightText}>KEEP FIGHTING</Text>
        <Text style={styles.quitFightIcon}>⚔️</Text>
      </TouchableOpacity>

      {/* Retreat — secondary */}
      <TouchableOpacity
        style={styles.quitLeaveBtn}
        onPress={onConfirmQuit}
        activeOpacity={0.85}
      >
        <Text style={styles.quitLeaveIcon}>🏰</Text>
        <Text style={styles.quitLeaveText}>Retreat to Castle</Text>
      </TouchableOpacity>

      {/* Bottom rune row */}
      <View style={styles.quitRuneRow}>
        <Text style={styles.quitRune}>ᛟ</Text>
        <View style={styles.quitOrnLine} />
        <Text style={styles.quitRuneDot}>◆</Text>
        <View style={styles.quitOrnLine} />
        <Text style={styles.quitRune}>ᛏ</Text>
      </View>
    </View>
  </View>
)

const styles = StyleSheet.create({
  quitOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  quitCard: {
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0D0907",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.25)",
    paddingHorizontal: 36,
    paddingVertical: 20,
    minWidth: 300,
    maxWidth: 340,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 30,
    overflow: "hidden",
  },
  quitGlow: {
    position: "absolute",
    top: -40,
    left: "20%",
    width: "60%",
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(232,197,71,0.04)",
  },
  quitRuneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  quitOrnLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.1)",
  },
  quitRune: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 14,
    fontWeight: "400",
  },
  quitRuneDot: {
    color: "rgba(232,197,71,0.2)",
    fontSize: 7,
  },
  quitIconWrap: {
    position: "relative",
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  quitIconBehind: {
    position: "absolute",
    fontSize: 40,
    opacity: 0.25,
  },
  quitIconFront: {
    fontSize: 34,
    zIndex: 2,
  },
  quitTitle: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 8,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  quitSubtitle: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: -4,
  },
  quitDivider: {
    width: "70%",
    height: 1,
    backgroundColor: "rgba(232,197,71,0.08)",
  },
  quitWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,80,80,0.07)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: "100%",
  },
  quitWarningIcon: { fontSize: 16 },
  quitWarningText: {
    color: "rgba(255,120,120,0.8)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  quitScoreBox: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
    paddingHorizontal: 28,
    paddingVertical: 6,
    width: "100%",
  },
  quitScoreLabel: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 2,
  },
  quitScoreValue: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  quitFightBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#D4A017",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  quitFightIcon: { fontSize: 12 },
  quitFightText: {
    color: "#1a1a1a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 3,
  },
  quitLeaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  quitLeaveIcon: { fontSize: 16 },
  quitLeaveText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
})
