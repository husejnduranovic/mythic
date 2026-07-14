import React, { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import messaging from "@react-native-firebase/messaging"
import { Icon } from "../ui/Icon"
import { GoldButton } from "../ui/GoldButton"
import { color, font, radius } from "../ui/theme"
import { withAlpha } from "../ui/honor"

// ─────────────────────────────────────────────────────────────────────────────
// Auth / sign-in / hero-name. Brought onto the design system (DESIGN_PLAN §2/§3,
// §3.3 "Auth/Intro could reuse shared components"): token palette, Cinzel titles,
// the brand splash's title-lockup + ornate divider grammar, GoldButton CTAs, MCI
// chrome, safe-area insets. The four card-face beasts stay emoji (§9, illustration).
// Auth flow / validation / Firebase calls unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const WEB_CLIENT_ID =
  "644045789931-jfeqrr0361mu1qpf6b4si9447bhi21gg.apps.googleusercontent.com"

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID })

interface AuthScreenProps {
  onAuthenticated: (user: {
    uid: string
    heroName: string
    email: string
    isAnon: boolean
  }) => void
}

const AuthScreen = ({ onAuthenticated }: AuthScreenProps) => {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<"signin" | "heroname" | "loading">("loading")
  const [heroName, setHeroName] = useState("")
  const [error, setError] = useState("")
  const [uid, setUid] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (!user) {
        // First open (or post-logout): no wall. Sign in anonymously and go
        // straight to Home — the anon session re-fires this listener below.
        // If the Anonymous provider isn't enabled yet (owner console gate), we
        // fall back to the Google door so the app is never bricked.
        try {
          setStep("loading")
          await auth().signInAnonymously()
        } catch (err: any) {
          console.warn("Anonymous sign-in failed:", err?.code || err)
          setStep("signin")
        }
        return
      }
      if (user.isAnonymous) {
        // Anon plays free battles on a device identity only — no users doc, no
        // heroname wall. Identity (Hall/Daily/Arena/Lounge, score submit)
        // unlocks at the link moment (game-over "etch your name").
        onAuthenticated({
          uid: user.uid,
          heroName: "Wanderer",
          email: "",
          isAnon: true,
        })
        return
      }
      setUid(user.uid)
      setEmail(user.email || "")
      const doc = await firestore().collection("users").doc(user.uid).get()
      if (doc.exists() && doc.data()?.heroName) {
        onAuthenticated({
          uid: user.uid,
          heroName: doc.data()!.heroName,
          email: user.email || "",
          isAnon: false,
        })
        // Subscribe to all-time record notifications
        messaging()
          .subscribeToTopic("alltime-record")
          .catch(() => {})
      } else {
        setStep("heroname")
      }
    })
    return unsubscribe
  }, [])

  const handleGoogleSignIn = async () => {
    try {
      setError("")
      setStep("loading")
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      const signInResult = await GoogleSignin.signIn()
      const idToken = signInResult?.data?.idToken
      if (!idToken) {
        setError("Could not get ID token")
        setStep("signin")
        return
      }
      const googleCredential = auth.GoogleAuthProvider.credential(idToken)
      await auth().signInWithCredential(googleCredential)
    } catch (err: any) {
      console.error("FULL ERROR:", JSON.stringify(err, null, 2))
      setError(`Code: ${err.code} | ${err.message}`)
      setStep("signin")
    }
  }

  const handleSetHeroName = async () => {
    const trimmed = heroName.trim()
    if (trimmed.length < 2) {
      setError("Hero name must be at least 2 characters")
      return
    }
    if (trimmed.length > 16) {
      setError("Hero name must be 16 characters or less")
      return
    }
    try {
      setError("")
      setStep("loading")

      // Check if name is already taken
      const existing = await firestore()
        .collection("users")
        .where("heroName", "==", trimmed)
        .limit(1)
        .get()

      if (!existing.empty && existing.docs[0].id !== uid) {
        setError("This hero name is already taken")
        setStep("heroname")
        return
      }

      await firestore().collection("users").doc(uid).set(
        {
          heroName: trimmed,
          email,
          createdAt: firestore.FieldValue.serverTimestamp(),
          gamesPlayed: 0,
          totalScore: 0,
          bestScore: 0,
          bestCombo: 0,
        },
        { merge: true },
      )
      onAuthenticated({ uid, heroName: trimmed, email, isAnon: false })
      messaging()
        .subscribeToTopic("alltime-record")
        .catch(() => {})
    } catch (err: any) {
      setError("Failed to save hero name")
      setStep("heroname")
    }
  }

  // Shared background — scattered runes + a hairline (the splash's established grammar).
  const background = (
    <View style={styles.bgLayer} pointerEvents="none">
      <Text style={[styles.bgRune, { top: "12%", left: "8%" }]}>ᚠ</Text>
      <Text style={[styles.bgRune, { top: "16%", right: "10%" }]}>ᚦ</Text>
      <Text style={[styles.bgRune, { bottom: "18%", left: "12%" }]}>ᚱ</Text>
      <Text style={[styles.bgRune, { bottom: "22%", right: "8%" }]}>ᛟ</Text>
      <View style={styles.bgHLine} />
    </View>
  )

  const pad = { paddingLeft: insets.left, paddingRight: insets.right }

  if (step === "loading")
    return (
      <View style={[styles.container, pad]}>
        {background}
        <ActivityIndicator size="large" color={color.gold} />
        <Text style={styles.loadText}>ENTERING THE REALM…</Text>
      </View>
    )

  if (step === "heroname")
    return (
      <View style={[styles.container, pad]}>
        {background}
        <View style={styles.headerOrn}>
          <View style={styles.ornLine} />
          <Icon name="sword-cross" size={16} color={color.gold} />
          <View style={styles.ornLine} />
        </View>
        <Text style={styles.title}>CHOOSE YOUR NAME</Text>
        <Text style={styles.subtitle}>
          This is how other warriors will know you
        </Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter hero name…"
            placeholderTextColor={withAlpha(color.gold, 0.3)}
            value={heroName}
            onChangeText={setHeroName}
            maxLength={16}
            autoFocus
          />
          <Text style={styles.charCount}>{heroName.length}/16</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <GoldButton
          label="ENTER THE ARENA"
          icon="sword-cross"
          onPress={handleSetHeroName}
          disabled={heroName.trim().length < 2}
        />
      </View>
    )

  return (
    <View style={[styles.container, pad]}>
      {background}
      <Text style={styles.beastRow}>🐉 🦅 🐺 🐍</Text>
      <Text style={styles.title}>MYTHIC PEAKS</Text>
      <Text style={styles.tagline}>A Card Game of Beasts & Glory</Text>
      <View style={styles.divider} />
      {/* The stakes, before the first battle (MARKET.md A-5) — Home's prize
          pill grammar, shown to every fresh install at the door. */}
      <View style={styles.prizePill}>
        <Icon name="trophy-variant" size={14} color="rgba(255,215,0,0.85)" />
        <Text style={styles.prizePillText}>€100 MONTHLY PRIZE</Text>
        <View style={styles.prizePillLive}>
          <Text style={styles.prizePillLiveText}>LIVE</Text>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <GoldButton
        label="CONTINUE WITH GOOGLE"
        icon="google"
        onPress={handleGoogleSignIn}
      />
      <Text style={styles.footnote}>
        Sign in to compete on global leaderboards
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bgBase,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  // Background — established splash grammar.
  bgLayer: { ...StyleSheet.absoluteFillObject },
  bgRune: {
    position: "absolute",
    color: withAlpha(color.gold, 0.04),
    fontSize: 30,
  },
  bgHLine: {
    position: "absolute",
    top: "50%",
    left: "10%",
    right: "10%",
    height: 1,
    backgroundColor: color.goldLine,
  },
  loadText: {
    color: color.goldFaded,
    fontSize: 12,
    marginTop: 12,
    letterSpacing: 2.5,
    fontWeight: "800",
  },
  beastRow: { fontSize: 30, letterSpacing: 8, marginBottom: 4 },
  title: {
    fontFamily: font.display,
    color: color.gold,
    fontSize: 38,
    letterSpacing: 4,
    textShadowColor: withAlpha(color.gold, 0.4),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: color.goldFaded,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    color: color.goldFaded,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
  },
  // The stakes pill — mirrors Home's prize tag so the promise is consistent
  // from the door to the hall.
  prizePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,215,0,0.05)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.15)",
  },
  prizePillText: {
    color: "rgba(255,215,0,0.75)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  prizePillLive: {
    backgroundColor: "rgba(123,237,159,0.15)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "rgba(123,237,159,0.3)",
  },
  prizePillLiveText: {
    color: color.sage,
    fontSize: 6,
    fontWeight: "900",
    letterSpacing: 2,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: color.goldLine,
    marginVertical: 6,
  },
  // Ornate header rule — the — ◆ — motif (tokenized).
  headerOrn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  ornLine: { width: 24, height: 1, backgroundColor: color.goldLine },
  footnote: { color: withAlpha(color.gold, 0.3), fontSize: 10, marginTop: 4 },
  inputWrap: { position: "relative", width: "100%", maxWidth: 280 },
  input: {
    backgroundColor: color.goldWash,
    borderWidth: 1.5,
    borderColor: color.goldLine,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: color.gold,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
  },
  charCount: {
    position: "absolute",
    right: 12,
    top: 14,
    color: withAlpha(color.gold, 0.25),
    fontSize: 10,
  },
  error: { color: color.crimson, fontSize: 12, fontWeight: "700" },
})

export default AuthScreen
