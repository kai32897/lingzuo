import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Flag, Heart, Link2, Pencil, Trash2 } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { Avatar, TypeSticker } from "@/components/ui/primitives";
import { PostCard } from "@/components/cards/PostCard";
import { CommentThread, ReportDialog } from "@/components/detail/parts";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { CURRENT_USER } from "@/data/config";
import { commentsForPost, creatorMap, postMap, posts, workMap } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { trashPost } from "@/lib/userContent";
import { currentName } from "@/lib/currentUser";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { copyText, timeAgo } from "@/lib/utils";
import { workLink } from "@/lib/work";

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = id ? postMap.get(id) : undefined;
  useDocumentTitle(post ? `${post.title} · 灵作` : "社区动态 · 灵作");
  const { toast } = useToast();
  const [liked, setLiked] = useLocalStorage<string[]>(LS_KEYS.liked, []);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (!post) return <NotFoundPage />;

  const creator = creatorMap.get(post.authorHandle);
  const authorName =
    creator?.name ?? (post.authorHandle === CURRENT_USER.handle ? currentName() : post.authorHandle);
  const authorRole =
    creator?.role ?? (post.authorHandle === CURRENT_USER.handle ? CURRENT_USER.role : "社区成员");
  const isLiked = liked.includes(post.id);
  const isOwner = post.authorHandle === CURRENT_USER.handle;
  const relatedWork = post.relatedWorkId ? workMap.get(post.relatedWorkId) : undefined;
  const more = posts
    .filter((item) => item.id !== post.id && (item.type === post.type || item.tags.some((tag) => post.tags.includes(tag))))
    .slice(0, 3);

  return (
    <div className="detail-page post-detail">
      <div className="container">
        <nav className="breadcrumb" aria-label="面包屑">
          <Link to="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link to="/discover">社区动态</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.type}</span>
        </nav>

        <div className="post-layout">
          <article className="post-main">
            <header className="post-head">
              <div className="post-head__meta">
                <TypeSticker type="post" label={post.type} />
                <span>{timeAgo(post.createdAt)}</span>
                {post.topic ? (
                  <Link to={`/topics/${encodeURIComponent(post.topic)}`}>#{post.topic}</Link>
                ) : null}
              </div>
              <h1>{post.title}</h1>
              <div className="post-head__by">
                <Avatar handle={post.authorHandle} size="sm" />
                <span>
                  <Link to={`/u/${post.authorHandle}`}>{authorName}</Link>
                  <small>{authorRole}</small>
                </span>
                <button
                  type="button"
                  className={isLiked ? "post-like is-active" : "post-like"}
                  aria-pressed={isLiked}
                  onClick={() =>
                    setLiked((prev) =>
                      isLiked ? prev.filter((item) => item !== post.id) : [...prev, post.id],
                    )
                  }
                >
                  <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                  {post.stats.likes + (isLiked ? 1 : 0)}
                </button>
                <button
                  type="button"
                  className="post-tool"
                  onClick={async () => {
                    const ok = await copyText(window.location.href);
                    toast({ title: ok ? "动态链接已复制" : "复制失败" });
                  }}
                >
                  <Link2 size={15} />
                  分享
                </button>
                <button type="button" className="post-tool" onClick={() => setReportOpen(true)}>
                  <Flag size={14} />
                  举报
                </button>
              </div>
              {isOwner ? (
                <div className="post-owner-actions">
                  <Link to={`/create/post?edit=${post.id}`}>
                    <Pencil size={13} />
                    编辑动态
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 size={13} />
                    删除
                  </button>
                </div>
              ) : null}
            </header>

            <div className="post-body">
              {post.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="post-tags">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/topics/${encodeURIComponent(tag)}`}>
                  #{tag}
                </Link>
              ))}
            </div>

            {relatedWork ? (
              <Link className="post-related" to={workLink(relatedWork)}>
                <span className="post-related__cover">
                  <Cover cover={relatedWork.cover} />
                </span>
                <span className="post-related__copy">
                  <span className="eyebrow">RELATED WORK / 关联作品</span>
                  <strong>{relatedWork.title}</strong>
                  <small>{relatedWork.summary}</small>
                </span>
                <ArrowRight size={16} />
              </Link>
            ) : null}

            <CommentThread
              targetId={post.id}
              authorHandle={post.authorHandle}
              seedComments={commentsForPost(post.id)}
              heading="回复"
              placeholder="具体一点：你同意哪一句？或者你会怎么改？"
            />
          </article>

          <aside className="post-aside">
            <section className="aside-author">
              <span className="eyebrow">AUTHOR / 作者</span>
              <div className="aside-author__head">
                <Avatar handle={post.authorHandle} size="lg" />
                <div>
                  <Link to={`/u/${post.authorHandle}`}>{authorName}</Link>
                  <span>{authorRole}</span>
                </div>
              </div>
              <p>{creator?.bio ?? CURRENT_USER.role}</p>
              <div className="aside-author__links">
                <Link to={`/u/${post.authorHandle}`}>看主页</Link>
                <Link to="/discover">去发现</Link>
              </div>
            </section>

            <section className="aside-card">
              <span className="eyebrow">TOPIC / 话题</span>
              <div className="aside-tags">
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/topics/${encodeURIComponent(tag)}`}>
                    #{tag}
                  </Link>
                ))}
              </div>
            </section>

            <section className="aside-card">
              <span className="eyebrow">ABOUT / 关于这条动态</span>
              <p className="aside-small">
                动态属于社区讨论，不做成一个完整信息流。喜欢具体的问题，
                比喜欢「好看」更有用。
              </p>
            </section>
          </aside>
        </div>

        <section className="post-more-grid">
          {more.map((item) => (
            <PostCard key={item.id} post={item} />
          ))}
        </section>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title="删除这条动态？"
        description="动态会从发现页、你的主页和搜索结果中移除，并放入回收站。评论入口暂时关闭，之后可以恢复。"
        confirmLabel="移入回收站"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          trashPost(post.id);
          toast({ title: "动态已移入回收站", desc: "需要时可以在回收站恢复。" });
          navigate("/trash");
        }}
      />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} target={post.title} />
    </div>
  );
}
