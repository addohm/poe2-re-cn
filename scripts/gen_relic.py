"""Generate the CN Relic data file (frontend/public/generated/).

Relic (Trial of Sekhemas) mods are embedded in poe2.re's JS bundle — extracted to
reference/generated/Relic.embedded.json as {name, regex, values, ranges, affix}.
They have no trade stat ids, so we translate the English `name` via
stat_line_by_english and recompute a Chinese-optimized regex over the pool.

Output token schema matches ModToken (so the frontend reuses ModTool):
  { id, en, zh, zhText, regex, ranges, options:{prefix, name, nameZh, tags} }
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.translate import Resolver, LOOKUP  # noqa: E402
from lib import regex_opt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "reference" / "generated"
OUT = ROOT / "frontend" / "public" / "generated" / "Generated.Relic.CN.json"
REPORT = ROOT / "reports" / "relic_report.json"


# Best-effort translations for mods the dictionary does not (yet) cover. The
# dictionary is the source of truth; these are stop-gaps to be verified in-game
# and ideally upstreamed into poe2-en-cn-dict. Keyed by the mod's English name.
# 防御 = Defences (confirmed in en_to_cn); the exact phrasing is a guess but the
# generated snippet lands on 防御, which matches the real line regardless.
OVERRIDES = {
    "##% increased Defences": "防御提高 #%",
}


def cn_term_set():
    return frozenset(json.load(open(LOOKUP / "cn_to_en.json", encoding="utf-8")).keys())


def zh_text(zh: str) -> str:
    s = regex_opt.strip_markup(zh)
    s = regex_opt._PLACEHOLDER_TOK.sub("#", s)
    return re.sub(r"\s+", " ", s).strip()


def main():
    res = Resolver()
    relic = json.load(open(REF / "Relic.embedded.json", encoding="utf-8"))

    items, misses = [], []
    for i, m in enumerate(relic):
        en = m["name"]
        zh = res.by_english_line(en) or OVERRIDES.get(en)
        if zh is None:
            misses.append(en)
            zh = en
        items.append({
            "id": i,
            "en": en.replace("##", "#"),
            "zh": zh,
            "zhText": zh_text(zh),
            "ranges": m.get("ranges", []),
            "options": {
                "name": None, "nameZh": None,
                "prefix": m.get("affix") == "PREFIX",
                "tags": [m.get("affix", "").lower()] if m.get("affix") else [],
            },
        })

    opt = regex_opt.optimize_pool(items, text_key="zh", term_set=cn_term_set())
    collisions = []
    for i, snip in enumerate(opt["regex"]):
        if snip is None:
            collisions.append(items[i]["zhText"])
            items[i]["regex"] = regex_opt.emit_haystack(opt["haystacks"][i])
        else:
            items[i]["regex"] = snip

    OUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"tokens": items}, ensure_ascii=False, separators=(",", ":")),
                   encoding="utf-8")
    n = len(items)
    report = {
        "total": n,
        "translated_pct": round(100 * (n - len(misses)) / n, 2),
        "regex_ok_pct": round(100 * (n - len(collisions)) / n, 2),
        "translation_misses": misses,
        "regex_collisions": collisions,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"relic tokens: {n}")
    print(f"translated {report['translated_pct']}%  regex-distinguishing {report['regex_ok_pct']}%")
    if misses:
        print("misses:", misses)
    for it in items[:10]:
        aff = "P" if it["options"]["prefix"] else "S"
        print(f"  [{aff}] {it['en'][:42]:42} | {it['zhText'][:24]:24} | {it['regex']}")


if __name__ == "__main__":
    main()
