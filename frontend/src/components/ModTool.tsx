import { useEffect, useMemo, useState } from "react";
import type { ModData, ModToken } from "../data";
import { buildModRegex, type SelectType } from "../lib/modRegex";
import { useLang } from "../i18n";

type Sel = Record<number, "wanted" | "unwanted">;

/** Generic mod/affix selection tool shared by Waystone and Tablet. Click a mod to
 * cycle: unset → wanted → unwanted → unset. Output is always the CN-text regex. */
export default function ModTool({
  load,
  titleKey,
  introKey,
}: {
  load: () => Promise<ModData>;
  titleKey: string;
  introKey: string;
}) {
  const { lang, t } = useLang();
  const [tokens, setTokens] = useState<ModToken[]>([]);
  const [sel, setSel] = useState<Sel>({});
  const [wantedType, setWantedType] = useState<SelectType>("any");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTokens([]);
    setSel({});
    load().then((d) => setTokens(d.tokens));
  }, [load]);

  const display = (tk: ModToken) => (lang === "zh" ? tk.zhText : tk.en);

  const sorted = useMemo(
    () => [...tokens].sort((a, b) => display(a).localeCompare(display(b), lang)),
    [tokens, lang]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (tk) => tk.en.toLowerCase().includes(q) || tk.zhText.includes(q)
    );
  }, [sorted, query]);

  const wanted = tokens.filter((tk) => sel[tk.id] === "wanted");
  const unwanted = tokens.filter((tk) => sel[tk.id] === "unwanted");

  const regex = useMemo(
    () => buildModRegex({ wanted, wantedType, unwanted }),
    [sel, wantedType, tokens]
  );

  const cycle = (id: number) =>
    setSel((s) => {
      const cur = s[id];
      const next = { ...s };
      if (cur === undefined) next[id] = "wanted";
      else if (cur === "wanted") next[id] = "unwanted";
      else delete next[id];
      return next;
    });

  const copy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const selectedCount = wanted.length + unwanted.length;

  return (
    <div className="page">
      <h1>{t(titleKey)}</h1>
      <p className="intro">{t(introKey)}</p>

      <div className="output-bar">
        <code className="output">{regex || t("emptyOutput")}</code>
        <div className="output-actions">
          <button onClick={copy} disabled={!regex}>
            {copied ? t("copied") : t("copy")}
          </button>
          <button onClick={() => setSel({})} disabled={!selectedCount}>
            {t("clear")}
          </button>
        </div>
      </div>
      <p className="note">{t("regexNote")}</p>

      <div className="controls">
        <input
          className="search"
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="seg">
          <button
            className={wantedType === "any" ? "on" : ""}
            onClick={() => setWantedType("any")}
          >
            {t("matchAny")}
          </button>
          <button
            className={wantedType === "all" ? "on" : ""}
            onClick={() => setWantedType("all")}
          >
            {t("matchAll")}
          </button>
        </div>
        <span className="count">
          {selectedCount} {t("selectedCount")}
        </span>
      </div>

      <ul className="mod-list">
        {filtered.map((tk) => {
          const state = sel[tk.id];
          return (
            <li
              key={tk.id}
              className={"mod" + (state ? " " + state : "")}
              onClick={() => cycle(tk.id)}
              title={lang === "zh" ? tk.en : tk.zhText}
            >
              <span className={"mark " + (state || "")} />
              <span className="mod-text">{display(tk)}</span>
              <code className="mod-regex">{tk.regex}</code>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
