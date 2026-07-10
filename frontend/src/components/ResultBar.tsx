import { useState, type ReactNode } from "react";
import { useLang } from "../i18n";

const MAX_LEN = 250; // PoE in-game search hard limit

/** Shared output bar: regex display + length/250 counter + Copy/Reset, and a
 * collapsible options panel (custom text lives here, plus any extra children). */
export default function ResultBar({
  regex,
  onReset,
  customText,
  onCustomText,
  options,
}: {
  regex: string;
  onReset?: () => void;
  customText?: string;
  onCustomText?: (v: string) => void;
  options?: ReactNode; // extra controls in the options panel (e.g. round-down)
}) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const over = regex.length > MAX_LEN;

  return (
    <div className="resultbar">
      <div className="output-bar">
        <code className="output">{regex || t("emptyOutput")}</code>
        <div className="output-actions">
          <button onClick={copy} disabled={!regex}>
            {copied ? t("copied") : t("copy")}
          </button>
          {onReset && (
            <button onClick={onReset} className="reset">
              {t("reset")}
            </button>
          )}
        </div>
      </div>
      <div className="result-meta">
        <span className={"length" + (over ? " over" : "")}>
          {t("length")}: {regex.length} / {MAX_LEN}
          {over && " — " + t("tooLong")}
        </span>
        {(onCustomText || options) && (
          <button className="link" onClick={() => setShowOptions((v) => !v)}>
            {showOptions ? t("hideOptions") : t("showOptions")}
          </button>
        )}
      </div>
      {showOptions && (
        <div className="options-panel">
          {onCustomText && (
            <input
              className="search"
              placeholder={t("customText")}
              value={customText ?? ""}
              onChange={(e) => onCustomText(e.target.value)}
            />
          )}
          {options}
        </div>
      )}
    </div>
  );
}
