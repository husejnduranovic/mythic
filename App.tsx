import React, { useEffect, useState } from "react"
import * as NavigationBar from "expo-navigation-bar"
import { StatusBar } from "expo-status-bar"
import auth from "@react-native-firebase/auth"
import Game from "./src/components/Game"
import Scoreboard from "./src/components/Scoreboard"
import HomeScreen from "./src/components/Homescreen"
import Armory, { migrateArmoryIfNeeded } from "./src/components/Armory"
import AuthScreen from "./src/components/Authscreen"
import IntroScreen, { hasSeenIntro } from "./src/components/Introscreen"
import { SoundService } from "./src/services/SoundService"
import Profile from "./src/components/Profile"
import ArenaScreen from "./src/components/Arenascreen"
import LoungeScreen from "./src/components/LoungeScreen"
import { getLoungeInfo, getSavedLoungeCode } from "./src/services/LoungeService"
import * as SplashScreen from "expo-splash-screen"
import { firestore } from "./src/services/Firebase"
import { View } from "react-native"
import { logError } from "./src/services/logError"
import { usePresence } from "./src/hooks/usePresence"
import { useUserStats } from "./src/hooks/useUserStats"
import VersionGate from "./src/components/VersionGate"

SplashScreen.preventAutoHideAsync()

interface UserData {
  uid: string
  heroName: string
  email: string
}

type Screen =
  | "home"
  | "game"
  | "scores"
  | "armory"
  | "daily"
  | "profile"
  | "arena"
  | "arenaGame"
  | "lounge"

function App() {
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [screen, setScreen] = useState<Screen>("home")
  const [roomCode, setRoomCode] = useState("")

  const [loungeCode, setLoungeCode] = useState<string | null>(null)
  const [loungeName, setLoungeName] = useState<string | null>(null)

  const [showRules, setShowRules] = useState(false)

  const onlineCount = usePresence(user?.uid)
  const { currentStreak, bestStreak } = useUserStats(user?.uid)

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden")
    NavigationBar.setBehaviorAsync("overlay-swipe")
    SoundService.init()
  }, [])

  useEffect(() => {
    migrateArmoryIfNeeded()
  }, [])

  useEffect(() => {
    hasSeenIntro().then(setIntroSeen)
    getSavedLoungeCode().then(async (code) => {
      if (code) {
        setLoungeCode(code)
        const info = await getLoungeInfo(code)
        if (info) setLoungeName(info.name)
      }
    })
  }, [])

  useEffect(() => {
    if (introSeen !== null) {
      setTimeout(() => {
        SplashScreen.hideAsync()
      }, 2000)
    }
  }, [introSeen])

  const handleLogout = async () => {
    try {
      if (user) {
        await firestore()
          .collection("users")
          .doc(user.uid)
          .update({
            isOnline: false,
            lastSeen: firestore.FieldValue.serverTimestamp(),
          })
          .catch(() => {})
      }
      await auth().signOut()
      setUser(null)
      setScreen("home")
    } catch (err) {
      logError("App.handleLogout", err)
    }
  }
  if (introSeen === null) return null // loading
  if (introSeen === false)
    return (
      <>
        <StatusBar hidden />
        <IntroScreen onComplete={() => setIntroSeen(true)} />
      </>
    )
  // Not logged in — show auth
  if (!user)
    return (
      <>
        <StatusBar hidden />
        <AuthScreen onAuthenticated={setUser} />
      </>
    )

  // "How to play" is an overlay independent of the active screen
  if (showRules)
    return (
      <>
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: "#0B1410" }}>
          <IntroScreen
            onComplete={() => setShowRules(false)}
            skipAnimation
            showReturnButton
            onReturnHome={() => setShowRules(false)}
          />
        </View>
      </>
    )

  // Logged in — normal game flow
  const screens: Record<Screen, () => React.ReactElement> = {
    home: () => (
      <HomeScreen
        onPlay={() => setScreen("game")}
        onScoreboard={() => setScreen("scores")}
        onArmory={() => setScreen("armory")}
        heroName={user.heroName}
        onDailyQuest={() => setScreen("daily")}
        onLogout={handleLogout}
        onProfile={() => setScreen("profile")}
        onArena={() => setScreen("arena")}
        onLounge={() => setScreen("lounge")}
        loungeCode={loungeCode}
        loungeName={loungeName}
        onlineCount={onlineCount}
        currentStreak={currentStreak}
        bestStreak={bestStreak}
        onHowToPlay={() => setShowRules(true)}
      />
    ),
    game: () => (
      <Game
        onHome={() => setScreen("home")}
        uid={user.uid}
        heroName={user.heroName}
      />
    ),
    daily: () => (
      <Game
        onHome={() => setScreen("home")}
        dailyMode
        uid={user.uid}
        heroName={user.heroName}
      />
    ),
    scores: () => (
      <Scoreboard onBack={() => setScreen("home")} uid={user?.uid} />
    ),
    armory: () => <Armory onBack={() => setScreen("home")} />,
    profile: () => (
      <Profile
        onBack={() => setScreen("home")}
        uid={user.uid}
        heroName={user.heroName}
        onNameChange={(newName) =>
          setUser((prev) => (prev ? { ...prev, heroName: newName } : prev))
        }
      />
    ),
    arena: () => (
      <ArenaScreen
        onBack={() => setScreen("home")}
        onGameStart={(code, isHost) => {
          setRoomCode(code)
          setScreen("arenaGame")
        }}
        uid={user.uid}
        heroName={user.heroName}
      />
    ),
    arenaGame: () => (
      <Game
        onHome={() => setScreen("home")}
        uid={user.uid}
        heroName={user.heroName}
        arenaMode
        roomCode={roomCode}
      />
    ),
    lounge: () => (
      <LoungeScreen
        onBack={() => setScreen("home")}
        onPlay={() => setScreen("game")}
        uid={user.uid}
        heroName={user.heroName}
      />
    ),
  }

  const renderScreen = screens[screen] ?? screens.home

  return (
    <>
      <StatusBar hidden />
      {renderScreen()}
    </>
  )
}

const AppWithGate = () => (
  <VersionGate>
    <App />
  </VersionGate>
)

export default AppWithGate
