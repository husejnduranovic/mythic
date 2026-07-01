import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
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
  pickSeededIndices,
} from "../services/CardService"
import { SoundService } from "../services/SoundService"
import { ICard } from "./Card"
import Card from "./Card"
import Layout1 from "./Layout1"
import LayoutWarfront from "./LayoutWarfront"
import Timer from "./Timer"
import { saveScore } from "../services/LocalScoreService"
import {
  BOUNTY_STYLE_CONFIG,
  getSelectedTheme,
  incrementGamesPlayed,
  ThemeConfig,
  WAR_TABLE_CONFIG,
} from "./Armory"
import { hasPlayedToday } from "../services/DailyQuestService"
import { saveGameResults } from "../services/ScoreService"
import { StorageKeys } from "../services/storageKeys"
import {
  BountyStyleContext,
  CardBackColorContext,
  VanquishTierContext,
} from "../context/ThemeContext"
import {
  leaveRoom,
  onRoomUpdate,
  resetRoomForRematch,
  setPlayerRematch,
  updatePlayerScore,
} from "../services/ArenaService"
import { firestore } from "../services/Firebase"
import Layout5 from "./Layout5"
import Layout7 from "./Layout7"
import Layout9 from "./Layout9"
import Layout8 from "./Layout8"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ReturnToCastle from "./ReturnToCastle"
import { AlreadyPlayedScreen } from "./game/AlreadyPlayedScreen"
import { PausedScreen } from "./game/PausedScreen"
import { PreBattleScreen } from "./game/PreBattleScreen"
import { GameOverScreen } from "./game/GameOverScreen"
import { BetweenLevelsScreen } from "./game/BetweenLevelsScreen"
import { QuitConfirmModal } from "./game/QuitConfirmModal"
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated"
import {
  BANNER_FREEZE_SECONDS,
  BANNER_MILESTONES,
  COMBO_MILESTONES,
  LEVEL_CONFIG,
  SECOND_CARD_COMBO,
  TOTAL_LEVELS,
} from "../game/config"
import {
  getBannerBank,
  getBountyBonus,
  getDeckBonus,
  getMatchPoints,
  getPerfectClearBonus,
  getTimeBonus,
} from "../game/scoring"
import { Battlefield } from "./game/Battlefield"
import { Battlements, WallTexture } from "./game/Wall"
import { LayoutEntrance } from "./game/LayoutEntrance"
import { Icon } from "../ui/Icon"
import { Sigil, SigilSpec } from "../ui/sigils"
import { color as palette, font } from "../ui/theme"

interface GameProps {
  onHome: () => void
  dailyMode?: boolean
  uid?: string
  heroName?: string
  arenaMode?: boolean
  roomCode?: string
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")
const CARD_SCALE = Math.min(SCREEN_W / 780, SCREEN_H / 360, 1)
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
    warTable: "classic",
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
  const [bannersPlanted, setBannersPlanted] = useState(0)
  const [totalCleared, setTotalCleared] = useState(0)
  const [totalFieldCards, setTotalFieldCards] = useState(0)
  const [betweenLevels, setBetweenLevels] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [secondCard, setSecondCard] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [showQuitConfirm, setShowQuitConfirm] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [alreadyPlayedScore, setAlreadyPlayedScore] = useState(0)
  const [milestoneText, setMilestoneText] = useState("")
  const [milestoneSub, setMilestoneSub] = useState("")
  const [milestoneIcon, setMilestoneIcon] = useState<SigilSpec>({
    fam: "mci",
    name: "sword-cross",
  })
  const [milestoneColor, setMilestoneColor] = useState("#ffffff")

  const milestoneOpacity = useSharedValue(0)
  const milestoneScale = useSharedValue(0.9)
  const milestoneUnfurl = useSharedValue(0.5)

  const levelCompleteRef = useRef(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Migrated to Reanimated — run on UI thread
  const pointsOpacity = useSharedValue(0)
  const pointsMove = useSharedValue(0)
  const comboPulse = useSharedValue(1)
  const scorePulse = useSharedValue(1)
  const [showPoints, setShowPoints] = useState(false)
  const [lastPoints, setLastPoints] = useState(0)

  const deckScale = useRef(new Animated.Value(1)).current
  const [timerFrozen, setTimerFrozen] = useState(false)
  const freezeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timeLeftRef = useRef(0)
  const [arenaPlayers, setArenaPlayers] = useState<any[]>([])
  const arenaUnsubRef = useRef<(() => void) | null>(null)
  const [arenaCountdown, setArenaCountdown] = useState<number | null>(null)
  const comboGlowOpacity = useRef(new Animated.Value(0)).current
  // The dais breath — the one idle loop on the board: a single native-driver
  // opacity pulse on the current-card dais (2 views), nothing per-card.
  const daisBreath = useRef(new Animated.Value(0.55)).current
  const [rank, setRank] = useState<number | null>(null)
  const [dailyRank, setDailyRank] = useState<number | null>(null)
  const [isAllTimeRecord, setIsAllTimeRecord] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const [preBattle, setPreBattle] = useState(true)
  const [gloryCharges, setGloryCharges] = useState(1)
  const [gloryActive, setGloryActive] = useState(false)

  const gloryActiveRef = useRef(false)

  // Refs mirror state so handleCardPress can have a stable reference
  const cardsRef = useRef<ICard[]>([])
  const currentIndexRef = useRef(0)
  const secondCardRef = useRef<number | null>(null)
  const comboRef = useRef(0)
  const bountyIndicesRef = useRef<Set<number>>(new Set())
  const levelRef = useRef(1)
  const deckIndexRef = useRef(0)
  const freeDrawAvailableRef = useRef(true)

  const [bountyIndices, setBountyIndices] = useState<Set<number>>(new Set())

  // Combo tier at the moment of capture — read by FallingCard's flash through
  // a stable ref-context (never re-renders the field).
  const vanquishTierRef = useRef(0)

  const [isPersonalBest, setIsPersonalBest] = useState(false)
  const [previousBest, setPreviousBest] = useState(0)

  const [bestComboEver, setBestComboEver] = useState(0)
  const personalBestComboShownRef = useRef(false)

  // Reanimated styles for hot-path animations — must be at component top level
  const comboPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboPulse.value }],
  }))

  const scorePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulse.value }],
  }))

  // Gold wash over the treasury when spoils land — the points feel collected.
  const treasuryFlash = useSharedValue(0)
  const treasuryFlashStyle = useAnimatedStyle(() => ({
    opacity: treasuryFlash.value,
  }))

  const pointsPopupStyle = useAnimatedStyle(() => ({
    opacity: pointsOpacity.value,
    transform: [{ translateY: pointsMove.value }],
  }))

  // The milestone banner unfurls: pops wide while the cloth drops open (scaleY).
  const milestoneStyle = useAnimatedStyle(() => ({
    opacity: milestoneOpacity.value,
    transform: [
      { scale: milestoneScale.value },
      { scaleY: milestoneUnfurl.value },
    ],
  }))

  // Start the dais breath once — battlements/dais live for the whole session.
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(daisBreath, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(daisBreath, {
          toValue: 0.55,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  useEffect(() => {
    if (!arenaMode || !betweenLevels || arenaPlayers.length === 0) return
    const allReady = arenaPlayers.every(
      (p: any) => (p.currentLevel || 0) >= level || p.disconnected === true,
    )
    if (allReady && arenaCountdown === null) {
      setArenaCountdown(3)
    }
  }, [arenaPlayers, betweenLevels, level, arenaMode])

  // Sync state to refs so stable callbacks can read latest values
  useEffect(() => {
    cardsRef.current = cards
    currentIndexRef.current = currentIndex
    secondCardRef.current = secondCard
    comboRef.current = combo
    bountyIndicesRef.current = bountyIndices
    levelRef.current = level
    deckIndexRef.current = deckIndex
    freeDrawAvailableRef.current = freeDrawAvailable
  })

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
        saveGameResults({
          uid,
          heroName,
          score,
          bestCombo,
          totalCleared,
          clearPct,
          dailyMode,
          arenaMode,
          roomCode,
        }).then((results) => {
          if (results.isAllTimeRecord) {
            setIsAllTimeRecord(true)
            setShowCelebration(true)
          }
          if (results.isPersonalBest) {
            setPreviousBest(results.previousBest)
            setIsPersonalBest(true)
          }
          setRank(results.rank)
          setDailyRank(results.dailyRank)
        })
      }
      if (score > 0) {
        saveScore(score, bestCombo)
        incrementGamesPlayed()
      }
      if (bestCombo > bestComboEver) {
        AsyncStorage.setItem(StorageKeys.bestComboEver, bestCombo.toString())
      }
    }
  }, [gameOver])

  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.bestComboEver).then((val) => {
      if (val) setBestComboEver(parseInt(val))
    })
  }, [])

  useEffect(() => {
    if (combo > 0) {
      if (combo > bestCombo) setBestCombo(combo)
      // Personal best combo milestone — fires once per run when player beats their lifetime best
      if (
        combo > bestComboEver &&
        bestComboEver > 0 &&
        !personalBestComboShownRef.current &&
        combo >= 10 // don't fire for trivial new "records" early in a player's life
      ) {
        personalBestComboShownRef.current = true
        setBestComboEver(combo)
        AsyncStorage.setItem(StorageKeys.bestComboEver, combo.toString())
        showMilestone(`NEW BEST COMBO x${combo}!`, palette.goldBright, {
          fam: "mci",
          name: "crown",
        })
      }
      if (combo >= 12) {
        comboGlowOpacity.setValue(0.8)
        Animated.timing(comboGlowOpacity, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }).start()
      } else {
        comboGlowOpacity.setValue(0)
      }
      comboPulse.value = withSequence(
        withTiming(1.4, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      )

      // Banner planted (scoring v2): the milestone banks a permanent bonus and
      // freezes the clock — one ladder for bank, freeze, banner and sound.
      const m = COMBO_MILESTONES[combo]
      if (m) {
        const bank = getBannerBank(
          combo,
          levelRef.current,
          gloryActiveRef.current,
        )
        setScore((s) => s + bank)
        setBannersPlanted((b) => b + 1)
        showMilestone(
          m.text,
          m.color,
          m.icon,
          `+${bank.toLocaleString()} BANKED`,
        )
        freezeTimerForCombo(BANNER_FREEZE_SECONDS)
      }
    }
  }, [combo])

  useEffect(() => {
    if (score > 0) {
      scorePulse.value = withSequence(
        withTiming(1.15, { duration: 60 }),
        withTiming(1, { duration: 100 }),
      )
      treasuryFlash.value = withSequence(
        withTiming(0.28, { duration: 60 }),
        withTiming(0, { duration: 300 }),
      )
    }
  }, [score])

  const showMilestone = (
    text: string,
    color: string,
    icon: SigilSpec,
    sub = "",
  ) => {
    setMilestoneText(text)
    setMilestoneSub(sub)
    setMilestoneColor(color)
    setMilestoneIcon(icon)
    milestoneOpacity.value = withTiming(1, { duration: 90 })
    milestoneScale.value = withSequence(
      withTiming(1.05, { duration: 140 }),
      withTiming(1, { duration: 110 }),
    )
    milestoneUnfurl.value = 0.5
    milestoneUnfurl.value = withTiming(1, { duration: 190 })
    setTimeout(() => {
      milestoneOpacity.value = withTiming(0, { duration: 250 })
    }, 480)
  }

  const freezeTimerForCombo = (seconds: number) => {
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setTimerFrozen(true)
    freezeTimer.current = setTimeout(() => {
      setTimerFrozen(false)
    }, seconds * 1000)
    SoundService.playFreeze()
  }

  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG[1]
  const tableConfig =
    WAR_TABLE_CONFIG[theme.warTable || "classic"] || WAR_TABLE_CONFIG.classic

  const bountyConfig =
    BOUNTY_STYLE_CONFIG[theme.bountyStyle || "classic"] ||
    BOUNTY_STYLE_CONFIG.classic

  const [freeDrawAvailable, setFreeDrawAvailable] = useState(true)

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
    const timeBonus = getTimeBonus(timeLeftRef.current, gloryActiveRef.current)
    if (timeBonus > 0) setScore((s) => s + timeBonus)

    const deckRemaining = cards.length - deckIndex
    const deckBonus = getDeckBonus(deckRemaining, gloryActiveRef.current)
    if (deckBonus > 0) setScore((s) => s + deckBonus)

    const allCleared = cards
      .slice(0, config.fieldCards)
      .every((c) => !c.visible)
    if (allCleared) {
      const perfectBonus = getPerfectClearBonus(level, gloryActiveRef.current)
      setScore((s) => s + perfectBonus)
      showMilestone(
        "PERFECT CLEAR!",
        "#7BED9F",
        { fam: "mci", name: "star-four-points" },
        `+${perfectBonus.toLocaleString()}`,
      )
    }

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

    setArenaCountdown(null)
    setGloryActive(false)
    gloryActiveRef.current = false
    setBountyIndices(new Set())
    setBetweenLevels(true)
  }, [cards, config.fieldCards])

  const initLevel = useCallback(() => {
    if (alreadyPlayed) return
    setLoading(true)
    setFreeDrawAvailable(true)
    setReady(false)
    levelCompleteRef.current = false
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    const deck = dailyMode
      ? generateDailyDeck(getTodayString(), level)
      : arenaMode && roomCode
        ? generateDailyDeck(`${roomCode}-${round}`, level)
        : generateDeck()
    setCards(deck.map((c, i) => ({ ...c, visible: i < config.fieldCards })))
    // Bounty placement: seeded on shared decks (Daily/Arena) so every player
    // faces the same bounties — same-deck fairness (GAMEPLAY.md §8). Free play
    // stays random.
    const bountySeedBase = dailyMode
      ? getTodayString()
      : arenaMode && roomCode
        ? `${roomCode}-${round}`
        : null
    const bountyPicks = bountySeedBase
      ? pickSeededIndices(
          config.fieldCards,
          2,
          `mythic-${bountySeedBase}-level-${level}-bounty`,
        )
      : Array.from({ length: config.fieldCards }, (_, i) => i)
          .sort(() => Math.random() - 0.5)
          .slice(0, 2)
    setBountyIndices(new Set(bountyPicks))
    setCurrentIndex(config.deckStart)
    setDeckIndex(config.deckStart + 1)

    setCombo(0)

    setSecondCard(null)
    setTimerFrozen(false)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      SoundService.playShuffle()
      setTimeout(() => setReady(true), 50)
    }, 20)
    // round/roomCode feed the deck + bounty seeds — they must be deps or an
    // arena rematch re-deals the previous round's deck from a stale closure.
  }, [
    level,
    round,
    config.fieldCards,
    config.deckStart,
    dailyMode,
    arenaMode,
    roomCode,
    alreadyPlayed,
  ])

  useEffect(() => {
    if (!alreadyPlayed && !preBattle) initLevel()
  }, [level, round, alreadyPlayed, preBattle])
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
    // Nema spoja i nema wilda više — kraj layouta
    advanceLevel()
  }, [deckIndex, cards, currentIndex, secondCard, ready])

  const showPointsAnimation = (pts: number) => {
    requestAnimationFrame(() => {
      setLastPoints(pts)
      setShowPoints(true)
      pointsOpacity.value = 1
      pointsMove.value = 0
      pointsOpacity.value = withTiming(0, { duration: 400 })
      pointsMove.value = withTiming(-25, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(setShowPoints)(false)
        }
      })
    })
  }

  const handleCardPress = useCallback((index: number) => {
    const cards = cardsRef.current
    const currentIndex = currentIndexRef.current
    const secondCard = secondCardRef.current
    const combo = comboRef.current
    const bountyIndices = bountyIndicesRef.current
    const level = levelRef.current

    const cur = cards[currentIndex]
    const tapped = cards[index]
    if (!cur || !tapped) return

    const mc = isCardMatch(cur, tapped)
    const ms = secondCard !== null && isCardMatch(cards[secondCard], tapped)
    if (!mc && !ms) return

    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }

    const nc = combo + 1
    const isBounty = bountyIndices.has(index)
    const pts = getMatchPoints(nc, level, gloryActiveRef.current)
    // Bounty v2: worth 3× the card's match points at the current combo tier —
    // capturing one late in a chain is the payoff for routing toward it.
    const bountyBonus = isBounty
      ? getBountyBonus(nc, level, gloryActiveRef.current)
      : 0

    if (isBounty)
      showMilestone(
        "BOUNTY!",
        palette.goldBright,
        { fam: "mci", name: "sack" },
        `×3 · +${(pts + bountyBonus).toLocaleString()}`,
      )
    SoundService.playMatch(nc)
    showPointsAnimation(pts + bountyBonus)

    vanquishTierRef.current = nc >= 24 ? 3 : nc >= 16 ? 2 : nc >= 8 ? 1 : 0
    setCards((prev) => {
      const u = [...prev]
      u[index] = { ...u[index], visible: false }
      return u
    })
    setCombo(nc)
    setScore((s) => s + pts + bountyBonus)

    if (mc) {
      if (nc >= SECOND_CARD_COMBO && secondCard === null) {
        setSecondCard(currentIndex)
      }
      setCurrentIndex(index)
    } else {
      setSecondCard(index)
    }
  }, [])

  const activateGloryHunt = () => {
    if (gloryCharges <= 0) return
    setGloryCharges((c) => c - 1)
    setGloryActive(true)
    gloryActiveRef.current = true
    SoundService.playFreeze()
  }

  const handleDeckPress = useCallback(() => {
    const cards = cardsRef.current
    const deckIndex = deckIndexRef.current

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
  }, [])

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
    setFreeDrawAvailable(true)
    setBestCombo(0)
    setBannersPlanted(0)
    setTotalCleared(0)
    setTotalFieldCards(0)
    setLevel(1)
    setGameOver(false)
    setScoreSaved(false)
    setRound((r) => r + 1)
    setPreBattle(true)
    setGloryCharges(1)
    setGloryActive(false)
    setBountyIndices(new Set())
    setIsPersonalBest(false)
    setPreviousBest(0)
    personalBestComboShownRef.current = false
  }
  const handleBackPress = () => {
    setShowQuitConfirm(true)
  }
  const handleResumeFromQuit = () => {
    setShowQuitConfirm(false)
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

  const handleFreeDraw = useCallback(() => {
    const cards = cardsRef.current
    const deckIndex = deckIndexRef.current
    const freeDrawAvailable = freeDrawAvailableRef.current

    if (!freeDrawAvailable || deckIndex >= cards.length) return
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }
    setFreeDrawAvailable(false)
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
    setSecondCard(null)
    showMilestone("FREE DRAW!", palette.gold, { fam: "mci", name: "restore" })
  }, []) // ← stable

  // Render Battlefield once per battlefield theme change. Score/combo/timer
  // updates won't re-walk its 50+ child elements.
  const battlefieldMemo = useMemo(
    () => <Battlefield battlefieldId={theme.battlefield} />,
    [theme.battlefield],
  )

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
        setBannersPlanted(0)
        setTotalCleared(0)
        setTotalFieldCards(0)
        setLevel(1)
        setGameOver(false)
        setScoreSaved(false)
        setWantsRematch(false)
        setRound((r) => r + 1)
      }
    })

    return () => stateRef.off("value", onState)
  }, [arenaMode, roomCode, gameOver, wantsRematch])

  // Combo tint color — memoized so the inline style object stays referentially
  // stable across renders that don't change the combo tier. Tiers sit on the
  // banner ladder (12/24), in the fire language — no more purple.
  const comboTintColor = useMemo(() => {
    if (combo >= 24) return "rgba(192,57,43,0.08)"
    if (combo >= 16) return "rgba(230,60,60,0.07)"
    return "rgba(255,180,50,0.05)"
  }, [combo])

  const remaining = cards.length - deckIndex

  const layoutKey = `${level}-${round}`
  const getLayout = () => {
    const p = {
      cards,
      onClick: handleCardPress,
      bountyIndices,
    }

    switch (config.layout) {
      case 10:
        return <LayoutWarfront key={layoutKey} {...p} />
      case 9:
        return <Layout9 key={layoutKey} {...p} />
      case 8:
        return <Layout8 key={layoutKey} {...p} />
      case 7:
        return <Layout7 key={layoutKey} {...p} />
      case 5:
        return <Layout5 key={layoutKey} {...p} />
      default:
        return <Layout1 key={layoutKey} {...p} />
    }
  }
  // HUD tiers derive from the banner ladder — the last planted banner owns the
  // combo's color and title, so meter, banner popup and titles never disagree.
  const nextBanner = BANNER_MILESTONES.find((k) => k > combo) ?? null
  const prevBanner =
    [...BANNER_MILESTONES].reverse().find((k) => k <= combo) ?? 0
  const comboColor =
    prevBanner >= 5 ? COMBO_MILESTONES[prevBanner].color : "#E8C547"
  const comboTitle =
    prevBanner >= 5 ? COMBO_MILESTONES[prevBanner].text.replace("!", "") : ""
  const bannerFrom = Math.max(prevBanner, 2)
  const bannerPct =
    nextBanner === null
      ? 1
      : Math.min(1, Math.max(0, (combo - bannerFrom) / (nextBanner - bannerFrom)))

  // Already played daily
  if (alreadyPlayed)
    return (
      <AlreadyPlayedScreen
        theme={theme}
        background={battlefieldMemo}
        score={alreadyPlayedScore}
        onHome={onHome}
      />
    )

  if (preBattle && level === 1 && !alreadyPlayed)
    return (
      <PreBattleScreen
        theme={theme}
        background={battlefieldMemo}
        dailyMode={dailyMode}
        gloryCharges={gloryCharges}
        gloryActive={gloryActive}
        onActivateGlory={activateGloryHunt}
        onEnter={() => {
          setPreBattle(false)
          // Track battle start
          if (uid) {
            firestore()
              .collection("users")
              .doc(uid)
              .update({
                battlesStarted: firestore.FieldValue.increment(1),
                lastBattleAt: firestore.FieldValue.serverTimestamp(),
              })
              .catch(() => {})
          }
        }}
        onHome={onHome}
      />
    )
  if (loading)
    return (
      <View
        style={[styles.center, { backgroundColor: theme.battlefieldColor }]}
      >
        {battlefieldMemo}
        <View style={styles.loadRow}>
          <Icon name="sword-cross" size={15} color={palette.goldFaded} />
          <Text style={styles.loadText}>
            {dailyMode ? "Preparing daily quest..." : "Preparing the field..."}
          </Text>
        </View>
      </View>
    )

  if (gameOver) {
    return (
      <GameOverScreen
        theme={theme}
        background={battlefieldMemo}
        score={score}
        bestCombo={bestCombo}
        bannersPlanted={bannersPlanted}
        totalCleared={totalCleared}
        totalFieldCards={totalFieldCards}
        dailyMode={dailyMode}
        arenaMode={arenaMode}
        arenaPlayers={arenaPlayers}
        uid={uid}
        heroName={heroName}
        rank={rank}
        dailyRank={dailyRank}
        isPersonalBest={isPersonalBest}
        isAllTimeRecord={isAllTimeRecord}
        previousBest={previousBest}
        showCelebration={showCelebration}
        onPlayAgain={handlePlayAgain}
        onConfirmQuit={handleConfirmQuit}
        onHome={onHome}
        onDismissCelebration={() => setShowCelebration(false)}
      />
    )
  }

  if (betweenLevels) {
    const cleared = cards.slice(0, config.fieldCards).every((c) => !c.visible)
    const rem =
      config.fieldCards -
      cards.slice(0, config.fieldCards).filter((c) => !c.visible).length

    return (
      <BetweenLevelsScreen
        theme={theme}
        background={battlefieldMemo}
        cleared={cleared}
        remaining={rem}
        level={level}
        score={score}
        gloryActive={gloryActive}
        gloryCharges={gloryCharges}
        arenaMode={arenaMode}
        arenaPlayers={arenaPlayers}
        uid={uid}
        arenaCountdown={arenaCountdown}
        onActivateGlory={activateGloryHunt}
        onNextLevel={handleNextLevel}
      />
    )
  }

  if (paused)
    return (
      <PausedScreen
        theme={theme}
        background={battlefieldMemo}
        score={score}
        dailyMode={dailyMode}
        onResume={() => setPaused(false)}
        onRestart={() => {
          setPaused(false)
          setScore(0)
          setLevel(1)
          setRound((r) => r + 1)
        }}
        onHome={onHome}
      />
    )

  return (
    <CardBackColorContext.Provider
      value={dailyMode ? "#3D2E0A" : theme.cardBackColor}
    >
      <BountyStyleContext.Provider value={bountyConfig}>
        <VanquishTierContext.Provider value={vanquishTierRef}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: dailyMode ? "#0F0A05" : theme.battlefieldColor },
          ]}
        >
          {battlefieldMemo}
          {combo >= 12 && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: comboTintColor, opacity: comboGlowOpacity },
              ]}
            />
          )}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBackPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={13} color={palette.goldFaded} />
          </TouchableOpacity>
          {gloryActive && (
            <View style={styles.gloryBadge}>
              <Icon name="lightning-bolt" size={12} color={palette.ember} />
              <Text style={styles.gloryBadgeText}>GLORY HUNT · 2X</Text>
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
            <Battlements color={tableConfig.color} />
            <View
              style={[
                styles.wall,
                {
                  backgroundColor: dailyMode ? "#1A1510" : tableConfig.color,
                  borderTopColor: tableConfig.accent + "18",
                },
                dailyMode && styles.wallDaily,
              ]}
            >
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
                {freeDrawAvailable &&
                  remaining > 0 &&
                  !betweenLevels &&
                  !gameOver && (
                    <TouchableOpacity
                      style={styles.freeDrawCard}
                      onPress={handleFreeDraw}
                      activeOpacity={0.7}
                    >
                      <View style={styles.freeDrawCardInner}>
                        <View style={styles.freeDrawFrame} />
                        <View style={styles.freeDrawCorner}>
                          <Icon
                            name="restore"
                            size={10}
                            color={palette.goldDeep}
                          />
                        </View>
                        <Icon
                          name="restore"
                          size={28}
                          color={palette.goldDeep}
                        />
                        <View
                          style={[
                            styles.freeDrawCorner,
                            styles.freeDrawCornerBR,
                          ]}
                        >
                          <Icon
                            name="restore"
                            size={10}
                            color={palette.goldDeep}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                <View style={styles.treasury}>
                  <Reanimated.View
                    style={[styles.treasuryFlash, treasuryFlashStyle]}
                    pointerEvents="none"
                  />
                  <View style={styles.treasuryMedal}>
                    <Icon name="sack" size={12} color={palette.goldDeep} />
                  </View>
                  <View>
                    <Text style={styles.spoilsLabel}>SPOILS</Text>
                    <Reanimated.Text
                      style={[styles.scoreValue, scorePulseStyle]}
                    >
                      {score.toLocaleString()}
                    </Reanimated.Text>
                  </View>
                </View>
              </View>
              {/* The dais — the current card(s) stand center-table, rising past
                  the battlement line, on a breathing engraved inlay. */}
              <View style={styles.centerCards} pointerEvents="box-none">
                <View style={styles.dais}>
                  <Animated.View
                    style={[styles.daisGlow, { opacity: daisBreath }]}
                  />
                  <View style={styles.daisFrame} pointerEvents="none" />
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
              </View>
              <View style={styles.rightBox}>
                <Timer
                  key={layoutKey}
                  initialTime={
                    gloryActiveRef.current
                      ? Math.round(config.time * 0.5)
                      : config.time
                  }
                  onTimeUp={advanceLevel}
                  paused={paused || betweenLevels || showQuitConfirm}
                  frozen={timerFrozen}
                  onTick={(t) => {
                    timeLeftRef.current = t
                  }}
                />
                <View style={styles.comboWrap}>
                  {/* Hidden entirely below x2 — a persistent x0/x1 in the corner
                      communicates nothing (§4.2.3). comboWrap reserves the height
                      so the timer above never shifts when it appears. The meter
                      fills toward the next banner milestone — the push-your-luck
                      state, always readable. */}
                  {combo >= 2 && (
                    <>
                      <View style={styles.comboRow}>
                        <Reanimated.Text
                          style={[
                            styles.comboValue,
                            comboPulseStyle,
                            {
                              color: comboColor,
                              textShadowColor:
                                combo >= 10 ? comboColor : "transparent",
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius:
                                combo >= 25 ? 18 : combo >= 10 ? 9 : 0,
                            },
                          ]}
                        >
                          x{combo}
                        </Reanimated.Text>
                        <View style={styles.bannerTrack}>
                          <View
                            style={[
                              styles.bannerFill,
                              {
                                width: `${Math.round(bannerPct * 100)}%`,
                                backgroundColor: comboColor,
                              },
                            ]}
                          />
                        </View>
                        {nextBanner !== null ? (
                          <View style={styles.bannerNext}>
                            <Icon
                              name="flag-variant"
                              size={10}
                              color={palette.goldFaded}
                            />
                            <Text style={styles.bannerNextNum}>
                              {nextBanner}
                            </Text>
                          </View>
                        ) : (
                          <Icon
                            name="flag-checkered"
                            size={11}
                            color={palette.goldBright}
                          />
                        )}
                      </View>
                      {comboTitle !== "" && (
                        <Text
                          style={[
                            styles.comboTitle,
                            { color: comboColor + "90" },
                          ]}
                          numberOfLines={1}
                        >
                          {comboTitle}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
          {showPoints && (
            <Reanimated.View style={[styles.pointsPopup, pointsPopupStyle]}>
              <Text
                style={[
                  styles.pointsText,
                  {
                    fontSize:
                      combo >= 24
                        ? 40
                        : combo >= 16
                          ? 34
                          : combo >= 12
                            ? 30
                            : 26,
                    color: comboColor,
                  },
                ]}
              >
                +{lastPoints.toLocaleString()}
              </Text>
              {comboTitle !== "" && (
                <Text
                  style={{
                    fontSize: combo >= 24 ? 14 : combo >= 16 ? 12 : 10,
                    fontWeight: "900",
                    letterSpacing: 2,
                    color: comboColor + "99",
                  }}
                >
                  {comboTitle}
                </Text>
              )}
            </Reanimated.View>
          )}
          <Reanimated.View
            style={[
              styles.milestone,
              milestoneStyle,
              {
                borderColor: milestoneColor + "30",
                borderTopColor: milestoneColor + "AA",
                shadowColor: milestoneColor,
              },
            ]}
            pointerEvents="none"
          >
            <Sigil
              sigil={milestoneIcon}
              size={combo >= 16 ? 30 : 24}
              color={milestoneColor}
            />
            <View style={styles.milestoneTextWrap}>
              <Text
                style={[
                  styles.milestoneText,
                  {
                    color: milestoneColor,
                    fontSize:
                      combo >= 24
                        ? 28
                        : combo >= 16
                          ? 24
                          : combo >= 12
                            ? 20
                            : 18,
                  },
                ]}
              >
                {milestoneText}
              </Text>
              {milestoneSub ? (
                <Text
                  style={[styles.milestoneBank, { color: milestoneColor }]}
                >
                  {milestoneSub}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.milestoneMultiplier,
                  { color: milestoneColor + "80" },
                ]}
              >
                x{combo} COMBO
              </Text>
            </View>
          </Reanimated.View>
          {showQuitConfirm && (
            <QuitConfirmModal
              dailyMode={dailyMode}
              score={score}
              onResume={handleResumeFromQuit}
              onConfirmQuit={handleConfirmQuit}
            />
          )}
          </Animated.View>
        </VanquishTierContext.Provider>
      </BountyStyleContext.Provider>
    </CardBackColorContext.Provider>
  )
}

// GAME STYLES UPGRADE — Replace the styles StyleSheet in your Game.tsx with this
// All game logic remains untouched — only visual styling changes

const styles = StyleSheet.create({
  // ─────────────────────────────────────
  //  MAIN GAME CONTAINER
  // ─────────────────────────────────────
  container: { flex: 1 },
  field: { flex: 1, width: "100%", justifyContent: "center" },

  // ─────────────────────────────────────
  //  BACK (X) BUTTON — Top left
  // ─────────────────────────────────────
  backBtn: {
    position: "absolute",
    top: 6,
    left: 8,
    zIndex: 100,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.2)",
  },
  // ═══════════════════════════════════════════
  //  ██  THE WAR TABLE — bottom bar  ██
  //  One continuous engraved surface. Stations are carved wells set into the
  //  wood (dark inset + catch-light edge), not bordered widgets floating on it;
  //  the current card stands on a breathing dais rising past the battlements.
  // ═══════════════════════════════════════════
  wallContainer: { width: "100%", zIndex: 3 },
  wall: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#18120E",
    borderTopWidth: 1.5,
    borderTopColor: "rgba(232,197,71,0.1)",
  },

  // Deck + Spoils
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 2,
  },
  // SPOILS treasury — carved into the table: dark well, shadowed top lip,
  // catch-light bottom edge. Flashes gold when spoils land.
  treasury: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(4,8,5,0.55)",
    borderRadius: 9,
    paddingLeft: 7,
    paddingRight: 13,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.55)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  treasuryFlash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.gold,
    borderRadius: 9,
  },
  treasuryMedal: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(232,197,71,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Center dais — positions the station; the dais itself hugs the cards.
  centerCards: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  dais: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: -7,
  },
  daisGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: "rgba(232,197,71,0.07)",
    borderWidth: 1,
    borderColor: palette.goldLine,
    shadowColor: palette.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  daisFrame: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.14)",
  },

  // Timer + combo gauge station — the treasury's carved-well twin.
  rightBox: {
    alignItems: "center",
    gap: 2,
    minWidth: 96,
    zIndex: 2,
    backgroundColor: "rgba(4,8,5,0.55)",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.55)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  spoilsLabel: {
    fontFamily: font.heading,
    color: palette.goldFaded,
    fontSize: 8,
    letterSpacing: 2,
  },
  scoreValue: {
    fontFamily: font.display,
    color: "#E8C547",
    fontSize: 17,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // ═══════════════════════════════════════════
  //  ██  POINTS POPUP & MILESTONES  ██
  // ═══════════════════════════════════════════
  pointsText: {
    fontFamily: font.display,
    color: "#E8C547",
    fontSize: 26,
    includeFontPadding: false,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // ═══════════════════════════════════════════
  //  ██  CENTER SCREENS  ██
  //  Game Over, Between Levels, Pause, Quit
  // ═══════════════════════════════════════════
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 32,
  },
  loadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadText: {
    color: palette.goldFaded,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // Daily wall variant
  wallDaily: {
    backgroundColor: "#1A1510",
    borderTopColor: "rgba(232,197,71,0.18)",
  },

  // Glory badge during gameplay — top right
  gloryBadge: {
    position: "absolute",
    top: 4,
    right: 8,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,140,0,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,140,0,0.4)",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gloryBadgeText: {
    color: "#FF8C00",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },

  // ── Combo gauge — fills toward the next banner ──
  comboWrap: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
  },
  comboRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  comboValue: {
    fontFamily: font.display,
    fontSize: 16,
    includeFontPadding: false,
    textAlign: "right",
    minWidth: 30,
  },
  bannerTrack: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.12)",
    overflow: "hidden",
  },
  bannerFill: {
    height: "100%",
    borderRadius: 2,
  },
  bannerNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  bannerNextNum: {
    color: palette.goldFaded,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  comboTitle: {
    fontSize: Math.round(6 * CARD_SCALE),
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: -1,
  },

  // ── Milestone Popup — the war banner. A colored rod along the top edge,
  //    cloth unfurling beneath it (scaleY entrance), the bank line when a
  //    banner is planted.
  milestone: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    backgroundColor: "rgba(10,8,5,0.88)",
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1.5,
    borderTopWidth: 2.5,
    borderColor: "rgba(232,197,71,0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  milestoneTextWrap: {
    alignItems: "flex-start",
  },
  milestoneText: {
    fontFamily: font.display,
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  milestoneBank: {
    fontFamily: font.heading,
    fontSize: 12,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  milestoneMultiplier: {
    fontSize: Math.round(7 * CARD_SCALE),
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 1,
  },

  // ── Points Popup — Keep existing but adjust position ──
  pointsPopup: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    alignItems: "center",
  },

  freeDrawCard: {
    width: 56,
    height: 78,
    margin: 2,
  },
  // Parchment plate in the card grammar — reads "golden reinforcement", not the
  // old purple "wrong-suit" oddity. Glyphs are the `restore` icon in goldDeep.
  freeDrawCardInner: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(184,134,11,0.6)",
    backgroundColor: palette.parchment,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  freeDrawFrame: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 7,
    borderWidth: 0.5,
    borderColor: "rgba(184,134,11,0.35)",
  },
  freeDrawCorner: {
    position: "absolute",
    top: 3,
    left: 4,
    alignItems: "center",
  },
  freeDrawCornerBR: {
    top: undefined,
    left: undefined,
    bottom: 3,
    right: 4,
    transform: [{ rotate: "180deg" }],
  },
})

export default Game
