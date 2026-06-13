// Pre-battle / daily-quest intro — "The Muster" (DESIGN_PLAN §4.2 intro, recomposed).
//
// Normal mode shows the player's equipped war kit — the card back + bounty card
// fanned and standing on a shelf, the app icon recreated from the player's own
// gear (the same MiniBack/MiniBounty the Armory stage uses) — beside the road
// ahead and the Enter Battle muster. Daily mode shows a sealed quest card. The
// screen replaces the board, so deal-in / levitate motion is free.

import React, { useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import ReturnToCastle from "../ReturnToCastle"
import { TOTAL_LEVELS } from "../../game/config"
import { Icon } from "../../ui/Icon"
import { GoldButton } from "../../ui/GoldButton"
import { color, font } from "../../ui/theme"
import { HonorCard, withAlpha } from "../../ui/honor"
import { getEquippedKit, MiniBack, MiniBounty, type ThemeConfig } from "../Armory"

export const PreBattleScreen = ({
  theme,
  background,
  dailyMode,
  gloryCharges,
  gloryActive,
  onActivateGlory,
  onEnter,
  onHome,
}: {
  theme: ThemeConfig
  background: React.ReactNode
  dailyMode: boolean
  gloryCharges: number
  gloryActive: boolean
  onActivateGlory: () => void
  onEnter: () => void
  onHome: () => void
}) => {
  const { width: winW, height: winH } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const fade = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(15)).current
  const dealBack = useRef(new Animated.Value(0)).current
  const dealBounty = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
    // The kit deals onto the shelf: bounty first, the equipped back lands last.
    const seat = (v: Animated.Value, dur: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: dur,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    Animated.stagger(120, [seat(dealBounty, 320), seat(dealBack, 360)]).start()
    const loop = (v: Animated.Value, lo: number, hi: number, d: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: hi, duration: d, useNativeDriver: true }),
          Animated.timing(v, { toValue: lo, duration: d, useNativeDriver: true }),
        ]),
      ).start()
    loop(float, 0, 1, 2400)
    loop(pulse, 0.3, 0.5, 2000)
  }, [])

  const kit = getEquippedKit(theme)

  // ── Geometry ──
  const padL = Math.max(14, insets.left)
  const padR = Math.max(14, insets.right)
  const shrineW = Math.round(Math.min(310, Math.max(225, winW * 0.38)))
  const availH = winH - 96
  const backH = Math.round(Math.min(availH - 60, 168))
  const backW = Math.round(backH / 1.42)
  const bountyH = Math.round(backH * 0.84)
  const bountyW = Math.round(bountyH / 1.42)
  const cardH = Math.round(Math.min(winH - 150, 196))
  const cardW = Math.round(cardH / 1.46)

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })
  const dealStyle = (v: Animated.Value, rot: number) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
      {
        rotate: v.interpolate({
          inputRange: [0, 1],
          outputRange: [`${rot * 2.2}deg`, `${rot}deg`],
        }),
      },
    ],
  })

  const dailyBody = (
    <>
      <Text style={[p.cardTitle, { color: color.gold }]}>TODAY'S TRIAL</Text>
      <View style={{ flex: 1 }} />
      <Text style={[p.cardOverline, { color: withAlpha(color.gold, 0.55) }]}>
        ONE ATTEMPT
      </Text>
      <Text style={p.cardSeed}>SEEDED · SHARED DECK</Text>
      <View style={{ height: 10 }} />
    </>
  )

  return (
    <View style={[p.container, { paddingLeft: padL, paddingRight: padR }]}>
      {background}

      <Animated.View
        style={[p.inner, { opacity: fade, transform: [{ translateY: slide }] }]}
      >
        {/* Header */}
        <View style={p.header}>
          <View style={p.hOrn}>
            <View style={p.hLine} />
            <Text style={p.hDot}>◆</Text>
            <View style={p.hLineS} />
          </View>
          <View style={p.hCenter}>
            <View style={p.hTitleRow}>
              <Icon
                name={dailyMode ? "script-text" : "sword-cross"}
                size={18}
                color={color.gold}
              />
              <Text style={p.hTitle}>
                {dailyMode ? "DAILY QUEST" : "PREPARE FOR BATTLE"}
              </Text>
            </View>
            <Text style={p.hSub} numberOfLines={1}>
              {dailyMode
                ? "ONE ATTEMPT · SEEDED DECK · GLORY AWAITS"
                : `${TOTAL_LEVELS} BATTLEFIELDS AWAIT YOUR CONQUEST`}
            </Text>
          </View>
          <View style={p.hOrn}>
            <View style={p.hLineS} />
            <Text style={p.hDot}>◆</Text>
            <View style={p.hLine} />
          </View>
        </View>

        <View style={p.contentRow}>
          {/* ── Left: the war kit (or daily card) ── */}
          <View style={[p.shrine, { width: shrineW }]}>
            {dailyMode ? (
              <>
                <Animated.View
                  style={[
                    p.cardPool,
                    {
                      width: cardW * 1.7,
                      height: cardW * 1.7,
                      borderRadius: cardW * 0.85,
                      backgroundColor: withAlpha(color.gold, 0.05),
                      opacity: pulse,
                    },
                  ]}
                />
                <HonorCard
                  w={cardW}
                  h={cardH}
                  trim={color.gold}
                  medallion="script-text"
                  deal={dealBack}
                  pulse={pulse}
                  float={float}
                >
                  {dailyBody}
                </HonorCard>
              </>
            ) : (
              <>
                <View style={p.kitZone}>
                  <Animated.View
                    style={[
                      p.kitRear,
                      { marginRight: -Math.round(backW * 0.32) },
                      dealStyle(dealBounty, 9),
                    ]}
                  >
                    <MiniBounty item={kit.bounty} w={bountyW} h={bountyH} />
                  </Animated.View>
                  <Animated.View style={[p.kitFront, dealStyle(dealBack, -5)]}>
                    <Animated.View style={{ transform: [{ translateY: floatY }] }}>
                      <MiniBack item={kit.back} w={backW} h={backH} />
                    </Animated.View>
                  </Animated.View>
                </View>
                <View style={p.shelf} />
                <Text style={p.kitLabel}>YOUR WAR KIT</Text>
                <Text style={p.kitName} numberOfLines={1}>
                  {kit.back.name} · {kit.bounty.name}
                </Text>
              </>
            )}
          </View>

          {/* ── Right: muster ── */}
          <View style={p.right}>
            {!dailyMode && (
              <View style={p.road}>
                <Text style={p.roadLabel}>THE ROAD AHEAD</Text>
                <View style={p.roadCards}>
                  {Array.from({ length: TOTAL_LEVELS }).map((_, i) => (
                    <View key={i} style={p.roadCard}>
                      <View style={p.roadCardFrame} />
                      <Text style={p.roadCardNum}>{i + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!dailyMode && gloryCharges > 0 && (
              <TouchableOpacity
                style={[p.gloryBtn, gloryActive && p.gloryBtnActive]}
                onPress={onActivateGlory}
                disabled={gloryActive}
                activeOpacity={0.85}
              >
                <Icon name="lightning-bolt" size={18} color={color.ember} />
                <View>
                  <Text style={p.gloryTxt}>
                    {gloryActive ? "GLORY HUNT ARMED" : "Glory Hunt"}
                  </Text>
                  <Text style={p.glorySub}>
                    {gloryActive
                      ? "2× spoils · 50% time"
                      : `2× spoils · 50% time (${gloryCharges} charge)`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <GoldButton
              variant={gloryActive ? "ember" : "primary"}
              icon={gloryActive ? "lightning-bolt" : "sword-cross"}
              label={gloryActive ? "BEGIN GLORY HUNT" : "ENTER BATTLE"}
              onPress={onEnter}
            />

            <ReturnToCastle onPress={onHome} />
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bgBase, paddingTop: 6 },
  inner: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    gap: 6,
  },
  hCenter: { alignItems: "center" },
  hTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hTitle: {
    color: color.gold,
    fontFamily: font.heading,
    fontSize: 17,
    letterSpacing: 3,
    textShadowColor: "rgba(232,197,71,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  hSub: {
    color: color.goldFaded,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 1,
  },
  hOrn: { flexDirection: "row", alignItems: "center", flex: 1, gap: 4 },
  hLine: { flex: 1, height: 1, backgroundColor: "rgba(232,197,71,0.15)" },
  hLineS: { width: 10, height: 1, backgroundColor: "rgba(232,197,71,0.25)" },
  hDot: { color: "rgba(232,197,71,0.4)", fontSize: 6 },

  contentRow: { flex: 1, flexDirection: "row", gap: 14, alignItems: "center" },

  // Left
  shrine: { alignItems: "center", justifyContent: "center" },
  cardPool: { position: "absolute" },
  kitZone: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  kitFront: {
    zIndex: 2,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  kitRear: {
    zIndex: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  shelf: {
    width: "62%",
    height: 1.5,
    backgroundColor: color.goldLine,
    marginTop: 12,
    borderRadius: 1,
  },
  kitLabel: {
    color: color.goldFaded,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 8,
  },
  kitName: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
    maxWidth: "90%",
  },

  // Daily card body
  cardTitle: {
    fontFamily: font.display,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 8,
  },
  cardOverline: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 4,
  },
  cardSeed: {
    color: color.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 2,
  },

  // Right
  right: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  road: { alignItems: "center" },
  roadLabel: {
    color: color.goldFaded,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 6,
  },
  roadCards: { flexDirection: "row", gap: 6, justifyContent: "center" },
  roadCard: {
    width: 26,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: color.goldLine,
    backgroundColor: color.bgRaised,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  roadCardFrame: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "rgba(232,197,71,0.12)",
  },
  roadCardNum: {
    color: "rgba(232,197,71,0.35)",
    fontFamily: font.heading,
    fontSize: 14,
  },

  gloryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: withAlpha(color.ember, 0.1),
    borderWidth: 1.5,
    borderColor: withAlpha(color.ember, 0.4),
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 230,
  },
  gloryBtnActive: {
    backgroundColor: withAlpha(color.ember, 0.18),
    borderColor: color.ember,
    shadowColor: color.ember,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  gloryTxt: {
    fontFamily: font.heading,
    color: color.ember,
    fontSize: 14,
    letterSpacing: 1,
  },
  glorySub: {
    color: withAlpha(color.ember, 0.5),
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 1,
  },

})
