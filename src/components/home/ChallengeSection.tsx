import { Link } from "react-router-dom";
import { ArrowRight, Clock3 } from "lucide-react";
import { SectionHead, Avatar } from "@/components/ui/primitives";
import { Cover } from "@/components/work/Cover";
import { challenges, workMap } from "@/data/seed";
import { daysLeft } from "@/lib/utils";
import { workLink } from "@/lib/work";

export function ChallengeSection() {
  const current = challenges[0];
  const next = challenges[1];
  const past = challenges[2];
  const topWorks = current.topWorkIds
    .map((id) => workMap.get(id))
    .filter((work): work is NonNullable<typeof work> => Boolean(work));
  if (!topWorks.length) return null;

  return (
    <section className="challenge-band" id="challenge" aria-labelledby="challenge-title">
      <div className="container">
        <SectionHead
          dark
          num="03"
          title="本周挑战"
          desc="每周一个限制，逼出一点新东西。现在这个：只有两个按钮的游戏。"
          action={
            <Link className="btn btn--outline btn--sm btn--on-dark" to="/challenges">
              全部挑战
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />

        <div className="challenge-grid">
          <article className="challenge-main">
            <span className="challenge-main__glyph" aria-hidden="true">
              {current.coverGlyph}
            </span>
            <div className="challenge-main__top">
              <span className="challenge-status">
                <span className="status-dot" aria-hidden="true" />
                正在征集
              </span>
              <span className="challenge-countdown">
                <Clock3 size={13} aria-hidden="true" />
                {daysLeft(current.deadlineDays)}
              </span>
            </div>
            <h3>{current.title}</h3>
            <p className="challenge-main__brief">{current.brief}</p>
            <div className="challenge-main__meta">
              <span>
                <strong>{current.entries}</strong> 人参加
              </span>
              <span>
                评委：<Avatar name="蓝桥" text="蓝" color="#8FE3FF" size="xs" /> 蓝桥
              </span>
              <span>截止后选出 3 件进「本周精选」</span>
            </div>

            <div className="challenge-top-works">
              <span className="eyebrow">目前被看得最多的</span>
              <ol>
                {topWorks.map((work, index) => (
                  <li key={work.id}>
                    <Link to={workLink(work)}>
                      <span className="challenge-rank">{String(index + 1).padStart(2, "0")}</span>
                      <span className="challenge-thumb">
                        <Cover cover={work.cover} />
                      </span>
                      <span className="challenge-work-title">
                        {work.title}
                        <small>{work.tags.slice(0, 2).join(" · ")}</small>
                      </span>
                      <span className="challenge-work-likes">{work.stats.likes} 喜欢</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <div className="challenge-main__actions">
              <Link className="btn btn--primary" to="/challenges/two-buttons">
                参加这个命题
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <span>截止前可以反复改稿，草稿会自动保存。</span>
            </div>
          </article>

          <div className="challenge-side">
            <Link className="challenge-small" to={`/challenges/${next.slug}`}>
              <span className="challenge-small__glyph" aria-hidden="true">
                {next.coverGlyph}
              </span>
              <span className="eyebrow">下一期 / UP NEXT</span>
              <h4>{next.title}</h4>
              <p>{next.brief}</p>
              <span className="challenge-small__foot">
                {next.status} · {daysLeft(next.deadlineDays)}
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
            <Link className="challenge-small challenge-small--past" to={`/challenges/${past.slug}`}>
              <span className="challenge-small__glyph" aria-hidden="true">
                {past.coverGlyph}
              </span>
              <span className="eyebrow">上一期 / ARCHIVE</span>
              <h4>{past.title}</h4>
              <p>{past.brief}</p>
              <span className="challenge-small__foot">
                {past.entries} 件作品 · 已结束
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
