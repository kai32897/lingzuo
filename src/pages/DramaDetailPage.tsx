import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Maximize2,
  Pause,
  Play,
  Plus,
  VolumeX,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import {
  ActionBar,
  CommentThread,
  DetailAside,
  RecipePanel,
  RelatedWorks,
  RemixTree,
  WorkBreadcrumb,
  WorkHeader,
} from "@/components/detail/parts";
import { TypeSticker } from "@/components/ui/primitives";
import { commentsFor, workBySlug, works } from "@/data/seed";
import { dramaScripts } from "@/data/dramaScripts";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useToast } from "@/components/ui/Toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { LS_KEYS, readLocal, useLocalStorage, writeLocal } from "@/lib/storage";
import { formatCount, timeAgo } from "@/lib/utils";
import { useMediaUrl } from "@/lib/media";
import { workLink } from "@/lib/work";
import type { DramaWork } from "@/types";

export function DramaDetailPage() {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`drama/${slug}`) : undefined;
  useDocumentTitle(work ? `${work.title} · AI 短剧 · 灵作` : "AI 短剧 · 灵作");
  if (!work || work.type !== "drama") return <NotFoundPage />;

  return <DramaDetail work={work} />;
}

function DramaDetail({ work }: { work: DramaWork }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [following, setFollowing] = useLocalStorage<string[]>(LS_KEYS.followingDramas, []);
  const isFollowing = following.includes(work.id);
  const savedProgress = useMemo(
    () => readLocal<Record<string, { episode: number; time: number }>>(LS_KEYS.watchProgress, {})[work.id],
    [work.id],
  );
  const [episodeIndex, setEpisodeIndex] = useState(savedProgress?.episode ?? 0);
  const [time, setTime] = useState(savedProgress?.time ?? 0);
  const [playing, setPlaying] = useState(false);
  const episode = work.meta.episodes[episodeIndex] ?? work.meta.episodes[0];
  const duration = episode.seconds;
  const videoUrl = useMediaUrl(episode.videoId);
  const coverUrl = useMediaUrl(work.cover.imageId);
  const [videoDuration, setVideoDuration] = useState(0);
  const effectiveDuration = videoUrl && videoDuration ? videoDuration : duration;
  const script = dramaScripts[work.id] ?? [];
  const line = [...script].reverse().find((item) => item.at <= time) ?? script[0];

  useEffect(() => {
    if (!playing || videoUrl) return;
    const timer = window.setInterval(() => {
      setTime((prev) => Math.min(duration, prev + 0.5));
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing, duration, videoUrl]);

  useEffect(() => {
    if (playing && !videoUrl && time >= duration) setPlaying(false);
  }, [playing, time, duration, videoUrl]);

  useEffect(() => {
    const map = readLocal<Record<string, { episode: number; time: number }>>(LS_KEYS.watchProgress, {});
    writeLocal(LS_KEYS.watchProgress, {
      ...map,
      [work.id]: { episode: episodeIndex, time: Math.round(time) },
    });
  }, [work.id, episodeIndex, time]);

  const selectEpisode = (index: number) => {
    setEpisodeIndex(index);
    setTime(0);
    setPlaying(false);
    setVideoDuration(0);
  };

  const nextEpisode = () => {
    if (episodeIndex < work.meta.episodes.length - 1) selectEpisode(episodeIndex + 1);
  };

  const percent = Math.min(100, (time / effectiveDuration) * 100);
  const sameUniverse = works.filter(
    (item) => item.id !== work.id && item.tags.some((tag) => work.tags.includes(tag)),
  );

  return (
    <div className="detail-page drama-detail">
      <div className="container">
        <WorkBreadcrumb work={work} />
        <WorkHeader work={work} />

        <div className="detail-layout">
          <div className="detail-main">
            <section className="drama-stage" aria-label="短剧播放器">
              <div className="drama-player">
                <div className="drama-player__screen">
                  {videoUrl ? (
                    <video
                      key={episode.n}
                      className="drama-video"
                      src={videoUrl}
                      poster={coverUrl}
                      controls
                      controlsList="nodownload nofullscreen"
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration || 0)}
                      onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                    />
                  ) : (
                    <>
                      <Cover cover={work.cover} />
                      <div className="drama-player__shade" />
                    </>
                  )}
                  {videoUrl ? (
                    <button
                      type="button"
                      className="drama-video-fullscreen"
                      onClick={() => navigate(`/dramas/${work.slug}/watch`)}
                      aria-label="全屏播放"
                      title="全屏播放"
                    >
                      <Maximize2 size={18} />
                    </button>
                  ) : null}
                  <div className="drama-player__top">
                    <TypeSticker type="drama" />
                    <span>
                      第 {episodeIndex + 1} 集 / 共 {work.meta.episodes.length} 集
                    </span>
                    <span className="drama-player__duration">
                      <Clock3 size={12} />
                      {Math.floor(effectiveDuration / 60)}:{String(Math.round(effectiveDuration) % 60).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="drama-player__caption" aria-live="polite">
                    {line ? (
                      <>
                        {line.speaker ? <span>{line.speaker}</span> : null}
                        <p>{line.text}</p>
                      </>
                    ) : null}
                  </div>

                  {!videoUrl && !playing ? (
                    <button
                      type="button"
                      className="drama-player__play"
                      onClick={() => setPlaying(true)}
                      aria-label="播放"
                    >
                      <Play size={26} fill="currentColor" />
                    </button>
                  ) : null}

                  {!videoUrl ? (
                    <div className="drama-player__controls">
                      <button
                        type="button"
                        className="player-btn"
                        onClick={() => setPlaying((value) => !value)}
                        aria-label={playing ? "暂停" : "播放"}
                      >
                        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                      </button>
                      <span className="player-time">
                        {formatTime(time)} / {formatTime(duration)}
                      </span>
                      <div className="player-progress">
                        <span style={{ width: `${percent}%` }} />
                        <input
                          type="range"
                          min={0}
                          max={duration}
                          step={1}
                          value={Math.round(time)}
                          aria-label="播放进度"
                          onChange={(event) => {
                            setTime(Number(event.target.value));
                            setPlaying(false);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="player-btn"
                        onClick={nextEpisode}
                        disabled={episodeIndex >= work.meta.episodes.length - 1}
                        aria-label="下一集"
                      >
                        <ArrowRight size={16} />
                      </button>
                      <span className="player-muted" title="演示版没有音轨">
                        <VolumeX size={15} />
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="drama-player__side">
                  <span className="drama-player__side-glyph" aria-hidden="true">
                    {work.cover.glyph}
                  </span>
                  <div className="drama-player__side-head">
                    <span className="eyebrow">EPISODES / 剧集</span>
                    <span>{work.meta.status}</span>
                  </div>
                  <div className="episode-list">
                    {work.meta.episodes.map((item, index) => (
                      <button
                        key={item.n}
                        type="button"
                        className={index === episodeIndex ? "episode is-active" : "episode"}
                        onClick={() => selectEpisode(index)}
                      >
                        <span className="episode__num">{String(item.n).padStart(2, "0")}</span>
                        <span className="episode__title">{item.title}</span>
                        <span className="episode__time">{formatTime(item.seconds)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="drama-player__progress-card">
                    <div className="drama-player__progress-top">
                      <span>追剧进度</span>
                      <strong>
                        {episodeIndex + 1} / {work.meta.episodes.length}
                      </strong>
                    </div>
                    <div className="drama-player__progress-bar">
                      <span
                        style={{
                          width: `${Math.min(100, ((episodeIndex + percent / 100) / work.meta.episodes.length) * 100)}%`,
                        }}
                      />
                    </div>
                    <p>已看 {Math.round(((episodeIndex + percent / 100) / work.meta.episodes.length) * 100)}% · 进度自动保存</p>
                  </div>
                  <p className="drama-player__demo-note">
                    {videoUrl
                      ? "作者上传的视频 · 字幕和时间点评论仍然可用。"
                      : "演示播放：封面 + 字幕 + 进度条，没有音轨，不自动播放声音。"}
                  </p>
                  <div className="drama-player__side-actions">
                    <button
                      type="button"
                      className={isFollowing ? "btn btn--outline btn--sm is-following" : "btn btn--primary btn--sm"}
                      aria-pressed={isFollowing}
                      onClick={() => {
                        setFollowing((prev) =>
                          isFollowing ? prev.filter((id) => id !== work.id) : [...prev, work.id],
                        );
                        toast({
                          title: isFollowing ? "已取消追剧" : "已加入追剧",
                          desc: isFollowing ? "进度还在，随时可以继续。" : "下次打开会记得你看到第几集。",
                          tone: isFollowing ? "ink" : "game",
                        });
                      }}
                    >
                      {isFollowing ? <Check size={14} /> : <Plus size={14} />}
                      {isFollowing ? "追剧中" : "追剧"}
                    </button>
                    {!videoUrl ? (
                      <Link className="btn btn--outline btn--sm" to={`/dramas/${work.slug}/watch`}>
                        <Maximize2 size={14} />
                        全屏播放
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="drama-stage__foot">
                <span>竖屏 9:16</span>
                <span>单集 {Math.round(duration / 60)} 分钟</span>
                <span>已看 {Math.round(((episodeIndex + percent / 100) / work.meta.episodes.length) * 100)}%</span>
              </div>
            </section>

            <ActionBar work={work} />

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">CHARACTERS / 角色</span>
                  <h2>这部剧里的人</h2>
                </div>
                <span className="mono-small">{work.meta.characters.length} 位</span>
              </div>
              <div className="character-grid">
                {work.meta.characters.map((character) => (
                  <article className="character-card" key={character.name}>
                    <span className="character-card__avatar">{character.name.slice(0, 1)}</span>
                    <div>
                      <strong>{character.name}</strong>
                      <span>{character.role}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">SAME MOOD / 相似气质</span>
                  <h2>同一个故事，换个方式看</h2>
                </div>
              </div>
              <div className="universe-row">
                {sameUniverse.slice(0, 4).map((item) => (
                  <Link key={item.id} className="universe-card" to={workLink(item)}>
                    <span className="universe-card__cover">
                      <Cover cover={item.cover} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.type === "novel" ? "小说" : item.type === "game" ? "游戏" : item.type === "drama" ? "短剧" : "教程"}</small>
                    </span>
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            </section>

            <RecipePanel work={work} />
            <RemixTree work={work} />
            <CommentThread
              targetId={work.id}
              authorHandle={work.authorHandle}
              seedComments={commentsFor(work.id)}
              heading="追剧的人在想什么"
              placeholder="这一集你最喜欢哪个镜头？或者，你猜阿智最后会留下吗？"
            />
          </div>
          <DetailAside work={work} />
        </div>

        <RelatedWorks work={work} works={works.filter((item) => item.type === "drama")} title="下一部看什么" />
        <div className="detail-more">
          <span className="eyebrow">ONGOING / 追更</span>
          <div className="detail-more__author">
            <span>{work.meta.episodes.length} 集 · {work.meta.status}</span>
            <span>{formatCount(work.stats.likes)} 喜欢</span>
            <span>更新于 {timeAgo(work.createdAt)}</span>
            <Link className="arrow-link" to="/dramas">
              全部短剧
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
