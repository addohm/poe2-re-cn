import { useEffect, useMemo, useState } from "react";
import { loadVendor, type VendorData, type VendorGroup } from "../data";
import { levelRange } from "../lib/numeric";
import ResultBar from "../components/ResultBar";
import { useLang } from "../i18n";

// Combine selected options: an `or` group (rarity, class — an item has only one)
// becomes a single quoted alternation; an `and` group contributes one quoted term
// per selection. Groups are space-joined (logical AND).
function buildVendorRegex(groups: VendorGroup[], sel: Record<string, boolean>): string {
  const parts: string[] = [];
  for (const g of groups) {
    const chosen = g.options.filter((o) => sel[o.id]);
    if (chosen.length === 0) continue;
    if (g.mode === "or") {
      parts.push(
        chosen.length === 1
          ? `"${chosen[0].regex}"`
          : `"(${chosen.map((o) => o.regex).join("|")})"`
      );
    } else {
      parts.push(...chosen.map((o) => `"${o.regex}"`));
    }
  }
  return parts.join(" ");
}

export default function Vendor() {
  const { lang, t } = useLang();
  const [data, setData] = useState<VendorData | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [ilvl, setIlvl] = useState({ min: 0, max: 0 });
  const [clvl, setClvl] = useState({ min: 0, max: 0 });

  useEffect(() => {
    loadVendor().then(setData);
  }, []);

  const regex = useMemo(() => {
    const parts: string[] = [];
    if (data) { const r = buildVendorRegex(data.groups, sel); if (r) parts.push(r); }
    const il = levelRange(ilvl.min, ilvl.max, "物品等级.*"); // frag from ClientStrings "物品等级 {0}"
    if (il) parts.push(`"${il}"`);
    const cl = levelRange(clvl.min, clvl.max, "需求.*等级.*"); // requires-level, in-game format unverified
    if (cl) parts.push(`"${cl}"`);
    return parts.join(" ");
  }, [data, sel, ilvl, clvl]);

  const reset = () => { setSel({}); setIlvl({ min: 0, max: 0 }); setClvl({ min: 0, max: 0 }); };

  return (
    <div className="page">
      <h1>{t("vendor_title")}</h1>
      <p className="intro">{t("vendor_intro")}</p>

      <ResultBar regex={regex} onReset={reset} />
      <p className="note warn">{t("vendor_warn")}</p>

      <div className="group two-col">
        <div>
          <h3 className="group-title">{t("vendor_ilvl")}</h3>
          <div className="minmax">
            <label>{t("min")}<input type="number" min={0} max={100} value={ilvl.min || ""}
              onChange={(e) => setIlvl((s) => ({ ...s, min: +e.target.value }))} /></label>
            <label>{t("max")}<input type="number" min={0} max={100} value={ilvl.max || ""}
              onChange={(e) => setIlvl((s) => ({ ...s, max: +e.target.value }))} /></label>
          </div>
        </div>
        <div>
          <h3 className="group-title">{t("vendor_clvl")}<span className="tag">?</span></h3>
          <div className="minmax">
            <label>{t("min")}<input type="number" min={0} max={100} value={clvl.min || ""}
              onChange={(e) => setClvl((s) => ({ ...s, min: +e.target.value }))} /></label>
            <label>{t("max")}<input type="number" min={0} max={100} value={clvl.max || ""}
              onChange={(e) => setClvl((s) => ({ ...s, max: +e.target.value }))} /></label>
          </div>
        </div>
      </div>

      {data?.groups.map((g) => (
        <div key={g.id} className="group">
          <h3 className="group-title">
            {lang === "zh" ? g.labelZh : g.labelEn}
            <span className="group-mode">{g.mode === "or" ? "OR" : "AND"}</span>
          </h3>
          <div className="chip-row">
            {g.options.map((o) => {
              const on = sel[o.id];
              return (
                <button
                  key={o.id}
                  className={"chip" + (on ? " on" : "") + (o.confidence === "check" ? " check" : "")}
                  onClick={() => setSel((s) => ({ ...s, [o.id]: !s[o.id] }))}
                  title={
                    (lang === "zh" ? o.en : o.zh) +
                    (o.confidence === "check" ? " — " + t("needsCheck") : "")
                  }
                >
                  {lang === "zh" ? o.zh : o.en}
                  {o.confidence === "check" && <span className="chip-flag">?</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
