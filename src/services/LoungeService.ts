import firestore from "@react-native-firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"

const LOUNGE_KEY = "@mythic_lounge_code"

export interface LoungeScore {
  uid: string
  heroName: string
  score: number
  bestCombo: number
  playedAt: any
}

export interface Lounge {
  name: string
  code: string
  ownerId: string
  active: boolean
}

// Get current week ID (Monday-Sunday)
const getWeekId = (): string => {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`
}

// Get days left in current week
export const getDaysLeftInWeek = (): number => {
  const now = new Date()
  const day = now.getDay()
  return day === 0 ? 0 : 7 - day
}

// Save lounge code locally
export const joinLounge = async (
  code: string,
): Promise<{ success: boolean; lounge?: Lounge; error?: string }> => {
  try {
    const snapshot = await firestore()
      .collection("lounges")
      .where("code", "==", code.toUpperCase())
      .limit(1)
      .get()

    if (snapshot.empty) {
      return { success: false, error: "Lounge not found" }
    }

    const lounge = snapshot.docs[0].data() as Lounge
    if (!lounge.active) {
      return { success: false, error: "Tournament not active" }
    }

    await AsyncStorage.setItem(LOUNGE_KEY, code.toUpperCase())
    return { success: true, lounge }
  } catch (err) {
    return { success: false, error: "Failed to join lounge" }
  }
}

// Leave lounge
export const leaveLounge = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOUNGE_KEY)
}

// Get saved lounge code
export const getSavedLoungeCode = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LOUNGE_KEY)
}

// Get lounge info
export const getLoungeInfo = async (code: string): Promise<Lounge | null> => {
  try {
    const snapshot = await firestore()
      .collection("lounges")
      .where("code", "==", code)
      .limit(1)
      .get()

    return snapshot.empty ? null : (snapshot.docs[0].data() as Lounge)
  } catch {
    return null
  }
}

// Submit score to lounge weekly tournament
export const submitLoungeScore = async (
  code: string,
  uid: string,
  heroName: string,
  score: number,
  bestCombo: number,
): Promise<void> => {
  try {
    const weekId = getWeekId()
    const docId = `${code}_${weekId}_${uid}`
    const ref = firestore().collection("loungeScores").doc(docId)
    const existing = await ref.get()

    // Only update if new score is higher
    if (!existing.exists || (existing.data()?.score || 0) < score) {
      await ref.set({
        loungeCode: code,
        weekId,
        uid,
        heroName,
        score,
        bestCombo,
        playedAt: firestore.FieldValue.serverTimestamp(),
      })
    }
  } catch (err) {
    console.error("Failed to submit lounge score:", err)
  }
}

// Get weekly leaderboard for a lounge
export const getLoungeLeaderboard = async (
  code: string,
): Promise<LoungeScore[]> => {
  try {
    const weekId = getWeekId()
    const snapshot = await firestore()
      .collection("loungeScores")
      .where("loungeCode", "==", code)
      .where("weekId", "==", weekId)
      .orderBy("score", "desc")
      .limit(50)
      .get()

    return snapshot.docs.map((doc) => doc.data() as LoungeScore)
  } catch (err) {
    console.error("Failed to get lounge leaderboard:", err)
    return []
  }
}
