// Full CN port of poe2.re's waystone regex builder (Dv + helpers), driven by the
// waystone filter config + the mod tokens. Fragments flagged conf:"check" match
// CN info-panel text whose exact wording is still being verified in-game.

import type { ModToken } from "../data";
import { atLeast, intRange, digitSet, valueFrag } from "./numeric";
import {
  WAYSTONE_NUMERIC, WAYSTONE_RARITY, WAYSTONE_STATE, WAYSTONE_REVIVES,
} from "./waystoneConfig";

export interface WaystoneState {
  round10: boolean;
  numeric: Record<string, string>;      // field id -> value string
  tier: { min: number; max: number };
  revives: { min: number; max: number };
  rarity: Record<string, boolean>;      // rare/magic/normal
  state: Record<string, boolean>;       // corrupted/uncorrupted/delirious
  wanted: { token: ModToken; value?: string }[];
  wantedType: "any" | "all";
  unwanted: ModToken[];
  customText: string;
}

// one mod -> its snippet, optionally requiring a value >= threshold on the line
function modFrag(token: ModToken, value: string | undefined, round10: boolean): string {
  if (value && String(value).trim() !== "") return valueFrag(token.regex, value, round10);
  return token.regex;
}

export function buildWaystoneRegex(s: WaystoneState): string {
  const parts: string[] = [];

  // rarity (value words; OR when several)
  const rar = WAYSTONE_RARITY.filter((r) => s.rarity[r.id]).map((r) => r.frag);
  if (rar.length && rar.length < WAYSTONE_RARITY.length) {
    parts.push(rar.length === 1 ? `"${rar[0]}"` : `"(${rar.join("|")})"`);
  }

  // tier — real line is "引路石（ 16 阶）". Anchor on 引路石（ … <range> … 阶 so a
  // single-digit range can't match inside a two-digit tier. (skip default 1-16)
  if (!(s.tier.min <= 1 && s.tier.max >= 16) && s.tier.max >= s.tier.min) {
    const pat = intRange(s.tier.min, s.tier.max || 16);
    if (pat) parts.push(`"引路石（.${pat}.阶"`);
  }

  // revives — real line "复活次数: 0 (augmented)" (no %). (skip default 0-6)
  if (!(s.revives.min <= 0 && s.revives.max >= 6) && s.revives.max >= s.revives.min) {
    const set = digitSet(s.revives.min, s.revives.max);
    if (set) parts.push(`"${WAYSTONE_REVIVES.frag}.*${set}"`);
  }

  // quantity & yield numeric fields
  for (const f of WAYSTONE_NUMERIC) {
    const num = atLeast(s.numeric[f.id] ?? "", s.round10);
    if (num) parts.push(`"${f.frag}.*${num}%"`);
  }

  // wanted mods
  if (s.wanted.length) {
    const frags = s.wanted.map((w) => modFrag(w.token, w.value, s.round10));
    if (s.wantedType === "any") parts.push(`"${frags.join("|")}"`);
    else parts.push(...frags.map((f) => `"${f}"`));
  }

  // unwanted mods (negated)
  if (s.unwanted.length) {
    parts.push(`"!${s.unwanted.map((t) => t.regex).join("|")}"`);
  }

  // state (unquoted raw tokens, like poe2.re oM)
  const st = WAYSTONE_STATE;
  const corrupted = s.state.corrupted && !s.state.uncorrupted;
  const uncorrupted = s.state.uncorrupted && !s.state.corrupted;
  if (corrupted) parts.push(st[0].frag);
  else if (uncorrupted) parts.push(`!${st[1].frag}`);

  if (s.customText.trim()) parts.push(s.customText.trim());

  return parts.filter(Boolean).join(" ").trim();
}
