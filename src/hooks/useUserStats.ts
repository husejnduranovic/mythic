import { useEffect, useState } from "react"
import { getUserProfile } from "../services/ScoreService"

/**
 * Loads the user's streak stats from their profile.
 */
export function useUserStats(uid: string | undefined) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  // Ember Ward (R4): true when the once-a-week streak shield was spent within
  // the last day — the Home chip shows the ember survived the night.
  const [emberWarded, setEmberWarded] = useState(false)

  useEffect(() => {
    if (!uid) return
    getUserProfile(uid).then((data) => {
      setCurrentStreak(data?.currentStreak || 0)
      setBestStreak(data?.bestStreak || 0)
      const ward = data?.emberWardUsedAt
      if (ward) {
        const days = Math.round((Date.now() - Date.parse(ward)) / 86400000)
        setEmberWarded(days <= 1)
      }
    })
  }, [uid])

  return { currentStreak, bestStreak, emberWarded }
}
