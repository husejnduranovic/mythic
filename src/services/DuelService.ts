import { firestore } from "./Firebase"
import { Collections } from "./collections"
import { logError } from "./logError"

// Async duels (Tier 3 / REFACTOR_PLAN_V2). A finished free run is reproducible
// (see makeRunSeed), so its seed base can be handed to another player who then
// faces the identical 7-field deck + bounties. The duel doc carries the seed
// and both scores; the challenger is pushed the result when the opponent answers.

export interface Duel {
  code: string
  seedBase: string
  challengerUid: string
  challengerName: string
  challengerScore: number
  challengerCombo: number
  opponentUid: string | null
  opponentName: string | null
  opponentScore: number | null
  opponentCombo: number | null
  state: "open" | "answered" | "expired"
}

// Unambiguous 6-char code (no 0/O/1/I). Same length as a shareable game code.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const generateCode = (): string => {
  let code = ""
  for (let i = 0; i < 6; i++)
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return code
}

const DUEL_TTL_MS = 24 * 60 * 60 * 1000

interface CreateDuelParams {
  challengerUid: string
  challengerName: string
  challengerScore: number
  challengerCombo: number
  seedBase: string
}

// Create an open duel and return its code (null on failure). Retries on the
// vanishingly-rare code collision.
export const createDuel = async (
  params: CreateDuelParams,
): Promise<string | null> => {
  try {
    const col = firestore().collection(Collections.duels)
    let code = generateCode()
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await col.doc(code).get()
      if (!existing.exists()) break
      code = generateCode()
    }

    await col.doc(code).set({
      code,
      seedBase: params.seedBase,
      challengerUid: params.challengerUid,
      challengerName: params.challengerName,
      challengerScore: params.challengerScore,
      challengerCombo: params.challengerCombo,
      opponentUid: null,
      opponentName: null,
      opponentScore: null,
      opponentCombo: null,
      state: "open",
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: firestore.Timestamp.fromDate(new Date(Date.now() + DUEL_TTL_MS)),
    })
    return code
  } catch (err) {
    logError("Duel.createDuel", err)
    return null
  }
}

const toDuel = (data: any): Duel => ({
  code: data.code,
  seedBase: data.seedBase,
  challengerUid: data.challengerUid,
  challengerName: data.challengerName,
  challengerScore: data.challengerScore ?? 0,
  challengerCombo: data.challengerCombo ?? 0,
  opponentUid: data.opponentUid ?? null,
  opponentName: data.opponentName ?? null,
  opponentScore: data.opponentScore ?? null,
  opponentCombo: data.opponentCombo ?? null,
  state: data.state ?? "open",
})

// Fetch a duel by code. Returns null if it doesn't exist or has expired (past
// its 24h window), so the receiver flow can show a clean "challenge expired".
export const getDuel = async (code: string): Promise<Duel | null> => {
  try {
    const doc = await firestore()
      .collection(Collections.duels)
      .doc(code.toUpperCase())
      .get()
    if (!doc.exists()) return null
    const data = doc.data()!
    const expiresAt = data.expiresAt
    if (expiresAt?.toDate && expiresAt.toDate().getTime() < Date.now())
      return null
    return toDuel(data)
  } catch (err) {
    logError("Duel.getDuel", err)
    return null
  }
}

interface AnswerDuelParams {
  opponentUid: string
  opponentName: string
  opponentScore: number
  opponentCombo: number
}

// Record the opponent's result. Runs in a transaction so a duel can only be
// answered once (first answer wins); returns the resolved duel with both scores
// for the verdict screen, or null if it was missing/expired/already answered.
export const submitDuelResult = async (
  code: string,
  params: AnswerDuelParams,
): Promise<Duel | null> => {
  try {
    const ref = firestore()
      .collection(Collections.duels)
      .doc(code.toUpperCase())
    return await firestore().runTransaction(async (tx) => {
      const doc = await tx.get(ref)
      if (!doc.exists()) return null
      const data = doc.data()!
      if (data.state !== "open") return null
      const expiresAt = data.expiresAt
      if (expiresAt?.toDate && expiresAt.toDate().getTime() < Date.now())
        return null

      tx.update(ref, {
        opponentUid: params.opponentUid,
        opponentName: params.opponentName,
        opponentScore: params.opponentScore,
        opponentCombo: params.opponentCombo,
        state: "answered",
        answeredAt: firestore.FieldValue.serverTimestamp(),
      })
      return toDuel({ ...data, ...params, state: "answered" })
    })
  } catch (err) {
    logError("Duel.submitDuelResult", err)
    return null
  }
}
