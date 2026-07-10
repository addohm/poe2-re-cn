"""Regex re-optimization engine for the CN mirror.

poe2.re ships, per mod, a short regex snippet that uniquely identifies that mod
within its search pool. Those snippets are computed against ENGLISH text, so they
are useless on the Chinese client. This module recomputes them against Chinese
text.

Validated model (see analyze_oracle.py): the snippet is a **shortest
distinguishing substring** of the mod's real rendered line — a substring that
appears in that mod's text and in no other mod's text in the same pool. OR-joining
any subset of snippets therefore selects exactly the intended mods.

Candidate tiers (best first):
  1. **pure literal** Chinese run (no spaces, no number) — cleanest & safest;
  2. a snippet that spans the **number slot** (rendered `[0-9]+`) and/or spaces —
     needed when two mods differ only by a rolled number (e.g.
     `地图包含一个额外的精华` vs `地图包含 # 个额外的精华`).
Within a tier we prefer: length >= min_len (robustness floor), then a snippet that
is a known dictionary term (word-aligned), then shorter, then leftmost.

Regex features (all confirmed working in the CN client, 2026-07): literal Chinese,
spaces, `[0-9]`, `|`, `()`, `!`, `^`, `$`, `.`, `*`.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Sentinel for a value placeholder ({0}, {0:+d}, %1$s, ...). In a candidate it
# renders to `[0-9]+`. It is a char that never appears in real display text.
PLACEHOLDER = "\x00"

_TAG = re.compile(r"<[^>]*>")                          # <default>, color tags ...
_LINK = re.compile(r"\[([^\[\]|]*\|)?([^\[\]]*)\]")    # [text] or [display|key] -> text
# Value placeholders across the dictionary's two conventions: stat_lines uses
# {0}/{0:+d}; stat_line_by_english uses trade-style `#`. `#` never appears
# literally in CN display text, so masking `#+` is safe.
_PLACEHOLDER_TOK = re.compile(r"\{\d+(?::[^}]*)?\}|%\d+\$s|%s|#+")
_RE_SPECIAL = set(r".^$*+?()[]{}|\\")


@dataclass
class FeatureProfile:
    # All confirmed working in the CN client (full regex engine, verified in-game
    # 2026-07). We still PREFER pure literal snippets; number/space spanning is a
    # collision fallback.
    anchors: bool = True        # ^ and $
    char_class: bool = True     # [0-9] etc
    alternation: bool = True    # |
    groups: bool = True         # ()
    max_len: int = 50           # in-game search length budget (per term)
    min_len: int = 2            # robustness floor: avoid 1-char snippets


DEFAULT_PROFILE = FeatureProfile()


def strip_markup(s: str) -> str:
    s = _TAG.sub("", s)
    s = _LINK.sub(lambda m: m.group(2), s)
    return s


def to_haystack(template: str) -> str:
    """Real rendered text with value placeholders masked by PLACEHOLDER; spaces
    kept (they are literal in the search)."""
    s = strip_markup(template)
    s = _PLACEHOLDER_TOK.sub(PLACEHOLDER, s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def _is_pure(sub: str) -> bool:
    """A clean literal snippet: no number slot, no whitespace."""
    return PLACEHOLDER not in sub and " " not in sub


def _emit(sub: str) -> str:
    """Turn a token-substring into a regex: PLACEHOLDER -> [0-9]+, escape specials."""
    out = []
    for ch in sub:
        if ch == PLACEHOLDER:
            out.append("[0-9]+")
        elif ch in _RE_SPECIAL:
            out.append("\\" + ch)
        else:
            out.append(ch)
    return "".join(out)


def emit_haystack(haystack: str) -> str:
    """Emit a full-line regex for a haystack (collision fallback): number slots ->
    [0-9]+, specials escaped. Matches the whole line; used when no shorter
    distinguishing snippet exists (e.g. genuine duplicate mods)."""
    return _emit(haystack.strip())


def whole_line_regex(template: str) -> str:
    return emit_haystack(to_haystack(template))


SEP = "\x01"  # joins the pool's other lines; never appears in text or candidates


def _iter_substrings(text: str):
    """Every substring that does not start/end with whitespace and does not span a
    line break, shortest-first then leftmost. (Edge spaces are error-prone when
    pasted; a snippet must stay within one displayed line.)"""
    n = len(text)
    seen = set()
    by_len: dict[int, list[str]] = {}
    for L in range(1, n + 1):
        for start in range(0, n - L + 1):
            sub = text[start:start + L]
            if sub[0] == " " or sub[-1] == " " or "\n" in sub or SEP in sub:
                continue
            if sub in seen:
                continue
            seen.add(sub)
            by_len.setdefault(L, []).append(sub)
    for L in sorted(by_len):
        for sub in by_len[L]:
            yield sub, L


def shortest_distinguishing(idx: int, haystacks: list[str],
                            profile: FeatureProfile = DEFAULT_PROFILE,
                            term_set: frozenset[str] | None = None,
                            others_combined: str | None = None) -> str | None:
    """Pick a distinguishing snippet (emitted regex) for haystacks[idx], or None
    if the line is not distinguishable from another in the pool (genuine
    duplicate / textual subset even after number-spanning).

    others_combined: all other haystacks joined by SEP (precomputed by the caller
    for speed). A candidate is distinguishing iff it is not a substring of it."""
    me = haystacks[idx]
    if others_combined is None:
        others_combined = SEP.join(h for j, h in enumerate(haystacks) if j != idx)

    distinguishing: list[tuple[str, int]] = []
    shortest_len: int | None = None
    for sub, L in _iter_substrings(me):
        if L > profile.max_len:
            break
        if shortest_len is not None and L > shortest_len + 1:
            break            # collect only within a +1 band for term-preference
        if sub not in others_combined:
            distinguishing.append((sub, L))
            if shortest_len is None:
                shortest_len = L
    if not distinguishing:
        return None

    pure = [d for d in distinguishing if _is_pure(d[0])]
    tier = pure if pure else distinguishing

    ge_min = [d for d in tier if d[1] >= profile.min_len]
    pool = ge_min if ge_min else tier
    shortest_len = pool[0][1]
    band = [d for d in pool if d[1] <= shortest_len + 1]

    def score(d):
        sub, L = d
        is_term = term_set is not None and sub in term_set
        return (0 if is_term else 1, L)

    band.sort(key=score)
    return _emit(band[0][0])


def anchored_distinguishing(idx: int, haystacks: list[str],
                            profile: FeatureProfile = DEFAULT_PROFILE) -> str | None:
    """Fallback for mods whose text is a subset of a more specific mod: anchor to
    line start (`^P`) or end (`S$`). E.g. the generic `怪物的效能提高` is a prefix
    of `地图中稀有裂隙怪物的效能提高`, so only `^怪物的效能提高` isolates it."""
    if not profile.anchors:
        return None
    me = haystacks[idx]
    others = [h for j, h in enumerate(haystacks) if j != idx]
    n = len(me)
    candidates: list[tuple[int, bool, str]] = []  # (length, is_pure, emitted)

    for L in range(1, n + 1):                      # shortest distinguishing prefix
        p = me[:L]
        if p[-1] == " ":
            continue
        if not any(o.startswith(p) for o in others):
            candidates.append((L, _is_pure(p), "^" + _emit(p)))
            break
    for L in range(1, n + 1):                       # shortest distinguishing suffix
        s = me[n - L:]
        if s[0] == " ":
            continue
        if not any(o.endswith(s) for o in others):
            candidates.append((L, _is_pure(s), _emit(s) + "$"))
            break
    if not candidates:
        return None
    candidates.sort(key=lambda c: (0 if c[1] else 1, c[0]))  # pure first, then shorter
    return candidates[0][2]


def _validates(regex: str, me: str, others: list[str]) -> bool:
    """Confirm the emitted regex matches this mod's rendered text and no other's.
    PLACEHOLDER is rendered as a sample digit run for the test."""
    def render(h: str) -> str:
        return h.replace(PLACEHOLDER, "7")
    try:
        pat = re.compile(regex)
    except re.error:
        return False
    if not pat.search(render(me)):
        return False
    return not any(pat.search(render(o)) for o in others)


def optimize_pool(items: list[dict], text_key: str = "zh",
                  profile: FeatureProfile = DEFAULT_PROFILE,
                  term_set: frozenset[str] | None = None) -> dict:
    """Compute a distinguishing snippet for every item in a pool.

    Returns {"regex": [emitted-regex-or-None], "collisions": [indices with no
    distinguishing snippet], "haystacks": [...]}. Self-validates each snippet.
    """
    haystacks = [to_haystack(it[text_key]) for it in items]
    regexes: list[str | None] = []
    collisions: list[int] = []
    n = len(haystacks)
    for i in range(n):
        others_combined = SEP.join(haystacks[j] for j in range(n) if j != i)
        snip = shortest_distinguishing(i, haystacks, profile, term_set, others_combined)
        if snip is None:                              # try anchoring before giving up
            snip = anchored_distinguishing(i, haystacks, profile)
        if snip is None:
            collisions.append(i)
        regexes.append(snip)
    others_of = lambda i: [haystacks[j] for j in range(len(haystacks)) if j != i]
    for i, snip in enumerate(regexes):
        if snip is None:
            continue
        assert _validates(snip, haystacks[i], others_of(i)), (i, snip, haystacks[i])
    return {"regex": regexes, "collisions": collisions, "haystacks": haystacks}
