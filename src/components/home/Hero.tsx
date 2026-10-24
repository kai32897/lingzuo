import { Link } from "react-router-dom";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { AuthorLine, Avatar, TypeSticker } from "@/components/ui/primitives";
import { creators, works } from "@/data/seed";
import { SITE, WORK_TYPE_CONFIG } from "@/data/config";
import { workLink } from "@/lib/work";

export function Hero() {
  const featured = works.find((work) => work.type === "drama") ?? works[0];
  const config = featured ? WORK_TYPE_CONFIG[featured.type] : undefined;
  const realCreators = creators.filter((creator) =>
    works.some((work) => work.authorHandle === creator.handle),
  );

  const meta = !featured
    ? ""
    : featured.type === "drama"
      ? `${featured.meta.episodes.length} 集 · ${featured.meta.status}`
      : featured.type === "game"
        ? `${featured.meta.difficulty}难度 · ${featured.meta.minutes} 分钟`
        : featured.type === "novel"
          ? `${featured.meta.status} · ${featured.meta.words} 字`
          : `${featured.meta.difficulty} · ${featured.meta.minutes} 分钟`;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="hero__eyebrow">
            <span className="hero__vol">{SITE.volume}</span>
            <span className="hero__tick" aria-hidden="true" />
            <span>{featured ? "今日作品 · 编辑部正在看这一件" : "灵作 · 等待第一件真实作品"}</span>
          </div>
          <h1 className="hero__title" id="hero-title">
            把 AI 做的东西，
            <br />
            <em>玩起来。</em>
          </h1>
          <p className="hero__sub">
            玩一局、追一集、读两页、学一手。
            <br />
            每个作品都可以带配方，每个人都能接力。
          </p>
          <div className="hero__cta">
            <Link className="btn btn--primary btn--lg" to="/discover">
              随便逛逛
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="btn btn--outline btn--lg" to="/create">
              <Plus size={17} aria-hidden="true" />
              发布作品
            </Link>
          </div>
          <div className="hero__meta">
            <div className="hero__avatars" aria-hidden="true">
              {realCreators.slice(0, 4).map((creator) => (
                <Avatar
                  key={creator.handle}
                  name={creator.name}
                  text={creator.avatarText}
                  color={creator.avatarColor}
                  size="xs"
                />
              ))}
              <span className="hero__avatar-more">+{realCreators.length}</span>
            </div>
            <p>
              已有 <strong>{works.length}</strong> 件作品，<strong>{realCreators.length}</strong> 位创作者。
              <span>不强制登录，先逛再说。</span>
            </p>
          </div>
        </div>

        {featured && config ? (
          <div className="hero__feature">
            <span className="hero__badge">今日灵作 / TODAY&apos;S PICK</span>
            <div className="hero-card">
              <Link
                className="hero-card__media"
                to={workLink(featured)}
                aria-label={`${featured.title}，${config.action}`}
              >
                <Cover cover={featured.cover} />
                <span className="hero-card__media-label">
                  <span className="hero-card__play" aria-hidden="true">
                    ▶
                  </span>
                  {featured.type === "drama"
                    ? `第 1 集 · ${Math.max(1, Math.round(featured.meta.episodes[0].seconds / 60))} 分钟`
                    : `${config.label} · ${config.action}`}
                </span>
              </Link>
              <div className="hero-card__body">
                <div className="hero-card__top">
                  <TypeSticker type={featured.type} />
                  <span className="hero-card__meta">{meta}</span>
                </div>
                <h2>
                  <Link to={workLink(featured)}>{featured.title}</Link>
                </h2>
                <p className="hero-card__summary">{featured.summary}</p>
                <div className="hero-card__foot">
                  <AuthorLine handle={featured.authorHandle} size="xs" />
                  <div className="hero-card__actions">
                    <Link className="btn btn--primary btn--sm" to={workLink(featured)}>
                      {config.action}
                    </Link>
                    <Link className="text-link" to={`${workLink(featured)}#recipe`}>
                      拆配方
                      <Sparkles size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <span className="hero__stamp" aria-hidden="true">
              MADE
              <br />
              WITH
              <br />
              AI
            </span>
            <span className="hero__tape" aria-hidden="true" />
          </div>
        ) : (
          <div className="hero__feature hero__feature--empty">
            <span className="hero__badge">WAITING / 等你发布</span>
            <div className="hero-card hero-card--empty">
              <div className="hero-card__body">
                <span className="eyebrow">NO WORKS YET</span>
                <h2>这里还没有作品。</h2>
                <p className="hero-card__summary">
                  登录后发布第一件作品，它会出现在首页、分类和搜索里。
                </p>
                <Link className="btn btn--primary btn--sm" to="/create">
                  发布第一件
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
