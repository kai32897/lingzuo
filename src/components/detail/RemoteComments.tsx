import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { CURRENT_USER } from "@/data/config";
import { supabase } from "@/lib/supabase";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { cn, timeAgo } from "@/lib/utils";

interface RemoteComment {
  id: string;
  work_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  spoiler: boolean;
  created_at: string;
  updated_at: string;
  author: { handle: string; name: string; avatar_url: string | null } | null;
}

export function RemoteComments({
  targetId,
  authorHandle,
  heading = "讨论",
  placeholder = "说点具体的：你最喜欢哪一段？或者你用了什么提示词？",
}: {
  targetId: string;
  authorHandle?: string;
  heading?: string;
  placeholder?: string;
}) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<RemoteComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [replyTo, setReplyTo] = useState<RemoteComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [likes, setLikes] = useLocalStorage<Record<string, number>>(LS_KEYS.commentLikes, {});

  const load = async () => {
    if (!supabase) return;
    const { data, error: loadError } = await supabase
      .from("comments")
      .select("*, author:profiles!comments_author_id_fkey(handle,name,avatar_url)")
      .eq("work_id", targetId)
      .order("created_at", { ascending: true });
    if (loadError) {
      setError(loadError.message);
    } else {
      setError("");
      setComments((data ?? []) as RemoteComment[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    if (!supabase) return;
    const channel = supabase
      .channel(`comments-${targetId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `work_id=eq.${targetId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [targetId]);

  const threads = useMemo(() => {
    const roots = comments.filter((comment) => !comment.parent_id);
    return roots.map((root) => ({
      root,
      replies: comments.filter((comment) => comment.parent_id === root.id),
    }));
  }, [comments]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user || !content.trim()) return;
    setBusy(true);
    const { error: insertError } = await supabase.from("comments").insert({
      work_id: targetId,
      author_id: user.id,
      parent_id: replyTo?.parent_id ?? replyTo?.id ?? null,
      content: content.trim(),
      spoiler,
    });
    setBusy(false);
    if (insertError) {
      toast({ title: "评论失败", desc: insertError.message, tone: "ink" });
      return;
    }
    setContent("");
    setSpoiler(false);
    setReplyTo(null);
    toast({ title: replyTo ? "回复已发布" : "评论已发布", tone: "game" });
    void load();
  };

  const remove = async (comment: RemoteComment) => {
    if (!supabase) return;
    const count = comments.filter((item) => item.parent_id === comment.id).length;
    if (!window.confirm(count ? `删除这条评论和 ${count} 条回复？` : "删除这条评论？")) return;
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", comment.id);
    if (deleteError) {
      toast({ title: "删除失败", desc: deleteError.message, tone: "ink" });
      return;
    }
    toast({ title: "评论已删除" });
    void load();
  };

  const renderComment = (comment: RemoteComment, nested: boolean) => {
    const displayName = comment.author?.name ?? comment.author?.handle ?? "用户";
    const handle = comment.author?.handle ?? "";
    const mine = comment.author_id === user?.id;
    return (
      <article className={cn("comment", nested && "comment--reply")} key={comment.id}>
        <Avatar handle={handle} name={displayName} size="sm" />
        <div className="comment__body">
          <div className="comment__head">
            <Link to={`/u/${handle}`} className="comment__name">{displayName}</Link>
            {handle === authorHandle ? <span className="comment__badge">作者</span> : null}
            <span className="comment__time">{timeAgo(comment.created_at)}</span>
          </div>
          {nested && comment.parent_id ? <p className="comment__reply-to">回复评论</p> : null}
          {comment.spoiler ? <p className="comment__text">含剧透：{comment.content}</p> : <p className="comment__text">{comment.content}</p>}
          <div className="comment__foot">
            <button
              type="button"
              className="comment__like"
              onClick={() =>
                setLikes((prev) => ({ ...prev, [comment.id]: (prev[comment.id] ?? 0) + 1 }))
              }
            >
              <Heart size={12} />
              {likes[comment.id] ?? 0}
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setReplyTo(comment);
                setContent("");
              }}
            >
              回复
            </button>
            {mine ? (
              <button type="button" className="comment__delete" onClick={() => void remove(comment)}>
                删除
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className="detail-section comment-thread" id="comments">
      <div className="detail-section__head">
        <div>
          <span className="eyebrow">DISCUSSION / 讨论</span>
          <h2>{heading}</h2>
        </div>
        <span className="mono-small">{comments.length} 条真实评论</span>
      </div>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <Avatar name={profile?.name ?? "我"} text={(profile?.name ?? "我").slice(0, 1)} color={CURRENT_USER.avatarColor} size="sm" />
          <div className="comment-form__main">
            {replyTo ? (
              <div className="comment__reply-banner">
                <span>回复 @{replyTo.author?.name ?? replyTo.author?.handle}</span>
                <button type="button" onClick={() => setReplyTo(null)}>取消</button>
              </div>
            ) : null}
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={replyTo ? "写下你的回复…" : placeholder}
              rows={3}
              maxLength={500}
            />
            <div className="comment-form__foot">
              <label className="checkbox">
                <input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />
                含剧透
              </label>
              <span className="comment-form__count">{content.length}/500</span>
              <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !content.trim()}>
                {busy ? "发布中…" : replyTo ? "发布回复" : "发布评论"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          登录后参与讨论。<Link to="/login">去登录</Link>
        </div>
      )}

      {loading ? (
        <div className="comment-empty"><p>正在读取评论…</p></div>
      ) : error ? (
        <div className="comment-empty"><p>评论读取失败：{error}</p></div>
      ) : threads.length ? (
        <div className="comment-list">
          {threads.map(({ root, replies }) => (
            <div className="comment-group" key={root.id}>
              {renderComment(root, false)}
              {replies.length ? (
                <div className="comment-replies">{replies.map((reply) => renderComment(reply, true))}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="comment-empty">
          <MessageCircle size={22} />
          <p>还没有评论。说点具体的，会比「好看」更有用。</p>
        </div>
      )}
    </section>
  );
}
