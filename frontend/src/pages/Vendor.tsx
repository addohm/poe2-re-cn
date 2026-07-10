import { useEffect, useMemo, useState } from "react";
import { loadVendor, type VendorData, type VendorGroup } from "../data";
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadVendor().then(setData);
  }, []);

  const regex = useMemo(
    () => (data ? buildVendorRegex(data.groups, sel) : ""),
    [data, sel]
  );

  const copy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const count = Object.values(sel).filter(Boolean).length;

  return (
    <div className="page">
      <h1>{t("vendor_title")}</h1>
      <p className="intro">{t("vendor_intro")}</p>

      <div className="output-bar">
        <code className="output">{regex || t("emptyOutput")}</code>
        <div className="output-actions">
          <button onClick={copy} disabled={!regex}>
            {copied ? t("copied") : t("copy")}
          </button>
          <button onClick={() => setSel({})} disabled={!count}>
            {t("clear")}
          </button>
        </div>
      </div>
      <p className="note">{t("regexNote")}</p>
      <p className="note warn">{t("vendor_warn")}</p>

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
