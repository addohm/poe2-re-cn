// In-game regex assembly for mod/affix tools (waystone, tablet) — CN port of
// poe2.re's iM/WM/Dv/zv logic.
//
// Each selected mod contributes its precomputed distinguishing Chinese snippet
// (token.regex). Because each snippet matches only its own mod within the pool,
// OR-joining a subset selects exactly those mods.
//
// PoE in-game search syntax (all confirmed working in the CN client):
//   "abc"        quoted term (space-separated terms = logical AND)
//   "a|b|c"      OR group
//   "!a|b"       negated group (exclude)

import type { ModToken } from "../data";

export type SelectType = "any" | "all";

export interface ModSelection {
  wanted: ModToken[];
  wantedType: SelectType;
  unwanted: ModToken[];
}

export function buildModRegex(sel: ModSelection): string {
  const parts: string[] = [];

  if (sel.wanted.length > 0) {
    const snippets = sel.wanted.map((t) => t.regex);
    if (sel.wantedType === "any") {
      parts.push(`"${snippets.join("|")}"`);
    } else {
      parts.push(...snippets.map((s) => `"${s}"`));
    }
  }

  if (sel.unwanted.length > 0) {
    const snippets = sel.unwanted.map((t) => t.regex);
    parts.push(`"!${snippets.join("|")}"`);
  }

  return parts.join(" ").trim();
}
