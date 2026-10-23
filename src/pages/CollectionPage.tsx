import { Link, useParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Bookmark, Check } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { AuthorLine, EmptyState, TypeSticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { collections, workMap } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { formatCount } from "@/lib/utils";
import { metaLine, workLink } from "@/lib/work";

export function CollectionPage() {
  const { id } = useParams();
  const collection = collections.find((item) => item.id === id);
  useDocumentTitle(collection ? `${collection.title} · 主题合集 · 灵作` : "主题合集 · 灵作");
  const { toast } = useToast();
  const [saved, setSaved] = useLocalStorage<string[]>(LS_KEYS.savedCollections, []);
  if (!collection) return <NotFoundPage />;

  const items = collection.workIds
    .map((workId) => workMap.get(workId))
    .filter((work): work is NonNullable<typeof work> => Boolean(work));
  const isSaved = saved.includes(collection.id);
  const other = collections.filter((item) => item.id !== collection.id);

  return (
    <div className="collection-page">
      <section className="collection-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="面包屑">
            <Link to="/">首页</Link>
            <span aria-hidden="true">/</span>
            <Link to="/discover">发现</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">主题合集</span>
          </nav>
          <div className="collection-hero__grid">
            <div>
              <span className="eyebrow">COLLECTION / 主题合集</span>
              <h1>{collection.title}</h1>
              <p>{collection.desc}</p>
              <div className="collection-hero__meta">
                <span>{collection.workIds.length} 件作品</span>
                <span>{collection.editor} 编辑</span>
                <span>按顺序看，也可以跳着看</span>
              </div>
            </div>
            <div className="collection-hero__actions">
              <button
                type="button"
                className={isSaved ? "btn btn--outline" : "btn btn--primary"}
                aria-pressed={isSaved}
                onClick={() => {
                  setSaved((prev) =>
                    isSaved ? prev.filter((item) => item !== collection.id) : [...prev, collection.id],
                  );
                  toast({
                    title: isSaved ? "已取消收藏合集" : "已收藏合集",
                    desc: isSaved ? "它还在发现页里。" : "在「我的」的收藏里可以找到。",
                  });
                }}
              >
                {isSaved ? <Check size={15} /> : <Bookmark size={15} />}
                {isSaved ? "已收藏" : "收藏合集"}
              </button>
              <Link className="btn btn--outline" to={`/search?q=${encodeURIComponent(collection.title)}`}>
                搜相关
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container collection-body">
        {items.length ? (
          <div className="collection-list">
            {items.map((work, index) => (
              <article className="collection-item" key={work.id}>
                <span className="collection-item__num">{String(index + 1).padStart(2, "0")}</span>
                <Link className="collection-item__cover" to={workLink(work)} aria-label={work.title}>
                  <Cover cover={work.cover} />
                </Link>
                <div className="collection-item__body">
                  <div className="collection-item__meta">
                    <TypeSticker type={work.type} variant="tag" />
                    <span>{metaLine(work)}</span>
                  </div>
                  <h2>
                    <Link to={workLink(work)}>{work.title}</Link>
                  </h2>
                  <p>{work.summary}</p>
                  <div className="collection-item__foot">
                    <AuthorLine handle={work.authorHandle} size="xs" />
                    <span>{formatCount(work.stats.likes)} 喜欢</span>
                  </div>
                </div>
                <Link className="btn btn--outline btn--sm collection-item__action" to={workLink(work)}>
                  打开
                  <ArrowUpRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState glyph="空" title="这个合集还是空的" desc="编辑正在挑作品，先去发现页逛逛。" />
        )}

        <div className="collection-other">
          <span className="eyebrow">MORE COLLECTIONS / 其他合集</span>
          <div className="collection-other__grid">
            {other.map((item) => (
              <Link key={item.id} className="collection-other__card" to={`/collections/${item.id}`}>
                <span>{item.workIds.length} 件</span>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
