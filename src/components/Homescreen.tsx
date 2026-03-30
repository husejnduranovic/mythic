import React, { useEffect, useRef } from "react"
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

interface HomeScreenProps {
  onPlay: () => void
  onScoreboard: () => void
  onArmory?: () => void
  onMultiplayer?: () => void
  heroName?: string
  uid?: string
  onDailyQuest?: () => void
  onLogout?: () => void
}

const BEASTS = ["🐉", "🦅", "🐺", "🐍"]

const HomeScreen = ({
  onPlay,
  onScoreboard,
  onArmory,
  onMultiplayer,
  heroName,
  onDailyQuest,
  onLogout,
}: HomeScreenProps) => {
  const titleScale = useRef(new Animated.Value(0.8)).current
  const titleOpacity = useRef(new Animated.Value(0)).current
  const btnOpacity = useRef(new Animated.Value(0)).current
  const btnY = useRef(new Animated.Value(30)).current
  const bgOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(btnY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(bgOpacity, {
        toValue: 0.06,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bgIcons, { opacity: bgOpacity }]}>
        {Array.from({ length: 16 }).map((_, i) => (
          <Text
            key={i}
            style={[
              styles.bgIcon,
              {
                top: `${(i * 19) % 85}%`,
                left: `${(i * 27 + 5) % 88}%`,
                fontSize: 24 + (i % 3) * 14,
                transform: [{ rotate: `${i * 43}deg` }],
              },
            ]}
          >
            {BEASTS[i % 4]}
          </Text>
        ))}
      </Animated.View>

      {/* Left side — Title */}
      <Animated.View
        style={[
          styles.titleSection,
          { opacity: titleOpacity, transform: [{ scale: titleScale }] },
        ]}
      >
        <View style={styles.beastRow}>
          {BEASTS.map((b, i) => (
            <Text key={i} style={styles.beastDeco}>
              {b}
            </Text>
          ))}
        </View>
        <Text style={styles.title}>MYTHIC</Text>
        <Text style={styles.subtitle}>PEAKS</Text>
        <View style={styles.titleDivider} />
        <Text style={styles.heroGreeting}>⚔ {heroName} ⚔</Text>
        <Text style={styles.tagline}>A Card Game of Beasts & Glory</Text>
      </Animated.View>

      {/* Right side — Menu buttons */}
      <Animated.View
        style={[
          styles.menuSection,
          { opacity: btnOpacity, transform: [{ translateY: btnY }] },
        ]}
      >
        {/* Primary — Play */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={onPlay}
          activeOpacity={0.8}
        >
          <Text style={styles.playIcon}>⚔</Text>
          <Text style={styles.playText}>Enter Battle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dailyBtn}
          onPress={onDailyQuest}
          activeOpacity={0.8}
        >
          <Text style={styles.dailyTop}>📜 DAILY QUEST</Text>
          <Text style={styles.dailyTitle}>⚔ PROVE YOUR WORTH ⚔</Text>
          <Text style={styles.dailyBottom}>
            Same deck for all warriors — one chance per day
          </Text>
        </TouchableOpacity>

        {/* Secondary row */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secBtn}
            onPress={onMultiplayer}
            activeOpacity={0.8}
          >
            <Text style={styles.secIcon}>🏟</Text>
            <Text style={styles.secText}>Arena</Text>
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secBtn}
            onPress={onArmory}
            activeOpacity={0.8}
          >
            <Text style={styles.secIcon}>🛡</Text>
            <Text style={styles.secText}>Armory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secBtn}
            onPress={onScoreboard}
            activeOpacity={0.8}
          >
            <Text style={styles.secIcon}>🏆</Text>
            <Text style={styles.secText}>Glory</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      {onLogout && (
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.footer}>
        5 Battlefields • 4 Beast Clans • Infinite Glory
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A12",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  bgIcons: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgIcon: { position: "absolute", color: "#fff" },

  titleSection: { flex: 1, alignItems: "center", paddingRight: 20 },
  beastRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  beastDeco: { fontSize: 24 },
  title: {
    fontSize: 46,
    fontWeight: "900",
    color: "#E8C547",
    letterSpacing: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "300",
    color: "rgba(232,197,71,0.6)",
    letterSpacing: 16,
    marginTop: -4,
  },
  titleDivider: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.2)",
    marginVertical: 8,
  },
  tagline: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },

  menuSection: { flex: 1, maxWidth: 280, gap: 12 },

  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8C547",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playIcon: { fontSize: 18 },
  playText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: 2,
  },

  secondaryRow: { flexDirection: "row", gap: 8 },
  secBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.15)",
    backgroundColor: "rgba(232,197,71,0.04)",
    position: "relative",
  },
  secIcon: { fontSize: 20, marginBottom: 4 },
  secText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(232,197,71,0.6)",
    letterSpacing: 1,
  },
  soonBadge: {
    position: "absolute",
    top: -6,
    right: -4,
    backgroundColor: "#FF6B35",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  soonText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },

  footer: {
    position: "absolute",
    bottom: 14,
    color: "rgba(255,255,255,0.12)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  heroGreeting: {
    color: "#E8C547",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 4,
    paddingBottom: 4,
  },
  dailyBtn: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
  },
  dailyTop: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
  },
  dailyTitle: {
    color: "#E8C547",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3,
    marginVertical: 2,
  },
  dailyBottom: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
  },
  dailyInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  dailyScroll: { fontSize: 22 },
  dailyTextWrap: { flex: 1 },
  dailySub: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 1,
  },
  dailyArrow: { color: "#E8C547", fontSize: 18, fontWeight: "900" },
  dailyIcon: { fontSize: 16 },
  dailyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#E8C547",
    letterSpacing: 2,
  },
  logoutBtn: {
    position: "absolute",
    bottom: 10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  logoutText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
})

export default HomeScreen
