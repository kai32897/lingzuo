import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, Search, X } from "lucide-react";
import { useSearch } from "@/components/search/SearchProvider";
import { TypeSticker } from "@/components/ui/primitives";
import { CONTENT_TYPES, HOT_SEARCHES, SITE } from "@/data/config";
import { runSearch, suggest } from "@/lib/search";
import { clearSearchHistory, getSearchHistory } from "@/lib/searchHistory";

export function SearchOverlay() {
  const { open, closeSearch, submitSearch } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setHistory(getSearchHistory());
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const suggestions = useMemo(
    () => (debounced ? suggest(debounced, 6) : []),
    [debounced],
  );

  const total = useMemo(
    () => (debounced ? runSearch(debounced).length : 0),
    [debounced],
  );

  if (!open) return null;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitSearch(query);
  };

  const quickTypes = CONTENT_TYPES.filter((item) =>
    ["game", "drama", "novel", "tutorial", "tool"].includes(item.type),
  );

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="全站搜索">
      <div className="search-overlay__top container">
        <Link className="wordmark" to="/" onClick={closeSearch} aria-label={`${SITE.name} 首页`}>
          <span className="wordmark__name">{SITE.name}</span>
          <span className="wordmark__seal">{SITE.latin}</span>
        </Link>
        <span className="search-overlay__label">全站搜索 / SEARCH</span>
        <button type="button" className="icon-btn" onClick={closeSearch} aria-label="关闭搜索">
          <X size={22} />
        </button>
      </div>

      <div className="search-overlay__inner container">
        <form className="search-overlay__form" onSubmit={onSubmit} role="search">
          <Search size={24} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜作品、教程、工具、创作者…"
            aria-label="搜索关键词"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              className="search-overlay__clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="清空关键词"
            >
              <X size={17} />
            </button>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={!query.trim()}>
            搜索
          </button>
        </form>
        <p className="search-overlay__hint">
          <kbd>Enter</kbd> 搜索全站 <span aria-hidden="true">·</span> <kbd>Esc</kbd> 关闭
          <span aria-hidden="true">·</span> 只返回公开内容
        </p>

        {debounced ? (
          <div className="search-overlay__suggest">
            <div className="search-overlay__section-title">
              <span>猜你想找</span>
              <span className="mono-small">{suggestions.length ? `${suggestions.length} 条联想` : "无联想"}</span>
            </div>
            {suggestions.length ? (
              <ul className="suggest-list">
                {suggestions.map((doc) => (
                  <li key={`${doc.type}-${doc.id}`}>
                    <Link className="suggest-row" to={doc.href} onClick={closeSearch}>
                      <TypeSticker type={doc.type} variant="tag" />
                      <span className="suggest-row__title">{doc.title}</span>
                      <span className="suggest-row__meta">{doc.meta}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="search-overlay__empty">没有直接匹配的联想。直接搜索「{debounced}」看看。</p>
            )}
            <Link
              className="search-overlay__all"
              to={`/search?q=${encodeURIComponent(debounced)}`}
              onClick={closeSearch}
            >
              搜索「{debounced}」的全部结果
              <span className="mono-small">{total} 条</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="search-overlay__cols">
            <section>
              <div className="search-overlay__section-title">
                <span>最近搜过</span>
                {history.length ? (
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      clearSearchHistory();
                      setHistory([]);
                    }}
                  >
                    清空
                  </button>
                ) : null}
              </div>
              {history.length ? (
                <div className="tag-cloud">
                  {history.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="chip chip--sm"
                      onClick={() => submitSearch(term)}
                    >
                      <Clock3 size={12} aria-hidden="true" />
                      {term}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted-text">还没有搜索记录。搜一个你最近想看的东西吧。</p>
              )}

              <div className="search-overlay__section-title search-overlay__section-title--spaced">
                <span>大家在搜</span>
              </div>
              <div className="tag-cloud">
                {HOT_SEARCHES.map((term, index) => (
                  <button
                    key={term}
                    type="button"
                    className="chip chip--sm"
                    onClick={() => submitSearch(term)}
                  >
                    <span className="hot-index">{String(index + 1).padStart(2, "0")}</span>
                    {term}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="search-overlay__section-title">
                <span>按内容类型逛</span>
              </div>
              <ul className="quick-types">
                {quickTypes.map((item) => (
                  <li key={item.type}>
                    <Link className="quick-type" to={item.href} onClick={closeSearch}>
                      <span className="quick-type__bar" style={{ background: item.color }} aria-hidden="true" />
                      <span className="quick-type__copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="search-overlay__note">
                搜索是全站唯一入口。分类页只做筛选，不再放第二个搜索框。
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
