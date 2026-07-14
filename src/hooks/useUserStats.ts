import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"
import { getUserProfile } from "../services/ScoreService"

/**
 * Loads the user's streak stats from their profile.
 *
 * The hook lives at the App root (never remounts), so a one-shot fetch went
 * stale the moment a game updated the streak — the Home chip stayed wrong
 * until an app restart (REFACTOR_PLAN_V2 §1.3 carryover debt). It now refetches
 * whenever the app returns to the foreground, and exposes `refresh` so the
 * caller can re-pull on return-to-Home (in-app navigation never backgrounds).
 */
export function useUserStats(uid: string | undefined) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  // Ember Ward (R4): true when the once-a-week streak shield was spent within
  // the last day — the Home chip shows the ember survived the night.
  const [emberWarded, setEmberWarded] = useState(false)

  const refresh = useCallback(() => {
    if (!uid) return
    getUserProfile(uid).then((data) => {
      setCurrentStreak(data?.currentStreak || 0)
      setBestStreak(data?.bestStreak || 0)
      const ward = data?.emberWardUsedAt
      if (ward) {
        const days = Math.round((Date.now() - Date.parse(ward)) / 86400000)
        setEmberWarded(days <= 1)
      } else {
        setEmberWarded(false)
      }
    })
  }, [uid])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh()
    })
    return () => sub.remove()
  }, [refresh])

  return { currentStreak, bestStreak, emberWarded, refresh }
}
