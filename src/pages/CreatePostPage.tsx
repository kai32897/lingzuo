import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, PenLine, Send } from "lucide-react";
import { PostCard } from "@/components/cards/PostCard";
import { useToast } from "@/components/ui/Toast";
import { CURRENT_USER } from "@/data/config";
import { postMap, works } from "@/data/seed";
import { publishPost, updatePost } from "@/lib/userContent";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { readLocal, writeLocal } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Post, PostType } from "@/types";

interface PostDraft {
  type: PostType;
  title: string;
  content: string;
  tags: string;
  relatedWorkId: string;
  topic: string;
}

const POST_TYPES: { type: PostType; desc: string }[] = [
  { type: "讨论", desc: "一个开放的问题，或者一个刚冒出来的想法。" },
  { type: "求助", desc: "具体卡在哪里，你已经试过什么。" },
  { type: "交作业", desc: "跟着教程做完了，把结果交上来。" },
  { type: "创作日志", desc: "记录一版改动、一个决定，或者一次失败。" },
];

export function CreatePostPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const editingPost = editId ? postMap.get(editId) : undefined;
  const isEditing = Boolean(editingPost && editingPost.authorHandle === CURRENT_USER.handle);
  useDocumentTitle(isEditing ? "编辑动态 · 灵作" : "发布动态 · 灵作");
  const savedDraft = readLocal<PostDraft | null>("lz:post-draft", null);
  const initialRelated = searchParams.get("workId") ?? "";
  const relatedWork = works.find((work) => work.id === initialRelated);
  const queryType = searchParams.get("type");
  const [form, setForm] = useState<PostDraft>(() => {
    if (isEditing && editingPost) {
      return {
        type: editingPost.type,
        title: editingPost.title,
        content: editingPost.body.join("\n\n"),
        tags: editingPost.tags.join("，"),
        relatedWorkId: editingPost.relatedWorkId ?? "",
        topic: editingPost.topic ?? "",
      };
    }
    const base = savedDraft ?? {
      type: "讨论" as PostType,
      title: "",
      content: "",
      tags: "",
      relatedWorkId: "",
      topic: "",
    };
    const next = { ...base };
    if (queryType && POST_TYPES.some((item) => item.type === queryType)) {
      next.type = queryType as PostType;
    }
    if (initialRelated) next.relatedWorkId = initialRelated;
    if (next.type === "交作业" && relatedWork && !next.title) {
      next.title = `《${relatedWork.title}》的作业`;
    }
    return next;
  });

  useEffect(() => {
    if (isEditing) return;
    writeLocal("lz:post-draft", form);
  }, [form, isEditing]);

  const preview: Post = useMemo(
    () => ({
      id: "preview",
      type: form.type,
      title: form.title.trim() || "一条还没写标题的动态",
      excerpt: form.content.trim().slice(0, 96) || "正文会出现在这里。具体一点，会比「好看」更有用。",
      body: form.content.split(/\n+/).filter(Boolean),
      authorHandle: CURRENT_USER.handle,
      tags: form.tags.split(/[,，、]/).map((item) => item.trim()).filter(Boolean),
      relatedWorkId: form.relatedWorkId || undefined,
      topic: form.topic.trim() || undefined,
      createdAt: new Date().toISOString(),
      stats: { likes: 0, comments: 0 },
    }),
    [form],
  );

  const valid = form.title.trim().length >= 2 && form.content.trim().length >= 10;

  return (
    <div className="create-page post-create-page">
      <div className="container">
        <Link to={isEditing && editingPost ? `/posts/${editingPost.id}` : "/create"} className="editor-back post-create-back">
          <ArrowLeft size={17} />
          {isEditing ? "返回动态" : "发布入口"}
        </Link>
        <div className="post-create-layout">
          <div className="post-create-main">
            <span className="eyebrow">{isEditing ? "EDIT" : "CREATE"} / {isEditing ? "编辑动态" : "发布动态"}</span>
            <h1>{isEditing ? "把这条动态改清楚。" : "说点具体的。"}</h1>
            <p className="post-create-intro">
              {isEditing
                ? "修改会直接更新原动态，发布时间、点赞和评论保持不变。"
                : "不用先有作品。一个问题、一次失败、一份刚交的作业，都值得被看见。"}
            </p>

            <section className="form-section">
              <div className="form-section__head">
                <span className="eyebrow">01 / TYPE</span>
                <h2>这是什么类型的动态</h2>
              </div>
              <div className="post-type-grid">
                {POST_TYPES.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={cn("post-type-card", form.type === item.type && "is-active")}
                    aria-pressed={form.type === item.type}
                    onClick={() => setForm((current) => ({ ...current, type: item.type }))}
                  >
                    <strong>{item.type}</strong>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="form-section">
              <div className="form-section__head">
                <span className="eyebrow">02 / CONTENT</span>
                <h2>把问题说清楚</h2>
              </div>
              <label className="form-field">
                <span className="form-field__label">标题<em>必填</em></span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="比如：《便利店夜班》的结局，你们选了补货还是结账？"
                  maxLength={60}
                />
              </label>
              <label className="form-field">
                <span className="form-field__label">正文<em>必填</em></span>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  rows={9}
                  placeholder="具体一点：你看到了什么、试过什么、卡在哪里。"
                  maxLength={2000}
                />
                <small>{form.content.length}/2000 · 换行会保留。</small>
              </label>
              <div className="field-row">
                <label className="form-field">
                  <span className="form-field__label">标签</span>
                  <input
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    placeholder="讨论, 剧透, 便利店"
                  />
                </label>
                <label className="form-field">
                  <span className="form-field__label">话题</span>
                  <input
                    value={form.topic}
                    onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
                    placeholder="比如：十三楼宇宙"
                  />
                </label>
              </div>
              <label className="form-field">
                <span className="form-field__label">关联作品</span>
                <select
                  value={form.relatedWorkId}
                  onChange={(event) => setForm((current) => ({ ...current, relatedWorkId: event.target.value }))}
                >
                  <option value="">不关联</option>
                  {works.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.title} · {work.type}
                    </option>
                  ))}
                </select>
                <small>交作业时建议关联对应教程。</small>
              </label>
            </section>

            <div className="editor-nav">
              <Link className="btn btn--outline" to="/create">
                <ArrowLeft size={15} />
                返回
              </Link>
              <span className="editor-nav__hint">
                {valid
                  ? isEditing
                    ? "保存后立即更新原动态"
                    : "会立刻出现在社区动态和你的主页"
                  : "标题至少 2 个字，正文至少 10 个字"}
              </span>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                disabled={!valid}
                onClick={() => {
                  const input = {
                    type: form.type,
                    title: form.title,
                    content: form.content,
                    tags: form.tags,
                    relatedWorkId: form.relatedWorkId || undefined,
                    topic: form.topic,
                  };
                  const post = isEditing && editingPost ? updatePost(editingPost.id, input) : publishPost(input);
                  if (!post) {
                    toast({ title: "保存失败", desc: "这条动态可能已经被删除。", tone: "ink" });
                    return;
                  }
                  if (!isEditing) writeLocal("lz:post-draft", null);
                  toast({
                    title: isEditing ? "动态已更新" : "动态已发布",
                    desc: isEditing ? "原动态已经同步修改。" : "现在就去讨论区看看吧。",
                    tone: "game",
                  });
                  navigate(`/posts/${post.id}`);
                }}
              >
                <Send size={16} />
                {isEditing ? "保存修改" : "发布动态"}
              </button>
            </div>
          </div>

          <aside className="post-create-aside">
            <span className="eyebrow">PREVIEW / 预览</span>
            <div className="post-preview-disabled" aria-hidden="true">
              <PostCard post={preview} />
            </div>
            <div className="post-create-tip">
              <PenLine size={15} />
              <p>
                评论引导：说具体的问题。比如「你用了什么提示词？」比「求教程」更容易得到回复。
              </p>
            </div>
            <Link className="arrow-link" to="/guidelines">
              看社区规范
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
