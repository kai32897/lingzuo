export type ContentType = "game" | "drama" | "novel" | "tutorial";
export type SearchType = "all" | ContentType | "tool" | "creator" | "post";

export type CoverPattern =
  | "grid"
  | "scan"
  | "rings"
  | "halftone"
  | "bars"
  | "window"
  | "stripe"
  | "orbit";

export interface CoverSpec {
  glyph: string;
  bg: string;
  ink: string;
  accent: string;
  pattern: CoverPattern;
  code: string;
  imageId?: string;
  aspect?: string;
}

export interface Creator {
  handle: string;
  name: string;
  avatarText: string;
  avatarColor: string;
  role: string;
  bio: string;
  location: string;
  links: { label: string; url: string }[];
  tools: string[];
  badges: string[];
  joined: string;
  stats: { works: number; followers: number; following: number; likes: number };
}

export interface WorkStats {
  views: number;
  likes: number;
  saves: number;
  comments: number;
  remixes: number;
}

interface WorkBase {
  id: string;
  slug: string;
  title: string;
  summary: string;
  hook: string;
  cover: CoverSpec;
  tags: string[];
  authorHandle: string;
  tools: string[];
  models: string[];
  aiDisclosure: string;
  license: "允许二创（需署名）" | "仅非商业二创" | "不可二创";
  remixOf?: string;
  remixedBy?: string[];
  createdAt: string;
  stats: WorkStats;
  editorsPick?: boolean;
}

export interface GameMeta {
  playable: boolean;
  minutes: number;
  genres: string[];
  difficulty: "低" | "中" | "高";
  engine: string;
  controls: string;
  bestTime?: string;
}

export interface DramaMeta {
  episodes: { n: number; title: string; seconds: number; videoId?: string; posterId?: string }[];
  genres: string[];
  status: "连载中" | "已完结";
  characters: { name: string; role: string }[];
}

export interface NovelMeta {
  words: number;
  chapters: { n: number; title: string }[];
  genres: string[];
  status: "连载中" | "已完结";
  pov: string;
  excerpt: string;
}

export interface TutorialMeta {
  difficulty: "入门" | "进阶" | "高阶";
  minutes: number;
  output: string;
  steps: { title: string; body: string; prompt?: string }[];
}

export type GameWork = WorkBase & { type: "game"; meta: GameMeta };
export type DramaWork = WorkBase & { type: "drama"; meta: DramaMeta };
export type NovelWork = WorkBase & { type: "novel"; meta: NovelMeta };
export type TutorialWork = WorkBase & { type: "tutorial"; meta: TutorialMeta };
export type Work = GameWork | DramaWork | NovelWork | TutorialWork;

export interface Tool {
  id: string;
  slug: string;
  name: string;
  mark: string;
  color: string;
  tagline: string;
  useCases: string[];
  scenarios: string[];
  pricing: "免费" | "免费增值" | "付费";
  platform: string[];
  url: string;
  tags: string[];
  relatedTutorialIds: string[];
  relatedWorkIds: string[];
  fitFor?: string[];
  notFitFor?: string[];
  addedAt: string;
  stats: { saves: number; views: number };
}

export type PostType = "讨论" | "求助" | "交作业" | "创作日志";

export interface Post {
  id: string;
  type: PostType;
  title: string;
  excerpt: string;
  body: string[];
  authorHandle: string;
  tags: string[];
  relatedWorkId?: string;
  topic?: string;
  createdAt: string;
  stats: { likes: number; comments: number };
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  brief: string;
  status: "进行中" | "即将开始" | "已结束";
  deadlineDays: number;
  entries: number;
  topWorkIds: string[];
  coverGlyph: string;
  color: string;
}

export interface Collection {
  id: string;
  title: string;
  desc: string;
  editor: string;
  workIds: string[];
}

export interface Comment {
  id: string;
  workId: string;
  authorHandle: string;
  content: string;
  likes: number;
  createdAt: string;
  spoiler?: boolean;
}

export interface ContentTypeConfig {
  type: SearchType;
  label: string;
  short: string;
  code: string;
  color: string;
  href: string;
  action: string;
  description: string;
}
