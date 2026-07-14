// wipe-alltime-scores.js
//
// WARNING: This wipes all all-time scores. Run only once before v1.4 release.
//
// Scoring v2 (2026-07-01) produces totals ~5-20x lower than v1, so the v1-scale
// all-time board and the v1 profile PBs are out of scale and poison the v1.4
// goal module (the PB-gap goal, THE SHADOW). This one-shot:
//   1. DELETES every document in the allTimeScores collection
//   2. Resets users/{uid}.bestScore to 0 (v1 PBs are 5-20x out of scale)
//
// It does NOT touch other user fields, gameScores, dailyScores, or lounge
// boards. The device-local counterpart (ghost + local PB) is handled in-app by
// resetV14LocalScaleIfNeeded (Fix 3).
//
// Usage (from repo root, service-account.json present at root):
//   node scripts/wipe-alltime-scores.js
//
// The owner runs this manually before release. Do not wire it into any build.

const admin = require("firebase-admin")
const serviceAccount = require("../service-account.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

const BATCH_LIMIT = 500 // Firestore hard cap on writes per batch

// Commit an array of write closures in chunks of BATCH_LIMIT.
async function commitInChunks(refs, apply) {
  let done = 0
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = db.batch()
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) apply(batch, ref)
    await batch.commit()
    done += Math.min(BATCH_LIMIT, refs.length - i)
    console.log(`  ...committed ${done}/${refs.length}`)
  }
  return done
}

async function wipeAllTime() {
  console.log(
    "\n*** WARNING: wiping ALL all-time scores + resetting profile bestScore ***\n",
  )

  // 1. Delete every allTimeScores document.
  const scores = await db.collection("allTimeScores").get()
  console.log(`allTimeScores: ${scores.size} documents to delete`)
  if (scores.size > 0) {
    await commitInChunks(
      scores.docs.map((d) => d.ref),
      (batch, ref) => batch.delete(ref),
    )
  }

  // 2. Reset users.bestScore = 0 (only this field).
  const users = await db.collection("users").get()
  console.log(`users: ${users.size} documents to reset (bestScore -> 0)`)
  if (users.size > 0) {
    await commitInChunks(
      users.docs.map((d) => d.ref),
      (batch, ref) => batch.update(ref, { bestScore: 0 }),
    )
  }

  console.log("\nDone. All-time board wiped; profile bestScore reset.")
}

wipeAllTime()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
