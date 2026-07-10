# CN client — in-game regex capability probe

> **RESULT (2026-07): all 10 tests pass.** The CN client runs a full regex engine
> (`|`, `()`, `!`, `^`, `$`, `.`, `*`, `[0-9]`, spaces, Chinese literals all work).
> `FeatureProfile` in `scripts/lib/regex_opt.py` now enables everything.


We need to know exactly which regex features the **国服 (WeGame) PoE2** in-game
search box supports. This determines how the generator builds snippets. Please
paste each string below into an in-game search (waystone stash tab, or the map
device's waystone list is ideal) and note whether it behaves as described.

**Already confirmed working** (from your examples): literal Chinese text, literal
spaces, and the `[0-9]` character class — e.g. `生成 [0-9] 个额外的稀有怪物` matched.

For each row: report ✅ works / ❌ doesn't. The **`|` (OR)** test is the most
important — the whole multi-select feature depends on it.

| # | Paste this | Should match… | Tests |
|---|---|---|---|
| 1 | `混沌` | waystones whose mod is “额外混沌伤害” | literal (baseline) |
| 2 | `火焰\|混沌` | waystones with **either** the fire **or** chaos extra-damage mod | **`\|` alternation ← critical** |
| 3 | `(火焰\|混沌)` | same set as #2 | grouping `()` |
| 4 | `"混沌"` | same as #1 | quoted term |
| 5 | `"!混沌"` | waystones **without** the chaos mod | negation `!` |
| 6 | `伤害$` | lines **ending** in “伤害” (many extra-damage mods) | `$` end-anchor |
| 7 | `^怪物` | lines **starting** with “怪物” | `^` start-anchor |
| 8 | `"火焰" "混沌"` | waystones that have **both** mods (likely none) | space = AND |
| 9 | `火焰.*抗性` | a line with 火焰 then later 抗性 | `.` and `*` |
| 10 | `火\|冰` | fire **or** cold mods (1-char alternらtion halves) | `\|` with 1-char parts |

## What each outcome changes

- **#2 `\|` works** → multi-select ships as-is (current default). If it **fails**,
  we fall back to separate space-separated terms and lose true OR within a group.
- **#5 `!` works** → the “unwanted mods” feature is valid.
- **#6/#7 anchors work** → we can enable anchors in the optimizer to make some
  snippets shorter/safer (e.g. `伤害$` instead of a mid-line 2-char run).
- **#3 groups work** → lets us nest alternations for compact combined regexes.
- **#9 `.`/`*` work** → enables value-threshold patterns (e.g. “≥ N% of a stat”).

## Vendor fragments to verify (round 2)

The vendor tool's mod filters (resistances, attributes, damage, speeds, life/ES,
movement, quality, item level) use unambiguous CN stat words and are safe. These
depend on the exact in-game info-panel text and need a spot check — paste each
into a vendor/stash search and confirm it selects the intended items:

| Fragment | Should match | If it fails, likely correct form |
|---|---|---|
| `普通` | Normal-rarity items | rarity may not render as a searchable word |
| `魔法` | Magic items | — |
| `稀有` | Rare items | note `稀有` is a prefix of `稀有度` (the label) — may over-match |
| `物品等级` | any item (shows item level) | `物品等级 N` confirmed in ClientStrings |
| `戒指` `项链` `匕首` … | that item class | base names may not contain the class word; may need per-base derivation |

If `稀有`/rarity words over-match (they appear in the label line too), we switch to
matching the value after the colon (e.g. anchor or `度[:：]\\s*稀有`). If item-class
words don't appear in base names, we derive each class fragment from the CN base
names in `Generated.Basetypes.Item.json` instead.

## Notes

- If a feature “matches nothing” when it clearly should, that feature is
  unsupported (the box likely treated it as literal text).
- The CN client renders numbers inline (e.g. `额外 12% 混沌`), so number-free
  snippets like `混沌` are safest; that’s what the generator prefers.
- Record results back here; the generator’s `FeatureProfile`
  (`scripts/lib/regex_opt.py`) will be set to match.
