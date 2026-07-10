// CN port of poe2.re's tablet regex builder (zv + helpers).
import type { ModToken } from "../data";
import { atLeast } from "./numeric";
import { TABLET_RARITY, TABLET_TYPES, TABLET_USES } from "./tabletConfig";

export interface TabletState {
  round10: boolean;
  rarity: Record<string, boolean>;
  types: Record<string, boolean>;
  usesEnabled: boolean;
  uses: string;
  affixes: { token: ModToken; value?: string }[];
  affixType: "any" | "all";
  customText: string;
}

function modFrag(token: ModToken, value: string | undefined, round10: boolean): string {
  if (value && String(value).trim() !== "") {
    const num = atLeast(value, round10);
    if (num) return `${token.regex}.*${num}`;
  }
  return token.regex;
}

export function buildTabletRegex(s: TabletState): string {
  const parts: string[] = [];

  const rar = TABLET_RARITY.filter((r) => s.rarity[r.id]).map((r) => r.frag);
  if (rar.length && rar.length < TABLET_RARITY.length) {
    parts.push(rar.length === 1 ? `"${rar[0]}"` : `"(${rar.join("|")})"`);
  }

  const ty = TABLET_TYPES.filter((r) => s.types[r.id]).map((r) => r.frag);
  if (ty.length && ty.length < TABLET_TYPES.length) {
    parts.push(ty.length === 1 ? `"${ty[0]}"` : `"(${ty.join("|")})"`);
  }

  if (s.usesEnabled) {
    const num = atLeast(s.uses || "0", false);
    if (num) parts.push(`"${TABLET_USES.frag}.*${num}"`);
  }

  if (s.affixes.length) {
    const frags = s.affixes.map((a) => modFrag(a.token, a.value, s.round10));
    if (s.affixType === "any") parts.push(`"${frags.join("|")}"`);
    else parts.push(...frags.map((f) => `"${f}"`));
  }

  if (s.customText.trim()) parts.push(s.customText.trim());

  return parts.filter(Boolean).join(" ").trim();
}
