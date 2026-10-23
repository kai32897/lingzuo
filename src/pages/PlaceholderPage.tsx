import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, Construction, Search } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import {
  AuthorLine,
  SectionHead,
  TypeSticker,
  WorkTypeDot,
} from "@/components/ui/primitives";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { workBySlug, workMap } from "@/data/seed";
import type { ContentType } from "@/types";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { metaLine, workLink } from "@/lib/work";

const STAGES = ["骨架 · 首页 · 搜索 · 分类", "详情与体验", "发布与个人", "打磨与验收"];

const STAGE_FEATURES: Record<ContentType, string[]> = {
  game: ["可玩舞台与开始遮罩", "全屏游玩页", "玩法说明与开发日志", "作品配方与二创素材"],
  drama: ["9:16 竖屏播放器", "全屏连刷 / 时间点评论", "追剧进度与剧集条", "幕后配方与角色卡"],
  novel: ["章节目录与阅读器", "字号 / 主题 / 进度", "划线想法与 TTS", "书架与作者的话"],
  tutorial: ["步骤可勾选的学习清单", "提示词一键复制", "前后对比与素材包", "交作业墙与问答"],
};

export function PagePlaceholder({
  title,
  desc,
  stage,
  bullets,
  eyebrow = "UNDER CONSTRUCTION",
}: {
  title: string;
  desc: string;
  stage: 2 | 3 | 4;
  bullets?: string[];
  eyebrow?: string;
}) {
  useDocumentTitle(`${title} · 灵作`);
  return (
    <div className="page-placeholder container">
      <div className="page-placeholder__card">
        <span className="page-placeholder__stage">
          <Construction size={13} />
          {eyebrow} · STAGE {String(stage).padStart(2, "0")}
        </span>
        <h1>{title}</h1>
        <p className="page-placeholder__desc">{desc}</p>

        <div className="stage-track">
          {STAGES.map((label, index) => {
            const number = index + 1;
            const state = number < stage ? "done" : number === stage ? "current" : "next";
            return (
              <div key={label} className={`stage-track__item stage-track__item--${state}`}>
                <span>{number < stage ? "✓" : String(number).padStart(2, "0")}</span>
                <b>{label}</b>
              </div>
            );
          })}
        </div>

        {bullets?.length ? (
          <ul className="page-placeholder__list">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        <div className="page-placeholder__actions">
          <Link className="btn btn--primary" to="/">
            <ArrowLeft size={16} />
            回首页
          </Link>
          <Link className="btn btn--outline" to="/discover">
            <Compass size={16} />
            先去逛逛
          </Link>
        </div>
        <p className="page-placeholder__note">
          当前已开放：首页、发现、全站搜索、四个分类页和工具库。
          这一页会在后续阶段替换成真正的功能，不做假按钮。
        </p>
      </div>
    </div>
  );
}

export function WorkDetailPlaceholder({ type }: { type: ContentType }) {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`${type}/${slug}`) : undefined;
  const config = WORK_TYPE_CONFIG[type];
  useDocumentTitle(work ? `${work.title} · 灵作` : `${config.label} · 灵作`);

  if (!work) {
    return (
      <PagePlaceholder
        title="这件作品不在这里"
        desc="链接可能写错了，或者作品已经被作者收回了。可以回分类页重新找一件。"
        stage={2}
        bullets={["回到分类页重新浏览", "用顶栏搜索作品名或作者", "去发现页随机遇到一件"]}
      />
    );
  }

  return (
    <div className="work-placeholder container">
      <nav className="breadcrumb" aria-label="面包屑">
        <Link to="/">首页</Link>
        <span aria-hidden="true">/</span>
        <Link to={config.href}>{config.label}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{work.title}</span>
      </nav>

      <div className="work-placeholder__grid">
        <div className="work-placeholder__cover">
          <Cover cover={work.cover} />
          <span className="work-placeholder__stamp">STAGE 02</span>
        </div>
        <div className="work-placeholder__copy">
          <div className="work-placeholder__top">
            <TypeSticker type={work.type} />
            <span>{metaLine(work)}</span>
            <span className="work-placeholder__ai">含 AI 生成内容</span>
          </div>
          <h1>{work.title}</h1>
          <p className="work-placeholder__summary">{work.summary}</p>
          <blockquote className="work-placeholder__hook">「{work.hook}」</blockquote>

          <div className="work-placeholder__by">
            <AuthorLine handle={work.authorHandle} />
            <span className="work-placeholder__dot" aria-hidden="true" />
            <span>{work.tools.join(" / ")}</span>
          </div>

          <div className="work-placeholder__notice">
            <span className="notice-label">第二阶段开放</span>
            <p>
              现在先保留作品信息和配方入口。{config.action}的主舞台会在第二阶段接上，
              不会用一个假播放器糊弄过去。
            </p>
          </div>

          <div className="work-placeholder__features">
            <span className="eyebrow">NEXT IN THIS PAGE</span>
            <ul>
              {STAGE_FEATURES[work.type].map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="work-placeholder__actions">
            <Link className="btn btn--primary" to={config.href}>
              <ArrowLeft size={16} />
              返回{config.label}
            </Link>
            <Link
              className="btn btn--outline"
              to={`/search?q=${encodeURIComponent(work.title)}`}
            >
              <Search size={16} />
              搜同类作品
            </Link>
          </div>
        </div>
      </div>

      <div className="work-placeholder__related">
        <SectionHead
          num="RELATED"
          title="先看看同类的"
          desc="这些作品都带完整配方，第二阶段会连上它们的体验舞台。"
          action={
            <Link className="arrow-link" to={config.href}>
              全部{config.label}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />
        <div className="work-placeholder__related-grid">
          {[...workMap.values()]
            .filter((item) => item.type === type && item.id !== work.id)
            .slice(0, 3)
            .map((item) => (
              <Link key={item.id} className="related-mini" to={workLink(item)}>
                <span className="related-mini__cover">
                  <Cover cover={item.cover} />
                </span>
                <span className="related-mini__copy">
                  <span className="related-mini__type">
                    <WorkTypeDot type={item.type} />
                    {config.label}
                  </span>
                  <strong>{item.title}</strong>
                  <small>{item.stats.likes} 喜欢 · {metaLine(item)}</small>
                </span>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
