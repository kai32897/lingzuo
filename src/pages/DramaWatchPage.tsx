import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  Heart,
  MessageCircle,
  Pause,
  Play,
  ScrollText,
  VolumeX,
  X,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { TypeSticker } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { commentsFor, workBySlug } from "@/data/seed";
import { dramaScripts } from "@/data/dramaScripts";
import { recipeFor } from "@/data/recipes";
import { CURRENT_USER } from "@/data/config";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useMediaUrl } from "@/lib/media";
import { LS_KEYS, readLocal, useLocalStorage, writeLocal } from "@/lib/storage";
import { copyText } from "@/lib/utils";
import type { DramaWork } from "@/types";

interface LocalComment {
  id: string;
  targetId: string;
  authorHandle: string;
  content: string;
  createdAt: string;
  spoiler: boolean;
  likes: number;
}

export function DramaWatchPage() {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`drama/${slug}`) : undefined;
  useDocumentTitle(work ? `沉浸观看《${work.title}》 · 灵作` : "沉浸观看 · 灵作");
  if (!work || work.type !== "drama") return <NotFoundPage />;
  return <WatchFeed work={work} />;
}

function WatchFeed({ work }: { work: DramaWork }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const saved = useMemo(
    () => readLocal<Record<string, { episode: number; time: number }>>(LS_KEYS.watchProgress, {})[work.id],
    [work.id],
  );
  const [current, setCurrent] = useState(saved?.episode ?? 0);
  const [playing, setPlaying] = useState(true);
  const [times, setTimes] = useState<number[]>(() =>
    work.meta.episodes.map((_, index) => (index === (saved?.episode ?? 0) ? saved?.time ?? 0 : 0)),
  );
  const [sheet, setSheet] = useState<"recipe" | "comment" | null>(null);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useLocalStorage<string[]>(LS_KEYS.liked, []);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isLiked = liked.includes(work.id);
  const script = dramaScripts[work.id] ?? [];
  const currentEpisode = work.meta.episodes[current];
  const duration = currentEpisode?.seconds ?? 150;
  const currentHasVideo = Boolean(currentEpisode?.videoId);
  const time = Math.min(times[current] ?? 0, duration);

  useEffect(() => {
    const target = sectionRefs.current[saved?.episode ?? 0];
    if (target) {
      window.requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
    // Only restore once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing || currentHasVideo) return;
    const timer = window.setInterval(() => {
      setTimes((prev) =>
        prev.map((value, index) =>
          index === current ? Math.min(duration, value + 0.5) : value,
        ),
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing, current, duration, currentHasVideo]);

  useEffect(() => {
    if (playing && time >= duration) setPlaying(false);
  }, [playing, time, duration]);

  useEffect(() => {
    const map = readLocal<Record<string, { episode: number; time: number }>>(LS_KEYS.watchProgress, {});
    writeLocal(LS_KEYS.watchProgress, {
      ...map,
      [work.id]: { episode: current, time: Math.round(time) },
    });
  }, [work.id, current, time]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(index)) {
              setCurrent(index);
              if (work.meta.episodes[index]?.videoId) setPlaying(true);
            }
          }
        }
      },
      { threshold: 0.62 },
    );
    for (const element of sectionRefs.current) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  const goToEpisode = (index: number) => {
    if (index < 0 || index >= work.meta.episodes.length) return;
    setCurrent(index);
    setPlaying(true);
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const wheelLockRef = useRef(0);

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element) return;

    let wheelAccum = 0;
    const onWheel = (event: WheelEvent) => {
      if (sheet) return;
      event.preventDefault();
      const now = Date.now();
      if (now - wheelLockRef.current < 700) return;
      wheelAccum += event.deltaY;
      if (Math.abs(wheelAccum) < 26) return;
      wheelLockRef.current = now;
      const direction = wheelAccum > 0 ? 1 : -1;
      wheelAccum = 0;
      goToEpisode(current + direction);
    };

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (event: TouchEvent) => {
      if (sheet || event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      tracking = true;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const dy = event.touches[0].clientY - startY;
      const dx = event.touches[0].clientX - startX;
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        event.preventDefault();
      }
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dy) < 46) return;
      goToEpisode(current + (dy < 0 ? 1 : -1));
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
    };
  }, [current, sheet]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === " ") {
        event.preventDefault();
        setPlaying((value) => !value);
      }
      if (event.key === "ArrowRight") goToEpisode(current + 1);
      if (event.key === "ArrowLeft") goToEpisode(current - 1);
      if (event.key === "Escape") {
        if (sheet) setSheet(null);
        else navigate(`/dramas/${work.slug}`);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, navigate, sheet, work.slug]);

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    const existing = readLocal<LocalComment[]>(LS_KEYS.comments, []);
    const entry: LocalComment = {
      id: `uc-${Date.now()}`,
      targetId: work.id,
      authorHandle: CURRENT_USER.handle,
      content: `[${formatTime(time)}] ${text}`,
      createdAt: new Date().toISOString(),
      spoiler: false,
      likes: 0,
    };
    writeLocal(LS_KEYS.comments, [...existing, entry]);
    setComment("");
    setSheet(null);
    toast({ title: `已在 ${formatTime(time)} 记录`, desc: "这条时间点评论会出现在详情页讨论区。", tone: "game" });
  };

  const recipe = recipeFor(work.id);
  const commentCount = commentsFor(work.id).length + readLocal<LocalComment[]>(LS_KEYS.comments, []).filter((item) => item.targetId === work.id).length;

  return (
    <div className="watch-page" ref={scrollerRef}>
      <header className="watch-topbar">
        <Link to={`/dramas/${work.slug}`} className="watch-exit">
          <ArrowLeft size={18} />
          退出连刷
        </Link>
        <div className="watch-title">
          <strong>{work.title}</strong>
          <span>
            EP {String(current + 1).padStart(2, "0")} / {String(work.meta.episodes.length).padStart(2, "0")}
          </span>
        </div>
        <div className="watch-topbar__actions">
          <span className="watch-muted" title="演示版没有音轨">
            <VolumeX size={16} />
          </span>
          <button type="button" className="watch-topbtn" onClick={() => setSheet("recipe")}>
            <ScrollText size={16} />
            幕后配方
          </button>
        </div>
      </header>

      {work.meta.episodes.map((episode, index) => {
        const active = index === current;
        const epTime = Math.min(times[index] ?? 0, episode.seconds);
        const line = [...script].reverse().find((item) => item.at <= epTime) ?? script[0];
        return (
          <section
            key={episode.n}
            className="watch-episode"
            data-index={index}
            ref={(element) => {
              sectionRefs.current[index] = element;
            }}
            aria-label={`第 ${episode.n} 集 ${episode.title}`}
          >
            <div className="watch-backdrop" aria-hidden="true">
              <Cover cover={work.cover} />
              <span className="watch-backdrop__shade" />
            </div>
            <div className={episode.videoId ? "watch-phone watch-phone--video" : "watch-phone"}>
              {episode.videoId ? (
                <EpisodeVideo
                  episode={episode}
                  active={active}
                  playing={playing}
                  onTime={(value) => {
                    setTimes((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
                  }}
                  onPlayingChange={(value) => {
                    if (active) setPlaying(value);
                  }}
                />
              ) : (
                <>
                  <Cover cover={work.cover} />
                  <span className="watch-phone__shade" />
                </>
              )}
              <div className="watch-phone__top">
                <TypeSticker type="drama" />
                <span>第 {episode.n} 集 · {episode.title}</span>
                <span>{formatTime(episode.seconds)}</span>
              </div>

              {episode.videoId ? (
                <div className="watch-video-actions">
                  <button
                    type="button"
                    className="watch-ctrl"
                    onClick={() => {
                      setLiked((prev) => (isLiked ? prev.filter((id) => id !== work.id) : [...prev, work.id]));
                    }}
                    aria-label="喜欢"
                    aria-pressed={isLiked}
                  >
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                  <button type="button" className="watch-ctrl" onClick={() => setSheet("comment")} aria-label="在这集评论">
                    <MessageCircle size={16} />
                  </button>
                </div>
              ) : null}

              {!episode.videoId ? (
                <button
                  type="button"
                  className="watch-phone__tap"
                  aria-label={active && playing ? "暂停" : "播放"}
                  onClick={() => {
                    setCurrent(index);
                    setPlaying(!(active && playing));
                  }}
                />
              ) : null}

              {(!active || !playing) && !episode.videoId ? (
                <button
                  type="button"
                  className="watch-phone__play"
                  onClick={() => {
                    setCurrent(index);
                    setPlaying(true);
                  }}
                  aria-label="播放本集"
                >
                  <Play size={24} fill="currentColor" />
                </button>
              ) : null}

              <div className="watch-caption" aria-live={active ? "polite" : "off"}>
                {line ? (
                  <>
                    {line.speaker ? <span>{line.speaker}</span> : null}
                    <p>{line.text}</p>
                  </>
                ) : null}
              </div>

              {!episode.videoId ? (
                <div className="watch-controls">
                  <button
                    type="button"
                    className="watch-ctrl"
                    onClick={() => {
                      setCurrent(index);
                      setPlaying(!(active && playing));
                    }}
                    aria-label={active && playing ? "暂停" : "播放"}
                  >
                    {active && playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <span className="watch-time">
                    {formatTime(epTime)} / {formatTime(episode.seconds)}
                  </span>
                  <div className="watch-progress" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (epTime / episode.seconds) * 100)}%` }} />
                  </div>
                  <button
                    type="button"
                    className="watch-ctrl"
                    onClick={() => {
                      setLiked((prev) => (isLiked ? prev.filter((id) => id !== work.id) : [...prev, work.id]));
                    }}
                    aria-label="喜欢"
                    aria-pressed={isLiked}
                  >
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                  <button type="button" className="watch-ctrl" onClick={() => setSheet("comment")} aria-label="在这集评论">
                    <MessageCircle size={16} />
                  </button>
                </div>
              ) : null}

              {index < work.meta.episodes.length - 1 ? (
                <button type="button" className="watch-next" onClick={() => goToEpisode(index + 1)}>
                  下一集
                  <ChevronUp size={15} />
                </button>
              ) : (
                <Link className="watch-next" to={`/dramas/${work.slug}`}>
                  看完了，回到详情
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </section>
        );
      })}

      <div className="watch-hint">
        <ChevronUp size={14} />
        上下滑切集 · 空格暂停 · 左右切换 · Esc 退出
      </div>

      {sheet ? (
        <div className="watch-sheet-backdrop" role="presentation" onClick={() => setSheet(null)}>
          <div className="watch-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="watch-sheet__head">
              <div>
                <span className="eyebrow">{sheet === "recipe" ? "RECIPE / 幕后配方" : "COMMENT / 时间点评论"}</span>
                <h2>{sheet === "recipe" ? "这一集的配方" : `在 ${formatTime(time)} 说点什么`}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSheet(null)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>

            {sheet === "recipe" ? (
              <>
                <div className="watch-recipe">
                  <span className="mono-small">工具：{work.tools.join(" / ")}</span>
                  <pre>{recipe.prompt}</pre>
                </div>
                <div className="watch-sheet__actions">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={async () => {
                      const ok = await copyText(recipe.prompt);
                      toast({ title: ok ? "配方已复制" : "复制失败", desc: "也可以去详情页的配方区复制。" });
                    }}
                  >
                    复制提示词
                  </button>
                  <Link className="btn btn--primary btn--sm" to={`/dramas/${work.slug}#recipe`}>
                    看完整配方
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="watch-sheet__desc">
                  这条评论会自动带上当前时间 {formatTime(time)}，并出现在详情页讨论区。
                </p>
                <textarea
                  className="watch-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="这个镜头/这句台词，让你想到什么？"
                  rows={4}
                  maxLength={300}
                />
                <div className="watch-sheet__actions">
                  <span className="mono-small">{commentCount} 条相关讨论</span>
                  <button type="button" className="btn btn--primary btn--sm" disabled={!comment.trim()} onClick={submitComment}>
                    发布时间点评论
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EpisodeVideo({
  episode,
  active,
  playing,
  onTime,
  onPlayingChange,
}: {
  episode: DramaWork["meta"]["episodes"][number];
  active: boolean;
  playing: boolean;
  onTime: (value: number) => void;
  onPlayingChange: (value: boolean) => void;
}) {
  const url = useMediaUrl(episode.videoId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = videoRef.current;
    const background = bgRef.current;
    if (!element) return;
    if (active && playing) {
      void element.play().catch(() => undefined);
      void background?.play().catch(() => undefined);
    } else {
      element.pause();
      background?.pause();
    }
  }, [active, playing, url]);

  if (!url) return <div className="watch-video-loading">视频读取中…</div>;

  return (
    <div className="watch-video-shell">
      <video
        ref={bgRef}
        className="watch-video-bg"
        src={url}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
      />
      <video
        ref={videoRef}
        className="watch-phone__video"
        src={url}
        controls
        playsInline
        muted
        preload="metadata"
        onTimeUpdate={(event) => {
          onTime(event.currentTarget.currentTime);
          const background = bgRef.current;
          if (background && Math.abs(background.currentTime - event.currentTarget.currentTime) > 0.8) {
            background.currentTime = event.currentTarget.currentTime;
          }
        }}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        onEnded={() => onPlayingChange(false)}
      />
    </div>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
