import { useEffect, useMemo, useState } from "react";
import { loadTranslator, translateItem } from "../lib/itemTranslate";
import { useLang } from "../i18n";

export default function Translate() {
  const { lang, t } = useLang();
  const [built, setBuilt] = useState<Awaited<ReturnType<typeof loadTranslator>> | null>(null);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTranslator(import.meta.env.BASE_URL).then(setBuilt);
  }, []);

  // Translate toward the current UI language (EN mode -> render CN items in English).
  const target = lang === "zh" ? "zh" : "en";
  const output = useMemo(
    () => (built && input.trim() ? translateItem(input, target, built) : ""),
    [built, input, target]
  );

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="page">
      <h1>{t("translate_title")}</h1>
      <p className="intro">{t("translate_intro")}</p>
      {!built && <p className="note">{t("translate_loading")}</p>}

      <div className="translate-grid">
        <div className="translate-col">
          <div className="translate-head">
            <span>{t("translate_in")}</span>
            {input && (
              <button className="link" onClick={() => setInput("")}>{t("clear")}</button>
            )}
          </div>
          <textarea
            className="translate-box"
            placeholder={t("translate_placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="translate-col">
          <div className="translate-head">
            <span>{t("translate_out")} ({lang === "zh" ? "中文" : "English"})</span>
            {output && (
              <button className="link" onClick={copy}>{copied ? t("copied") : t("copy")}</button>
            )}
          </div>
          <pre className="translate-box out">{output || t("translate_outempty")}</pre>
        </div>
      </div>
    </div>
  );
}
