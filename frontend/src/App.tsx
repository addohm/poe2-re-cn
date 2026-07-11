import { NavLink, Route, Routes } from "react-router-dom";
import { useLang } from "./i18n";
import Waystone from "./pages/Waystone";
import Tablet from "./pages/Tablet";
import Relic from "./pages/Relic";
import Item from "./pages/Item";
import Vendor from "./pages/Vendor";
import Translate from "./pages/Translate";

const NAV: { to: string; key: string; ready: boolean }[] = [
  { to: "/vendor", key: "nav_vendor", ready: true },
  { to: "/waystone", key: "nav_waystone", ready: true },
  { to: "/tablet", key: "nav_tablet", ready: true },
  { to: "/relic", key: "nav_relic", ready: true },
  { to: "/item", key: "nav_item", ready: true },
  { to: "/translate", key: "nav_translate", ready: true },
];

export default function App() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">{t("appTitle")}</div>
          <div className="brand-sub">{t("appSubtitle")}</div>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                "nav-item" + (isActive ? " active" : "") + (n.ready ? "" : " disabled")
              }
            >
              <span>{t(n.key)}</span>
              {!n.ready && <span className="tag">{t("comingSoon")}</span>}
            </NavLink>
          ))}
        </nav>
        <button className="lang-toggle" onClick={() => setLang(lang === "zh" ? "en" : "zh")}>
          {t("langToggle")}
        </button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Waystone />} />
          <Route path="/waystone" element={<Waystone />} />
          <Route path="/vendor" element={<Vendor />} />
          <Route path="/tablet" element={<Tablet />} />
          <Route path="/relic" element={<Relic />} />
          <Route path="/item" element={<Item />} />
          <Route path="/translate" element={<Translate />} />
        </Routes>
      </main>
    </div>
  );
}
