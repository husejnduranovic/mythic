import firestore from "@react-native-firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getTodayString, getYesterdayString } from "./CardService"
import { Collections } from "./collections"
import { StorageKeys } from "./storageKeys"
import { logError } from "./logError"
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
