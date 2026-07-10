"""Translation resolver: English game strings -> Simplified Chinese, sourced only
from the poe2-en-cn-dict dictionary (single source of truth).

Resolution strategy, most-reliable first:
  1. Trade-stat-id crosswalk (waystone / tablet): a mod's GGG stat hash ->
     stat_lines block -> the matching form's `zh`. 100% reliable, no text match.
  2. stat_line_by_english: normalized English mod line -> zh, with `|`-split for
     hybrid mods and placeholder normalization (item / relic).
  3. Flat lookups (en_to_cn) and per-table dumps for base types / classes /
     affix option names.

Every unresolved string is recorded so coverage gaps are visible, never silent.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

DICT = Path(r"C:/Users/addohm/Documents/poe2-en-cn-dict/dictionary")
LOOKUP = DICT / "lookup"


def _load(p: Path):
    return json.load(open(p, encoding="utf-8"))


class Dictionary:
    """Lazy-loaded bundle of the dictionary files we consume."""

    def __init__(self):
        self._cache: dict[str, object] = {}

    def _get(self, name: str, path: Path):
        if name not in self._cache:
            self._cache[name] = _load(path)
        return self._cache[name]

    @property
    def stat_lines(self):
        return self._get("stat_lines", LOOKUP / "stat_lines.json")

    @property
    def trade_id_to_stat(self):
        return self._get("trade_id_to_stat", LOOKUP / "trade_id_to_stat.json")

    @property
    def stat_line_by_english(self):
        return self._get("slbe", LOOKUP / "stat_line_by_english.json")

    @property
    def en_to_cn(self):
        return self._get("en_to_cn", LOOKUP / "en_to_cn.json")

    def table(self, name: str):
        return self._get("tbl_" + name, DICT / "tables" / f"{name}.json")


# --- English normalization, to match stat_line_by_english keys / form.en ------

_PAREN_RANGE = re.compile(r"\([#\d]+(?:\.[#\d]+)?-[#\d]+(?:\.[#\d]+)?\)")  # (5-20), (#.#-#.#)
_NUM = re.compile(r"(?<![A-Za-z0-9])[+-]?\d+(?:\.\d+)?(?![A-Za-z0-9])")
_LINK = re.compile(r"\[([^\[\]|]*\|)?([^\[\]]*)\]")


def normalize_en(s: str) -> str:
    """Normalize an English mod line to the dictionary's placeholder-`#` form.
    Handles poe2.re's varied placeholder spellings: (5-20), (#.#-#.#), ##, +#, #.#."""
    s = _LINK.sub(lambda m: m.group(2), s)
    s = _PAREN_RANGE.sub("#", s)       # parenthesised numeric range -> #
    s = s.replace("#.#", "#")          # decimal placeholder
    s = re.sub(r"#+", "#", s)          # ## -> #
    s = _NUM.sub("#", s)               # standalone numbers -> #
    s = s.replace("+#", "#")           # sign is part of GGG's form marker, drop it
    s = re.sub(r"#+", "#", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def loose(s: str) -> str:
    """Aggressive normalization for a fallback match: every number/placeholder
    becomes `#` and the sign is dropped. Resolves cases where poe2.re shows `#`
    but the dictionary key kept a literal (e.g. `# Honour` vs `1 Honour`)."""
    return normalize_en(s)


def _form_en_norm(form_en: str) -> str:
    # stat_lines forms use {0}/{0:+d} placeholders; normalize to '#'
    s = re.sub(r"\{\d+(?::[^}]*)?\}", "#", form_en)
    s = s.replace("+#", "#")
    s = re.sub(r"\s+", " ", s).strip()
    return s


class Resolver:
    def __init__(self, d: Dictionary | None = None):
        self.d = d or Dictionary()
        self.misses: list[dict] = []
        self._slbe_loose: dict[str, str] | None = None

    def _loose_index(self) -> dict[str, str]:
        """Index of stat_line_by_english under aggressive normalization (all
        numbers -> #). First key wins on collision. Built once, lazily."""
        if self._slbe_loose is None:
            idx: dict[str, str] = {}
            for k, v in self.d.stat_line_by_english.items():
                lk = loose(k)
                if lk not in idx:
                    idx[lk] = v
            self._slbe_loose = idx
        return self._slbe_loose

    # -- 1. crosswalk by GGG stat hash (waystone/tablet) -----------------------
    def by_stat_hash(self, stat_hash: str, en_hint: str | None = None):
        """Return (zh_template, matched_form) for a stat hash, choosing the form
        whose English best matches en_hint (to pick increased-vs-reduced)."""
        idx = self.d.trade_id_to_stat.get(str(stat_hash))
        if idx is None:
            return None, None
        block = self.d.stat_lines[idx]
        forms = [f for f in block.get("forms", []) if f.get("zh")]
        if not forms:
            return None, None
        if en_hint:
            target = normalize_en(en_hint)
            for f in forms:
                if _form_en_norm(f["en"]) == target:
                    return f["zh"], f
            # relaxed: sign-agnostic already handled; try substring
        # default: positive form (value_range starting 1 or #), else first
        for f in forms:
            vr = f.get("value_range", "")
            if not vr.startswith("-") and not vr.endswith("-1"):
                return f["zh"], f
        return forms[0]["zh"], forms[0]

    # -- 2. by English mod line ------------------------------------------------
    def by_english_line(self, en: str):
        slbe = self.d.stat_line_by_english
        key = normalize_en(en)
        if key in slbe:
            return slbe[key]
        # hybrid: split on newline / explicit '|' and translate each part
        parts = re.split(r"\s*\|\s*|\n", en)
        if len(parts) > 1:
            outs = []
            ok = True
            for p in parts:
                k = normalize_en(p)
                if k in slbe:
                    outs.append(slbe[k])
                else:
                    ok = False
                    break
            if ok:
                return "\n".join(outs)
        # final fallback: loose index (literal-number vs # mismatches)
        lk = loose(en)
        if lk in self._loose_index():
            return self._loose_index()[lk]
        return None

    # -- 3. flat term lookup ---------------------------------------------------
    def by_term(self, en: str):
        return self.d.en_to_cn.get(en)

    # -- multi-line item mods (`A|B` hybrid) -----------------------------------
    def translate_multiline(self, en: str):
        """Translate a possibly multi-line mod description line-by-line.
        Returns (zh_joined, n_ok, n_total). zh_joined contains a CN line for every
        source line that resolved (untranslatable flavour lines are dropped); an
        item mod is identifiable by any one of its lines, so a partial result is
        still usable. Falls back to the whole-string lookup first."""
        whole = self.by_english_line(en)
        parts = re.split(r"\s*\|\s*|\n", en)
        if whole is not None and len(parts) <= 1:
            return whole, 1, 1
        zh_lines, ok = [], 0
        for p in parts:
            z = self.by_english_line(p)
            if z is not None:
                zh_lines.append(z)
                ok += 1
        if ok == 0:
            return (whole, len(parts), len(parts)) if whole else (None, 0, len(parts))
        return "\n".join(zh_lines), ok, len(parts)

    def record_miss(self, kind: str, en: str, extra=None):
        self.misses.append({"kind": kind, "en": en, "extra": extra})

    def miss_report(self):
        return self.misses
