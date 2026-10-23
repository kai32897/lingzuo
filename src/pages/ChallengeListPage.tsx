import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { SectionHead } from "@/components/ui/primitives";
import { challenges, workMap } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { daysLeft } from "@/lib/utils";
import { workLink } from "@/lib/work";

export function ChallengeListPage() {
  useDocumentTitle("本周挑战 · 灵作");
  return (
    <div className="challenge-page">
      <section className="challenge-hero">
        <div className="container">
          <span className="eyebrow">CHALLENGE / 挑战</span>
          <h1>
            每周一个限制，
            <br />
            <em>逼出一点新东西。</em>
          </h1>
          <p>
            不是命题作文，是一个刚好能做完的框。你可以参加、可以围观，
            也可以把上一期的题目重新做一遍。
          </p>
        </div>
      </section>

      <div className="container challenge-list">
        {challenges.map((challenge, index) => {
          const top = challenge.topWorkIds
            .map((id) => workMap.get(id))
            .filter((work): work is NonNullable<typeof work> => Boolean(work));
          const active = challenge.status === "进行中";
          return (
            <article className={`challenge-card ${active ? "is-live" : ""}`} key={challenge.id}>
              <div className="challenge-card__index">{String(index + 1).padStart(2, "0")}</div>
              <div className="challenge-card__glyph" style={{ color: challenge.color }} aria-hidden="true">
                {challenge.coverGlyph}
              </div>
              <div className="challenge-card__body">
                <div className="challenge-card__meta">
                  <span className={active ? "challenge-status" : "challenge-status is-past"}>
                    <span className="status-dot" aria-hidden="true" />
                    {challenge.status}
                  </span>
                  <span>
                    <Clock3 size={12} />
                    {daysLeft(challenge.deadlineDays)}
                  </span>
                  <span>{challenge.entries} 人参加</span>
                </div>
                <h2>{challenge.title}</h2>
                <p>{challenge.brief}</p>
                {top.length ? (
                  <div className="challenge-card__works">
                    {top.map((work) => (
                      <Link key={work.id} to={workLink(work)} className="challenge-card__work">
                        <span className="challenge-card__work-cover">
                          <Cover cover={work.cover} />
                        </span>
                        <span>{work.title}</span>
                        <small>{work.stats.likes} 喜欢</small>
                      </Link>
                    ))}
                  </div>
                ) : null}
                <Link className="btn btn--outline btn--sm" to={`/challenges/${challenge.slug}`}>
                  看命题与投稿
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="container">
        <SectionHead
          num="HOW"
          title="评审只看三件事"
          desc="有没有完成限制、有没有自己的东西、有没有把配方说清楚。"
          action={<span className="mono-small">每期截止后 3 天公布</span>}
        />
        <div className="challenge-rules">
          <div>
            <span>01</span>
            <strong>完成限制</strong>
            <p>命题里的限制是硬的，不能加第三个按钮，也不能偷偷加台词。</p>
          </div>
          <div>
            <span>02</span>
            <strong>自己的东西</strong>
            <p>可以借鉴结构，但要有你自己的细节。模板感太重会被看穿。</p>
          </div>
          <div>
            <span>03</span>
            <strong>配方公开</strong>
            <p>至少公开一条提示词或一段工作流，让别人能接着做。</p>
          </div>
        </div>
        <div className="challenge-cta">
          <Sparkles size={18} />
          <p>不知道从哪开始？摇一次灵感老虎机，或者先去发现页看看别人怎么接。</p>
          <Link className="arrow-link" to="/discover">
            去发现
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
