import React, { useEffect, useState } from "react"
import * as NavigationBar from "expo-navigation-bar"
import { StatusBar } from "expo-status-bar"
import auth from "@react-native-firebase/auth"
import Game from "./src/components/Game"
import Scoreboard from "./src/components/Scoreboard"
import HomeScreen from "./src/components/Homescreen"
import Armory from "./src/components/Armory"
import AuthScreen from "./src/components/Authscreen"
import IntroScreen, { hasSeenIntro } from "./src/components/Introscreen"
import { SoundService } from "./src/services/SoundService"

interface UserData {
  uid: string
  heroName: string
  email: string
}

export default function App() {
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [screen, setScreen] = useState<
    "home" | "game" | "scores" | "armory" | "daily"
  >("home")

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden")
    NavigationBar.setBehaviorAsync("overlay-swipe")
    SoundService.init()
  }, [])

  useEffect(() => {
    hasSeenIntro().then(setIntroSeen)
  }, [])

  const handleLogout = async () => {
    try {
      await auth().signOut()
      setUser(null)
      setScreen("home")
    } catch {}
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

  // Logged in — normal game flow
  if (screen === "armory")
    return (
      <>
        <StatusBar hidden />
        <Armory onBack={() => setScreen("home")} />
      </>
    )

  if (screen === "daily")
    return (
      <>
        <StatusBar hidden />
        <Game
          onHome={() => setScreen("home")}
          dailyMode
          uid={user.uid}
          heroName={user.heroName}
        />
      </>
    )
  if (screen === "game")
    return (
      <>
        <StatusBar hidden />
        <Game
          onHome={() => setScreen("home")}
          uid={user.uid}
          heroName={user.heroName}
        />
      </>
    )
  if (screen === "scores")
    return (
      <>
        <StatusBar hidden />
        <Scoreboard onBack={() => setScreen("home")} />
      </>
    )
  return (
    <>
      <StatusBar hidden />
      <HomeScreen
        onPlay={() => setScreen("game")}
        onScoreboard={() => setScreen("scores")}
        onArmory={() => setScreen("armory")}
        onMultiplayer={() => {}}
        heroName={user.heroName}
        onDailyQuest={() => setScreen("daily")}
        onLogout={handleLogout}
      />
    </>
  )
}
