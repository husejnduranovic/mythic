# Mythic Peaks — MONETIZE.md

*Written 2026-07-13. Marketing + monetization plan **excluding the lounge/venue channel entirely** (owner call: too time-intensive right now — MARKET.md §2 stays on the shelf until there's time for it). Constraints this plan is built around: solo dev with a full-time job, ~6 active players / 16 installs, Android only, €0 ad budget, free game with no ads and no IAP, €100/month prize already committed, Instagram + TikTok just started (3 posts), Reddit posts live.*

**The one-sentence truth:** at 6 active players every monetization option on earth earns €0, so for the next 60–90 days monetization is a *build-order question* (what to prepare, in what sequence, triggered by what playerbase size) while 100% of actual effort goes to free distribution.

---

## 0. The honest baseline

- **The game is cash-negative by design**: €100/month out, €0 in. That's fine — the prize is the marketing budget (MARKET.md §5) — but it means monetization's first job is not "profit," it's **offsetting the prize**. Break-even needs roughly 1,000–2,000 actives on cosmetic IAP alone. Hold that number in mind whenever a monetization idea feels urgent: nothing below changes the math at 6 players.
- **The leaderboards + real-money prize create a hard design constraint** most F2P advice ignores: *anything* that affects a run's score — extra draws, more time, retries, extra daily attempts, even rewarded-ad boosts — is pay-to-win against a cash prize. That's not just bad feel; it converts the competition into something legally murkier and kills the "fair fight" story. So the monetizable surface is exactly: **cosmetics, identity, and support** — nothing that touches a scoring run. (This matches DESIGN_PLAN §7's anti-goals; this file just makes the reason explicit: the prize is why.)
- **"No ads, no pay-to-win, real cash prize" is itself an asset.** It's the most differentiating sentence the store listing can carry, and every monetization step below is checked against not breaking it.
- **Retention is proven at tiny scale, acquisition is not** (MARKET.md §0: converts go deep; first-session largely fixed in v1.4; distribution is the leak). Monetization multiplies players you don't have yet. Sequence accordingly.

---

## 1. Monetization options — ranked and graded

Grading: **Earning potential** at realistic playerbase sizes (6 / 100 / 1,000 actives), **Effort** for a solo dev on this codebase, **Trust risk** to the current no-P2W/no-ads identity.

| # | Option | @6 actives | @100 | @1,000 | Effort | Trust risk | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | **Cosmetic IAP (paid Armory pieces + Arena cosmetics)** | €0 | €5–20/mo | €50–250/mo | Medium | Low | **The designed path. Build when ~100+ actives.** |
| 2 | **Supporter sigil (one-time badge)** | €0–5 total | €10–40 total | €100–300 total | Low | Near zero | **First IAP to ship — validates billing, trust-positive.** |
| 3 | **One-time premium cosmetic bundle** | €0 | €5–15/mo | €30–100/mo | Low (once IAP exists) | Low | Fine as an IAP *SKU*, not as a gate. Content paywall: never. |
| 4 | **Rewarded ads** | ~€0 | €2–10/mo | €30–100/mo | Medium | **High** | **Defer, probably never.** Breaks the "no ads" identity for pocket change; only non-scoring placements are even legal-to-the-design. |
| 5 | **Tournament entry fees** | — | — | — | High | **Fatal** | **Never on Google Play.** Paid entry + prize = real-money gaming: gambling-law exposure in Austria/EU and Play requires special approval it won't grant a solo card game. Ruled out, not deferred. |
| 6 | **Sponsorship** | €0 | €0 | maybe | Low-med | Low | Nothing to sell at <5k actives, and the natural sponsor (venues) is the excluded channel. Revisit at scale. |
| 7 | **Interstitial/banner ads** | ~€0 | €5–20/mo | €50–150/mo | Medium | **Fatal** | Never. Destroys the identity, the feel, and the listing's best bullet, for less than the prize costs. |

### 1.1 Cosmetic IAP — the real plan (rank 1)

Why it's the winner: the **Armory pipeline already does 90% of the work** — 36 pieces, 4 racks, unlock gates, equipping, theming contexts, the Quartermaster's Stage that *sells the look* (the diorama exists precisely to make cosmetics desirable). Adding a `paid` acquisition path alongside `unlockReq`/`streakReq`/`comboReq` is an extension, not a system. Arena-visible cosmetics (victory banners on opponents' result screens, "Arena"-flagged backs — DESIGN_PLAN §7 M1) are the highest-value SKUs because they're *seen by other players*.

Honest numbers: cosmetic-only conversion in casual card games is ~0.5–2% of actives, ARPPU €3–10. At 100 actives that's 1–2 buyers. That's why the build trigger is a playerbase, not a date.

Rules that protect trust:
- **Earned pieces stay earned.** Never convert an existing unlock-gated piece to paid — the ladder players are climbing must not be pulled up. Paid pieces are *new* pieces, visually distinct-tier ("Forged" vs "Bought" is a bad frame; "Royal Commission" rack is a better one).
- **The best-looking piece in the game should still be earned, not bought.** Whales buy variety; the grail stays a flex.
- Price for the market: €1.99–3.99 per piece, one €6.99 bundle. DACH/Balkan casual players don't pay €10 for a card back.

Technical note (matters on this repo): Play Billing needs a native module (`react-native-iap` / `expo-iap`) → **`expo prebuild` → the signing config in `android/app/build.gradle` gets wiped and must be restored** (CLAUDE.md build rule). Schedule IAP integration as its own careful slice, never bundled with a release under time pressure. Google's cut is 15% (under $1M/yr).

### 1.2 Supporter sigil — the first euro (rank 2)

One-time IAP (€2.99), grants a permanent sigil on Profile + Hall of Glory row + Arena lobby (`PlayerRow` chips make this trivial once they exist — DESIGN_PLAN §7 M3). It monetizes *gratitude*, not gameplay, so it works even at small scale emotionally — the 6 current diehards are exactly who buys one — and it's the cheapest way to stand up the entire billing pipeline (store setup, receipt handling, restore-purchases) before the Armory catalog needs it. Earns pocket money forever; that's fine, that's not its job.

Do **not** use an external Ko-fi/PayPal link instead: Play policy prohibits steering to external payment for anything consumed in-app, and a sigil is in-app. Through Play Billing or not at all.

### 1.3 Rewarded ads — why "probably never" (rank 4)

The only placements that don't taint the prize competition are non-scoring ones: a second Ember Ward (streak repair — flagged in DESIGN_PLAN §6 as an owner call because it changes the product's feel), or cosmetic-progress boosts. Run-affecting rewards (extra Free Draw, retry, time) are disqualified by §0's constraint — full stop. What's left earns single-digit euros below ~500 DAU, costs an ad SDK in the binary (size, ANRs, consent dialogs, GDPR/TCF banner for EU), and deletes "no ads" from the listing. The identity is worth more than the ceiling. Revisit only if the game reaches thousands of DAU *and* cosmetic IAP has plateaued.

### 1.4 What "premium unlock" would get wrong

A paid unlock gating boards/modes shrinks the top of a funnel whose *entire current problem is the top of the funnel*, and splits the leaderboard into payers and non-payers (unfair fight for the prize). A **cosmetic** "Champion's Edition" bundle SKU is just IAP (fine, rank 3). A **content** paywall is a strategic error at every playerbase size this game will see in the next year.

---

## 2. When to monetize — the trigger ladder

| Playerbase (actives) | Action | Expected result |
|---|---|---|
| **6 → 100** (now) | **Build nothing monetization-related.** Every hour goes to §3. Sole exception: create the Play Console merchant account (paperwork has lead time, costs nothing). | €0, correctly. |
| **~100** | Ship the **supporter sigil** (billing pipeline slice + one SKU + chip). Announce as "keep the prize funded," which is the literal truth. | €10–40 total, a working pipeline, zero trust cost. |
| **~200–300** | First **paid Armory rack**: 4–6 new pieces, €1.99–3.99, at least 2 Arena-visible. Keep shipping earned pieces in the same update so the ladder grows both ways. | €10–50/mo. |
| **~500** | Seasonal/rotating cosmetics (monthly "Royal Commission" piece), bundle SKU. This is also the iOS revenue gate (§5). | €30–120/mo. |
| **~1,000–2,000** | Full catalog cadence; **prize break-even** becomes plausible. Only now is the rewarded-ads question even worth an evening of thought (answer's still probably no). | €100–250/mo. |

The anti-rule the ladder encodes: **don't ship a money ask to an empty room.** An IAP store with 6 potential customers earns €2 and tells every new player "this dev is squeezing already." The same store at 300 actives earns real money and reads as a healthy game.

---

## 3. Marketing without budget — the 4 levers, ranked

(Lounge channel excluded per owner. MARKET.md §3/§4/§6 remain the detailed playbooks; this is the prioritized, time-boxed subset a solo dev can actually run. All of it gates on v1.4 shipping first — never point strangers at the old version.)

### Lever 1 — Store listing refresh + DE/BS localization (one-time, ~4–6h, do first)
Every other lever ends at the Play Store page; it converts or wastes them. With the v1.4 release week: new landscape screenshots (war table mid-detonation, The Siege, The Eyrie, Hall of Glory shrine, Armory stage, an UNBROKEN banner), feature graphic derived from icon.png, short description leading with the stakes (*"Tri-peaks solitaire as a medieval war campaign. No ads. No pay-to-win. €100 in monthly prizes."*), then the **German store-listing localization** (app stays English) and BS/HR/SR after. This is the highest ROI-per-hour item in this file and it's done once.

### Lever 2 — Moment clips, 3×/week (2–3h/week, the sustained bet)
The formats, in order of expected performance (MARKET.md §3, sharpened):
1. **The banner-ladder climb** (15–25s vertical): a chain running 5→8→12→…→RAMPAGE/UNSTOPPABLE with freezes and detonations, raw game audio, caption *"x20 and the timer keeps freezing"* / *"x32 — MASTER OF PEAKS."*
2. **UNBROKEN CONQUEST**: one field, one chain, triple-ring detonation. Caption: *"the whole board in one unbroken chain."* This moment was built to be clipped — clip it.
3. **Race-the-shadow**: *"3,400 behind my best run at field 4"* → comeback or death. The only solitaire content on any platform with narrative stakes.
4. **Daily-quest "beat my deck"** (1×/week minimum): *"Same deck as every player today. 1.2M. Beat it before midnight."* The single format that gives a viewer a same-day reason to install.

One edit → TikTok + Reels + Shorts. Captions DE/EN. Hold the cadence 8 weeks before judging; weeks 1–7 will mostly do nothing and that's the deal. **Time-box it**: if a clip takes >30 min to produce, it's over-produced — raw gameplay with a good caption beats edits.

### Lever 3 — The honest-scarcity post (one-shot, 1–2h, high variance)
The 6-player fact is not a weakness to hide, it's the hook: **"My solitaire game gives away €100 every month. It has 6 players. Someone please come take my money."** As a TikTok clip and as posts to r/AndroidGaming + r/playmygame (feedback framing) — self-deprecating build-in-public content is the one genre where tiny numbers *are* the content. Fire it once, launch week, after the wipe (so arrivals land on a level board). Expect either nothing or the single biggest install day the game has had. Be ready for prize-hunters (terms page live first — §4).

### Lever 4 — Facebook groups: tri-peaks/solitaire + diaspora (2h one-time, light upkeep)
TriPeaks/solitaire fan groups are surprisingly large, older-skewing, and exactly the daily-quest-forever demographic; Bosnians-in-Vienna / ex-Yu gaming groups are the online mirror of the excluded venue channel — post in the group's language, lead with the €100. One post per group, answer every comment for 48h, never repost the same text. These groups likely outperform every subreddit for this specific game.

**Explicitly not doing** (unchanged from MARKET.md §10): paid ads, ASO agencies, influencers, Discord/subreddit, press, in-app localization, new modes for marketing's sake. Reddit's general rounds are already posted — don't re-post the same communities; Lever 3 is the only Reddit follow-up this month.

---

## 4. The €100 prize — from hollow to hook

**Current state, honestly:** at 6 players the prize framed as "compete for glory" is hollow — a stranger checking the leaderboard sees a ghost town and either smells a scam or wins by accident. But the same fact *inverted* is the best content hook the game has (Lever 3). So the prize runs in two modes:

**Mode A — now until ~50 actives: the honest-scarcity hook.** Don't promote it as a *competition*; promote it as an *opportunity* ("easiest €100 in mobile gaming, come take it"). This is self-aware, viral-shaped, and true. Requirements before firing: the **terms page** (10 lines: eligibility, payout method/date, contact, one-account rule, anti-cheat disqualification right — an hour of work, required by EU consumer expectations and Play contest policy, and the thing that separates "quirky indie prize" from "scam pattern"), and the **cheating answer decided in advance** — a modded APK or device-clock exploit topping a real-money board is a *when*, not an *if*; the `scoringV` stamp and per-mode boards help audit, and the terms page is what lets you disqualify without drama.

**Mode B — ~50–100+ actives: the real competition.** The threshold where it flips: when a top-3 finish requires sustained play from multiple real competitors — visibly a fight, not a giveaway. From then on, run the MARKET.md §5 ritual: **push hardest in the first week of each month** ("scores just reset, everyone starts from zero, €100 on the board" — pairs perfectly with the v1.4 `allTimeScores` wipe: launch month is a genuinely level field, say so loudly), and **announce every winner publicly with hero names** — a monthly winner clip is both proof-of-payout (believability) and a free recurring content format.

**Never:** pair the prize with any paid entry or any purchasable gameplay advantage — that's the line between a skill contest and a lottery under Austrian/EU law, and it's also §0's design constraint. The prize and the (future) IAP catalog must never touch.

**Budget honesty:** €100/month is the entire marketing budget and currently exceeds revenue by €100. Keep it — it's cheaper than any CPI campaign producing equivalent engagement — but the §2 ladder exists to eventually pay for it. Revisit the amount only when installs make it feel small.

---

## 5. iOS — matters, but not yet

**For growth:** medium. Austria is ~35–40% iOS, so Android-only halves the addressable local market — but the current bottleneck is *awareness*, not platform, and a second platform doubles build/test/release overhead (the finely-tuned Windows local-keystore pipeline doesn't carry over: iOS means EAS or a Mac, new signing, App Store review, $99/yr) without adding a single new reason to hear about the game.

**For revenue:** high, *later*. iOS users spend 2–3× on IAP. Which means iOS's ROI is mostly unlocked by the §2 cosmetic catalog existing — porting a €0-revenue game doubles costs and revenue stays €0.

**The gates (whichever comes first):**
1. Android proves the loop: **200+ actives with D1 > 35%** (Play Console cohorts) — then iOS multiplies something that works; or
2. **Cosmetic IAP is live and selling** (~500 actives per §2) — then iOS roughly doubles revenue for a one-time port cost.

**Verdict: not in the next 90 days.** When it happens, it's also the moment to re-fire the launch playbook ("now on iPhone" — new listing assets, one more round of posts).

---

## 6. The 30-day action plan

Assumes ~5–8 h/week of non-code time. The two v1.4 release gates (owner playtest of the 5 new/changed boards, `allTimeScores` wipe decision) are the only code-adjacent blockers — everything else here is marketing ops. If v1.4 slips a week, shift everything right; **do not run weeks 2–4 against the old build.**

**Week 1 — ship the asset (≈6–8h)**
1. Owner playtest → clear the board gates → ship v1.4 to production.
2. Execute the `allTimeScores` wipe (the "everyone starts from zero" story depends on it).
3. Store listing refresh: 6 new screenshots, feature graphic, stakes-first short description (Lever 1). Draft the DE listing translation.
4. Write + publish the prize **terms page**; link it from the listing and the Guide's prize slide.

**Week 2 — launch week (≈6h)**
5. Publish the DE store listing; BS/HR/SR if time allows.
6. Post the launch clip — best UNBROKEN or ×32 moment — to TikTok/Reels/Shorts (Lever 2 starts; 3 clips this week).
7. Fire **Lever 3**: the "€100/month, 6 players" post — r/AndroidGaming + r/playmygame + the TikTok version. Answer every comment for 48h.
8. Start the weekly 3-number note (installs, D1/D7, actives — MARKET.md §9, 15 min).

**Week 3 — cadence (≈4–5h)**
9. Hold 3 clips/week; include the first **"beat my deck"** daily-quest challenge (Lever 2 format 4).
10. Post to 3–4 Facebook groups: 2 tri-peaks/solitaire groups (EN), 1–2 diaspora groups (BS/HR/SR, €100-led) — Lever 4.
11. Create the Play Console **merchant account** (paperwork only; §2's one permitted monetization action at this size).
12. Weekly numbers note.

**Week 4 — first month close (≈4–5h)**
13. Hold the clip cadence; second "beat my deck."
14. **Month-end: pay and announce the first post-wipe prize winners** publicly with hero names — clip + post. This is the believability moment; never skip it.
15. Review the month against the note: did the listing refresh move conversion? Did Lever 3 spike installs, and did any of them stick (D1)? Kill the weakest clip format, double the strongest.
16. Set next month's single goal from the data. Default: **repeat the loop, aim for 50 actives** — that's Mode B's doorstep (§4) and halfway to the first monetization trigger (§2).

**What would change this plan:** a clip breaking 50k views (drop everything, post follow-ups while the algorithm is warm), a genuine install spike from Lever 3 (bring the month-start prize push forward), or actives crossing ~100 (start the supporter-sigil slice). Otherwise: run the loop, monetize nothing, measure weekly, and let the §2 ladder tell you when the first euro is worth asking for.
