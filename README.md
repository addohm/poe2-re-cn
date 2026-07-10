# poe2-re-cn — Chinese-client mirror of poe2.re

**Live: https://addohm.github.io/poe2-re-cn/**

An unofficial mirror of [poe2.re](https://poe2.re/) (a Path of Exile 2 in-game
**regex generator**) that works on the **国服 (WeGame/Tencent) client**, whose
in-game text is Simplified Chinese. All credit for the original tool and its UX
goes to the poe2.re author; this project only re-targets it to the CN client. poe2.re's regex snippets match **English** item text,
so they don't work on the CN client. This project:

1. **Translates** every mod string to Chinese, using the datamined
   [`poe2-en-cn-dict`](../poe2-en-cn-dict) dictionary (single source of truth).
2. **Recomputes** each mod's regex snippet as a *shortest distinguishing Chinese
   substring* against the CN text.
3. Serves it from a **rebuilt Vite/React app** whose UI toggles **EN⇄CN**, while
   the generated regex is always built from the **Chinese** client text.

## Status

All five tools are built and working end-to-end:

| Tool | State |
|---|---|
| Waystone (`/waystone`) | ✅ 32 mods · 100% translated · 100% distinguishing |
| Tablet (`/tablet`) | ✅ 81 affixes · 100% translated · 97.5% distinguishing (rest are true duplicates) |
| Relic (`/relic`) | ✅ 36 mods · 100% translated (1 dict-override) · 100% distinguishing |
| Item (`/item`) | ✅ 45 basetypes · 2463 mods · 98.7% usable · 14 whole-line fallbacks |
| Vendor (`/vendor`) | ✅ 7 groups · 43 options (mod filters solid; rarity/class flagged for in-game check) |

CN client confirmed to support a full regex engine (`|`, `()`, `!`, `^`, `$`, `[0-9]`,
`.`, `*`) — see `docs/cn-client-regex-probe.md`.

### Regenerate everything
```bash
PY="../poe2-en-cn-dict/tools/python/python.exe"
for g in waystone tablet relic item vendor; do PYTHONUTF8=1 "$PY" scripts/gen_$g.py; done
```

## Layout

```
poe2-re-cn/
├─ scripts/                 Python data pipeline (uses poe2-en-cn-dict's bundled Python)
│  ├─ lib/regex_opt.py      the regex re-optimizer (shortest distinguishing substring)
│  ├─ lib/translate.py      EN→CN resolver (stat-id crosswalk → stat_line_by_english → flat)
│  ├─ analyze_oracle.py     validates the optimizer model against poe2.re's English data
│  └─ gen_waystone.py       emits frontend/public/generated/Generated.Waystone.CN.json
├─ frontend/                Vite + React + TS app
│  ├─ src/lib/waystoneRegex.ts   in-game regex assembly (CN port of poe2.re's iM/Dv)
│  ├─ src/i18n.tsx               EN/CN chrome
│  └─ public/generated/          generated CN data (consumed at runtime)
├─ reference/               recovered poe2.re English data (oracle + schema reference)
├─ reports/                 per-generator coverage / collision reports
└─ docs/cn-client-regex-probe.md   in-game feature probe (fill in results)
```

## Build

```bash
# 1. regenerate CN data (Python from the dict repo)
PY="../poe2-en-cn-dict/tools/python/python.exe"
PYTHONUTF8=1 "$PY" scripts/gen_waystone.py

# 2. run the frontend
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/ (deploy to Cloudflare Pages / Netlify)
```

## How the regex is built

Each mod ships a precomputed Chinese snippet (`token.regex`) that appears in that
mod's line and no other mod's line in the pool. Selecting mods OR-joins their
snippets (`"混沌|火焰"`); unwanted mods are negated (`"!混沌"`); AND uses separate
quoted terms. See `docs/cn-client-regex-probe.md` for the in-game feature set the
snippets are constrained to.
