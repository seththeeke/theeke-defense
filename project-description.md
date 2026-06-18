# Build Prompt: "Home Defense" — A Personalized Tower Defense Game

## Project Overview

Build a browser-based tower defense game using **Phaser.js**. The game is themed around the real life of a married couple (Seth and Lexie) and their two dogs (Noli, a Golden Retriever, and Mikey, a small black Bichon). Enemies are funny, escalating household/life chaos. Towers are real people in their life. The tone throughout should be comedic and personal — this is a love letter to their actual life, not a generic TD game.

This is a **personal project, client-side only**. No backend, no database, no user accounts. All game data (enemies, towers, heroes, wave composition) is driven by a JSON configuration object, loaded at runtime, so the game's balance can be tuned without touching game logic code.

Build with **vanilla JS/TS + Phaser.js**. No React/Vue needed for the core game. A separate lightweight admin/config tool (plain HTML/JS is fine) is also part of this build — see the dedicated section below.

---

## Core Game Loop

1. Player lands on a setup screen and selects:
   - **One hero** (Seth, Lexie, Noli, or Mikey) — locked for the whole session
   - **One track** (of 5 available)
   - **One difficulty** (Easy / Medium / Hard / Impossible)
2. Player places towers on the track using earned cash, the chosen hero is placed automatically as a fixed defensive unit, and rounds begin.
3. Each round spawns a wave of enemies that walk along the track's path. Towers and the hero auto-attack enemies in range. Hero abilities are manually triggered by the player when off cooldown.
4. Defeating enemies earns cash. Enemies that reach the end of the track cost the player lives.
5. Player wins by surviving the total number of rounds for their chosen difficulty. Player loses if lives reach 0.

---

## Difficulty & Rounds

Difficulty **only** controls how many total rounds must be survived to win. It does **not** change enemy stats, scaling rate, or anything else. The exact same round-by-round enemy stat curve applies regardless of difficulty — Round 40 enemies are identical whether you're finishing on Easy or passing through on the way to Impossible.

| Difficulty | Total Rounds |
|---|---|
| Easy | 40 |
| Medium | 60 |
| Hard | 80 |
| Impossible | 120 |

Round-to-round difficulty scaling (how much tougher enemies get as rounds increase) is a **hardcoded global formula** in game logic — NOT exposed in the admin/config tool. A simple approach: each enemy's effective Speed and Health are multiplied by a curve based on round number (e.g., `baseStat * (1 + roundNumber * scalingFactor)`), applied identically to every enemy type, including bosses. This is also what makes recurring bosses naturally tougher each time they reappear later in the run — no special-case logic needed.

---

## Heroes

Exactly one hero is selected before the game starts and remains fixed in a dedicated hero slot (it does not move, but unlike towers it takes up a 4-block footprint — see Tower Placement section). Each hero auto-attacks like a tower, with a unique stat profile, plus 1–2 manually-triggered abilities on cooldown.

### Seth
- Slow attack speed, strong attack power.
- **Ability — "Focus":** Targets and hits the single strongest enemy currently on the track for massive damage. Cooldown-based.

### Lexie
- Fast attack speed, weak attack power.
- **Ability — "Sunshine Spin":** Spins and throws flowers across the *entire* track, damaging every enemy currently on screen. Cooldown-based, full-map AoE, no targeting needed.

### Noli (Golden Retriever)
- Strong attack power, fast attack speed, but **bad accuracy** (some attacks should have a chance to miss) and **occasionally gets distracted** (briefly pauses attacking at random intervals).
- **Ability 1 — "Relocate":** Moves Noli to another open hero slot/location on the track. Range is infinite — there should be no targeting/distance restriction on where Noli can relocate to. Cooldown-based.
- **Ability 2 — "Zoomies":** Fires at a greatly increased attack speed for a fixed duration (e.g. 5 seconds). Cooldown + duration based.

### Mikey (small black Bichon)
- Weak attack power, but **persistent** (never misses, never gets distracted — fires reliably every cycle).
- **Passive:** Buffs nearby towers (Buff Power stat — boosts an attribute, e.g. attack speed or power, of towers within range).
- **Ability — "Toxic Breath":** All enemies hit during the ability are slowed (Speed reduced by a percentage) for a fixed duration (e.g. 10 seconds). Cooldown + duration + effect-magnitude based.

---

## Towers

Seven towers, each named after a real person, each with a distinct combat role. **No upgrade tiers** — each tower has one fixed stat block (tunable via the admin tool, but no in-game leveling).

| Tower | Visual/Flavor | Stats |
|---|---|---|
| **Will** | Throws insults | Slow fire rate, small damage. On-hit, slows the target enemy's Speed by a percentage for a duration. |
| **Danielle** | Shoots Amazon logos | Medium fire rate, medium power. Basic all-rounder. Receives a buff (magnitude driven by Will's Buff Power stat) whenever a Will tower is in range — this is the one fixed tower synergy in the game. |
| **Trevor** | A meatball that throws meatballs | Small range, high power, slow fire rate. |
| **Alex** | — | Small range, medium power. Fire rate scales up the more enemies are currently alive on the track (more chaos on screen = Alex fires faster, up to a reasonable cap). |
| **Julie** | Throws something cybersecurity-themed | Giant range, very low power, but deals bonus damage specifically against boss-type enemies. |
| **Liam** | Kicks soccer balls | Very fast fire rate, medium power, medium range. Basic all-rounder. |
| **Haillee** | Throws kindness | Very slow fire rate, medium power, but fires 3 projectiles at once (multi-shot). |

There is **no track-specific performance bonus/penalty** for any tower or hero. Tracks differ only in layout, not in modifying unit stats.

---

## Tower & Hero Placement (Block System)

The track/buildable area is divided into a grid of placement blocks. Different units take up different numbers of contiguous blocks:

- **Female-named towers (Danielle, Julie, Haillee): 1 block**
- **Male-named towers (Will, Trevor, Alex, Liam): 2 blocks**
- **Heroes (Seth, Lexie, Noli, Mikey): 4 blocks**

Placement should validate that enough contiguous open blocks exist before allowing a tower/hero to be placed. Towers can be sold (refunded per their configured Sell Value) to free up blocks.

---

## Tracks

Five selectable tracks. They differ in path shape and how much open space is available for placing towers — nothing else (no stat modifiers).

1. **The Amazon Office** — Easy/basic layout. Single lane with a couple of turns, nothing complex.
2. **Broadway (Nashville)** — A straight line with very limited space to place towers (tight, high-pressure layout).
3. **Dog Park** — Very open layout with lots of room to place towers.
4. **The White House** — Hard layout. Enemies can enter from **two separate entrances/exits**, with medium tower-placement availability.
5. **Theeke House** — Standard layout (visual flavor: a bit of a mess underfoot). Every 10 rounds, a special mini-boss enemy, **"The In-Laws,"** enters the track. Because it uses the same global round-scaling curve as everything else, it's automatically tougher each later appearance — no special-case scaling needed.

---

## Enemies

23 total enemy types: 19 regular enemies, 3 rotating global bosses, and 1 track-exclusive mini-boss. Every enemy has, at minimum: **Speed**, **Health**, **Cash Reward** (earned on kill), and **Lives Cost** (lives lost if it reaches the end — default 1 for all unless otherwise tuned). All of these are tunable per-enemy in the admin tool. Visual/flavor descriptions are for art direction only (placeholder shapes for now, see Art/Assets section).

### Regular Enemies (19)
1. Bills to Pay
2. Groceries
3. Getting Water/Drinks for Lexie — **hero-conditional: only appears in the wave pool when Seth is the active hero**
4. Dog Peed in the House
5. Dog Pooped in the House
6. Sexy Time with Seth — **hero-conditional: only appears in the wave pool when Lexie is the active hero**
7. Work Anxiety
8. Laundry Pile
9. Dishes
10. Home Project
11. Diet Starts Monday
12. Gym Day
13. $120 Nails
14. Car Maintenance
15. Dogs Need Let Out
16. Work Happy Hour
17. Dog Bath
18. Car Wash
19. Filling Gas Tank

### Rotating Global Bosses (3)
Appear on **every track** every 20 rounds (i.e. rounds 20, 40, 60, 80, 100, 120), cycling through in order below. They reuse the same global scaling curve as regular enemies, so later appearances are automatically stronger.
20. Wedding Invite
21. Hangover
22. Performance Improvement Plan

### Track-Exclusive Mini-Boss (1)
23. The In-Laws — **Theeke House only**, appears every 10 rounds, scales via the same global curve (so later appearances are automatically tougher).

---

## Hero/Tower Special Effects

Some units apply temporary debuffs to enemies rather than (or in addition to) raw damage. These should be modeled as a direct modification to the enemy's effective Speed stat for a duration — no chain/splash/multi-target propagation mechanics needed, keep it simple:

- **Will:** On hit, reduces target enemy's Speed by a configurable percentage (Effect Magnitude) for a configurable duration (Effect Duration).
- **Mikey ("Toxic Breath"):** Reduces Speed of all enemies hit during the ability by a configurable percentage for a configurable duration.

Any tower/hero with such an effect should expose **Effect Magnitude** and **Effect Duration** as tunable fields. Units without a special effect simply omit/ignore these fields.

---

## Economy

- **Currency:** Cash. Earned per enemy defeated (amount = that enemy's configured Cash Reward) plus a bonus awarded for completing each round.
- **Costs:** Each tower has a configurable **Buy Cost** and **Sell Value** (sell value should generally be less than buy cost, but this is just a default — the admin tool should allow any values). Heroes are selected pre-game and are not purchased, so heroes have no Buy Cost or Sell Value.
- **No upgrade system.** Towers and heroes have a single fixed stat block each — there is no in-game leveling/upgrading.

---

## Lives

Classic lives system. Starting lives can be a reasonable default (e.g. 20) — flag this clearly as an adjustable constant in code. Each enemy that reaches the end of the track deducts its configured Lives Cost (default 1) from the player's total. Reaching 0 lives ends the game in a loss, regardless of round or difficulty.

---

## Admin / Config Tool

A separate, hidden page (e.g. `/admin`, not linked from normal game navigation) for live-tuning game balance without touching code. **No database** — this tool reads/writes a JSON config structure using `localStorage` for live testing, and supports exporting that config to a downloadable `.json` file to be committed into the codebase as the new default.

### Behavior
- On load, the admin tool reads the current config: check `localStorage` for a saved override first; if none exists, fall back to the bundled default config JSON.
- Editing any field and clicking **Save** writes the full updated config to `localStorage` immediately. The running game should also check `localStorage` first (same precedence), so changes take effect on next page load/restart of the game **without requiring a rebuild** — this is the core iteration loop.
- An **Export to JSON** button downloads the current config (whatever's currently active — edited or default) as a `.json` file matching the exact schema the game's config loader expects, ready to drop into the codebase as the new bundled default.
- Include a **Reset to Defaults** button (clears the `localStorage` override, reverts to bundled default) and an **Import JSON** button (load a `.json` file into the form for further editing).

### Editable Fields

**Per Enemy:**
- Speed
- Health
- Cash Reward
- Lives Cost (on leak)

**Per Tower** (no upgrade tiers, single stat block):
- Attack Speed
- Range
- Attack Power
- Buff Power (only shown/relevant for towers with a buff effect — currently just Will)
- Effect Magnitude (only shown/relevant for towers with a debuff effect — currently just Will)
- Effect Duration (same condition as above)
- Buy Cost
- Sell Value

**Per Hero:** Same fields as towers (Attack Speed, Range, Attack Power, Buff Power if applicable, Effect Magnitude if applicable, Effect Duration if applicable) — but **no Buy Cost/Sell Value** (heroes aren't purchased) — **plus**:
- Ability Cooldown (one per ability — Noli has 2 abilities and needs 2 sets of fields, others have 1)
- Ability Duration (one per ability, where applicable — instant-effect abilities like Seth's Focus or Noli's Relocate don't need a duration field, but duration-based ones like Zoomies and Toxic Breath do)

**Wave Composition (separate section/tab):**
- A per-round configuration of which enemy types spawn and how many of each, for all 120 rounds (so it covers the longest difficulty; lower difficulties just use a prefix of this table).
- Should support: a sensible auto-generated default (e.g., introduce enemy types progressively across early rounds, increase counts as rounds progress, insert global bosses at rounds 20/40/60/80/100/120, insert The In-Laws on Theeke House at rounds 10/20/30.../120) AND manual per-round overrides editable in the same UI.
- A reasonable UI here is a scrollable table: rows = rounds 1–120, each row editable to add/remove `{enemyType, count}` entries.

This admin tool's config schema should be the **single source of truth** that both the game and the admin tool read from — design the JSON shape first, then build both the game's config loader and the admin tool against that same shape.

---

## Art & Assets

Use simple placeholder visuals for now (colored geometric shapes or basic icons with text labels are fine) — but architect this so it's trivial to swap in custom GenAI-generated artwork later. Recommended approach: a single central asset-key-to-image-path registry/manifest (e.g. a `assets.js`/`assets.json` mapping each hero/tower/enemy ID to an image path), so dropping in real images later is just a matter of replacing files and updating paths in one place — no changes needed to game logic or rendering code.

---

## Suggested Tech/File Structure

This is a suggestion, not a strict requirement — use your judgment for what's cleanest in Phaser:

```
/src
  /config
    defaultConfig.json       // enemies, towers, heroes, wave composition — the single source of truth schema
    configLoader.js          // checks localStorage override, falls back to defaultConfig.json
  /game
    scenes/                  // Phaser scenes: SetupScene, GameScene, etc.
    entities/                // Tower, Hero, Enemy classes/logic
    systems/                 // wave spawning, economy, lives, round scaling curve
  /assets
    placeholder/             // placeholder sprites
  /admin
    index.html                // standalone admin tool page
    admin.js                  // reads/writes localStorage, export/import JSON
```

---

## Suggested Build Order

1. Core Phaser scaffold: setup screen (hero/track/difficulty selection) → game scene with a static track and placeholder hero/tower placement.
2. Wave spawning + enemy movement along the track path, using a hardcoded/temporary config.
3. Tower/hero attack logic, projectiles, damage, the global round-scaling formula.
4. Economy (cash, costs, sell), lives, win/loss conditions, HUD.
5. Hero abilities (cooldowns, the 5 unique abilities described above).
6. Special effects (Will's slow, Mikey's Toxic Breath, Danielle/Will synergy, Alex's dynamic fire rate, Julie's boss bonus).
7. Finalize the JSON config schema, wire the game to load from it instead of hardcoded values.
8. Build the admin tool against that same schema (stat editing first, then wave composition editor, then export/import/reset).
9. Polish: placeholder-to-real-art swap path, basic SFX/UI polish, pause/speed-up controls.

---

## Open Defaults to Flag in Code (Adjust as Needed)

These weren't specified and should use sensible defaults, clearly commented/constants so they're easy to find and change:
- Starting cash amount
- Starting lives count (suggested: 20)
- Global round-scaling formula's exact growth rate
- Default wave composition's exact pacing (which enemies unlock at which rounds, before manual admin overrides)