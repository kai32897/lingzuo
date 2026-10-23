import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Gamepad2,
  GraduationCap,
  PenLine,
  Sparkles,
} from "lucide-react";
import { SectionHead } from "@/components/ui/primitives";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { challenges, workMap } from "@/data/seed";
import { loadDrafts } from "@/lib/userContent";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { timeAgo } from "@/lib/utils";
import type { ContentType } from "@/types";

const TYPE_CARDS: {
  type: ContentType;
  icon: typeof Gamepad2;
  title: string;
  desc: string;
  time: string;
}[] = [
  {
    type: "game",
    icon: Gamepad2,
    title: "AI 游戏",
    desc: "做一个点开就能玩的小游戏。两个按钮、一个场景，也能成立。",
    time: "8–20 分钟能玩完",
  },
  {
    type: "drama",
    icon: Clapperboard,
    title: "AI 短剧",
    desc: "拍一集竖屏短剧。先有一集，再想世界观。",
    time: "单集 3 分钟",
  },
  {
    type: "novel",
    icon: BookOpen,
    title: "AI 小说",
    desc: "写一个能读下去的故事。先交第一章，不用等完结。",
    time: "先写 1 章",
  },
  {
    type: "tutorial",
    icon: GraduationCap,
    title: "AI 教程",
    desc: "把你会的教给别人。步骤、提示词、产出，缺一不可。",
    time: "5–7 步",
  },
];

export function CreateIndexPage() {
  useDocumentTitle("发布作品 · 灵作");
  const [searchParams] = useSearchParams();
  const drafts = loadDrafts();
  const remixOf = searchParams.get("remixOf");
  const parent = remixOf ? workMap.get(remixOf) : undefined;
  const challengeSlug = searchParams.get("challenge");
  const challenge = challengeSlug ? challenges.find((item) => item.slug === challengeSlug) : undefined;
  const contextQuery = remixOf
    ? `?remixOf=${encodeURIComponent(remixOf)}`
    : challenge
      ? `?challenge=${encodeURIComponent(challenge.slug)}`
      : "";

  return (
    <div className="create-page">
      <section className="create-hero">
        <div className="container create-hero__grid">
          <div>
            <span className="eyebrow">CREATE / 发布</span>
            <h1>
              做一件，
              <br />
              <em>带配方的东西。</em>
            </h1>
            <p>
              不用先成为「创作者」。做完了、拆得开、能署名，就可以发。
              发布后它会进入首页「今日上新」和你的个人主页。
            </p>
            <div className="create-hero__meta">
              <span>
                <Sparkles size={13} /> 配方可选：提示词、工作流都可以留空
              </span>
              <span>AI 声明必填</span>
              <span>草稿自动保存</span>
            </div>
          </div>
          <div className="create-hero__note">
            <span className="eyebrow">BEFORE YOU START</span>
            <h3>先想清楚三件事</h3>
            <ol>
              <li>别人点开之后，第一件事做什么？</li>
              <li>你用了什么工具、什么提示词？</li>
              <li>别人可不可以接着做？</li>
            </ol>
            <Link className="arrow-link" to="/guidelines">
              看发布规范
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <div className="container create-body">
        {parent ? (
          <div className="create-context">
            <span className="eyebrow">REMIX / 二创</span>
            <p>
              正在二创 <Link to={`/${parent.type}s/${parent.slug}`}>《{parent.title}》</Link>。发布后会自动带上原作者署名和血缘。
            </p>
          </div>
        ) : null}
        {challenge ? (
          <div className="create-context create-context--challenge">
            <span className="eyebrow">CHALLENGE / 本周挑战</span>
            <p>
              正在参加「{challenge.title}」。{challenge.brief}
              <Link to={`/challenges/${challenge.slug}`}>看命题</Link>
            </p>
          </div>
        ) : null}
        <SectionHead
          num="01"
          title="选一个类型"
          desc="四种类型共用同一套发布流程，但字段和预览不一样。"
          action={<span className="mono-small">4 TYPES · ONE PIPELINE</span>}
        />
        <div className="create-types">
          {TYPE_CARDS.map(({ type, icon: Icon, title, desc, time }) => {
            const config = WORK_TYPE_CONFIG[type];
            return (
              <Link key={type} className="create-type-card" to={`/create/${type}${contextQuery}`}>
                <div className="create-type-card__top">
                  <span className="create-type-card__icon">
                    <Icon size={22} />
                  </span>
                  <span className="create-type-card__code">{config.code}</span>
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <div className="create-type-card__foot">
                  <span>{time}</span>
                  <ArrowRight size={15} />
                </div>
              </Link>
            );
          })}
        </div>

        <Link className="create-post-banner" to="/create/post">
          <span className="create-post-banner__icon">
            <PenLine size={20} />
          </span>
          <span>
            <span className="eyebrow">LIGHTER / 轻量</span>
            <strong>只发一条动态</strong>
            <small>讨论、求助、交作业、创作日志。没有作品也能发。</small>
          </span>
          <ArrowRight size={17} />
        </Link>

        {drafts.length ? (
          <section className="create-drafts">
            <div className="create-drafts__head">
              <div>
                <span className="eyebrow">DRAFTS / 草稿</span>
                <h2>继续上次没做完的</h2>
              </div>
              <span className="mono-small">保存在本地</span>
            </div>
            <div className="create-drafts__list">
              {drafts.map((draft) => (
                <Link key={draft.id} to={`/create/${draft.type}`} className="draft-row">
                  <span className="draft-row__type">{WORK_TYPE_CONFIG[draft.type].label}</span>
                  <strong>{draft.title}</strong>
                  <span>{timeAgo(draft.updatedAt)}</span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="create-help">
          <div>
            <span className="eyebrow">RULES / 发布前</span>
            <h3>不要发这些</h3>
          </div>
          <ul>
            <li>未授权的 IP、真实人物肖像或隐私信息</li>
            <li>只有封面和一句标题，没有作品内容</li>
            <li>隐藏 AI 声明，或者把别人的配方写成自己的</li>
            <li>带自动播放声音、诱导分享或外链导流的页面</li>
          </ul>
          <Link className="arrow-link" to="/ai-policy">
            看 AI 声明要求
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
