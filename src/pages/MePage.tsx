import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  PenLine,
  Plus,
  Settings2,
  Trash2,
  Wrench,
} from "lucide-react";
import { WorkCard } from "@/components/work/WorkCard";
import { Cover } from "@/components/work/Cover";
import { EmptyState, TypeSticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { collections, toolMap, works } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { currentName } from "@/lib/currentUser";
import { LS_KEYS, readLocal } from "@/lib/storage";
import { deleteDraft, isUserWork, loadDrafts, loadUserPosts, type WorkDraft } from "@/lib/userContent";
import { formatCount, timeAgo } from "@/lib/utils";
import { workLink } from "@/lib/work";

type MeTab = "overview" | "works" | "drafts" | "saved" | "data";

export function MePage() {
  useDocumentTitle("我的工作台 · 灵作");
  const { toast } = useToast();
  const [tab, setTab] = useState<MeTab>("overview");
  const [drafts, setDrafts] = useState<WorkDraft[]>(() => loadDrafts());
  const [savedTab, setSavedTab] = useState<"works" | "tools" | "collections">("works");
  const published = works.filter(isUserWork);
  const userPosts = loadUserPosts();
  const saved = readLocal<string[]>(LS_KEYS.saved, []);
  const liked = readLocal<string[]>(LS_KEYS.liked, []);
  const savedTools = readLocal<string[]>(LS_KEYS.savedTools, []);
  const savedCollections = readLocal<string[]>(LS_KEYS.savedCollections, []);
  const savedWorks = works.filter((work) => saved.includes(work.id));
  const likedWorks = works.filter((work) => liked.includes(work.id));
  const total = published.reduce(
    (acc, work) => ({
      views: acc.views + work.stats.views,
      likes: acc.likes + work.stats.likes,
      saves: acc.saves + work.stats.saves,
      comments: acc.comments + work.stats.comments,
    }),
    { views: 0, likes: 0, saves: 0, comments: 0 },
  );
  const recent = [...published].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  const tabs: { value: MeTab; label: string; count?: number }[] = [
    { value: "overview", label: "概览" },
    { value: "works", label: "作品", count: published.length },
    { value: "drafts", label: "草稿", count: drafts.length },
    { value: "saved", label: "收藏", count: savedWorks.length + savedTools.length + savedCollections.length },
    { value: "data", label: "数据" },
  ];
  const savedToolList = useMemo(
    () => savedTools.map((id) => toolMap.get(id)).filter((tool): tool is NonNullable<typeof tool> => Boolean(tool)),
    [savedTools],
  );
  const savedCollectionList = useMemo(
    () => collections.filter((collection) => savedCollections.includes(collection.id)),
    [savedCollections],
  );

  return (
    <div className="me-page">
      <section className="me-hero">
        <div className="container">
          <div className="me-hero__top">
            <span className="eyebrow">WORKBENCH / 我的工作台</span>
            <div>
              <Link className="btn btn--outline btn--sm" to="/trash">
                <Trash2 size={14} />
                回收站
              </Link>
              <Link className="btn btn--outline btn--sm" to="/settings">
                <Settings2 size={14} />
                设置
              </Link>
              <Link className="btn btn--primary btn--sm" to="/create">
                <Plus size={14} />
                发布作品
              </Link>
            </div>
          </div>
          <div className="me-hero__grid">
            <div>
              <h1>
                {currentName()}，
                <br />
                今天想做点什么？
              </h1>
              <p>
                这里是你的工作台，不是公开主页。作品、草稿、收藏和数据都在这里。
              </p>
              <div className="me-hero__links">
                <Link to="/u/linyi">看我的公开主页</Link>
                <Link to="/notifications">消息</Link>
                <Link to="/settings">编辑资料</Link>
              </div>
            </div>
            <div className="me-hero__stats">
              <div>
                <strong>{published.length}</strong>
                <span>已发布</span>
              </div>
              <div>
                <strong>{drafts.length}</strong>
                <span>草稿</span>
              </div>
              <div>
                <strong>{formatCount(savedWorks.length + savedToolList.length)}</strong>
                <span>收藏</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container me-body">
        <div className="me-tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={tab === item.value ? "me-tab is-active" : "me-tab"}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              {typeof item.count === "number" ? <span>{item.count}</span> : null}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <>
            <section className="me-section">
              <div className="me-section__head">
                <div>
                  <span className="eyebrow">RECENT / 最近</span>
                  <h2>最近一次发布</h2>
                </div>
                {recent ? <span className="mono-small">{timeAgo(recent.createdAt)}</span> : null}
              </div>
              {recent ? (
                <div className="me-recent">
                  <div className="me-recent__cover" style={{ aspectRatio: recent.cover.aspect ?? "16 / 10" }}>
                    <Link to={workLink(recent)}>
                      <Cover cover={recent.cover} />
                    </Link>
                  </div>
                  <div className="me-recent__copy">
                    <TypeSticker type={recent.type} />
                    <h3>
                      <Link to={workLink(recent)}>{recent.title}</Link>
                    </h3>
                    <p>{recent.summary}</p>
                    <div>
                      <span>{formatCount(recent.stats.views)} 浏览</span>
                      <span>{recent.stats.likes} 喜欢</span>
                      <span>{recent.stats.saves} 收藏</span>
                    </div>
                  </div>
                  <Link className="btn btn--outline btn--sm" to={workLink(recent)}>
                    查看
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="me-empty-row">
                  <p>还没有发布作品。第一件不用很大，能打开就行。</p>
                  <Link className="btn btn--primary btn--sm" to="/create">
                    去发布
                  </Link>
                </div>
              )}
            </section>

            {drafts.length ? (
              <section className="me-section">
                <div className="me-section__head">
                  <div>
                    <span className="eyebrow">DRAFTS / 继续</span>
                    <h2>没做完的</h2>
                  </div>
                  <button type="button" className="text-btn" onClick={() => setTab("drafts")}>
                    全部草稿
                  </button>
                </div>
                <div className="me-draft-list">
                  {drafts.slice(0, 3).map((draft) => (
                    <Link key={draft.id} className="me-draft-row" to={`/create/${draft.type}`}>
                      <FileText size={16} />
                      <span>
                        <strong>{draft.title}</strong>
                        <small>{timeAgo(draft.updatedAt)} · {draft.type}</small>
                      </span>
                      <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="me-section">
              <div className="me-section__head">
                <div>
                  <span className="eyebrow">SAVED / 收藏</span>
                  <h2>你留着的东西</h2>
                </div>
                <button type="button" className="text-btn" onClick={() => setTab("saved")}>
                  全部收藏
                </button>
              </div>
              {savedWorks.length + savedToolList.length + savedCollections.length ? (
                <div className="me-saved-preview">
                  {savedWorks.slice(0, 3).map((work) => (
                    <Link key={work.id} to={workLink(work)}>
                      <Bookmark size={14} />
                      {work.title}
                    </Link>
                  ))}
                  {savedToolList.slice(0, 2).map((tool) => (
                    <Link key={tool.id} to={`/tools/${tool.slug}`}>
                      <Wrench size={14} />
                      {tool.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="detail-empty-text">还没有收藏。去发现页逛逛，或者收藏一个工具。</p>
              )}
            </section>

            <section className="me-section">
              <div className="me-section__head">
                <div>
                  <span className="eyebrow">POSTS / 我的动态</span>
                  <h2>最近说过的话</h2>
                </div>
                <Link className="text-btn" to="/create/post">
                  发一条
                </Link>
              </div>
              {userPosts.length ? (
                <div className="me-post-list">
                  {userPosts.slice(0, 2).map((post) => (
                    <Link key={post.id} to={`/posts/${post.id}`}>
                      <TypeSticker type="post" label={post.type} variant="tag" />
                      <strong>{post.title}</strong>
                      <span>{timeAgo(post.createdAt)}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="detail-empty-text">还没有发过动态。一个具体的问题也可以。</p>
              )}
            </section>
          </>
        ) : null}

        {tab === "works" ? (
          published.length ? (
            <div className="profile-work-grid">
              {published.map((work) => (
                <WorkCard key={work.id} work={work} ratio="wide" />
              ))}
            </div>
          ) : (
            <EmptyState
              glyph="新"
              title="还没有作品"
              desc="第一件不用完美。先做一个能打开、能拆开看的东西。"
              actions={
                <Link className="btn btn--primary" to="/create">
                  去发布第一件
                </Link>
              }
            />
          )
        ) : null}

        {tab === "drafts" ? (
          drafts.length ? (
            <div className="me-drafts">
              {drafts.map((draft) => (
                <div className="me-draft-card" key={draft.id}>
                  <span className="me-draft-card__type">{draft.type}</span>
                  <h3>{draft.title}</h3>
                  <p>上次编辑于 {timeAgo(draft.updatedAt)}。草稿只保存在本地。</p>
                  <div>
                    <Link className="btn btn--primary btn--sm" to={`/create/${draft.type}`}>
                      继续编辑
                    </Link>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        deleteDraft(draft.type);
                        setDrafts(loadDrafts());
                        toast({ title: "草稿已删除", desc: "这个操作不会影响已发布的作品。" });
                      }}
                    >
                      <Trash2 size={13} />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              glyph="稿"
              title="没有草稿"
              desc="写到一半也可以先存着。会自动保存，也可以随时回来。"
              actions={<Link className="btn btn--primary" to="/create">去写一件</Link>}
            />
          )
        ) : null}

        {tab === "saved" ? (
          <div className="me-saved">
            <div className="me-saved__tabs">
              {[
                { value: "works" as const, label: `作品 ${savedWorks.length}` },
                { value: "tools" as const, label: `工具 ${savedToolList.length}` },
                { value: "collections" as const, label: `合集 ${savedCollectionList.length}` },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={savedTab === item.value ? "is-active" : ""}
                  onClick={() => setSavedTab(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {savedTab === "works" ? (
              savedWorks.length ? (
                <div className="profile-work-grid">
                  {savedWorks.map((work) => (
                    <WorkCard key={work.id} work={work} ratio="wide" />
                  ))}
                </div>
              ) : (
                <EmptyState glyph="藏" title="还没有收藏作品" desc="收藏会保存在本地，刷新后还在。" />
              )
            ) : null}
            {savedTab === "tools" ? (
              savedToolList.length ? (
                <div className="me-tool-list">
                  {savedToolList.map((tool) => (
                    <Link key={tool.id} to={`/tools/${tool.slug}`}>
                      <span className="tool-mark" style={{ background: tool.color }}>{tool.mark}</span>
                      <span>
                        <strong>{tool.name}</strong>
                        <small>{tool.tagline}</small>
                      </span>
                      <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState glyph="器" title="还没有收藏工具" desc="工具不套点赞，可以单独收藏。" />
              )
            ) : null}
            {savedTab === "collections" ? (
              savedCollectionList.length ? (
                <div className="me-tool-list">
                  {savedCollectionList.map((collection) => (
                    <Link key={collection.id} to={`/collections/${collection.id}`}>
                      <span className="me-collection-mark">集</span>
                      <span>
                        <strong>{collection.title}</strong>
                        <small>{collection.workIds.length} 件作品 · {collection.editor} 编辑</small>
                      </span>
                      <ArrowRight size={14} />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState glyph="集" title="还没有收藏合集" desc="在发现页可以收藏主题合集。" />
              )
            ) : null}
          </div>
        ) : null}

        {tab === "data" ? (
          <div className="me-data">
            <div className="me-data__summary">
              <div>
                <Eye size={16} />
                <strong>{formatCount(total.views)}</strong>
                <span>浏览</span>
              </div>
              <div>
                <Heart size={16} />
                <strong>{formatCount(total.likes)}</strong>
                <span>喜欢</span>
              </div>
              <div>
                <Bookmark size={16} />
                <strong>{formatCount(total.saves)}</strong>
                <span>收藏</span>
              </div>
              <div>
                <MessageCircle size={16} />
                <strong>{formatCount(total.comments)}</strong>
                <span>评论</span>
              </div>
            </div>
            <div className="me-data__table">
              <div className="me-data__row me-data__row--head">
                <span>作品</span>
                <span>浏览</span>
                <span>喜欢</span>
                <span>收藏</span>
                <span>评论</span>
              </div>
              {published.length ? (
                published.map((work) => (
                  <Link className="me-data__row" key={work.id} to={workLink(work)}>
                    <span>{work.title}</span>
                    <span>{work.stats.views}</span>
                    <span>{work.stats.likes}</span>
                    <span>{work.stats.saves}</span>
                    <span>{work.stats.comments}</span>
                  </Link>
                ))
              ) : (
                <p className="detail-empty-text">还没有数据。发布第一件之后，这里只显示真实事件。</p>
              )}
            </div>
            <p className="me-data__note">
              数据只统计真实事件：浏览、喜欢、收藏、评论、二创。演示版的作品初始为 0，不做假数据。
            </p>
          </div>
        ) : null}

        {tab === "saved" ? (
          <p className="me-storage-note">
            <Wrench size={13} /> 收藏与草稿保存在本地浏览器。换设备不会同步。
          </p>
        ) : null}

        {likedWorks.length ? (
          <section className="me-section me-liked">
            <div className="me-section__head">
              <div>
                <span className="eyebrow">LIKED / 喜欢</span>
                <h2>你点过喜欢的</h2>
              </div>
              <span className="mono-small">{likedWorks.length} 件</span>
            </div>
            <div className="me-saved-preview">
              {likedWorks.slice(0, 4).map((work) => (
                <Link key={work.id} to={workLink(work)}>
                  <Heart size={13} />
                  {work.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="me-foot">
          <Link className="arrow-link" to="/create/post">
            <PenLine size={14} />
            发一条动态
          </Link>
          <Link className="arrow-link" to="/notifications">
            <MessageCircle size={14} />
            看消息
          </Link>
          <Link className="arrow-link" to="/settings">
            <Settings2 size={14} />
            设置
          </Link>
        </div>
      </div>
    </div>
  );
}
