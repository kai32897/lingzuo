import { CONTENT_TYPES, CURRENT_USER, typeConfig } from "@/data/config";
import { creators, posts, tools, works } from "@/data/seed";
import type { CoverSpec, Post, SearchType, Work } from "@/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { currentName } from "@/lib/currentUser";
import { metaLine, workLink } from "@/lib/work";

export interface SearchDoc {
  id: string;
  type: Exclude<SearchType, "all">;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  authorName: string;
  authorHandle: string;
  toolNames: string;
  quality: number;
  createdAt: string;
  href: string;
  cover: CoverSpec;
  meta: string;
  action: string;
  stats: { likes: number; views: number; comments: number };
}

const workDocs: SearchDoc[] = works.map(workDoc);

function workDoc(work: Work): SearchDoc {
  const config = typeConfig(work.type);
  const bodyParts: string[] = [work.summary, work.hook];
  if (work.type === "novel") {
    bodyParts.push(work.meta.excerpt);
    bodyParts.push(work.meta.chapters.map((c) => c.title).join(" "));
  }
  if (work.type === "tutorial") {
    bodyParts.push(work.meta.steps.map((step) => `${step.title} ${step.prompt ?? ""}`).join(" "));
  }
  if (work.type === "drama") {
    bodyParts.push(work.meta.episodes.map((ep) => ep.title).join(" "));
  }
  return {
    id: work.id,
    type: work.type,
    title: work.title,
    summary: work.summary,
    body: bodyParts.join(" "),
    tags: [...work.tags, config.label, work.type === "game" ? "小游戏" : ""],
    authorName: creatorName(work.authorHandle),
    authorHandle: work.authorHandle,
    toolNames: work.tools.join(" "),
    quality:
      20 +
      (work.editorsPick ? 10 : 0) +
      Math.min(12, work.stats.remixes / 3) +
      Math.min(8, work.stats.likes / 120),
    createdAt: work.createdAt,
    href: workLink(work),
    cover: work.cover,
    meta: metaLine(work),
    action: config.action,
    stats: {
      likes: work.stats.likes,
      views: work.stats.views,
      comments: work.stats.comments,
    },
  };
}

function creatorName(handle: string): string {
  if (handle === CURRENT_USER.handle) return currentName();
  return creators.find((creator) => creator.handle === handle)?.name ?? handle;
}

const toolDocs: SearchDoc[] = tools.map((tool) => ({
  id: tool.id,
  type: "tool",
  title: tool.name,
  summary: tool.tagline,
  body: [...tool.useCases, ...tool.scenarios, ...tool.tags].join(" "),
  tags: [...tool.tags, "AI 工具", tool.pricing],
  authorName: "工具库",
  authorHandle: "lingzuo",
  toolNames: tool.name,
  quality: 24 + Math.min(8, tool.stats.saves / 400),
  createdAt: tool.addedAt,
  href: `/tools/${tool.slug}`,
  cover: {
    glyph: tool.mark,
    bg: tool.color,
    ink: "#15130F",
    accent: "#FFFDF7",
    pattern: "grid",
    code: "TOOL",
  },
  meta: `${tool.pricing} · ${tool.platform.join(" / ")}`,
  action: "看工具",
  stats: { likes: tool.stats.saves, views: tool.stats.views, comments: 0 },
}));

const creatorDocs: SearchDoc[] = creators.map((creator) => ({
  id: `creator-${creator.handle}`,
  type: "creator",
  title: creator.name,
  summary: creator.bio,
  body: `${creator.role} ${creator.tools.join(" ")} ${creator.badges.join(" ")}`,
  tags: ["创作者", ...creator.tools, creator.role],
  authorName: creator.name,
  authorHandle: creator.handle,
  toolNames: creator.tools.join(" "),
  quality: 22 + Math.min(10, creator.stats.followers / 300),
  createdAt: new Date(Date.now() - 400 * 86400000).toISOString(),
  href: `/u/${creator.handle}`,
  cover: {
    glyph: creator.avatarText,
    bg: creator.avatarColor,
    ink: "#15130F",
    accent: "#FFFDF7",
    pattern: "stripe",
    code: "CREATOR",
  },
  meta: `${creator.role} · ${creator.stats.works} 件作品`,
  action: "看主页",
  stats: { likes: creator.stats.likes, views: creator.stats.followers, comments: 0 },
}));

function buildPostDoc(post: (typeof posts)[number]): SearchDoc {
  return {
    id: post.id,
    type: "post",
    title: post.title,
    summary: post.excerpt,
    body: post.body.join(" "),
    tags: [...post.tags, "社区动态", post.type],
    authorName: creatorName(post.authorHandle),
    authorHandle: post.authorHandle,
    toolNames: "",
    quality: 14 + Math.min(8, post.stats.likes / 25) + Math.min(6, post.stats.comments / 10),
    createdAt: post.createdAt,
    href: `/posts/${post.id}`,
    cover: {
      glyph:
        post.type === "求助" ? "?" : post.type === "交作业" ? "交" : post.type === "创作日志" ? "志" : "议",
      bg: "var(--post)",
      ink: "#15130F",
      accent: "#2F4BFF",
      pattern: "halftone",
      code: post.type,
    },
    meta: `${post.type} · ${formatCount(post.stats.likes)} 喜欢 · ${post.stats.comments} 条回复`,
    action: "看讨论",
    stats: { likes: post.stats.likes, views: post.stats.likes * 8, comments: post.stats.comments },
  };
}

const postDocs: SearchDoc[] = posts.map(buildPostDoc);

export const searchIndex: SearchDoc[] = [...workDocs, ...toolDocs, ...creatorDocs, ...postDocs];

const STOPWORDS = new Set([
  "ai",
  "的",
  "了",
  "是",
  "在",
  "和",
  "与",
  "我",
  "你",
  "他",
  "她",
  "它",
  "这",
  "那",
  "有",
  "个",
  "一",
  "不",
  "吗",
  "呢",
  "吧",
  "啊",
  "就",
  "都",
  "也",
  "很",
  "最",
  "要",
  "会",
  "能",
  "可",
  "以",
  "对",
  "上",
  "下",
  "中",
  "里",
  "些",
  "什么",
  "怎么",
  "东西",
]);

/**
 * A tiny vocabulary made from real titles, tags, author and tool names.
 * It keeps Chinese search from matching meaningless character pairs.
 */
const VOCAB = new Set<string>();

function addVocabText(candidate: string): void {
  const lower = candidate.toLowerCase().trim();
  if (!lower || lower.length < 2 || STOPWORDS.has(lower)) return;
  if (!lower.includes(" ") && lower.length <= 8) VOCAB.add(lower);
  const max = Math.min(6, lower.length);
  for (let len = 2; len <= max; len += 1) {
    for (let i = 0; i + len <= lower.length; i += 1) {
      const piece = lower.slice(i, i + len);
      if (!STOPWORDS.has(piece)) VOCAB.add(piece);
    }
  }
}

function addDocVocab(doc: SearchDoc): void {
  const candidates = [doc.title, doc.authorName, ...doc.tags, ...doc.toolNames.split(/\s+/)];
  for (const candidate of candidates) addVocabText(candidate);
}

for (const doc of searchIndex) addDocVocab(doc);

export function indexUserWork(work: Work): void {
  if (searchIndex.some((doc) => doc.id === work.id && doc.type === work.type)) return;
  const doc = workDoc(work);
  searchIndex.push(doc);
  addDocVocab(doc);
}

export function indexUserPost(post: Post): void {
  if (searchIndex.some((doc) => doc.id === post.id && doc.type === "post")) return;
  const doc = buildPostDoc(post);
  searchIndex.push(doc);
  addDocVocab(doc);
}

export function removeUserSearchEntry(id: string): void {
  const index = searchIndex.findIndex((doc) => doc.id === id);
  if (index >= 0) searchIndex.splice(index, 1);
}

export function tokenize(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const tokens = new Set<string>();
  for (const part of normalized.split(/\s+/).filter(Boolean)) {
    if (/^[a-z0-9]+$/.test(part)) {
      tokens.add(part);
      continue;
    }
    let matchedAny = false;
    let index = 0;
    while (index < part.length) {
      let match = "";
      for (let len = Math.min(8, part.length - index); len >= 2; len -= 1) {
        const piece = part.slice(index, index + len);
        if (VOCAB.has(piece)) {
          match = piece;
          break;
        }
      }
      if (match) {
        tokens.add(match);
        matchedAny = true;
        index += match.length;
      } else {
        index += 1;
      }
    }
    if (!matchedAny) tokens.add(part);
  }
  if (tokens.size > 1) tokens.delete("ai");
  return Array.from(tokens);
}

const TOKEN_WEIGHT_CACHE = new Map<string, number>();

function tokenWeight(token: string): number {
  const cached = TOKEN_WEIGHT_CACHE.get(token);
  if (cached) return cached;
  let documentFrequency = 0;
  for (const doc of searchIndex) {
    const haystack = `${doc.title} ${doc.tags.join(" ")} ${doc.summary} ${doc.body}`.toLowerCase();
    if (haystack.includes(token)) documentFrequency += 1;
  }
  const weight = 1 + Math.log((searchIndex.length + 1) / (documentFrequency + 1)) * 0.85;
  TOKEN_WEIGHT_CACHE.set(token, weight);
  return weight;
}

function scoreDoc(doc: SearchDoc, query: string, tokens: string[]): number {
  const title = doc.title.toLowerCase();
  const summary = doc.summary.toLowerCase();
  const body = doc.body.toLowerCase();
  const tags = doc.tags.join(" ").toLowerCase();
  const author = doc.authorName.toLowerCase();
  const tools = doc.toolNames.toLowerCase();
  const q = query.toLowerCase().trim();
  let score = 0;

  if (title === q) score += 200;
  else if (title.startsWith(q)) score += 140;
  else if (title.includes(q)) score += 100;

  if (doc.type === "tool" && (title === q || title.startsWith(q))) score += 150;

  for (const token of tokens) {
    const weight = tokenWeight(token);
    if (title.includes(token)) score += 60 * weight;
    if (tags.includes(token)) score += 42 * weight;
    if (summary.includes(token)) score += 24 * weight;
    if (body.includes(token)) score += 13 * weight;
    if (author.includes(token)) score += 30 * weight;
    if (tools.includes(token)) score += 20 * weight;
  }

  if (score > 0) {
    const ageDays = Math.max(0, (Date.now() - new Date(doc.createdAt).getTime()) / 86400000);
    score += Math.max(0, 10 - ageDays) * 0.5;
    score += doc.quality;
  }
  return score;
}

function hotScore(doc: SearchDoc): number {
  return doc.stats.likes * 2 + doc.stats.views * 0.03 + doc.stats.comments * 3;
}

export interface SearchOptions {
  type?: SearchType;
  sort?: string;
}

export function runSearch(query: string, options: SearchOptions = {}): SearchDoc[] {
  const q = query.trim();
  const type = options.type ?? "all";
  const sort = options.sort ?? "relevance";
  if (!q) return [];
  const tokens = tokenize(q);
  const scored = searchIndex
    .filter((doc) => (type === "all" ? true : doc.type === type))
    .map((doc) => ({ doc, score: scoreDoc(doc, q, tokens) }))
    .filter((item) => item.score > 1);
  scored.sort((a, b) => {
    if (sort === "latest") {
      return new Date(b.doc.createdAt).getTime() - new Date(a.doc.createdAt).getTime();
    }
    if (sort === "hot") {
      return hotScore(b.doc) - hotScore(a.doc);
    }
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.doc.createdAt).getTime() - new Date(a.doc.createdAt).getTime();
  });
  return scored.map((item) => item.doc);
}

export function countByType(docs: SearchDoc[]): Record<SearchType, number> {
  const counts = Object.fromEntries(CONTENT_TYPES.map((item) => [item.type, 0])) as Record<
    SearchType,
    number
  >;
  counts.all = docs.length;
  for (const doc of docs) counts[doc.type] += 1;
  return counts;
}

export function suggest(query: string, limit = 6): SearchDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const direct = searchIndex
    .filter((doc) => doc.title.toLowerCase().includes(q))
    .sort((a, b) => hotScore(b) - hotScore(a));
  const results = runSearch(query);
  const merged: SearchDoc[] = [];
  for (const doc of [...direct, ...results]) {
    if (!merged.some((item) => item.id === doc.id && item.type === doc.type)) merged.push(doc);
    if (merged.length >= limit) break;
  }
  return merged;
}

export function relatedTags(query: string): string[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const tags = new Map<string, number>();
  for (const doc of searchIndex) {
    for (const tag of doc.tags) {
      if (!tag || tag.length < 2) continue;
      const lowered = tag.toLowerCase();
      if (tokens.some((token) => lowered.includes(token) || token.includes(lowered))) {
        tags.set(tag, (tags.get(tag) ?? 0) + 1);
      }
    }
  }
  return Array.from(tags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}

export function getSuggestions(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const titles = searchIndex
    .filter((doc) => doc.title.toLowerCase().includes(q))
    .slice(0, 5)
    .map((doc) => doc.title);
  const tags = relatedTags(query).slice(0, 3);
  return Array.from(new Set([...titles, ...tags])).slice(0, 6);
}

export function emptySuggestions(query: string): { label: string; href: string }[] {
  const tags = relatedTags(query);
  return tags.slice(0, 6).map((item) => ({
    label: item,
    href: `/search?q=${encodeURIComponent(item)}`,
  }));
}

export function docTypeLabel(doc: SearchDoc): string {
  return typeConfig(doc.type).label;
}

export function docTime(doc: SearchDoc): string {
  return timeAgo(doc.createdAt);
}
