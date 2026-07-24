import { useEffect, useMemo, useState } from "react";
import { loadItem, type ItemBasetype, type ItemData } from "../data";
import { buildModRegex, type SelectType } from "../lib/modRegex";
import { valueFrag } from "../lib/numeric";
import ResultBar from "../components/ResultBar";
import { useLang } from "../i18n";

const CAT_LABEL: Record<string, { zh: string; en: string }> = {
  prefix: { zh: "前缀", en: "Prefix" },
  suffix: { zh: "后缀", en: "Suffix" },
  corrupted: { zh: "腐化", en: "Corrupted" },
  unique: { zh: "传奇", en: "Unique" },
};

export default function Item() {
  const { lang, t } = useLang();
  const [data, setData] = useState<ItemData | null>(null);
  const [query, setQuery] = useState("");
  const [base, setBase] = useState<ItemBasetype | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [wantedType, setWantedType] = useState<SelectType>("all");

  useEffect(() => {
    loadItem().then(setData);
  }, []);

  // Flatten every base item -> its basetype, for the search box. Searchable by
  // both English and Chinese regardless of the current UI language.
  const searchIndex = useMemo(() => {
    if (!data) return [];
    const rows: { en: string; zh: string; bt: ItemBasetype; hay: string }[] = [];
    for (const bt of data.basetypes) {
      const items = new Map<string, string>();
      for (const g of bt.groups) for (const bi of g.baseItems) items.set(bi.en, bi.zh);
      for (const [en, zh] of items) {
        rows.push({
          en: `${en} (${bt.base})`,
          zh: `${zh}（${bt.baseZh}）`,
          bt,
          hay: `${en} ${bt.base} ${zh} ${bt.baseZh}`.toLowerCase(),
        });
      }
    }
    return rows;
  }, [data]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((r) => r.hay.includes(q)).slice(0, 40);
  }, [searchIndex, query]);

  const rowLabel = (r: { en: string; zh: string }) => (lang === "zh" ? r.zh : r.en);

  // Unique key per modifier row.
  const modKey = (cat: string, i: number) => `${cat}:${i}`;

  const selectedMods = useMemo(() => {
    if (!base) return [];
    const out: { regex: string }[] = [];
    base.groups.forEach((g) =>
      g.modifiers.forEach((m, i) => {
        const k = modKey(g.cat, i);
        if (!sel[k]) return;
        const v = values[k];
        out.push({ regex: v && v.trim() !== "" ? valueFrag(m.regex, v) : m.regex });
      })
    );
    return out;
  }, [base, sel, values]);

  const regex = useMemo(
    () => buildModRegex({ wanted: selectedMods as any, wantedType, unwanted: [] }),
    [selectedMods, wantedType]
  );

  const pick = (bt: ItemBasetype, label: string) => {
    setBase(bt);
    setSel({});
    setQuery(label);
  };

  return (
    <div className="page">
      <h1>{t("item_title")}</h1>
      <p className="intro">{t("item_intro")}</p>

      <div className="controls">
        <div className="search-wrap">
          <input
            className="search"
            placeholder={t("item_search")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setBase(null);
            }}
          />
          {matches.length > 0 && !base && (
            <div className="dropdown">
              {matches.map((r, i) => (
                <div key={i} className="dropdown-item" onClick={() => pick(r.bt, rowLabel(r))}>
                  {rowLabel(r)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {base && (
        <>
          <ResultBar regex={regex} tool="item" onReset={() => { setSel({}); setValues({}); }} />
          <p className="note">{t("regexNote")}</p>

          <div className="controls">
            <div className="seg">
              <button className={wantedType === "all" ? "on" : ""} onClick={() => setWantedType("all")}>
                {t("matchAll")}
              </button>
              <button className={wantedType === "any" ? "on" : ""} onClick={() => setWantedType("any")}>
                {t("matchAny")}
              </button>
            </div>
            <span className="count">
              {selectedMods.length} {t("selectedCount")}
            </span>
          </div>

          {base.groups.map((g) => (
            <div key={g.cat} className="group">
              <h3 className="group-title">{(CAT_LABEL[g.cat] ?? { zh: g.cat, en: g.cat })[lang]}</h3>
              <ul className="mod-list">
                {g.modifiers.map((m, i) => {
                  const k = modKey(g.cat, i);
                  const on = sel[k];
                  return (
                    <li
                      key={k}
                      className={"mod" + (on ? " wanted" : "")}
                      onClick={() => setSel((s) => ({ ...s, [k]: !s[k] }))}
                      title={lang === "zh" ? m.en : m.zhText}
                    >
                      <span className={"mark " + (on ? "wanted" : "")} />
                      <span className="mod-text">{lang === "zh" ? m.zhText : m.en}</span>
                      {on && (
                        <input className="mod-value" type="number" placeholder="≥"
                          value={values[k] ?? ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} />
                      )}
                      <code className="mod-regex">{m.regex}</code>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
