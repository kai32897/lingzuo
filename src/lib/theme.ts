import { useEffect, useState } from "react";

export type ThemeId = "paper" | "night" | "mint" | "white";

export const THEMES: {
  id: ThemeId;
  label: string;
  desc: string;
  colors: string[];
}[] = [
  {
    id: "paper",
    label: "纸刊",
    desc: "暖白纸底，默认的编辑部气质。",
    colors: ["#f4f0e6", "#15130f", "#2f4bff"],
  },
  {
    id: "night",
    label: "夜刊",
    desc: "深色纸面，适合关灯读和刷剧。",
    colors: ["#141210", "#f4f0e6", "#93a1ff"],
  },
  {
    id: "mint",
    label: "薄荷",
    desc: "冷绿纸面，更轻、更实验室。",
    colors: ["#eaf6ef", "#102a20", "#0f6b52"],
  },
  {
    id: "white",
    label: "白页",
    desc: "纯白底、黑字和细线，最干净的版本。",
    colors: ["#ffffff", "#111111", "#2457ff"],
  },
];

const STORAGE_KEY = "lz:theme";

export function getTheme(): ThemeId {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.some((theme) => theme.id === value) ? (value as ThemeId) : "paper";
  } catch {
    return "paper";
  }
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "night" ? "dark" : "light";
  const colors: Record<ThemeId, string> = {
    paper: "#F4F0E6",
    night: "#141210",
    mint: "#EAF6EF",
    white: "#FFFFFF",
  };
  let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = colors[theme];
}

export function setTheme(theme: ThemeId): void {
  applyTheme(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may be unavailable; the visual switch still works for this page.
  }
  window.dispatchEvent(new CustomEvent<ThemeId>("lz:theme", { detail: theme }));
}

export function useTheme(): { theme: ThemeId; setTheme: (theme: ThemeId) => void } {
  const [theme, setLocalTheme] = useState<ThemeId>(() => getTheme());
  useEffect(() => {
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<ThemeId>).detail;
      if (next && THEMES.some((item) => item.id === next)) setLocalTheme(next);
    };
    window.addEventListener("lz:theme", onChange);
    return () => window.removeEventListener("lz:theme", onChange);
  }, []);
  return { theme, setTheme };
}
