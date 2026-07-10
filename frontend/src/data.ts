// Types + loaders for the generated CN data files (produced by scripts/gen_*.py).

// Waystone map mods and Tablet affixes share this schema (both come from the
// stat-id crosswalk pipeline).
export interface ModToken {
  id: number;
  en: string; // english rendered line
  zh: string; // chinese template (with {0} placeholders)
  zhText: string; // chinese, placeholders as '#'
  regex: string; // distinguishing chinese snippet (the in-game search regex)
  ranges: [number, number][];
  options: {
    name: string | null;
    nameZh: string | null;
    prefix: boolean;
    tags: string[];
  };
}

export interface ModData {
  tokens: ModToken[];
}

// base "./" in vite.config keeps this relative to the deployed root.
const GEN = import.meta.env.BASE_URL + "generated/";

const cache: Record<string, Promise<ModData>> = {};
function load(file: string): Promise<ModData> {
  if (!cache[file]) {
    cache[file] = fetch(GEN + file).then((r) => {
      if (!r.ok) throw new Error("failed to load " + file);
      return r.json();
    });
  }
  return cache[file];
}

export const loadWaystone = () => load("Generated.Waystone.CN.json");
export const loadTablet = () => load("Generated.Tablet.CN.json");
export const loadRelic = () => load("Generated.Relic.CN.json");

// ---- Item tool (different shape) ----
export interface ItemMod {
  en: string;
  zh: string;
  zhText: string;
  regex: string;
  partial: boolean;
}
export interface ItemGroup {
  cat: string; // prefix | suffix | corrupted | unique
  baseItems: { en: string; zh: string }[];
  modifiers: ItemMod[];
}
export interface ItemBasetype {
  base: string;
  baseZh: string;
  groups: ItemGroup[];
}
export interface ItemData {
  basetypes: ItemBasetype[];
}

// ---- Vendor tool ----
export interface VendorOption {
  id: string;
  en: string;
  zh: string;
  regex: string;
  confidence: "high" | "check";
}
export interface VendorGroup {
  id: string;
  labelEn: string;
  labelZh: string;
  mode: "and" | "or";
  options: VendorOption[];
}
export interface VendorData {
  groups: VendorGroup[];
}

let vendorCache: Promise<VendorData> | null = null;
export function loadVendor(): Promise<VendorData> {
  if (!vendorCache) {
    vendorCache = fetch(GEN + "Generated.Vendor.CN.json").then((r) => {
      if (!r.ok) throw new Error("failed to load vendor data");
      return r.json();
    });
  }
  return vendorCache;
}

let itemCache: Promise<ItemData> | null = null;
export function loadItem(): Promise<ItemData> {
  if (!itemCache) {
    itemCache = fetch(GEN + "Generated.Item.CN.json").then((r) => {
      if (!r.ok) throw new Error("failed to load item data");
      return r.json();
    });
  }
  return itemCache;
}
