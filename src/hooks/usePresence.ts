import { useEffect, useState } from "react"
import { AppState } from "react-native"
import { firestore } from "../services/Firebase"

/**
 * Marks the user online while the app is active, offline on
 * background/unmount, and exposes the live count of online users.
 */
export function usePresence(uid: string | undefined) {
  const [onlineCount, setOnlineCount] = useState(0)

  // Online/offline writes tied to AppState
  useEffect(() => {
    if (!uid) return

    const setOnline = (online: boolean) => {
      firestore()
        .collection("users")
        .doc(uid)
        .update({
          isOnline: online,
          lastSeen: firestore.FieldValue.serverTimestamp(),
        })
        .catch(() => {})
    }

    setOnline(true)

    const sub = AppState.addEventListener("change", (state) => {
      setOnline(state === "active")
    })

    return () => {
      sub.remove()
      setOnline(false)
    }
  }, [uid])

  // Live online-count subscription
  useEffect(() => {
    if (!uid) return
    const unsub = firestore()
      .collection("users")
      .where("isOnline", "==", true)
      .onSnapshot(
        (snap) => {
          setOnlineCount(snap.size)
        },
        () => {},
      )
    return () => unsub()
  }, [uid])

  return onlineCount
}
