import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
  fetchAndActivate,
  getString,
} from "@react-native-firebase/remote-config"
import DeviceInfo from "react-native-device-info"
import * as SplashScreen from "expo-splash-screen"
import { Icon } from "../ui/Icon"
import { GoldButton } from "../ui/GoldButton"
import { color, font } from "../ui/theme"
import { withAlpha } from "../ui/honor"

// ─────────────────────────────────────────────────────────────────────────────
// Version gate ("New Decree"). Brought onto the design system (DESIGN_PLAN §2/§3):
// token palette, Cinzel title, an MCI decree glyph in a ring medallion (the Guide's
// established medallion grammar), GoldButton CTA, and the — ◆ — ornament rules.
// Remote-config check / version compare / update flow unchanged.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
}

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.husejn.mythicpeaks"
const APP_STORE_URL = "https://apps.apple.com/app/idYOUR_APP_ID"

const compareVersions = (a: string, b: string): number => {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x !== y) return x - y
  }
  return 0
}

const VersionGate = ({ children }: Props) => {
  const [checking, setChecking] = useState(true)
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    const check = async () => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("RC timeout 5s")), 5000),
      )

      try {
        const rc = getRemoteConfig()
        await Promise.race([
          (async () => {
            await setConfigSettings(rc, { minimumFetchIntervalMillis: 3600000 })
            await setDefaults(rc, { minimum_app_version: "1.0.0" })
            await fetchAndActivate(rc)
          })(),
          timeout,
        ])

        const minVersion = getString(rc, "minimum_app_version")
        const currentVersion = DeviceInfo.getVersion()

        if (compareVersions(currentVersion, minVersion) < 0) {
          setNeedsUpdate(true)
        }
      } catch (e) {
        console.log("RC ERROR:", e)
      }
      setChecking(false)
      // Hide native splash screen so VersionGate's content can be seen
      await SplashScreen.hideAsync().catch(() => {})
    }
    check()
  }, [])

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={color.gold} />
      </View>
    )
  }

  if (needsUpdate) {
    const url = Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL
    return (
      <View style={styles.updateContainer}>
        {/* Background atmosphere */}
        <View style={styles.bgLayer} pointerEvents="none">
          <View style={styles.bgGlow} />
          <Text style={[styles.bgRune, { top: "8%", left: "6%" }]}>ᚠ</Text>
          <Text style={[styles.bgRune, { top: "12%", right: "8%" }]}>ᚦ</Text>
          <Text style={[styles.bgRune, { bottom: "15%", left: "10%" }]}>ᚱ</Text>
          <Text style={[styles.bgRune, { bottom: "20%", right: "7%" }]}>ᛟ</Text>
        </View>

        {/* Top ornament */}
        <View style={styles.ornRow}>
          <View style={styles.ornLine} />
          <Text style={styles.ornDot}>◆</Text>
          <View style={styles.ornLine} />
        </View>

        {/* Decree medallion */}
        <View style={styles.medallion}>
          <View style={styles.medallionHalo} />
          <Icon name="script-text-outline" size={40} color={color.gold} />
        </View>

        {/* Title */}
        <Text style={styles.titleText}>NEW DECREE</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.subtitleText}>UPDATE REQUIRED</Text>

        {/* Body */}
        <Text style={styles.bodyText}>
          A new version of Mythic Peaks awaits.{"\n"}
          Update now to continue your conquest.
        </Text>

        {/* Update button */}
        <GoldButton
          label="UPDATE NOW"
          icon="download"
          onPress={() => Linking.openURL(url)}
        />

        {/* Bottom ornament */}
        <View style={[styles.ornRow, { marginTop: 32 }]}>
          <View style={styles.ornLine} />
          <Text style={styles.ornDot}>◆</Text>
          <View style={styles.ornLine} />
        </View>
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: color.bgBase,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  // Update required screen
  updateContainer: {
    flex: 1,
    backgroundColor: color.bgBase,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  bgLayer: { ...StyleSheet.absoluteFillObject },
  bgGlow: {
    position: "absolute",
    top: "25%",
    left: "20%",
    width: "60%",
    height: "50%",
    borderRadius: 300,
    backgroundColor: withAlpha(color.gold, 0.05),
  },
  bgRune: {
    position: "absolute",
    fontSize: 28,
    color: withAlpha(color.gold, 0.07),
  },
  ornRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  ornLine: { width: 40, height: 1, backgroundColor: color.goldLine },
  ornDot: { color: color.goldFaded, fontSize: 10 },
  // Decree glyph in a ring medallion — the Guide's established grammar.
  medallion: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: color.goldLine,
    backgroundColor: color.goldWash,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  medallionHalo: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: withAlpha(color.gold, 0.08),
  },
  titleText: {
    color: color.goldFaded,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 5,
    marginBottom: 6,
  },
  titleDivider: {
    width: 60,
    height: 1,
    backgroundColor: color.goldLine,
    marginBottom: 8,
  },
  subtitleText: {
    color: color.gold,
    fontFamily: font.display,
    fontSize: 26,
    letterSpacing: 4,
    marginBottom: 24,
    textShadowColor: withAlpha(color.gold, 0.5),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  bodyText: {
    color: withAlpha("#FFFFFF", 0.55),
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.5,
    marginBottom: 28,
    maxWidth: 320,
  },
})

export default VersionGate
