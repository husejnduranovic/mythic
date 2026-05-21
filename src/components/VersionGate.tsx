import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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
        <ActivityIndicator size="large" color="#E8C547" />
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

        {/* Icon */}
        <Text style={styles.crownIcon}>⚔</Text>

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
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => Linking.openURL(url)}
          activeOpacity={0.85}
        >
          <Text style={styles.updateBtnIcon}>⚔</Text>
          <Text style={styles.updateBtnText}>UPDATE NOW</Text>
          <Text style={styles.updateBtnIcon}>⚔</Text>
        </TouchableOpacity>

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
    backgroundColor: "#0B1410",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  // Update required screen
  updateContainer: {
    flex: 1,
    backgroundColor: "#0B1410",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  bgLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgGlow: {
    position: "absolute",
    top: "25%",
    left: "20%",
    width: "60%",
    height: "50%",
    borderRadius: 300,
    backgroundColor: "rgba(232,197,71,0.05)",
  },
  bgRune: {
    position: "absolute",
    fontSize: 28,
    color: "rgba(232,197,71,0.07)",
  },
  ornRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  ornLine: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.25)",
  },
  ornDot: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 10,
  },
  crownIcon: {
    fontSize: 72,
    marginBottom: 16,
    color: "#E8C547",
    textShadowColor: "rgba(232,197,71,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  titleText: {
    color: "rgba(232,197,71,0.7)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 5,
    marginBottom: 6,
  },
  titleDivider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.3)",
    marginBottom: 6,
  },
  subtitleText: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 6,
    marginBottom: 24,
    textShadowColor: "rgba(232,197,71,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  bodyText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: 0.5,
    marginBottom: 32,
    maxWidth: 320,
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(232,197,71,0.12)",
    borderWidth: 1.5,
    borderColor: "#E8C547",
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    // shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  updateBtnIcon: {
    fontSize: 16,
    color: "#E8C547",
    textShadowColor: "rgba(232,197,71,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  updateBtnText: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
})

export default VersionGate
