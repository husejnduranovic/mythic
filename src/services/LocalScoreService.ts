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

// One-time v1.4 launch reset. Scoring v2 is ~5–20× lower than v1, so any local
// PB/ghost data stored before this device's first v1.4 launch is v1-scale: it
// makes THE SHADOW unreachable and mutes the game-over PB-gap goal. Everything
// on the device predates v2 play at this point, so we clear it wholesale:
//   - @mythic_best_run_pace  → the ghost + THE SHADOW best total
//   - @mythic_peaks_scores   → the local score history (the local PB source)
// Gated on @mythic_v14_reset_done so it runs exactly once per device. Combo and
// cosmetic keys are left alone (combos aren't score-scale). The cloud-side wipe
// (allTimeScores + users.bestScore) is a separate owner-run script.
export const resetV14LocalScaleIfNeeded = async () => {
  try {
    const done = await AsyncStorage.getItem(StorageKeys.v14ResetDone)
    if (done) return

    await AsyncStorage.multiRemove([
      StorageKeys.bestRunPace,
      StorageKeys.localScores,
    ])

    await AsyncStorage.setItem(StorageKeys.v14ResetDone, "1")
  } catch (err) {
    logError("LocalScore.resetV14LocalScaleIfNeeded", err)
  }
}
