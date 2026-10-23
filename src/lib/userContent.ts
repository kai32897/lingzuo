import { CURRENT_USER } from "@/data/config";
import { posts, postMap, workMap, workBySlug, works } from "@/data/seed";
import { gameStories, type GameStory } from "@/data/gameStories";
import { dramaScripts } from "@/data/dramaScripts";
import { novelChapters } from "@/data/chapters";
import { recipes, type Recipe } from "@/data/recipes";
import { indexUserPost, indexUserWork, removeUserSearchEntry } from "@/lib/search";
import { deleteMedia } from "@/lib/media";
import { LS_KEYS, readLocal, writeLocal } from "@/lib/storage";
import type {
  ContentType,
  CoverPattern,
  CoverSpec,
  DramaMeta,
  GameMeta,
  NovelMeta,
  Post,
  PostType,
  TutorialMeta,
  Work,
} from "@/types";

export type RecipeVisibility = "完全公开" | "部分公开" | "仅展示思路";
export type GameMode = "generated" | "html" | "link";

export interface NovelChapterDraft {
  id: string;
  title: string;
  body: string;
}

export interface TutorialBlockDraft {
  id: string;
  type: "text" | "image" | "video";
  text?: string;
  mediaId?: string;
  caption?: string;
}

export interface CreateForm {
  type: ContentType;
  title: string;
  summary: string;
  glyph: string;
  pattern: CoverPattern;
  coverImageId?: string;
  coverAspect?: string;
  tags: string;
  tools: string;
  models: string;
  minutes: number;
  genres: string;
  difficulty: string;
  engine: string;
  controls: string;
  opening: string;
  bodyText: string;
  episodes: number;
  episodeMinutes: number;
  episodeVideos: (string | undefined)[];
  status: string;
  linesText: string;
  words: number;
  pov: string;
  excerpt: string;
  novelChapters: NovelChapterDraft[];
  output: string;
  stepsText: string;
  tutorialBlocks: TutorialBlockDraft[];
  gameMode: GameMode;
  gameHtmlId?: string;
  gameDemoUrl?: string;
  galleryIds: string[];
  prompt: string;
  workflowText: string;
  visibility: RecipeVisibility;
  license: Work["license"];
  aiDisclosure: string;
  remixOf?: string;
}

export interface WorkDraft {
  id: string;
  type: ContentType;
  title: string;
  updatedAt: string;
  form: CreateForm;
}

export interface UserWorkContent {  opening?: string;
  body?: string;
  lines?: string[];
  steps?: TutorialMeta["steps"];
  prompt?: string;
  workflow?: string[];
  visibility?: Recipe["visibility"];
  chapters?: { title: string; paragraphs: string[] }[];
  blocks?: TutorialBlockDraft[];
  gameHtmlId?: string;
  gameDemoUrl?: string;
  gallery?: string[];
}

export interface TrashItem {
  id: string;
  kind: "work" | "post";
  title: string;
  deletedAt: string;
  work?: Work;
  content?: UserWorkContent;
  form?: CreateForm;
  post?: Post;
}

export interface WorkVersion {
  id: string;
  workId: string;
  savedAt: string;
  work: Work;
  content: UserWorkContent;
  form?: CreateForm;
}

export interface UserSettings {
  name: string;
  bio: string;
  location: string;
  links: string;
  email: string;
  explore: number;
  showLikes: boolean;
  defaultAiDisclosure: string;
  defaultLicense: Work["license"];
  defaultVisibility: RecipeVisibility;
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  notifySystem: boolean;
}

const PATTERNS: CoverPattern[] = ["grid", "scan", "rings", "halftone", "bars", "window", "stripe", "orbit"];
const PATTERN_LABELS: Record<CoverPattern, string> = {
  grid: "网格",
  scan: "扫描线",
  rings: "同心圆",
  halftone: "半调点",
  bars: "竖条",
  window: "画框",
  stripe: "斜纹",
  orbit: "轨道",
};

export function patternLabel(pattern: CoverPattern): string {
  return PATTERN_LABELS[pattern];
}

export function coverPatterns(): CoverPattern[] {
  return PATTERNS;
}

export function splitList(value: string): string[] {
  return value
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function emptyForm(type: ContentType): CreateForm {
  const palette = paletteFor(type);
  const settings = loadSettings();
  return {
    type,
    title: "",
    summary: "",
    glyph: "",
    pattern: palette.pattern,
    tags: "",
    tools: "",
    models: "",
    minutes: type === "game" ? 0 : 30,
    genres: "",
    difficulty: type === "tutorial" ? "入门" : "低",
    engine: "HTML + CSS",
    controls: "点击 / 空格确认",
    opening: "",
    bodyText: "",
    episodes: 3,
    episodeMinutes: 3,
    episodeVideos: [],
    status: "连载中",
    linesText: "",
    words: 0,
    pov: "第一人称",
    excerpt: "",
    novelChapters: type === "novel" ? [{ id: "chapter-1", title: "第一章", body: "" }] : [],
    output: "",
    stepsText: "",
    tutorialBlocks: [],
    gameMode: "generated",
    galleryIds: [],
    prompt: "",
    workflowText: "",
    visibility: settings.defaultVisibility,
    license: settings.defaultLicense,
    aiDisclosure: settings.defaultAiDisclosure,
  };
}

export function normalizeForm(form: CreateForm, type: ContentType): CreateForm {
  const base = emptyForm(type);
  return {
    ...base,
    ...form,
    type,
    episodeVideos: form.episodeVideos ?? base.episodeVideos,
    novelChapters: form.novelChapters?.length ? form.novelChapters : base.novelChapters,
    tutorialBlocks: form.tutorialBlocks ?? [],
    galleryIds: form.galleryIds ?? [],
    gameMode: form.gameMode ?? "generated",
  };
}

function paletteFor(type: ContentType): { bg: string; ink: string; accent: string; pattern: CoverPattern } {
  switch (type) {
    case "game":
      return { bg: "#182016", ink: "#E9FFB0", accent: "#D8FF3E", pattern: "grid" };
    case "drama":
      return { bg: "#1A1311", ink: "#FFE3D9", accent: "#FF5A3C", pattern: "window" };
    case "novel":
      return { bg: "#1B1A24", ink: "#DDD6FF", accent: "#B9A6FF", pattern: "orbit" };
    case "tutorial":
      return { bg: "#2B2314", ink: "#FFE2B0", accent: "#FFC24B", pattern: "scan" };
  }
}

export function loadPublishedWorks(): Work[] {
  return readLocal<Work[]>(LS_KEYS.publishedWorks, []);
}

export function loadPublishedForms(): Record<string, CreateForm> {
  return readLocal<Record<string, CreateForm>>(LS_KEYS.publishedForms, {});
}

export function getPublishedForm(id: string): CreateForm | undefined {
  return loadPublishedForms()[id];
}

export function loadTrash(): TrashItem[] {
  return readLocal<TrashItem[]>(LS_KEYS.trash, []);
}

export function loadWorkVersions(workId: string): WorkVersion[] {
  return readLocal<Record<string, WorkVersion[]>>(LS_KEYS.workVersions, {})[workId] ?? [];
}

function saveWorkVersion(work: Work, content: UserWorkContent | undefined, form: CreateForm | undefined): void {
  const all = readLocal<Record<string, WorkVersion[]>>(LS_KEYS.workVersions, {});
  const version: WorkVersion = {
    id: `ver-${Date.now()}`,
    workId: work.id,
    savedAt: new Date().toISOString(),
    work,
    content: content ?? {},
    form,
  };
  writeLocal(LS_KEYS.workVersions, {
    ...all,
    [work.id]: [version, ...(all[work.id] ?? [])].slice(0, 8),
  });
}

export function loadUserContents(): Record<string, UserWorkContent> {
  return readLocal<Record<string, UserWorkContent>>(LS_KEYS.userContents, {});
}

export function loadUserPosts(): Post[] {
  return readLocal<Post[]>(LS_KEYS.userPosts, []);
}

export function getUserContent(workId: string): UserWorkContent | undefined {
  return loadUserContents()[workId];
}

export function loadDrafts(): WorkDraft[] {
  return readLocal<WorkDraft[]>(LS_KEYS.drafts, []);
}

export function loadDraft(type: ContentType): WorkDraft | undefined {
  const draft = loadDrafts()
    .filter((item) => item.type === type)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  return draft ? { ...draft, form: normalizeForm(draft.form, type) } : undefined;
}

export function saveDraft(form: CreateForm): void {
  const drafts = loadDrafts().filter((draft) => draft.type !== form.type);
  const draft: WorkDraft = {
    id: `draft-${form.type}`,
    type: form.type,
    title: form.title.trim() || "未命名草稿",
    updatedAt: new Date().toISOString(),
    form,
  };
  writeLocal(LS_KEYS.drafts, [draft, ...drafts].slice(0, 12));
}

export function deleteDraft(type: ContentType): void {
  writeLocal(
    LS_KEYS.drafts,
    loadDrafts().filter((draft) => draft.type !== type),
  );
}

export function loadSettings(): UserSettings {
  const defaults: UserSettings = {
    name: CURRENT_USER.name,
    bio: "刚学会用 AI 做东西。正在把第一个想法做成能发出来的作品。",
    location: "杭州",
    links: "",
    email: "",
    explore: 20,
    showLikes: true,
    defaultAiDisclosure: "含 AI 生成内容",
    defaultLicense: "允许二创（需署名）",
    defaultVisibility: "完全公开",
    notifyLikes: true,
    notifyComments: true,
    notifyFollows: true,
    notifySystem: true,
  };
  return { ...defaults, ...readLocal<UserSettings>(LS_KEYS.settings, defaults) };
}

export function saveSettings(settings: UserSettings): void {
  writeLocal(LS_KEYS.settings, settings);
}

function parseSteps(text: string): TutorialMeta["steps"] {
  return splitLines(text).map((line) => {
    const [title, ...rest] = line.split(/[：:]/);
    const body = rest.join("：").trim();
    return {
      title: title.trim() || "未命名步骤",
      body: body || "照这一步做，并留下一个可以复用的结果。",
    };
  });
}

export function coverForForm(form: CreateForm): CoverSpec {
  const palette = paletteFor(form.type);
  return {
    glyph: form.glyph.trim() || form.title.trim().slice(0, 1) || "新",
    bg: palette.bg,
    ink: palette.ink,
    accent: palette.accent,
    pattern: form.pattern,
    code: "U—NEW",
    imageId: form.coverImageId,
    aspect: form.coverAspect,
  };
}

function buildWork(form: CreateForm, existing?: Work): Work {
  const now = Date.now();
  const id = existing?.id ?? `u-${now}`;
  const title = form.title.trim();
  const summary = form.summary.trim();
  const tags = splitList(form.tags);
  const tools = splitList(form.tools);
  const models = splitList(form.models);
  const cover = coverForForm(form);
  const common = {
    id,
    slug: existing?.slug ?? `u-${now.toString(36)}`,
    title,
    summary,
    hook: form.opening.trim().slice(0, 48) || summary,
    cover,
    tags: tags.length ? tags : [form.type === "game" ? "游戏" : form.type === "drama" ? "短剧" : form.type === "novel" ? "小说" : "教程"],
    authorHandle: CURRENT_USER.handle,
    tools: tools.length ? tools : ["Claude"],
    models: models.length ? models : ["Claude Sonnet"],
    aiDisclosure: form.aiDisclosure || "含 AI 生成内容",
    license: form.license,
    createdAt: existing?.createdAt ?? new Date(now).toISOString(),
    stats: existing?.stats ?? { views: 0, likes: 0, saves: 0, comments: 0, remixes: 0 },
    remixOf: form.remixOf || undefined,
    editorsPick: existing?.editorsPick ?? false,
  };

  if (form.type === "game") {
    const meta: GameMeta = {
      playable: true,
      minutes: Math.max(0, Number(form.minutes) || 0),
      genres: splitList(form.genres).length ? splitList(form.genres) : ["叙事"],
      difficulty: (form.difficulty as GameMeta["difficulty"]) || "低",
      engine:
        form.gameMode === "html"
          ? "HTML 单文件"
          : form.gameMode === "link"
            ? "外部试玩"
            : form.engine.trim() || "HTML + CSS",
      controls: form.controls.trim() || "点击 / 空格确认",
      bestTime: "—",
    };
    return { ...common, type: "game", meta } as Work;
  }

  if (form.type === "drama") {
    const count = Math.max(1, Math.min(12, Number(form.episodes) || 3));
    const meta: DramaMeta = {
      episodes: Array.from({ length: count }, (_, index) => ({
        n: index + 1,
        title: `第 ${index + 1} 集`,
        seconds: Math.max(30, (Number(form.episodeMinutes) || 3) * 60),
        videoId: form.episodeVideos[index] || undefined,
      })),
      genres: splitList(form.genres).length ? splitList(form.genres) : ["剧情"],
      status: (form.status as DramaMeta["status"]) || "连载中",
      characters: [],
    };
    return { ...common, type: "drama", meta } as Work;
  }

  if (form.type === "novel") {
    const chapters = form.novelChapters.filter((chapter) => chapter.title.trim() || chapter.body.trim());
    const chapterList = chapters.length ? chapters : [{ id: "chapter-1", title: "第一章", body: "" }];
    const bodyLength = chapterList.reduce((sum, chapter) => sum + chapter.body.replace(/\s/g, "").length, 0);
    const meta: NovelMeta = {
      words: Math.max(Number(form.words) || 0, bodyLength),
      chapters: chapterList.map((chapter, index) => ({
        n: index + 1,
        title: chapter.title.trim() || `第 ${index + 1} 章`,
      })),
      genres: splitList(form.genres).length ? splitList(form.genres) : ["短篇"],
      status: (form.status as NovelMeta["status"]) || "连载中",
      pov: form.pov || "第一人称",
      excerpt: form.excerpt.trim() || summary,
    };
    return { ...common, type: "novel", meta } as Work;
  }

  const steps = parseSteps(form.stepsText);
  const meta: TutorialMeta = {
    difficulty: (form.difficulty as TutorialMeta["difficulty"]) || "入门",
    minutes: Math.max(1, Number(form.minutes) || 30),
    output: form.output.trim() || "一件可以发出来的作品",
    steps,
  };
  return { ...common, type: "tutorial", meta } as Work;
}

function contentFor(form: CreateForm): UserWorkContent {
  const chapters = form.novelChapters
    .filter((chapter) => chapter.body.trim() || chapter.title.trim())
    .map((chapter) => ({
      title: chapter.title.trim() || "未命名章节",
      paragraphs: splitLines(chapter.body),
    }));
  return {
    opening: form.opening,
    body: form.bodyText,
    lines: splitLines(form.linesText),
    steps: form.type === "tutorial" ? parseSteps(form.stepsText) : undefined,
    chapters: form.type === "novel" ? chapters : undefined,
    blocks: form.type === "tutorial" ? form.tutorialBlocks : undefined,
    gameHtmlId: form.type === "game" && form.gameMode === "html" ? form.gameHtmlId : undefined,
    gameDemoUrl: form.type === "game" && form.gameMode === "link" ? form.gameDemoUrl : undefined,
    gallery: form.galleryIds.length ? form.galleryIds : undefined,
    prompt: form.prompt,
    workflow: splitLines(form.workflowText),
    visibility: form.visibility,
  };
}

function buildGameStory(work: Work, content: UserWorkContent): GameStory {
  const opening = content.opening?.trim() || work.summary;
  const middle = content.body?.trim() || "你继续往前。刚才的选择还在身后，像一件没有拿走的行李。";
  return {
    start: "start",
    scenes: {
      start: {
        id: "start",
        title: "开场",
        text: opening,
        choices: [
          { label: "继续往前", next: "middle" },
          { label: "回头看看", next: "ending-back" },
        ],
      },
      middle: {
        id: "middle",
        title: "中途",
        text: middle,
        choices: [
          { label: "留下来", next: "ending-stay" },
          { label: "离开这里", next: "ending-leave" },
        ],
      },
      "ending-back": {
        id: "ending-back",
        title: "结局 / 回头",
        text: "你回头，发现来时的路已经不见了。你站了一会儿，决定把这件事留在这里。",
        endingLabel: "结局：回头",
      },
      "ending-stay": {
        id: "ending-stay",
        title: "结局 / 留下",
        text: "你留了下来。没有发生什么大事，只是灯一直亮着。",
        endingLabel: "结局：留下",
      },
      "ending-leave": {
        id: "ending-leave",
        title: "结局 / 离开",
        text: "你走出门。外面没有人在等你，但路是新的。",
        endingLabel: "结局：离开",
      },
    },
  };
}

function buildDramaScript(work: Work, content: UserWorkContent) {
  const lines = content.lines?.length ? content.lines : [work.summary, "……"];
  return lines.map((line, index) => {
    const match = line.match(/^([^：:]{1,8})[：:]\s*(.+)$/);
    return match
      ? { at: index * 15, speaker: match[1].trim(), text: match[2].trim() }
      : { at: index * 15, text: line };
  });
}

function buildNovelChapters(work: Work, content: UserWorkContent) {
  if (content.chapters?.length) {
    return content.chapters.map((chapter) => ({
      title: chapter.title,
      paragraphs: chapter.paragraphs.length ? chapter.paragraphs : [work.summary],
    }));
  }
  const paragraphs = splitLines(content.body || work.summary);
  return [
    {
      title: "第一章",
      paragraphs: paragraphs.length ? paragraphs : [work.summary],
    },
  ];
}

function registerWork(work: Work, content: UserWorkContent): void {
  const previous = workMap.get(work.id);
  if (previous?.remixOf && previous.remixOf !== work.remixOf) {
    const oldParent = workMap.get(previous.remixOf);
    if (oldParent) oldParent.remixedBy = (oldParent.remixedBy ?? []).filter((id) => id !== work.id);
  }
  const index = works.findIndex((item) => item.id === work.id);
  if (index >= 0) works[index] = work;
  else works.push(work);
  workMap.set(work.id, work);
  workBySlug.set(`${work.type}/${work.slug}`, work);
  if (work.remixOf) {
    const parent = workMap.get(work.remixOf);
    if (parent) {
      const current = parent.remixedBy ?? [];
      if (!current.includes(work.id)) parent.remixedBy = [...current, work.id];
    }
  }
  if (work.type === "game") gameStories[work.id] = buildGameStory(work, content);
  if (work.type === "drama") dramaScripts[work.id] = buildDramaScript(work, content);
  if (work.type === "novel") novelChapters[work.id] = buildNovelChapters(work, content);
  delete recipes[work.id];
  if (content.prompt?.trim() || content.workflow?.length) {
    recipes[work.id] = {
      prompt:
        content.prompt?.trim() ||
        "作者只公开了工作流。可以先按下面的步骤做，再向作者提问。",
      workflow: content.workflow?.length ? content.workflow : ["作者尚未补充工作流"],
      params: [...work.tools, ...work.models, work.license],
      visibility: content.visibility ?? "完全公开",
    };
  }
  removeUserSearchEntry(work.id);
  indexUserWork(work);
}

function registerPost(post: Post): void {
  if (!posts.some((item) => item.id === post.id)) posts.push(post);
  postMap.set(post.id, post);
  indexUserPost(post);
}

function collectMediaIds(work: Work | undefined, content: UserWorkContent | undefined): Set<string> {
  const ids = new Set<string>();
  if (work?.cover.imageId) ids.add(work.cover.imageId);
  if (content?.gameHtmlId) ids.add(content.gameHtmlId);
  for (const mediaId of content?.gallery ?? []) ids.add(mediaId);
  for (const block of content?.blocks ?? []) {
    if (block.mediaId) ids.add(block.mediaId);
  }
  if (work?.type === "drama") {
    for (const episode of work.meta.episodes) {
      if (episode.videoId) ids.add(episode.videoId);
    }
  }
  return ids;
}

export function publishWork(form: CreateForm, editId?: string): Work {
  const existing = editId ? workMap.get(editId) : undefined;
  const oldContent = editId ? loadUserContents()[editId] : undefined;
  const oldForm = editId ? getPublishedForm(editId) : undefined;
  const oldMediaIds = collectMediaIds(existing, oldContent);
  if (existing) saveWorkVersion(existing, oldContent, oldForm);
  const work = buildWork(form, existing);
  const content = contentFor(form);
  const published = loadPublishedWorks();
  const nextPublished = existing
    ? published.map((item) => (item.id === work.id ? work : item))
    : [work, ...published.filter((item) => item.id !== work.id)];
  writeLocal(LS_KEYS.publishedWorks, nextPublished);
  const contents = loadUserContents();
  writeLocal(LS_KEYS.userContents, { ...contents, [work.id]: content });
  const forms = loadPublishedForms();
  writeLocal(LS_KEYS.publishedForms, { ...forms, [work.id]: form });
  registerWork(work, content);
  if (!existing) deleteDraft(form.type);
  const newMediaIds = collectMediaIds(work, content);
  for (const version of loadWorkVersions(work.id)) {
    for (const mediaId of collectMediaIds(version.work, version.content)) newMediaIds.add(mediaId);
  }
  for (const mediaId of oldMediaIds) {
    if (!newMediaIds.has(mediaId)) void deleteMedia(mediaId).catch(() => undefined);
  }
  return work;
}

export function publishPost(input: {
  type: PostType;
  title: string;
  content: string;
  tags: string;
  relatedWorkId?: string;
  topic?: string;
}): Post {
  const now = Date.now();
  const body = splitLines(input.content);
  const post: Post = {
    id: `upost-${now}`,
    type: input.type,
    title: input.title.trim(),
    excerpt: body.join(" ").slice(0, 96),
    body: body.length ? body : [input.content],
    authorHandle: CURRENT_USER.handle,
    tags: splitList(input.tags).length ? splitList(input.tags) : [input.type],
    relatedWorkId: input.relatedWorkId || undefined,
    topic: input.topic?.trim() || undefined,
    createdAt: new Date(now).toISOString(),
    stats: { likes: 0, comments: 0 },
  };
  writeLocal(LS_KEYS.userPosts, [post, ...loadUserPosts()]);
  registerPost(post);
  return post;
}

export function isUserWork(work: Work): boolean {
  return work.id.startsWith("u-");
}

export function updatePost(
  id: string,
  input: {
    type: PostType;
    title: string;
    content: string;
    tags: string;
    relatedWorkId?: string;
    topic?: string;
  },
): Post | undefined {
  const existing = postMap.get(id);
  if (!existing || existing.authorHandle !== CURRENT_USER.handle) return undefined;
  const body = splitLines(input.content);
  const post: Post = {
    ...existing,
    type: input.type,
    title: input.title.trim(),
    excerpt: body.join(" ").slice(0, 96),
    body: body.length ? body : [input.content],
    tags: splitList(input.tags).length ? splitList(input.tags) : [input.type],
    relatedWorkId: input.relatedWorkId || undefined,
    topic: input.topic?.trim() || undefined,
  };
  writeLocal(
    LS_KEYS.userPosts,
    loadUserPosts().map((item) => (item.id === id ? post : item)),
  );
  const index = posts.findIndex((item) => item.id === id);
  if (index >= 0) posts[index] = post;
  postMap.set(id, post);
  removeUserSearchEntry(id);
  indexUserPost(post);
  return post;
}

export function deletePost(id: string): void {
  const post = postMap.get(id);
  if (!post || post.authorHandle !== CURRENT_USER.handle) return;
  writeLocal(LS_KEYS.userPosts, loadUserPosts().filter((item) => item.id !== id));
  const index = posts.findIndex((item) => item.id === id);
  if (index >= 0) posts.splice(index, 1);
  postMap.delete(id);
  removeUserSearchEntry(id);
}

export function trashWork(id: string): TrashItem | undefined {
  const work = workMap.get(id);
  if (!work || work.authorHandle !== CURRENT_USER.handle) return undefined;
  const content = loadUserContents()[id];
  const form = getPublishedForm(id);
  const item: TrashItem = {
    id,
    kind: "work",
    title: work.title,
    deletedAt: new Date().toISOString(),
    work,
    content,
    form,
  };
  writeLocal(LS_KEYS.trash, [item, ...loadTrash().filter((entry) => entry.id !== id)]);
  writeLocal(
    LS_KEYS.publishedWorks,
    loadPublishedWorks().filter((entry) => entry.id !== id),
  );
  const contents = loadUserContents();
  delete contents[id];
  writeLocal(LS_KEYS.userContents, contents);
  const forms = loadPublishedForms();
  delete forms[id];
  writeLocal(LS_KEYS.publishedForms, forms);
  if (work.remixOf) {
    const parent = workMap.get(work.remixOf);
    if (parent) parent.remixedBy = (parent.remixedBy ?? []).filter((entry) => entry !== id);
  }
  const index = works.findIndex((entry) => entry.id === id);
  if (index >= 0) works.splice(index, 1);
  workMap.delete(id);
  workBySlug.delete(`${work.type}/${work.slug}`);
  delete recipes[id];
  delete gameStories[id];
  delete dramaScripts[id];
  delete novelChapters[id];
  removeUserSearchEntry(id);
  return item;
}

export function trashPost(id: string): TrashItem | undefined {
  const post = postMap.get(id);
  if (!post || post.authorHandle !== CURRENT_USER.handle) return undefined;
  const item: TrashItem = {
    id,
    kind: "post",
    title: post.title,
    deletedAt: new Date().toISOString(),
    post,
  };
  writeLocal(LS_KEYS.trash, [item, ...loadTrash().filter((entry) => entry.id !== id)]);
  writeLocal(LS_KEYS.userPosts, loadUserPosts().filter((entry) => entry.id !== id));
  const index = posts.findIndex((entry) => entry.id === id);
  if (index >= 0) posts.splice(index, 1);
  postMap.delete(id);
  removeUserSearchEntry(id);
  return item;
}

export function restoreTrash(id: string): boolean {
  const item = loadTrash().find((entry) => entry.id === id);
  if (!item) return false;
  writeLocal(LS_KEYS.trash, loadTrash().filter((entry) => entry.id !== id));
  if (item.kind === "work" && item.work) {
    writeLocal(
      LS_KEYS.publishedWorks,
      [item.work, ...loadPublishedWorks().filter((entry) => entry.id !== id)],
    );
    if (item.content) {
      writeLocal(LS_KEYS.userContents, { ...loadUserContents(), [id]: item.content });
    }
    if (item.form) {
      writeLocal(LS_KEYS.publishedForms, { ...loadPublishedForms(), [id]: item.form });
    }
    registerWork(item.work, item.content ?? {});
    return true;
  }
  if (item.kind === "post" && item.post) {
    writeLocal(
      LS_KEYS.userPosts,
      [item.post, ...loadUserPosts().filter((entry) => entry.id !== id)],
    );
    registerPost(item.post);
    return true;
  }
  return false;
}

export function purgeTrashItem(id: string): void {
  const item = loadTrash().find((entry) => entry.id === id);
  if (!item) return;
  writeLocal(LS_KEYS.trash, loadTrash().filter((entry) => entry.id !== id));
  if (item.kind === "work" && item.work) {
    const versions = loadWorkVersions(id);
    for (const mediaId of collectMediaIds(item.work, item.content)) {
      void deleteMedia(mediaId).catch(() => undefined);
    }
    for (const version of versions) {
      for (const mediaId of collectMediaIds(version.work, version.content)) {
        void deleteMedia(mediaId).catch(() => undefined);
      }
    }
    const allVersions = readLocal<Record<string, WorkVersion[]>>(LS_KEYS.workVersions, {});
    delete allVersions[id];
    writeLocal(LS_KEYS.workVersions, allVersions);
  }
}

export function deletePublishedWork(id: string): void {
  writeLocal(
    LS_KEYS.publishedWorks,
    loadPublishedWorks().filter((work) => work.id !== id),
  );
  const index = works.findIndex((work) => work.id === id);
  const work = index >= 0 ? works[index] : workMap.get(id);
  const contents = loadUserContents();
  const content = contents[id];
  const mediaIds = new Set<string>();
  const workCoverId = work?.cover.imageId;
  if (workCoverId) mediaIds.add(workCoverId);
  if (content?.gameHtmlId) mediaIds.add(content.gameHtmlId);
  for (const mediaId of content?.gallery ?? []) mediaIds.add(mediaId);
  for (const block of content?.blocks ?? []) {
    if (block.mediaId) mediaIds.add(block.mediaId);
  }
  if (work?.type === "drama") {
    for (const episode of work.meta.episodes) {
      if (episode.videoId) mediaIds.add(episode.videoId);
    }
  }
  delete contents[id];
  writeLocal(LS_KEYS.userContents, contents);
  const forms = loadPublishedForms();
  delete forms[id];
  writeLocal(LS_KEYS.publishedForms, forms);
  if (work?.remixOf) {
    const parent = workMap.get(work.remixOf);
    if (parent) parent.remixedBy = (parent.remixedBy ?? []).filter((item) => item !== id);
  }
  if (index >= 0) works.splice(index, 1);
  workMap.delete(id);
  if (work) workBySlug.delete(`${work.type}/${work.slug}`);
  delete recipes[id];
  delete gameStories[id];
  delete dramaScripts[id];
  delete novelChapters[id];
  removeUserSearchEntry(id);
  for (const mediaId of mediaIds) {
    void deleteMedia(mediaId).catch(() => undefined);
  }
}

let bootstrapped = false;

export function bootstrapUserContent(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  const contents = loadUserContents();
  for (const work of loadPublishedWorks()) {
    registerWork(work, contents[work.id] ?? {});
  }
  for (const post of loadUserPosts()) {
    registerPost(post);
  }
}

bootstrapUserContent();
