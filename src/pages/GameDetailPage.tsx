import { Link, useParams } from "react-router-dom";
import { ArrowRight, Clock3, Gamepad2, Maximize2, Play, ShieldCheck, Sparkles } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { MediaImage } from "@/components/media/MediaUpload";
import {
  ActionBar,
  CommentThread,
  DetailAside,
  RecipePanel,
  RelatedWorks,
  RemixTree,
  WorkBreadcrumb,
  WorkHeader,
} from "@/components/detail/parts";
import { AuthorLine, SectionHead } from "@/components/ui/primitives";
import { PostCard } from "@/components/cards/PostCard";
import { workBySlug, works, posts, commentsFor } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { getUserContent } from "@/lib/userContent";
import { metaLine } from "@/lib/work";

export function GameDetailPage() {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`game/${slug}`) : undefined;
  useDocumentTitle(work ? `${work.title} · AI 游戏 · 灵作` : "AI 游戏 · 灵作");
  if (!work || work.type !== "game") return <NotFoundPage />;

  const devlogs = posts.filter((post) => post.relatedWorkId === work.id);
  const gamePool = works.filter((item) => item.type === "game");
  const content = getUserContent(work.id);

  return (
    <div className="detail-page">
      <div className="container">
        <WorkBreadcrumb work={work} />
        <WorkHeader work={work} />

        <div className="detail-layout">
          <div className="detail-main">
            <section className="game-stage" aria-label="游戏试玩">
              <div className="game-stage__frame">
                <Cover cover={work.cover} />
                <div className="game-stage__shade" />
                <div className="game-stage__overlay">
                  <span className="game-stage__tag">
                    <Gamepad2 size={13} />
                    可试玩{work.meta.minutes > 0 ? ` · ${work.meta.minutes} 分钟` : ""}
                  </span>
                  <h2>{work.hook}</h2>
                  <p>点击开始进入站内试玩。演示版用分支场景模拟完整玩法，不需要下载。</p>
                  <div className="game-stage__actions">
                    <Link className="btn btn--primary btn--lg" to={`/games/${work.slug}/play`}>
                      <Play size={16} fill="currentColor" />
                      开始游戏
                    </Link>
                    <Link className="btn btn--outline btn--lg" to={`/games/${work.slug}/play`}>
                      <Maximize2 size={16} />
                      全屏试玩
                    </Link>
                  </div>
                </div>
                <span className="game-stage__code">{work.cover.code}</span>
              </div>
              <div className="game-stage__foot">
                {work.meta.minutes > 0 ? (
                  <span>
                    <Clock3 size={13} /> {work.meta.minutes} 分钟
                  </span>
                ) : null}
                <span>难度 {work.meta.difficulty}</span>
                <span>{work.meta.engine}</span>
                <span>最佳通关 {work.meta.bestTime}</span>
              </div>
            </section>

            <ActionBar work={work} />

            {content?.gallery?.length ? (
              <section className="detail-section">
                <div className="detail-section__head">
                  <div>
                    <span className="eyebrow">SCREENS / 游戏画面</span>
                    <h2>先看两张截图</h2>
                  </div>
                  <span className="mono-small">{content.gallery.length} 张</span>
                </div>
                <div className="game-gallery">
                  {content.gallery.map((id) => (
                    <MediaImage key={id} id={id} alt={`${work.title} 游戏画面`} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">HOW TO PLAY / 玩法说明</span>
                  <h2>不用下载，点开就玩</h2>
                </div>
                <span className="mono-small">网页游戏 · 自动保存</span>
              </div>
              <div className="info-grid">
                <div>
                  <span>操作</span>
                  <strong>{work.meta.controls}</strong>
                </div>
                <div>
                  <span>类型</span>
                  <strong>{work.meta.genres.join(" / ")}</strong>
                </div>
                <div>
                  <span>引擎</span>
                  <strong>{work.meta.engine}</strong>
                </div>
                <div>
                  <span>建议</span>
                  <strong>戴耳机，关灯，一个人玩</strong>
                </div>
              </div>
              <p className="game-note">
                <ShieldCheck size={14} />
                试玩运行在站内沙箱环境中，不会请求麦克风、摄像头或外部账号。
              </p>
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">DEVLOG / 开发日志</span>
                  <h2>作者怎么把按钮做出来</h2>
                </div>
                <span className="mono-small">{devlogs.length} 篇</span>
              </div>
              {devlogs.length ? (
                <div className="devlog-list">
                  {devlogs.map((post) => (
                    <PostCard key={post.id} post={post} variant="row" />
                  ))}
                </div>
              ) : (
                <p className="detail-empty-text">
                  作者还没有公开开发日志。可以先拆配方，看看这个游戏的工作流。
                </p>
              )}
            </section>

            <RecipePanel work={work} />
            <RemixTree work={work} />
            <CommentThread
              targetId={work.id}
              authorHandle={work.authorHandle}
              seedComments={commentsFor(work.id)}
              heading="玩过的人怎么说"
              placeholder="说说你按了哪个按钮？或者你卡在了哪一步？"
            />
          </div>
          <DetailAside work={work} />
        </div>

        <RelatedWorks work={work} works={gamePool} title="再玩一个" />
        <div className="detail-more">
          <SectionHead
            num="MORE"
            title="去游戏分类继续逛"
            desc="不用下载的 AI 游戏，按类型、时长和难度筛选。"
            action={
              <Link className="arrow-link" to="/games">
                全部游戏
                <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="detail-more__author">
            <AuthorLine handle={work.authorHandle} />
            <span>{metaLine(work)}</span>
            <span className="detail-more__ai">
              <Sparkles size={13} />
              {work.aiDisclosure}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
