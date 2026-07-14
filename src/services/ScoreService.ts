import firestore from "@react-native-firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getTodayString } from "./CardService"
import { Collections, dailyScoreId, loungeScoreId } from "./collections"
import { StorageKeys } from "./storageKeys"
import { logError } from "./logError"
import { submitDailyScore } from "./DailyQuestService"
import {
  getSavedLoungeCode,
  submitLoungeScore,
  getWeekId,
} from "./LoungeService"
import { updatePlayerScore } from "./ArenaService"
import { TOTAL_LEVELS } from "../game/config"
import { SCORING_VERSION } from "../game/scoring"
import type { DailyScore } from "./DailyQuestService"

// Get all-time best scores (top 50).
// Reads allTimeScores (one doc per user = one row per player), not the raw
// per-game gameScores collection — so a player appears once and renames only
// have to touch a single doc.
export const getAllTimeLeaderboard = async (): Promise<DailyScore[]> => {
  try {
    const snapshot = await firestore()
      .collection(Collections.allTimeScores)
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
        scoringV: SCORING_VERSION,
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
      scoringV: SCORING_VERSION,
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

    // Streak logic — exact day-diff on the local-day strings ("YYYY-MM-DD"
    // parses as a UTC midnight, so the difference is an integer count of
    // days; the old string-equality check against a UTC "yesterday" reset
    // streaks for players east of UTC playing just after local midnight).
    const today = getTodayString()
    const lastPlayed = data.lastPlayedDate || null

    let currentStreak = data.currentStreak || 0
    let bestStreak = data.bestStreak || 0
    let wardUsedAt = data.emberWardUsedAt || null

    const daysBetween = (from: string, to: string): number =>
      Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
    const dayDiff = lastPlayed ? daysBetween(lastPlayed, today) : null
    const wardReady = !wardUsedAt || daysBetween(wardUsedAt, today) >= 7

    if (dayDiff === 0) {
      // Already played today — don't change streak
    } else if (dayDiff === 1) {
      // Consecutive day — increment
      currentStreak = currentStreak + 1
    } else if (dayDiff === 2 && currentStreak > 0 && wardReady) {
      // Ember Ward (DESIGN_PLAN §6 R4): one missed day per week is forgiven —
      // the ember survived the night. Multi-day gaps still reset.
      currentStreak = currentStreak + 1
      wardUsedAt = today
    } else {
      // Missed too long, first game ever, or malformed date — reset
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
        ...(wardUsedAt ? { emberWardUsedAt: wardUsedAt } : {}),
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

// Rename a player's heroName everywhere it's actually displayed.
// users/{uid} is the source of truth; the only other docs read with a frozen
// heroName all have deterministic IDs: the all-time row (one per user), the
// current daily entry, and the current-week lounge entry. We rename exactly
// those, atomically, in a single WriteBatch — no looping over historical
// gameScores/dailyScores (the all-time tab no longer reads gameScores, and the
// daily/lounge tabs only ever show the current period). If any write fails the
// batch rolls back, so the displayed name never ends up half-renamed.
export const renameHero = async (
  uid: string,
  newName: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const db = firestore()

    // Reject if another user already holds the name.
    const existing = await db
      .collection(Collections.users)
      .where("heroName", "==", newName)
      .limit(1)
      .get()
    if (!existing.empty && existing.docs[0].id !== uid) {
      return { success: false, error: "Name already taken" }
    }

    const batch = db.batch()

    // users — always exists, the source of truth.
    batch.update(db.collection(Collections.users).doc(uid), {
      heroName: newName,
    })

    // allTimeScores — one doc per user; only present once they've scored.
    const allTimeRef = db.collection(Collections.allTimeScores).doc(uid)
    if ((await allTimeRef.get()).exists()) {
      batch.update(allTimeRef, { heroName: newName })
    }

    // Today's daily entry — the only daily doc the leaderboard ever shows.
    const dailyRef = db
      .collection(Collections.dailyScores)
      .doc(dailyScoreId(getTodayString(), uid))
    if ((await dailyRef.get()).exists()) {
      batch.update(dailyRef, { heroName: newName })
    }

    // Current-week lounge entry, if the player is in a lounge.
    const loungeCode = await getSavedLoungeCode()
    if (loungeCode) {
      const loungeRef = db
        .collection(Collections.loungeScores)
        .doc(loungeScoreId(loungeCode, getWeekId(), uid))
      if ((await loungeRef.get()).exists()) {
        batch.update(loungeRef, { heroName: newName })
      }
    }

    await batch.commit()
    return { success: true }
  } catch (err) {
    logError("Score.renameHero", err)
    return { success: false, error: "Failed to update" }
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
  // The standing best BEFORE this run, whether or not this run beat it
  // (0 = no previous best). Feeds the PB-gap goal on the miss case too.
  previousBest: number
  // The player's seat on the all-time board (per-player bests — the board the
  // monthly prize is paid on), counted from max(this run, previous best).
  allTimeRank: number | null
  // The player one seat above on that board — the next real seat to take.
  rival: { name: string; score: number } | null
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
// previousBest is always the standing best before this run — the goal module
// needs the gap on the miss case, not only on a new record.
const checkPersonalBest = async (
  uid: string,
  score: number,
): Promise<{ isPersonalBest: boolean; previousBest: number }> => {
  try {
    const doc = await firestore().collection(Collections.users).doc(uid).get()
    const prevBest = doc.exists() ? doc.data()?.bestScore || 0 : 0
    return {
      isPersonalBest: score > prevBest && prevBest > 0,
      previousBest: prevBest,
    }
  } catch (err) {
    logError("Score.checkPersonalBest", err)
    return { isPersonalBest: false, previousBest: 0 }
  }
}

// The player's standing on the all-time board (one doc per player — the board
// the monthly prize pays on): their seat number, and the player one seat above.
// One ascending query over the scores strictly above the player's best; the
// player's own doc can never match it (own score is never > own best).
const fetchStanding = async (
  uid: string,
  myBest: number,
): Promise<{
  allTimeRank: number | null
  rival: { name: string; score: number } | null
}> => {
  try {
    const snap = await firestore()
      .collection(Collections.allTimeScores)
      .where("score", ">", myBest)
      .orderBy("score", "asc")
      .get()
    const above = snap.docs.filter((d) => d.id !== uid)
    const seatAbove = above[0]?.data()
    return {
      allTimeRank: above.length + 1,
      rival: seatAbove
        ? {
            name: seatAbove.heroName || "A nameless rival",
            score: seatAbove.score || 0,
          }
        : null,
    }
  } catch (err) {
    logError("Score.fetchStanding", err)
    return { allTimeRank: null, rival: null }
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
  // Daily runs feed the daily leaderboard only — a one-attempt seeded run and
  // an unlimited free run are different competitions, so daily scores must NOT
  // pollute the all-time board (schema intent + prize integrity).
  if (!dailyMode) submitAllTimeScore(uid, heroName, score, bestCombo)
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

  // Reads that feed the returned result — run concurrently. The standing read
  // needs the previous best first (the seat is counted from whichever of this
  // run / the old best is higher), so it chains off that one read only.
  const personalBestP = checkPersonalBest(uid, score)
  const standingP = personalBestP.then((pb) =>
    fetchStanding(uid, Math.max(score, pb.previousBest)),
  )
  const [isAllTimeRecord, personalBest, dailyRank, rank, standing] =
    await Promise.all([
      checkAllTimeRecord(score),
      personalBestP,
      dailyMode
        ? submitAndRankDaily(uid, heroName, score, bestCombo, clearPct)
        : Promise.resolve<number | null>(null),
      fetchRank(score),
      standingP,
    ])

  return {
    rank,
    dailyRank,
    isAllTimeRecord,
    isPersonalBest: personalBest.isPersonalBest,
    previousBest: personalBest.previousBest,
    allTimeRank: standing.allTimeRank,
    rival: standing.rival,
  }
}
