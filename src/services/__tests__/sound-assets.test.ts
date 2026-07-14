// The sound-swap drop-in guarantee, machine-checked. Three things must agree:
//   • SOUND_FILES (soundFiles.ts) — the cue→filename map,
//   • scripts/sounds-manifest.json "target"s — what the fetch script writes,
//   • assets/sounds/*.mp3 — what SoundService.init require()s.
// If any drifts, the owner's freesound download lands a file no one loads (or
// SoundService loads a file the fetch never writes). This test catches that now,
// before the swap.
//
// It reads only the pure SOUND_FILES map + files on disk — it does NOT import
// SoundService (which pulls expo-av at module load).

import fs from "fs"
import path from "path"
import { SOUND_FILES } from "../soundFiles"

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..")
const SOUNDS_DIR = path.join(REPO_ROOT, "assets", "sounds")
const MANIFEST = path.join(REPO_ROOT, "scripts", "sounds-manifest.json")

const mapFiles = Array.from(new Set(Object.values(SOUND_FILES))).sort()
const manifestTargets = (() => {
  const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  return (m.sounds as Array<{ target: string }>).map((s) => s.target).sort()
})()

describe("sound asset wiring", () => {
  it("SOUND_FILES and the manifest cover the same 11 files", () => {
    expect(manifestTargets).toEqual(mapFiles)
    expect(manifestTargets).toHaveLength(11)
  })

  it("every mapped sound file exists in assets/sounds/", () => {
    for (const file of mapFiles) {
      expect(fs.existsSync(path.join(SOUNDS_DIR, file))).toBe(true)
    }
  })

  it("assets/sounds/ carries no orphan mp3 the app never loads", () => {
    const onDisk = fs
      .readdirSync(SOUNDS_DIR)
      .filter((f) => f.endsWith(".mp3"))
      .sort()
    expect(onDisk).toEqual(mapFiles)
  })

  it("every manifest target names an mp3 (fetch writes mp3, init loads mp3)", () => {
    for (const t of manifestTargets) expect(t).toMatch(/\.mp3$/)
  })
})
