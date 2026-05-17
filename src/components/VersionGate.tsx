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
      try {
        const rc = getRemoteConfig()
        await setConfigSettings(rc, { minimumFetchIntervalMillis: 3600000 })
        await setDefaults(rc, { minimum_app_version: "1.0.0" })
        await fetchAndActivate(rc)

        const minVersion = getString(rc, "minimum_app_version")
        const currentVersion = DeviceInfo.getVersion()

        if (compareVersions(currentVersion, minVersion) < 0) {
          setNeedsUpdate(true)
        }
      } catch {
        // Fail open — if Remote Config errors, let the app run
      }
      setChecking(false)
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
      <View style={styles.center}>
        <Text style={styles.icon}>⚔</Text>
        <Text style={styles.title}>UPDATE REQUIRED</Text>
        <Text style={styles.body}>
          A new version of Mythic Peaks is available with important changes.
          Please update to continue your conquest.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => Linking.openURL(url)}
        >
          <Text style={styles.btnText}>⚔ UPDATE NOW</Text>
        </TouchableOpacity>
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
  icon: {
    fontSize: 64,
    marginBottom: 16,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 12,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  body: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  btn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D4A017",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
})

export default VersionGate
