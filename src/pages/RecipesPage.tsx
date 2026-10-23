import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Bookmark, Search, Sparkles, Wrench } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { TypeSticker } from "@/components/ui/primitives";
import { recipes } from "@/data/recipes";
import { workMap } from "@/data/seed";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { track } from "@/lib/analytics";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { unique } from "@/lib/utils";
import { workLink } from "@/lib/work";
import type { ContentType } from "@/types";

const TYPES: { value: ContentType | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "game", label: "游戏" },
  { value: "drama", label: "短剧" },
  { value: "novel", label: "小说" },
  { value: "tutorial", label: "教程" },
];

export function RecipesPage() {
  useDocumentTitle("配方库 · 灵作");
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const type = (params.get("type") ?? "all") as ContentType | "all";
  const tool = params.get("tool") ?? "";
  const savedOnly = params.get("saved") === "1";
  const [saved, setSaved] = useLocalStorage<string[]>(LS_KEYS.savedRecipes, []);

  const all = useMemo(
    () =>
      Object.entries(recipes).flatMap(([id, recipe]) => {
        const work = workMap.get(id);
        return work ? [{ work, recipe }] : [];
      }),
    [],
  );

  const tools = useMemo(() => unique(all.flatMap((item) => item.work.tools)), [all]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(({ work, recipe }) => {
      if (type !== "all" && work.type !== type) return false;
      if (tool && !work.tools.includes(tool)) return false;
      if (savedOnly && !saved.includes(work.id)) return false;
      if (!needle) return true;
      const haystack = `${work.title} ${work.summary} ${recipe.prompt} ${recipe.workflow.join(" ")} ${work.tags.join(" ")} ${work.tools.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [all, query, type, tool, savedOnly, saved]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="recipes-page">
      <section className="recipes-hero">
        <div className="container">
          <span className="eyebrow">RECIPES / 配方库</span>
          <div className="recipes-hero__row">
            <div>
              <h1>拆开看，<br />拿去用。</h1>
              <p>所有公开的作品配方都在这里：提示词、工作流、工具和参数。可以按类型、工具筛选，也可以先收藏再慢慢试。</p>
            </div>
            <div className="recipes-hero__count">
              <strong>{all.length}</strong>
              <span>份公开配方</span>
              <span>{saved.length} 份已收藏</span>
            </div>
          </div>

          <div className="recipe-filters">
            <label className="recipe-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => update("q", event.target.value)}
                placeholder="搜提示词、工作流、作品名…"
                aria-label="搜索配方"
              />
            </label>
            <div className="recipe-type-tabs" role="group" aria-label="按类型筛选">
              {TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={type === item.value ? "is-active" : ""}
                  onClick={() => update("type", item.value === "all" ? "" : item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <select
              className="recipe-tool-select"
              value={tool}
              onChange={(event) => update("tool", event.target.value)}
              aria-label="按工具筛选"
            >
              <option value="">全部工具</option>
              {tools.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button
              type="button"
              className={savedOnly ? "recipe-saved-toggle is-active" : "recipe-saved-toggle"}
              aria-pressed={savedOnly}
              onClick={() => update("saved", savedOnly ? "" : "1")}
            >
              <Bookmark size={14} fill={savedOnly ? "currentColor" : "none"} />
              只看收藏
            </button>
          </div>
        </div>
      </section>

      <div className="container recipes-body">
        <div className="recipes-result-line">
          <span>{filtered.length} 份配方</span>
          <Link className="text-btn" to="/tools">去找工具 <ArrowRight size={12} /></Link>
        </div>

        {filtered.length ? (
          <div className="recipe-grid">
            {filtered.map(({ work, recipe }) => {
              const isSaved = saved.includes(work.id);
              return (
                <article className="recipe-card" key={work.id}>
                  <div className="recipe-card__head">
                    <div className="recipe-card__cover">
                      <Link to={workLink(work)} aria-label={`打开《${work.title}》`}>
                        <Cover cover={work.cover} />
                      </Link>
                    </div>
                    <div className="recipe-card__title">
                      <TypeSticker type={work.type} />
                      <h2><Link to={workLink(work)}>{work.title}</Link></h2>
                      <span className="recipe-card__tools">{work.tools.join(" / ")}</span>
                    </div>
                    <button
                      type="button"
                      className={isSaved ? "recipe-save is-active" : "recipe-save"}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "取消收藏配方" : "收藏配方"}
                      onClick={() => {
                        track("recipe_save", { work: work.id, saved: !isSaved });
                        setSaved((prev) =>
                          isSaved ? prev.filter((id) => id !== work.id) : [...prev, work.id],
                        );
                      }}
                    >
                      <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="recipe-card__prompt">
                    <span className="eyebrow">PROMPT / 提示词</span>
                    <p>{recipe.prompt}</p>
                  </div>

                  <div className="recipe-card__workflow">
                    <span><Sparkles size={12} /> {recipe.workflow.length} 步工作流</span>
                    <span><Wrench size={12} /> {recipe.params.slice(0, 2).join(" · ")}</span>
                  </div>

                  <div className="recipe-card__foot">
                    <span>{recipe.visibility}</span>
                    <Link className="text-btn" to={workLink(work)}>
                      看完整配方
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="recipes-empty">
            <Sparkles size={26} />
            <h2>还没有匹配的配方。</h2>
            <p>换个关键词，或者取消“只看收藏”。</p>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
            >
              清空筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
