import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, Search, X } from "lucide-react";
import { useSearch } from "@/components/search/SearchProvider";
import { TypeSticker } from "@/components/ui/primitives";
import { HOT_SEARCHES } from "@/data/config";
import { suggest } from "@/lib/search";
import { getSearchHistory } from "@/lib/searchHistory";
import { cn } from "@/lib/utils";

export function GlobalSearchBox() {
  const { submitSearch } = useSearch();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setHistory(getSearchHistory().slice(0, 4));
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const suggestions = useMemo(() => (debounced ? suggest(debounced, 5) : []), [debounced]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }
    setOpen(false);
    submitSearch(query);
  };

  return (
    <div className={cn("searchbox", open && "is-open")} ref={containerRef}>
      <form className="searchbox__field" onSubmit={onSubmit} role="search">
        <Search size={16} className="searchbox__icon" aria-hidden="true" />
        <input
          ref={inputRef}
          data-global-search
          type="search"
          value={query}
          placeholder="搜作品、教程、工具、创作者…"
          aria-label="全站搜索"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className="searchbox__clear"
            aria-label="清空搜索"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X size={13} />
          </button>
        ) : (
          <kbd className="searchbox__kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </form>

      {open ? (
        <div className="searchbox__panel">
          {query.trim() ? (
            <>
              {suggestions.length ? (
                <ul className="searchbox__list">
                  {suggestions.map((doc) => (
                    <li key={`${doc.type}-${doc.id}`}>
                      <Link
                        className="searchbox__row"
                        to={doc.href}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                      >
                        <TypeSticker type={doc.type} variant="tag" />
                        <span className="searchbox__row-title">{doc.title}</span>
                        <span className="searchbox__row-meta">{doc.meta}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="searchbox__empty">没有联想，直接搜索试试。</p>
              )}
              <button
                type="button"
                className="searchbox__all"
                onClick={() => {
                  setOpen(false);
                  submitSearch(query);
                }}
              >
                <span>
                  搜索「{query.trim()}」的全部结果
                  <small>Enter</small>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              {history.length ? (
                <div className="searchbox__block">
                  <div className="searchbox__label">最近搜过</div>
                  <div className="tag-cloud tag-cloud--tight">
                    {history.map((item) => (
                      <button
                        key={`h-${item}`}
                        type="button"
                        className="chip chip--xs"
                        onClick={() => {
                          setOpen(false);
                          submitSearch(item);
                        }}
                      >
                        <Clock3 size={11} aria-hidden="true" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="searchbox__block">
                <div className="searchbox__label">大家在搜</div>
                <div className="tag-cloud tag-cloud--tight">
                  {HOT_SEARCHES.slice(0, 5).map((item, index) => (
                    <button
                      key={`hot-${item}`}
                      type="button"
                      className="chip chip--xs"
                      onClick={() => {
                        setOpen(false);
                        submitSearch(item);
                      }}
                    >
                      <span className="hot-index">{String(index + 1).padStart(2, "0")}</span>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <p className="searchbox__hint">
                按 <kbd>/</kbd> 或 <kbd>Ctrl K</kbd> 随时开始搜索
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
