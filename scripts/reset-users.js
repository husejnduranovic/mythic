// reset-users.js — owner-run debug script (from repo root, with
// service-account.json present at root): node scripts/reset-users.js
const admin = require("firebase-admin")
const serviceAccount = require("../service-account.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function resetUsers() {
  const snapshot = await db.collection("users").get()
  console.log(`Found ${snapshot.size} users`)

  const batch = db.batch()
  let count = 0

  snapshot.forEach((doc) => {
    batch.update(doc.ref, {
      bestScore: 0,
      bestCombo: 0,
      totalScore: 0,
      totalCardsCleared: 0,
      totalGames: 0,
      dailyQuestsPlayed: 0,
      gamesPlayed: admin.firestore.FieldValue.delete(),
    })
    count++
  })

  await batch.commit()
  console.log(`Reset ${count} users`)
}

resetUsers().catch(console.error)
