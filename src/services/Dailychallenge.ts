import firestore from "@react-native-firebase/firestore"
import { getTodayString } from "./CardService"

export interface DailyScore {
  uid: string
  heroName: string
  score: number
  bestCombo: number
  clearedPct: number
  playedAt: any
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
    const doc = await firestore().collection("allTimeScores").doc(uid).get()
    if (!doc.exists || (doc.data()?.score || 0) < score) {
      await firestore().collection("allTimeScores").doc(uid).set({
        uid,
        heroName,
        score,
        bestCombo,
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
    await firestore().collection("gameScores").add({
      uid,
      heroName,
      score,
      bestCombo,
      isDaily,
      playedAt: firestore.FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error("Failed to submit game score:", err)
  }
}
