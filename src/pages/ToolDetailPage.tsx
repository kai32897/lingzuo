import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  Wrench,
  XCircle,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { TypeSticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { toolBySlug, tools, workMap } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { formatCount } from "@/lib/utils";
import { metaLine, workLink } from "@/lib/work";
import type { Tool, Work } from "@/types";

export function ToolDetailPage() {
  const { slug } = useParams();
  const tool = slug ? toolBySlug.get(slug) : undefined;
  useDocumentTitle(tool ? `${tool.name} · AI 工具 · 灵作` : "AI 工具 · 灵作");
  if (!tool) return <NotFoundPage />;
  return <ToolDetail tool={tool} />;
}

function ToolDetail({ tool }: { tool: Tool }) {
  const { toast } = useToast();
  const [savedTools, setSavedTools] = useLocalStorage<string[]>(LS_KEYS.savedTools, []);
  const isSaved = savedTools.includes(tool.id);
  const tutorials = tool.relatedTutorialIds
    .map((id) => workMap.get(id))
    .filter((work): work is Work => Boolean(work));
  const relatedWorks = tool.relatedWorkIds
    .map((id) => workMap.get(id))
    .filter((work): work is Work => Boolean(work));
  const relatedTools = tools.filter(
    (item) => item.id !== tool.id && item.tags.some((tag) => tool.tags.includes(tag)),
  );
  const fitFor = tool.fitFor ?? tool.scenarios;
  const notFitFor = tool.notFitFor ?? ["需要完全自动化、无需人审的批量生产"];

  return (
    <div className="detail-page tool-detail">
      <div className="container">
        <nav className="breadcrumb" aria-label="面包屑">
          <Link to="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link to="/tools">AI 工具库</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{tool.name}</span>
        </nav>

        <header className="tool-hero">
          <span className="tool-mark tool-mark--lg" aria-hidden="true">
            {tool.mark}
          </span>
          <div className="tool-hero__copy">
            <span className="eyebrow">TOOL / 工具</span>
            <h1>{tool.name}</h1>
            <p>{tool.tagline}</p>
            <div className="tool-hero__meta">
              <span>{tool.pricing}</span>
              <span>{tool.platform.join(" / ")}</span>
              {tool.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>
          <div className="tool-hero__actions">
            <a
              className="btn btn--primary"
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              打开官网
              <ExternalLink size={15} />
            </a>
            <button
              type="button"
              className={isSaved ? "btn btn--outline is-following" : "btn btn--outline"}
              aria-pressed={isSaved}
              onClick={() => {
                setSavedTools((prev) =>
                  isSaved ? prev.filter((id) => id !== tool.id) : [...prev, tool.id],
                );
                toast({
                  title: isSaved ? "已取消收藏工具" : "已收藏工具",
                  desc: isSaved ? "收藏夹里不再显示它。" : "在「我的」的收藏工具里可以找到。",
                });
              }}
            >
              {isSaved ? <Check size={15} /> : <Bookmark size={15} />}
              {isSaved ? "已收藏" : "收藏工具"}
            </button>
          </div>
        </header>

        <div className="tool-layout">
          <div className="tool-main">
            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">USE CASES / 能做什么</span>
                  <h2>别先看功能，先看它能帮你完成什么</h2>
                </div>
                <span className="mono-small">{tool.useCases.length} 个用途</span>
              </div>
              <div className="use-grid">
                {tool.useCases.map((item, index) => (
                  <div className="use-card" key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
              <div className="use-scenarios">
                <span className="eyebrow">适用场景</span>
                <div>
                  {tool.scenarios.map((scenario) => (
                    <span key={scenario}>{scenario}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="detail-section fit-section">
              <div className="fit-card fit-card--yes">
                <span className="eyebrow">FIT / 适合谁</span>
                <h2>这几类人会很顺手</h2>
                <ul>
                  {fitFor.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="fit-card fit-card--no">
                <span className="eyebrow">NOT FIT / 不适合谁</span>
                <h2>这些情况先别用它</h2>
                <ul>
                  {notFitFor.map((item) => (
                    <li key={item}>
                      <XCircle size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">TUTORIALS / 相关教程</span>
                  <h2>看别人是怎么用它做出来的</h2>
                </div>
                <Link className="arrow-link" to="/tutorials">
                  全部教程
                  <ArrowRight size={14} />
                </Link>
              </div>
              {tutorials.length ? (
                <div className="tool-tutorial-list">
                  {tutorials.map((tutorial) => (
                    <Link key={tutorial.id} className="tool-tutorial-row" to={workLink(tutorial)}>
                      <span className="tool-tutorial-row__cover">
                        <Cover cover={tutorial.cover} />
                      </span>
                      <span className="tool-tutorial-row__body">
                        <TypeSticker type={tutorial.type} variant="tag" />
                        <strong>{tutorial.title}</strong>
                        <small>{metaLine(tutorial)}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="detail-empty-text">还没有用这个工具做成的教程。</p>
              )}
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">WORKS / 相关作品</span>
                  <h2>用它做出来的东西</h2>
                </div>
              </div>
              <div className="related-grid">
                {relatedWorks.map((work) => (
                  <Link key={work.id} className="related-card" to={workLink(work)}>
                    <span className="related-card__cover">
                      <Cover cover={work.cover} />
                    </span>
                    <span className="related-card__copy">
                      <TypeSticker type={work.type} variant="tag" />
                      <strong>{work.title}</strong>
                      <small>{metaLine(work)}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <div className="external-card">
                <span className="external-card__icon">
                  <ExternalLink size={20} />
                </span>
                <div>
                  <span className="eyebrow">EXTERNAL / 外部入口</span>
                  <h3>去 {tool.name} 的官网</h3>
                  <p>
                    外部链接，会在新标签页打开。本站不代收费用，也不参与工具方的排序。
                  </p>
                  <span className="external-card__url">{tool.url.replace(/^https?:\/\//, "")}</span>
                </div>
                <a className="btn btn--outline btn--sm" href={tool.url} target="_blank" rel="noopener noreferrer">
                  打开工具
                  <ExternalLink size={13} />
                </a>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">RELATED / 同类工具</span>
                  <h2>也可以看看这些</h2>
                </div>
              </div>
              <div className="tool-grid">
                {relatedTools.slice(0, 3).map((item) => (
                  <Link key={item.id} className="tool-mini" to={`/tools/${item.slug}`}>
                    <span className="tool-mark" style={{ background: item.color }}>
                      {item.mark}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.tagline}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="tool-aside">
            <section className="aside-card">
              <span className="eyebrow">TOOL INFO / 工具信息</span>
              <div className="tool-fact">
                <span>价格</span>
                <strong>{tool.pricing}</strong>
              </div>
              <div className="tool-fact">
                <span>平台</span>
                <strong>{tool.platform.join(" / ")}</strong>
              </div>
              <div className="tool-fact">
                <span>相关教程</span>
                <strong>{tool.relatedTutorialIds.length} 条</strong>
              </div>
              <div className="tool-fact">
                <span>相关作品</span>
                <strong>{tool.relatedWorkIds.length} 件</strong>
              </div>
              <div className="tool-saves">
                <Bookmark size={14} />
                {formatCount(tool.stats.saves)} 人收藏
              </div>
            </section>

            <section className="aside-card aside-note">
              <span className="eyebrow">WHY IT'S HERE / 收录原因</span>
              <p>
                它被收录，不是因为热度，而是因为本站有作者真的用它做出了作品。
                工具只是支撑，作品和教程才是入口。
              </p>
              <div className="aside-tags">
                {tool.tags.map((tag) => (
                  <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}>
                    #{tag}
                  </Link>
                ))}
              </div>
            </section>

            <section className="aside-card aside-tip">
              <Wrench size={17} />
              <p>工具信息会随官方调整变化。价格与平台以官网为准。</p>
              <a href={tool.url} target="_blank" rel="noopener noreferrer" className="arrow-link">
                查看官网
                <ArrowRight size={13} />
              </a>
            </section>
          </aside>
        </div>

        <div className="detail-more">
          <span className="eyebrow">BACK / 返回</span>
          <div className="detail-more__author">
            <span>
              <Info size={13} /> 工具不套用点赞 / 二创
            </span>
            <Link className="arrow-link" to="/tools">
              全部工具
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
