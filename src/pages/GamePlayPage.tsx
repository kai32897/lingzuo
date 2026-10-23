import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  RotateCcw,
  Sparkles,
  VolumeX,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { TypeSticker } from "@/components/ui/primitives";
import { workBySlug } from "@/data/seed";
import { gameStories } from "@/data/gameStories";
import { getUserContent } from "@/lib/userContent";
import { useMediaText } from "@/lib/media";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function GamePlayPage() {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`game/${slug}`) : undefined;
  useDocumentTitle(work ? `试玩《${work.title}》 · 灵作` : "试玩 · 灵作");
  if (!work || work.type !== "game") return <NotFoundPage />;

  const story = gameStories[work.id];
  const content = getUserContent(work.id);
  const htmlId = content?.gameHtmlId;
  const demoUrl = content?.gameDemoUrl && /^https?:\/\//i.test(content.gameDemoUrl) ? content.gameDemoUrl : undefined;
  const generated = !htmlId && !demoUrl;
  const { text: html, loading: htmlLoading, error: htmlError } = useMediaText(htmlId);
  const stageRef = useRef<HTMLDivElement>(null);
  const [sceneId, setSceneId] = useState(story?.start ?? "");
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!generated) {
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setLoading(false), 780);
    return () => window.clearTimeout(timer);
  }, [generated]);

  const scene = story?.scenes[sceneId];

  const choose = (next: string) => {
    if (!story || !story.scenes[next]) return;
    setHistory((prev) => [...prev, sceneId]);
    setSceneId(next);
  };

  const restart = () => {
    if (!story) return;
    setSceneId(story.start);
    setHistory([]);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (loading || !scene?.choices) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < scene.choices.length) {
        choose(scene.choices[index].next);
      }
      if (event.key === "r" || event.key === "R") restart();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const requestFullscreen = () => {
    const element = stageRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen?.().catch(() => undefined);
    }
  };

  return (
    <div className="play-page">
      <div className="play-bg" aria-hidden="true">
        <Cover cover={work.cover} />
      </div>
      <header className="play-topbar">
        <Link className="play-exit" to={`/games/${work.slug}`}>
          <ArrowLeft size={18} />
          退出试玩
        </Link>
        <div className="play-title">
          <span className="eyebrow">PLAYABLE DEMO · {work.cover.code}</span>
          <strong>{work.title}</strong>
        </div>
        <div className="play-actions">
          {generated ? (
            <button type="button" className="play-icon-btn" onClick={restart} aria-label="重新开始">
              <RotateCcw size={17} />
            </button>
          ) : null}
          <button type="button" className="play-icon-btn" onClick={requestFullscreen} aria-label="全屏">
            <Maximize2 size={17} />
          </button>
        </div>
      </header>

      <div className="play-stage" ref={stageRef}>
        {htmlId ? (
          <div className="play-embed">
            {htmlLoading ? (
              <div className="play-loading">
                <p>正在读取作者上传的游戏…</p>
              </div>
            ) : htmlError || !html ? (
              <div className="play-loading">
                <p>这个 HTML 文件没有读出来。</p>
                <Link className="btn btn--outline btn--on-dark" to={`/games/${work.slug}`}>
                  回到详情
                </Link>
              </div>
            ) : (
              <>
                <iframe
                  title={`${work.title} 试玩`}
                  srcDoc={html}
                  sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock"
                  allow="fullscreen"
                />
                <p className="play-embed__note">作者上传的 HTML 在沙箱中运行，不能读取站点数据。</p>
              </>
            )}
          </div>
        ) : demoUrl ? (
          <div className="play-embed">
            <iframe
              title={`${work.title} 试玩`}
              src={demoUrl}
              sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock allow-same-origin"
              allow="fullscreen"
              referrerPolicy="no-referrer"
            />
            <p className="play-embed__note">
              外部试玩由作者提供。加载不出来时，可以
              <a href={demoUrl} target="_blank" rel="noopener noreferrer">在新标签打开</a>。
            </p>
          </div>
        ) : loading ? (
          <div className="play-loading">
            <span className="play-loading__glyph" aria-hidden="true">
              {work.cover.glyph}
            </span>
            <p>正在把机器打开…</p>
            <div className="play-loading__bar">
              <span />
            </div>
            <small>演示试玩 · 所有选择只保存在当前页面</small>
          </div>
        ) : story && scene ? (
          <div className="play-scene" key={scene.id}>
            <div className="play-scene__head">
              <span className="play-scene__step">
                第 {String(history.length + 1).padStart(2, "0")} 步
              </span>
              <span className="play-scene__title">{scene.title}</span>
              <span className="play-scene__meta">
                <VolumeX size={13} />
                演示无音轨
              </span>
            </div>
            <p className="play-scene__text">{scene.text}</p>

            {scene.choices?.length ? (
              <div className="play-choices">
                {scene.choices.map((choice, index) => (
                  <button
                    key={choice.next}
                    type="button"
                    className="play-choice"
                    onClick={() => choose(choice.next)}
                  >
                    <span className="play-choice__key">{index + 1}</span>
                    <span>{choice.label}</span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="play-ending">
                <span className="play-ending__label">
                  <Sparkles size={14} />
                  {scene.endingLabel ?? "结局"}
                </span>
                <p>你可以重开一次，看看另一个按钮后面发生了什么。</p>
                <div className="play-ending__actions">
                  <button type="button" className="btn btn--primary" onClick={restart}>
                    <RotateCcw size={15} />
                    再来一次
                  </button>
                  <Link className="btn btn--outline btn--on-dark" to={`/games/${work.slug}`}>
                    回到详情
                  </Link>
                </div>
              </div>
            )}

            <div className="play-progress">
              {[0, 1, 2, 3, 4, 5].map((dot) => (
                <span
                  key={dot}
                  className={dot <= history.length ? "is-filled" : undefined}
                  aria-hidden="true"
                />
              ))}
              <small>操作提示：按 1 / 2 选择，按 R 重开</small>
            </div>
          </div>
        ) : (
          <div className="play-loading">
            <p>这版试玩还在搭建中。</p>
            <Link className="btn btn--outline btn--on-dark" to={`/games/${work.slug}`}>
              回到详情
            </Link>
          </div>
        )}
      </div>

      <footer className="play-foot">
        <TypeSticker type="game" />
        <span>{work.tools.join(" / ")}</span>
        <Link to={`/games/${work.slug}`}>
          查看作品配方
          <ArrowRight size={13} />
        </Link>
      </footer>
    </div>
  );
}
