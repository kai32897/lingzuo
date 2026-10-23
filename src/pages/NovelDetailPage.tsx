import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Feather,
  Plus,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import {
  ActionBar,
  CommentThread,
  DetailAside,
  RecipePanel,
  RelatedWorks,
  RemixTree,
  WorkBreadcrumb,
} from "@/components/detail/parts";
import { AuthorLine, TypeSticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { chaptersFor } from "@/data/chapters";
import { commentsFor, creatorMap, workBySlug, works } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, readLocal, useLocalStorage } from "@/lib/storage";
import { formatWords, workLink } from "@/lib/work";
import type { NovelWork } from "@/types";

export function NovelDetailPage() {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`novel/${slug}`) : undefined;
  useDocumentTitle(work ? `${work.title} · AI 小说 · 灵作` : "AI 小说 · 灵作");
  if (!work || work.type !== "novel") return <NotFoundPage />;
  return <NovelDetail work={work} />;
}

function NovelDetail({ work }: { work: NovelWork }) {
  const { toast } = useToast();
  const [shelf, setShelf] = useLocalStorage<string[]>(LS_KEYS.bookshelf, []);
  const chapters = chaptersFor(work.id);
  const saved = readLocal<Record<string, { chapter: number; scroll: number }>>(LS_KEYS.readProgress, {})[work.id];
  const available = chapters.length;
  const resumeChapter = Math.min(Math.max(saved?.chapter ?? 1, 1), available || 1);
  const inShelf = shelf.includes(work.id);
  const author = creatorMap.get(work.authorHandle);
  const sameWorld = works.filter(
    (item) => item.id !== work.id && item.tags.some((tag) => work.tags.includes(tag)),
  );

  return (
    <div className="detail-page novel-detail">
      <div className="container">
        <WorkBreadcrumb work={work} />

        <section className="novel-hero">
          <div className="novel-hero__cover" style={{ aspectRatio: work.cover.aspect ?? "3 / 4" }}>
            <Cover cover={work.cover} />
            <span className="novel-hero__stamp">{work.meta.status}</span>
          </div>
          <div className="novel-hero__copy">
            <div className="detail-head__meta">
              <TypeSticker type="novel" />
              <span>{formatWords(work.meta.words)} · {work.meta.pov}</span>
              <span className="detail-ai">{work.aiDisclosure}</span>
              <span className="detail-license">{work.license}</span>
            </div>
            <h1>{work.title}</h1>
            <p className="novel-hero__summary">{work.summary}</p>
            <blockquote className="novel-hero__excerpt">「{work.meta.excerpt}」</blockquote>
            <div className="detail-by">
              <AuthorLine handle={work.authorHandle} />
              <span className="detail-by__dot" aria-hidden="true" />
              <span>{work.meta.genres.join(" / ")}</span>
              <span className="detail-by__dot" aria-hidden="true" />
              <span>更新于 {new Date(work.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
            <div className="novel-hero__actions">
              <Link className="btn btn--primary btn--lg" to={`/novels/${work.slug}/read/${resumeChapter}`}>
                <BookOpen size={17} />
                {saved ? `继续读第 ${resumeChapter} 章` : "开始阅读"}
              </Link>
              <button
                type="button"
                className={inShelf ? "btn btn--outline btn--lg is-following" : "btn btn--outline btn--lg"}
                aria-pressed={inShelf}
                onClick={() => {
                  setShelf((prev) =>
                    inShelf ? prev.filter((id) => id !== work.id) : [...prev, work.id],
                  );
                  toast({
                    title: inShelf ? "已移出书架" : "已加入书架",
                    desc: inShelf ? "阅读进度还在，随时可以继续。" : "在「我的」的书架里可以找到。",
                  });
                }}
              >
                {inShelf ? <Check size={16} /> : <Plus size={16} />}
                {inShelf ? "已在书架" : "加入书架"}
              </button>
            </div>
            <div className="novel-hero__meta">
              <span>
                <Clock3 size={13} />
                约 {Math.max(3, Math.round(work.meta.words / 400))} 分钟读完
              </span>
              <span>试读 {available} 章 / 共 {work.meta.chapters.length} 章</span>
              <span>每章都能在阅读器里调字号</span>
            </div>
          </div>
        </section>

        <div className="detail-layout">
          <div className="detail-main">
            <ActionBar work={work} />

            <section className="detail-section chapter-section" id="chapters">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">CONTENTS / 目录</span>
                  <h2>从哪一章开始</h2>
                </div>
                <span className="mono-small">{available} 章可读</span>
              </div>
              <div className="chapter-list">
                {chapters.map((chapter, index) => {
                  const chapterNumber = index + 1;
                  const isDone = saved ? chapterNumber < saved.chapter : false;
                  const isCurrent = saved?.chapter === chapterNumber;
                  return (
                    <Link
                      key={chapter.title}
                      className={`chapter-row ${isCurrent ? "is-current" : ""}`}
                      to={`/novels/${work.slug}/read/${chapterNumber}`}
                    >
                      <span className="chapter-row__num">{String(chapterNumber).padStart(2, "0")}</span>
                      <span className="chapter-row__title">
                        {chapter.title}
                        <small>{chapter.paragraphs.length} 段 · 约 {chapter.paragraphs.join("").length} 字</small>
                      </span>
                      {isDone ? (
                        <span className="chapter-row__state">
                          <Check size={13} />
                          读过
                        </span>
                      ) : isCurrent ? (
                        <span className="chapter-row__state">继续读</span>
                      ) : (
                        <span className="chapter-row__state">未读</span>
                      )}
                      <ArrowRight size={15} className="chapter-row__arrow" />
                    </Link>
                  );
                })}
              </div>
              {available < work.meta.chapters.length ? (
                <p className="chapter-note">
                  <Feather size={13} />
                  目前开放试读 {available} 章。后续章节在作者草稿箱里，连载中。
                </p>
              ) : null}
            </section>

            <section className="detail-section author-note">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">AUTHOR'S NOTE / 作者的话</span>
                  <h2>为什么写这个故事</h2>
                </div>
              </div>
              <blockquote>
                「我想写的不是一个月亮被修好的故事，而是一个人反复确认自己还能不能修好东西。」
              </blockquote>
              <div className="author-note__by">
                <AuthorLine handle={work.authorHandle} />
                <span>{author?.location}</span>
                <span>{work.tools.join(" / ")}</span>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">SAME MOOD / 相似气质</span>
                  <h2>如果你喜欢这一本</h2>
                </div>
              </div>
              <div className="universe-row">
                {sameWorld.slice(0, 4).map((item) => (
                  <Link key={item.id} className="universe-card" to={workLink(item)}>
                    <span className="universe-card__cover">
                      <Cover cover={item.cover} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.type === "novel"
                          ? "小说"
                          : item.type === "game"
                            ? "游戏"
                            : item.type === "drama"
                              ? "短剧"
                              : "教程"}
                      </small>
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </section>

            <RecipePanel work={work} />
            <RemixTree work={work} />
            <CommentThread
              targetId={work.id}
              authorHandle={work.authorHandle}
              seedComments={commentsFor(work.id)}
              heading="读到这里的读者"
              placeholder="你读到哪一句停下来了？或者，你觉得站长最后会修好那轮月亮吗？"
            />
          </div>
          <DetailAside work={work} />
        </div>

        <RelatedWorks work={work} works={works.filter((item) => item.type === "novel")} title="下一本读什么" />
        <div className="detail-more">
          <span className="eyebrow">SHELF / 书架</span>
          <div className="detail-more__author">
            <span>{work.meta.status} · {formatWords(work.meta.words)}</span>
            <span>{work.meta.pov}</span>
            <span>{work.meta.genres.join(" / ")}</span>
            <Link className="arrow-link" to="/novels">
              全部小说
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
