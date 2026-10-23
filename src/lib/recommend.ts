import { works } from "@/data/seed";
import type { Work } from "@/types";
import { readLocal, LS_KEYS } from "@/lib/storage";

const REASONS: Record<string, string> = {
  "w-d-1": "今日灵作 · 今天刚更新",
  "w-n-1": "本周被二创 26 次，最长的一条链有 4 件作品",
  "w-g-1": "只有两个按钮，8 分钟能玩完",
  "w-t-1": "新手上路 · 25 分钟做出 30 秒短片",
  "w-g-2": "和《纸人今晚出嫁》同一个「十三楼宇宙」",
  "w-d-2": "完结了 · 4 集，共 12 分钟",
  "w-n-2": "完结 · 双视角 · 8.2 万字",
  "w-t-2": "零代码 · 跟着做能做出能点的网页",
  "w-g-5": "修仙 + 跑腿，昨天刚上首页",
  "w-n-3": "本周评论最多的小说",
  "w-d-4": "编辑精选 · 民俗悬疑",
  "w-t-4": "角色卡模板可以直接复制",
  "w-g-4": "《便利店夜班》作者的新作",
  "w-d-3": "一镜到底 · 3 分钟看完",
  "w-n-4": "雨天限定 · 6.8 万字完结",
  "w-g-3": "5 分钟解谜 · 不用动脑",
  "w-t-3": "把小说变成有声剧",
};

const CURATED_ORDER = [
  "w-d-1",
  "w-n-1",
  "w-g-1",
  "w-t-1",
  "w-g-2",
  "w-d-2",
  "w-t-2",
  "w-g-5",
  "w-n-2",
  "w-d-4",
  "w-t-4",
  "w-g-4",
  "w-n-3",
  "w-d-3",
  "w-t-3",
  "w-g-3",
  "w-n-4",
];

export interface Recommendation {
  work: Work;
  reason: string;
}

function orderedPool(offset: number): Work[] {
  const byId = new Map(works.map((work) => [work.id, work]));
  const base = CURATED_ORDER.map((id) => byId.get(id)).filter((work): work is Work => Boolean(work));
  for (const work of works) {
    if (!base.some((item) => item.id === work.id)) base.push(work);
  }
  return [...base.slice(offset), ...base.slice(0, offset)];
}

/** Picks a diverse set: at most 2 consecutive of a type, no adjacent same author. */
export function buildRecommendations(options: {
  offset?: number;
  explore?: boolean;
  count?: number;
}): Recommendation[] {
  const count = options.count ?? 6;
  const offset = options.offset ?? 0;
  const dismissed = readLocal<string[]>(LS_KEYS.dismissed, []);
  const pool = orderedPool(offset).filter((work) => !dismissed.includes(work.id));
  if (options.explore) {
    // Push less-recently-featured formats to the front for a different flavor.
    pool.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type.localeCompare(b.type);
    });
  }
  const picked: Work[] = [];
  let lastType = "";
  let streak = 0;
  let lastAuthor = "";
  const deferred: Work[] = [];

  const passes = [
    (work: Work) => {
      const sameStreak = work.type === lastType ? streak + 1 : 1;
      return sameStreak <= 2 && work.authorHandle !== lastAuthor;
    },
    (work: Work) => {
      const sameStreak = work.type === lastType ? streak + 1 : 1;
      return sameStreak <= 2;
    },
    () => true,
  ];

  for (const allowed of passes) {
    for (const work of pool) {
      if (picked.length >= count) break;
      if (picked.some((item) => item.id === work.id)) continue;
      if (!allowed(work)) {
        if (!deferred.some((item) => item.id === work.id)) deferred.push(work);
        continue;
      }
      picked.push(work);
      if (work.type === lastType) streak += 1;
      else {
        lastType = work.type;
        streak = 1;
      }
      lastAuthor = work.authorHandle;
    }
    if (picked.length >= count) break;
  }

  return picked.map((work) => ({
    work,
    reason: REASONS[work.id] ?? "编辑觉得，这件值得看一眼",
  }));
}

export function dismissWork(id: string): void {
  const dismissed = readLocal<string[]>(LS_KEYS.dismissed, []);
  if (!dismissed.includes(id)) {
    const next = [...dismissed, id];
    window.localStorage.setItem(LS_KEYS.dismissed, JSON.stringify(next.slice(-30)));
  }
}

export function restoreWork(id: string): void {
  const dismissed = readLocal<string[]>(LS_KEYS.dismissed, []);
  const next = dismissed.filter((item) => item !== id);
  window.localStorage.setItem(LS_KEYS.dismissed, JSON.stringify(next));
}
