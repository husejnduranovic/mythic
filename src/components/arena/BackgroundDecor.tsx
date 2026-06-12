import React from "react"
import { Animated, Text, View } from "react-native"
import { styles } from "./arenaStyles"

interface Props {
  glowPulse: Animated.Value
}

const BackgroundDecor = ({ glowPulse }: Props) => (
  <View style={styles.bgLayer} pointerEvents="none">
    <Animated.View style={[styles.bgGlow, { opacity: glowPulse }]} />
    <Text style={[styles.bgRune, { top: "10%", left: "5%" }]}>ᚠ</Text>
    <Text style={[styles.bgRune, { top: "15%", right: "8%" }]}>ᚦ</Text>
    <Text style={[styles.bgRune, { bottom: "18%", left: "10%" }]}>ᚱ</Text>
    <Text style={[styles.bgRune, { bottom: "22%", right: "5%" }]}>ᛟ</Text>
    <Text style={[styles.bgRune, { top: "50%", left: "3%" }]}>ᚲ</Text>
    <Text style={[styles.bgBeast, { top: "20%", left: "15%" }]}>⚔</Text>
    <Text style={[styles.bgBeast, { bottom: "25%", right: "12%" }]}>🛡</Text>
    <View style={styles.bgHLine} />
  </View>
)

export default BackgroundDecor
