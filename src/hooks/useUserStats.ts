import { useEffect, useState } from "react"
import { getUserProfile } from "../services/ScoreService"

/**
 * Loads the user's streak stats from their profile.
 */
export function useUserStats(uid: string | undefined) {
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  useEffect(() => {
    if (!uid) return
    getUserProfile(uid).then((data) => {
      setCurrentStreak(data?.currentStreak || 0)
      setBestStreak(data?.bestStreak || 0)
    })
  }, [uid])

  return { currentStreak, bestStreak }
}
