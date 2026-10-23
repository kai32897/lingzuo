import { Link } from "react-router-dom";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { AuthorLine, Avatar, TypeSticker } from "@/components/ui/primitives";
import { creators, stats, workMap } from "@/data/seed";
import { SITE } from "@/data/config";
import { workLink } from "@/lib/work";

export function Hero() {
  const featured = workMap.get("w-d-1");
  if (!featured) return null;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <div className="hero__eyebrow">
            <span className="hero__vol">{SITE.volume}</span>
            <span className="hero__tick" aria-hidden="true" />
            <span>本周命题 · 只有两个按钮的游戏</span>
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
              {creators.slice(0, 4).map((creator) => (
                <Avatar
                  key={creator.handle}
                  name={creator.name}
                  text={creator.avatarText}
                  color={creator.avatarColor}
                  size="xs"
                />
              ))}
              <span className="hero__avatar-more">+{creators.length}</span>
            </div>
            <p>
              本周 <strong>{stats.weeklyNew}</strong> 件新作，<strong>87</strong> 人交了挑战作业。
              <span>不强制登录，先逛再说。</span>
            </p>
          </div>
        </div>

        <div className="hero__feature">
          <span className="hero__badge">今日灵作 / TODAY&apos;S PICK</span>
          <div className="hero-card">
            <Link
              className="hero-card__media"
              to={workLink(featured)}
              aria-label={`${featured.title}，看一集`}
            >
              <Cover cover={featured.cover} />
              <span className="hero-card__media-label">
                <span className="hero-card__play" aria-hidden="true">
                  ▶
                </span>
                第 1 集 · 2 分 30 秒
              </span>
            </Link>
            <div className="hero-card__body">
              <div className="hero-card__top">
                <TypeSticker type="drama" />
                <span className="hero-card__meta">6 集 · 连载中</span>
              </div>
              <h2>
                <Link to={workLink(featured)}>{featured.title}</Link>
              </h2>
              <p className="hero-card__summary">{featured.summary}</p>
              <div className="hero-card__foot">
                <AuthorLine handle={featured.authorHandle} size="xs" />
                <div className="hero-card__actions">
                  <Link className="btn btn--primary btn--sm" to={workLink(featured)}>
                    看一集
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
      </div>
    </section>
  );
}
