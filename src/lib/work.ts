import { WORK_TYPE_CONFIG, workHref } from "@/data/config";
import type { ContentType, Work } from "@/types";

export function workLink(work: Work): string {
  return workHref(work.type, work.slug);
}

export function actionLabel(type: ContentType): string {
  return WORK_TYPE_CONFIG[type].action;
}

export function typeLabel(type: ContentType): string {
  return WORK_TYPE_CONFIG[type].label;
}

export function coverRatio(type: ContentType): string {
  switch (type) {
    case "game":
      return "16 / 10";
    case "drama":
      return "9 / 16";
    case "novel":
      return "3 / 4";
    case "tutorial":
      return "16 / 10";
  }
}

export function metaLine(work: Work): string {
  switch (work.type) {
    case "game":
      return `${work.meta.minutes > 0 ? `${work.meta.minutes} 分钟 · ` : ""}${work.meta.genres.join(" / ")} · 难度${work.meta.difficulty}`;
    case "drama": {
      const seconds = work.meta.episodes.reduce((sum, ep) => sum + ep.seconds, 0);
      return `${work.meta.episodes.length} 集 · 共 ${Math.round(seconds / 60)} 分钟 · ${work.meta.status}`;
    }
    case "novel":
      return `${formatWords(work.meta.words)} · ${work.meta.status} · ${work.meta.pov}`;
    case "tutorial":
      return `${work.meta.minutes} 分钟 · ${work.meta.difficulty} · ${work.meta.steps.length} 步`;
  }
}

export function shortMeta(work: Work): string {
  switch (work.type) {
    case "game":
      return work.meta.minutes > 0 ? `${work.meta.minutes} 分钟` : (work.meta.genres[0] ?? "可试玩");
    case "drama":
      return `${work.meta.episodes.length} 集 · ${work.meta.status}`;
    case "novel":
      return `${formatWords(work.meta.words)} · ${work.meta.status}`;
    case "tutorial":
      return `${work.meta.minutes} 分钟 · ${work.meta.difficulty}`;
  }
}

export function formatWords(words: number): string {
  if (words >= 10000) {
    return `${(words / 10000).toFixed(1).replace(/\.0$/, "")} 万字`;
  }
  if (words >= 1000) {
    return `${(words / 1000).toFixed(1).replace(/\.0$/, "")} 千字`;
  }
  return `${Math.max(0, Math.round(words))} 字`;
}

export function episodeTotalMinutes(work: Extract<Work, { type: "drama" }>): number {
  return Math.round(work.meta.episodes.reduce((sum, ep) => sum + ep.seconds, 0) / 60);
}

export function totalLikes(works: Work[]): number {
  return works.reduce((sum, work) => sum + work.stats.likes, 0);
}

export function workByType(works: Work[], type: ContentType): Work[] {
  return works.filter((work) => work.type === type);
}
