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
  const [sel, setSel] = useState<Record<number, "wanted" | "unwanted">>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [matchType, setMatchType] = useState<"any" | "both">("any");

  const cycle = (id: number) => setSel((s) => {
    const n = { ...s };
    if (!n[id]) n[id] = "wanted";
    else if (n[id] === "wanted") n[id] = "unwanted";
    else delete n[id];
    return n;
  });

  useEffect(() => { loadRelic().then((d) => setTokens(d.tokens)); }, []);

  const disp = (tk: ModToken) => (lang === "zh" ? tk.zhText : tk.en);
  const prefixes = useMemo(() => tokens.filter((t) => t.options.prefix), [tokens]);
  const suffixes = useMemo(() => tokens.filter((t) => !t.options.prefix), [tokens]);

  const frag = (tk: ModToken) => {
    const v = values[tk.id];
    return v && v.trim() !== "" ? valueFrag(tk.regex, v) : tk.regex;
  };

  const regex = useMemo(() => {
    const pre = prefixes.filter((t) => sel[t.id] === "wanted").map(frag).join("|");
    const suf = suffixes.filter((t) => sel[t.id] === "wanted").map(frag).join("|");
    const groups = [pre, suf].filter((x) => x !== "");
    const wanted = matchType === "any"
      ? (groups.length ? `"${groups.join("|")}"` : "")
      : groups.map((g) => `"${g}"`).join(" ");
    const unwanted = tokens.filter((t) => sel[t.id] === "unwanted").map((t) => t.regex);
    const parts = [wanted, unwanted.length ? `"!${unwanted.join("|")}"` : ""].filter(Boolean);
    return parts.join(" ").trim();
  }, [prefixes, suffixes, tokens, sel, values, matchType]);

  const reset = () => { setSel({}); setValues({}); setMatchType("any"); };

  const renderList = (list: ModToken[]) => (
    <ul className="mod-list">
      {list.map((tk) => {
        const st = sel[tk.id];
        return (
          <li key={tk.id} className={"mod" + (st ? " " + st : "")} title={lang === "zh" ? tk.en : tk.zhText}>
            <span className="mark-btn" onClick={() => cycle(tk.id)}>
              <span className={"mark " + (st || "")} />
            </span>
            <span className="mod-text" onClick={() => cycle(tk.id)}>{disp(tk)}</span>
            {st === "wanted" && (
              <input className="mod-value" type="number" placeholder="≥" value={values[tk.id] ?? ""}
                onClick={(e) => e.stopPropagation()}
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
      <p className="note">{t("cycleHint")}</p>

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
