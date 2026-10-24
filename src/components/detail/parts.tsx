import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Copy,
  Flag,
  Heart,
  History,
  MessageCircle,
  Pencil,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AuthorLine, Avatar, TypeSticker, WorkTypeDot } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { Cover } from "@/components/work/Cover";
import { ShareSheet } from "@/components/detail/ShareSheet";
import { CURRENT_USER } from "@/data/config";
import { currentAvatarText, currentName } from "@/lib/currentUser";
import { creatorMap, workMap } from "@/data/seed";
import { recipeFor } from "@/data/recipes";
import { getPublishedForm, loadWorkVersions, trashWork } from "@/lib/userContent";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RemoteComments } from "@/components/detail/RemoteComments";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { Comment, Work } from "@/types";
import { copyText, formatCount, timeAgo } from "@/lib/utils";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { metaLine, workLink } from "@/lib/work";
import { cn } from "@/lib/utils";

function displayName(handle: string): string {
  return (
    creatorMap.get(handle)?.name ??
    (handle === CURRENT_USER.handle ? currentName() : handle)
  );
}

function displayRole(handle: string): string {
  return creatorMap.get(handle)?.role ?? (handle === CURRENT_USER.handle ? CURRENT_USER.role : "社区成员");
}

function displayBio(handle: string): string {
  return (
    creatorMap.get(handle)?.bio ??
    (handle === CURRENT_USER.handle
      ? "刚学会用 AI 做东西。正在把第一个想法做成能发出来的作品。"
      : "还没有填写简介。")
  );
}

export function WorkHeader({ work }: { work: Work }) {
  const author = creatorMap.get(work.authorHandle);
  return (
    <header className="detail-head">
      <div className="detail-head__meta">
        <TypeSticker type={work.type} />
        <span>{metaLine(work)}</span>
        <span className="detail-ai">{work.aiDisclosure}</span>
        <span className="detail-license">{work.license}</span>
      </div>
      <h1>{work.title}</h1>
      <p className="detail-summary">{work.summary}</p>
      <div className="detail-by">
        <AuthorLine handle={work.authorHandle} />
        <span className="detail-by__dot" aria-hidden="true" />
        <span>发布于 {timeAgo(work.createdAt)}</span>
        <span className="detail-by__dot" aria-hidden="true" />
        <span className="detail-tools">{work.tools.join(" / ")}</span>
        {author?.badges[0] ? <span className="detail-badge">{author.badges[0]}</span> : null}
      </div>
    </header>
  );
}

export function WorkBreadcrumb({ work }: { work: Work }) {
  const typeLabel =
    work.type === "game" ? "AI 游戏" : work.type === "drama" ? "AI 短剧" : work.type === "novel" ? "AI 小说" : "AI 教程";
  const parent =
    work.type === "game" ? "/games" : work.type === "drama" ? "/dramas" : work.type === "novel" ? "/novels" : "/tutorials";
  return (
    <nav className="breadcrumb" aria-label="面包屑">
      <Link to="/">首页</Link>
      <span aria-hidden="true">/</span>
      <Link to={parent}>{typeLabel}</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{work.title}</span>
    </nav>
  );
}

export function ActionBar({ work }: { work: Work }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useLocalStorage<string[]>(LS_KEYS.liked, []);
  const [saved, setSaved] = useLocalStorage<string[]>(LS_KEYS.saved, []);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [remoteLiked, setRemoteLiked] = useState(false);
  const [remoteSaved, setRemoteSaved] = useState(false);
  const [remoteLikes, setRemoteLikes] = useState(work.stats.likes);
  const [remoteSaves, setRemoteSaves] = useState(work.stats.saves);
  const remoteId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(work.id);
  const remoteWork = Boolean(supabase && remoteId);

  useEffect(() => {
    const client = supabase;
    if (!client || !remoteWork || !user) return;
    let alive = true;
    const load = async () => {
      const [likeCount, ownLike, ownSave] = await Promise.all([
        client.from("likes").select("*", { count: "exact", head: true }).eq("work_id", work.id),
        client.from("likes").select("work_id").eq("work_id", work.id).eq("user_id", user.id).maybeSingle(),
        client.from("saves").select("work_id").eq("work_id", work.id).eq("user_id", user.id).maybeSingle(),
      ]);
      if (!alive) return;
      if (typeof likeCount.count === "number") setRemoteLikes(likeCount.count);
      setRemoteLiked(Boolean(ownLike.data));
      setRemoteSaved(Boolean(ownSave.data));
    };
    void load();
    return () => {
      alive = false;
    };
  }, [remoteWork, user, work.id]);

  const isLiked = remoteWork ? remoteLiked : liked.includes(work.id);
  const isSaved = remoteWork ? remoteSaved : saved.includes(work.id);
  const likeCount = remoteWork ? remoteLikes : work.stats.likes + (liked.includes(work.id) ? 1 : 0);
  const saveCount = remoteWork ? remoteSaves : work.stats.saves + (saved.includes(work.id) ? 1 : 0);
  const canRemix = work.license !== "不可二创";

  const toggleLike = async () => {
    if (remoteWork) {
      if (!user || !supabase) {
        navigate("/login");
        return;
      }
      if (remoteLiked) {
        const { error } = await supabase.from("likes").delete().eq("work_id", work.id).eq("user_id", user.id);
        if (error) return toast({ title: "取消喜欢失败", desc: error.message, tone: "ink" });
        setRemoteLiked(false);
        setRemoteLikes((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase.from("likes").insert({ work_id: work.id, user_id: user.id });
        if (error) return toast({ title: "喜欢失败", desc: error.message, tone: "ink" });
        setRemoteLiked(true);
        setRemoteLikes((count) => count + 1);
        toast({ title: "喜欢已经记下", desc: "这次喜欢会进入数据库。", tone: "game" });
      }
      return;
    }
    setLiked((prev) => (isLiked ? prev.filter((id) => id !== work.id) : [...prev, work.id]));
    if (!isLiked) toast({ title: "喜欢已经记下", desc: "推荐会参考这次喜欢。", tone: "game" });
  };

  const toggleSave = async () => {
    if (remoteWork) {
      if (!user || !supabase) {
        navigate("/login");
        return;
      }
      if (remoteSaved) {
        const { error } = await supabase.from("saves").delete().eq("work_id", work.id).eq("user_id", user.id);
        if (error) return toast({ title: "取消收藏失败", desc: error.message, tone: "ink" });
        setRemoteSaved(false);
        setRemoteSaves((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase.from("saves").insert({ work_id: work.id, user_id: user.id });
        if (error) return toast({ title: "收藏失败", desc: error.message, tone: "ink" });
        setRemoteSaved(true);
        setRemoteSaves((count) => count + 1);
      }
      toast({ title: remoteSaved ? "已取消收藏" : "已收藏", desc: "收藏状态已保存。", tone: "game" });
      return;
    }
    setSaved((prev) => (isSaved ? prev.filter((id) => id !== work.id) : [...prev, work.id]));
    toast({ title: isSaved ? "已取消收藏" : "已收藏到「我的」", desc: "刷新后也会保留。" });
  };

  return (
    <>
      <div className="action-bar">
        <div className="action-bar__inner">
          <button
            type="button"
            className={cn("action-btn", isLiked && "is-active")}
            aria-pressed={isLiked}
            onClick={() => void toggleLike()}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            <span>{formatCount(likeCount)}</span>
          </button>
          <button
            type="button"
            className={cn("action-btn", isSaved && "is-active")}
            aria-pressed={isSaved}
            onClick={() => void toggleSave()}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
            <span>{formatCount(saveCount)}</span>
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => setShareOpen(true)}
          >
            <Share2 size={18} />
            <span>分享</span>
          </button>
          {canRemix ? (
            <Link className="action-btn action-btn--remix" to={`/create?remixOf=${work.id}`}>
              <RotateCcw size={17} />
              <span>二创</span>
            </Link>
          ) : (
            <span className="action-btn is-disabled" title="作者关闭了二创">
              <RotateCcw size={17} />
              <span>不可二创</span>
            </span>
          )}
          <button type="button" className="action-btn action-btn--report" onClick={() => setReportOpen(true)}>
            <Flag size={15} />
            <span>举报</span>
          </button>
        </div>
      </div>
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} target={work.title} />
      <ShareSheet work={work} open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}

export function ReportDialog({
  open,
  onClose,
  target,
}: {
  open: boolean;
  onClose: () => void;
  target: string;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  const reasons = ["未授权 IP / 侵权", "真实人物肖像或隐私", "冒充他人", "色情或未成年人相关", "暴力或其它违规", "AI 声明不完整"];

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal report-modal"
        role="dialog"
        aria-modal="true"
        aria-label="举报内容"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__head">
          <div>
            <span className="eyebrow">REPORT / 举报</span>
            <h2>举报「{target}」</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭举报">
            <X size={18} />
          </button>
        </div>
        <p className="modal__desc">选择最接近的原因。演示版不会真的提交，但会记录你的选择。</p>
        <div className="report-reasons">
          {reasons.map((item) => (
            <button
              key={item}
              type="button"
              className={cn("report-reason", reason === item && "is-active")}
              aria-pressed={reason === item}
              onClick={() => setReason(item)}
            >
              {reason === item ? <Check size={13} /> : null}
              {item}
            </button>
          ))}
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!reason}
            onClick={() => {
              toast({ title: "举报已记录", desc: `原因：${reason}。高风险内容会被人工复核。` });
              setReason("");
              onClose();
            }}
          >
            提交举报
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function RecipePanel({ work }: { work: Work }) {
  const recipe = recipeFor(work.id);
  const { toast } = useToast();
  const [tab, setTab] = useState<"prompt" | "workflow" | "params">("prompt");
  const tabs = [
    { value: "prompt" as const, label: "提示词" },
    { value: "workflow" as const, label: "工作流" },
    { value: "params" as const, label: "参数" },
  ];

  return (
    <section className="detail-section recipe-panel" id="recipe">
      <div className="detail-section__head">
        <div>
          <span className="eyebrow">RECIPE / 作品配方</span>
          <h2>它是怎么做出来的</h2>
        </div>
        <span className="recipe-visibility">{recipe.visibility}</span>
      </div>

      <div className="recipe-tabs" role="tablist" aria-label="配方内容">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={cn("recipe-tab", tab === item.value && "is-active")}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "prompt" ? (
        <div className="recipe-prompt">
          <pre>{recipe.prompt}</pre>
          <div className="recipe-prompt__actions">
            <span className="mono-small">可直接复制，改成你的题材</span>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={async () => {
                const ok = await copyText(recipe.prompt);
                toast({
                  title: ok ? "提示词已复制" : "复制失败",
                  desc: ok ? "去你的 AI 工具里粘贴，再替换「____」。" : "可以手动选中代码块复制。",
                  tone: ok ? "game" : "ink",
                });
              }}
            >
              <Copy size={14} />
              复制提示词
            </button>
          </div>
        </div>
      ) : null}

      {tab === "workflow" ? (
        <ol className="recipe-workflow">
          {recipe.workflow.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {tab === "params" ? (
        <div className="recipe-params">
          {recipe.params.map((param) => (
            <span key={param}>{param}</span>
          ))}
        </div>
      ) : null}

      <div className="recipe-foot">
        <p>
          {recipe.visibility === "完全公开"
            ? "作者公开了完整配方。复现时请保留署名，二创请遵守授权。"
            : "作者只公开了部分配方。可以照着思路做，但不要直接搬运。"}
        </p>
        <Link className="btn btn--outline btn--sm" to={`/create?from=${work.id}`}>
          <Sparkles size={14} />
          一键复现
        </Link>
      </div>
    </section>
  );
}

export function RemixTree({ work }: { work: Work }) {
  const parent = work.remixOf ? workMap.get(work.remixOf) : undefined;
  const children = (work.remixedBy ?? [])
    .map((id) => workMap.get(id))
    .filter((item): item is Work => Boolean(item));

  return (
    <section className="detail-section remix-tree" id="lineage">
      <div className="detail-section__head">
        <div>
          <span className="eyebrow">LINEAGE / 创作血缘</span>
          <h2>谁启发了谁</h2>
        </div>
        <span className="mono-small">{parent || children.length ? "署名可见" : "还没有接力"}</span>
      </div>
      <div className="lineage">
        {parent ? (
          <div className="lineage__block">
            <span className="lineage__label">由这件作品二创</span>
            <Link className="lineage__node" to={workLink(parent)}>
              <span className="lineage__cover">
                <Cover cover={parent.cover} />
              </span>
              <span>
                <strong>{parent.title}</strong>
                <small>
                  {displayName(parent.authorHandle)} · {metaLine(parent)}
                </small>
              </span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : null}
        <div className="lineage__block">
          <span className="lineage__label">
            {children.length ? `被 ${children.length} 件作品接力` : "被谁接力"}
          </span>
          {children.length ? (
            <div className="lineage__children">
              {children.slice(0, 4).map((child) => (
                <Link key={child.id} className="lineage__node" to={workLink(child)}>
                  <span className="lineage__cover">
                    <Cover cover={child.cover} />
                  </span>
                  <span>
                    <strong>{child.title}</strong>
                    <small>{displayName(child.authorHandle)}</small>
                  </span>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="lineage__empty">还没有人接力。你可以成为第一个，发布时会自动带上原作者和署名。</p>
          )}
        </div>
      </div>
      <div className="lineage__foot">
        <span>
          <WorkTypeDot type={work.type} />
          二创必须 credit 原作者，血缘链公开可查。
        </span>
        <Link className="arrow-link" to={`/create?remixOf=${work.id}`}>
          继续接力
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </section>
  );
}

interface UserComment {
  id: string;
  targetId: string;
  authorHandle: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  replyToName?: string;
  spoiler: boolean;
  likes: number;
}

function LocalCommentThread({
  targetId,
  authorHandle,
  seedComments,
  heading = "讨论",
  placeholder = "说点具体的：你最喜欢哪一段？或者你用了什么提示词？",
}: {
  targetId: string;
  authorHandle?: string;
  seedComments?: Comment[];
  heading?: string;
  placeholder?: string;
}) {
  const { toast } = useToast();
  const [userComments, setUserComments] = useLocalStorage<UserComment[]>(LS_KEYS.comments, []);
  const [commentLikes, setCommentLikes] = useLocalStorage<Record<string, number>>(
    LS_KEYS.commentLikes,
    {},
  );
  const [likedComments, setLikedComments] = useLocalStorage<string[]>(LS_KEYS.likedComments, []);
  const [content, setContent] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [sort, setSort] = useState<"latest" | "hot">("latest");
  const [revealed, setRevealed] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const all = useMemo(() => {
    const base = (seedComments ?? []).map((comment) => ({
      id: comment.id,
      targetId,
      authorHandle: comment.authorHandle,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: undefined,
      parentId: undefined,
      replyToName: undefined,
      spoiler: Boolean(comment.spoiler),
      likes: comment.likes,
    }));
    const mine = userComments.filter((comment) => comment.targetId === targetId);
    return [...base, ...mine].sort((a, b) =>
      sort === "hot"
        ? b.likes - a.likes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [seedComments, targetId, userComments, sort]);

  const submit = () => {
    const text = content.trim();
    if (!text) return;
    const parent = replyTo ? all.find((comment) => comment.id === replyTo.id) : undefined;
    const comment: UserComment = {
      id: `uc-${Date.now()}`,
      targetId,
      authorHandle: CURRENT_USER.handle,
      content: text,
      createdAt: new Date().toISOString(),
      parentId: parent ? (parent.parentId ?? parent.id) : undefined,
      replyToName: parent ? replyTo?.name : undefined,
      spoiler,
      likes: 0,
    };
    setUserComments((prev) => [...prev, comment]);
    setContent("");
    setSpoiler(false);
    setReplyTo(null);
    toast({
      title: parent ? "回复已发布" : "评论已发布",
      desc: "演示版保存在本地，刷新后还在。",
      tone: "game",
    });
  };

  const threads = useMemo(() => {
    const byId = new Map(all.map((comment) => [comment.id, comment]));
    const roots: typeof all = [];
    const replies = new Map<string, typeof all>();
    for (const comment of all) {
      const parent = comment.parentId ? byId.get(comment.parentId) : undefined;
      if (!parent) {
        roots.push(comment);
        continue;
      }
      const rootId = parent.parentId && byId.has(parent.parentId) ? parent.parentId : parent.id;
      const list = replies.get(rootId) ?? [];
      list.push(comment);
      replies.set(rootId, list);
    }
    return roots.map((root) => ({ root, replies: replies.get(root.id) ?? [] }));
  }, [all]);

  const ordered = useMemo(
    () => threads.flatMap(({ root, replies }) => [root, ...replies]),
    [threads],
  );

  return (
    <section className="detail-section comment-thread" id="comments">
      <div className="detail-section__head">
        <div>
          <span className="eyebrow">DISCUSSION / 讨论</span>
          <h2>{heading}</h2>
        </div>
        <div className="comment-sort">
          <button
            type="button"
            className={cn(sort === "latest" && "is-active")}
            onClick={() => setSort("latest")}
          >
            最新
          </button>
          <button
            type="button"
            className={cn(sort === "hot" && "is-active")}
            onClick={() => setSort("hot")}
          >
            最热
          </button>
        </div>
      </div>

      <div className="comment-form">
        <Avatar
          name={currentName()}
          text={currentAvatarText()}
          color={CURRENT_USER.avatarColor}
          size="sm"
        />
        <div className="comment-form__main">
          {replyTo ? (
            <div className="comment__reply-banner">
              <span>回复 @{replyTo.name}</span>
              <button type="button" onClick={() => setReplyTo(null)}>
                取消
              </button>
            </div>
          ) : null}
          <textarea
            ref={inputRef}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={replyTo ? `回复 @${replyTo.name}：` : placeholder}
            rows={3}
            maxLength={500}
          />
          <div className="comment-form__foot">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={spoiler}
                onChange={(event) => setSpoiler(event.target.checked)}
              />
              含剧透
            </label>
            <span className="comment-form__count">{content.length}/500</span>
            <button type="button" className="btn btn--primary btn--sm" disabled={!content.trim()} onClick={submit}>
              {replyTo ? "发布回复" : "发布评论"}
            </button>
          </div>
        </div>
      </div>

      {all.length ? (
        <div className="comment-list">
          {ordered.map((comment) => {
            const creator = creatorMap.get(comment.authorHandle);
            const displayName =
              creator?.name ??
              (comment.authorHandle === CURRENT_USER.handle
                ? currentName()
                : comment.authorHandle);
            const isSpoilerHidden = comment.spoiler && !revealed.includes(comment.id);
            const isMine =
              comment.authorHandle === CURRENT_USER.handle &&
              userComments.some((item) => item.id === comment.id);
            const isCommentLiked = likedComments.includes(comment.id);
            return (
              <article className={cn("comment", comment.parentId && "comment--reply")} key={comment.id}>
                <Avatar handle={comment.authorHandle} name={displayName} size="sm" />
                <div className="comment__body">
                  <div className="comment__head">
                    <Link to={`/u/${comment.authorHandle}`} className="comment__name">
                      {displayName}
                    </Link>
                    {comment.authorHandle === authorHandle ? (
                      <span className="comment__badge">作者</span>
                    ) : null}
                    <span className="comment__time">
                      {timeAgo(comment.createdAt)}
                      {comment.updatedAt ? " · 已编辑" : ""}
                    </span>
                  </div>
                  {comment.parentId && comment.replyToName ? (
                    <p className="comment__reply-to">回复 @{comment.replyToName}</p>
                  ) : null}
                  {editingId === comment.id ? (
                    <div className="comment__edit">
                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        rows={3}
                        maxLength={500}
                        autoFocus
                        aria-label="编辑评论"
                      />
                      <div className="comment__edit-actions">
                        <span>{editContent.length}/500</span>
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={!editContent.trim()}
                          onClick={() => {
                            const next = editContent.trim();
                            if (!next) return;
                            setUserComments((prev) =>
                              prev.map((item) =>
                                item.id === comment.id
                                  ? { ...item, content: next, updatedAt: new Date().toISOString() }
                                  : item,
                              ),
                            );
                            setEditingId(null);
                            setEditContent("");
                            toast({ title: "评论已更新" });
                          }}
                        >
                          保存修改
                        </button>
                      </div>
                    </div>
                  ) : isSpoilerHidden ? (
                    <button
                      type="button"
                      className="comment__spoiler"
                      onClick={() => setRevealed((prev) => [...prev, comment.id])}
                    >
                      含剧透 · 点击显示
                    </button>
                  ) : (
                    <p className="comment__text">{comment.content}</p>
                  )}
                  <div className="comment__foot">
                    <button
                      type="button"
                      className={cn("comment__like", isCommentLiked && "is-active")}
                      aria-pressed={isCommentLiked}
                      aria-label={isCommentLiked ? "取消喜欢这条评论" : "喜欢这条评论"}
                      onClick={() => {
                        setLikedComments((prev) =>
                          isCommentLiked ? prev.filter((id) => id !== comment.id) : [...prev, comment.id],
                        );
                        setCommentLikes((prev) => ({
                          ...prev,
                          [comment.id]: Math.max(0, (prev[comment.id] ?? 0) + (isCommentLiked ? -1 : 1)),
                        }));
                      }}
                    >
                      <Heart size={12} fill={isCommentLiked ? "currentColor" : "none"} />
                      {comment.likes + (commentLikes[comment.id] ?? 0)}
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        setReplyTo({ id: comment.id, name: displayName });
                        setEditingId(null);
                        window.requestAnimationFrame(() => inputRef.current?.focus());
                      }}
                    >
                      回复
                    </button>
                    <button
                      type="button"
                      className="comment__report"
                      onClick={() => setReportTarget(`评论 by ${displayName}`)}
                    >
                      举报
                    </button>
                    {isMine && editingId !== comment.id ? (
                      <button
                        type="button"
                        className="comment__edit-btn"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        编辑
                      </button>
                    ) : null}
                    {isMine ? (
                      <button
                        type="button"
                        className="comment__delete"
                        onClick={() => {
                          const childIds = userComments
                            .filter((item) => item.parentId === comment.id)
                            .map((item) => item.id);
                          const warning = childIds.length
                            ? `删除这条评论和它下面的 ${childIds.length} 条回复？`
                            : "删除这条评论？";
                          if (!window.confirm(warning)) return;
                          const removed = new Set([comment.id, ...childIds]);
                          setUserComments((prev) => prev.filter((item) => !removed.has(item.id)));
                          setCommentLikes((prev) => {
                            const next = { ...prev };
                            removed.forEach((id) => delete next[id]);
                            return next;
                          });
                          setLikedComments((prev) => prev.filter((id) => !removed.has(id)));
                          if (editingId === comment.id) setEditingId(null);
                          if (replyTo && removed.has(replyTo.id)) setReplyTo(null);
                          toast({ title: childIds.length ? "评论和回复已删除" : "评论已删除" });
                        }}
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="comment-empty">
          <MessageCircle size={22} />
          <p>还没有评论。说点具体的，会比「好看」更有用。</p>
        </div>
      )}
      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        target={reportTarget ?? ""}
      />
    </section>
  );
}

export function CommentThread(props: Parameters<typeof LocalCommentThread>[0]) {
  const remote = Boolean(
    supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(props.targetId),
  );
  return remote ? <RemoteComments {...props} /> : <LocalCommentThread {...props} />;
}

export function DetailAside({ work }: { work: Work }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const isOwner = work.authorHandle === CURRENT_USER.handle;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canEdit = isOwner && Boolean(getPublishedForm(work.id));
  const hasVersions = isOwner && loadWorkVersions(work.id).length > 0;
  return (    <aside className="detail-aside">
      {isOwner ? (
        <section className="owner-panel">
          <span className="eyebrow">OWNER / 作品管理</span>
          <h2>这是你的作品</h2>
          <p>修改会同步到详情、主页和搜索结果；删除会先移入回收站，视频和封面暂时保留，可以恢复。</p>
          <div className="owner-panel__actions">
            {canEdit ? (
              <Link className="btn btn--outline btn--sm" to={`/create/${work.type}?edit=${work.id}`}>
                <Pencil size={14} />
                编辑作品
              </Link>
            ) : null}
            {hasVersions ? (
              <Link className="btn btn--outline btn--sm" to={`/works/${work.id}/versions`}>
                <History size={14} />
                版本历史
              </Link>
            ) : null}
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
              删除作品
            </button>
          </div>
        </section>
      ) : null}
      <section className="aside-card">
        <span className="eyebrow">STATS / 数据</span>
        <div className="detail-stats">
          <div>
            <strong>{formatCount(work.stats.views)}</strong>
            <span>浏览</span>
          </div>
          <div>
            <strong>{formatCount(work.stats.likes)}</strong>
            <span>喜欢</span>
          </div>
          <div>
            <strong>{formatCount(work.stats.saves)}</strong>
            <span>收藏</span>
          </div>
          <div>
            <strong>{formatCount(work.stats.comments)}</strong>
            <span>评论</span>
          </div>
        </div>
        <div className="aside-row">
          <span>AI 声明</span>
          <strong>{work.aiDisclosure}</strong>
        </div>
        <div className="aside-row">
          <span>二创权限</span>
          <strong>{work.license}</strong>
        </div>
        <div className="aside-row">
          <span>使用工具</span>
          <strong>{work.tools.join(" / ")}</strong>
        </div>
        <div className="aside-row">
          <span>模型</span>
          <strong>{work.models.join(" / ")}</strong>
        </div>
        <div className="aside-tags">
          {work.tags.map((tag) => (
            <Link key={tag} to={`/topics/${encodeURIComponent(tag)}`}>
              #{tag}
            </Link>
          ))}
        </div>
      </section>

      <section className="aside-author">
        <span className="eyebrow">CREATOR / 作者</span>
        <div className="aside-author__head">
          <Avatar handle={work.authorHandle} size="lg" />
          <div>
            <Link to={`/u/${work.authorHandle}`}>{displayName(work.authorHandle)}</Link>
            <span>{displayRole(work.authorHandle)}</span>
          </div>
        </div>
        <p>{displayBio(work.authorHandle)}</p>
        <div className="aside-author__links">
          <Link to={`/u/${work.authorHandle}`}>看主页</Link>
          {isOwner ? (
            <Link to="/me">管理作品</Link>
          ) : (
            <Link to={`/create?remixOf=${work.id}`}>合作 / 接力</Link>
          )}
        </div>
      </section>
      <ConfirmDialog
        open={deleteOpen}
        title={`删除《${work.title}》？`}
        description={
          work.type === "drama"
            ? "这会从公开页面移除作品，并把剧集视频、封面和配方放入回收站，之后可以恢复。彻底删除需要在回收站里操作。"
            : "这会从公开页面移除作品，并把封面、配方等内容放入回收站，之后可以恢复。彻底删除需要在回收站里操作。"
        }
        confirmLabel="移入回收站"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          trashWork(work.id);
          toast({ title: "作品已移入回收站", desc: "视频和封面还在，可以随时恢复。" });
          navigate("/trash");
        }}
      />
    </aside>
  );
}

export function RelatedWorks({
  work,
  works,
  title = "相关推荐",
  limit = 4,
}: {
  work?: Work;
  works: Work[];
  title?: string;
  limit?: number;
}) {
  const items = works
    .filter((item) => !work || item.id !== work.id)
    .sort((a, b) => {
      if (!work) return b.stats.likes - a.stats.likes;
      const aScore = a.tags.filter((tag) => work.tags.includes(tag)).length + (a.authorHandle === work.authorHandle ? 1 : 0);
      const bScore = b.tags.filter((tag) => work.tags.includes(tag)).length + (b.authorHandle === work.authorHandle ? 1 : 0);
      return bScore - aScore || b.stats.likes - a.stats.likes;
    })
    .slice(0, limit);

  if (!items.length) return null;
  return (
    <section className="detail-section related-section">
      <div className="detail-section__head">
        <div>
          <span className="eyebrow">NEXT / 继续逛</span>
          <h2>{title}</h2>
        </div>
        <span className="mono-small">{items.length} 件</span>
      </div>
      <div className="related-grid">
        {items.map((item) => (
          <Link key={item.id} className="related-card" to={workLink(item)}>
            <span className="related-card__cover">
              <Cover cover={item.cover} />
            </span>
            <span className="related-card__copy">
              <TypeSticker type={item.type} variant="tag" />
              <strong>{item.title}</strong>
              <small>{metaLine(item)}</small>
              <span>{creatorMap.get(item.authorHandle)?.name ?? displayName(item.authorHandle)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="detail-section__head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}
