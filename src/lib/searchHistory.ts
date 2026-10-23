import { LS_KEYS, readLocal, writeLocal } from "@/lib/storage";

export function getSearchHistory(): string[] {
  return readLocal<string[]>(LS_KEYS.searchHistory, []).slice(0, 8);
}

export function addSearchHistory(term: string): void {
  const clean = term.trim();
  if (!clean) return;
  const current = readLocal<string[]>(LS_KEYS.searchHistory, []);
  const next = [clean, ...current.filter((item) => item !== clean)].slice(0, 8);
  writeLocal(LS_KEYS.searchHistory, next);
}

export function clearSearchHistory(): void {
  writeLocal(LS_KEYS.searchHistory, []);
}
