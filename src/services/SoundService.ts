import { Audio } from "expo-av"
import { Asset } from "expo-asset"
import * as Haptics from "expo-haptics"

let matchSound1: Audio.Sound | null = null
let matchSound2: Audio.Sound | null = null
let matchToggle = false
let drawSound: Audio.Sound | null = null
let combo10Sound: Audio.Sound | null = null
let combo15Sound: Audio.Sound | null = null
let combo20Sound: Audio.Sound | null = null
let combo30Sound: Audio.Sound | null = null
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
    console.warn("Sound load failed:", e)
    return null
  }
}

export const SoundService = {
  async init() {
    if (initialized) return
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true })
    } catch {}

    matchSound1 = await loadSound(require("../../assets/sounds/match.mp3"))
    matchSound2 = await loadSound(require("../../assets/sounds/match.mp3"))
    drawSound = await loadSound(require("../../assets/sounds/draw.mp3"))
    combo10Sound = await loadSound(require("../../assets/sounds/combo10.mp3"))
    combo15Sound = await loadSound(require("../../assets/sounds/combo15.mp3"))
    combo20Sound = await loadSound(require("../../assets/sounds/combo20.mp3"))
    combo30Sound = await loadSound(require("../../assets/sounds/combo30.mp3"))
    levelCompleteSound = await loadSound(
      require("../../assets/sounds/levelcomplete.mp3"),
    )
    shuffleSound = await loadSound(require("../../assets/sounds/shuffle.mp3"))

    initialized = true
    console.log("SOUND: all loaded")
  },

  play(sound: Audio.Sound | null) {
    if (!sound) return
    try {
      sound.replayAsync()
    } catch {}
  },

  async playMatch(combo: number) {
    try {
      // Click on every match — double buffered
      matchToggle = !matchToggle
      this.play(matchToggle ? matchSound1 : matchSound2)

      // Combo milestone sounds layered on top
      if (combo >= 30 && combo % 5 === 0) {
        this.play(combo30Sound)
      } else if (combo === 20 || combo === 25) {
        this.play(combo20Sound)
      } else if (combo === 15) {
        this.play(combo15Sound)
      } else if (combo === 10) {
        this.play(combo10Sound)
      }

      // Haptics
      if (combo >= 25) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setTimeout(
          () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
          100,
        )
      } else if (combo >= 10) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else if (combo >= 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      } else if (combo >= 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    } catch {}
  },

  async playDeckDraw() {
    try {
      this.play(drawSound)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
    } catch {}
  },

  async playLevelComplete() {
    try {
      this.play(levelCompleteSound)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {}
  },

  async playShuffle() {
    try {
      this.play(shuffleSound)
    } catch {}
  },

  async playTimeWarning() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } catch {}
  },
}
