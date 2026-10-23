import { Link, useParams } from "react-router-dom";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Clock3, Users } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { EmptyState, SectionHead } from "@/components/ui/primitives";
import { challenges, workMap, works } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { daysLeft } from "@/lib/utils";
import { workLink } from "@/lib/work";

export function ChallengeDetailPage() {
  const { slug } = useParams();
  const challenge = challenges.find((item) => item.slug === slug);
  useDocumentTitle(challenge ? `${challenge.title} · 挑战 · 灵作` : "挑战 · 灵作");
  if (!challenge) return <NotFoundPage />;

  const top = challenge.topWorkIds
    .map((id) => workMap.get(id))
    .filter((work): work is NonNullable<typeof work> => Boolean(work));
  const extraType =
    challenge.slug === "no-dialogue" ? "drama" : challenge.slug === "two-buttons" ? "game" : undefined;
  const extra = works
    .filter(
      (work) =>
        (!extraType || work.type === extraType) && !challenge.topWorkIds.includes(work.id),
    )
    .slice(0, 3);
  const active = challenge.status === "进行中";
  const related = challenges.filter((item) => item.id !== challenge.id);

  const ruleSets: Record<string, { label: string; title: string; body: string }[]> = {
    "two-buttons": [
      { label: "限制 01", title: "只能有两个操作", body: "不能有第三个按钮，不能有隐藏手势。玩家只能用两个动作做决定。" },
      { label: "限制 02", title: "不写说明文字", body: "让画面、物件和停顿自己说话。不能靠一段旁白解释规则。" },
      { label: "限制 03", title: "必须有一个不圆满的结局", body: "不要求悲剧，但不能是「赢了」。让人想再按一次，但不想按对。" },
    ],
    "no-dialogue": [
      { label: "限制 01", title: "全片没有台词", body: "不能出现任何一句对白，也不能用字幕替代台词。" },
      { label: "限制 02", title: "三分钟以内", body: "一集讲完一件事，不要试图塞进一个世界观。" },
      { label: "限制 03", title: "结尾必须说清楚", body: "不靠解释，但观众要能说出「刚才发生了什么」。" },
    ],
    "convenience-store-night": [
      { label: "限制 01", title: "故事必须发生在便利店", body: "货架、关东煮、收银台，至少有一个成为叙事的一部分。" },
      { label: "限制 02", title: "只有一个夜晚", body: "从入夜到天亮，不能跳到第二天。" },
      { label: "限制 03", title: "收尾不解释", body: "可以留白，但不能用一段话把所有的意思说死。" },
    ],
  };
  const rules = ruleSets[challenge.slug] ?? [
    { label: "限制 01", title: "完成命题", body: "先满足这一期最硬的那个限制。" },
    { label: "限制 02", title: "做出自己的东西", body: "可以借鉴结构，但要有你自己的细节。" },
    { label: "限制 03", title: "公开配方", body: "至少公开一条提示词或一段工作流。" },
  ];

  return (
    <div className="challenge-detail-page">
      <div className="container">
        <nav className="breadcrumb" aria-label="面包屑">
          <Link to="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link to="/challenges">挑战</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{challenge.title}</span>
        </nav>

        <section className="challenge-detail-hero" style={{ "--challenge-color": challenge.color } as CSSProperties}>
          <span className="challenge-detail-hero__glyph" aria-hidden="true">
            {challenge.coverGlyph}
          </span>
          <div className="challenge-detail-hero__body">
            <div className="challenge-detail-hero__meta">
              <span className={active ? "challenge-status" : "challenge-status is-past"}>
                <span className="status-dot" aria-hidden="true" />
                {challenge.status}
              </span>
              <span>
                <Clock3 size={13} />
                {daysLeft(challenge.deadlineDays)}
              </span>
              <span>
                <Users size={13} />
                {challenge.entries} 人参加
              </span>
            </div>
            <h1>{challenge.title}</h1>
            <p>{challenge.brief}</p>
            <div className="challenge-detail-hero__actions">
              <Link
                className="btn btn--primary btn--lg"
                to={
                  challenge.status === "已结束"
                    ? "/challenges"
                    : `/create?challenge=${challenge.slug}`
                }
              >
                {active ? "参加这个命题" : challenge.status === "即将开始" ? "先做准备" : "看看往期"}
                <ArrowRight size={16} />
              </Link>
              <Link className="btn btn--outline btn--lg" to="/challenges">
                <ArrowLeft size={15} />
                全部挑战
              </Link>
            </div>
          </div>
        </section>

        {top.length ? (
          <section className="discover-section">
            <SectionHead
              num="01"
              title="目前被看得最多的"
              desc="不是最终结果。截止前，投稿顺序还会变。"
              action={<span className="mono-small">{top.length} 件</span>}
            />
            <div className="challenge-submissions">
              {top.map((work, index) => (
                <Link key={work.id} className="challenge-submission" to={workLink(work)}>
                  <span className="challenge-submission__rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="challenge-submission__cover">
                    <Cover cover={work.cover} />
                  </span>
                  <span className="challenge-submission__copy">
                    <strong>{work.title}</strong>
                    <small>{work.summary}</small>
                  </span>
                  <span className="challenge-submission__likes">{work.stats.likes} 喜欢</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            glyph="等"
            title="投稿区还空着"
            desc="这个命题还没开始，或者第一件投稿还在路上。"
            actions={<Link className="btn btn--primary" to="/discover">先去逛逛</Link>}
          />
        )}

        <section className="discover-section">
          <SectionHead
            num="02"
            title="命题里的限制"
            desc="限制不是扣分项，是这次创作的主要材料。"
            action={<span className="mono-small">RULES</span>}
          />
          <div className="challenge-brief-grid">
            {rules.map((rule) => (
              <div key={rule.label}>
                <span>{rule.label}</span>
                <strong>{rule.title}</strong>
                <p>{rule.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="discover-section">
          <SectionHead
            num="03"
            title="还可以看这些"
            desc="同一期的其它投稿，或者上一期留下的东西。"
          />
          <div className="challenge-extra">
            {extra.map((work) => (
              <Link key={work.id} to={workLink(work)} className="related-card">
                <span className="related-card__cover">
                  <Cover cover={work.cover} />
                </span>
                <span className="related-card__copy">
                  <strong>{work.title}</strong>
                  <small>{work.summary}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="challenge-related">
          {related.map((item) => (
            <Link key={item.id} to={`/challenges/${item.slug}`}>
              <span>{item.status}</span>
              <strong>{item.title}</strong>
              <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
