// save as check_activity.js and run with: node check_activity.js

const admin = require("firebase-admin")
const serviceAccount = require("./service-account.json") // your firebase service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function checkRecentActivity() {
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const snap = await db
    .collection("users")
    .where("lastPlayedAt", ">=", threeDaysAgo)
    .get()

  console.log(`\nPlayers active in last 3 days: ${snap.size}`)
  console.log("─".repeat(50))

  const players = []
  snap.forEach((doc) => {
    const data = doc.data()
    players.push({
      name: data.heroName || "Unknown",
      games: data.totalGames || 0,
      lastPlayed:
        data.lastPlayedAt?.toDate?.()?.toLocaleDateString() || "unknown",
      streak: data.currentStreak || 0,
    })
  })

  // Sort by games played
  players.sort((a, b) => b.games - a.games)

  players.forEach((p) => {
    console.log(
      `${p.name.padEnd(20)} | ${String(p.games).padEnd(6)} games | streak: ${p.streak} | last: ${p.lastPlayed}`,
    )
  })

  console.log("─".repeat(50))
  process.exit(0)
}

checkRecentActivity().catch(console.error)
