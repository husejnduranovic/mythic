// Single source of truth for AsyncStorage keys. Values are the literal strings
// already shipped in production — do NOT change them or existing installs lose
// their saved data.
export const StorageKeys = {
  bestStreak: "@mythic_best_streak",
  loungeCode: "@mythic_lounge_code",
  introSeen: "@mythic_intro_seen",
  localScores: "@mythic_peaks_scores",
  gamesPlayed: "@mythic_games_played",
  bestComboEver: "@mythic_best_combo_ever",
  bestRunPace: "@mythic_best_run_pace",
  // Field Crowns — per-field personal-best spoils (Record<level, spoils>).
  fieldCrowns: "@mythic_field_crowns",
  cardBack: "@mythic_card_back",
  battlefield: "@mythic_battlefield",
  // "@mythic_wild_style" retired 2026-07-01 with the wild-style inventory —
  // stale values on old installs are orphaned, never read.
  warTable: "@mythic_war_table",
  bountyStyle: "@mythic_bounty_style",
  armoryMigratedV2: "@mythic_armory_migrated_v2",
  // One-time gate: clears v1-scale local PB/ghost data on first v1.4 launch so
  // THE SHADOW stays reachable and the PB-gap goal isn't muted after the wipe.
  v14ResetDone: "@mythic_v14_reset_done",
  // One-time gate: the push-permission prompt fires once, at the first
  // game-over that built a streak (never at auth), so it lands in context.
  pushPromptDone: "@mythic_push_prompt_done",
  seenCoachMarks: "@mythic_seen_coachmarks",
  firstVictorySeen: "@mythic_first_victory_seen",
} as const
