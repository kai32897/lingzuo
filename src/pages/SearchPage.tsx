import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Clock3,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { EmptyState, TypeSticker } from "@/components/ui/primitives";
import { Cover } from "@/components/work/Cover";
import {
  CONTENT_TYPES,
  HOT_SEARCHES,
  SORT_OPTIONS,
  isSearchType,
  typeConfig,
} from "@/data/config";
import { workMap } from "@/data/seed";
import type { SearchType } from "@/types";
import { countByType, emptySuggestions, runSearch, tokenize, type SearchDoc } from "@/lib/search";
import { getSearchHistory, clearSearchHistory } from "@/lib/searchHistory";
import { track } from "@/lib/analytics";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn, escapeRegExp, formatCount, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const TYPE_ORDER: SearchType[] = [
  "all",
  "game",
  "drama",
  "novel",
  "tutorial",
  "tool",
  "creator",
  "post",
];

function Highlight({ text, query }: { text: string; query: string }) {
  const terms = Array.from(
    new Set([...query.trim().split(/\s+/), ...tokenize(query)]),
  )
    .filter((term) => term.length > 0)
    .sort((a, b) => b.length - a.length);
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  const lowered = new Set(terms.map((term) => term.toLowerCase()));
  return (
    <>
      {parts.map((part, index) =>
        lowered.has(part.toLowerCase()) ? (
          <mark key={`${part}-${index}`}>{part}</mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function isValidSort(value: string | null): value is string {
  return value === "relevance" || value === "latest" || value === "hot" || value === "fast" || value === "follow" || value === "finished" || value === "short";
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const q = (params.get("q") ?? "").trim();
  const rawType = params.get("type");
  const type: SearchType = isSearchType(rawType) ? rawType : "all";
  const rawSort = params.get("sort");
  const sort = isValidSort(rawSort) ? rawSort : "relevance";
  const tag = params.get("tag") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const [input, setInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());

  useDocumentTitle(q ? `搜索「${q}」· 灵作` : "全站搜索 · 灵作");

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [q, type, sort, tag]);

  const allDocs = useMemo(() => runSearch(q), [q]);
  const docs = useMemo(() => runSearch(q, { type, sort }), [q, type, sort]);
  const counts = useMemo(() => countByType(allDocs), [allDocs]);

  useEffect(() => {
    if (!q.trim()) return;
    const timer = window.setTimeout(() => {
      track("search", { query: q, type, sort, results: docs.length });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [q, type, sort, docs.length]);

  const tagOptions = useMemo(() => {
    if (type === "all" || !docs.length) return [];
    const frequency = new Map<string, number>();
    for (const doc of docs) {
      for (const item of doc.tags) {
        if (!item || item.startsWith("AI ") || item === "AI 生成" || item === "创作者" || item === "社区动态") continue;
        frequency.set(item, (frequency.get(item) ?? 0) + 1);
      }
    }
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([item]) => item);
  }, [docs, type]);

  const results = useMemo(() => {
    let list = [...docs];
    if (tag) list = list.filter((doc) => doc.tags.includes(tag));
    const minutesOf = (doc: SearchDoc): number => {
      const work = workMap.get(doc.id);
      if (work?.type === "game") return work.meta.minutes;
      if (work?.type === "tutorial") return work.meta.minutes;
      return 999;
    };
    if (sort === "fast" || sort === "short") {
      list.sort((a, b) => minutesOf(a) - minutesOf(b));
    }
    if (sort === "follow") {
      list.sort((a, b) => {
        const aWork = workMap.get(a.id);
        const bWork = workMap.get(b.id);
        const aOpen = aWork?.type === "drama" && aWork.meta.status === "连载中" ? 0 : 1;
        const bOpen = bWork?.type === "drama" && bWork.meta.status === "连载中" ? 0 : 1;
        return aOpen - bOpen;
      });
    }
    if (sort === "finished") {
      list.sort((a, b) => {
        const aWork = workMap.get(a.id);
        const bWork = workMap.get(b.id);
        const aDone = aWork?.type === "novel" && aWork.meta.status === "已完结" ? 0 : 1;
        const bDone = bWork?.type === "novel" && bWork.meta.status === "已完结" ? 0 : 1;
        return aDone - bDone;
      });
    }
    return list;
  }, [docs, tag, sort]);

  const pageSize = 10;
  const visible = results.slice(0, page * pageSize);
  const remaining = results.length - visible.length;

  const emptyHints = emptySuggestions(q);
  const sortOptions = (SORT_OPTIONS as Record<string, readonly { value: string; label: string }[]>)[type] ?? SORT_OPTIONS.all;

  const updateParams = (changes: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    setParams(next, { replace: false });
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const term = input.trim();
    if (!term) {
      inputRef.current?.focus();
      return;
    }
    const next = new URLSearchParams();
    next.set("q", term);
    if (sort !== "relevance") next.set("sort", sort);
    navigate(`/search?${next.toString()}`);
  };

  const runTerm = (term: string) => {
    const next = new URLSearchParams();
    next.set("q", term);
    navigate(`/search?${next.toString()}`);
  };

  return (
    <div className="search-page">
      <section className="search-hero">
        <div className="container">
          <h1 className="sr-only">全站搜索</h1>
          <div className="search-hero__eyebrow">
            <span className="eyebrow">ONE SEARCH / 全站统一搜索</span>
            <span className="search-hero__public">
              <Sparkles size={13} aria-hidden="true" />
              只搜公开内容，不返回草稿和私密配方
            </span>
          </div>
          <form className="search-form" onSubmit={submit} role="search">
            <Search size={22} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="搜作品、教程、工具、创作者…"
              aria-label="搜索全站"
              autoComplete="off"
            />
            {input ? (
              <button
                type="button"
                className="search-form__clear"
                aria-label="清空关键词"
                onClick={() => {
                  setInput("");
                  inputRef.current?.focus();
                }}
              >
                <X size={17} />
              </button>
            ) : null}
            <button type="submit" className="btn btn--primary">
              搜索
            </button>
          </form>

          <div className="search-hero__status">
            {q ? (
              <p>
                {loading ? (
                  "正在全站找…"
                ) : (
                  <>
                    找到 <strong>{results.length}</strong> 个和「<em>{q}</em>」相关的内容
                    {tag ? `，已用「${tag}」筛选` : ""}
                  </>
                )}
              </p>
            ) : (
              <p>输入一个词，结果会同时覆盖作品、工具、创作者和社区动态。不需要先选分类。</p>
            )}
            <span className="keyboard-hint">
              <kbd>/</kbd> 或 <kbd>Ctrl K</kbd> 随时搜索
            </span>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="search-tabs" role="tablist" aria-label="按内容类型筛选">
          {TYPE_ORDER.map((item) => {
            const config = typeConfig(item);
            const active = item === type;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn("search-tab", active && "is-active")}
                onClick={() => updateParams({ type: item === "all" ? null : item, tag: null })}
              >
                <span
                  className="search-tab__dot"
                  style={{ background: config.color }}
                  aria-hidden="true"
                />
                {config.label}
                {q ? <span className="search-tab__count">{counts[item]}</span> : null}
              </button>
            );
          })}
        </div>

        {q ? (
          <>
            <div className="search-toolbar">
              <div className="search-toolbar__left">
                <span className="search-toolbar__label">排序</span>
                <div className="sort-group" role="group" aria-label="排序方式">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn("sort-btn", sort === option.value && "is-active")}
                      aria-pressed={sort === option.value}
                      onClick={() =>
                        updateParams({ sort: option.value === "relevance" ? null : option.value })
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="search-toolbar__right">
                <span className="search-toolbar__count">{results.length} 条结果</span>
                <span className="search-toolbar__page">
                  第 {page} 页 · 每页 {pageSize} 条
                </span>
              </div>
            </div>

            {tagOptions.length ? (
              <div className="search-quickfilters">
                <span className="search-toolbar__label">
                  <SlidersHorizontal size={13} aria-hidden="true" />
                  在当前分类里缩小范围
                </span>
                <div className="filter-chips">
                  <button
                    type="button"
                    className={cn("chip chip--sm", !tag && "is-active")}
                    onClick={() => updateParams({ tag: null })}
                  >
                    全部
                  </button>
                  {tagOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={cn("chip chip--sm", tag === option && "is-active")}
                      onClick={() => updateParams({ tag: option })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="result-list" aria-busy="true" aria-label="加载搜索结果">
                {[0, 1, 2, 3].map((item) => (
                  <div className="result-skeleton" key={item}>
                    <span className="skeleton skeleton--thumb" />
                    <div className="result-skeleton__copy">
                      <span className="skeleton skeleton--line skeleton--short" />
                      <span className="skeleton skeleton--line" />
                      <span className="skeleton skeleton--line skeleton--medium" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length ? (
              <>
                <div className="result-list">
                  {visible.map((doc) => (
                    <article className="result-card" key={`${doc.type}-${doc.id}`}>
                      <Link className="result-card__cover" to={doc.href} aria-label={doc.title}>
                        <Cover cover={doc.cover} />
                      </Link>
                      <div className="result-card__body">
                        <div className="result-card__head">
                          <TypeSticker type={doc.type} />
                          <span className="result-card__time">{timeAgo(doc.createdAt)}</span>
                          <span className="result-card__source">{doc.authorName}</span>
                        </div>
                        <h2 className="result-card__title">
                          <Link to={doc.href}>
                            <Highlight text={doc.title} query={q} />
                          </Link>
                        </h2>
                        <p className="result-card__summary">
                          <Highlight text={doc.summary} query={q} />
                        </p>
                        <div className="result-card__meta">
                          <span>{doc.meta}</span>
                          <span>{formatCount(doc.stats.likes)} 喜欢</span>
                          {doc.stats.comments ? <span>{doc.stats.comments} 条回复</span> : null}
                        </div>
                      </div>
                      <div className="result-card__action">
                        <Link className="btn btn--outline btn--sm" to={doc.href}>
                          {doc.action}
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
                {remaining > 0 ? (
                  <div className="load-more">
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => updateParams({ page: String(page + 1) }, false)}
                    >
                      加载更多
                      <span className="mono-small">还有 {remaining} 条</span>
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="search-empty">
                <EmptyState
                  glyph="没"
                  title={`没有找到和「${q}」相关的内容。`}
                  desc={
                    <>
                      换个词，或者去发现逛逛？也可以试试下面这些相近的搜索。
                    </>
                  }
                  actions={
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => {
                        setInput("");
                        inputRef.current?.focus();
                      }}
                    >
                      修改关键词
                    </button>
                  }
                />
                <div className="search-empty__suggest">
                  {emptyHints.length ? (
                    <div className="search-empty__block">
                      <span className="eyebrow">也许你想搜</span>
                      <div className="tag-cloud">
                        {emptyHints.map((item) => (
                          <Link key={item.label} className="chip chip--sm" to={item.href}>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="search-empty__block">
                    <span className="eyebrow">热门搜索</span>
                    <div className="tag-cloud">
                      {HOT_SEARCHES.slice(0, 6).map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="chip chip--sm"
                          onClick={() => runTerm(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="search-empty__block">
                    <span className="eyebrow">按分类逛</span>
                    <div className="search-empty__cats">
                      {CONTENT_TYPES.filter((item) =>
                        ["game", "drama", "novel", "tutorial"].includes(item.type),
                      ).map((item) => (
                        <Link key={item.type} to={item.href} className="search-empty__cat">
                          <span style={{ background: item.color }} aria-hidden="true" />
                          {item.label}
                          <ArrowUpRight size={13} aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="search-start">
            <div className="search-start__main">
              <div className="search-start__head">
                <span className="eyebrow">START HERE</span>
                <h1>搜什么都行。</h1>
                <p>
                  你可以搜作品名、作者、工具、题材，甚至一句模糊的描述。搜索是全站唯一入口，
                  结果页里再按类型缩小范围。
                </p>
              </div>

              {searchHistory.length ? (
                <div className="search-start__block">
                  <div className="search-start__label">
                    <span>最近搜过</span>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => {
                        clearSearchHistory();
                        setSearchHistory([]);
                        toast({ title: "搜索历史已清空", desc: "下一次搜索会重新开始记录。" });
                      }}
                    >
                      清空
                    </button>
                  </div>
                  <div className="tag-cloud">
                    {searchHistory.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className="chip"
                        onClick={() => runTerm(term)}
                      >
                        <Clock3 size={13} aria-hidden="true" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="search-start__block">
                <div className="search-start__label">
                  <span>大家在搜</span>
                  <span className="mono-small">TRENDING</span>
                </div>
                <div className="hot-grid">
                  {HOT_SEARCHES.map((term, index) => (
                    <button
                      key={term}
                      type="button"
                      className="hot-item"
                      onClick={() => runTerm(term)}
                    >
                      <span className="hot-item__index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="hot-item__term">{term}</span>
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="search-start__aside">
              <span className="eyebrow">按内容类型</span>
              <div className="search-start__cats">
                {CONTENT_TYPES.filter((item) => item.type !== "all").map((item) => (
                  <Link key={item.type} className="search-start__cat" to={item.href}>
                    <span
                      className="search-start__cat-bar"
                      style={{ background: item.color }}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                ))}
              </div>
              <p className="search-start__note">
                搜索负责「找已知」，发现负责「遇到未知」。如果你还不知道想看什么，
                <Link to="/discover"> 去发现页逛逛 </Link>。
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
