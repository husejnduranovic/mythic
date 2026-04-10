import database from "@react-native-firebase/database"
import { LogBox } from "react-native"
LogBox.ignoreLogs(["This method is deprecated"])

export interface RoomPlayer {
  uid: string
  heroName: string
  ready: boolean
  score: number
  bestCombo: number
  currentLevel: number
  finished: boolean
}

export interface Room {
  code: string
  hostUid: string
  state: "lobby" | "playing" | "results"
  createdAt: number
  level: number
  players: Record<string, RoomPlayer>
}

const roomRef = (code: string) => database().ref(`rooms/${code}`)
const playerRef = (code: string, uid: string) =>
  database().ref(`rooms/${code}/players/${uid}`)

// Generate random 4-digit code
const generateCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Replace setPlayerRematch and resetRoomForRematch with these:

export const setPlayerRematch = async (
  code: string,
  uid: string,
): Promise<void> => {
  const db = database()
  // Mark this player as wanting rematch
  await playerRef(code, uid).update({ wantsRematch: true })
  // Atomically increment the room's rematchCount
  await db
    .ref(`rooms/${code}/rematchCount`)
    .transaction((current: number | null) => {
      return (current || 0) + 1
    })
}

export const resetRoomForRematch = async (code: string): Promise<void> => {
  const snapshot = await roomRef(code).once("value")
  if (!snapshot.exists()) return
  const room = snapshot.val() as Room
  const players = room.players || {}

  const updates: Record<string, any> = {
    state: "waiting", // 1. go to "waiting" first — triggers all listeners
    rematchCount: 0,
    isResetting: false,
    level: 1,
  }
  for (const pid of Object.keys(players)) {
    updates[`players/${pid}/score`] = 0
    updates[`players/${pid}/bestCombo`] = 0
    updates[`players/${pid}/currentLevel`] = 0
    updates[`players/${pid}/finished`] = false
    updates[`players/${pid}/wantsRematch`] = false
  }
  await roomRef(code).update(updates)

  // Small delay then flip to "playing" — all clients see waiting→playing transition
  await new Promise((res) => setTimeout(res, 600))
  await roomRef(code).update({ state: "playing" })
}

// Create a new room
export const createRoom = async (
  uid: string,
  heroName: string,
): Promise<string> => {
  let code = generateCode()
  let attempts = 0

  while (attempts < 10) {
    try {
      // @ts-ignore
      const snapshot = await roomRef(code).once("value")
      if (!snapshot.exists()) break
    } catch (err) {
      break
    }
    code = generateCode()
    attempts++
  }

  try {
    await roomRef(code).set({
      code,
      hostUid: uid,
      state: "lobby",
      createdAt: database.ServerValue.TIMESTAMP,
      level: 0,
      players: {
        [uid]: {
          uid,
          heroName,
          ready: true,
          score: 0,
          bestCombo: 0,
          currentLevel: 0,
          finished: false,
        },
      },
    })
  } catch (err) {}

  return code
}

// Join an existing room
export const joinRoom = async (
  code: string,
  uid: string,
  heroName: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // @ts-ignore
    const snapshot = await roomRef(code).once("value")
    if (!snapshot.exists()) {
      return { success: false, error: "Room not found" }
    }

    const room = snapshot.val() as Room
    if (room.state !== "lobby") {
      return { success: false, error: "Game already started" }
    }

    const playerCount = room.players ? Object.keys(room.players).length : 0
    if (playerCount >= 6) {
      return { success: false, error: "Room is full (max 6)" }
    }

    await playerRef(code, uid).set({
      uid,
      heroName,
      ready: true,
      score: 0,
      bestCombo: 0,
      currentLevel: 0,
      finished: false,
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: "Failed to join room" }
  }
}

// Leave a room
export const leaveRoom = async (code: string, uid: string): Promise<void> => {
  try {
    // @ts-ignore
    const snapshot = await roomRef(code).once("value")
    if (!snapshot.exists()) return

    const room = snapshot.val() as Room

    // If host leaves, delete the room
    if (room.hostUid === uid) {
      await roomRef(code).remove()
    } else {
      await playerRef(code, uid).remove()
    }
  } catch {}
}

// Host starts the game
export const startGame = async (code: string): Promise<void> => {
  await roomRef(code).update({
    state: "playing",
    level: 1,
  })
}

// Update player score after each level
export const updatePlayerScore = async (
  code: string,
  uid: string,
  score: number,
  bestCombo: number,
  currentLevel: number,
  finished: boolean,
): Promise<void> => {
  await playerRef(code, uid).update({
    score,
    bestCombo,
    currentLevel,
    finished,
  })
}

// Set room to results state
export const setRoomResults = async (code: string): Promise<void> => {
  await roomRef(code).update({ state: "results" })
}

// Listen to room changes
export const onRoomUpdate = (
  code: string,
  callback: (room: Room | null) => void,
): (() => void) => {
  let active = true

  const poll = async () => {
    while (active) {
      try {
        // @ts-ignore
        const snapshot = await roomRef(code).once("value")
        if (!active) break
        callback(snapshot.exists() ? (snapshot.val() as Room) : null)
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  poll()

  return () => {
    active = false
  }
}

export const getRoomOnce = async (code: string): Promise<Room | null> => {
  try {
    // @ts-ignore
    const snapshot = await roomRef(code).once("value")
    return snapshot.exists() ? (snapshot.val() as Room) : null
  } catch {
    return null
  }
}

// Delete room (cleanup)
export const deleteRoom = async (code: string): Promise<void> => {
  try {
    await roomRef(code).remove()
  } catch {}
}
