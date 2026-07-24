// Saved regexes — a personal library persisted in localStorage (this is a static
// site, so storage is per-browser; the Saved page offers JSON export/import for
// backup / moving between machines).
import { useSyncExternalStore } from "react";

export interface SavedRegex {
  id: string;
  name: string;
  note: string;
  regex: string;
  tool: string; // waystone | tablet | item | relic | vendor
  ts: number;
}

const KEY = "poe2re.saved";
const listeners = new Set<() => void>();
let cache: SavedRegex[] | null = null;

function read(): SavedRegex[] {
  if (cache === null) {
    try {
      cache = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      cache = [];
    }
  }
  return cache!;
}

function write(list: SavedRegex[]) {
  cache = list;
  localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l());
}

function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

export function addSaved(entry: Omit<SavedRegex, "id" | "ts">) {
  write([{ ...entry, id: genId(), ts: Date.now() }, ...read()]);
}
export function removeSaved(id: string) {
  write(read().filter((e) => e.id !== id));
}
export function updateSaved(id: string, patch: Partial<SavedRegex>) {
  write(read().map((e) => (e.id === id ? { ...e, ...patch } : e)));
}
export function importSaved(entries: SavedRegex[], replace = false) {
  const existing = replace ? [] : read();
  const seen = new Set(existing.map((e) => e.id));
  const merged = [...existing];
  for (const e of entries) {
    if (e && e.regex && !seen.has(e.id)) {
      merged.push({ ...e, id: e.id || genId(), ts: e.ts || Date.now() });
      seen.add(e.id);
    }
  }
  merged.sort((a, b) => b.ts - a.ts);
  write(merged);
}

export function useSaved(): SavedRegex[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    read
  );
}
