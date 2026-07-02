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
let wildSound: Audio.Sound | null = null
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
    wildSound = await loadSound(require("../../assets/sounds/wild.mp3"))
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

  // Escalation sounds fire on the banner ladder (5/8/12/16/20/24/28/32 —
  // scoring v2's milestone keys). Asset filenames keep their historical names;
  // the mapping is tier order, not the number in the name.
  async playMatch(combo: number) {
    try {
      matchToggle = !matchToggle
      this.play(matchToggle ? matchSound1 : matchSound2)

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
      this.play(drawSound)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
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

  async playWild() {
    try {
      this.play(wildSound)
    } catch (err) {
      logError("Sound", err)
    }
  },

  async playFreeze() {
    try {
      this.play(freezeSound)
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
