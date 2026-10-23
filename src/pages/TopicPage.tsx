import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, Check, Hash, Plus } from "lucide-react";
import { WorkCard } from "@/components/work/WorkCard";
import { PostCard } from "@/components/cards/PostCard";
import { EmptyState, SectionHead } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { posts, works } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function TopicPage() {
  const { tag: tagParam } = useParams();
  const tag = tagParam ? decodeURIComponent(tagParam) : "";
  useDocumentTitle(`#${tag} · 话题 · 灵作`);
  const { toast } = useToast();
  const [followed, setFollowed] = useLocalStorage<string[]>(LS_KEYS.followedTopics, []);
  const isFollowing = followed.includes(tag);

  const matchedWorks = works.filter(
    (work) => work.tags.some((item) => item === tag || item.includes(tag)) || work.title.includes(tag),
  );
  const matchedPosts = posts.filter(
    (post) => post.tags.some((item) => item === tag || item.includes(tag)) || post.title.includes(tag) || post.topic === tag,
  );

  const relatedTags = (() => {
    const map = new Map<string, number>();
    for (const work of matchedWorks) {
      for (const item of work.tags) {
        if (item !== tag) map.set(item, (map.get(item) ?? 0) + 1);
      }
    }
    for (const post of matchedPosts) {
      for (const item of post.tags) {
        if (item !== tag) map.set(item, (map.get(item) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  return (
    <div className="topic-page">
      <section className="topic-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="面包屑">
            <Link to="/">首页</Link>
            <span aria-hidden="true">/</span>
            <Link to="/discover">发现</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">话题</span>
          </nav>
          <div className="topic-hero__grid">
            <div>
              <span className="eyebrow">TOPIC / 话题</span>
              <h1>
                <Hash size={38} />
                {tag}
              </h1>
              <p>
                这个话题下有 {matchedWorks.length} 件作品和 {matchedPosts.length} 条讨论。
                话题是浏览的延伸，想找具体内容，还是用顶栏搜索。
              </p>
            </div>
            <div className="topic-hero__actions">
              <button
                type="button"
                className={cn("btn", isFollowing ? "btn--outline" : "btn--primary")}
                aria-pressed={isFollowing}
                onClick={() => {
                  setFollowed((prev) =>
                    isFollowing ? prev.filter((item) => item !== tag) : [...prev, tag],
                  );
                  toast({
                    title: isFollowing ? "已取消关注话题" : `关注了 #${tag}`,
                    desc: isFollowing ? "这个话题不会再优先出现。" : "相关的新作品会被优先看到。",
                  });
                }}
              >
                {isFollowing ? <Check size={15} /> : <Plus size={15} />}
                {isFollowing ? "已关注" : "关注话题"}
              </button>
              <Link className="btn btn--outline" to={`/search?q=${encodeURIComponent(tag)}`}>
                搜「{tag}」
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container topic-body">
        <section className="discover-section">
          <SectionHead
            num="01"
            title="作品与教程"
            desc="带这个话题的作品。按喜欢和完成度排。"
            action={<span className="mono-small">{matchedWorks.length} 件</span>}
          />
          {matchedWorks.length ? (
            <div className="topic-work-grid">
              {matchedWorks.map((work) => (
                <WorkCard key={work.id} work={work} ratio="wide" />
              ))}
            </div>
          ) : (
            <EmptyState
              glyph="空"
              title="这个话题下还没有作品"
              desc="你可以做第一个，或者换个标签逛逛。"
              actions={
                <Link className="btn btn--primary" to="/discover">
                  去发现页
                </Link>
              }
            />
          )}
        </section>

        <section className="discover-section">
          <SectionHead
            num="02"
            title="相关讨论"
            desc="讨论、求助、交作业和创作日志。"
            action={<span className="mono-small">{matchedPosts.length} 条</span>}
          />
          {matchedPosts.length ? (
            <div className="post-grid">
              {matchedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="detail-empty-text">还没有人讨论这个话题。去发现页看看大家在想什么。</p>
          )}
        </section>

        {relatedTags.length ? (
          <section className="discover-section discover-section--last">
            <div className="hot-tags">
              <div className="hot-tags__head">
                <span className="eyebrow">RELATED / 相关标签</span>
                <h2>顺着标签往下逛</h2>
              </div>
              <div className="hot-tags__cloud">
                {relatedTags.map(([item, count], index) => (
                  <Link key={item} className={`hot-tag hot-tag--${index % 4}`} to={`/topics/${encodeURIComponent(item)}`}>
                    #{item}
                    <sup>{count}</sup>
                    <ArrowUpRight size={13} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
