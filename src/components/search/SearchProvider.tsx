import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { addSearchHistory } from "@/lib/searchHistory";

interface SearchContextValue {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  submitSearch: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch(): SearchContextValue {
  const value = useContext(SearchContext);
  if (!value) throw new Error("useSearch must be used inside SearchProvider");
  return value;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  const submitSearch = useCallback(
    (query: string) => {
      const term = query.trim();
      if (!term) return;
      addSearchHistory(term);
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(term)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      const isShortcut =
        (event.key === "/" && !isEditable(event.target)) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");
      if (!isShortcut) return;
      const input = document.querySelector<HTMLInputElement>("[data-global-search]");
      if (input && input.offsetParent !== null && !open) {
        event.preventDefault();
        input.focus();
        input.select();
        return;
      }
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const value = useMemo(
    () => ({ open, openSearch, closeSearch, submitSearch }),
    [open, openSearch, closeSearch, submitSearch],
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchOverlay />
    </SearchContext.Provider>
  );
}
