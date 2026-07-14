// The one source of truth for the sound-cue → asset-filename mapping.
//
// It is the contract between three places that must always agree:
//   1. scripts/sounds-manifest.json — each entry's "target" (what the freesound
//      fetch script writes into assets/sounds/).
//   2. assets/sounds/*.mp3 — the files SoundService.init() require()s.
//   3. This map — what the rest of the app names a cue.
//
// The v1.4 sound replacement pass keeps these filenames deliberately: the fetch
// script overwrites each file in place, so once the owner drops the new sounds
// in, everything works with zero code changes. The consistency test
// (src/services/__tests__/sound-assets.test.ts) fails if manifest, disk, and
// this map ever drift — so the drop-in guarantee is machine-checked, not a
// promise.
//
// (Metro needs static string literals inside require(), so init() can't be
// data-driven off this map; the require list there mirrors it one-to-one — the
// test is what keeps them honest.)
export const SOUND_FILES = {
  match: "match.mp3",
  draw: "draw.mp3",
  shuffle: "shuffle.mp3",
  freeze: "freeze.mp3",
  levelComplete: "levelcomplete.mp3",
  // The combo/banner ladder (historical filenames — mapping is tier order, not
  // the number in the name; see SoundService.playMatch and GAMEPLAY.md §1.5).
  combo5: "combo5.mp3",
  combo10: "combo10.mp3",
  combo15: "combo15.mp3",
  combo20: "combo20.mp3",
  combo25: "combo25.mp3",
  combo30: "combo30.mp3",
} as const

export type SoundCue = keyof typeof SOUND_FILES
