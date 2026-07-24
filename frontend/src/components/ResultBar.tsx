import { useState, type ReactNode } from "react";
import { useLang } from "../i18n";
import { addSaved } from "../lib/saved";

const MAX_LEN = 250; // PoE in-game search hard limit

/** Shared output bar: regex display + length/250 counter + Copy/Save/Reset, and a
 * collapsible options panel (custom text lives here, plus any extra children). */
export default function ResultBar({
  regex,
  tool,
  onReset,
  customText,
  onCustomText,
  options,
}: {
  regex: string;
  tool?: string; // which tool this regex came from (stored with saves)
  onReset?: () => void;
  customText?: string;
  onCustomText?: (v: string) => void;
  options?: ReactNode;
}) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const doSave = () => {
    if (!regex) return;
    addSaved({ name: name.trim() || regex.slice(0, 30), note: note.trim(), regex, tool: tool || "" });
    setName(""); setNote(""); setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
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
          <button onClick={() => setSaving((v) => !v)} disabled={!regex}>
            {savedMsg ? t("saved") : t("save")}
          </button>
          {onReset && (
            <button onClick={onReset} className="reset">
              {t("reset")}
            </button>
          )}
        </div>
      </div>

      {saving && (
        <div className="save-form">
          <input className="search" placeholder={t("saveName")} value={name}
            autoFocus onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSave()} />
          <input className="search" placeholder={t("saveNote")} value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSave()} />
          <button className="on" onClick={doSave}>{t("save")}</button>
          <button onClick={() => setSaving(false)}>{t("cancel")}</button>
        </div>
      )}

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
