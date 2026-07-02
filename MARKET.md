# Mythic Peaks — MARKET.md

*Written 2026-07-02, alongside the v1.4 layout/design work. A practical answer to one question: **what are the easiest and most effective ways to get more players?** Honest version — calibrated to where the game actually is, not where a marketing template assumes it is.*

---

## 0. Where you actually are

- **~6 active players.** Bekac (186 games), hd21 (56), Bily (23), L E M O N (18), jimmy (9), Kenan (1). The people who get past game ~5 go deep — the loop retains. The two leaks are the **first session** (largely fixed in v1.4: coach marks, First Victory, clear-hold moments) and **distribution** — the game is good and invisible.
- **Zero monetization.** Every install earns €0. The €100/month prize means the game *costs* money. This one fact decides several answers below: paid ads are pure burn until there's either revenue or a retention number worth proving, and everything free-but-slow (venues, content, ASO) is automatically the right strategy.
- **One unfair advantage nobody else has:** a real physical venue network (the Hookah Lounge system) in a market (Vienna / DACH–Balkan diaspora) where the competition is generic solitaire apps with zero local presence.
- **v1.4 is the marketing asset.** The redesign, the 7 battlefields, the moments (UNBROKEN, banners, the shadow) — this is what the store listing, the clips, and the venue pitch are made of. Nothing below should ship publicly before v1.4 does.

**The strategy in one sentence:** win the rooms you can physically reach (lounges), make the game shareable at the moment it's exciting (already shipped), make the store listing convert the trickle those two produce, and only then think about scale.

---

## 1. Priority: impact × effort at this size

| # | Lever | Impact | Effort | When |
|---|---|---|---|---|
| 1 | **Lounge venue activation** (§2) | Very high — the only lever that reliably produces *groups* of players | Low-med, mostly non-code | With v1.4 |
| 2 | **Store listing refresh + DE/BS localization** (§4) | High — converts every other lever; localized listings are cheap reach in the seed market | Low | With v1.4, same week |
| 3 | **Short-form clips** (§3) | Medium-high, high variance — one hit outperforms everything | Medium, ongoing | Start with v1.4, sustain |
| 4 | **€100 prize, promoted properly** (§5) | High *within* the channels above (it's the hook, not a channel) | Low | Month-start after v1.4 |
| 5 | **Community/forum posting** (§6) | Medium, one-shot spikes | Low | v1.4 launch week |
| 6 | **Friend-pull features** (share ✅, async duels + deep links — DESIGN_PLAN §7/§10) | High long-term — the only self-multiplying loop | Med-high (code) | Next code phase |
| 7 | **iOS** (§7) | Medium — doubles the addressable venue audience but splits focus | High | Gate on venue traction |
| 8 | **Paid ads** (§8) | Near zero today | Money | Not until §8's gates pass |

Everything else (press, influencer outreach, Discord servers, cross-promo networks) is noise at 6 actives. Revisit at 500+.

---

## 2. The lounge channel — your actual moat

The Hookah Lounge system is a built-in local-acquisition machine that is currently invisible (DESIGN_PLAN §10 A-4). A hookah lounge is the perfect habitat for this game: people sit for 1–2 hours, phones out, in groups, mildly competitive, returning weekly. No solitaire app on the store can follow you into that room.

**The playbook per venue (VIENNA first, then replicate):**

1. **Table cards + one poster.** QR → Play Store listing, venue code printed big ("Enter code VIENNA"), one line of stakes: *"Weekly tournament in this lounge · Top warrior wins [venue prize] · €100 monthly on the global board."* Print cost ~€20. This is the single highest-ROI artifact in this document.
2. **The weekly ritual.** Every week the venue leaderboard resets — make the *result* visible: a small framed "Champion of the Week" card at the bar with the winner's hero name, and a story post from the venue's Instagram (lounges post constantly; give them a ready-made image). The ritual is what turns "an app someone showed me" into "the thing we do here."
3. **Venue prize, venue-funded.** The lounge puts up something that costs them near nothing (a free shisha / a round of tea for the weekly winner). They get: a reason customers return on slow nights and stay longer. You get: a recurring tournament you don't pay for. This is the pitch to the owner — it's a loyalty program they don't have to build.
4. **Arena nights (monthly, optional).** One evening, bracket on a phone/tablet passed around or a 4-digit room code on the poster: same seeded deck, live scoreboard, winner gets the venue prize. The Arena mode was built for exactly this room.
5. **Expansion list.** Balkan cafés/lounges in Vienna first (the diaspora network travels by word of mouth), then Graz/Linz, then the same template in any city where a friend can walk into a venue. Each venue = a code, a poster, a weekly winner. **Target: 3 venues by end of summer.** Ten venues at even 15 weekly players each beats every online channel available to you combined.

**Code assist (small, later):** a generated "venue kit" (QR + code + poster PDF per lounge) and a more prominent "Playing at a lounge? Enter your code" prompt for fresh installs. Neither blocks starting — a Canva poster works today.

**Honest caveat:** this channel produces tens-per-venue, not thousands. That is exactly the right order of magnitude for the next 6 months, and these players arrive pre-socialized (they know other players — retention and Arena liquidity come free).

---

## 3. Content strategy — what to post, where, how often

You're already making social content; this section is about aiming it. At zero followers, content works through **platform discovery feeds** (TikTok/Reels/Shorts push small accounts if the clip holds attention), not through an audience you don't have yet.

**What to post (in order of expected performance):**

1. **The moment clips (15–25s, vertical, no talking needed).** The game now produces genuinely clippable moments — they were built for this: a chain climbing the banner ladder into **RAMPAGE/UNSTOPPABLE** with the freeze-and-detonation, an **UNBROKEN CONQUEST** (triple-ring detonation + fanfare), an all-time record with the count-up. Format: raw gameplay, captions like *"one unbroken chain, 28 cards"* / *"x32 — MASTER OF PEAKS"*, loud game audio (the fanfares carry). Post the same clip to TikTok, Reels, and Shorts — one edit, three platforms.
2. **The race-the-shadow narrative.** *"My best run haunts me — 3,400 behind at field 4"* → comeback or death. The ghost system is a built-in story arc; nobody else's solitaire content has stakes.
3. **The daily quest challenge.** *"Same deck as every player today. This is what I did with it — beat it before midnight."* Post your score, pin the comment. This is the only format that converts a viewer into a *same-day* install with a reason.
4. **Lounge content.** The weekly winner, the arena-night table, the poster on the wall. Grounds the game in a real place — algorithmically weaker, trust-wise stronger, and the venues reshare it.
5. **Dev-story clips (occasional).** "I'm building a medieval solitaire; my playtesters are a hookah lounge in Vienna" is a genuinely good hook — build-in-public content performs on TikTok and r/gamedev alike. Use sparingly; it recruits well-wishers more than players.

**Where:** TikTok + Instagram Reels + YouTube Shorts (same clip). German-market TikTok is the sweet spot: the seed audience is there and German-language gaming TikTok is far less saturated than English. Captions bilingual DE/EN; for lounge clips, Bosnian/Croatian/Serbian — diaspora content travels unusually well on Balkan TikTok.
**How often:** a realistic floor you can hold — **3 clips/week**, every week, for 8+ weeks before judging. One clip that hits (50k+ views) will visibly move installs; weeks 1–7 mostly won't. That's the deal with short-form; consistency is the entire game.
**What NOT to do:** don't make trailer-style edits (they read as ads and die), don't post menu/UI tours (nobody cares yet — ironic, given the work, but the *moments* sell, not the screens), don't start a Discord/subreddit at this size (an empty room is worse than none).

---

## 4. Store listing — the conversion layer (with v1.4)

Every lever above ends at the Play Store page; right now that page undersells the game badly (pre-redesign screenshots). Do this the week v1.4 ships (DESIGN_PLAN §10 A-3):

- **Screenshots:** the war table mid-detonation, The Siege / The Mythic Peaks boards, the Hall of Glory shrine, the Armory stage, an UNBROKEN banner. Landscape screenshots with one short overlay line each (device frames optional; the shots must show the *game*, not slogans).
- **Feature graphic:** derived from icon.png art — it's the best asset the product has and the store page is its highest-leverage placement.
- **Short description leads with the stakes:** *"Tri-peaks solitaire as a medieval war campaign. €100 in monthly prizes. Real venues, real duels."*
- **Localize the listing: German first, then Bosnian/Croatian/Serbian.** Localized store listings in a home market are the cheapest distribution multiplier that exists — the seed market is DACH/Balkan and localized search results convert disproportionately. (App stays English; this is store-listing text only. In-app DE/BS localization is a later, bigger call.)
- **ASO keywords to cover** across title/short/long: *tri peaks solitaire, solitaire, kartenspiel, solitär, card game, tournament, duel.* Don't stuff — cover each once, naturally.
- **Version-note hygiene:** "7 battlefields · new boards · smoother than ever" — release notes are indexed and read more than expected.

The €100 prize belongs in the first line of the listing AND on the first screenshot. It is the single most differentiating fact about the game; a browsing stranger should not be able to miss it.

---

## 5. The €100 prize — how and when to use it

The prize (€50/€30/€20 monthly, already in the Guide) is your hook, not your channel — it makes every other lever convert better. Handling:

- **Timing: promote hardest in the first week of each month** — "scores just reset, everyone starts from zero, €100 on the board" is the fairest and most compelling moment. A mid-month newcomer facing an unbeatable leader is the anti-pitch (this pairs with the `allTimeScores` wipe at v1.4: launch month = genuinely level field, say so loudly).
- **Announce winners publicly, every month, with hero names** (a clip + a lounge post). Paying out visibly is what makes the prize *believable* — an unverifiable prize reads as a scam pattern.
- **Write 10 lines of terms** on a public page (who's eligible, when it pays, how winners are contacted, per-account limits, your right to disqualify cheaters) and link it from the listing + Guide slide. EU consumer expectations + Play's contest policies both want this, and it costs an hour. Also decide the cheating answer *before* it matters (a device-time exploit or a modded APK topping the board mid-month is a when, not an if — the `scoringV` stamp and per-mode leaderboards help audit).
- **Sustainability:** €100/month is a real marketing budget — and it's currently the *entire* budget. That's fine and honest at this stage: it's cheaper than any CPI campaign that could produce the same engagement. Revisit only when installs make the prize pool feel small, which is a good problem.
- **Never** gate the prize behind anything that costs money in-app if monetization arrives later — that converts a competition into a lottery, which is a different legal animal in Austria/EU.

---

## 6. Community posting — launch-week spikes (v1.4 week)

One honest post each, timed to the v1.4 release, written as a maker, showing (not describing) the game — a 30–60s moment clip embedded in each:

- **r/solitaire + r/CardGames** — the actual audience; lead with what's mechanically different (banner ladder, the ghost, UNBROKEN). These communities are small but exactly right.
- **r/AndroidGaming, r/playmygame, r/DestroyMyGame** — feedback framing outperforms promo framing; r/DestroyMyGame in particular produces both attention and useful criticism.
- **r/gamedev / r/IndieDev (dev-story angle)** — "solitaire, but my tournament venue is a hookah lounge" is a good post title. Recruits watchers more than players; still worth one post.
- **Balkan + Austrian community groups (Facebook is where the diaspora actually is):** Bosnians-in-Vienna / ex-Yu gaming groups — post in the language of the group, lead with the €100 and the VIENNA venue. This is the online mirror of the lounge channel and probably outperforms every subreddit above.
- **TriPeaks/solitaire fan groups on Facebook** — surprisingly large, older-skewing, exactly the demographic that plays daily quests forever.

Rules: one post per community, answer every comment for 48h, never post the same text twice, and don't astroturf reviews — at this scale a single "the dev replied to me" thread is worth more than 50 drive-by upvotes.

---

## 7. iOS — when

**Not yet.** Reasons, honestly: it splits build/test time across two native worlds (the Windows/local-keystore Android pipeline is finely tuned; iOS means EAS or a Mac, new signing, new review process), costs $99/year + setup days, and the current bottleneck is *awareness in a market you reach physically* — a second platform doesn't fix that.

**The gates that flip the answer:** (a) a lounge/venue asks because a meaningful share of their regulars are on iPhone (in Austria that's realistic — iOS is ~35–40% there), or (b) Android proves the loop: D1 retention consistently >35% and 200+ actives, so a port multiplies something that works. When it happens, iOS is also the moment to re-shoot the store assets and re-run the §6 posts ("now on iPhone").

---

## 8. Paid ads — when (mostly: not)

**Do not spend on ads now.** With zero monetization, every paid install is bought with nothing to earn it back, and at 6 actives you can't even measure whether bought users retain (n too small). Paid UA for a free game with no revenue is how hobby budgets die.

**The gates, in order, before the first euro:**
1. Organic proof: D1 > 35%, D7 > 15% on ≥100 organic installs (Play Console cohorts — free data you'll have after §2–§6 work).
2. Store page converts: listing conversion > ~25% on the Play "store listing acquisition" report.
3. Either monetization exists (Arena cosmetics — DESIGN_PLAN §7 M1–M3 — are the designed path) **or** you explicitly decide ads are a paid experiment with a fixed cap and a learning goal, not growth.

**When the gates pass:** Google App Campaigns, AT/DE/CH + BA/HR/RS geo, €5–10/day for 3–4 weeks, one goal (installs), judge by whether *bought* cohorts match organic retention. Expect €0.30–1.00 CPI in these geos for casual cards. Anything else (TikTok Ads, Meta) needs creative volume you don't have spare capacity for.

---

## 9. Measure just enough

Fifteen minutes weekly, same three numbers, written down (a note is fine):
1. **Installs** (Play Console) — split by acquisition source when volume allows; watch the v1.4 listing refresh move (or not move) conversion.
2. **D1/D7 retention** (Play Console cohorts) — this is the number that gates iOS and ads, and validates the first-session work.
3. **Actives + streaks + venue boards** (Firestore, you already eyeball this) — venue-code adoption tells you if §2 is working within two weeks of a poster going up.

If a week's numbers don't change any decision, that's fine — the discipline is so that when a clip hits or a venue activates, you *know*, instead of guessing.

---

## 10. What NOT to do (at this size)

- Don't pay for installs (§8), don't pay "ASO agencies," don't pay influencers — the only influencer worth anything at this scale is a lounge owner with an Instagram.
- Don't start official community spaces (Discord/subreddit) before ~500 actives; empty rooms signal death.
- Don't do press outreach; solitaire is not press-able, and a wasted week is a real cost when the team is one person.
- Don't localize the *app* yet (store listing only) — string extraction across every screen is a big refactor with better-sequenced value later.
- Don't chase a second game mode / battle pass / meta systems for marketing reasons — the game just got *deeper* (7 boards); marketing's job is to show it, not demand more of it.
- Don't ship any of this before v1.4 — every lever points strangers at the product; point them at the good version.

---

## 11. The first two weeks (concrete)

**Week 0 — with the v1.4 release:**
1. Wipe `allTimeScores` (release gate) → "everyone starts from zero" is the launch story.
2. Store listing refresh: new screenshots, feature graphic, €100-first short description, DE localization drafted.
3. Print + hang the VIENNA poster and table cards; agree the weekly venue prize with the owner; take a photo of the poster (that's a clip).
4. Post the launch clip (best UNBROKEN or ×32 moment) to TikTok/Reels/Shorts; publish the §6 posts over 4–5 days, not all at once.

**Weeks 1–2:**
5. Hold the 3-clips/week cadence; the daily-quest "beat my deck" format at least once a week.
6. First "Champion of the Week" ritual at the lounge — photo, story post, repeat forever.
7. Write the prize terms page; add the link to the listing.
8. Start the weekly 3-number note (§9). Pitch lounge #2 with the VIENNA leaderboard as proof.

Everything in this file compounds: venues create players who create leaderboard drama that creates clips that create installs that the listing converts — and the prize is the reason any stranger cares on day one. Run the loop for a season before judging it.
