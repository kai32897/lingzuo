import { creatorMap, creators, workMap, workBySlug, works } from "@/data/seed";
import { gameStories } from "@/data/gameStories";
import { dramaScripts } from "@/data/dramaScripts";
import { novelChapters } from "@/data/chapters";
import { recipes } from "@/data/recipes";
import { removeUserSearchEntry } from "@/lib/search";
import {
  buildWork,
  contentFor,
  registerRemoteWork,
  type CreateForm,
  type UserWorkContent,
} from "@/lib/userContent";
import { LS_KEYS, readLocal, writeLocal } from "@/lib/storage";
import { supabase, type Profile } from "@/lib/supabase";
import type { Creator, Work } from "@/types";

interface RemoteWorkRow {
  id: string;
  type: Work["type"];
  slug: string;
  title: string;
  summary: string;
  cover_url: string | null;
  tags: string[];
  tools: string[];
  models: string[];
  license: Work["license"];
  ai_disclosure: string;
  meta: Record<string, unknown>;
  content: (UserWorkContent & { __form?: CreateForm }) | null;
  created_at: string;
  author: Profile | null;
}

function ensureCreator(profile: Profile): void {
  if (creatorMap.has(profile.handle)) return;
  const creator: Creator = {
    handle: profile.handle,
    name: profile.name,
    avatarText: profile.name.slice(0, 1),
    avatarColor: "#2F4BFF",
    role: "社区创作者",
    bio: profile.bio || "刚来到灵作，正在做第一件作品。",
    location: profile.location || "线上",
    links: [],
    tools: [],
    badges: [],
    joined: profile.created_at,
    stats: { works: 0, followers: 0, following: 0, likes: 0 },
  };
  creators.push(creator);
  creatorMap.set(profile.handle, creator);
}

function toWork(row: RemoteWorkRow): { work: Work; content: UserWorkContent; form: CreateForm } | null {
  const form = row.content?.__form;
  if (!form || !row.author) return null;
  const base = buildWork(form);
  const content = { ...row.content };
  delete content.__form;
  const work = {
    ...base,
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    authorHandle: row.author.handle,
    tags: row.tags,
    tools: row.tools,
    models: row.models,
    license: row.license,
    aiDisclosure: row.ai_disclosure,
    createdAt: row.created_at,
    stats: { views: 0, likes: 0, saves: 0, comments: 0, remixes: 0 },
    cover: row.cover_url ? { ...base.cover, imageId: row.cover_url } : base.cover,
    meta: row.meta,
  } as unknown as Work;
  return { work, content: content as UserWorkContent, form };
}

export async function hydrateRemoteWorks(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from("works")
    .select("*, author:profiles!works_author_id_fkey(*)")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("Remote works unavailable", error.message);
    return;
  }
  const forms = readLocal<Record<string, CreateForm>>(LS_KEYS.publishedForms, {});
  for (const row of (data ?? []) as RemoteWorkRow[]) {
    const mapped = toWork(row);
    if (!mapped) continue;
    ensureCreator(row.author as Profile);
    registerRemoteWork(mapped.work, mapped.content);
    forms[mapped.work.id] = mapped.form;
  }
  writeLocal(LS_KEYS.publishedForms, forms);

  if (import.meta.env.VITE_HIDE_DEMO_WORKS === "true") {
    const seedIds = works.filter((work) => work.id.startsWith("w-")).map((work) => work.id);
    for (const id of seedIds) {
      const work = workMap.get(id);
      const index = works.findIndex((item) => item.id === id);
      if (index >= 0) works.splice(index, 1);
      workMap.delete(id);
      if (work) workBySlug.delete(`${work.type}/${work.slug}`);
      delete recipes[id];
      delete gameStories[id];
      delete dramaScripts[id];
      delete novelChapters[id];
      removeUserSearchEntry(id);
    }
    console.info(`演示作品已隐藏 ${seedIds.length} 件`);
  }
}

export async function publishRemoteWork(
  form: CreateForm,
  profile: Profile,
  editId?: string,
): Promise<Work> {
  if (!supabase) throw new Error("Supabase 未配置");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("请先登录");
  const existing = editId ? workMap.get(editId) : undefined;
  const base = buildWork(form, existing);
  const work = {
    ...base,
    id: existing?.id ?? crypto.randomUUID(),
    slug: existing?.slug ?? `r-${Date.now().toString(36)}`,
    authorHandle: profile.handle,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    stats: existing?.stats ?? { views: 0, likes: 0, saves: 0, comments: 0, remixes: 0 },
  } as unknown as Work;
  const content = { ...contentFor(form), __form: form };
  const payload = {
    author_id: auth.user.id,
    type: work.type,
    slug: work.slug,
    title: work.title,
    summary: work.summary,
    cover_url: work.cover.imageId?.startsWith("http") ? work.cover.imageId : null,
    tags: work.tags,
    tools: work.tools,
    models: work.models,
    license: work.license,
    ai_disclosure: work.aiDisclosure,
    meta: work.meta,
    content,
    published: true,
  };
  if (existing) {
    const { error } = await supabase
      .from("works")
      .update(payload)
      .eq("id", work.id)
      .eq("author_id", auth.user.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("works").insert(payload);
    if (error) throw new Error(error.message);
  }
  ensureCreator(profile);
  registerRemoteWork(work, contentFor(form));
  const forms = readLocal<Record<string, CreateForm>>(LS_KEYS.publishedForms, {});
  forms[work.id] = form;
  writeLocal(LS_KEYS.publishedForms, forms);
  return work;
}
