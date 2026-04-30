import { onDocumentWritten } from "firebase-functions/v2/firestore"
import { initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
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
