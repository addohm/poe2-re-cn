"""Generate the CN Item data file (frontend/public/generated/).

Generated.Item.json is poe2.re's biggest dataset: 45 item basetypes, each with
mod-category groups (prefix / suffix / corrupted / unique) whose `modifiers` carry
an English `description`. We translate every description (line-by-line for hybrid
`A|B` mods) and recompute a Chinese-optimized distinguishing regex per pool
(pool = the modifiers of one basetype+category group). Base-item names are
translated for the search UI.

Output schema:
  { "basetypes": [ { base, baseZh,
       "groups": [ { cat, baseItems:[{en,zh}],
                     modifiers:[{en, zh, zhText, regex, partial}] } ] } ] }
"""
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib.translate import Resolver, LOOKUP  # noqa: E402
from lib import regex_opt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "reference" / "generated"
OUT = ROOT / "frontend" / "public" / "generated" / "Generated.Item.CN.json"
REPORT = ROOT / "reports" / "item_report.json"


def zh_text(zh: str) -> str:
    s = regex_opt.strip_markup(zh)
    s = regex_opt._PLACEHOLDER_TOK.sub("#", s)
    return re.sub(r"[ \t]+", " ", s).strip().replace("\n", " • ")


def main():
    t0 = time.time()
    res = Resolver()
    term_set = frozenset(json.load(open(LOOKUP / "cn_to_en.json", encoding="utf-8")).keys())
    item = json.load(open(REF / "Generated.Item.json", encoding="utf-8"))

    out_basetypes = []
    total_mods = full = partial = dropped = 0
    collisions = 0
    miss_samples = []

    for bt in item:
        base = bt["basetype"]
        groups = []
        for grp in bt["itemRegexForCategory"]:
            mods = []
            for m in grp["modifiers"]:
                desc = m["description"]
                zh, ok, tot = res.translate_multiline(desc)
                total_mods += 1
                if zh is None:
                    dropped += 1
                    if len(miss_samples) < 40:
                        miss_samples.append(desc)
                    continue
                if ok == tot:
                    full += 1
                else:
                    partial += 1
                mods.append({
                    "en": desc.replace("|", " • "),
                    "zh": zh,
                    "zhText": zh_text(zh),
                    "partial": ok != tot,
                })
            if not mods:
                continue
            opt = regex_opt.optimize_pool(mods, text_key="zh", term_set=term_set)
            for i, snip in enumerate(opt["regex"]):
                if snip is None:
                    collisions += 1
                    mods[i]["regex"] = regex_opt.emit_haystack(opt["haystacks"][i])
                else:
                    mods[i]["regex"] = snip
            groups.append({
                "cat": grp["modCategory"],
                "baseItems": [{"en": b, "zh": res.by_term(b) or b} for b in grp.get("baseitems", [])],
                "modifiers": mods,
            })
        if groups:
            out_basetypes.append({
                "base": base,
                "baseZh": res.by_term(base) or base,
                "groups": groups,
            })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"basetypes": out_basetypes}, ensure_ascii=False,
                              separators=(",", ":")), encoding="utf-8")
    report = {
        "total_mod_instances": total_mods,
        "fully_translated": full,
        "partially_translated": partial,
        "dropped_untranslatable": dropped,
        "translated_pct": round(100 * (full + partial) / total_mods, 2),
        "regex_collisions": collisions,
        "miss_samples": miss_samples,
        "elapsed_s": round(time.time() - t0, 1),
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"basetypes: {len(out_basetypes)}  mod instances: {total_mods}")
    print(f"full: {full}  partial: {partial}  dropped: {dropped}  "
          f"({report['translated_pct']}% usable)")
    print(f"regex collisions (whole-line fallback): {collisions}")
    print(f"elapsed: {report['elapsed_s']}s")
    print(f"out size: {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
