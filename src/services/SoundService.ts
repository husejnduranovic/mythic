import { Audio } from "expo-av"
import { Asset } from "expo-asset"
import * as Haptics from "expo-haptics"
import { logError } from "./logError"

let matchSound1: Audio.Sound | null = null
let matchSound2: Audio.Sound | null = null
let matchToggle = false
let drawSound: Audio.Sound | null = null
let combo5Sound: Audio.Sound | null = null
let combo10Sound: Audio.Sound | null = null
let combo15Sound: Audio.Sound | null = null
let combo20Sound: Audio.Sound | null = null
let combo25Sound: Audio.Sound | null = null
let combo30Sound: Audio.Sound | null = null
let freezeSound: Audio.Sound | null = null
let levelCompleteSound: Audio.Sound | null = null
let shuffleSound: Audio.Sound | null = null
let initialized = false

const loadSound = async (req: any): Promise<Audio.Sound | null> => {
  try {
    const [asset] = await Asset.loadAsync(req)
    const { sound } = await Audio.Sound.createAsync({
      uri: asset.localUri || asset.uri,
    })
    return sound
  } catch (e) {
    logError("Sound.loadSound", e)
    return null
  }
}

export const SoundService = {
  async init() {
    if (initialized) return
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
    } catch (err) {
      logError("Sound", err)
    }

    matchSound1 = await loadSound(require("../../assets/sounds/match.mp3"))
    matchSound2 = await loadSound(require("../../assets/sounds/match.mp3"))
    drawSound = await loadSound(require("../../assets/sounds/draw.mp3"))
    combo5Sound = await loadSound(require("../../assets/sounds/combo5.mp3"))
    combo10Sound = await loadSound(require("../../assets/sounds/combo10.mp3"))
    combo15Sound = await loadSound(require("../../assets/sounds/combo15.mp3"))
    combo20Sound = await loadSound(require("../../assets/sounds/combo20.mp3"))
    combo25Sound = await loadSound(require("../../assets/sounds/combo25.mp3"))
    combo30Sound = await loadSound(require("../../assets/sounds/combo30.mp3"))
    freezeSound = await loadSound(require("../../assets/sounds/freeze.mp3"))
    levelCompleteSound = await loadSound(
      require("../../assets/sounds/levelcomplete.mp3"),
    )
    shuffleSound = await loadSound(require("../../assets/sounds/shuffle.mp3"))

    initialized = true
  },

  play(sound: Audio.Sound | null) {
    if (!sound) return
    try {
      sound.replayAsync()
    } catch (err) {
      logError("Sound", err)
    }
  },

  // Pitched/quieted variant of an existing asset — the whole 2026-07-14 sound
  // pass composes from the 11 shipped files; no new assets. INVARIANT:
  // replayAsync(status) RETAINS the status on the Sound object, so a sound
  // that is ever played through playAt must ALWAYS be played through playAt
  // (a bare replayAsync would re-fire the previous variant). Variant-touched
  // set: match1/match2 (capture ramp), draw, freeze. The combo stings,
  // levelcomplete and shuffle stay on plain play().
  playAt(sound: Audio.Sound | null, rate: number, volume = 1) {
    if (!sound) return
    try {
      sound.replayAsync({
        shouldPlay: true,
        rate,
        shouldCorrectPitch: false,
        volume,
      })
    } catch (err) {
      logError("Sound", err)
    }
  },

  // Escalation sounds fire on the banner ladder (5/8/12/16/20/24/28/32 —
  // scoring v2's milestone keys). Asset filenames keep their historical names;
  // the mapping is tier order, not the number in the name.
  //
  // The capture itself CLIMBS: its pitch steps up on the same ladder, so a
  // long chain is audible as a rising line — you can hear what tier you are
  // on with your eyes on the board.
  async playMatch(combo: number) {
    try {
      const rate =
        combo >= 24 ? 1.3
        : combo >= 20 ? 1.25
        : combo >= 16 ? 1.2
        : combo >= 12 ? 1.15
        : combo >= 8 ? 1.1
        : combo >= 5 ? 1.05
        : 1
      matchToggle = !matchToggle
      this.playAt(matchToggle ? matchSound1 : matchSound2, rate)

      if (combo >= 24 && (combo - 24) % 4 === 0) {
        this.play(combo30Sound) // 24, 28, 32, 36…
      } else if (combo === 20) {
        this.play(combo25Sound)
      } else if (combo === 16) {
        this.play(combo20Sound)
      } else if (combo === 12) {
        this.play(combo15Sound)
      } else if (combo === 8) {
        this.play(combo10Sound)
      } else if (combo === 5) {
        this.play(combo5Sound)
      }

      if (combo >= 24) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setTimeout(
          () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
          100,
        )
      } else if (combo >= 12) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else if (combo >= 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      } else if (combo >= 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    } catch (err) {
      logError("Sound", err)
    }
  },

  async playDeckDraw() {
    try {
      this.playAt(drawSound, 1)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
    } catch (err) {
      logError("Sound", err)
    }
  },

  // The grave marker's sound — a deck draw that kills a banner-worthy chain
  // lands as a heavier, lower thud than an ordinary draw, with the warning
  // haptic. The CHAIN BROKEN stamp is no longer silent.
  async playChainBroken() {
    try {
      this.playAt(drawSound, 0.7)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch (err) {
      logError("Sound", err)
    }
  },

  async playLevelComplete() {
    try {
      this.play(levelCompleteSound)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      logError("Sound", err)
    }
  },

  // Unbroken Conquest — the apex moment gets the apex fanfare: the top combo
  // sting layered over the level-complete flourish, with a double-heavy
  // haptic. No new asset; the layering is the new sound.
  async playUnbroken() {
    try {
      this.play(combo30Sound)
      setTimeout(() => this.play(levelCompleteSound), 140)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setTimeout(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        120,
      )
      setTimeout(
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        280,
      )
    } catch (err) {
      logError("Sound", err)
    }
  },

  async playShuffle() {
    try {
      this.play(shuffleSound)
    } catch (err) {
      logError("Sound", err)
    }
  },

  // ── the 2026-07-14 sound pass: the screens off the board find their voice ──

  // The Breath's flip-reveal — the next battlefield turns face-up. The final
  // field adds a cold shimmer under its name: wind on the summit.
  async playReveal(isFinal = false) {
    try {
      this.play(shuffleSound)
      if (isFinal) {
        setTimeout(() => this.playAt(freezeSound, 0.75, 0.55), 180)
      }
    } catch (err) {
      logError("Sound", err)
    }
  },

  // Campaign won (VICTORY / quest cleared / arena crown) — brighter than a
  // field clear: the flourish with the LEGENDARY sting on top.
  async playVictory() {
    try {
      this.play(levelCompleteSound)
      setTimeout(() => this.play(combo20Sound), 180)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      logError("Sound", err)
    }
  },

  // The knell — a run dies on the clock. A deep steel thud as BATTLE OVER
  // stamps, then the cold settles. Quiet on purpose: the loss is marked,
  // never punished.
  async playDefeat() {
    try {
      this.playAt(drawSound, 0.55, 0.9)
      setTimeout(() => this.playAt(freezeSound, 0.7, 0.5), 300)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } catch (err) {
      logError("Sound", err)
    }
  },

  // ALL-TIME RECORD / FLAWLESS CONQUEST — the goldBright accolades share the
  // apex fanfare with UNBROKEN: one sound for the game's rarest tier.
  async playTriumph() {
    return this.playUnbroken()
  },

  // The Armory's forge strike — equipping a piece: the first banner sting as
  // the hammer ring plus a heavy impact. No new asset; the pairing is new.
  async playForge() {
    try {
      this.play(combo5Sound)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } catch (err) {
      logError("Sound", err)
    }
  },

  async playFreeze() {
    try {
      this.playAt(freezeSound, 1)
    } catch (err) {
      logError("Sound", err)
    }
  },

  async playTimeWarning() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch (err) {
      logError("Sound", err)
    }
  },
}
