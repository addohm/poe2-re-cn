import { useEffect, useMemo, useState } from "react";
import { loadRelic, type ModToken } from "../data";
import { valueFrag } from "../lib/numeric";
import ResultBar from "../components/ResultBar";
import { useLang } from "../i18n";

// CN port of poe2.re's relic builder Lv: prefixes/suffixes each OR-joined; then
// matchType "any" -> one quoted OR of both; "both" -> prefix-group AND suffix-group.
export default function Relic() {
  const { lang, t } = useLang();
  const [tokens, setTokens] = useState<ModToken[]>([]);
  const [sel, setSel] = useState<Record<number, boolean>>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [matchType, setMatchType] = useState<"any" | "both">("any");

  useEffect(() => { loadRelic().then((d) => setTokens(d.tokens)); }, []);

  const disp = (tk: ModToken) => (lang === "zh" ? tk.zhText : tk.en);
  const prefixes = useMemo(() => tokens.filter((t) => t.options.prefix), [tokens]);
  const suffixes = useMemo(() => tokens.filter((t) => !t.options.prefix), [tokens]);

  const frag = (tk: ModToken) => {
    const v = values[tk.id];
    return v && v.trim() !== "" ? valueFrag(tk.regex, v) : tk.regex;
  };

  const regex = useMemo(() => {
    const pre = prefixes.filter((t) => sel[t.id]).map(frag).join("|");
    const suf = suffixes.filter((t) => sel[t.id]).map(frag).join("|");
    const groups = [pre, suf].filter((x) => x !== "");
    if (!groups.length) return "";
    return matchType === "any"
      ? `"${groups.join("|")}"`
      : groups.map((g) => `"${g}"`).join(" ");
  }, [prefixes, suffixes, sel, values, matchType]);

  const reset = () => { setSel({}); setValues({}); setMatchType("any"); };

  const renderList = (list: ModToken[]) => (
    <ul className="mod-list">
      {list.map((tk) => {
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
  );

  return (
    <div className="page">
      <h1>{t("relic_title")}</h1>
      <p className="intro">{t("relic_intro")}</p>

      <ResultBar regex={regex} tool="relic" onReset={reset} />

      <div className="controls">
        <div className="seg">
          <button className={matchType === "any" ? "on" : ""} onClick={() => setMatchType("any")}>{t("relic_any")}</button>
          <button className={matchType === "both" ? "on" : ""} onClick={() => setMatchType("both")}>{t("relic_both")}</button>
        </div>
      </div>

      <div className="group two-col">
        <div>
          <h3 className="group-title">{t("prefix")}</h3>
          {renderList(prefixes)}
        </div>
        <div>
          <h3 className="group-title">{t("suffix")}</h3>
          {renderList(suffixes)}
        </div>
      </div>
    </div>
  );
}
