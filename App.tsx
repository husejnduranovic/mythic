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
import Profile from "./src/components/Profile"
import ArenaScreen from "./src/components/Arenascreen"
import LoungeScreen from "./src/components/LoungeScreen"
import { getLoungeInfo, getSavedLoungeCode } from "./src/services/LoungeService"

interface UserData {
  uid: string
  heroName: string
  email: string
}

export default function App() {
  const [introSeen, setIntroSeen] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [screen, setScreen] = useState<
    | "home"
    | "game"
    | "scores"
    | "armory"
    | "daily"
    | "profile"
    | "arena"
    | "arenaGame"
    | "lounge"
  >("home")
  const [roomCode, setRoomCode] = useState("")

  const [loungeCode, setLoungeCode] = useState<string | null>(null)
  const [loungeName, setLoungeName] = useState<string | null>(null)

  useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden")
    NavigationBar.setBehaviorAsync("overlay-swipe")
    SoundService.init()
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
  if (screen === "profile")
    return (
      <>
        <StatusBar hidden />
        <Profile
          onBack={() => setScreen("home")}
          uid={user.uid}
          heroName={user.heroName}
        />
      </>
    )
  if (screen === "arena")
    return (
      <>
        <StatusBar hidden />
        <ArenaScreen
          onBack={() => setScreen("home")}
          onGameStart={(code, isHost) => {
            setRoomCode(code)
            setScreen("arenaGame")
          }}
          uid={user.uid}
          heroName={user.heroName}
        />
      </>
    )

  if (screen === "arenaGame")
    return (
      <>
        <StatusBar hidden />
        <Game
          onHome={() => setScreen("home")}
          uid={user.uid}
          heroName={user.heroName}
          arenaMode
          roomCode={roomCode}
        />
      </>
    )

  if (screen === "lounge")
    return (
      <>
        <StatusBar hidden />
        <LoungeScreen
          onBack={() => setScreen("home")}
          onPlay={() => setScreen("game")}
          uid={user.uid}
          heroName={user.heroName}
        />
      </>
    )
  return (
    <>
      <StatusBar hidden />
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
      />
    </>
  )
}
