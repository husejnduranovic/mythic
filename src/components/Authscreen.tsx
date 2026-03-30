import React, { useEffect, useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

const WEB_CLIENT_ID =
  "644045789931-jfeqrr0361mu1qpf6b4si9447bhi21gg.apps.googleusercontent.com"

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID })

interface AuthScreenProps {
  onAuthenticated: (user: {
    uid: string
    heroName: string
    email: string
  }) => void
}

const AuthScreen = ({ onAuthenticated }: AuthScreenProps) => {
  const [step, setStep] = useState<"signin" | "heroname" | "loading">("loading")
  const [heroName, setHeroName] = useState("")
  const [error, setError] = useState("")
  const [uid, setUid] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid)
        setEmail(user.email || "")
        const doc = await firestore().collection("users").doc(user.uid).get()
        if (doc.exists() && doc.data()?.heroName) {
          onAuthenticated({
            uid: user.uid,
            heroName: doc.data()!.heroName,
            email: user.email || "",
          })
        } else {
          setStep("heroname")
        }
      } else {
        setStep("signin")
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
      console.error("Google Sign-In error:", err)
      setError(err.message || "Sign-in failed")
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
      onAuthenticated({ uid, heroName: trimmed, email })
    } catch (err: any) {
      setError("Failed to save hero name")
      setStep("heroname")
    }
  }

  if (step === "loading")
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E8C547" />
        <Text style={styles.loadText}>Entering the realm...</Text>
      </View>
    )

  if (step === "heroname")
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⚔ CHOOSE YOUR NAME ⚔</Text>
        <Text style={styles.subtitle}>
          This is how other warriors will know you
        </Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Enter hero name..."
            placeholderTextColor="rgba(232,197,71,0.3)"
            value={heroName}
            onChangeText={setHeroName}
            maxLength={16}
            autoFocus
          />
          <Text style={styles.charCount}>{heroName.length}/16</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[
            styles.goldBtn,
            heroName.trim().length < 2 && styles.goldBtnDisabled,
          ]}
          onPress={handleSetHeroName}
          disabled={heroName.trim().length < 2}
        >
          <Text style={styles.goldBtnText}>⚔ Enter the Arena</Text>
        </TouchableOpacity>
      </View>
    )

  return (
    <View style={styles.container}>
      <Text style={styles.beastRow}>🐉 🦅 🐺 🐍</Text>
      <Text style={styles.title}>MYTHIC PEAKS</Text>
      <Text style={styles.tagline}>A Card Game of Beasts & Glory</Text>
      <View style={styles.divider} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn}>
        <Text style={styles.googleIcon}>⚔</Text>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
      <Text style={styles.footnote}>
        Sign in to compete on global leaderboards
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1A12",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadText: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 14,
    marginTop: 12,
    letterSpacing: 1,
  },
  beastRow: { fontSize: 28, letterSpacing: 8 },
  title: {
    color: "#E8C547",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 6,
  },
  subtitle: { color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 4 },
  tagline: { color: "rgba(232,197,71,0.4)", fontSize: 12, letterSpacing: 2 },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
    marginVertical: 4,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#E8C547",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 240,
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  googleIcon: { fontSize: 18 },
  googleText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: 1,
  },
  footnote: { color: "rgba(255,255,255,0.15)", fontSize: 10, marginTop: 4 },
  inputWrap: { position: "relative", width: "100%", maxWidth: 280 },
  input: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#E8C547",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
  },
  charCount: {
    position: "absolute",
    right: 12,
    top: 14,
    color: "rgba(232,197,71,0.25)",
    fontSize: 10,
  },
  error: { color: "#FF6B6B", fontSize: 12, fontWeight: "600" },
  goldBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 200,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  goldBtnDisabled: { opacity: 0.4 },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
})

export default AuthScreen
