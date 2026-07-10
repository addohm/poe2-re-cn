"""Shared generator for the crosswalk-based tools (waystone, tablet).

Both ship tokens of the same shape — {id, rawText, generalizedText, options} —
where id is a GGG stat hash. We translate each via the trade-stat-id crosswalk
(id -> <Tool>TradeStatIds.json -> trade_id_to_stat -> stat_lines.forms.zh),
recompute a Chinese-optimized distinguishing regex per token, and emit a CN data
file with a clean dual-language schema for the rebuilt frontend.
"""
import json
import re
from pathlib import Path

from .translate import Resolver, LOOKUP
from . import regex_opt

_RANGE = re.compile(r"\(([+-]?\d+)-([+-]?\d+)\)")


def _cn_term_set():
    terms = json.load(open(LOOKUP / "cn_to_en.json", encoding="utf-8"))
    return frozenset(terms.keys())


def parse_ranges(en_text: str):
    return [[int(a), int(b)] for a, b in _RANGE.findall(en_text)]


def zh_text(zh_template: str) -> str:
    """Chinese template with placeholders shown as '#', markup stripped."""
    s = regex_opt.strip_markup(zh_template)
    s = regex_opt._PLACEHOLDER_TOK.sub("#", s)
    return re.sub(r"\s+", " ", s).strip()


def generate(ref_path: Path, trade_ids_path: Path, out_path: Path, report_path: Path,
             term_set=None, resolver: Resolver | None = None):
    res = resolver or Resolver()
    src = json.load(open(ref_path, encoding="utf-8"))
    trade_ids = json.load(open(trade_ids_path, encoding="utf-8"))

    items, misses = [], []
    for t in src["tokens"]:
        tid = trade_ids.get(str(t["id"]))
        zh = None
        if tid:
            zh, _ = res.by_stat_hash(tid.split("stat_")[-1], en_hint=t["rawText"])
        if zh is None:
            zh = res.by_english_line(t["rawText"])
        if zh is None:
            misses.append({"id": t["id"], "en": t["rawText"], "trade_id": tid})
            zh = t["rawText"]
        opt_name = t.get("options", {}).get("name")
        items.append({
            "id": t["id"],
            "en": t["rawText"],
            "zh": zh,
            "zhText": zh_text(zh),
            "ranges": parse_ranges(t["rawText"]),
            "options": {
                "name": opt_name,
                "nameZh": (res.by_term(opt_name) if opt_name else None) or opt_name,
                "prefix": t.get("options", {}).get("prefix", False),
                "tags": t.get("options", {}).get("tags", []),
            },
        })

    opt = regex_opt.optimize_pool(items, text_key="zh",
                                  term_set=term_set if term_set is not None else _cn_term_set())
    collisions = []
    for i, snip in enumerate(opt["regex"]):
        if snip is None:
            # No distinguishing snippet (genuine duplicate / textual subset). Fall
            # back to the whole line as a valid regex (number slots -> [0-9]+) so
            # it still matches; it may also match the colliding twin, which is
            # acceptable since they render identically in-game.
            collisions.append({"id": items[i]["id"], "zh": items[i]["zhText"]})
            items[i]["regex"] = regex_opt.emit_haystack(opt["haystacks"][i])
        else:
            items[i]["regex"] = snip

    out_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"tokens": items}, ensure_ascii=False,
                                   separators=(",", ":")), encoding="utf-8")

    n = len(items)
    report = {
        "total": n,
        "translated_pct": round(100 * (n - len(misses)) / n, 2) if n else 0,
        "regex_ok_pct": round(100 * (n - len(collisions)) / n, 2) if n else 0,
        "translation_misses": misses,
        "regex_collisions": collisions,
        "sample": [{"en": it["en"], "zh": it["zhText"], "regex": it["regex"]} for it in items[:12]],
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return items, report
