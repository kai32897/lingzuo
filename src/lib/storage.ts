import { useCallback, useEffect, useState } from "react";

export const LS_KEYS = {
  searchHistory: "lz:search-history",
  liked: "lz:liked",
  saved: "lz:saved",
  followedCreators: "lz:followed-creators",
  followedCategories: "lz:followed-categories",
  dismissed: "lz:dismissed-works",
  progress: "lz:progress",
  drafts: "lz:drafts",
  publishedWorks: "lz:published-works",
  publishedForms: "lz:published-forms",
  workVersions: "lz:work-versions",
  trash: "lz:trash",
  userPosts: "lz:user-posts",
  userContents: "lz:user-contents",
  settings: "lz:settings",
  savedTools: "lz:saved-tools",
  savedRecipes: "lz:saved-recipes",
  comments: "lz:comments",
  commentLikes: "lz:comment-likes",
  likedComments: "lz:liked-comments",
  prefs: "lz:prefs",
  readChapters: "lz:read-chapters",
  watchProgress: "lz:watch-progress",
  followingDramas: "lz:following-dramas",
  tutorialProgress: "lz:tutorial-progress",
  readProgress: "lz:read-progress",
  readerNotes: "lz:reader-notes",
  readerPrefs: "lz:reader-prefs",
  gameHistory: "lz:game-history",
  bookshelf: "lz:bookshelf",
  savedCollections: "lz:saved-collections",
  followedTopics: "lz:followed-topics",
} as const;

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the demo should keep working in memory.
  }
}

export function useLocalStorage<T>(
  key: string,
  initial: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initial === "function" ? (initial as () => T)() : initial;
    return readLocal<T>(key, fallback);
  });

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeLocal(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
