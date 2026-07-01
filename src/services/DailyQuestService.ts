import firestore from "@react-native-firebase/firestore"
import { getTodayString } from "./CardService"
import { Collections, dailyScoreId } from "./collections"
import { SCORING_VERSION } from "../game/scoring"
import { logError } from "./logError"

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
      .collection(Collections.dailyScores)
      .doc(dailyScoreId(today, uid))
      .get()
    if (doc.exists()) {
      return { played: true, score: doc.data()?.score || 0 }
    }
    return { played: false }
  } catch (err) {
    logError("DailyQuest.hasPlayedToday", err)
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
    await firestore()
      .collection(Collections.dailyScores)
      .doc(dailyScoreId(today, uid))
      .set({
        uid,
        heroName,
        score,
        bestCombo,
        clearedPct,
        date: today,
        scoringV: SCORING_VERSION,
        playedAt: firestore.FieldValue.serverTimestamp(),
      })
    // Increment daily quests count on user profile
    await firestore()
      .collection(Collections.users)
      .doc(uid)
      .update({
        dailyQuestsPlayed: firestore.FieldValue.increment(1),
      })
  } catch (err) {
    logError("DailyQuest.submitDailyScore", err)
  }
}

// Get today's leaderboard (top 50)
export const getDailyLeaderboard = async (): Promise<DailyScore[]> => {
  try {
    const today = getTodayString()
    const snapshot = await firestore()
      .collection(Collections.dailyScores)
      .where("date", "==", today)
      .orderBy("score", "desc")
      .limit(50)
      .get()
    return snapshot.docs.map((doc) => doc.data() as DailyScore)
  } catch (err) {
    logError("DailyQuest.getDailyLeaderboard", err)
    return []
  }
}
