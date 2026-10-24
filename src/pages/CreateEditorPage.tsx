import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Eye,
  Image as ImageIcon,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { ShareSheet } from "@/components/detail/ShareSheet";
import { MediaUpload } from "@/components/media/MediaUpload";
import { AuthorLine, TypeSticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { CURRENT_USER, WORK_TYPE_CONFIG } from "@/data/config";
import { challenges, workMap } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { track } from "@/lib/analytics";
import {
  coverForForm,
  coverPatterns,
  emptyForm,
  getPublishedForm,
  loadDraft,
  normalizeForm,
  patternLabel,
  publishWork,
  saveDraft,
  type CreateForm,
  type NovelChapterDraft,
  type TutorialBlockDraft,
} from "@/lib/userContent";
import { publishRemoteWork } from "@/lib/remoteContent";
import { supabase } from "@/lib/supabase";
import { workLink } from "@/lib/work";
import type { ContentType, Work } from "@/types";

const TYPES: ContentType[] = ["game", "drama", "novel", "tutorial"];

function isContentType(value: string | undefined): value is ContentType {
  return Boolean(value && (TYPES as string[]).includes(value));
}

export function CreateEditorPage() {
  const { type } = useParams();
  const { user, loading, configured } = useAuth();
  if (!isContentType(type)) return <NotFoundPage />;
  if (loading) return <div className="account-loading">正在确认登录状态…</div>;
  if (configured && !user) return <Navigate to="/login" replace />;
  return <Editor type={type} />;
}

function Editor({ type }: { type: ContentType }) {
  const config = WORK_TYPE_CONFIG[type];
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const draft = useMemo(() => loadDraft(type), [type]);
  const editId = searchParams.get("edit");
  const editing = editId ? workMap.get(editId) : undefined;
  const editForm = editId ? getPublishedForm(editId) : undefined;
  const isEditing = Boolean(editId && editing && editing.type === type && editForm);
  const remixOf = searchParams.get("remixOf");
  const challengeSlug = searchParams.get("challenge");
  const challenge = challengeSlug ? challenges.find((item) => item.slug === challengeSlug) : undefined;
  const [form, setForm] = useState<CreateForm>(() => {
    const base = isEditing && editForm
      ? normalizeForm(editForm, type)
      : draft?.form
        ? normalizeForm(draft.form, type)
        : emptyForm(type);
    if (!isEditing && remixOf) {
      base.remixOf = remixOf;
      const parent = workMap.get(remixOf);
      if (parent && !base.title) base.title = `关于《${parent.title}》的二创`;
    }
    if (!isEditing && challenge && !base.tags) base.tags = challenge.title;
    return base;
  });
  const [step, setStep] = useState(1);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(draft?.updatedAt ?? null);
  const [rights, setRights] = useState(isEditing);
  const [published, setPublished] = useState<Work | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  useDocumentTitle(isEditing ? `编辑 ${config.label} · 灵作` : `发布 ${config.label} · 灵作`);

  useEffect(() => {
    if (published || isEditing) return;
    const hasContent =
      Boolean(form.title.trim()) ||
      Boolean(form.summary.trim()) ||
      Boolean(form.prompt.trim()) ||
      Boolean(form.stepsText.trim()) ||
      (form.type === "novel" && form.novelChapters.some((chapter) => chapter.body.trim())) ||
      form.tutorialBlocks.length > 0 ||
      form.episodeVideos.some(Boolean);
    if (!hasContent) return;
    const timer = window.setTimeout(() => {
      saveDraft(form);
      setSavedAt(new Date().toISOString());
    }, 700);
    return () => window.clearTimeout(timer);
  }, [form, published, isEditing]);

  const cover = coverForForm(form);
  const parent = form.remixOf ? workMap.get(form.remixOf) : undefined;
  const update = (patch: Partial<CreateForm>) => setForm((current) => ({ ...current, ...patch }));
  const activeChapter = form.novelChapters[Math.min(chapterIndex, form.novelChapters.length - 1)] ?? {
    id: "",
    title: "",
    body: "",
  };

  const updateChapter = (index: number, patch: Partial<NovelChapterDraft>) => {
    update({
      novelChapters: form.novelChapters.map((chapter, itemIndex) =>
        itemIndex === index ? { ...chapter, ...patch } : chapter,
      ),
    });
  };

  const addChapter = () => {
    const next: NovelChapterDraft = {
      id: `chapter-${Date.now()}`,
      title: `第 ${form.novelChapters.length + 1} 章`,
      body: "",
    };
    update({ novelChapters: [...form.novelChapters, next] });
    setChapterIndex(form.novelChapters.length);
  };

  const removeChapter = (index: number) => {
    if (form.novelChapters.length <= 1) {
      toast({ title: "至少保留一章", desc: "可以先清空正文，再写新的第一章。" });
      return;
    }
    const next = form.novelChapters.filter((_, itemIndex) => itemIndex !== index);
    update({ novelChapters: next });
    setChapterIndex(Math.max(0, Math.min(index - 1, next.length - 1)));
  };

  const pasteIntoChapter = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast({ title: "剪贴板是空的" });
        return;
      }
      updateChapter(chapterIndex, {
        body: activeChapter.body ? `${activeChapter.body}\n\n${text}` : text,
      });
      toast({ title: "已粘贴到当前章节", desc: "可以直接在下面继续改。" });
    } catch {
      toast({
        title: "浏览器没有允许读取剪贴板",
        desc: "可以直接在正文里按 Ctrl / Cmd + V 粘贴。",
      });
    }
  };

  const addEpisode = () => {
    const count = form.episodes + 1;
    update({ episodes: count, episodeVideos: [...form.episodeVideos, undefined] });
  };

  const removeEpisode = (index: number) => {
    if (form.episodes <= 1) {
      toast({ title: "至少保留一集", desc: "可以清空这一集的视频，但先不要删掉最后一集。" });
      return;
    }
    update({
      episodes: form.episodes - 1,
      episodeVideos: form.episodeVideos.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const updateEpisodeVideo = (index: number, id: string | undefined) => {
    const videos = Array.from({ length: Math.max(form.episodes, index + 1) }, (_, itemIndex) =>
      itemIndex === index ? id : form.episodeVideos[itemIndex],
    );
    update({ episodeVideos: videos });
  };

  const addBlock = (blockType: TutorialBlockDraft["type"]) => {
    const block: TutorialBlockDraft = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type: blockType,
      text: "",
    };
    update({ tutorialBlocks: [...form.tutorialBlocks, block] });
  };

  const updateBlock = (index: number, patch: Partial<TutorialBlockDraft>) => {
    update({
      tutorialBlocks: form.tutorialBlocks.map((block, itemIndex) =>
        itemIndex === index ? { ...block, ...patch } : block,
      ),
    });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.tutorialBlocks.length) return;
    const next = [...form.tutorialBlocks];
    [next[index], next[target]] = [next[target], next[index]];
    update({ tutorialBlocks: next });
  };

  const removeBlock = (index: number) => {
    update({ tutorialBlocks: form.tutorialBlocks.filter((_, itemIndex) => itemIndex !== index) });
  };

  const stepIssues = useMemo(() => {
    const issues: string[] = [];
    if (!form.title.trim() || form.title.trim().length < 2) issues.push("标题至少 2 个字");
    if (!form.summary.trim() || form.summary.trim().length < 10) issues.push("简介至少 10 个字");
    return issues;
  }, [form, type]);

  const publishIssues = useMemo(() => {
    const issues = [...stepIssues];
    if (type === "game" && form.gameMode === "html" && !form.gameHtmlId) {
      issues.push("上传了 HTML 试玩方式，但还没有选择 HTML 文件");
    }
    if (
      type === "game" &&
      form.gameMode === "link" &&
      !/^https?:\/\/[^\s]+$/i.test((form.gameDemoUrl ?? "").trim())
    ) {
      issues.push("请填写完整的试玩链接（http / https）");
    }
    if (!form.aiDisclosure) issues.push("必须选择 AI 使用声明");
    if (!rights) issues.push("请确认内容授权");
    return issues;
  }, [stepIssues, form.aiDisclosure, form.gameMode, form.gameHtmlId, form.gameDemoUrl, rights, type]);

  const goNext = () => {
    if (step === 1 && stepIssues.length) {
      toast({ title: "还差一点", desc: stepIssues[0] });
      return;
    }
    setStep((current) => Math.min(3, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const publish = async () => {
    if (publishIssues.length) {
      toast({ title: "还不能发布", desc: publishIssues[0] });
      return;
    }
    let work: Work;
    try {
      work =
        supabase && user && profile
          ? await publishRemoteWork(form, profile, isEditing ? editing?.id : undefined)
          : publishWork(form, isEditing ? editing?.id : undefined);
    } catch (error) {
      toast({
        title: "发布失败",
        desc: error instanceof Error ? error.message : "请稍后重试。",
        tone: "ink",
      });
      return;
    }
    track(isEditing ? "work_update" : "work_publish", { type: work.type, id: work.id });
    setPublished(work);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast({
      title: isEditing ? "修改已保存" : "发布成功",
      desc: user ? "作品已写入 Supabase，其他访客也能看到。" : "作品已进入首页「今日上新」和你的个人主页。",
      tone: "game",
    });
  };

  if (published) {
    return (
      <div className="create-success-page">
        <div className="container">
          <div className="create-success">
            <span className="create-success__stamp">{isEditing ? "UPDATED" : "PUBLISHED"}</span>
            <span className="eyebrow">{isEditing ? "EDITED / 已更新" : "CREATED / 已发布"}</span>
            <h1>{isEditing ? "作品已更新。" : "你的作品已进入灵作。"}</h1>
            <p>
              {isEditing
                ? "标题、封面、正文和配方已经同步；作品链接、浏览和喜欢数据保持不变。"
                : "它现在会出现在首页「今日上新」、分类页和你的个人主页。数据只统计真实事件，所以现在是 0 次浏览、0 个喜欢。"}
            </p>
            <div className="success-card">
              <span className="success-card__cover" style={{ aspectRatio: published.cover.aspect ?? "16 / 10" }}>
                <Cover cover={published.cover} />
              </span>
              <span className="success-card__copy">
                <TypeSticker type={published.type} />
                <strong>{published.title}</strong>
                <small>{published.summary}</small>
                <span className="success-card__meta">
                  {published.tools.join(" / ")} · {published.license} · {published.aiDisclosure}
                </span>
              </span>
            </div>
            <div className="create-success__actions">
              <Link className="btn btn--primary" to={workLink(published)}>
                <Eye size={16} />
                查看作品
              </Link>
              <Link className="btn btn--outline" to={isEditing ? "/me" : "/"}>
                {isEditing ? "回到我的工作台" : "去首页看今日上新"}
                <ArrowRight size={15} />
              </Link>
              <button type="button" className="btn btn--outline" onClick={() => setShareOpen(true)}>
                <Sparkles size={15} />
                生成分享海报
              </button>
              {!isEditing ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setPublished(null);
                    setForm(emptyForm(type));
                    setStep(1);
                    setRights(false);
                  }}
                >
                  再发一件
                </button>
              ) : null}
            </div>
            <div className="create-success__foot">
              <span>{isEditing ? "修改已同步到作品详情、搜索和你的主页。" : "发布后仍然可以在「我的」里继续编辑或删除草稿。"}</span>
              <Link to="/me">去我的工作台</Link>
            </div>
          </div>
        </div>
        <ShareSheet work={published} open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    );
  }

  return (
    <div className="create-page create-editor-page">
      <div className="container">
        <h1 className="sr-only">{isEditing ? "编辑" : "发布"} {config.label}</h1>
        <div className="editor-topbar">
          <Link to={isEditing && editing ? workLink(editing) : "/create"} className="editor-back">
            <ArrowLeft size={17} />
            {isEditing ? "返回作品" : "发布入口"}
          </Link>
          <div className="editor-title">
            <span className="eyebrow">{isEditing ? "EDIT" : "CREATE"} / {isEditing ? "编辑" : "发布"} {config.label}</span>
            <strong>{form.title.trim() || "未命名作品"}</strong>
          </div>
          <div className="editor-topbar__actions">
            <span className="editor-saved">
              {isEditing
                ? "正在编辑已发布作品 · 保存后立即更新"
                : savedAt
                  ? `草稿已自动保存 · ${new Date(savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
                  : "草稿会自动保存"}
            </span>
            {!isEditing ? (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => {
                  saveDraft(form);
                  setSavedAt(new Date().toISOString());
                  toast({ title: "草稿已保存", desc: "下次进入会从草稿恢复。" });
                }}
              >
                <Save size={14} />
                保存草稿
              </button>
            ) : null}
          </div>
        </div>

        <div className="stepper">
          {[
            { num: 1, label: "作品内容" },
            { num: 2, label: "作品配方" },
            { num: 3, label: "发布设置" },
          ].map((item) => (
            <button
              key={item.num}
              type="button"
              className={`stepper__item ${step === item.num ? "is-active" : ""} ${step > item.num ? "is-done" : ""}`}
              onClick={() => {
                if (item.num < step) setStep(item.num);
              }}
              aria-current={step === item.num ? "step" : undefined}
            >
              <span>{step > item.num ? <Check size={13} /> : String(item.num).padStart(2, "0")}</span>
              {item.label}
            </button>
          ))}
        </div>

        {parent || challenge ? (
          <div className="create-context create-editor-context">
            {parent ? (
              <p>
                <span className="eyebrow">REMIX</span>
                二创自 <Link to={workLink(parent)}>《{parent.title}》</Link>，会保留原作者署名和血缘。
              </p>
            ) : null}
            {challenge ? (
              <p>
                <span className="eyebrow">CHALLENGE</span>
                正在参加「{challenge.title}」，标签已预填，可自行修改。
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="editor-layout">
          <div className="editor-main">
            {step === 1 ? (
              <>
                <section className="form-section">
                  <div className="form-section__head">
                    <span className="eyebrow">01 / CONTENT</span>
                    <h2>先说清楚这是什么</h2>
                    <p>标题和简介会出现在卡片、搜索结果和分享海报上。</p>
                  </div>
                  <Field label="标题" required hint="不要用「未命名」「测试」这类词。">
                    <input
                      value={form.title}
                      onChange={(event) => update({ title: event.target.value })}
                      placeholder={type === "game" ? "比如：便利店夜班" : "给你的作品起一个名字"}
                      maxLength={40}
                    />
                  </Field>
                  <Field label="一句话简介" required hint="具体一点，不要写「一个关于成长的故事」。">
                    <textarea
                      value={form.summary}
                      onChange={(event) => update({ summary: event.target.value })}
                      rows={3}
                      placeholder="谁、在哪、要做什么，以及一个让人想点开的细节。"
                      maxLength={160}
                    />
                  </Field>
                  <div className="field-row">
                    <Field label="封面字符" hint="一个字，会变成大封面。">
                      <input
                        value={form.glyph}
                        onChange={(event) => update({ glyph: event.target.value.slice(0, 1) })}
                        placeholder={form.title.slice(0, 1) || "灵"}
                        maxLength={1}
                      />
                    </Field>
                    <Field label="封面纹理">
                      <div className="pattern-options">
                        {coverPatterns().map((pattern) => (
                          <button
                            key={pattern}
                            type="button"
                            className={form.pattern === pattern ? "is-active" : ""}
                            onClick={() => update({ pattern })}
                          >
                            {patternLabel(pattern)}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                  <MediaUpload
                    kind="image"
                    value={form.coverImageId}
                    onChange={(id) =>
                      update({ coverImageId: id, coverAspect: id ? form.coverAspect : undefined })
                    }
                    onPresetChange={(preset) =>
                      update({ coverAspect: `${preset.width} / ${preset.height}` })
                    }
                    label="上传封面图片（可选，优先于字符封面）"
                    imagePresets={[
                      { label: "16:9 · 1600×900", width: 1600, height: 900 },
                      { label: "4:3 · 1200×900", width: 1200, height: 900 },
                      { label: "1:1 · 1080×1080", width: 1080, height: 1080 },
                      { label: "3:4 · 900×1200", width: 900, height: 1200 },
                      { label: "9:16 · 1080×1920", width: 1080, height: 1920 },
                    ]}
                  />
                </section>

                <section className="form-section">
                  <div className="form-section__head">
                    <span className="eyebrow">02 / TYPE FIELDS</span>
                    <h2>{config.label}专属信息</h2>
                  </div>

                  {type === "game" ? (
                    <>
                      <Field label="难度">
                        <select value={form.difficulty} onChange={(event) => update({ difficulty: event.target.value })}>
                          <option>低</option>
                          <option>中</option>
                          <option>高</option>
                        </select>
                      </Field>
                      <div className="field-row">
                        <Field label="玩法类型" hint="用 / 分隔。">
                          <input value={form.genres} onChange={(event) => update({ genres: event.target.value })} placeholder="叙事 / 解谜" />
                        </Field>
                        <Field label="引擎">
                          <input value={form.engine} onChange={(event) => update({ engine: event.target.value })} placeholder="HTML + CSS" />
                        </Field>
                      </div>
                      <Field label="试玩方式">
                        <div className="mode-options">
                          {[
                            { value: "generated" as const, label: "站内文字试玩", hint: "用简介生成一个短场景" },
                            { value: "html" as const, label: "上传 HTML", hint: "单文件小游戏，沙箱运行" },
                            { value: "link" as const, label: "外部链接", hint: "已在别处上线的试玩页" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={form.gameMode === item.value ? "is-active" : ""}
                              onClick={() => update({ gameMode: item.value })}
                            >
                              <strong>{item.label}</strong>
                              <span>{item.hint}</span>
                            </button>
                          ))}
                        </div>
                      </Field>
                      {form.gameMode === "html" ? (
                        <MediaUpload
                          kind="html"
                          value={form.gameHtmlId}
                          onChange={(id) => update({ gameHtmlId: id })}
                          label="上传 HTML 单文件"
                        />
                      ) : null}
                      {form.gameMode === "link" ? (
                        <Field label="试玩链接" hint="会在站内沙箱 iframe 打开；不支持嵌入时提供新标签入口。">
                          <input
                            value={form.gameDemoUrl}
                            onChange={(event) => update({ gameDemoUrl: event.target.value })}
                            placeholder="https://your-game.example/play"
                          />
                        </Field>
                      ) : null}
                      <Field label="操作说明">
                        <input value={form.controls} onChange={(event) => update({ controls: event.target.value })} placeholder="点击 / 空格确认" />
                      </Field>
                      {form.gameMode === "generated" ? (
                        <p className="form-hint-note">
                          站内试玩会根据简介生成一个短场景和两个选择，不需要再写开场白或第二幕。
                        </p>
                      ) : null}
                      <MediaUpload
                        kind="image"
                        value={form.galleryIds[0]}
                        onChange={(id) => update({ galleryIds: id ? [id] : [] })}
                        label="上传一张游戏截图（可选）"
                        compact
                      />
                    </>
                  ) : null}

                  {type === "drama" ? (
                    <>
                      <div className="field-row">
                        <Field label="单集时长（分钟）">
                          <input type="number" min={1} max={30} value={form.episodeMinutes} onChange={(event) => update({ episodeMinutes: Number(event.target.value) })} />
                        </Field>
                        <Field label="状态">
                          <select value={form.status} onChange={(event) => update({ status: event.target.value })}>
                            <option>连载中</option>
                            <option>已完结</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="题材" hint="用 / 分隔。">
                        <input value={form.genres} onChange={(event) => update({ genres: event.target.value })} placeholder="职场 / 轻喜剧" />
                      </Field>
                      <div className="episode-editor">
                        <div className="episode-editor__head">
                          <div>
                            <span className="eyebrow">EPISODES / 剧集视频</span>
                            <strong>{form.episodes} 集 · 可增删</strong>
                          </div>
                          <button type="button" className="text-btn" onClick={addEpisode}>
                            <Plus size={12} />
                            加一集
                          </button>
                        </div>
                        <div className="episode-media-list">
                          {Array.from({ length: form.episodes }, (_, index) => (
                            <div className="episode-media-row" key={index}>
                              <span>第 {index + 1} 集</span>
                              <MediaUpload
                                kind="video"
                                value={form.episodeVideos[index]}
                                onChange={(id) => updateEpisodeVideo(index, id)}
                                label={`上传第 ${index + 1} 集视频`}
                                compact
                              />
                              <button
                                type="button"
                                className="episode-delete"
                                aria-label={`删除第 ${index + 1} 集`}
                                onClick={() => removeEpisode(index)}
                              >
                                <Trash2 size={13} />
                                删除本集
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="form-hint-note">没有上传视频的集数会继续用台词和进度模拟。</p>
                      </div>
                      <Field label="第一集台词" hint="每行一句，会按 15 秒一句排进播放器；上传视频后仍作为字幕。">
                        <textarea
                          value={form.linesText}
                          onChange={(event) => update({ linesText: event.target.value })}
                          rows={5}
                          placeholder={"旁白：晚上九点四十，办公室只剩两盏灯。\n阿智：这是我的辞职信。"}
                        />
                      </Field>
                    </>
                  ) : null}

                  {type === "novel" ? (
                    <>
                      <div className="field-row">
                        <Field label="状态">
                          <select value={form.status} onChange={(event) => update({ status: event.target.value })}>
                            <option>连载中</option>
                            <option>已完结</option>
                          </select>
                        </Field>
                        <Field label="视角">
                          <select value={form.pov} onChange={(event) => update({ pov: event.target.value })}>
                            <option>第一人称</option>
                            <option>第三人称</option>
                            <option>双视角</option>
                          </select>
                        </Field>
                      </div>
                      <Field label="题材" hint="用 / 分隔。">
                        <input value={form.genres} onChange={(event) => update({ genres: event.target.value })} placeholder="科幻 / 治愈" />
                      </Field>
                      <Field label="试读摘录" hint="读者在目录页看到的第一段。">
                        <textarea value={form.excerpt} onChange={(event) => update({ excerpt: event.target.value })} rows={2} placeholder="月亮送来的时候，用一块灰布包着，碎成七块。" />
                      </Field>
                      <div className="writing-workspace">
                        <aside className="writing-chapters">
                          <div className="writing-chapters__head">
                            <span className="eyebrow">CHAPTERS / 章节</span>
                            <button type="button" className="text-btn" onClick={addChapter}>
                              <Plus size={12} />
                              加一章
                            </button>
                          </div>
                          {form.novelChapters.map((chapter, index) => (
                            <div key={chapter.id} className={index === chapterIndex ? "chapter-row is-active" : "chapter-row"}>
                              <button type="button" onClick={() => setChapterIndex(index)}>
                                <span>{String(index + 1).padStart(2, "0")}</span>
                                <strong>{chapter.title.trim() || `第 ${index + 1} 章`}</strong>
                                <small>{chapter.body.replace(/\s/g, "").length} 字</small>
                              </button>
                              <button
                                type="button"
                                className="chapter-row__delete"
                                aria-label={`删除第 ${index + 1} 章`}
                                onClick={() => removeChapter(index)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </aside>
                        <div className="writing-main">
                          <div className="writing-toolbar">
                            <input
                              className="writing-title"
                              value={activeChapter.title}
                              onChange={(event) => updateChapter(chapterIndex, { title: event.target.value })}
                              placeholder={`第 ${chapterIndex + 1} 章`}
                            />
                            <span>{activeChapter.body.replace(/\s/g, "").length} 字</span>
                          </div>
                          <textarea
                            className="writing-textarea"
                            value={activeChapter.body}
                            onChange={(event) => updateChapter(chapterIndex, { body: event.target.value })}
                            rows={16}
                            placeholder={"直接把 AI 写好的内容粘贴进来，再改。\n\n空行分段，发布后会在阅读器里按段落显示。"}
                          />
                          <div className="writing-foot">
                            <span>自动保存到草稿 · 空行分段 · 发布后在阅读器可读</span>
                            <button type="button" className="btn btn--outline btn--sm" onClick={pasteIntoChapter}>
                              <ClipboardPaste size={13} />
                              从剪贴板粘贴
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {type === "tutorial" ? (
                    <>
                      <div className="field-row">
                        <Field label="难度">
                          <select value={form.difficulty} onChange={(event) => update({ difficulty: event.target.value })}>
                            <option>入门</option>
                            <option>进阶</option>
                            <option>高阶</option>
                          </select>
                        </Field>
                        <Field label="总耗时（分钟）">
                          <input type="number" min={1} max={240} value={form.minutes} onChange={(event) => update({ minutes: Number(event.target.value) })} />
                        </Field>
                      </div>
                      <Field label="学完会得到什么" required>
                        <input value={form.output} onChange={(event) => update({ output: event.target.value })} placeholder="比如：30 秒短片 / 可玩的网页游戏" />
                      </Field>
                      <Field label="步骤（可选）" hint="每行一步，格式「标题：说明」。没有步骤也可以只发正文和素材。">
                        <textarea
                          value={form.stepsText}
                          onChange={(event) => update({ stepsText: event.target.value })}
                          rows={6}
                          placeholder={"写三句话分镜：先定谁、在哪、要做什么。\n选一束光：用光线确定片子的脾气。"}
                        />
                      </Field>
                      <div className="tutorial-blocks-editor">
                        <div className="tutorial-blocks-editor__head">
                          <div>
                            <span className="eyebrow">BODY / 正文与素材</span>
                            <strong>把过程、结果和视频放进来</strong>
                          </div>
                          <span>文字 / 图片 / 视频可以混排</span>
                        </div>
                        {form.tutorialBlocks.length ? (
                          <div className="block-list">
                            {form.tutorialBlocks.map((block, index) => (
                              <div className="block-editor" key={block.id}>
                                <div className="block-editor__head">
                                  <span>
                                    {block.type === "text" ? "文字" : block.type === "image" ? "图片" : "视频"} ·{" "}
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <div>
                                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="上移">
                                      <ChevronUp size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveBlock(index, 1)}
                                      disabled={index === form.tutorialBlocks.length - 1}
                                      aria-label="下移"
                                    >
                                      <ChevronDown size={13} />
                                    </button>
                                    <button type="button" onClick={() => removeBlock(index)} aria-label="删除这块">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                                {block.type === "text" ? (
                                  <textarea
                                    value={block.text ?? ""}
                                    onChange={(event) => updateBlock(index, { text: event.target.value })}
                                    rows={4}
                                    placeholder="写一段说明、一段踩坑记录，或者从 AI 那里复制来的结果。"
                                  />
                                ) : (
                                  <>
                                    <MediaUpload
                                      kind={block.type}
                                      value={block.mediaId}
                                      onChange={(id) => updateBlock(index, { mediaId: id })}
                                      label={block.type === "image" ? "上传过程 / 结果图片" : "上传过程 / 结果视频"}
                                      compact
                                    />
                                    <input
                                      value={block.caption ?? ""}
                                      onChange={(event) => updateBlock(index, { caption: event.target.value })}
                                      placeholder="图注 / 视频说明（可选）"
                                    />
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="block-empty">还没有正文素材。可以先放一张结果图，或者一段失败记录。</p>
                        )}
                        <div className="block-add">
                          <button type="button" onClick={() => addBlock("text")}>
                            <Plus size={13} /> 文字
                          </button>
                          <button type="button" onClick={() => addBlock("image")}>
                            <ImageIcon size={13} /> 图片
                          </button>
                          <button type="button" onClick={() => addBlock("video")}>
                            <Video size={13} /> 视频
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </section>
              </>
            ) : null}

            {step === 2 ? (
              <section className="form-section">
                <div className="form-section__head">
                  <span className="eyebrow">02 / RECIPE</span>
                  <h2>让别人能拆开看</h2>
                  <p>提示词、工作流都是可选的。可以公开一部分，也可以完全留空。</p>
                </div>
                {parent ? (
                  <div className="remix-notice">
                    <span className="eyebrow">REMIX / 二创</span>
                    <p>
                      这件作品二创自 <Link to={workLink(parent)}>《{parent.title}》</Link>。发布后会自动带上原作者署名和血缘。
                    </p>
                    <button type="button" className="text-btn" onClick={() => update({ remixOf: undefined })}>
                      取消二创关系
                    </button>
                  </div>
                ) : null}
                <Field label="提示词" hint="可以直接复制给 AI 工具。用 ____ 表示要替换的地方。">
                  <textarea
                    value={form.prompt}
                    onChange={(event) => update({ prompt: event.target.value })}
                    rows={8}
                    className="mono-input"
                    placeholder={"你是……\n请输出……\n限制：……"}
                  />
                </Field>
                <Field label="工作流" hint="每行一步，写你实际做了什么。">
                  <textarea
                    value={form.workflowText}
                    onChange={(event) => update({ workflowText: event.target.value })}
                    rows={5}
                    placeholder={"先写三个结局\n把每个场景压到两个按钮\n让 Claude 输出 JSON"}
                  />
                </Field>
                <div className="field-row">
                  <Field label="提示词可见性">
                    <select value={form.visibility} onChange={(event) => update({ visibility: event.target.value as CreateForm["visibility"] })}>
                      <option>完全公开</option>
                      <option>部分公开</option>
                      <option>仅展示思路</option>
                    </select>
                  </Field>
                  <Field label="二创权限">
                    <select value={form.license} onChange={(event) => update({ license: event.target.value as CreateForm["license"] })}>
                      <option>允许二创（需署名）</option>
                      <option>仅非商业二创</option>
                      <option>不可二创</option>
                    </select>
                  </Field>
                </div>
                <div className="field-row">
                  <Field label="使用工具" hint="用 / 或逗号分隔。">
                    <input value={form.tools} onChange={(event) => update({ tools: event.target.value })} placeholder="Claude / 即梦 / 剪映" />
                  </Field>
                  <Field label="模型">
                    <input value={form.models} onChange={(event) => update({ models: event.target.value })} placeholder="Claude Sonnet / GPT-4o" />
                  </Field>
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section className="form-section">
                <div className="form-section__head">
                  <span className="eyebrow">03 / PUBLISH</span>
                  <h2>最后三件事</h2>
                  <p>AI 声明必填。没有它，作品不会被公开展示。</p>
                </div>
                <Field label="AI 使用声明" required>
                  <select value={form.aiDisclosure} onChange={(event) => update({ aiDisclosure: event.target.value })}>
                    <option value="">请选择</option>
                    <option>含 AI 生成内容</option>
                    <option>含 AI 生成图像</option>
                    <option>含 AI 生成文本</option>
                    <option>含 AI 生成影像、配音</option>
                    <option>AI 辅助，主体为人工创作</option>
                  </select>
                </Field>
                <Field label="标签" hint="用逗号分隔，3–5 个最好。">
                  <input value={form.tags} onChange={(event) => update({ tags: event.target.value })} placeholder="叙事, 治愈, 像素" />
                </Field>
                <label className="rights-check">
                  <input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} />
                  <span>
                    我确认作品内容、素材和 IP 授权没有问题，没有使用未授权的真实人物肖像或隐私信息。
                  </span>
                </label>
                <div className="publish-summary">
                  <div>
                    <span>类型</span>
                    <strong>{config.label}</strong>
                  </div>
                  <div>
                    <span>配方</span>
                    <strong>{form.visibility}</strong>
                  </div>
                  <div>
                    <span>二创</span>
                    <strong>{form.license}</strong>
                  </div>
                  <div>
                    <span>AI 声明</span>
                    <strong>{form.aiDisclosure || "未选择"}</strong>
                  </div>
                </div>
                {publishIssues.length ? (
                  <p className="publish-warning">
                    还差：{publishIssues.join("、")}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="editor-nav">
              {step > 1 ? (
                <button type="button" className="btn btn--outline" onClick={goPrev}>
                  <ArrowLeft size={15} />
                  上一步
                </button>
              ) : isEditing && editing ? (
                <Link className="btn btn--outline" to={workLink(editing)}>
                  <ArrowLeft size={15} />
                  返回作品
                </Link>
              ) : (
                <Link className="btn btn--outline" to="/create">
                  <ArrowLeft size={15} />
                  换个类型
                </Link>
              )}
              <span className="editor-nav__hint">
                {step < 3 ? (isEditing ? "修改只在保存后生效" : "草稿会自动保存") : isEditing ? "保存后会立即更新" : "发布前会再检查一次"}
              </span>
              {step < 3 ? (
                <button type="button" className="btn btn--primary" onClick={goNext}>
                  下一步
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button type="button" className="btn btn--primary btn--lg" onClick={publish}>
                  <Upload size={16} />
                  {isEditing ? "保存修改" : "发布作品"}
                </button>
              )}
            </div>
          </div>

          <aside className="editor-aside">
            <div className="editor-preview">
              <div className="editor-preview__cover" style={{ aspectRatio: cover.aspect ?? "16 / 10" }}>
                <Cover cover={cover} />
                <TypeSticker type={type} />
              </div>
              <div className="editor-preview__body">
                <h3>{form.title.trim() || "未命名作品"}</h3>
                <p>{form.summary.trim() || "一句话简介会出现在这里。具体一点，让人想点开。"}</p>
                <div className="editor-preview__meta">
                  <span>{type === "game" ? (form.minutes > 0 ? `${form.minutes} 分钟` : "可试玩") : type === "tutorial" ? `${form.minutes} 分钟` : type === "drama" ? `${form.episodes} 集` : `${form.words || 0} 字`}</span>
                  <span>{form.license}</span>
                  <span>{form.aiDisclosure || "AI 声明待选择"}</span>
                </div>
                <div className="editor-preview__by">
                  <AuthorLine handle={profile?.handle ?? CURRENT_USER.handle} size="xs" />
                  <span>刚刚</span>
                </div>
              </div>
            </div>
            <div className="editor-tip">
              <Sparkles size={15} />
              <p>
                {step === 1
                  ? "首屏要让人知道能玩什么、能看什么。不要先讲理念。"
                  : step === 2
                    ? "配方不是给 AI 看的，是给下一个想做的人看的。"
                    : "发布后，作品会出现在首页「今日上新」和你的个人主页。"}
              </p>
            </div>
            <div className="editor-check">
              <span className="eyebrow">CHECKLIST</span>
              <ul>
                <li className={form.title.trim() ? "is-done" : ""}>
                  <Check size={12} /> 标题
                </li>
                <li className={form.summary.trim().length >= 10 ? "is-done" : ""}>
                  <Check size={12} /> 简介
                </li>
                <li className={form.prompt.trim() || form.workflowText.trim() ? "is-done" : ""}>
                  <Check size={12} /> 配方
                </li>
                <li className={form.aiDisclosure ? "is-done" : ""}>
                  <Check size={12} /> AI 声明
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="form-field">
      <span className="form-field__label">
        {label}
        {required ? <em>必填</em> : null}
      </span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
