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
import LayoutCitadel from "./LayoutCitadel"
import LayoutSiege from "./LayoutSiege"
import LayoutFloodgates from "./LayoutFloodgates"
import LayoutPeaks from "./LayoutPeaks"
import LayoutPortcullis from "./LayoutPortcullis"
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
  getUnbrokenBonus,
} from "../game/scoring"
import { Battlefield } from "./game/Battlefield"
import { BoardBurst } from "./game/BoardBurst"
import { CoachMark } from "./game/CoachMarks"
import { FirstVictoryOverlay } from "./game/FirstVictoryOverlay"
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
  // First Victory (R5): routes the one-time claim CTA into the Armory.
  onGoArmory?: () => void
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
  onGoArmory,
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
  const [perfectFields, setPerfectFields] = useState(0)
  // Fields consumed by a single unbroken chain — the apex accolade counter.
  const [unbrokenFields, setUnbrokenFields] = useState(0)
  // One-shot board detonation (banner ≥20, perfect clear, unbroken conquest).
  const [burst, setBurst] = useState<{
    key: number
    color: string
    big: boolean
  } | null>(null)
  // Spoils taken on the field just fought — feeds the between-levels count-up.
  const [fieldSpoils, setFieldSpoils] = useState(0)
  // The exhale itemized: where this field's spoils actually came from. The
  // player's discipline (fast clear → time, unspent deck → deck, perfection,
  // the unbroken chain) becomes visible money between fields.
  const [fieldLedger, setFieldLedger] = useState<{
    combat: number
    time: number
    deck: number
    perfect: number
    unbroken: number
  } | null>(null)
  const [fieldUnbroken, setFieldUnbroken] = useState(false)
  // The ghost: per-field cumulative score of the player's best completed run.
  const [ghostPace, setGhostPace] = useState<number[] | null>(null)
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
  // Combo at the moment of the show — the footer/sizing must not read live
  // combo state (a CHAIN BROKEN stamp would render "x0 COMBO" after the
  // same-press reset).
  const [milestoneCombo, setMilestoneCombo] = useState(0)

  const milestoneOpacity = useSharedValue(0)
  const milestoneScale = useSharedValue(0.9)
  const milestoneUnfurl = useSharedValue(0.5)

  const levelCompleteRef = useRef(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The clear-hold: a won field's moment plays ON the board before The Breath.
  const clearHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const milestoneHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // First-battle coach marks (R2): 0 off · 1 armed (waiting for the board) ·
  // 2 mark-match showing · 3 waiting for the first chain · 4 mark-chain ·
  // 5 mark-draw · then off. Armed only on the first-ever free battle.
  const [coachStep, setCoachStep] = useState(0)
  const coachVisible = coachStep === 2 || coachStep === 4 || coachStep === 5

  // First Victory (R5): the first-ever completed battle celebrates once.
  const [showFirstVictory, setShowFirstVictory] = useState(false)

  const gloryActiveRef = useRef(false)

  // Refs mirror state so handleCardPress can have a stable reference
  const cardsRef = useRef<ICard[]>([])
  const currentIndexRef = useRef(0)
  const secondCardRef = useRef<number | null>(null)
  const comboRef = useRef(0)
  const scoreRef = useRef(0)
  const bountyIndicesRef = useRef<Set<number>>(new Set())
  const levelRef = useRef(1)
  const deckIndexRef = useRef(0)
  const freeDrawsRef = useRef(0)
  // Run pace: cumulative score at the end of each field (index = level - 1).
  const runPaceRef = useRef<number[]>([])
  const fieldStartScoreRef = useRef(0)

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

  // The catch lands at the dais: every capture/draw thunks the incoming
  // current card onto the table (dip → overshoot → settle). One shared value
  // on the dais card wrapper — the field never re-renders for it.
  const daisPunch = useSharedValue(1)
  const daisPunchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: daisPunch.value }],
  }))
  const punchDais = () => {
    daisPunch.value = 0.9
    daisPunch.value = withSequence(
      withTiming(1.06, { duration: 90 }),
      withTiming(1, { duration: 110 }),
    )
  }

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
    scoreRef.current = score
    bountyIndicesRef.current = bountyIndices
    levelRef.current = level
    deckIndexRef.current = deckIndex
    freeDrawsRef.current = freeDraws
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
        // First Victory — once per device, any solo mode; arena's game-over
        // is the rankings moment and keeps it. The games-played check keeps
        // the overlay away from veterans updating into this build (their
        // local count is already high); the flag still writes so nobody is
        // ever re-checked.
        if (!arenaMode) {
          Promise.all([
            AsyncStorage.getItem(StorageKeys.firstVictorySeen),
            AsyncStorage.getItem(StorageKeys.gamesPlayed),
          ]).then(([seen, played]) => {
            if (seen) return
            AsyncStorage.setItem(StorageKeys.firstVictorySeen, "1").catch(
              () => {},
            )
            if (parseInt(played || "0", 10) <= 1) setShowFirstVictory(true)
          })
        }
      }
      if (bestCombo > bestComboEver) {
        AsyncStorage.setItem(StorageKeys.bestComboEver, bestCombo.toString())
      }
      // The ghost: if this completed run beat the best run's final total,
      // its per-field pace becomes the shadow every future run races.
      const pace = runPaceRef.current
      const ghostFinal = ghostPace?.[ghostPace.length - 1] ?? 0
      if (pace.length > 0 && score > ghostFinal) {
        setGhostPace([...pace])
        AsyncStorage.setItem(
          StorageKeys.bestRunPace,
          JSON.stringify(pace),
        ).catch(() => {})
      }
    }
  }, [gameOver])

  // Arm the coach on the first-ever free battle only (daily/arena stay clean).
  useEffect(() => {
    if (dailyMode || arenaMode) return
    AsyncStorage.getItem(StorageKeys.seenCoachMarks).then((v) => {
      if (!v) setCoachStep(1)
    })
  }, [])

  // Mark 1 — the match rule, the moment the first board opens.
  useEffect(() => {
    if (coachStep === 1 && ready && !preBattle && !loading) setCoachStep(2)
  }, [coachStep, ready, preBattle, loading])

  // Mark 2 — the chain, the first time one exists to point at.
  useEffect(() => {
    if (coachStep === 3 && combo >= 2) setCoachStep(4)
  }, [coachStep, combo])

  const dismissCoach = () => {
    setCoachStep((s) => {
      if (s === 2) {
        // The core rule was seen — never nag again, even if they quit here.
        AsyncStorage.setItem(StorageKeys.seenCoachMarks, "1").catch(() => {})
        return 3
      }
      if (s === 4) return 5
      return 0
    })
  }

  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.bestComboEver).then((val) => {
      if (val) setBestComboEver(parseInt(val))
    })
    // The ghost — the per-field pace of the best completed run on this device.
    AsyncStorage.getItem(StorageKeys.bestRunPace).then((val) => {
      if (!val) return
      try {
        const pace = JSON.parse(val)
        if (Array.isArray(pace) && pace.length > 0) setGhostPace(pace)
      } catch {
        // corrupt ghost — ignore, a new PB rewrites it
      }
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
        showMilestone(
          `NEW BEST COMBO x${combo}!`,
          palette.goldBright,
          { fam: "mci", name: "crown" },
          "",
          700,
          combo,
        )
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
      // Banner banking lives in handleCardPress (atomic with the match's
      // setScore) — this effect only carries the visual combo feedback.
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

  // holdMs tiers the moment: everyday banners read-and-go, the top of the
  // ladder and the clear accolades hold long enough to feel witnessed. The
  // hide timer is cleared on every show so a same-tap pair (bounty + banner)
  // can't fade the survivor early.
  const showMilestone = (
    text: string,
    color: string,
    icon: SigilSpec,
    sub = "",
    holdMs = 480,
    comboAt = 0,
  ) => {
    if (milestoneHideTimer.current) clearTimeout(milestoneHideTimer.current)
    setMilestoneText(text)
    setMilestoneSub(sub)
    setMilestoneColor(color)
    setMilestoneIcon(icon)
    setMilestoneCombo(comboAt)
    milestoneOpacity.value = withTiming(1, { duration: 90 })
    milestoneScale.value = withSequence(
      withTiming(1.05, { duration: 140 }),
      withTiming(1, { duration: 110 }),
    )
    milestoneUnfurl.value = 0.5
    milestoneUnfurl.value = withTiming(1, { duration: 190 })
    milestoneHideTimer.current = setTimeout(() => {
      milestoneOpacity.value = withTiming(0, { duration: 250 })
    }, holdMs)
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

  // Free Draws bank across fields (cap 2): each field grants one; an unused
  // draw carries — earned insurance against a cold deck (GAMEPLAY §2.5 G8).
  const [freeDraws, setFreeDraws] = useState(0)

  const advanceLevel = useCallback(() => {
    if (levelCompleteRef.current) return
    levelCompleteRef.current = true
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    const cl = cards
      .slice(0, config.fieldCards)
      .filter((c) => !c.visible).length
    setTotalCleared((p) => p + cl)
    setTotalFieldCards((p) => p + config.fieldCards)

    const allCleared = cards
      .slice(0, config.fieldCards)
      .every((c) => !c.visible)
    // Unbroken Conquest: every capture on this field landed in one chain —
    // the final combo equals the field's card count. (comboRef, not closure:
    // the ref-sync effect above runs before the all-cleared effect calls us.
    // Free draws don't break a chain; deck draws before the first capture
    // never started one.)
    const unbroken = allCleared && comboRef.current >= config.fieldCards

    // A won field stops the clock the instant it's won — the freeze holds
    // through the clear moment; a timed-out or dead field unfreezes as before.
    setTimerFrozen(allCleared)

    // End-of-field bonuses in one settle. Refs, not closures: deckIndexRef
    // stays correct after draw-only sequences and scoreRef after banner banks.
    const timeBonus = getTimeBonus(timeLeftRef.current, gloryActiveRef.current)
    const deckBonus = getDeckBonus(
      cards.length - deckIndexRef.current,
      gloryActiveRef.current,
    )
    const perfectBonus = allCleared
      ? getPerfectClearBonus(level, gloryActiveRef.current)
      : 0
    const unbrokenBonus = unbroken
      ? getUnbrokenBonus(level, gloryActiveRef.current)
      : 0
    const bonus = timeBonus + deckBonus + perfectBonus + unbrokenBonus
    if (bonus > 0) setScore((s) => s + bonus)

    if (unbroken) {
      setPerfectFields((p) => p + 1)
      setUnbrokenFields((u) => u + 1)
      setBurst({ key: Date.now(), color: palette.goldBright, big: true })
      showMilestone(
        "UNBROKEN!",
        palette.goldBright,
        { fam: "mci", name: "link-variant" },
        `ONE CHAIN · +${(perfectBonus + unbrokenBonus).toLocaleString()}`,
        1350,
        comboRef.current,
      )
      SoundService.playUnbroken()
    } else if (allCleared) {
      setPerfectFields((p) => p + 1)
      setBurst({ key: Date.now(), color: "#7BED9F", big: false })
      showMilestone(
        "PERFECT CLEAR!",
        "#7BED9F",
        { fam: "mci", name: "star-four-points" },
        `+${perfectBonus.toLocaleString()}`,
        900,
        comboRef.current,
      )
    }

    // Field ledger: spoils taken this field + the run's pace for the ghost.
    const fieldEnd = scoreRef.current + bonus
    const spoilsTaken = fieldEnd - fieldStartScoreRef.current
    setFieldSpoils(spoilsTaken)
    setFieldLedger({
      combat: spoilsTaken - bonus,
      time: timeBonus,
      deck: deckBonus,
      perfect: perfectBonus,
      unbroken: unbrokenBonus,
    })
    setFieldUnbroken(unbroken)
    fieldStartScoreRef.current = fieldEnd
    runPaceRef.current[level - 1] = fieldEnd

    if (!unbroken) SoundService.playLevelComplete()
    // Sync score to arena room — immediately, never delayed by the hold.
    if (arenaMode && roomCode && uid) {
      updatePlayerScore(
        roomCode,
        uid,
        fieldEnd,
        bestCombo,
        level,
        level >= TOTAL_LEVELS,
      )
    }

    // The clear-hold: a won field's moment (banner + burst + frozen clock)
    // plays ON the board before The Breath takes over. Previously the
    // milestone and the screen swap fired in the same synchronous block, so
    // the perfect-clear banner never actually rendered a frame. Deck, free
    // draw and card presses are guarded by levelCompleteRef during the hold.
    const finish = () => {
      setShowQuitConfirm(false)
      setArenaCountdown(null)
      setGloryActive(false)
      gloryActiveRef.current = false
      setBountyIndices(new Set())
      setBetweenLevels(true)
    }
    const holdMs = unbroken ? 1500 : allCleared ? 950 : 0
    if (holdMs > 0) {
      clearHoldTimer.current = setTimeout(finish, holdMs)
    } else {
      finish()
    }
  }, [cards, config.fieldCards])

  const initLevel = useCallback(() => {
    if (alreadyPlayed) return
    setLoading(true)
    // Each field grants one Free Draw; an unused one banks (cap 2). Run-reset
    // paths zero the count first, so field 1 always starts at exactly 1.
    setFreeDraws((f) => Math.min(f + 1, 2))
    setReady(false)
    levelCompleteRef.current = false
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (clearHoldTimer.current) clearTimeout(clearHoldTimer.current)
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
      if (clearHoldTimer.current) clearTimeout(clearHoldTimer.current)
      if (milestoneHideTimer.current) clearTimeout(milestoneHideTimer.current)
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
    if (levelCompleteRef.current) return
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
    // Banner planted (scoring v2): banked atomically with the match's setScore
    // so field totals can never read a score missing a pending bank.
    const banner = COMBO_MILESTONES[nc]
    const bank = banner
      ? getBannerBank(nc, level, gloryActiveRef.current)
      : 0

    if (isBounty)
      showMilestone(
        "BOUNTY!",
        palette.goldBright,
        { fam: "mci", name: "sack" },
        `×3 · +${(pts + bountyBonus).toLocaleString()}`,
        480,
        nc,
      )
    if (banner) {
      setBannersPlanted((b) => b + 1)
      showMilestone(
        banner.text,
        banner.color,
        banner.icon,
        `+${bank.toLocaleString()} BANKED`,
        nc >= 20 ? 850 : 550,
        nc,
      )
      freezeTimerForCombo(BANNER_FREEZE_SECONDS)
      // RAMPAGE and above detonate the board — the top half of the ladder
      // should be felt across the whole table, not just read in a corner.
      if (nc >= 20)
        setBurst({ key: Date.now(), color: banner.color, big: nc >= 28 })
    }
    SoundService.playMatch(nc)
    showPointsAnimation(pts + bountyBonus)
    punchDais()

    vanquishTierRef.current = nc >= 24 ? 3 : nc >= 16 ? 2 : nc >= 8 ? 1 : 0
    setCards((prev) => {
      const u = [...prev]
      u[index] = { ...u[index], visible: false }
      return u
    })
    setCombo(nc)
    setScore((s) => s + pts + bountyBonus + bank)

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
    if (levelCompleteRef.current) return
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

    // The grave marker: a chain worth at least one banner dies with a stamp,
    // not in silence — the loss is legible and the banked banners' insurance
    // reads at the exact moment it matters. (combo ≥ 5 ⟹ the 5-banner was
    // planted this chain, so "banners hold" is always true here.)
    const brokenCombo = comboRef.current
    if (brokenCombo >= 5) {
      showMilestone(
        "CHAIN BROKEN",
        palette.steel,
        { fam: "mci", name: "link-variant-off" },
        `x${brokenCombo} FELL · BANNERS HOLD`,
        520,
      )
    }

    setCurrentIndex(deckIndex)
    setDeckIndex((i) => i + 1)
    setCombo(0)
    setTimerFrozen(false)
    if (freezeTimer.current) clearTimeout(freezeTimer.current)
    setSecondCard(null)
    punchDais()
  }, [])

  const handleNextLevel = () => {
    setBetweenLevels(false)
    level >= TOTAL_LEVELS ? setGameOver(true) : setLevel((l) => l + 1)
  }

  // Everything a fresh run must zero — shared by play-again, the paused
  // restart and the arena rematch (the latter two previously leaked stale
  // bestCombo / glory charges / totals into the new run).
  const resetRunState = () => {
    setScore(0)
    setFreeDraws(0)
    setBestCombo(0)
    setBannersPlanted(0)
    setPerfectFields(0)
    setUnbrokenFields(0)
    setBurst(null)
    setFieldSpoils(0)
    setFieldLedger(null)
    setFieldUnbroken(false)
    setTotalCleared(0)
    setTotalFieldCards(0)
    setGloryCharges(1)
    setGloryActive(false)
    gloryActiveRef.current = false
    setBountyIndices(new Set())
    setIsPersonalBest(false)
    setPreviousBest(0)
    personalBestComboShownRef.current = false
    runPaceRef.current = []
    fieldStartScoreRef.current = 0
  }

  const handlePlayAgain = () => {
    if (dailyMode) {
      onHome?.()
      return
    }
    resetRunState()
    setLevel(1)
    setGameOver(false)
    setScoreSaved(false)
    setRound((r) => r + 1)
    setPreBattle(true)
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
    if (levelCompleteRef.current) return
    const cards = cardsRef.current
    const deckIndex = deckIndexRef.current

    if (freeDrawsRef.current <= 0 || deckIndex >= cards.length) return
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }
    setFreeDraws((f) => f - 1)
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
    punchDais()
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
        resetRunState()
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
      case 14:
        return <LayoutPortcullis key={layoutKey} {...p} />
      case 13:
        return <LayoutPeaks key={layoutKey} {...p} />
      case 12:
        return <LayoutFloodgates key={layoutKey} {...p} />
      case 11:
        return <LayoutSiege key={layoutKey} {...p} />
      case 10:
        return <LayoutCitadel key={layoutKey} {...p} />
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
        ghostFinal={ghostPace ? ghostPace[ghostPace.length - 1] : null}
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
      <>
      <GameOverScreen
        theme={theme}
        background={battlefieldMemo}
        score={score}
        bestCombo={bestCombo}
        bannersPlanted={bannersPlanted}
        perfectFields={perfectFields}
        unbrokenFields={unbrokenFields}
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
      {showFirstVictory && (
        <FirstVictoryOverlay
          onClaim={() => {
            setShowFirstVictory(false)
            if (onGoArmory) onGoArmory()
            else onHome?.()
          }}
          onDismiss={() => setShowFirstVictory(false)}
        />
      )}
      </>
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
        fieldSpoils={fieldSpoils}
        fieldLedger={fieldLedger}
        unbroken={fieldUnbroken}
        ghostAt={ghostPace?.[level - 1] ?? null}
        freeDraws={freeDraws}
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
          resetRunState()
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
                {freeDraws > 0 &&
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
                      {freeDraws > 1 && (
                        <View style={styles.freeDrawBadge}>
                          <Text style={styles.freeDrawBadgeText}>
                            {freeDraws}
                          </Text>
                        </View>
                      )}
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
                  <Reanimated.View style={[styles.daisCards, daisPunchStyle]}>
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
                  </Reanimated.View>
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
                  paused={
                    paused || betweenLevels || showQuitConfirm || coachVisible
                  }
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
                                combo >= 12 ? comboColor : "transparent",
                              textShadowOffset: { width: 0, height: 0 },
                              textShadowRadius:
                                combo >= 24 ? 18 : combo >= 12 ? 9 : 0,
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
          {burst && (
            <BoardBurst
              key={burst.key}
              color={burst.color}
              big={burst.big}
              onDone={() => setBurst(null)}
            />
          )}
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
              size={milestoneCombo >= 16 ? 30 : 24}
              color={milestoneColor}
            />
            <View style={styles.milestoneTextWrap}>
              <Text
                style={[
                  styles.milestoneText,
                  {
                    color: milestoneColor,
                    fontSize:
                      milestoneCombo >= 24
                        ? 28
                        : milestoneCombo >= 16
                          ? 24
                          : milestoneCombo >= 12
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
              {milestoneCombo >= 2 && (
                <Text
                  style={[
                    styles.milestoneMultiplier,
                    { color: milestoneColor + "80" },
                  ]}
                >
                  x{milestoneCombo} COMBO
                </Text>
              )}
            </View>
          </Reanimated.View>
          {coachVisible && (
            <CoachMark
              variant={
                coachStep === 2 ? "match" : coachStep === 4 ? "chain" : "draw"
              }
              onDismiss={dismissCoach}
            />
          )}
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
  daisCards: { flexDirection: "row", gap: 4, alignItems: "center" },
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
  // Banked-draw pip — appears when an unused Free Draw carried over (cap 2).
  freeDrawBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.goldDeep,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#0B1410",
    elevation: 4,
  },
  freeDrawBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1a1a1a",
  },
})

export default Game
