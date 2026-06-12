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
  cardBack: "@mythic_card_back",
  battlefield: "@mythic_battlefield",
  wildStyle: "@mythic_wild_style",
  warTable: "@mythic_war_table",
  bountyStyle: "@mythic_bounty_style",
  armoryMigratedV2: "@mythic_armory_migrated_v2",
} as const
