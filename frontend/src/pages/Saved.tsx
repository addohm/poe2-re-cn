import { useRef, useState } from "react";
import { useSaved, removeSaved, updateSaved, importSaved, type SavedRegex } from "../lib/saved";
import { useLang } from "../i18n";

const TOOL_LABEL: Record<string, { zh: string; en: string }> = {
  waystone: { zh: "地图", en: "Waystone" },
  tablet: { zh: "碑牌", en: "Tablet" },
  item: { zh: "物品", en: "Item" },
  relic: { zh: "圣物", en: "Relic" },
  vendor: { zh: "商店", en: "Vendor" },
};

export default function Saved() {
  const { lang, t } = useLang();
  const list = useSaved();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const copy = (e: SavedRegex) => {
    navigator.clipboard.writeText(e.regex);
    setCopiedId(e.id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "poe2re-saved.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImportFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data)) importSaved(data);
      } catch { /* ignore malformed */ }
    };
    reader.readAsText(f);
  };

  return (
    <div className="page">
      <h1>{t("saved_title")}</h1>
      <p className="intro">{t("saved_intro")}</p>

      <div className="controls">
        <button onClick={exportJson} disabled={!list.length}>{t("export")}</button>
        <button onClick={() => fileRef.current?.click()}>{t("import")}</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && onImportFile(e.target.files[0])} />
        <span className="count">{list.length}</span>
      </div>

      {!list.length && <p className="note">{t("saved_empty")}</p>}

      <div className="saved-list">
        {list.map((e) => {
          const tl = TOOL_LABEL[e.tool];
          return (
            <div key={e.id} className="saved-card">
              <div className="saved-head">
                <input className="saved-name" value={e.name}
                  onChange={(ev) => updateSaved(e.id, { name: ev.target.value })} />
                {tl && <span className="tag">{lang === "zh" ? tl.zh : tl.en}</span>}
                <div className="saved-actions">
                  <button className="link" onClick={() => copy(e)}>{copiedId === e.id ? t("copied") : t("copy")}</button>
                  <button className="link del" onClick={() => removeSaved(e.id)}>{t("delete")}</button>
                </div>
              </div>
              <code className="output saved-regex">{e.regex}</code>
              <input className="saved-note" placeholder={t("saveNote")} value={e.note}
                onChange={(ev) => updateSaved(e.id, { note: ev.target.value })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
