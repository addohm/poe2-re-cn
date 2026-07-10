"""Reverse-engineer the property poe2.re's shipped English regex snippets satisfy.

For the waystone token pool we have, per token:
  - generalizedText: normalized English line, e.g. '^players are ... temporal chains$'
  - regex:           the short snippet poe2.re ships, e.g. 'hains$'

Goal: confirm each snippet is a *distinguishing* pattern (matches its own
generalizedText and no other token's), and learn how it's chosen (shortest?
leftmost? anchored?). This locks the algorithm we must reproduce for Chinese.
"""
import json
import re
import sys
from pathlib import Path

REF = Path(__file__).resolve().parent.parent / "reference" / "generated"


def load(name):
    return json.load(open(REF / name, encoding="utf-8"))


def analyze(tokens, label):
    print(f"\n===== {label}: {len(tokens)} tokens =====")
    texts = [t["generalizedText"] for t in tokens]
    ok_unique = 0
    ok_selfmatch = 0
    anchored = 0
    len_hist = {}
    is_minimal = 0
    not_minimal_examples = []
    for i, t in enumerate(tokens):
        rgx = t["regex"]
        try:
            pat = re.compile(rgx, re.IGNORECASE)
        except re.error as e:
            print("  BAD REGEX", repr(rgx), e)
            continue
        self_match = bool(pat.search(texts[i]))
        others = [j for j in range(len(texts)) if j != i and pat.search(texts[j])]
        if self_match:
            ok_selfmatch += 1
        if self_match and not others:
            ok_unique += 1
        if "^" in rgx or "$" in rgx:
            anchored += 1
        len_hist[len(rgx)] = len_hist.get(len(rgx), 0) + 1
        # Is there a SHORTER distinguishing plain substring of this text?
        minimal = shortest_distinguishing(texts[i], texts, i)
        if minimal is not None and len(minimal) < len(rgx.replace("$", "").replace("^", "")):
            not_minimal_examples.append((rgx, minimal, texts[i][:40]))
        else:
            is_minimal += 1
    print(f"  self-match: {ok_selfmatch}/{len(tokens)}   unique(distinguishing): {ok_unique}/{len(tokens)}")
    print(f"  anchored (^/$): {anchored}   length histogram: {dict(sorted(len_hist.items()))}")
    print(f"  shipped snippet is <= our shortest plain distinguishing substring: {is_minimal}/{len(tokens)}")
    if not_minimal_examples[:8]:
        print("  cases where a shorter plain substring exists than shipped snippet:")
        for rgx, mn, txt in not_minimal_examples[:8]:
            print(f"    shipped={rgx!r:14} shorter={mn!r:8} text={txt!r}")


def shortest_distinguishing(text, texts, idx):
    """Shortest contiguous substring of `text` that appears in no other text.
    Plain-substring version (no anchors), for comparison against shipped snippet."""
    others = [texts[j] for j in range(len(texts)) if j != idx]
    n = len(text)
    best = None
    for L in range(1, n + 1):
        for s in range(0, n - L + 1):
            sub = text[s:s + L]
            if all(sub not in o for o in others):
                if best is None or len(sub) < len(best):
                    best = sub
        if best is not None:
            return best
    return best


if __name__ == "__main__":
    ws = load("Generated.Waystone.min.json")
    analyze(ws["tokens"], "WAYSTONE")
    tb = load("Generated.Tablet.min.json")
    analyze(tb["tokens"], "TABLET")
