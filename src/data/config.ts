import type { ContentType, ContentTypeConfig, SearchType } from "@/types";

export const SITE = {
  name: "灵作",
  latin: "MADE WITH AI",
  tagline: "把 AI 做的东西，玩起来。",
  description: "玩一局、追一集、读两页、学一手。每个作品都可以带配方，每个人都能接力。",
  volume: "VOL. 01",
};

export const PRIMARY_NAV = [
  { label: "首页", href: "/" },
  { label: "发现", href: "/discover" },
  { label: "游戏", href: "/games" },
  { label: "短剧", href: "/dramas" },
  { label: "小说", href: "/novels" },
  { label: "教程", href: "/tutorials" },
  { label: "工具", href: "/tools" },
];

export const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    type: "all",
    label: "全部",
    short: "全部",
    code: "ALL",
    color: "var(--ink)",
    href: "/search",
    action: "打开",
    description: "全站内容，一起找。",
  },
  {
    type: "game",
    label: "AI 游戏",
    short: "游戏",
    code: "GAME",
    color: "var(--game)",
    href: "/games",
    action: "玩一下",
    description: "不用下载，点开就玩。",
  },
  {
    type: "drama",
    label: "AI 短剧",
    short: "短剧",
    code: "DRAMA",
    color: "var(--drama)",
    href: "/dramas",
    action: "看一集",
    description: "一集三分钟，刷完还想追。",
  },
  {
    type: "novel",
    label: "AI 小说",
    short: "小说",
    code: "NOVEL",
    color: "var(--novel)",
    href: "/novels",
    action: "读两页",
    description: "先读三行，再决定要不要熬夜。",
  },
  {
    type: "tutorial",
    label: "AI 教程",
    short: "教程",
    code: "TUTORIAL",
    color: "var(--tutorial)",
    href: "/tutorials",
    action: "学一手",
    description: "不聊概念，直接交作业。",
  },
  {
    type: "tool",
    label: "AI 工具",
    short: "工具",
    code: "TOOL",
    color: "var(--tool)",
    href: "/tools",
    action: "看工具",
    description: "从想做什么，到用什么做。",
  },
  {
    type: "creator",
    label: "创作者",
    short: "创作者",
    code: "CREATOR",
    color: "var(--post)",
    href: "/discover",
    action: "看主页",
    description: "让好作品连接到人。",
  },
  {
    type: "post",
    label: "社区动态",
    short: "动态",
    code: "POST",
    color: "var(--post)",
    href: "/discover",
    action: "看讨论",
    description: "讨论、求助、交作业、创作日志。",
  },
];

export const SEARCH_TABS = CONTENT_TYPES;

export const WORK_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  game: CONTENT_TYPES[1],
  drama: CONTENT_TYPES[2],
  novel: CONTENT_TYPES[3],
  tutorial: CONTENT_TYPES[4],
};

export const SEARCH_TYPES: SearchType[] = [
  "game",
  "drama",
  "novel",
  "tutorial",
  "tool",
  "creator",
  "post",
];

export function isSearchType(value: string | null): value is SearchType {
  return value !== null && (SEARCH_TYPES as string[]).includes(value);
}

export function typeConfig(type: SearchType): ContentTypeConfig {
  return CONTENT_TYPES.find((item) => item.type === type) ?? CONTENT_TYPES[0];
}

export function workHref(type: ContentType, slug: string): string {
  return `/${type === "game" ? "games" : type === "drama" ? "dramas" : type === "novel" ? "novels" : "tutorials"}/${slug}`;
}

export const HOT_SEARCHES = [
  "AI 修仙游戏",
  "便利店夜班",
  "即梦",
  "分支叙事",
  "月亮维修站",
  "赛博聊斋",
  "电影感短片",
  "只有两个按钮",
];

export const CURRENT_USER = {
  handle: "linyi",
  name: "林一",
  avatarText: "林",
  avatarColor: "#2F4BFF",
  role: "刚学会用 AI 做东西的人",
};

export const INSPIRATION_FORMS = [
  {
    name: "一款三分钟的小游戏",
    template: (topic: string, limit: string) =>
      `做一款 3 分钟的小游戏：发生在${topic}，规则是「${limit}」。`,
  },
  {
    name: "一支没有台词的短剧",
    template: (topic: string, limit: string) =>
      `拍一支竖屏短剧：只发生在${topic}，全片没有台词，还要做到「${limit}」。`,
  },
  {
    name: "一篇 500 字的小说",
    template: (topic: string, limit: string) =>
      `写一篇 500 字的小说：以${topic}为舞台，写作限制是「${limit}」。`,
  },
  {
    name: "一份能交作业的教程",
    template: (topic: string, limit: string) =>
      `做一份教程：教别人用 AI 完成「${topic}」，并且必须「${limit}」。`,
  },
];

export const INSPIRATION_TOPICS = [
  "深夜便利店",
  "会说话的电梯",
  "外婆的旧相册",
  "一场没下完的雨",
  "离职的 AI 同事",
  "13 楼的邻居",
  "末日的最后一个快递",
  "一间只在下雨天营业的甜品店",
];

export const INSPIRATION_LIMITS = [
  "只有两个按钮",
  "全片只有一个镜头",
  "不能出现「爱」这个字",
  "必须在下雨前结束",
  "只能使用一种颜色",
  "旁白不超过三句",
  "结尾必须回到开头",
  "主角全程不说话",
];

export const SORT_OPTIONS = {
  all: [
    { value: "relevance", label: "相关度" },
    { value: "latest", label: "最新" },
    { value: "hot", label: "热度" },
  ],
  game: [
    { value: "latest", label: "最新" },
    { value: "hot", label: "最热" },
    { value: "fast", label: "最快通关" },
  ],
  drama: [
    { value: "latest", label: "最新" },
    { value: "hot", label: "最热" },
    { value: "follow", label: "追更" },
  ],
  novel: [
    { value: "latest", label: "最新" },
    { value: "hot", label: "最热" },
    { value: "finished", label: "完结" },
  ],
  tutorial: [
    { value: "latest", label: "最新" },
    { value: "hot", label: "最热" },
    { value: "short", label: "最短" },
  ],
};
