import { onDocumentWritten } from "firebase-functions/v2/firestore"
import { onSchedule } from "firebase-functions/v2/scheduler"
import { initializeApp } from "firebase-admin/app"
import {
  getFirestore,
  FieldValue,
  DocumentReference,
} from "firebase-admin/firestore"
import { getMessaging } from "firebase-admin/messaging"

initializeApp()

export const onAllTimeRecordBroken = onDocumentWritten(
  {
    document: "allTimeScores/{userId}",
  },
  async (event) => {
    const after = event.data?.after?.data()
    if (!after) return

    const newScore = after.score || 0
    const heroName = after.heroName || "Unknown"
    const userId = event.params.userId

    // Get current highest score
    const topScores = await getFirestore()
      .collection("allTimeScores")
      .orderBy("score", "desc")
      .limit(1)
      .get()

    if (topScores.empty) return

    const topScore = topScores.docs[0].data().score || 0
    const topUid = topScores.docs[0].id

    // Only notify if this user IS the new #1
    if (topUid !== userId) return
    if (newScore !== topScore) return

    // Check if score actually changed
    const before = event.data?.before?.data()
    const prevScore = before?.score || 0
    if (prevScore === newScore) return

    // Send notification to all subscribed users
    await getMessaging().send({
      topic: "alltime-record",
      notification: {
        title: "🏆 ALL-TIME RECORD BROKEN!",
        body: `${heroName} just claimed #1 with ${newScore.toLocaleString()} points!`,
      },
      data: {
        type: "alltime-record",
        heroName: heroName,
        score: newScore.toString(),
      },
    })

    console.log(`Record notification sent: ${heroName} with ${newScore}`)
  },
)

// ── Streak-at-risk push (Tier 2 / REFACTOR_PLAN_V2) ────────────────────────
//
// Runs once a day at ~18:00 Europe/Vienna. A player whose lastPlayedDate is
// YESTERDAY (Vienna) has not played today; if they skip today their streak is
// in danger. We warn them while there's still time to play a battle.
//
// The cap (one push/day/user) falls out of "runs once/day"; streak >= 2 only,
// and only docs that carry an fcmToken (per-user tokens, written by the client
// NotificationService). No composite index needed: we query on lastPlayedDate
// (equality) alone and filter the streak in code.
//
// GATE: this is a scheduled function — it requires the Blaze plan (Cloud
// Scheduler). Deploy with `firebase deploy --only functions`.

// "YYYY-MM-DD" for a given timezone (en-CA renders ISO-like). Matches the
// client's local-day strings closely enough for the target (Vienna) audience.
const dayStringInTz = (date: Date, timeZone: string): string =>
  date.toLocaleDateString("en-CA", { timeZone })

// Whole-day difference between two "YYYY-MM-DD" strings (each parses as UTC
// midnight, so the difference is an exact integer day count).
const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86400000)

export const streakAtRisk = onSchedule(
  {
    schedule: "0 18 * * *",
    timeZone: "Europe/Vienna",
  },
  async () => {
    const today = dayStringInTz(new Date(), "Europe/Vienna")
    const yesterday = dayStringInTz(
      new Date(Date.now() - 86400000),
      "Europe/Vienna",
    )

    const snap = await getFirestore()
      .collection("users")
      .where("lastPlayedDate", "==", yesterday)
      .get()

    // Bodies vary per user (ward-ready vs not), so build one fully-specified
    // message each and send with sendEach (not multicast, which shares a single
    // notification block across all tokens).
    const messages: { token: string; notification: { title: string; body: string }; data: { type: string } }[] = []
    const refs: DocumentReference[] = []

    snap.forEach((doc) => {
      const data = doc.data()
      const streak = data.currentStreak || 0
      const token = data.fcmToken
      if (streak < 2 || !token) return

      // Ember Ward mirrors the client: a 2-day gap is forgiven once per rolling
      // week. If the ward is ready the streak survives tonight; if not, it ends
      // at midnight. Tailor the copy so the warning is honest either way.
      const wardUsedAt = data.emberWardUsedAt || null
      const wardReady = !wardUsedAt || daysBetween(wardUsedAt, today) >= 7
      const body = wardReady
        ? `Your ${streak}-day streak needs a battle today — don't make the Ember Ward spend itself.`
        : `Your ${streak}-day streak ends at midnight. The Ember Ward can't save you twice.`

      messages.push({
        token,
        notification: { title: "⚔️ Your streak is at risk", body },
        data: { type: "streak-at-risk" },
      })
      refs.push(doc.ref)
    })

    if (messages.length === 0) {
      console.log("streakAtRisk: no players at risk today")
      return
    }

    // sendEach caps at 500 messages per call — chunk to be safe.
    let sent = 0
    const staleRefs: DocumentReference[] = []
    for (let i = 0; i < messages.length; i += 500) {
      const chunk = messages.slice(i, i + 500)
      const res = await getMessaging().sendEach(chunk)
      res.responses.forEach((r, k) => {
        if (r.success) sent++
        else if (
          r.error?.code === "messaging/registration-token-not-registered"
        ) {
          staleRefs.push(refs[i + k])
        }
      })
    }

    // Drop tokens Firebase reports as dead so the collection stays clean.
    await Promise.all(
      staleRefs.map((ref) =>
        ref.update({ fcmToken: FieldValue.delete() }).catch(() => undefined),
      ),
    )

    console.log(
      `streakAtRisk: ${sent}/${messages.length} sent, ${staleRefs.length} stale tokens cleared`,
    )
  },
)
