import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Wrench, X } from "lucide-react";
import { EmptyState, SectionHead } from "@/components/ui/primitives";
import { ToolCard } from "@/components/cards/ToolCard";
import { WorkCard } from "@/components/work/WorkCard";
import { tools, workMap } from "@/data/seed";
import { cn, unique } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const TUTORIAL_IDS = ["w-t-1", "w-t-2", "w-t-4"];

export function ToolsPage() {
  useDocumentTitle("AI 工具库 · 灵作");
  const [params, setParams] = useSearchParams();
  const useCase = params.get("use") ?? "";
  const pricing = params.get("pricing") ?? "";
  const platform = params.get("platform") ?? "";

  const useCases = useMemo(() => unique(tools.flatMap((tool) => tool.tags)), []);
  const platforms = useMemo(() => unique(tools.flatMap((tool) => tool.platform)), []);
  const pricingOptions = useMemo(() => unique(tools.map((tool) => tool.pricing)), []);

  const filtered = useMemo(
    () =>
      tools.filter((tool) => {
        if (useCase && !tool.tags.includes(useCase)) return false;
        if (pricing && tool.pricing !== pricing) return false;
        if (platform && !tool.platform.includes(platform)) return false;
        return true;
      }),
    [useCase, pricing, platform],
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: false });
  };

  const clear = () => setParams(new URLSearchParams(), { replace: false });
  const filtersActive = Boolean(useCase || pricing || platform);
  const tutorials = TUTORIAL_IDS.map((id) => workMap.get(id)).filter(
    (work): work is NonNullable<typeof work> => Boolean(work),
  );

  return (
    <div className="tools-page">
      <section className="tools-hero">
        <div className="container tools-hero__grid">
          <div>
            <span className="eyebrow">TOOLBOX / AI 工具库</span>
            <h1>
              从想做什么，
              <br />
              到<em>用什么做。</em>
            </h1>
            <p>
              工具不是作品，也不该按热度堆在首页。这里按用途和场景排，
              每个工具都连着真正用过它的教程和作品。
            </p>
            <div className="tools-hero__meta">
              <span>{tools.length} 个工具</span>
              <span>
                {tools.reduce((sum, tool) => sum + tool.relatedTutorialIds.length, 0)} 条相关教程
              </span>
              <span>不投放广告 · 不收排序费</span>
            </div>
            <Link className="text-btn" to="/recipes">
              去配方库看提示词
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="tools-hero__art" aria-hidden="true">
            <span className="tools-hero__glyph">器</span>
            <span className="tools-hero__note">
              <Wrench size={14} />
              不按热度排，按「你要做什么」排
            </span>
          </div>
        </div>
      </section>

      <div className="filter-bar tools-filter">
        <div className="container filter-bar__inner">
          <div className="filter-group filter-group--main">
            <span className="filter-group__label">用途</span>
            <div className="filter-chips">
              <button
                type="button"
                className={cn("chip chip--sm", !useCase && "is-active")}
                aria-pressed={!useCase}
                onClick={() => update("use", "")}
              >
                全部
              </button>
              {useCases.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={cn("chip chip--sm", useCase === item && "is-active")}
                  aria-pressed={useCase === item}
                  onClick={() => update("use", useCase === item ? "" : item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-bar__right">
            <div className="filter-group">
              <span className="filter-group__label">价格</span>
              <div className="filter-chips">
                {pricingOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn("chip chip--xs", pricing === item && "is-active")}
                    aria-pressed={pricing === item}
                    onClick={() => update("pricing", pricing === item ? "" : item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-group__label">平台</span>
              <div className="filter-chips">
                {platforms.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn("chip chip--xs", platform === item && "is-active")}
                    aria-pressed={platform === item}
                    onClick={() => update("platform", platform === item ? "" : item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="container tools-body">
        <div className="tools-body__head">
          <h2>
            按用途找工具
            <span>{filtered.length}</span>
          </h2>
          <div className="tools-body__head-right">
            {filtersActive ? (
              <button type="button" className="text-btn" onClick={clear}>
                <X size={13} />
                清除筛选
              </button>
            ) : null}
            <span className="mono-small">NO ADS · NO PAID RANKING</span>
          </div>
        </div>

        {filtered.length ? (
          <div className="tool-grid">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <EmptyState
            glyph="器"
            title="这个组合下没有工具"
            desc="把价格或平台放宽一点，或者清除筛选。"
            actions={
              <button type="button" className="btn btn--primary" onClick={clear}>
                清除筛选
              </button>
            }
          />
        )}

        <div className="tools-note">
          <div>
            <span className="eyebrow">HOW WE LIST</span>
            <h3>工具页只回答四个问题</h3>
          </div>
          <ul>
            <li>能做什么？</li>
            <li>适合谁，不适合谁？</li>
            <li>看哪个教程能学会？</li>
            <li>有哪些作品真的用它做出来了？</li>
          </ul>
          <p>
            工具不是用户作品，所以这里没有「点赞」和「二创」。你可以收藏一个工具，
            但真正的入口永远是教程和作品。
          </p>
        </div>
      </section>

      <section className="section tools-tutorials">
        <div className="container">
          <SectionHead
            num="NEXT"
            title="先看教程，再看工具"
            desc="三个教程分别用到视频、代码和角色对话工具。看完再决定要不要开会员。"
            action={
              <Link className="arrow-link" to="/tutorials">
                全部教程
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            }
          />
          <div className="tools-tutorial-grid">
            {tutorials.map((tutorial) => (
              <WorkCard key={tutorial.id} work={tutorial} compact showSummary ratio="wide" />
            ))}
          </div>
          <Link className="tools-back" to="/discover">
            不知道想做什么？先去发现页逛逛
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
