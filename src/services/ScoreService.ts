import firestore from "@react-native-firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getTodayString, getYesterdayString } from "./CardService"
import { Collections } from "./collections"
import { StorageKeys } from "./storageKeys"
import { logError } from "./logError"
import { submitDailyScore } from "./DailyQuestService"
import { getSavedLoungeCode, submitLoungeScore } from "./LoungeService"
import { updatePlayerScore } from "./ArenaService"
import { TOTAL_LEVELS } from "../game/config"
import type { DailyScore } from "./DailyQuestService"

// Get all-time best scores (top 50)
export const getAllTimeLeaderboard = async (): Promise<DailyScore[]> => {
  try {
    const snapshot = await firestore()
      .collection(Collections.gameScores)
      .orderBy("score", "desc")
      .limit(50)
      .get()
    return snapshot.docs.map((doc) => doc.data() as DailyScore)
  } catch (err) {
    logError("Score.getAllTimeLeaderboard", err)
    return []
  }
}

// Submit to all-time leaderboard (only keeps user's best)
export const submitAllTimeScore = async (
  uid: string,
  heroName: string,
  score: number,
  bestCombo: number,
): Promise<void> => {
  try {
    const userDoc = await firestore()
      .collection(Collections.users)
      .doc(uid)
      .get()
    const gamesPlayed = userDoc.data()?.gamesPlayed || 0

    const doc = await firestore()
      .collection(Collections.allTimeScores)
      .doc(uid)
      .get()
    if (!doc.exists() || (doc.data()?.score || 0) < score) {
      await firestore().collection(Collections.allTimeScores).doc(uid).set({
        uid,
        heroName,
        score,
        bestCombo,
        gamesPlayed,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    } else if (doc.exists()) {
      // Always update gamesPlayed even if score didn't change
      await firestore().collection(Collections.allTimeScores).doc(uid).update({
        gamesPlayed,
      })
    }
  } catch (err) {
    logError("Score.submitAllTimeScore", err)
  }
}

export const submitGameScore = async (
  uid: string,
  heroName: string,
  score: number,
  bestCombo: number,
  isDaily: boolean,
): Promise<void> => {
  try {
    const userDoc = await firestore()
      .collection(Collections.users)
      .doc(uid)
      .get()
    const gamesPlayed = userDoc.data()?.gamesPlayed || 0

    await firestore().collection(Collections.gameScores).add({
      uid,
      heroName,
      score,
      bestCombo,
      isDaily,
      gamesPlayed,
      playedAt: firestore.FieldValue.serverTimestamp(),
    })

    await firestore()
      .collection(Collections.users)
      .doc(uid)
      .update({
        totalScore: firestore.FieldValue.increment(score),
      })
  } catch (err) {
    logError("Score.submitGameScore", err)
  }
}

export const updateUserProfile = async (
  uid: string,
  score: number,
  bestCombo: number,
  cardsCleared: number,
): Promise<void> => {
  try {
    const ref = firestore().collection(Collections.users).doc(uid)
    const doc = await ref.get()
    const data = doc.data() || {}

    // Streak logic
    const today = getTodayString() // reuse your existing helper
    const lastPlayed = data.lastPlayedDate || null

    let currentStreak = data.currentStreak || 0
    let bestStreak = data.bestStreak || 0

    if (lastPlayed === today) {
      // Already played today — don't change streak
    } else if (lastPlayed === getYesterdayString()) {
      // Consecutive day — increment
      currentStreak = currentStreak + 1
    } else {
      // Missed a day or first game ever — reset
      currentStreak = 1
    }

    bestStreak = Math.max(bestStreak, currentStreak)

    await ref.set(
      {
        bestScore: Math.max(data.bestScore || 0, score),
        bestCombo: Math.max(data.bestCombo || 0, bestCombo),
        totalGames: (data.totalGames || 0) + 1,
        totalCardsCleared: (data.totalCardsCleared || 0) + cardsCleared,
        totalScore: (data.totalScore || 0) + score,
        lastPlayedAt: firestore.FieldValue.serverTimestamp(),
        lastPlayedDate: today,
        currentStreak,
        bestStreak,
      },
      { merge: true },
    )
    await AsyncStorage.setItem(StorageKeys.bestStreak, bestStreak.toString())
  } catch (err) {
    logError("Score.updateUserProfile", err)
  }
}

export const getUserProfile = async (uid: string): Promise<any> => {
  try {
    const doc = await firestore()
      .collection(Collections.users)
      .doc(uid)
      .get()
    return doc.exists() ? doc.data() : null
  } catch (err) {
    logError("Score.getUserProfile", err)
    return null
  }
}

// --- End-of-game score-saving flow (extracted from Game.tsx gameOver effect) ---

export interface SaveGameResultsParams {
  uid: string
  heroName: string
  score: number
  bestCombo: number
  totalCleared: number
  clearPct: number
  dailyMode: boolean
  arenaMode?: boolean
  roomCode?: string
}

export interface SaveGameResults {
  rank: number | null
  dailyRank: number | null
  isAllTimeRecord: boolean
  isPersonalBest: boolean
  previousBest: number
}

// Is this score a new all-time record (beats the current #1)?
const checkAllTimeRecord = async (score: number): Promise<boolean> => {
  try {
    const snap = await firestore()
      .collection(Collections.allTimeScores)
      .orderBy("score", "desc")
      .limit(1)
      .get()
    return snap.empty || score > (snap.docs[0].data().score || 0)
  } catch (err) {
    logError("Score.checkAllTimeRecord", err)
    return false
  }
}

// Does this score beat the player's previous personal best (and had one)?
const checkPersonalBest = async (
  uid: string,
  score: number,
): Promise<{ isPersonalBest: boolean; previousBest: number }> => {
  try {
    const doc = await firestore().collection(Collections.users).doc(uid).get()
    const prevBest = doc.exists() ? doc.data()?.bestScore || 0 : 0
    if (score > prevBest && prevBest > 0) {
      return { isPersonalBest: true, previousBest: prevBest }
    }
    return { isPersonalBest: false, previousBest: 0 }
  } catch (err) {
    logError("Score.checkPersonalBest", err)
    return { isPersonalBest: false, previousBest: 0 }
  }
}

// Leaderboard rank for this game (1 + number of higher scores).
const fetchRank = async (score: number): Promise<number | null> => {
  try {
    const snap = await firestore()
      .collection(Collections.gameScores)
      .where("score", ">", score)
      .get()
    return snap.size + 1
  } catch (err) {
    logError("Score.fetchRank", err)
    return null
  }
}

// Submit the daily score, then resolve this run's daily rank.
const submitAndRankDaily = async (
  uid: string,
  heroName: string,
  score: number,
  bestCombo: number,
  clearPct: number,
): Promise<number | null> => {
  try {
    await submitDailyScore(uid, heroName, score, bestCombo, clearPct)
    const snap = await firestore()
      .collection(Collections.dailyScores)
      .where("date", "==", getTodayString())
      .where("score", ">", score)
      .get()
    return snap.size + 1
  } catch (err) {
    logError("Score.submitAndRankDaily", err)
    return null
  }
}

// Sync gamesPlayed from the user profile into local storage + allTimeScores.
const syncGamesPlayed = (uid: string): void => {
  firestore()
    .collection(Collections.users)
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists()) {
        const totalGames = doc.data()?.totalGames || 0
        AsyncStorage.setItem(StorageKeys.gamesPlayed, totalGames.toString())
        firestore()
          .collection(Collections.allTimeScores)
          .doc(uid)
          .update({ gamesPlayed: totalGames })
          .catch((err) => logError("Score.syncGamesPlayed.update", err))
      }
    })
    .catch((err) => logError("Score.syncGamesPlayed.read", err))
}

// Fire all end-of-game persistence and resolve the values the UI needs.
// Writes stay fire-and-forget (same call order/semantics as the old inline
// effect); the reads that feed the result run concurrently.
export const saveGameResults = async (
  params: SaveGameResultsParams,
): Promise<SaveGameResults> => {
  const {
    uid,
    heroName,
    score,
    bestCombo,
    totalCleared,
    clearPct,
    dailyMode,
    arenaMode,
    roomCode,
  } = params

  // Fire-and-forget writes.
  submitGameScore(uid, heroName, score, bestCombo, dailyMode)
  submitAllTimeScore(uid, heroName, score, bestCombo)
  getSavedLoungeCode()
    .then((code) => {
      if (code) {
        submitLoungeScore(code, uid, heroName, score, bestCombo).catch((err) =>
          logError("Score.saveGameResults.lounge", err),
        )
      }
    })
    .catch((err) => logError("Score.saveGameResults.loungeCode", err))
  updateUserProfile(uid, score, bestCombo, totalCleared)
  syncGamesPlayed(uid)
  if (arenaMode && roomCode) {
    updatePlayerScore(roomCode, uid, score, bestCombo, TOTAL_LEVELS, true)
  }

  // Reads that feed the returned result — run concurrently.
  const [isAllTimeRecord, personalBest, dailyRank, rank] = await Promise.all([
    checkAllTimeRecord(score),
    checkPersonalBest(uid, score),
    dailyMode
      ? submitAndRankDaily(uid, heroName, score, bestCombo, clearPct)
      : Promise.resolve<number | null>(null),
    fetchRank(score),
  ])

  return {
    rank,
    dailyRank,
    isAllTimeRecord,
    isPersonalBest: personalBest.isPersonalBest,
    previousBest: personalBest.previousBest,
  }
}
