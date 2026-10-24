import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Asterisk, Sparkles } from "lucide-react";
import {
  SectionHead,
  Avatar,
  TypeSticker,
} from "@/components/ui/primitives";
import { WorkCard } from "@/components/work/WorkCard";
import { Cover } from "@/components/work/Cover";
import { CollectionCard } from "@/components/cards/CollectionCard";
import { CreatorCard } from "@/components/cards/CreatorCard";
import { PostCard } from "@/components/cards/PostCard";
import { collections, creators, posts, works } from "@/data/seed";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { workLink } from "@/lib/work";

export function DiscoverPage() {
  useDocumentTitle("发现 · 灵作");
  const lead = works[0];
  const sidePicks = works.slice(1, 3);
  const crossWorks = works.slice(3, 6);

  const trending = useMemo(
    () =>
      [...works]
        .sort(
          (a, b) =>
            b.stats.remixes + b.stats.likes / 20 - (a.stats.remixes + a.stats.likes / 20),
        )
        .slice(0, 5),
    [],
  );

  const potential = useMemo(
    () =>
      works
        .filter((work) => work.stats.views < 6500)
        .map((work) => ({
          work,
          rate: work.stats.views > 0 ? (work.stats.saves / work.stats.views) * 100 : 0,
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 3),
    [],
  );

  const hotTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const work of works) {
      for (const tag of work.tags) {
        if (tag.length < 2) continue;
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, []);

  const featuredPosts = [posts[0], posts[4], posts[3]].filter(Boolean);
  const visibleCreators = creators.filter((creator) =>
    works.some((work) => work.authorHandle === creator.handle),
  );

  return (
    <div className="discover-page">
      <section className="discover-hero">
        <div className="container">
          <div className="discover-hero__top">
            <span className="eyebrow">DISCOVER / 发现</span>
            <span className="discover-hero__issue">ISSUE 042 · 本周</span>
          </div>
          <div className="discover-hero__grid">
            <h1>
              今天想看
              <br />
              <em>点什么？</em>
              <Asterisk size={38} className="discover-hero__star" aria-hidden="true" />
            </h1>
            <div className="discover-hero__note">
              <p>
                这里没有搜索框，也没有「共 1,284 条结果」。只有编辑部这周真的看完、
                玩完、读完之后，还想再推荐一次的东西。
              </p>
              <div className="discover-hero__meta">
                <span>{works.length} 件作品</span>
                <span>{collections.length} 个主题合集</span>
                <span>{visibleCreators.length} 位创作者</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container discover-section">
        <SectionHead
          num="01"
          title="本周编辑精选"
          desc="一件长的，两件短的。都是这周编辑部主动打开的。"
          action={<span className="mono-small">PICKED BY HUMANS, NOT ALGORITHM</span>}
        />
        <div className="discover-picks">
          {lead ? (
            <WorkCard
              work={lead}
              compact
              ratio="wide"
              priority
              className="discover-picks__lead"
            />
          ) : null}
          {sidePicks.map((work) => (
            <WorkCard key={work.id} work={work} compact showSummary ratio="wide" />
          ))}
        </div>
        <div className="discover-picks__reason">
          <Sparkles size={14} aria-hidden="true" />
          <p>
            编辑部的原话：「它不是那种会让你哭的小说，但它会让你在关灯之后，
            想给一个很久没联系的人发消息。」
          </p>
        </div>
      </section>

      <section className="discover-band">
        <div className="container discover-section discover-section--flush">
          <SectionHead
            num="02"
            title="正在升温"
            desc="不是最热的，是这周开始被接力、被讨论、被重新打开的作品。"
            action={<span className="mono-small">TRENDING THIS WEEK</span>}
          />
          <div className="rail">
            {trending.map((work, index) => (
              <div className="rail__item" key={work.id}>
                <span className="rail__rank">{String(index + 1).padStart(2, "0")}</span>
                <WorkCard work={work} compact showSummary={false} ratio="square" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container discover-section">
        <SectionHead
          num="03"
          title="潜力新作"
          desc="曝光不高，但收藏率高得不太正常。给还没被看见的人一点位置。"
          action={<span className="mono-small">LOW VIEWS · HIGH SAVES</span>}
        />
        <div className="potential-grid">
          {potential.map(({ work, rate }) => (
            <div className="potential-card" key={work.id}>
              <div className="potential-card__label">
                <span className="status-dot" aria-hidden="true" />
                潜力新作
              </div>
              <WorkCard
                work={work}
                compact
                showSummary
                reason={`${rate.toFixed(1)}% 的浏览者点了收藏，高于全站平均`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="container discover-section">
        <SectionHead
          num="04"
          title="主题合集"
          desc="把几件作品放在一起看，会比单看一件更有意思。"
          action={<span className="mono-small">3 COLLECTIONS</span>}
        />
        <div className="collection-grid">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section className="container discover-section">
        <SectionHead
          num="05"
          title="值得关注的创作者"
          desc="他们的作品有统一的脾气。关注一个，比收藏十件更划算。"
          action={<span className="mono-small">FOLLOW A PERSON</span>}
        />
        <div className="creator-grid">
          {visibleCreators.slice(0, 4).map((creator) => (
            <CreatorCard key={creator.handle} creator={creator} />
          ))}
        </div>
      </section>

      <section className="container discover-section">
        <SectionHead
          num="06"
          title="跨类型案例"
          desc="同一个世界观，做成游戏、短剧和小说，会变成三种完全不同的东西。"
          action={
            <Link className="arrow-link" to="/topics/%E5%8D%81%E4%B8%89%E6%A5%BC%E5%AE%87%E5%AE%99">
              进入话题
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <div className="cross-case">
          <div className="cross-case__copy">
            <span className="eyebrow">CASE / 十三楼宇宙</span>
            <h3>一个不肯搬走的世界观</h3>
            <p>
              鹿鸣先做了一款点击解谜游戏，然后让 13 楼的邻居走进短剧，
              最后把纸人写成了长篇小说。三件作品共享同一栋楼，但不需要按顺序看。
            </p>
            <div className="cross-case__by">
              <Avatar name="鹿鸣" text="鹿" color="#FF5A3C" size="sm" />
              <span>
                鹿鸣 · 7 件作品
                <Link to="/u/luming">看主页 →</Link>
              </span>
            </div>
          </div>
          <div className="cross-case__works">
            {crossWorks.map((work, index) => {
              const config = WORK_TYPE_CONFIG[work.type];
              return (
                <Link key={work.id} className="cross-work" to={workLink(work)}>
                  <span className="cross-work__cover">
                    <Cover cover={work.cover} />
                  </span>
                  <span className="cross-work__meta">
                    <TypeSticker type={work.type} variant="tag" />
                    <strong>{work.title}</strong>
                    <small>{config.label} · {work.stats.likes} 喜欢</small>
                  </span>
                  <span className="cross-work__index">{String(index + 1).padStart(2, "0")}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container discover-section">
        <SectionHead
          num="07"
          title="社区热议"
          desc="不是完整的动态流，只挑了几条正在长出答案的讨论。"
          action={
            <Link className="arrow-link" to="/search?q=%E8%AE%A8%E8%AE%BA&type=post">
              看更多讨论
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <div className="post-grid">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="container discover-section discover-section--last">
        <div className="hot-tags">
          <div className="hot-tags__head">
            <span className="eyebrow">TAGS / 热门标签</span>
            <h2>从一个词开始逛</h2>
          </div>
          <div className="hot-tags__cloud">
            {hotTags.map(([tag, count], index) => (
              <Link
                key={tag}
                className={`hot-tag hot-tag--${index % 4}`}
                to={`/topics/${encodeURIComponent(tag)}`}
              >
                #{tag}
                <sup>{count}</sup>
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
