import messaging from "@react-native-firebase/messaging"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { firestore } from "./Firebase"
import { StorageKeys } from "./storageKeys"
import { logError } from "./logError"

// Push registration (Tier 2 / REFACTOR_PLAN_V2). Server push only — no native
// dependency beyond @react-native-firebase/messaging, which the app already
// carries (Authscreen subscribes to the alltime-record topic). This slice adds
// PER-USER tokens (users/{uid}.fcmToken) so the scheduled streak-at-risk
// function can target a device, and requests the runtime permission that
// Android 13+ requires — which the existing topic push was silently missing.

const isAuthorized = (status: number): boolean =>
  status === messaging.AuthorizationStatus.AUTHORIZED ||
  status === messaging.AuthorizationStatus.PROVISIONAL

const writeToken = async (uid: string, token: string): Promise<void> => {
  await firestore()
    .collection("users")
    .doc(uid)
    .set(
      {
        fcmToken: token,
        fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
}

// onTokenRefresh must be attached once per session; the token can rotate and a
// stale token silently drops every future push. Guarded so repeat calls (e.g.
// startup sync then game-over prompt) don't stack listeners.
let refreshAttached = false
const attachRefresh = (uid: string): void => {
  if (refreshAttached) return
  refreshAttached = true
  messaging().onTokenRefresh((token) => {
    writeToken(uid, token).catch((err) =>
      logError("Notif.onTokenRefresh", err),
    )
  })
}

const storeCurrentToken = async (uid: string): Promise<void> => {
  const token = await messaging().getToken()
  if (token) await writeToken(uid, token)
  attachRefresh(uid)
}

// Startup: if the user already granted notifications, keep their token fresh
// and listen for rotation. Never prompts — that belongs to the contextual
// moment below. Safe to call every launch once the uid is known.
export const syncPushToken = async (uid: string): Promise<void> => {
  try {
    const status = await messaging().hasPermission()
    if (isAuthorized(status)) await storeCurrentToken(uid)
  } catch (err) {
    logError("Notif.syncPushToken", err)
  }
}

// The one prompt. Fires at most once per device (gated on pushPromptDone),
// intended for the first game-over that built a streak ("we'll guard your
// streak"). If granted, stores the token; either way the gate is set so we
// never nag. On Android 13+ requestPermission() drives the runtime dialog.
export const promptForPushIfNeeded = async (uid: string): Promise<void> => {
  try {
    const done = await AsyncStorage.getItem(StorageKeys.pushPromptDone)
    if (done) return
    await AsyncStorage.setItem(StorageKeys.pushPromptDone, "1")

    const status = await messaging().requestPermission()
    if (isAuthorized(status)) await storeCurrentToken(uid)
  } catch (err) {
    logError("Notif.promptForPushIfNeeded", err)
  }
}
