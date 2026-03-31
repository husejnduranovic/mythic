import { Audio } from "expo-av"
import { Asset } from "expo-asset"
import * as Haptics from "expo-haptics"

let lastMatchTime = 0
let lastComboSound = 0

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

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v))

const getComboVolume = (combo: number) => {
  if (combo >= 30) return 1.0
  if (combo >= 20) return 0.9
  if (combo >= 15) return 0.8
  if (combo >= 10) return 0.7
  if (combo >= 5) return 0.6
  if (combo >= 3) return 0.5
  return 0.4
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

  play(sound: Audio.Sound | null, volume = 1) {
    if (!sound) return

    try {
      sound.setPositionAsync(0)
      sound.setVolumeAsync(clamp(volume, 0, 1))
      sound.playAsync()
    } catch {}
  },

  async playMatch(combo: number) {
    try {
      const now = Date.now()

      // prevent audio spam within same frame burst
      if (now - lastMatchTime < 30) return
      lastMatchTime = now

      matchToggle = !matchToggle
      const volume = getComboVolume(combo)
      this.play(matchToggle ? matchSound1 : matchSound2, volume)

      // Combo milestone sounds layered on top
      if (combo >= 30 && combo % 5 === 0) {
        this.play(combo30Sound, 1.0)
      } else if (combo === 20 || combo === 25) {
        this.play(combo20Sound, 0.9)
      } else if (combo === 15) {
        this.play(combo15Sound, 0.8)
      } else if (combo === 10) {
        this.play(combo10Sound, 0.7)
      }

      // Haptics
      if (combo >= 25) {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        }, 20)
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
