// Single source of truth for Firestore collection names and composite doc-id
// builders. Keeping these in one place prevents drift between the writers and
// readers of each collection.
export const Collections = {
  users: "users",
  gameScores: "gameScores",
  dailyScores: "dailyScores",
  allTimeScores: "allTimeScores",
  loungeScores: "loungeScores",
  lounges: "lounges",
} as const

// dailyScores/{date}_{uid}
export const dailyScoreId = (date: string, uid: string): string =>
  `${date}_${uid}`

// loungeScores/{code}_{week}_{uid}
export const loungeScoreId = (
  code: string,
  week: string,
  uid: string,
): string => `${code}_${week}_${uid}`
