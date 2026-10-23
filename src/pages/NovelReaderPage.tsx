import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Headphones,
  Quote,
  Settings2,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { useToast } from "@/components/ui/Toast";
import { chaptersFor } from "@/data/chapters";
import { workBySlug } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, readLocal, useLocalStorage, writeLocal } from "@/lib/storage";
import type { NovelWork } from "@/types";

interface ReaderPrefs {
  fontSize: number;
  lineHeight: number;
  theme: "paper" | "sepia" | "dark";
}

interface ReaderNote {
  id: string;
  novelId: string;
  chapter: number;
  quote: string;
  note: string;
  createdAt: string;
}

export function NovelReaderPage() {
  const { slug, chapter } = useParams();
  const work = slug ? workBySlug.get(`novel/${slug}`) : undefined;
  useDocumentTitle(work ? `阅读《${work.title}》 · 灵作` : "阅读 · 灵作");
  if (!work || work.type !== "novel") return <NotFoundPage />;
  return <Reader work={work} chapterParam={chapter} />;
}

function Reader({ work, chapterParam }: { work: NovelWork; chapterParam?: string }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const chapters = chaptersFor(work.id);
  const chapterNumber = Number(chapterParam ?? 1);
  const valid = Number.isInteger(chapterNumber) && chapterNumber >= 1 && chapterNumber <= chapters.length;
  const current = valid ? chapters[chapterNumber - 1] : undefined;
  const [prefs, setPrefs] = useLocalStorage<ReaderPrefs>(LS_KEYS.readerPrefs, {
    fontSize: 19,
    lineHeight: 2,
    theme: "paper",
  });
  const [notes, setNotes] = useLocalStorage<ReaderNote[]>(LS_KEYS.readerNotes, []);
  const [shelf, setShelf] = useLocalStorage<string[]>(LS_KEYS.bookshelf, []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [ttsSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [percent, setPercent] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inShelf = shelf.includes(work.id);
  const chapterNotes = notes.filter((item) => item.novelId === work.id && item.chapter === chapterNumber);

  const saved = useMemo(
    () => readLocal<Record<string, { chapter: number; scroll: number }>>(LS_KEYS.readProgress, {})[work.id],
    [work.id],
  );

  // Restore scroll position for the chapter, or start at the top.
  useEffect(() => {
    if (!valid) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = saved?.chapter === chapterNumber ? saved.scroll : 0;
    const frame = window.requestAnimationFrame(() => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTop = Math.max(0, (target / 100) * max);
      setPercent(target);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chapterNumber, saved, valid]);

  // Track and persist reading progress.
  useEffect(() => {
    if (!valid) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const value = max > 0 ? Math.min(100, Math.max(0, (scroller.scrollTop / max) * 100)) : 0;
      setPercent(value);
      const map = readLocal<Record<string, { chapter: number; scroll: number }>>(LS_KEYS.readProgress, {});
      writeLocal(LS_KEYS.readProgress, {
        ...map,
        [work.id]: { chapter: chapterNumber, scroll: Math.round(value) },
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [chapterNumber, valid, work.id]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen && !notesOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setNotesOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen, notesOpen]);

  const goChapter = (next: number) => {
    if (next < 1 || next > chapters.length) return;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setSettingsOpen(false);
    setNotesOpen(false);
    navigate(`/novels/${work.slug}/read/${next}`);
  };

  const toggleTts = () => {
    if (!ttsSupported || !current) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${current.title}。${current.paragraphs.join("。")}`,
    );
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  if (!valid || !current) {
    return (
      <div className="reader-page reader-page--paper">
        <header className="reader-topbar">
          <Link to={`/novels/${work.slug}`} className="reader-back">
            <ArrowLeft size={18} />
            返回书籍
          </Link>
        </header>
        <div className="reader-fallback">
          <span className="reader-fallback__glyph">未</span>
          <h1>这一章还没写出来。</h1>
          <p>
            目前开放试读 {chapters.length} 章。你可以从第一章开始，或者回到书籍页看看目录。
          </p>
          <div>
            <Link className="btn btn--primary" to={`/novels/${work.slug}/read/1`}>
              从第一章开始
            </Link>
            <Link className="btn btn--outline" to={`/novels/${work.slug}`}>
              回到书籍页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`reader-page reader-page--${prefs.theme}`} style={{ "--reader-size": `${prefs.fontSize}px`, "--reader-leading": prefs.lineHeight } as CSSProperties}>
      <header className="reader-topbar">
        <Link to={`/novels/${work.slug}`} className="reader-back">
          <ArrowLeft size={18} />
          返回书籍
        </Link>
        <div className="reader-title">
          <span>{work.title}</span>
          <strong>
            第 {chapterNumber} 章 · {current.title}
          </strong>
        </div>
        <div className="reader-actions">
          <button type="button" className="reader-icon-btn" onClick={toggleTts} disabled={!ttsSupported} title={ttsSupported ? "朗读本章" : "当前浏览器不支持语音朗读"}>
            <Headphones size={18} />
          </button>
          <button type="button" className="reader-icon-btn" onClick={() => setNotesOpen(true)} title="划线想法">
            <Quote size={18} />
          </button>
          <button
            type="button"
            className={inShelf ? "reader-icon-btn is-active" : "reader-icon-btn"}
            onClick={() => {
              setShelf((prev) => (inShelf ? prev.filter((id) => id !== work.id) : [...prev, work.id]));
              toast({ title: inShelf ? "已移出书架" : "已加入书架", desc: inShelf ? "阅读进度会保留。" : "在「我的」里可以找到。" });
            }}
            title="加入书架"
            aria-pressed={inShelf}
          >
            {inShelf ? <Check size={18} /> : <Bookmark size={18} />}
          </button>
          <button type="button" className="reader-icon-btn" onClick={() => setSettingsOpen(true)} title="阅读设置">
            <Settings2 size={18} />
          </button>
        </div>
      </header>
      <div className="reader-progress" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className="reader-scroll" ref={scrollerRef}>
        <article className="reader-article">
          <div className="reader-chapter-head">
            <span className="eyebrow">CHAPTER {String(chapterNumber).padStart(2, "0")}</span>
            <h1>{current.title}</h1>
            <p>
              {work.title} · {work.meta.pov} · 约 {current.paragraphs.join("").length} 字
            </p>
          </div>
          {current.paragraphs.map((paragraph, index) => (
            <p key={`${chapterNumber}-${index}`}>{paragraph}</p>
          ))}
          <div className="reader-end">
            <span className="reader-end__line" />
            <p>本章完</p>
            <small>试读节选 · 完整章节以连载为准</small>
          </div>

          {chapterNotes.length ? (
            <div className="reader-inline-notes">
              <span className="eyebrow">划线想法 / MARGINALIA</span>
              {chapterNotes.map((item) => (
                <div key={item.id} className="reader-inline-note">
                  {item.quote ? <blockquote>「{item.quote}」</blockquote> : null}
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
          ) : null}

          <nav className="reader-chapter-nav" aria-label="章节导航">
            <button type="button" className="btn btn--outline" disabled={chapterNumber <= 1} onClick={() => goChapter(chapterNumber - 1)}>
              <ArrowLeft size={15} />
              上一章
            </button>
            <span>
              第 {chapterNumber} / {chapters.length} 章
            </span>
            <button type="button" className="btn btn--primary" disabled={chapterNumber >= chapters.length} onClick={() => goChapter(chapterNumber + 1)}>
              下一章
              <ArrowRight size={15} />
            </button>
          </nav>
        </article>
      </div>

      {settingsOpen ? (
        <div className="reader-panel-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}>
          <aside className="reader-panel" role="dialog" aria-modal="true" aria-label="阅读设置" onClick={(event) => event.stopPropagation()}>
            <div className="reader-panel__head">
              <div>
                <span className="eyebrow">READING / 设置</span>
                <h2>把字调到舒服</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSettingsOpen(false)} aria-label="关闭设置">
                <X size={18} />
              </button>
            </div>
            <div className="reader-setting">
              <span>
                <Type size={15} />
                字号
              </span>
              <div className="reader-setting__options">
                {[17, 19, 21, 23].map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={prefs.fontSize === size ? "is-active" : ""}
                    onClick={() => setPrefs((prev) => ({ ...prev, fontSize: size }))}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="reader-setting">
              <span>行高</span>
              <div className="reader-setting__options">
                {[1.8, 2, 2.2].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={prefs.lineHeight === value ? "is-active" : ""}
                    onClick={() => setPrefs((prev) => ({ ...prev, lineHeight: value }))}
                  >
                    {value.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="reader-setting">
              <span>主题</span>
              <div className="reader-theme-options">
                {[
                  { value: "paper" as const, label: "纸白" },
                  { value: "sepia" as const, label: "暖黄" },
                  { value: "dark" as const, label: "夜间" },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    className={`reader-theme reader-theme--${theme.value} ${prefs.theme === theme.value ? "is-active" : ""}`}
                    onClick={() => setPrefs((prev) => ({ ...prev, theme: theme.value }))}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="reader-panel__note">
              设置会保存在本地。朗读使用系统语音，不支持时会禁用。
            </p>
          </aside>
        </div>
      ) : null}

      {notesOpen ? (
        <div className="reader-panel-backdrop" role="presentation" onClick={() => setNotesOpen(false)}>
          <aside className="reader-panel" role="dialog" aria-modal="true" aria-label="划线想法" onClick={(event) => event.stopPropagation()}>
            <div className="reader-panel__head">
              <div>
                <span className="eyebrow">MARGINALIA / 划线想法</span>
                <h2>留下这一章的笔记</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setNotesOpen(false)} aria-label="关闭笔记">
                <X size={18} />
              </button>
            </div>
            <label className="reader-field">
              <span>摘录一句（可选）</span>
              <input
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                placeholder="比如：不用修得太好，能亮就行。"
                maxLength={120}
              />
            </label>
            <label className="reader-field">
              <span>你的想法</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="这一句让你想到什么？"
                rows={4}
                maxLength={300}
              />
            </label>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!note.trim()}
              onClick={() => {
                const entry: ReaderNote = {
                  id: `note-${Date.now()}`,
                  novelId: work.id,
                  chapter: chapterNumber,
                  quote: quote.trim(),
                  note: note.trim(),
                  createdAt: new Date().toISOString(),
                };
                setNotes((prev) => [...prev, entry]);
                setQuote("");
                setNote("");
                toast({ title: "划线想法已保存", desc: "会固定显示在这一章末尾，刷新后还在。", tone: "game" });
              }}
            >
              保存想法
            </button>

            {chapterNotes.length ? (
              <div className="reader-note-list">
                <span className="eyebrow">本章笔记 {chapterNotes.length}</span>
                {chapterNotes.map((item) => (
                  <div className="reader-note-item" key={item.id}>
                    {item.quote ? <blockquote>「{item.quote}」</blockquote> : null}
                    <p>{item.note}</p>
                    <button
                      type="button"
                      className="reader-note-delete"
                      onClick={() => setNotes((prev) => prev.filter((entry) => entry.id !== item.id))}
                      aria-label="删除笔记"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      <footer className="reader-bottombar">
        <div className="reader-bottombar__book">
          <span className="reader-bottombar__cover">
            <Cover cover={work.cover} />
          </span>
          <span>
            <strong>{work.title}</strong>
            <small>
              {prefs.fontSize}px · {Math.round(percent)}%
            </small>
          </span>
        </div>
        <div className="reader-bottombar__nav">
          <button type="button" disabled={chapterNumber <= 1} onClick={() => goChapter(chapterNumber - 1)} aria-label="上一章">
            <ArrowLeft size={16} />
          </button>
          <span>
            {chapterNumber} / {chapters.length}
          </span>
          <button type="button" disabled={chapterNumber >= chapters.length} onClick={() => goChapter(chapterNumber + 1)} aria-label="下一章">
            <ArrowRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
