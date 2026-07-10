# Mythic Peaks — Gameplay Analysis & Proposals

Written 2026-06-17 from a full read of the gameplay code (`src/game/scoring.ts`, `config.ts`, `match.ts`, `Game.tsx`, all nine `Layout*.tsx`, `Armory.tsx`, `CardService.ts`, `Timer.tsx`). **Analysis only — no code changed.** Every proposal is a candidate for owner approval; nothing here is committed to. Anything touching scoring/board feel is explicitly gated on owner playtest (the same judgment that picked the current 6 layouts — DESIGN_PLAN §8).

Conventions used below:
- **"Open"** = playable at field start (no blockers).
- **"Depth"** = longest blocker chain from base to peak.
- Combo multiplier values are from `getComboMultiplier` (`scoring.ts:5`).
- Layout numbers are the *config* numbers (`LEVEL_CONFIG`), which do **not** match the filenames — the map is in §3.

---

## 1. Executive summary

The core loop is sound and the scoring math is internally consistent, but three structural facts shape everything:

1. **Combo multiplication dwarfs every other point source.** A single card at combo 32 is worth 300× its base; the entire rest of the scoring (bounty, time, deck, even perfect-clear) is a rounding error next to a long chain. **Consequence: the optimal strategy in every layout, every level, every mode is identical — build one maximal chain.** Layouts vary in *shape* but not in *strategy*. This is the single biggest lever on "scores converge / layouts feel similar."
2. **Difficulty does not track level.** The highest-multiplier, highest-stakes level (6, 3.5×) uses the *easiest, shallowest* board (Dragon's Spine — 14 open cards, 7-card base). Late-game tension comes from the timer and multiplier greed, not the board. That's a defensible design, but it means the layouts themselves don't form a difficulty curve.
3. **Two mechanics that should be skill expression are flat or grindy:** Armory progression is gated *only* on battles-played and streak (no score/combo/skill gate at all), and bounty placement is **non-deterministic even on seeded decks** (a fairness gap in Daily Quest and Arena — §8).

Found two concrete defects worth fixing regardless of design direction: the **combo-freeze / milestone-banner thresholds disagree** (§4) and **bounties break same-deck fairness** (§8). Both flagged below.

---

## 1.5 Scoring v2 — "Spoils, Banners & Bounties" (SHIPPED 2026-07-01)

The redesign that answers §1.1's convergence finding. Implemented in `src/game/scoring.ts` + `Game.tsx`; described here as the scoring source of truth. Everything in §2 below describes **v1** and is kept as the historical analysis.

### The model

1. **Chain curve tamed, capped at 100×** (`getComboMultiplier`). Combos 1–5 keep the v1 hook almost exactly (1 / 2 / 3.5 / 5 / 7), then the curve goes stepwise-linear: +2 per combo to 10 (17×), +3 to 16 (35×), +4 to 24 (67×), +5 beyond, **hard cap 100× from combo 31**. v1 reached 300× — one combo-32 card outvalued sixty bounties, which is why chain length was the only strategy on every board. Chains remain the biggest single source (as they should be — they're the fun), but they no longer round every other system to zero.

2. **Banners — banked milestone bonuses** (new). At combos **5 / 8 / 12 / 16 / 20 / 24 / 28 / 32** (exactly the `COMBO_MILESTONES` keys) the chain *plants a banner*: an instant, permanent bank of **`milestone × 1,000 × fieldMult × glory`** spoils, plus a **flat 3-second timer freeze**. Sum of all eight banners on one field = 145k × fieldMult — material next to a strong chain's match points, so a chain that dies at 19 still walked away with its 5/8/12/16 banks. This is the push-your-luck axis: the HUD combo meter fills toward the next flag, and "banner 20 is two taps away — push or draw?" is now a real, visible decision. **Fixes the §4 defect** by construction: banners, freezes, sounds, HUD tiers and titles all key off one ladder; the dead `comboBaseRef` indirection is deleted.

3. **Bounty = 3× your current tier** (was: flat +5000×fieldMult). A bounty card pays its match points **plus `getBountyBonus` = 2× match points** — i.e. worth three cards at whatever combo tier you're on when you take it. Early capture ≈ nothing, late-chain capture is enormous → bounties become *routing* decisions (steer the chain to end through them), answering §2.2. And bounty **placement is now seeded** in Daily/Arena (`pickSeededIndices`, seed = `mythic-<seedBase>-level-<N>-bounty`) — every player on a shared deck faces the same bounties, closing the §8 fairness defect. Free play keeps random placement.

4. **Unchanged**: perfect clear (50,000 × fieldMult × glory — now genuinely big relative to a capped chain), time bonus (50/s), deck bonus (200/card), Glory Hunt (2× everything, 50% time, once), field multipliers (1.0→3.5×), the two-active-card rule, Free Draw, deck-draw combo reset (chains still die — banners just leave a grave marker).

### Strategy divergence (the point of all this)

- **Deep boards** (Snake Eyes' spine, the Warfront breach) → chain/banner hunting: long guarded chains reach the high flags.
- **Open boards** (Dragon's Spine finale) → clear + speed: the cap means a mid-length chain plus perfect clear plus time bonus beats greeding for the tail.
- **Every board** → per-seed bounty routing as a micro-goal that moves daily.

### Leaderboard implication — stated for the owner

v2 runs score **~5–20× lower** than v1 (single runs drop from tens of millions to ~1–5M). Existing `allTimeScores` entries become unbeatable ghosts. **Recommendation: wipe `allTimeScores` (and treat pre-v2 `bestScore` fields as historical) when 1.4 ships** — with ~6 active players this is cheap now and impossible later. Every score document now carries **`scoringV: 2`**, so if the wipe is skipped the leaderboards can filter by version instead.

### Run systems (added 2026-07-02) — the comeback, the shadow, the apex

Three systems answering what v2 didn't: why finish a bad run, and what makes a great one feel witnessed. **None touch the scoring math** — the wipe decision stays clean.

1. **Free Draw banking.** Each field grants one Free Draw; an unused one carries to the next field (cap 2, count pip on the bar card). Draw variance smooths across the run and early discipline becomes late insurance. Deterministic given play — no fairness impact on shared decks.
2. **The ghost.** Every completed run records its cumulative score at each field's end (`runPaceRef` → `@mythic_best_run_pace` when it beats the stored final). Between-levels shows **ahead/behind your best run at this exact point** — the comeback is visible when behind (with the "fields ahead pay up to 3.5×" framing), and a legendary run announces itself mid-run, exactly where the Glory decision lives. Local-only; racing your own shadow is the return hook.
3. **Flawless Conquest.** All fields cleared perfectly → a named goldBright accolade on game-over (outranked only by ALL-TIME RECORD) + a Perfect Fields x/6 ledger row. The apex run stops being just a big number.

**Evaluated and deferred: Glory charges earned at high combos** (G8's third leg) — a real idea, but extra 2× windows inflate score ceilings, and one economy change per release is enough while the `allTimeScores` wipe decision is pending.

### The moments pass (2026-07-02, second pass) — the apex act, and the board learns to react

4. **Unbroken Conquest** — the "tell a friend" moment, and the session's one scoring change. A field cleared with the **final combo equal to its card count** was consumed by a single unbroken chain (free draws don't break a chain; deck draws before the first capture never started one). **Scoring: the clear pays a second perfect-clear bonus** (`getUnbrokenBonus`) — an unbroken field totals `100,000 × fieldMult × glory`. Rare by construction (the chain must be as long as the whole field), so the +50k×mult rides the rarest event and doesn't bend the v2 economy (strong runs are 1–5M; `scoringV: 2` and the wipe decision stand). Payoff: triple-ring gold detonation, UNBROKEN! banner (1350ms hold), the top combo sting layered over the level fanfare, double-heavy haptics, an UNBROKEN CONQUEST header + goldBright chip in the between-levels exhale, and a game-over ledger row that only exists once earned.
5. **The clear-hold — a lost moment recovered.** `advanceLevel` used to fire the PERFECT CLEAR banner and `setBetweenLevels(true)` in the same synchronous block: the board unmounted before the banner ever rendered a frame. Won fields now hold the board (950ms perfect / 1500ms unbroken) with the clock stopped while the moment plays; deck/free-draw/card presses are levelCompleteRef-guarded during the hold.
6. **The board reacts on the ladder's top half.** Banner plants ≥20 (RAMPAGE+) detonate a `BoardBurst` (one-shot core flash + shock rings, one shared value, mounted ~700ms, nothing per-card); milestone holds are tiered (550ms banners, 850ms at ≥20, 900/1350ms clears). Every capture/draw **thunks the incoming card onto the dais** (dip→overshoot→settle on one wrapper transform). A chain worth at least one banner that dies to a deck draw gets a steel **CHAIN BROKEN — x{n} FELL · BANNERS HOLD** stamp: the loss and the banked insurance become legible at the moment they matter.
7. **The exhale itemized.** The Breath's spoils count-up now deals in source chips — COMBAT / TIME / DECK / PERFECT / UNBROKEN (zeros skipped) — so the scoring's decision-rewards (clear fast, don't drain the deck, perfection) are visible money, not one silent number. Display-only.
8. **The shadow is named at the gate.** Pre-battle shows THE SHADOW · {best run total} before the first card is dealt — the ghost race starts at the moment of deciding to play, not three fields in.
9. **Ember Ward + a real streak bug.** One missed day per rolling week is forgiven (`emberWardUsedAt`, 2-day gap continues the streak; multi-day gaps still reset; Home chip shows an ember shield for a day after it fires). Found in the same block: `getYesterdayString` was UTC (`toISOString`) while `getTodayString` was local — players east of UTC playing just after local midnight had streaks wrongly reset (plausibly why heavy players maxed at streak 5). Streak comparison is now an exact local-day diff.
10. **First-session arc** (see DESIGN_PLAN §6): coach marks R2 (match rule / chain / free draw, first free battle only), First Victory R5 (one-time overlay → Armory "choose your colors", veteran-gated), share-the-spoils A-1 on game-over (record/flawless-aware message + store link).

### Aligned ladders (one source of truth)

| Combo | Mult | Banner bank (×fieldMult) | Freeze | Title | Sound |
|---|---|---|---|---|---|
| 5 | 7× | 5,000 | 3s | WORTHY | combo5 |
| 8 | 13× | 8,000 | 3s | VALIANT | combo10 |
| 12 | 23× | 12,000 | 3s | GLORIOUS | combo15 |
| 16 | 35× | 16,000 | 3s | LEGENDARY | combo20 |
| 20 | 51× | 20,000 | 3s | RAMPAGE | combo25 |
| 24 | 67× | 24,000 | 3s | UNSTOPPABLE | combo30 |
| 28 | 87× | 28,000 | 3s | DIVINE | combo30 |
| 32 | 100× (cap) | 32,000 | 3s | MASTER OF PEAKS | combo30 |

Capture-flash tiers on the field (Card.tsx) sit on the same ladder: ≥8 gold ring, ≥16 ember, ≥24 red.

---

## 2. Per-feature analysis

### 2.1 Combo system — *the* core mechanic
`getComboMultiplier` (`scoring.ts:5`) ramps 1 → 2 → 3.5 → 5.5 → 8 → 11 (combo 6) → … → 105 (20) → 300 (32). `getMatchPoints = 500 × comboMult × layoutMult × gloryFactor`.

- **Meaningful choice?** Yes, at the micro level. On each tap you choose which open matching card to take, and the **two-active-card rule** (`handleCardPress:584-619`: you may match the tapped card against *either* the current card or the "second card" retained once combo ≥ 2) gives a genuine routing decision — keep two live ranks to maximize reachable continuations. This is the most underexplained good mechanic in the game (the Guide never mentions the second card).
- **Hook to deepen:** the combo curve is so steep that *breaking* a chain is catastrophic, which makes the deck-draw (combo reset, `handleDeckPress:655`) feel purely punishing rather than tactical. A small **"combo bank"** — banking a chain at a milestone for a flat bonus instead of risking it — would add a push-your-luck decision. (Behavioral; Phase 4.)
- **Flag:** combo ≥ 10 paints a full-screen tint overlay (`Game.tsx:974`) — fine, but it's the only escalating feedback below the milestone banners; combos 2–9 (the range every new player lives in) get almost no visual payoff. R2 coach-mark already planned (DESIGN §6 R2) but a combos-2-9 ramp would help retention.

### 2.2 Scoring model
Sources: match points (combo-driven), bounty (+5000×layoutMult, flat — `getBountyBonus:47`), time bonus (50/sec × glory — `:51`), deck bonus (200/undealt card × glory — `:55`), perfect clear (50000×layoutMult×glory — `:59`).

- **Imbalance:** bounty is *not* combo-multiplied (by deliberate comment, `Game.tsx:596`), so at any combo ≥ ~6 a normal matched card is worth more than the +5000 bounty. Bounties are therefore a low-priority target — you take them if they're on your chain, never route for them. They don't create the "should I detour?" tension their 5× framing implies.
- **Perfect clear (50000×mult)** is the one big non-combo prize and it *can* conflict with chaining (clearing the awkward last cards may force combo breaks) — this is the healthiest tension in the model and should be protected.
- **Proposal (low risk, behavior change → approval):** make bounty a **combo multiplier booster** (e.g. capturing a bounty adds +2 to the effective combo tier for that card, or grants a flat combo-preserving "the chain survives one deck draw") rather than a flat bonus it can't compete with. Turns bounties into routing decisions.

### 2.3 Layout multipliers & level structure
`getLayoutMultiplier(level) = 1 + (level-1)×0.5` → levels 1–6 = 1.0/1.5/2.0/2.5/3.0/3.5×. Fixed 6 levels in fixed order (`LEVEL_CONFIG`).

- **Meaningful choice?** None — the order and multipliers are fixed; the player makes no decision here. This is by design (the fixed 6-in-order run is the Hall-of-Glory-comparable baseline, DESIGN §8).
- **Observation:** because the multiplier rises every level but the boards don't get harder (§1.2), the back half of a run is where *all* the score is made (a combo-20 chain on level 6 is worth 3.5× the same chain on level 1). A player who limps to level 6 with the timer intact scores far more than one who chains hard early. This rewards *survival* over *early aggression* — worth knowing, possibly worth surfacing to the player.

### 2.4 Combo milestones & timer freeze — **defect flagged**
`COMBO_MILESTONES` (`config.ts:26`) keys banners at **5/8/12/16/20/24/28/32**. The freeze logic (`Game.tsx:368-373`) freezes the timer at **5/10/15/20/25/30**. These two ladders only coincide at 5 and 20.

- So the visual reward (milestone banner) and the mechanical reward (timer freeze) fire at *different* combos for most of the run — at combo 8 you get "VALIANT!" but no freeze; at combo 10 you get a freeze but no banner. The player can't learn the rule because there isn't one consistent rule.
- Root cause: `newMatches = combo - comboBaseRef.current` (`:361`) but `comboBaseRef` is now always 0 (it was the carry-combo anchor; carry-combo was removed in `158f5c9`). So `newMatches === combo` always, and the two hard-coded ladders simply never got reconciled after the mechanic was cut.
- **Fix (behavior-adjacent, own commit + approval):** align the freeze thresholds to the milestone keys (freeze at 5/12/20/28, say) or vice-versa, and delete the dead `comboBaseRef` indirection. Pure consistency win; no scoring change.
- **Also:** CLAUDE.md still documents milestones as "3/5/7/10/15/20/25/30" — wrong on both counts (DESIGN §9 already notes this drift).

### 2.5 Free Draw
One per level, draws a fresh current card **without resetting combo** (`handleFreeDraw:705`, vs `handleDeckPress` which zeroes combo).

- **Meaningful choice?** Yes — this is the best tactical tool in the game. The decision "do I spend my one Free Draw now to bridge a gap and save my combo, or hold it?" is real and recurs every level. Well-designed.
- **Underused potential:** it's one-per-*level* and resets every level (`initLevel:479`), so on a cleared level it's often wasted. A **carry-over** ("unused Free Draws bank to next level, max 2") would reward efficient clears and add a resource-management layer. Low effort, behavior change.

### 2.6 Glory Hunt
Once per game: 2× points, 50% time (`Game.tsx:1101-1104` halves `config.time`; `gloryFactor` doubles points), opt-in at pre-battle and between-levels.

- **Meaningful choice?** Coarse but real: *which* level to spend it on. Because points scale with layoutMult, the textbook play is "activate on level 6 (3.5×) and pray you clear in half-time." There's a genuine risk/reward (half-time can cost you the perfect-clear bonus and the level).
- **Weakness:** it's a single binary, decided once, with an obvious-ish answer (later = more points). Little ongoing engagement. **Hook:** make it a *charge you earn* (e.g. earn a Glory charge by hitting combo 15) so high-combo play feeds more Glory windows — ties the two systems together. Phase 4.

### 2.7 Daily Quest
Seeded deck per `getTodayString()`, all 6 levels, one attempt/day, own leaderboard (`initLevel:483`).

- **Meaningful choice?** Same as the core loop — it's the core loop on a fixed seed. The fixed seed is *good* (everyone races the same arrangement). 
- **Defect (see §8):** bounty placement is **not** seeded, so two players on the same daily deck face different bounty positions and thus different score ceilings. Undermines the "same battle for everyone" promise.

### 2.8 Arena
2–6 players, deck seeded on `${roomCode}-${round}` (`initLevel:486`), live score sync at level transitions (`advanceLevel:456`).

- **Meaningful choice?** Inherits the core loop; the multiplayer layer adds no *new* in-match decision (you can't see opponents mid-level, only at transitions). DESIGN §7 A2 ("live opponent deltas at field transitions") is the right call — it would add a catch-up/protect-lead read without changing scoring.
- **Same bounty-seeding defect as Daily** — arguably worse, since Arena is explicitly a same-deck race.

### 2.9 Armory progression
34 items (28 selectable + 6 vestigial wilds), gated on `gamesPlayed` (`unlockReq`) or `bestStreak` (`streakReq`) only — confirmed `Armory.tsx:1262`.

- **Meaningful choice?** Equipping is pure cosmetic preference (no gameplay effect — correct, no P2W). The *progression* is the issue: **every unlock is grind (battles) or attendance (streak); none rewards skill.** A player who plays 120 mediocre games unlocks everything a master does. CLAUDE.md claims "score milestones" as unlock conditions — that code does not exist.
- **Proposal:** re-point 3–4 existing items at **skill gates** (e.g. "reach combo 20", "clear a field perfectly", "score 100k in one run") instead of battle counts. Zero new content, gives mastery something to chase, and feeds the §6.5 "one more battle" goal module with skill-flavored targets. Pairs with R3 Warrior's Path (DESIGN §6 R3).
- **Vestigial:** the 6 wild styles (incl. 42-day-streak Inferno Bolt) remain unreachable (mechanic removed). Decision still open (DESIGN Findings #1).

---

## 3. Layout analysis

**Config → file map** (the comments inside the files are stale and mislabeled — trust this table, derived from `LEVEL_CONFIG` + `getLayout` `Game.tsx:807`):

| Level | Mult | Config layout | File | Name (in file) | Cards | Open | Max depth | Base row |
|---|---|---|---|---|---|---|---|---|
| 1 | 1.0× | 1 | `Layout1.tsx` | Battlements | 29 | **12** | 4 (bridge) | 5 open |
| 2 | 1.5× | 11 | `LayoutSiege.tsx` | **The Siege** *(2026-07-02 audit, playtest-gated)* | 32 | **12** | 6 (keep) | **none** |
| 3 | 2.0× | 14 | `LayoutPortcullis.tsx` | **The Portcullis** *(2026-07-10, playtest-gated)* | 30 | **7** | 5 (the bar) | **none** |
| 4 | 2.5× | 8 | `Layout8.tsx` | Snake Eyes | 32 | **9** | 5 (spine) | 4 open |
| 5 | 3.0× | 10 | `LayoutCitadel.tsx` | **The Citadel** *(2026-07-02, playtest-gated)* | 32 | **10** | 4 (breach) | **none** |
| 6 | 3.5× | 5 | `Layout5.tsx` | Dragon's Spine | 28 | **11** *(was 14 — base interlocked 2026-07-01)* | 3 | 7 slots, 4 open |
| 7 | 4.0× | 13 | `LayoutPeaks.tsx` | **The Mythic Peaks** *(2026-07-02, playtest-gated)* | 28 | **10** | 4 (summits) | 10 open (fused web) |

Shelved (not in rotation): `Layout9.tsx` "Cross of Clans" + `Layout7.tsx` "The Stronghold" (cut by the 2026-07-02 audit, below), `LayoutHourglass.tsx` "The Hourglass" (cut 2026-07-09 — the Last Grain choke stalled runs) + its replacement `LayoutFloodgates.tsx` "The Floodgates" (cut 2026-07-10, below), `Layout2.tsx` (unnamed piles), `Layout3.tsx` "Fortress" (36), `Layout4c.tsx` "Reverse Tripeaks" (36), `Layout6.tsx` "Colosseum" (32).

> **2026-07-10 — The Portcullis (L3, 2.0×, 30c, 7 open)** replaces The Floodgates (owner verdict: the Floodgates and the Peaks finale read as the same funnel silhouette, mirrored — both uninspiring; L4/L5/L6 set the quality bar). The castle gate as interlocking jaws — the campaign beat after The Siege: break the gate. Three falling fangs (3-over-2 wedges off the rail) and two rising fangs (pairs off their tips) meet on **one open mid-board MEETING ROW** — no other board bricks mid-board — with the rising tips holding the falling waists on *both* their sides; hinge posts pin the bar (depth 5, the last stand, behind brackets that need a rising fang out AND the gate's heart-stone pulled). Machine-verified clearable + mirror-isomorphic; cascade 1.78 reveals per revealing tap (top of the 1.2–1.8 band). **Burst 26.7% and maxBurst 4 — both set records** — first-5 5.1, 0.77 cards opened per capture (set best; Floodgates 0.73); the toll is root-heavy dead taps (57%, high end of the shipped range). Identity: **unzip the interlock** — order along the meeting row is the whole game; a rising tip pays double (waists both sides + its own pair). Owner feel-gate before release.

> **2026-07-02 — the layout audit** (owner playtest verdict: levels 2 and 3 boring — "fewer cards opening, less uniqueness, less strategic variety"). `scripts/verify-layouts.js` now encodes every board's blocking graph and machine-checks clearability, mirror-isomorphism and Monte-Carlo feel metrics (dead-tap share, burst rate, first/last-5 reveal profile). The audit agreed with the playtest and found the numbers: **Cross of Clans** was 75% dead taps with a 0.8-card first-five (four identical clusters, zero shared covers, the "which cluster" choice cosmetic); **The Stronghold** decayed — reveal rate highest at move 1, narrowing pyramid, and it duplicated the Battlements archetype two levels earlier. Both replaced; both files shelved.
>
> The replacements (+ the new finale), all verified clearable + mirror-isomorphic, all playtest-gated:
> - **The Siege (L2, 1.5×, 32c, 12 open)** — a castle from above: outer wall ring (guards + pockets), inner wall bricked beneath (each stone under two — one tap advances up to four cards), posterns, and a 6-card keep that falls pop-pop-pop (N/S gatehouses → both halls → both hearts). Double-symmetric (L-R and N-S). The only board whose reveals **rise** at the end (last-5: 3.4 vs 1.4–1.8 set-wide). Decisions: where to breach, which direction around the ring, keeping the chain alive for the keep.
> - **The Hourglass (L3, 2.0×, 30c, 8 open)** — sand flows down: 8-wide open reservoir → brick taper → **the Last Grain** (one card holds the whole bottom half) → widening bloom (2→3→4→5) where no tap is dead. Narrative arc: abundance → squeeze → pop → five-wide finish. Lowest dead-tap share (48%), best burst rate (21.8%), deepest board (7). Teaches Free Draw (bridge the neck); natural UNBROKEN stage.
> - **The Mythic Peaks (L7, 4.0×, 28c, 10 open)** — the classic tri-peaks board, the namesake, as the new finale: ten contiguous opens (widest chain freedom — the 4.0× banner hunt), radiating web (every clear advances two above), three summit pops. The run now ends by summiting the Mythic Peaks.
>
> **Run is now 7 fields, 1.0×–4.0×.** `TOTAL_LEVELS` drives road deal / march / Flawless / arena sync; Guide copy interpolates. Scores inflate ~30% per run vs the 6-field v2 baseline — subsumed by the pending `allTimeScores` wipe (docs stay `scoringV: 2`; the match/banner formulas are unchanged). Old 6-field ghost paces self-heal.
>
> Post-audit strategic identities, one line each: L1 teaches · L2 ring-routing + late keep · L3 unzip-the-interlock · L4 depth/scarcity · L5 late bloom + fuel · L6 scattered sprint · L7 open-web greed. The §3.2 archetype-duplication and "every opening feels the same" findings are resolved: three of seven boards are base-less, and no two share a cascade signature.

> **2026-07-02 — The Citadel (level 5) replaces the Warfront (never shipped).** Owner constraint: **symmetric shapes only** — the asymmetric Warfront broke the set's visual consistency. The redesign keeps the Warfront's signature — **the Breach**, an escalating 2→3→4→5 fan that *widens* as you climb (the inverse of every pyramid in the set; the board's payoffs arrive at the END of the field, exactly when v2 banners pay most) — and rebuilds the flanks as two **identical mirrored bastions** (supply chain = tempo, 3-over-2 tower = mid cascade, open picket = free tap). 32 cards, **10 opens**, still no base row. Blocking graph machine-verified: fully clearable **and mirror-isomorphic** (the symmetry holds at the rules level). Cascade events: Breach 1.5/1.33/1.25, towers 1.5 — in the §3.3 band; supply chains deliberately flat as fuel. **Owner feel-gate before release.**

### 3.1 The six active layouts

- **L1 Battlements (1.0×, 29c, 12 open):** Two 3-on-2 towers + two 1-on-1 pairs + a 4-deep central bridge + a 5-card open base. Lots of entry points, gentle depth except the bridge. **Good opener** — forgiving, teaches blocking. Fine.
- **L2 Cross of Clans (1.5×, 32c, 12 open):** Four identical 8-card plus-clusters, each `3 deep(open) → 3 mid + 1 bottom → 1 top`. **The standout for choice variety** — no base-row safety net, so every match must come from a cluster, and clearing 3 deep cards opens 4 at once (the biggest single-move payoff in the set). The "which cluster, in what order" decision is the most distinct in the rotation. Keep.
- **L3 The Stronghold (2.0×, 30c, 10 open):** Center inverted pyramid (cascades down, gradual) + two side keystones (clear 1 → opens 3 → opens 4, explosive) + 4 open base. **Best internal variety** — two different cascade feels on one board. Keep.
- **L4 Snake Eyes (2.5×, 32c, 9 open):** Two independent 8-card "eyes" + a **5-deep center spine** (deepest board in the game) + bridge pairs + base. Fewest open cards, deepest chains → highest combo ceiling, hardest to read. The correct "hard board." Keep.
- **L5 piles + wall (3.0×, 32c, 12 open):** Two vertical piles (top blocks a 2×2 inner box which blocks the outer box) + a 4-on-4 center wall + 4 open base. Mechanically fine but **the least thematically distinct** (no name, generic geometry).
- **L6 Dragon's Spine (3.5×, 28c, 14 open):** Diamonds + chains + a shallow center crown + a **7-card open base**. The *easiest, most open* board — paired with the *highest* multiplier and *shortest* time. The finale's challenge is greed + clock, not the board.

### 3.2 Similarity / convergence findings

- **L1 and L3 share an archetype:** "two symmetric flanks + a central pyramid/bridge + a 4–5 card open base." They differ in cascade feel (L3's keystones are punchier) but read as cousins. Not a problem at two levels apart, but if a rotation pool (DESIGN §8 4a) is built, don't add a *third* member of this family.
- **Every active layout except L2 has an open base row of 4–7 cards.** That base makes the *opening* of five of six levels feel the same: tap freely along the bottom until the interesting blocked structure is reachable. L2 (no base) is the only level whose first move is a real decision. **This is the strongest "they feel similar" lever** — the bases homogenize the first ~10 seconds of every level.
- **All active layouts are bilaterally (or 4-fold) symmetric.** "Which side first" is mirror-equivalent, so the symmetry halves the real decision space. No active layout has a deliberately *asymmetric* or *irregular* structure that would force a genuinely non-obvious opening.
- **Strategy convergence (the deep one, §1.1):** because combo multiplication dominates, the optimal plan is the same on all six — build the longest single chain, spend Free Draw to bridge, save Glory for level 6. Layouts are different *puzzles* to reach the *same* goal; none rewards a different *strategy* (e.g. spread vs chain, clear vs greed). Score variance between layouts therefore comes mostly from card-count and multiplier, not from strategic divergence — which is exactly why scores converge.
- **L5 is the weakest keeper:** it's competent but generic; if the pool needs a cut candidate or a re-theme, it's the one.

### 3.3 The shelved three (why they were cut — diagnoses for the §8 feel-gate)

- **L3 Fortress (36c):** Pure straight-column 1-to-1 blocking (towers) + a 1-to-1 bridge. **Diagnosis:** 1-to-1 blocking means clearing a card opens *exactly one* card — zero cascade payoff, no "big opening" moments, and 36 cards of it is a grind. Almost no routing choice. *Fix only if* a cascade element is added; otherwise discard.
- **L4c Reverse Tripeaks (36c):** Three inverted pyramids with **18 open cards** + an 8-card base. **Diagnosis:** 18 simultaneously-open cards is too forgiving — with that many options a long chain is almost always trivially available, which *flattens* the combo skill curve (everyone maxes combo, scores converge upward). The opposite failure from Fortress. *Fix:* cut open count to ~10, deepen the pyramids.
- **L6 Colosseum (32c):** Three 2-layer arches + two 2-card pillars + 1-to-1 floor blocking. **Diagnosis:** mostly 1-to-1 blocking again (arches block to the floor row 1-to-1), so like Fortress it lacks cascade; the pillars (1 open card each) are a token gesture at choice. Middling. *Fix:* convert the floor blocking to shared blockers so clearing creates cascades.

**Pattern across all three shelved:** they fail on the *cascade* axis — either no cascade (Fortress, Colosseum: 1-to-1 blocking) or so much openness that cascade is irrelevant (Reverse Tripeaks: 18 open). The active six all have **shared-blocker cascades** (clear N → open M>N), which is evidently the feel the owner selected for. **This is the feel-gate criterion to write down:** *a layout ships only if its average "cards opened per card cleared" sits in the active-six band — roughly 1.2–1.8 — neither flat (≤1.0) nor trivially open.*

---

## 4. Prioritized proposals

Ordered by leverage on the stated goal ("variation so players pursue different score strategies; scores don't converge") × safety.

| # | Proposal | Addresses | Risk | Status (2026-07-01) |
|---|---|---|---|---|
| G1 | **Fix combo-freeze ↔ milestone threshold mismatch** (§2.4); delete dead `comboBaseRef` | Consistency defect | Low | ✅ **shipped** — one banner ladder (§1.5) |
| G2 | **Seed bounty placement** off the deck seed in Daily/Arena (§8) | Same-deck fairness defect | Low-Med | ✅ **shipped** (`pickSeededIndices`) |
| G3 | **Re-point 3–4 Armory unlocks at skill gates** (combo/score) (§2.9) | Mastery has nothing to chase | Low | ✅ **shipped** (×12/×20/×28 combo, 1M spoils) |
| G4 | **Make bounty a combo-booster, not a flat bonus** (§2.2) | Bounties are ignorable | Med | ✅ **shipped** as ×3-at-tier (§1.5) |
| G5 | **De-homogenize level openings** | The "first 10 seconds feel the same" lever (§3.2) | Med | ✅ **shipped** — Dragon's Spine interlocked base (playtest-gated) |
| G6 | **Add one asymmetric / irregular layout** | Symmetry halves decision space (§3.2) | Med | ✅ **shipped** — The Warfront (playtest-gated) |
| G7 | **A scoring axis that rewards spread/clear over pure chaining** | Strategy convergence root cause (§1.1) | High | ✅ **shipped** via the v2 cap + banners (perfect-clear/time now material) |
| G8 | Free Draw carry-over (§2.5); Glory charge earned at combo 15 (§2.6); combo-bank (§2.1) | Deepen existing verbs | Med | 🟡 combo-bank shipped as **banners**; **Free-Draw banking ✅ shipped 2026-07-02** (cap 2, §1.5 run systems); Glory charges evaluated & deferred (score-ceiling inflation while the wipe decision is open) |

**Feel-gate to record for §8 (DESIGN_PLAN):** cascade ratio in the 1.2–1.8 band (§3.3); avoid a third L1/L3-archetype layout; prefer non-symmetric or base-less structures to widen the opening decision.

---

## 5. CLAUDE.md corrections surfaced — ✅ RESOLVED 2026-07-01

(Consolidates with DESIGN §9.) All applied: CLAUDE.md now documents the v2 banner ladder (5/8/12/16/20/24/28/32, one ladder for bank/freeze/sound/tier), 1.0–3.5× multipliers, the removed mechanics (wilds/carry-combo/insurance — inventory deleted too), and the true Armory count (28 pieces / 4 racks) with the new skill gates.
