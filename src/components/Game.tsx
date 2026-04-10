import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import {
  generateDeck,
  generateDailyDeck,
  getTodayString,
  isCardMatch,
} from "../services/CardService"
import { SoundService } from "../services/SoundService"
import { ICard } from "./Card"
import Card from "./Card"
import Layout1 from "./Layout1"
import Layout2 from "./Layout2"
import Layout3 from "./Layout3"
import Layout4 from "./Layout4"
import Layout5 from "./Layout5"
import Timer from "./Timer"
import { saveScore } from "./Scoreboard"
import { getSelectedTheme, incrementGamesPlayed, ThemeConfig } from "./Armory"
import {
  hasPlayedToday,
  submitAllTimeScore,
  submitDailyScore,
  submitGameScore,
  updateUserProfile,
} from "../services/Dailychallenge"
import { CardBackColorContext } from "../context/ThemeContext"
import {
  leaveRoom,
  onRoomUpdate,
  resetRoomForRematch,
  setPlayerRematch,
  updatePlayerScore,
} from "../services/ArenaService"
import {
  getSavedLoungeCode,
  submitLoungeScore,
} from "../services/LoungeService"

interface GameProps {
  onHome?: () => void
  dailyMode?: boolean
  uid?: string
  heroName?: string
  arenaMode?: boolean
  roomCode?: string
}

const LEVEL_CONFIG: Record<
  number,
  { fieldCards: number; deckStart: number; time: number; layout: number }
> = {
  1: { fieldCards: 30, deckStart: 30, time: 75, layout: 1 },
  2: { fieldCards: 30, deckStart: 30, time: 85, layout: 2 },
  3: { fieldCards: 36, deckStart: 36, time: 80, layout: 3 },
  4: { fieldCards: 28, deckStart: 28, time: 75, layout: 4 },
  5: { fieldCards: 32, deckStart: 32, time: 80, layout: 5 },
}
const TOTAL_LEVELS = Object.keys(LEVEL_CONFIG).length
const BASE_CARD_VALUE = 500
const SECOND_CARD_COMBO = 2
const WILD_COMBO_THRESHOLD = 10
const WILD_SECOND_THRESHOLD = 20

const COMBO_MILESTONES: Record<
  number,
  { text: string; color: string; icon: string }
> = {
  5: { text: "WORTHY!", color: "#7BED9F", icon: "⚔" },
  10: { text: "VALIANT!", color: "#FFD700", icon: "🛡" },
  15: { text: "GLORIOUS!", color: "#FF6B35", icon: "👑" },
  20: { text: "LEGENDARY!", color: "#FF4757", icon: "🐉" },
  25: { text: "RAMPAGE!", color: "#FF00FF", icon: "⚡" },
  30: { text: "BEYOND MYTHIC!", color: "#FFFFFF", icon: "💀" },
  35: { text: "TRANSCENDENT!", color: "#00FFFF", icon: "🌀" },
}

const getComboMultiplier = (c: number) => {
  if (c >= 35) return 120
  if (c >= 30) return 80
  if (c >= 25) return 50
  if (c >= 20) return 30
  if (c >= 15) return 18
  if (c >= 10) return 10
  if (c >= 7) return 6
  if (c >= 5) return 4
  if (c >= 3) return 2.5
  if (c >= 2) return 1.5
  return 1
}

const RUNES = [
  "ᚠ",
  "ᚢ",
  "ᚦ",
  "ᚨ",
  "ᚱ",
  "ᚲ",
  "ᚷ",
  "ᚹ",
  "ᚺ",
  "ᚾ",
  "ᛁ",
  "ᛃ",
  "ᛈ",
  "ᛊ",
  "ᛏ",
  "ᛒ",
  "ᛞ",
  "ᛟ",
]

const LayoutEntrance = ({
  children,
  layoutKey,
}: {
  children: React.ReactNode
  layoutKey: string
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.92)).current

  useEffect(() => {
    opacity.setValue(0)
    scale.setValue(0.92)
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }, [layoutKey])

  return (
    <Animated.View
      style={{
        flex: 1,
        justifyContent: "center",
        opacity,
        transform: [{ scale }],
      }}
    >
      {children}
    </Animated.View>
  )
}

const Battlefield = React.memo(() => (
  <View style={styles.bgContainer} pointerEvents="none">
    {RUNES.map((r, i) => (
      <Text
        key={`r${i}`}
        style={[
          styles.bgRune,
          {
            top: `${(i * 17 + 5) % 86}%`,
            left: `${(i * 21 + 4) % 90}%`,
            fontSize: 12 + (i % 4) * 5,
            transform: [{ rotate: `${i * 37}deg` }],
          },
        ]}
      >
        {r}
      </Text>
    ))}
    <View style={styles.arenaRing} />
    <View style={styles.arenaRingInner} />
    <View style={styles.centerShield}>
      <Text style={styles.centerShieldIcon}>⚔</Text>
    </View>
    <View style={[styles.compassLine, styles.compassH]} />
    <View style={[styles.compassLine, styles.compassV]} />
    <View style={[styles.compassLine, styles.compassD1]} />
    <View style={[styles.compassLine, styles.compassD2]} />
    <Text style={[styles.torch, { top: 6, left: 6 }]}>🕯</Text>
    <Text style={[styles.torch, { top: 6, right: 6 }]}>🕯</Text>
    <Text style={[styles.torch, { bottom: 6, left: 6 }]}>🕯</Text>
    <Text style={[styles.torch, { bottom: 6, right: 6 }]}>🕯</Text>
    <Text style={[styles.bgBeast, { top: "12%", left: "4%" }]}>🐉</Text>
    <Text style={[styles.bgBeast, { top: "12%", right: "4%" }]}>🦅</Text>
    <Text style={[styles.bgBeast, { bottom: "15%", left: "4%" }]}>🐺</Text>
    <Text style={[styles.bgBeast, { bottom: "15%", right: "4%" }]}>🐍</Text>
    <View style={styles.vignetteBottom} />
  </View>
))
const Battlements = React.memo(() => (
  <View style={styles.battlements}>
    {Array.from({ length: 18 }).map((_, i) => (
      <View key={i} style={i % 2 === 0 ? styles.merlon : styles.crenel} />
    ))}
  </View>
))
const WallTexture = React.memo(() => (
  <View style={styles.wallTexture} pointerEvents="none">
    {Array.from({ length: 14 }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stoneDot,
          {
            top: `${(i * 29 + 12) % 80}%`,
            left: `${(i * 17 + 6) % 92}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            opacity: 0.05 + (i % 3) * 0.02,
          },
        ]}
      />
    ))}
    <View style={[styles.mortarLine, { top: "33%" }]} />
    <View style={[styles.mortarLine, { top: "66%" }]} />
  </View>
))

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 800, SCREEN_H / 400, 1)
const CARD_W = Math.round(52 * CARD_SCALE)
const CARD_H = Math.round(74 * CARD_SCALE)

const Game = ({
  onHome,
  dailyMode = false,
  uid,
  heroName,
  arenaMode,
  roomCode,
}: GameProps) => {
  const [theme, setTheme] = useState<ThemeConfig>({
    cardBack: "classic",
    cardBackColor: "#162A47",
    battlefield: "forest",
    battlefieldColor: "#0F1A12",
  })
  const [cards, setCards] = useState<ICard[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [level, setLevel] = useState(1)
  const [round, setRound] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [deckIndex, setDeckIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [totalCleared, setTotalCleared] = useState(0)
  const [totalFieldCards, setTotalFieldCards] = useState(0)
  const [betweenLevels, setBetweenLevels] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [secondCard, setSecondCard] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [wildCount, setWildCount] = useState(0)
  const [wildActive, setWildActive] = useState(false)
  const [wildFirstEarned, setWildFirstEarned] = useState(false)
  const [wildSecondEarned, setWildSecondEarned] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [alreadyPlayedScore, setAlreadyPlayedScore] = useState(0)
  const wildPulse = useRef(new Animated.Value(1)).current
  const [milestoneText, setMilestoneText] = useState("")
  const [milestoneIcon, setMilestoneIcon] = useState("")
  const [milestoneColor, setMilestoneColor] = useState("#fff")
  const milestoneOpacity = useRef(new Animated.Value(0)).current
  const milestoneScale = useRef(new Animated.Value(0.5)).current
  const levelCompleteRef = useRef(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointsOpacity = useRef(new Animated.Value(0)).current
  const pointsMove = useRef(new Animated.Value(0)).current
  const [showPoints, setShowPoints] = useState(false)
  const [lastPoints, setLastPoints] = useState(0)
  const comboPulse = useRef(new Animated.Value(1)).current
  const scorePulse = useRef(new Animated.Value(1)).current
  const deckScale = useRef(new Animated.Value(1)).current
  const [timerFrozen, setTimerFrozen] = useState(false)
  const freezeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeLeftRef = useRef(0)
  const [arenaPlayers, setArenaPlayers] = useState<any[]>([])
  const arenaUnsubRef = useRef<(() => void) | null>(null)
  const [arenaCountdown, setArenaCountdown] = useState<number | null>(null)
  const shakeX = useRef(new Animated.Value(0)).current
  const freezePulse = useRef(new Animated.Value(0)).current
  const comboGlowOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!arenaMode || !betweenLevels || arenaPlayers.length === 0) return
    const allReady = arenaPlayers.every(
      (p: any) => (p.currentLevel || 0) >= level,
    )
    if (allReady && arenaCountdown === null) {
      setArenaCountdown(3)
    }
  }, [arenaPlayers, betweenLevels, level, arenaMode])

  useEffect(() => {
    if (arenaCountdown === null) return
    if (arenaCountdown <= 0) {
      setArenaCountdown(null)
      handleNextLevel()
      return
    }
    const timer = setTimeout(
      () => setArenaCountdown((c) => (c !== null ? c - 1 : null)),
      1000,
    )
    return () => clearTimeout(timer)
  }, [arenaCountdown])

  // Check if already played daily
  useEffect(() => {
    getSelectedTheme().then(setTheme)
    if (dailyMode && uid) {
      setLoading(true)
      hasPlayedToday(uid).then((result) => {
        if (result.played) {
          setAlreadyPlayed(true)
          setAlreadyPlayedScore(result.score || 0)
        }
        setLoading(false)
      })
    }
  }, [])

  useEffect(() => {
    if (arenaMode && roomCode) {
      arenaUnsubRef.current = onRoomUpdate(roomCode, (room) => {
        if (room?.players) {
          console.log("ARENA PLAYERS:", JSON.stringify(room.players))
          const sorted = Object.values(room.players).sort(
            (a: any, b: any) => b.score - a.score,
          )
          setArenaPlayers(sorted)
        }
      })
    }
    return () => {
      if (arenaUnsubRef.current) arenaUnsubRef.current()
    }
  }, [arenaMode, roomCode])

  useEffect(() => {
    if (gameOver && !scoreSaved) {
      setScoreSaved(true)
      const clearPct =
        totalFieldCards > 0
          ? Math.round((totalCleared / totalFieldCards) * 100)
          : 0
      if (uid && heroName) {
        submitGameScore(uid, heroName, score, bestCombo, dailyMode)
        submitAllTimeScore(uid, heroName, score, bestCombo)
        getSavedLoungeCode().then((code) => {
          if (code && uid && heroName) {
            submitLoungeScore(code, uid, heroName, score, bestCombo)
          }
        })
        updateUserProfile(uid, score, bestCombo, totalCleared)
        if (dailyMode) {
          submitDailyScore(uid, heroName, score, bestCombo, clearPct)
        }
        if (arenaMode && roomCode) {
          updatePlayerScore(roomCode, uid, score, bestCombo, TOTAL_LEVELS, true)
        }
      }
      if (score > 0) {
        saveScore(score, bestCombo)
        incrementGamesPlayed()
      }
    }
  }, [gameOver])

  useEffect(() => {
    if (combo > 0) {
      if (combo > bestCombo) setBestCombo(combo)
      if (combo >= 10) {
        comboGlowOpacity.setValue(0.8)
        Animated.timing(comboGlowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }).start()
      } else {
        comboGlowOpacity.setValue(0)
      }
      Animated.sequence([
        Animated.timing(comboPulse, {
          toValue: 1.4,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(comboPulse, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start()
      const m = COMBO_MILESTONES[combo]
      if (m) showMilestone(m.text, m.color, m.icon)
      // Freeze timer on combo milestones
      if (combo === 5) freezeTimerForCombo(3)
      else if (combo === 10) freezeTimerForCombo(5)
      else if (combo === 15) freezeTimerForCombo(3)
      else if (combo === 20) freezeTimerForCombo(5)
      else if (combo === 25) freezeTimerForCombo(3)
      else if (combo === 30) freezeTimerForCombo(5)
      if (
        combo >= WILD_SECOND_THRESHOLD &&
        wildFirstEarned &&
        !wildSecondEarned
      ) {
        setWildCount((c) => Math.min(c + 1, 2))
        setWildSecondEarned(true)
        showMilestone("2nd WILD!", "#FF4757", "🃏🃏")
      } else if (combo >= WILD_COMBO_THRESHOLD && !wildFirstEarned) {
        setWildCount(1)
        setWildFirstEarned(true)
        showMilestone("WILD CARD!", "#E8C547", "🃏")
      }
    }
  }, [combo])
  useEffect(() => {
    if (wildActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wildPulse, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(wildPulse, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else wildPulse.setValue(1)
  }, [wildActive])
  useEffect(() => {
    if (score > 0)
      Animated.sequence([
        Animated.timing(scorePulse, {
          toValue: 1.15,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(scorePulse, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()
  }, [score])

  const showMilestone = (text: string, color: string, icon: string) => {
    setMilestoneText(text)
    setMilestoneColor(color)
    setMilestoneIcon(icon)
    milestoneOpacity.setValue(1)
    milestoneScale.setValue(1.3)
    Animated.parallel([
      Animated.spring(milestoneScale, {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(milestoneOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }, 400)
    })
  }

  const freezeTimerForCombo = (seconds: number) => {
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setTimerFrozen(true)
    freezeTimer.current = setTimeout(() => {
      setTimerFrozen(false)
    }, seconds * 1000)
    freezePulse.setValue(0.8)
    Animated.timing(freezePulse, {
      toValue: 0.2,
      duration: 3000,
      useNativeDriver: true,
    }).start()
    SoundService.playFreeze()
  }

  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[1]

  const advanceLevel = useCallback(() => {
    if (levelCompleteRef.current) return
    levelCompleteRef.current = true
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setTimerFrozen(false)
    const cl = cards
      .slice(0, config.fieldCards)
      .filter((c) => !c.visible).length
    setTotalCleared((p) => p + cl)
    setTotalFieldCards((p) => p + config.fieldCards)

    // Time bonus — 50 points per second remaining
    const timeBonus = timeLeftRef.current * 50
    if (timeBonus > 0) setScore((s) => s + timeBonus)

    SoundService.playLevelComplete()
    // Sync score to arena room
    if (arenaMode && roomCode && uid) {
      updatePlayerScore(
        roomCode,
        uid,
        score,
        bestCombo,
        level,
        level >= TOTAL_LEVELS,
      )
    }
    if (arenaMode && roomCode && uid) {
      updatePlayerScore(
        roomCode,
        uid,
        score,
        bestCombo,
        level,
        level >= TOTAL_LEVELS,
      )
    }
    setArenaCountdown(null)
    setBetweenLevels(true)
  }, [cards, config.fieldCards])

  const initLevel = useCallback(() => {
    if (alreadyPlayed) return
    setLoading(true)
    setWildActive(false)
    setReady(false)
    levelCompleteRef.current = false
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    const deck = dailyMode
      ? generateDailyDeck(getTodayString(), level)
      : arenaMode && roomCode
        ? generateDailyDeck(`${roomCode}-${round}`, level)
        : generateDeck()
    setCards(deck.map((c, i) => ({ ...c, visible: i < config.fieldCards })))
    setCurrentIndex(config.deckStart)
    setDeckIndex(config.deckStart + 1)
    setCombo(0)
    setSecondCard(null)
    setShowHints(false)
    setWildActive(false)
    setTimerFrozen(false)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      SoundService.playShuffle()
      setTimeout(() => setReady(true), 50)
    }, 20)
  }, [level, config.fieldCards, config.deckStart, dailyMode, alreadyPlayed])

  useEffect(() => {
    if (!alreadyPlayed) initLevel()
  }, [level, round, alreadyPlayed])
  useEffect(
    () => () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
      if (freezeTimer.current) clearTimeout(freezeTimer.current)
    },
    [],
  )
  useEffect(() => {
    if (!ready || !cards.length || levelCompleteRef.current) return
    if (cards.slice(0, config.fieldCards).every((c) => !c.visible))
      advanceLevel()
  }, [cards, ready])
  useEffect(() => {
    if (!ready || !cards.length || levelCompleteRef.current) return
    if (deckIndex < cards.length) return
    const hv = cards.slice(0, config.fieldCards).some((c) => c.visible)
    if (!hv) {
      advanceLevel()
      return
    }
    const cur = cards[currentIndex]
    const sec = secondCard !== null ? cards[secondCard] : null
    if (!cur) {
      advanceLevel()
      return
    }
    const hm = cards.slice(0, config.fieldCards).some((c) => {
      if (!c.visible) return false
      return isCardMatch(cur, c) || (sec && isCardMatch(sec, c))
    })
    if (hm) {
      if (!autoAdvanceTimer.current) {
        autoAdvanceTimer.current = setTimeout(() => {
          if (!levelCompleteRef.current) advanceLevel()
        }, 2000)
      }
      return
    }
    if (!hm && !wildActive) {
      if (wildCount <= 0) {
        advanceLevel()
        return
      }
      // Has wild but no matches — give 3 seconds to use it
      if (!autoAdvanceTimer.current) {
        autoAdvanceTimer.current = setTimeout(() => {
          if (!levelCompleteRef.current) advanceLevel()
        }, 2000)
      }
      return
    }
  }, [deckIndex, cards, currentIndex, secondCard, ready, wildActive, wildCount])

  const showPointsAnimation = (pts: number) => {
    requestAnimationFrame(() => {
      setLastPoints(pts)
      setShowPoints(true)
      pointsOpacity.setValue(1)
      pointsMove.setValue(0)
      Animated.parallel([
        Animated.timing(pointsOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pointsMove, {
          toValue: -35,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => setShowPoints(false))
    })
  }

  const handleCardPress = useCallback(
    (index: number) => {
      setCards((prev) => {
        const cur = prev[currentIndex]
        const tapped = prev[index]
        if (!cur || !tapped) return prev
        const isW = wildActive
        const mc = isCardMatch(cur, tapped)
        const ms = secondCard !== null && isCardMatch(prev[secondCard], tapped)
        if (!mc && !ms && !isW) return prev
        if (autoAdvanceTimer.current) {
          clearTimeout(autoAdvanceTimer.current)
          autoAdvanceTimer.current = null
        }
        const nc = combo + 1
        const layoutMultiplier = 1 + (level - 1) * 0.5 // L1=1x, L2=1.5x, L3=2x, L4=2.5x, L5=3x
        const pts = Math.round(
          BASE_CARD_VALUE * getComboMultiplier(nc) * layoutMultiplier,
        )
        SoundService.playMatch(nc)
        showPointsAnimation(pts)
        const u = [...prev]
        u[index] = { ...u[index], visible: false }
        setCombo(nc)
        setScore((s) => s + pts)
        setShowHints(false)
        if (isW) {
          setWildActive(false)
          setCurrentIndex(index)
        } else if (mc) {
          if (nc >= SECOND_CARD_COMBO && secondCard === null)
            setSecondCard(currentIndex)
          setCurrentIndex(index)
        } else setSecondCard(index)
        return u
      })
    },
    [currentIndex, secondCard, combo, wildActive],
  )

  const handleDeckPress = useCallback(() => {
    if (deckIndex >= cards.length) return
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }
    SoundService.playDeckDraw()
    Animated.sequence([
      Animated.timing(deckScale, {
        toValue: 0.9,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.timing(deckScale, {
        toValue: 1,
        duration: 40,
        useNativeDriver: true,
      }),
    ]).start()
    setCurrentIndex(deckIndex)
    setDeckIndex((i) => i + 1)
    setCombo(0)
    setTimerFrozen(false)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setSecondCard(null)
    setShowHints(false)
    setWildActive(false)
  }, [deckIndex, cards.length])

  const handleWild = () => {
    if (wildCount <= 0 || wildActive) return
    setWildCount((c) => c - 1)
    setWildActive(true)
  }
  const handleNextLevel = () => {
    setBetweenLevels(false)
    level >= TOTAL_LEVELS ? setGameOver(true) : setLevel((l) => l + 1)
  }
  const handlePlayAgain = () => {
    if (dailyMode) {
      onHome?.()
      return
    }
    setScore(0)
    setBestCombo(0)
    setTotalCleared(0)
    setTotalFieldCards(0)
    setLevel(1)
    setGameOver(false)
    setScoreSaved(false)
    setWildCount(0)
    setWildFirstEarned(false)
    setWildSecondEarned(false)
    setWildActive(false)
    setWildActive(false)
    setRound((r) => r + 1)
  }
  const handleBackPress = () => {
    setPaused(true)
    setShowQuitConfirm(true)
  }
  const handleResumeFromQuit = () => {
    setShowQuitConfirm(false)
    setPaused(false)
  }
  const handleConfirmQuit = async () => {
    setShowQuitConfirm(false)
    setPaused(false)
    if (arenaMode && roomCode && uid) {
      await leaveRoom(roomCode, uid)
    }
    onHome?.()
  }

  const [wantsRematch, setWantsRematch] = useState(false)

  const handleArenaRematch = async () => {
    if (!arenaMode || !roomCode || !uid || wantsRematch) return
    setWantsRematch(true)
    await setPlayerRematch(roomCode, uid)
  }

  useEffect(() => {
    if (!arenaMode || !roomCode || !uid) return

    // Watch rematchCount — when it reaches player count, first player to see it resets
    const db = require("@react-native-firebase/database").default()
    const rematchRef = db.ref(`rooms/${roomCode}/rematchCount`)

    const onRematchCount = rematchRef.on("value", async (snap: any) => {
      const count = snap.val() ?? 0
      const total = arenaPlayers.length
      if (total > 0 && count >= total && wantsRematch) {
        // Use a transaction on a "resetting" flag so only ONE player triggers the reset
        const resetFlagRef = db.ref(`rooms/${roomCode}/isResetting`)
        resetFlagRef.transaction(
          (current: boolean | null) => {
            return current ? undefined : true // undefined = abort if already true
          },
          async (err: any, committed: boolean) => {
            if (!committed) return // another player got here first
            await resetRoomForRematch(roomCode)
          },
        )
      }
    })

    return () => rematchRef.off("value", onRematchCount)
  }, [arenaMode, roomCode, uid, arenaPlayers.length, wantsRematch])

  // Watch room state — when it flips back to "playing", restart the game
  useEffect(() => {
    if (!arenaMode || !roomCode || !gameOver) return

    const db = require("@react-native-firebase/database").default()
    const stateRef = db.ref(`rooms/${roomCode}/state`)

    const onState = stateRef.on("value", (snap: any) => {
      const state = snap.val()
      if (state === "playing" && wantsRematch) {
        // Reset all local state and restart
        setScore(0)
        setBestCombo(0)
        setTotalCleared(0)
        setTotalFieldCards(0)
        setLevel(1)
        setGameOver(false)
        setScoreSaved(false)
        setWildCount(0)
        setWildFirstEarned(false)
        setWildSecondEarned(false)
        setWildActive(false)
        setWantsRematch(false)
        setRound((r) => r + 1)
      }
    })

    return () => stateRef.off("value", onState)
  }, [arenaMode, roomCode, gameOver, wantsRematch])

  const remaining = cards.length - deckIndex
  const hintedIndices = useMemo(() => {
    const s = new Set<number>()
    if (!cards.length || !showHints) return s
    const cur = cards[currentIndex]
    const sec = secondCard !== null ? cards[secondCard] : null
    cards.slice(0, config.fieldCards).forEach((c, i) => {
      if (c.visible && (isCardMatch(cur, c) || (sec && isCardMatch(sec, c))))
        s.add(i)
    })
    return s
  }, [cards, currentIndex, secondCard, showHints, config.fieldCards])

  const layoutKey = `${level}-${round}`
  const getLayout = () => {
    const p = { cards, onClick: handleCardPress, hintedIndices }
    switch (config.layout) {
      case 5:
        return <Layout5 key={layoutKey} {...p} />
      case 4:
        return <Layout4 key={layoutKey} {...p} />
      case 3:
        return <Layout3 key={layoutKey} {...p} />
      case 2:
        return <Layout2 key={layoutKey} {...p} />
      default:
        return <Layout1 key={layoutKey} {...p} />
    }
  }
  const comboColor =
    combo >= 10
      ? "#FF4757"
      : combo >= 7
        ? "#FF6B35"
        : combo >= 5
          ? "#FFD700"
          : combo >= 3
            ? "#7BED9F"
            : "#E8C547"

  // Already played daily
  if (alreadyPlayed)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        <Battlefield />
        <Text style={styles.dailyBadgeIcon}>📜</Text>
        <Text style={styles.gameTitle}>QUEST COMPLETE</Text>
        <Text style={styles.partialText}>
          You already fought today's battle
        </Text>
        <View style={styles.divider} />
        <Text style={styles.scoreLabel}>YOUR SCORE</Text>
        <Text style={styles.finalScore}>
          {alreadyPlayedScore.toLocaleString()}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.partialText}>
          Come back tomorrow for a new quest!
        </Text>
        <TouchableOpacity style={styles.goldBtn} onPress={onHome}>
          <Text style={styles.goldBtnText}>🏰 Return to Castle</Text>
        </TouchableOpacity>
      </View>
    )

  if (loading)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        <Battlefield />
        <Text style={styles.loadText}>
          ⚔ {dailyMode ? "Preparing daily quest..." : "Preparing the field..."}
        </Text>
      </View>
    )

  if (gameOver) {
    const clearPct =
      totalFieldCards > 0
        ? Math.round((totalCleared / totalFieldCards) * 100)
        : 0

    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.battlefieldColor,
            flexDirection: arenaMode ? "row" : "column",
            gap: arenaMode ? 20 : 4,
            paddingHorizontal: arenaMode ? 40 : 32,
          },
        ]}
      >
        <Battlefield />

        {/* Left side — your score */}
        <View
          style={{
            alignItems: "center",
            flex: arenaMode ? 1 : undefined,
            gap: 4,
          }}
        >
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.gameTitle}>
            {dailyMode ? "QUEST COMPLETE" : "VICTORY"}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text style={styles.finalScore}>{score.toLocaleString()}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{clearPct}%</Text>
              <Text style={styles.statLabel}>CLEARED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>x{bestCombo}</Text>
              <Text style={styles.statLabel}>BEST COMBO</Text>
            </View>
          </View>
          {dailyMode && (
            <Text style={styles.dailySubmitted}>
              ✓ Score submitted to daily leaderboard
            </Text>
          )}
          {!dailyMode && uid && !arenaMode && (
            <Text style={styles.dailySubmitted}>
              ✓ Score saved to Hall of Glory
            </Text>
          )}
        </View>

        {/* Right side — arena rankings OR buttons */}
        <View
          style={{
            alignItems: "center",
            flex: arenaMode ? 1 : undefined,
            gap: 6,
          }}
        >
          {arenaMode && arenaPlayers.length > 0 && (
            <View style={styles.arenaBoard}>
              <Text style={styles.arenaBoardTitle}>🏆 FINAL RANKINGS</Text>
              <ScrollView style={styles.arenaScroll} nestedScrollEnabled>
                {arenaPlayers.map((p: any, i: number) => (
                  <View
                    key={p.uid || i}
                    style={[
                      styles.arenaRow,
                      p.uid === uid && styles.arenaRowYou,
                    ]}
                  >
                    <Text style={styles.arenaRank}>
                      {i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `${i + 1}.`}
                    </Text>
                    <Text
                      style={[
                        styles.arenaName,
                        p.uid === uid && styles.arenaNameYou,
                      ]}
                    >
                      {p.heroName}
                    </Text>
                    <Text style={styles.arenaCombo}>x{p.bestCombo || 0}</Text>
                    <Text style={styles.arenaScore}>
                      {(p.score || 0).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {arenaMode && roomCode ? (
            <TouchableOpacity
              style={[styles.goldBtn, wantsRematch && styles.goldBtnDisabled]}
              onPress={handleArenaRematch}
              disabled={wantsRematch}
            >
              <Text style={styles.goldBtnText}>
                {wantsRematch
                  ? `Waiting... (${arenaPlayers.filter((p: any) => p.wantsRematch).length}/${arenaPlayers.length})`
                  : "⚔ Rematch — New Deck"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.goldBtn} onPress={handlePlayAgain}>
              <Text style={styles.goldBtnText}>
                {dailyMode ? "🏰 Return to Castle" : "⚔ Battle Again"}
              </Text>
            </TouchableOpacity>
          )}

          {!dailyMode && (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={arenaMode ? handleConfirmQuit : onHome}
            >
              <Text style={styles.ghostBtnText}>🏰 Return to Castle</Text>
            </TouchableOpacity>
          )}

          {!dailyMode && !arenaMode && (
            <Text style={styles.partialText}>
              Check Hall of Glory for rankings
            </Text>
          )}
        </View>
      </View>
    )
  }

  if (betweenLevels) {
    const cleared = cards.slice(0, config.fieldCards).every((c) => !c.visible)
    const rem =
      config.fieldCards -
      cards.slice(0, config.fieldCards).filter((c) => !c.visible).length

    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.battlefieldColor,
            flexDirection: arenaMode ? "row" : "column",
            gap: arenaMode ? 20 : 4,
            paddingHorizontal: arenaMode ? 40 : 32,
          },
        ]}
      >
        <Battlefield />

        {/* Left side — level info */}
        <View
          style={{
            alignItems: "center",
            flex: arenaMode ? 1 : undefined,
            gap: 4,
          }}
        >
          <Text style={styles.lvlIcon}>{cleared ? "⚔" : "🛡"}</Text>
          <View style={styles.banner}>
            <View style={styles.bannerEdge} />
            <View style={styles.bannerBody}>
              <Text style={styles.bannerTitle}>
                {cleared ? "FIELD CLEARED" : "RETREAT"}
              </Text>
              <Text style={styles.bannerSub}>
                Battlefield {level} of {TOTAL_LEVELS}
              </Text>
            </View>
            <View style={styles.bannerEdge} />
          </View>
          {!cleared && (
            <Text style={styles.partialText}>
              {rem} beast{rem !== 1 ? "s" : ""} remained
            </Text>
          )}
          <Text style={styles.scoreLabel}>TOTAL SPOILS</Text>
          <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
          {timeLeftRef.current > 0 && (
            <View style={styles.timeBonusBox}>
              <Text style={styles.timeBonusText}>
                ⏱ +{(timeLeftRef.current * 50).toLocaleString()}
              </Text>
              <Text style={styles.timeBonusLabel}>TIME BONUS</Text>
            </View>
          )}
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < level && styles.progressDotFilled,
                ]}
              >
                {i < level && <Text style={styles.progressCheck}>✓</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Right side — arena scoreboard OR next button */}
        <View style={{ alignItems: "center", flex: arenaMode ? 1 : undefined }}>
          {arenaMode && arenaPlayers.length > 0 && (
            <View style={styles.arenaBoard}>
              <Text style={styles.arenaBoardTitle}>⚔ ARENA STANDINGS</Text>
              {arenaMode && arenaPlayers.length > 0 && (
                <View style={styles.arenaBoard}>
                  <Text style={styles.arenaBoardTitle}>⚔ ARENA STANDINGS</Text>
                  <ScrollView style={styles.arenaScroll} nestedScrollEnabled>
                    {arenaPlayers.map((p: any, i: number) => (
                      <View
                        key={p.uid || i}
                        style={[
                          styles.arenaRow,
                          p.uid === uid && styles.arenaRowYou,
                        ]}
                      >
                        <Text style={styles.arenaRank}>
                          {i === 0
                            ? "🥇"
                            : i === 1
                              ? "🥈"
                              : i === 2
                                ? "🥉"
                                : `${i + 1}.`}
                        </Text>
                        <Text
                          style={[
                            styles.arenaName,
                            p.uid === uid && styles.arenaNameYou,
                          ]}
                        >
                          {p.heroName}
                        </Text>
                        <Text style={styles.arenaScore}>
                          {(p.score || 0).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {arenaMode ? (
            (() => {
              const allReady =
                arenaPlayers.length > 0 &&
                arenaPlayers.every((p: any) => (p.currentLevel || 0) >= level)
              return allReady ? (
                <View style={styles.countdownBox}>
                  <Text style={styles.countdownText}>
                    {arenaCountdown || "GO!"}
                  </Text>
                  <Text style={styles.countdownLabel}>NEXT BATTLE IN</Text>
                </View>
              ) : (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingArenaText}>
                    Waiting... (
                    {
                      arenaPlayers.filter(
                        (p: any) => (p.currentLevel || 0) >= level,
                      ).length
                    }
                    /{arenaPlayers.length})
                  </Text>
                </View>
              )
            })()
          ) : (
            <TouchableOpacity style={styles.goldBtn} onPress={handleNextLevel}>
              <Text style={styles.goldBtnText}>
                {level >= TOTAL_LEVELS ? "🏆 Claim Victory" : "⚔ Next Battle"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  if (showQuitConfirm)
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: theme.battlefieldColor,
            margin: 0,
            padding: 0,
            paddingHorizontal: 32,
          },
        ]}
      >
        <Battlefield />
        <Text style={styles.quitIcon}>⚠</Text>
        <Text style={styles.quitTitle}>Abandon Battle?</Text>
        <Text style={styles.quitSub}>
          {dailyMode
            ? "You will lose your daily attempt!"
            : "Your progress on this run will be lost."}
        </Text>
        <Text style={styles.quitScore}>
          Current spoils: {score.toLocaleString()}
        </Text>
        <TouchableOpacity style={styles.goldBtn} onPress={handleResumeFromQuit}>
          <Text style={styles.goldBtnText}>⚔ Keep Fighting</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quitBtn} onPress={handleConfirmQuit}>
          <Text style={styles.quitBtnText}>🚪 Leave Battle</Text>
        </TouchableOpacity>
      </View>
    )

  if (paused)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        <Battlefield />
        <Text style={styles.gameTitle}>⏸ PAUSED</Text>
        <Text style={styles.pauseScore}>{score.toLocaleString()}</Text>
        <TouchableOpacity
          style={styles.goldBtn}
          onPress={() => setPaused(false)}
        >
          <Text style={styles.goldBtnText}>▶ Resume</Text>
        </TouchableOpacity>
        {!dailyMode && (
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              setPaused(false)
              setScore(0)
              setLevel(1)
              setRound((r) => r + 1)
            }}
          >
            <Text style={styles.ghostBtnText}>↺ Restart</Text>
          </TouchableOpacity>
        )}
        {onHome && (
          <TouchableOpacity style={styles.ghostBtn} onPress={onHome}>
            <Text style={styles.ghostBtnText}>🏰 Home</Text>
          </TouchableOpacity>
        )}
      </View>
    )

  return (
    <CardBackColorContext.Provider
      value={dailyMode ? "#3D2E0A" : theme.cardBackColor}
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: dailyMode ? "#0F0A05" : theme.battlefieldColor },
        ]}
      >
        <Battlefield />
        {combo >= 10 && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor:
                  combo >= 25
                    ? "rgba(200,50,255,0.12)"
                    : combo >= 15
                      ? "rgba(255,70,70,0.1)"
                      : "rgba(255,200,50,0.06)",
                opacity: comboGlowOpacity,
              },
            ]}
          />
        )}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>

        {wildActive && (
          <Animated.View
            style={[styles.wildBorder, { transform: [{ scale: wildPulse }] }]}
            pointerEvents="none"
          />
        )}
        {wildActive && (
          <View style={styles.wildActiveLabel}>
            <Text style={styles.wildActiveText}>⚡ WILD — tap any card!</Text>
          </View>
        )}

        <View style={styles.field}>
          {ready ? (
            <LayoutEntrance key={layoutKey} layoutKey={layoutKey}>
              {getLayout()}
            </LayoutEntrance>
          ) : null}
        </View>

        <View style={styles.wallContainer}>
          <Battlements />
          <View style={[styles.wall, dailyMode && styles.wallDaily]}>
            <WallTexture />
            <View style={styles.leftSection}>
              <Animated.View style={{ transform: [{ scale: deckScale }] }}>
                <Card
                  remaining={remaining > 0 ? remaining : 0}
                  alwaysEnabled={remaining > 0}
                  disabled={remaining <= 0}
                  onClick={handleDeckPress}
                  cardBackColor={dailyMode ? "#3D2E0A" : theme.cardBackColor}
                />
              </Animated.View>
              <View style={styles.spoilsBox}>
                <Text style={styles.label}>SPOILS</Text>
                <Animated.Text
                  style={[
                    styles.scoreValue,
                    { transform: [{ scale: scorePulse }] },
                  ]}
                >
                  {score.toLocaleString()}
                </Animated.Text>
              </View>
            </View>
            <View style={styles.centerCards}>
              <View
                style={[
                  styles.openCardGlow,
                  wildActive && styles.openCardGlowWild,
                ]}
              />
              <Card
                card={cards[currentIndex]}
                isOpen
                disabled
                cardBackColor={theme.cardBackColor}
              />
              {secondCard !== null && (
                <Card
                  card={cards[secondCard]}
                  isOpen
                  disabled
                  cardBackColor={theme.cardBackColor}
                />
              )}
            </View>
            {/* Wild cards between center and timer */}
            {wildCount > 0 && !wildActive && (
              <TouchableOpacity style={styles.wildBarBtn} onPress={handleWild}>
                <View style={styles.wildCard}>
                  <Text style={styles.wildCardIcon}>🃏</Text>
                </View>
                {wildCount > 1 && (
                  <View style={[styles.wildCard, styles.wildCard2]}>
                    <Text style={styles.wildCardIcon}>🃏</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <View style={styles.rightBox}>
              <Timer
                key={layoutKey}
                initialTime={config.time}
                onTimeUp={advanceLevel}
                paused={paused || betweenLevels || showQuitConfirm}
                frozen={timerFrozen}
                onTick={(t) => {
                  timeLeftRef.current = t
                }}
              />
              <View>
                <Text style={styles.label}>COMBO</Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  {combo >= 3 && (
                    <View
                      style={{
                        width: Math.min(combo * 2, 40),
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: comboColor,
                        opacity: 0.6,
                      }}
                    />
                  )}
                  <Animated.Text
                    style={[
                      styles.comboValue,
                      {
                        transform: [{ scale: comboPulse }],
                        color: comboColor,
                        fontSize:
                          combo >= 25
                            ? 28
                            : combo >= 15
                              ? 24
                              : combo >= 10
                                ? 22
                                : 18,
                        textShadowColor:
                          combo >= 10 ? comboColor : "transparent",
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius:
                          combo >= 25
                            ? 24
                            : combo >= 15
                              ? 16
                              : combo >= 10
                                ? 10
                                : 0,
                      },
                    ]}
                  >
                    x{combo}
                  </Animated.Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {showPoints && (
          <Animated.View
            style={[
              styles.pointsPopup,
              {
                opacity: pointsOpacity,
                transform: [{ translateY: pointsMove }],
              },
            ]}
          >
            <Text
              style={[
                styles.pointsText,
                {
                  fontSize:
                    combo >= 25 ? 40 : combo >= 15 ? 34 : combo >= 10 ? 30 : 26,
                  color:
                    combo >= 25
                      ? "#FF00FF"
                      : combo >= 15
                        ? "#FF4757"
                        : combo >= 10
                          ? "#FFD700"
                          : "#E8C547",
                },
              ]}
            >
              +{lastPoints.toLocaleString()}
            </Text>
            {combo >= 5 && (
              <Text
                style={{
                  fontSize: combo >= 25 ? 14 : combo >= 15 ? 12 : 10,
                  fontWeight: "900",
                  letterSpacing: 2,
                  color:
                    combo >= 25
                      ? "rgba(200,50,255,0.7)"
                      : combo >= 15
                        ? "rgba(255,70,70,0.6)"
                        : "rgba(255,200,50,0.5)",
                }}
              >
                {combo >= 25
                  ? "RAMPAGE"
                  : combo >= 20
                    ? "LEGENDARY"
                    : combo >= 15
                      ? "GLORIOUS"
                      : combo >= 10
                        ? "VALIANT"
                        : "WORTHY"}
              </Text>
            )}
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.milestone,
            {
              opacity: milestoneOpacity,
              transform: [{ scale: milestoneScale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[styles.milestoneIcon, { fontSize: combo >= 20 ? 28 : 22 }]}
          >
            {milestoneIcon}
          </Text>
          <Text
            style={[
              styles.milestoneText,
              { color: milestoneColor, fontSize: combo >= 20 ? 32 : 24 },
            ]}
          >
            {milestoneText}
          </Text>
        </Animated.View>
      </Animated.View>
    </CardBackColorContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  field: { flex: 1, width: "100%", justifyContent: "center" },
  bgContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgRune: { position: "absolute", color: "rgba(232,197,71,0.035)" },
  arenaRing: {
    position: "absolute",
    top: "18%",
    left: "22%",
    width: "56%",
    height: "58%",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.04)",
  },
  arenaRingInner: {
    position: "absolute",
    top: "25%",
    left: "30%",
    width: "40%",
    height: "44%",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.025)",
    borderStyle: "dashed",
  },
  centerShield: {
    position: "absolute",
    top: "42%",
    left: "47%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232,197,71,0.02)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerShieldIcon: { fontSize: 18, color: "rgba(232,197,71,0.04)" },
  compassLine: {
    position: "absolute",
    backgroundColor: "rgba(232,197,71,0.02)",
  },
  compassH: { top: "48%", left: "12%", width: "76%", height: 1 },
  compassV: { left: "50%", top: "12%", width: 1, height: "70%" },
  compassD1: {
    top: "28%",
    left: "28%",
    width: "44%",
    height: 1,
    transform: [{ rotate: "45deg" }],
  },
  compassD2: {
    top: "28%",
    left: "28%",
    width: "44%",
    height: 1,
    transform: [{ rotate: "-45deg" }],
  },
  torch: { position: "absolute", fontSize: 12, opacity: 0.07 },
  bgBeast: { position: "absolute", fontSize: 20, opacity: 0.035 },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(15,26,18,0.3)",
  },

  backBtn: {
    position: "absolute",
    top: 6,
    left: 8,
    zIndex: 100,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  backBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "700",
  },

  dailyBadge: {
    position: "absolute",
    top: 6,
    alignSelf: "center",
    zIndex: 100,
    backgroundColor: "rgba(232,197,71,0.12)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.25)",
  },
  dailyBadgeText: {
    color: "#E8C547",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  dailyBadgeIcon: { fontSize: 40, marginBottom: 4 },
  dailySubmitted: {
    color: "rgba(123,237,159,0.6)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  floatingLeft: { position: "absolute", left: 8, bottom: 55, zIndex: 50 },
  floatingRight: { position: "absolute", right: 8, bottom: 55, zIndex: 50 },
  wildBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,197,71,0.15)",
    borderRadius: 12,
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: "#E8C547",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  wildIcon: { fontSize: 20 },
  hintFloatBtn: {
    alignItems: "center",
    backgroundColor: "rgba(232,197,71,0.08)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
  },
  hintBtnOff: { opacity: 0.2 },
  hintBtnIcon: { fontSize: 16 },
  hintBtnCount: {
    color: "#E8C547",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1,
  },
  wildBorder: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(232,197,71,0.25)",
    zIndex: 1,
  },
  wildActiveLabel: {
    position: "absolute",
    top: 4,
    alignSelf: "center",
    zIndex: 100,
    backgroundColor: "rgba(232,197,71,0.15)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.3)",
  },
  wildActiveText: {
    color: "#E8C547",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },

  wallContainer: { width: "100%" },
  battlements: { flexDirection: "row", justifyContent: "center" },
  merlon: {
    width: 14,
    height: 5,
    backgroundColor: "#2A1F14",
    borderTopWidth: 1,
    borderTopColor: "#4A3828",
  },
  crenel: { width: 10, height: 5, backgroundColor: "transparent" },
  wall: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: "#2A1F14",
    borderTopWidth: 1,
    borderTopColor: "#4A3828",
    overflow: "hidden",
  },
  wallTexture: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  stoneDot: { position: "absolute", borderRadius: 2, backgroundColor: "#fff" },
  mortarLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(74,56,40,0.3)",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
  },
  spoilsBox: { justifyContent: "center" },
  centerCards: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  openCardGlow: {
    position: "absolute",
    top: -6,
    left: -10,
    right: -10,
    bottom: -6,
    borderRadius: 14,
    backgroundColor: "rgba(232,197,71,0.03)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.05)",
  },
  openCardGlowWild: {
    backgroundColor: "rgba(232,197,71,0.08)",
    borderColor: "rgba(232,197,71,0.2)",
  },
  rightBox: { alignItems: "flex-end", gap: 1, minWidth: 70 },
  label: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2,
  },
  scoreValue: { color: "#E8C547", fontSize: 18, fontWeight: "900" },
  comboValue: { fontSize: 18, fontWeight: "900", textAlign: "right" },

  pointsPopup: { position: "absolute", bottom: 85, alignSelf: "center" },
  pointsText: {
    color: "#E8C547",
    fontSize: 26,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  milestone: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
  },
  milestoneIcon: { fontSize: 22 },
  milestoneText: {
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 32,
  },
  loadText: {
    color: "#E8C547",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
  crownIcon: { fontSize: 32 },
  lvlIcon: { fontSize: 34 },
  gameTitle: {
    color: "#E8C547",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 4,
  },
  divider: {
    width: 100,
    height: 1,
    backgroundColor: "rgba(232,197,71,0.15)",
    marginVertical: 2,
  },
  scoreLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
  },
  finalScore: { color: "#E8C547", fontSize: 36, fontWeight: "900" },
  scoreText: { color: "#E8C547", fontSize: 24, fontWeight: "900" },
  pauseScore: {
    color: "rgba(232,197,71,0.3)",
    fontSize: 15,
    fontWeight: "700",
  },
  partialText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    fontStyle: "italic",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginVertical: 2,
  },
  statBox: { alignItems: "center" },
  statValue: { color: "#E8C547", fontSize: 20, fontWeight: "900" },
  statLabel: {
    color: "rgba(232,197,71,0.35)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(232,197,71,0.15)",
  },

  quitIcon: { fontSize: 36, marginBottom: 4 },
  quitTitle: {
    color: "#E8C547",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  quitSub: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
  quitScore: {
    color: "rgba(232,197,71,0.5)",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  quitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 170,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.25)",
    backgroundColor: "rgba(255,100,100,0.08)",
  },
  quitBtnText: {
    color: "rgba(255,100,100,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },

  banner: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  bannerEdge: { width: 20, height: 2, backgroundColor: "#E8C547" },
  bannerBody: { paddingHorizontal: 14, alignItems: "center" },
  bannerTitle: {
    color: "#E8C547",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.22)",
    fontSize: 11,
    fontWeight: "600",
  },
  progressRow: { flexDirection: "row", gap: 8, marginVertical: 6 },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(232,197,71,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotFilled: {
    backgroundColor: "rgba(232,197,71,0.15)",
    borderColor: "#E8C547",
  },
  progressCheck: { color: "#E8C547", fontSize: 8, fontWeight: "900" },
  goldBtn: {
    backgroundColor: "#E8C547",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 170,
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  goldBtnText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  ghostBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 170,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
  },
  ghostBtnText: {
    color: "rgba(232,197,71,0.45)",
    fontSize: 13,
    fontWeight: "700",
  },
  wildCardStack: {
    position: "relative",
    width: CARD_W * 0.7,
    height: CARD_H * 0.7,
  },

  wildBarBtn: {
    position: "absolute",
    right: 100,
    bottom: 0,
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    flexDirection: "row",
    gap: 4,
  },
  wildCard: {
    width: Math.round(36 * CARD_SCALE),
    height: Math.round(50 * CARD_SCALE),
    borderRadius: Math.round(6 * CARD_SCALE),
    backgroundColor: "#1a0a2e",
    borderWidth: 1,
    borderColor: "#8247e8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E8C547",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  wildCard2: { marginLeft: 4 },
  wildCardIcon: { fontSize: Math.round(26 * CARD_SCALE) },
  timeBonusBox: {
    alignItems: "center",
    backgroundColor: "rgba(79,195,247,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(79,195,247,0.15)",
  },
  timeBonusText: { color: "#4FC3F7", fontSize: 14, fontWeight: "900" },
  timeBonusLabel: {
    color: "rgba(79,195,247,0.4)",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 2,
  },
  wallDaily: { backgroundColor: "#1A1510", borderTopColor: "#E8C547" },
  arenaBoard: { width: "100%", maxWidth: 350, marginVertical: 6 },
  arenaBoardTitle: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 4,
    textAlign: "center",
  },
  arenaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 1,
    gap: 8,
  },
  arenaRowYou: {
    backgroundColor: "rgba(232,197,71,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.12)",
  },
  arenaRank: { fontSize: 14, width: 28 },
  arenaName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  arenaNameYou: { color: "#E8C547" },
  arenaCombo: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 8,
  },
  arenaScore: { color: "#E8C547", fontSize: 14, fontWeight: "900" },
  countdownBox: { alignItems: "center", marginVertical: 4 },
  countdownText: { color: "#E8C547", fontSize: 42, fontWeight: "900" },
  countdownLabel: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
  },
  waitingArenaText: {
    color: "rgba(232,197,71,0.4)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  waitingBox: { paddingVertical: 10 },
  arenaScroll: { maxHeight: 100 },
  goldBtnDisabled: { opacity: 0.4 },
})

export default Game
