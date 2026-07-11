import { useEffect, useMemo, useState } from "react";
import { loadTablet, type ModToken } from "../data";
import { buildTabletRegex, type TabletState } from "../lib/tabletRegex";
import { TABLET_RARITY, TABLET_TYPES } from "../lib/tabletConfig";
import ResultBar from "../components/ResultBar";
import { useLang } from "../i18n";

export default function Tablet() {
  const { lang, t } = useLang();
  const [tokens, setTokens] = useState<ModToken[]>([]);
  const [round10, setRound10] = useState(false);
  const [rarity, setRarity] = useState<Record<string, boolean>>({});
  const [types, setTypes] = useState<Record<string, boolean>>({});
  const [usesEnabled, setUsesEnabled] = useState(false);
  const [uses, setUses] = useState("10");
  const [sel, setSel] = useState<Record<number, boolean>>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [affixType, setAffixType] = useState<"any" | "all">("any");
  const [customText, setCustomText] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => { loadTablet().then((d) => setTokens(d.tokens)); }, []);

  const disp = (tk: ModToken) => (lang === "zh" ? tk.zhText : tk.en);
  const sorted = useMemo(
    () => [...tokens].sort((a, b) => disp(a).localeCompare(disp(b), lang)), [tokens, lang]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((tk) => tk.en.toLowerCase().includes(q) || tk.zhText.includes(q)) : sorted;
  }, [sorted, query]);

  const tstate: TabletState = {
    round10, rarity, types, usesEnabled, uses,
    affixes: tokens.filter((t) => sel[t.id]).map((t) => ({ token: t, value: values[t.id] })),
    affixType, customText,
  };
  const regex = useMemo(() => buildTabletRegex(tstate),
    [round10, rarity, types, usesEnabled, uses, sel, values, affixType, customText, tokens]);

  const reset = () => {
    setRarity({}); setTypes({}); setUsesEnabled(false); setUses("10");
    setSel({}); setValues({}); setCustomText(""); setAffixType("any"); setRound10(false);
  };

  return (
    <div className="page">
      <h1>{t("tablet_title")}</h1>
      <p className="intro">{t("tablet_intro")}</p>

      <ResultBar regex={regex} onReset={reset} customText={customText} onCustomText={setCustomText}
        options={
          <label className="check-inline">
            <input type="checkbox" checked={round10} onChange={(e) => setRound10(e.target.checked)} />
            {t("roundDown")}
          </label>
        } />
      {TABLET_TYPES.some((r) => r.conf === "check") && (
        <p className="note warn">{t("flaggedNote")}</p>
      )}

      <div className="group two-col">
        <div>
          <h3 className="group-title">{t("tb_rarity")}</h3>
          <div className="chip-row">
            {TABLET_RARITY.map((r) => (
              <button key={r.id} className={"chip" + (r.conf === "check" ? " check" : "") + (rarity[r.id] ? " on" : "")}
                onClick={() => setRarity((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                {(lang === "zh" ? r.labelZh : r.labelEn) + (r.conf === "check" ? " ?" : "")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="group-title">{t("tb_uses")}</h3>
          <label className="check-inline">
            <input type="checkbox" checked={usesEnabled} onChange={(e) => setUsesEnabled(e.target.checked)} />
            <input type="number" min={1} max={18} value={uses} style={{ width: "4.5rem" }}
              onChange={(e) => setUses(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="group">
        <h3 className="group-title">{t("tb_type")}</h3>
        <div className="chip-row">
          {TABLET_TYPES.map((r) => (
            <button key={r.id} className={"chip" + (r.conf === "check" ? " check" : "") + (types[r.id] ? " on" : "")}
              onClick={() => setTypes((s) => ({ ...s, [r.id]: !s[r.id] }))}>
              {(lang === "zh" ? r.labelZh : r.labelEn) + (r.conf === "check" ? " ?" : "")}
            </button>
          ))}
        </div>
      </div>

      <div className="group">
        <h3 className="group-title">{t("wantedMods")}</h3>
        <div className="controls">
          <input className="search" placeholder={t("search")} value={query}
            onChange={(e) => setQuery(e.target.value)} />
          <div className="seg">
            <button className={affixType === "any" ? "on" : ""} onClick={() => setAffixType("any")}>{t("matchAny")}</button>
            <button className={affixType === "all" ? "on" : ""} onClick={() => setAffixType("all")}>{t("matchAll")}</button>
          </div>
        </div>
        <ul className="mod-list">
          {filtered.map((tk) => {
            const on = sel[tk.id];
            return (
              <li key={tk.id} className={"mod" + (on ? " wanted" : "")} title={lang === "zh" ? tk.en : tk.zhText}>
                <span className="mark-btn" onClick={() => setSel((s) => ({ ...s, [tk.id]: !s[tk.id] }))}>
                  <span className={"mark " + (on ? "wanted" : "")} />
                </span>
                <span className="mod-text" onClick={() => setSel((s) => ({ ...s, [tk.id]: !s[tk.id] }))}>{disp(tk)}</span>
                {on && (
                  <input className="mod-value" type="number" placeholder="≥" value={values[tk.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [tk.id]: e.target.value }))} />
                )}
                <code className="mod-regex">{tk.regex}</code>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
