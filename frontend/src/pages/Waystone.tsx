import { useEffect, useMemo, useState } from "react";
import { loadWaystone, type ModToken } from "../data";
import { buildWaystoneRegex, type WaystoneState } from "../lib/waystoneRegex";
import {
  WAYSTONE_NUMERIC, WAYSTONE_RARITY, WAYSTONE_STATE, type Conf,
} from "../lib/waystoneConfig";
import ResultBar from "../components/ResultBar";
import { useLang } from "../i18n";

const flag = (c: Conf) => (c === "check" ? " ?" : "");

export default function Waystone() {
  const { lang, t } = useLang();
  const [tokens, setTokens] = useState<ModToken[]>([]);
  const [round10, setRound10] = useState(false);
  const [numeric, setNumeric] = useState<Record<string, string>>({});
  const [tier, setTier] = useState({ min: 1, max: 16 });
  const [revives, setRevives] = useState({ min: 0, max: 6 });
  const [rarity, setRarity] = useState<Record<string, boolean>>({});
  const [stateSel, setStateSel] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<Record<number, "wanted" | "unwanted">>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [wantedType, setWantedType] = useState<"any" | "all">("any");
  const [customText, setCustomText] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => { loadWaystone().then((d) => setTokens(d.tokens)); }, []);

  const disp = (tk: ModToken) => (lang === "zh" ? tk.zhText : tk.en);
  const sorted = useMemo(
    () => [...tokens].sort((a, b) => disp(a).localeCompare(disp(b), lang)),
    [tokens, lang]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((tk) => tk.en.toLowerCase().includes(q) || tk.zhText.includes(q)) : sorted;
  }, [sorted, query]);

  const wstate: WaystoneState = {
    round10, numeric, tier, revives, rarity, state: stateSel,
    wanted: tokens.filter((t) => sel[t.id] === "wanted").map((t) => ({ token: t, value: values[t.id] })),
    wantedType,
    unwanted: tokens.filter((t) => sel[t.id] === "unwanted"),
    customText,
  };
  const regex = useMemo(() => buildWaystoneRegex(wstate),
    [round10, numeric, tier, revives, rarity, stateSel, sel, values, wantedType, customText, tokens]);

  const reset = () => {
    setNumeric({}); setTier({ min: 1, max: 16 }); setRevives({ min: 0, max: 6 });
    setRarity({}); setStateSel({}); setSel({}); setValues({}); setCustomText("");
    setWantedType("any"); setRound10(false);
  };

  const cycle = (id: number) => setSel((s) => {
    const n = { ...s };
    if (!n[id]) n[id] = "wanted";
    else if (n[id] === "wanted") n[id] = "unwanted";
    else delete n[id];
    return n;
  });

  return (
    <div className="page">
      <h1>{t("waystone_title")}</h1>
      <p className="intro">{t("waystone_intro")}</p>

      <ResultBar
        regex={regex} onReset={reset}
        customText={customText} onCustomText={setCustomText}
        options={
          <label className="check-inline">
            <input type="checkbox" checked={round10} onChange={(e) => setRound10(e.target.checked)} />
            {t("roundDown")}
          </label>
        }
      />
      {WAYSTONE_RARITY.some((r) => r.conf === "check") && (
        <p className="note warn">{t("flaggedNote")}</p>
      )}

      {/* Rarity */}
      <div className="group">
        <h3 className="group-title">{t("ws_rarity")}</h3>
        <div className="chip-row">
          {WAYSTONE_RARITY.map((r) => (
            <button key={r.id}
              className={"chip" + (r.conf === "check" ? " check" : "") + (rarity[r.id] ? " on" : "")}
              onClick={() => setRarity((s) => ({ ...s, [r.id]: !s[r.id] }))}>
              {(lang === "zh" ? r.labelZh : r.labelEn) + flag(r.conf)}
            </button>
          ))}
        </div>
      </div>

      {/* Tier + Revives */}
      <div className="group two-col">
        <div>
          <h3 className="group-title">{t("ws_tier")}</h3>
          <div className="minmax">
            <label>{t("min")}<input type="number" min={1} max={16} value={tier.min}
              onChange={(e) => setTier((s) => ({ ...s, min: +e.target.value }))} /></label>
            <label>{t("max")}<input type="number" min={1} max={16} value={tier.max}
              onChange={(e) => setTier((s) => ({ ...s, max: +e.target.value }))} /></label>
          </div>
        </div>
        <div>
          <h3 className="group-title">{t("ws_revives")}</h3>
          <div className="minmax">
            <label>{t("min")}<input type="number" min={0} max={6} value={revives.min}
              onChange={(e) => setRevives((s) => ({ ...s, min: +e.target.value }))} /></label>
            <label>{t("max")}<input type="number" min={0} max={6} value={revives.max}
              onChange={(e) => setRevives((s) => ({ ...s, max: +e.target.value }))} /></label>
          </div>
        </div>
      </div>

      {/* Quantity & yield */}
      <div className="group">
        <h3 className="group-title">{t("ws_quantity")}</h3>
        <div className="numeric-grid">
          {WAYSTONE_NUMERIC.map((f) => (
            <label key={f.id} className="numeric-field">
              <span>{(lang === "zh" ? f.labelZh : f.labelEn) + flag(f.conf)}</span>
              <input type="number" min={0} placeholder="≥" value={numeric[f.id] ?? ""}
                onChange={(e) => setNumeric((s) => ({ ...s, [f.id]: e.target.value }))} />
            </label>
          ))}
        </div>
      </div>

      {/* State */}
      <div className="group">
        <h3 className="group-title">{t("ws_state")}</h3>
        <div className="chip-row">
          {WAYSTONE_STATE.map((o) => (
            <button key={o.id}
              className={"chip" + (o.conf === "check" ? " check" : "") + (stateSel[o.id] ? " on" : "")}
              onClick={() => setStateSel((s) => ({ ...s, [o.id]: !s[o.id] }))}>
              {(lang === "zh" ? o.labelZh : o.labelEn) + flag(o.conf)}
            </button>
          ))}
        </div>
      </div>

      {/* Mods */}
      <div className="group">
        <h3 className="group-title">{t("wantedMods")} / {t("unwantedMods")}</h3>
        <div className="controls">
          <input className="search" placeholder={t("search")} value={query}
            onChange={(e) => setQuery(e.target.value)} />
          <div className="seg">
            <button className={wantedType === "any" ? "on" : ""} onClick={() => setWantedType("any")}>{t("matchAny")}</button>
            <button className={wantedType === "all" ? "on" : ""} onClick={() => setWantedType("all")}>{t("matchAll")}</button>
          </div>
        </div>
        <ul className="mod-list">
          {filtered.map((tk) => {
            const st = sel[tk.id];
            return (
              <li key={tk.id} className={"mod" + (st ? " " + st : "")} title={lang === "zh" ? tk.en : tk.zhText}>
                <span className="mark-btn" onClick={() => cycle(tk.id)}>
                  <span className={"mark " + (st || "")} />
                </span>
                <span className="mod-text" onClick={() => cycle(tk.id)}>{disp(tk)}</span>
                {st === "wanted" && (
                  <input className="mod-value" type="number" placeholder="≥"
                    value={values[tk.id] ?? ""}
                    onClick={(e) => e.stopPropagation()}
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
