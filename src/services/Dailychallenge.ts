import firestore from "@react-native-firebase/firestore"
import { getTodayString } from "./CardService"

export interface DailyScore {
  uid: string
  heroName: string
  score: number
  bestCombo: number
  clearedPct: number
  playedAt: any
  gamesPlayed: number
}

// Check if user already played today's challenge
export const hasPlayedToday = async (
  uid: string,
): Promise<{ played: boolean; score?: number }> => {
  try {
    const today = getTodayString()
    const doc = await firestore()
      .collection("dailyScores")
      .doc(`${today}_${uid}`)
      .get()
    if (doc.exists()) {
      return { played: true, score: doc.data()?.score || 0 }
    }
    return { played: false }
  } catch {
    return { played: false }
  }
}

// Submit daily challenge score
export const submitDailyScore = async (
  uid: string,
  heroName: string,
  score: number,
  bestCombo: number,
  clearedPct: number,
): Promise<void> => {
  try {
    const today = getTodayString()
    await firestore().collection("dailyScores").doc(`${today}_${uid}`).set({
      uid,
      heroName,
      score,
      bestCombo,
      clearedPct,
      date: today,
      playedAt: firestore.FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error("Failed to submit daily score:", err)
  }
}

// Get today's leaderboard (top 50)
export const getDailyLeaderboard = async (): Promise<DailyScore[]> => {
  try {
    const today = getTodayString()
    const snapshot = await firestore()
      .collection("dailyScores")
      .where("date", "==", today)
      .orderBy("score", "desc")
      .limit(50)
      .get()
    return snapshot.docs.map((doc) => doc.data() as DailyScore)
  } catch (err) {
    console.error("Failed to fetch daily leaderboard:", err)
    return []
  }
}

// Get all-time best scores (top 50)
export const getAllTimeLeaderboard = async (): Promise<DailyScore[]> => {
  try {
    const snapshot = await firestore()
      .collection("gameScores")
      .orderBy("score", "desc")
      .limit(50)
      .get()
    return snapshot.docs.map((doc) => doc.data() as DailyScore)
  } catch {
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
    const userDoc = await firestore().collection("users").doc(uid).get()
    const gamesPlayed = userDoc.data()?.gamesPlayed || 0

    const doc = await firestore().collection("allTimeScores").doc(uid).get()
    if (!doc.exists || (doc.data()?.score || 0) < score) {
      await firestore().collection("allTimeScores").doc(uid).set({
        uid,
        heroName,
        score,
        bestCombo,
        gamesPlayed,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      })
    } else if (doc.exists()) {
      // Always update gamesPlayed even if score didn't change
      await firestore().collection("allTimeScores").doc(uid).update({
        gamesPlayed,
      })
    }
  } catch (err) {
    console.error("Failed to submit all-time score:", err)
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
    const userDoc = await firestore().collection("users").doc(uid).get()
    const gamesPlayed = userDoc.data()?.gamesPlayed || 0

    await firestore().collection("gameScores").add({
      uid,
      heroName,
      score,
      bestCombo,
      isDaily,
      gamesPlayed,
      playedAt: firestore.FieldValue.serverTimestamp(),
    })

    await firestore()
      .collection("users")
      .doc(uid)
      .update({
        totalScore: firestore.FieldValue.increment(score),
      })
  } catch (err) {
    console.error("Failed to submit game score:", err)
  }
}

export const updateUserProfile = async (
  uid: string,
  score: number,
  bestCombo: number,
  cardsCleared: number,
): Promise<void> => {
  try {
    const ref = firestore().collection("users").doc(uid)
    const doc = await ref.get()
    const data = doc.data() || {}

    await ref.set(
      {
        ...data,
        bestScore: Math.max(data.bestScore || 0, score),
        bestCombo: Math.max(data.bestCombo || 0, bestCombo),
        totalGames: (data.totalGames || 0) + 1,
        totalCardsCleared: (data.totalCardsCleared || 0) + cardsCleared,
        lastPlayedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (err) {
    console.error("Failed to update user profile:", err)
  }
}

export const getUserProfile = async (uid: string): Promise<any> => {
  try {
    const doc = await firestore().collection("users").doc(uid).get()
    return doc.exists() ? doc.data() : null
  } catch {
    return null
  }
}
