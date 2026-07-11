// Numeric-range regex helpers — faithful ports of poe2.re's zn / aM / kf logic.
// These match Arabic numerals, which the CN client also uses, so they are
// language-agnostic. Only the label/prefix around them is Chinese.

// aM(n): a regex matching integers >= n, for n >= 100 (3-digit). Port of poe2.re
// aM, but using \d for extra-digit positions (poe2.re used "." = any char, which
// on the CN client wrongly matched spaces / the "(min-max)" range numbers).
function atLeast3(n: number): string {
  const r = n.toString();
  const i = r[0], o = r[1], s = r[2];
  const d = Number(i), f = Number(o);
  if (o === "0" && s === "0") return d === 9 ? `${i}\\d\\d` : `[${i}-9]\\d\\d`;
  let h: string;
  if (s === "0") h = o === "9" ? `${i}9\\d` : `${i}[${o}-9]\\d`;
  else if (o === "0") h = `${i}(0[${s}-9]|[1-9]\\d)`;
  else if (o === "9" && s === "9") h = `${i}99`;
  else if (o === "9") h = `${i}9[${s}-9]`;
  else h = `${i}(${o}[${s}-9]|[${f + 1}-9]\\d)`;
  return d === 9 ? h : `(${h}|[${d + 1}-9]\\d\\d)`;
}

/** Regex matching a number >= `value` (as poe2.re's zn). round10 floors to the
 * nearest 10 first (shorter regex). Returns "" when value is 0/blank. */
export function atLeast(value: string | number, round10 = false): string {
  const digits = String(value).match(/\d/g);
  if (!digits) return "";
  const o = round10
    ? Math.floor(Number(digits.join("")) / 10) * 10
    : Number(digits.join(""));
  if (isNaN(o) || o === 0) return round10 && digits.length === 1 ? "." : "";
  if (o >= 100) return atLeast3(o);
  if (o > 9) {
    const s = o.toString(), d = s[0], f = s[1];
    return s[1] === "0"
      ? `([${d}-9]\\d|\\d\\d\\d)`
      : s[0] === "9"
        ? `(${d}[${f}-9]|\\d\\d\\d)`
        : `(${d}[${f}-9]|[${Number(d) + 1}-9]\\d|\\d\\d\\d)`;
  }
  return `([${o}-9]|\\d\\d\\d?)`;
}

/** Regex matching an integer in [min..max] for small bounded ranges that may
 * cross 10 (waystone tier 1-16). Union of a single-digit class and a tens class
 * (1X). Not anchored — callers put a label fragment in front. */
export function intRange(min: number, max: number): string {
  if (max < min) return "";
  const parts: string[] = [];
  const singleHi = Math.min(max, 9);
  if (min <= singleHi && min <= 9) {
    const s = digitSet(Math.max(min, 0), singleHi);
    if (s) parts.push(s);
  }
  if (max >= 10) {
    const lo = Math.max(min, 10);
    const onesLo = lo % 10, onesHi = max % 10; // tier stays within 10-16, one "tens" digit
    parts.push(`1${digitSet(onesLo, onesHi)}`);
  }
  const body = parts.join("|");
  return parts.length > 1 ? `(${body})` : body;
}

/** Match a mod (by its snippet) requiring its rolled value >= `value`. On the CN
 * client an augmentable mod renders as "…text… 22 (20-25)%": the rolled value
 * sits immediately before the "(" range bracket, and the mod's key term can be
 * before OR after it (e.g. 混沌 comes after the value). So we match the value
 * adjacent to "(" and the snippet in either order. */
export function valueFrag(snippet: string, value: string | number, round10 = false): string {
  const num = atLeast(value, round10);
  if (!num) return snippet;
  const val = `${num} ?\\(`; // rolled value, optional space, then the range "("
  return `(${snippet}.*${val}|${val}.*${snippet})`;
}

function WT(n: number, r: number): string {
  return n > r ? "" : n === r ? n.toString() : n === 0 && r === 9 ? "\\d" : `[${n}-${r}]`;
}

/** Level-range regex `<prefix>(…)\b` matching an integer in [min..max] (0 = open).
 * Faithful port of poe2.re's vx. Returns null when the range is empty/full. */
export function levelRange(min: number, max: number, prefix: string): string | null {
  const n = min, r = max;
  if ((n === 0 && r === 0) || (r > 0 && n > r)) return null;
  const o = r === 0 ? 99 : r;
  if (n === 0 && o === 99) return `${prefix}(\\d{1,2})\\b`;
  if (n > 0 && n === o) return `${prefix}(${n})\\b`;
  const s = n <= 9 ? WT(n, Math.min(9, o)) : "";
  const d = Math.floor(Math.min(Math.max(n, 10), o) / 10);
  const f = Math.floor(o / 10);
  const h: string[] = [];
  if (s) h.push(s);
  if (d <= f) {
    if (d === f) {
      const y = n > 9 ? n % 10 : 0, v = o % 10;
      h.push(`${d}[${y}-${v}]`);
    } else {
      if (n <= d * 10 + 9 && n > d * 10) { const y = n % 10; h.push(`${d}[${y}-9]`); }
      else if (n <= d * 10) h.push(`${d}\\d`);
      if (f > d + 1) h.push(`[${d + 1}-${f - 1}]\\d`);
      if (o % 10 > 0) h.push(`${f}[0-${o % 10}]`); else h.push(`${f}0`);
    }
  }
  return `${prefix}(${h.join("|")})\\b`;
}

/** Collapse an inclusive integer set [min..max] into a compact char-class,
 * for small bounded ranges like waystone tier (1-16) or revives (0-6). Port of
 * poe2.re's kf + the rM collapse. Returns e.g. "3", "[2-4]", "[13]". */
export function digitSet(min: number, max: number): string {
  if (max < min) return "";
  const arr: number[] = [];
  for (let n = min; n <= max; n++) arr.push(n);
  if (arr.length <= 1) return arr.join("");
  if (arr.length > 2) return `[${arr[0]}-${arr[arr.length - 1]}]`;
  return `[${arr.join("")}]`;
}
