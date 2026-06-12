import AsyncStorage from "@react-native-async-storage/async-storage"
import { StorageKeys } from "./storageKeys"
import { logError } from "./logError"

// Local (on-device) score history — top 30, sorted by score. Independent of the
// cloud leaderboards; used so a player keeps a record even when offline.
export const saveScore = async (score: number, bestCombo: number = 0) => {
  try {
    const raw = await AsyncStorage.getItem(StorageKeys.localScores)
    const scores = raw ? JSON.parse(raw) : []
    scores.push({ score, bestCombo, date: new Date().toLocaleDateString() })
    scores.sort((a: any, b: any) => b.score - a.score)
    await AsyncStorage.setItem(
      StorageKeys.localScores,
      JSON.stringify(scores.slice(0, 30)),
    )
  } catch (err) {
    logError("LocalScore.saveScore", err)
  }
}
