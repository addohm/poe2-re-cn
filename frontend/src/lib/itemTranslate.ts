// Item-text translator. Paste a whole item; each line is translated toward the
// target language:
//   1. mod lines are matched against stat-line templates (value tokens like
//      "22 (20-25)" are pulled out, the template translated, values reinserted);
//   2. everything else (labels, base names, rarity words, affix braces) gets
//      dictionary term replacement (longest term first);
//   3. separators / numbers / unknown text pass through unchanged.

interface RawData {
  mods: [string, string][]; // [normZh, normEn]
  terms: Record<string, string>; // cn -> en
}

interface Built {
  modsCn2En: Record<string, string>;
  modsEn2Cn: Record<string, string>;
  termRe: { en: RegExp | null; zh: RegExp | null };
  termMap: { en: Record<string, string>; zh: Record<string, string> };
}

let built: Built | null = null;
let loading: Promise<Built> | null = null;

// A rolled value on an item: "22", "+11", "-4", "1.5", or "22 (20-25)".
const VALUE = /[+-]?\d+(?:\.\d+)?(?:\s*\([+\-\d.\s]+\))?/g;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTermRegex(keys: string[]): RegExp | null {
  const usable = keys.filter((k) => k.length >= 2).sort((a, b) => b.length - a.length);
  if (!usable.length) return null;
  return new RegExp(usable.map(escapeRe).join("|"), "g");
}

export function loadTranslator(base: string): Promise<Built> {
  if (built) return Promise.resolve(built);
  if (loading) return loading;
  loading = fetch(base + "generated/Generated.Translate.CN.json")
    .then((r) => r.json())
    .then((data: RawData) => {
      const modsCn2En: Record<string, string> = {};
      const modsEn2Cn: Record<string, string> = {};
      for (const [nz, ne] of data.mods) {
        if (!(nz in modsCn2En)) modsCn2En[nz] = ne;
        if (!(ne in modsEn2Cn)) modsEn2Cn[ne] = nz;
      }
      const termsEn2Cn: Record<string, string> = {};
      for (const cn in data.terms) {
        const en = data.terms[cn];
        if (!(en in termsEn2Cn)) termsEn2Cn[en] = cn;
      }
      built = {
        modsCn2En, modsEn2Cn,
        termMap: { en: data.terms, zh: termsEn2Cn },
        termRe: {
          en: buildTermRegex(Object.keys(data.terms)),   // cn keys -> en
          zh: buildTermRegex(Object.keys(termsEn2Cn)),    // en keys -> cn
        },
      };
      return built;
    });
  return loading;
}

function normalizeLine(line: string): { norm: string; values: string[] } {
  const values: string[] = [];
  let i = 0;
  const norm = line.replace(VALUE, (m) => {
    values.push(m.trim());
    return `{${i++}}`;
  });
  return { norm: norm.trim(), values };
}

function reinsert(tpl: string, values: string[]): string {
  return tpl.replace(/\{(\d+)\}/g, (_, n) => values[+n] ?? `{${n}}`);
}

function translateLine(line: string, target: "en" | "zh", b: Built): string {
  if (/^[\s\-—=]*$/.test(line)) return line; // separators / blank
  // 1. mod-line template
  const { norm, values } = normalizeLine(line);
  const modMap = target === "en" ? b.modsCn2En : b.modsEn2Cn;
  const tpl = modMap[norm];
  if (tpl) return reinsert(tpl, values);
  // 2. term replacement (labels, names, rarity, braces, bases)
  const re = b.termRe[target];
  const map = b.termMap[target];
  if (re) {
    re.lastIndex = 0;
    return line.replace(re, (m) => map[m] ?? m);
  }
  return line;
}

export function translateItem(text: string, target: "en" | "zh", b: Built): string {
  return text.split("\n").map((l) => translateLine(l, target, b)).join("\n");
}
