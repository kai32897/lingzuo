import { useMemo, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  AuthorLine,
  EmptyState,
  SectionHead,
  TypeSticker,
} from "@/components/ui/primitives";
import { Cover } from "@/components/work/Cover";
import { WorkCard } from "@/components/work/WorkCard";
import { useToast } from "@/components/ui/Toast";
import { WORK_TYPE_CONFIG, SORT_OPTIONS } from "@/data/config";
import { works } from "@/data/seed";import type { ContentType, Work } from "@/types";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn, formatCount, unique } from "@/lib/utils";
import { metaLine, workLink } from "@/lib/work";

const HERO_COPY: Record<ContentType, { title: string; desc: string; glyph: string }> = {
  game: {
    title: "AI 游戏",
    desc: "不用下载，点开就玩。试玩、拆配方、看开发日志，玩完还能做个同款。",
    glyph: "玩",
  },
  drama: {
    title: "AI 短剧",
    desc: "一集三分钟，刷完还想追。竖屏连刷，时间点评论，幕后配方就藏在下一集后面。",
    glyph: "看",
  },
  novel: {
    title: "AI 小说",
    desc: "先读三行，再决定要不要熬夜。阅读器里能调字号、换主题，也能留下划线想法。",
    glyph: "读",
  },
  tutorial: {
    title: "AI 教程",
    desc: "不聊概念，直接交作业。每一步都能勾选，提示词都能复制，做完就能发。",
    glyph: "学",
  },
};

const RANKING_TITLE: Record<ContentType, string> = {
  game: "本周最上头",
  drama: "本周追更榜",
  novel: "本周在读",
  tutorial: "学得最快",
};

const LEARNING_PATHS = [
  {
    title: "第一次做短片",
    desc: "从三句话分镜，到一条能发出去的 30 秒。",
    steps: ["写三句话分镜", "选一束光", "剪出呼吸"],
    href: "/tutorials/3-tishi-dianying-duanpian",
    color: "#FFC24B",
  },
  {
    title: "第一次做游戏",
    desc: "不用会编程，做出一个能点的分支故事。",
    steps: ["先写三个结局", "压成两个按钮", "生成网页"],
    href: "/tutorials/ling-daima-fenzhi-xushi",
    color: "#D8FF3E",
  },
  {
    title: "第一次做有声书",
    desc: "选三个声音，把一章小说变成 6 分钟。",
    steps: ["选声音", "标停顿", "铺环境音"],
    href: "/tutorials/xiaoshuo-bian-youshengju",
    color: "#B9A6FF",
  },
];

function genreValues(work: Work): string[] {
  switch (work.type) {
    case "game":
    case "drama":
    case "novel":
      return work.meta.genres;
    case "tutorial":
      return work.tools;
  }
}

function levelValues(work: Work): string[] {
  switch (work.type) {
    case "game":
    case "tutorial":
      return [work.meta.difficulty];
    case "drama":
    case "novel":
      return [work.meta.status];
  }
}

function extraValues(work: Work): string[] {
  switch (work.type) {
    case "game":
      return [work.meta.engine];
    case "drama": {
      const avg = work.meta.episodes.reduce((sum, episode) => sum + episode.seconds, 0) / work.meta.episodes.length;
      return [avg <= 150 ? "≤ 2.5 分钟" : "> 2.5 分钟"];
    }
    case "novel":
      return [work.meta.pov];
    case "tutorial":
      return [work.meta.output];
  }
}

function lengthMatch(work: Work, value: string): boolean {
  if (!value) return true;
  switch (work.type) {
    case "game":
      if (value === "short") return work.meta.minutes <= 8;
      if (value === "mid") return work.meta.minutes > 8 && work.meta.minutes <= 12;
      return work.meta.minutes > 12;
    case "drama":
      if (value === "short") return work.meta.episodes.length <= 4;
      return work.meta.episodes.length > 4;
    case "novel":
      if (value === "short") return work.meta.words < 100000;
      return work.meta.words >= 100000;
    case "tutorial":
      if (value === "short") return work.meta.minutes <= 30;
      return work.meta.minutes > 30;
  }
}

function hotValue(work: Work): number {
  return work.stats.likes + work.stats.views * 0.03 + work.stats.comments * 2;
}

function sortWorks(list: Work[], sort: string): Work[] {
  const copy = [...list];
  if (sort === "hot") return copy.sort((a, b) => hotValue(b) - hotValue(a));
  if (sort === "fast") {
    return copy.sort((a, b) => {
      const av = a.type === "game" ? a.meta.minutes : 999;
      const bv = b.type === "game" ? b.meta.minutes : 999;
      return av - bv;
    });
  }
  if (sort === "follow") {
    return copy.sort((a, b) => {
      const av = a.type === "drama" && a.meta.status === "连载中" ? 0 : 1;
      const bv = b.type === "drama" && b.meta.status === "连载中" ? 0 : 1;
      return av - bv || hotValue(b) - hotValue(a);
    });
  }
  if (sort === "finished") {
    return copy.sort((a, b) => {
      const av = a.type === "novel" && a.meta.status === "已完结" ? 0 : 1;
      const bv = b.type === "novel" && b.meta.status === "已完结" ? 0 : 1;
      return av - bv || hotValue(b) - hotValue(a);
    });
  }
  if (sort === "short") {
    return copy.sort((a, b) => {
      const av = a.type === "tutorial" ? a.meta.minutes : 999;
      const bv = b.type === "tutorial" ? b.meta.minutes : 999;
      return av - bv;
    });
  }
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function NovelRow({ work }: { work: Extract<Work, { type: "novel" }> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="novel-row">
      <Link className="novel-row__cover" to={workLink(work)} aria-label={work.title}>
        <Cover cover={work.cover} />
      </Link>
      <div className="novel-row__body">
        <div className="novel-row__top">
          <TypeSticker type="novel" />
          <span>{metaLine(work)}</span>
        </div>
        <h3>
          <Link to={workLink(work)}>{work.title}</Link>
        </h3>
        <p className="novel-row__summary">{work.summary}</p>
        <blockquote className="novel-row__excerpt">{work.meta.excerpt}</blockquote>
        {expanded ? (
          <div className="novel-preview">
            <p>{work.meta.excerpt}</p>
            <p>{work.summary}</p>
            <p className="novel-preview__end">
              （试读到此结束。完整章节在阅读器里，可以调字号、换主题，也能留下划线想法。）
            </p>
          </div>
        ) : null}
        <div className="novel-row__foot">
          <AuthorLine handle={work.authorHandle} size="xs" />
          <div className="novel-row__actions">
            <button
              type="button"
              className="text-btn text-btn--underline"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "收起试读" : "就地试读"}
            </button>
            <Link className="btn btn--outline btn--sm" to={workLink(work)}>
              读两页
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function TutorialRow({ work }: { work: Extract<Work, { type: "tutorial" }> }) {
  return (
    <article className="tutorial-row">
      <Link className="tutorial-row__cover" to={workLink(work)} aria-label={work.title}>
        <Cover cover={work.cover} />
      </Link>
      <div className="tutorial-row__body">
        <div className="tutorial-row__top">
          <TypeSticker type="tutorial" />
          <span>
            {work.meta.difficulty} · {work.meta.minutes} 分钟
          </span>
        </div>
        <h3>
          <Link to={workLink(work)}>{work.title}</Link>
        </h3>
        <p>{work.summary}</p>
        <div className="tutorial-row__meta">
          <span>产出：{work.meta.output}</span>
          <span>{work.meta.steps.length} 个步骤</span>
          <span className="tutorial-row__tools">{work.tools.join(" / ")}</span>
        </div>
      </div>
      <div className="tutorial-row__action">
        <span className="tutorial-row__steps">{work.meta.steps.length} 步</span>
        <Link className="btn btn--primary btn--sm" to={workLink(work)}>
          学一手
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function CategoryPage({ type }: { type: ContentType }) {
  const config = WORK_TYPE_CONFIG[type];
  const copy = HERO_COPY[type];
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [followed, setFollowed] = useLocalStorage<string[]>(LS_KEYS.followedCategories, []);
  const [moreOpen, setMoreOpen] = useState(false);

  const genre = params.get("genre") ?? "";
  const level = params.get("level") ?? "";
  const length = params.get("length") ?? "";
  const extra = params.get("extra") ?? "";
  const rawSort = params.get("sort") ?? "latest";
  const validSorts = (SORT_OPTIONS as Record<string, readonly { value: string; label: string }[]>)[type] ?? SORT_OPTIONS.all;
  const sort = validSorts.some((option) => option.value === rawSort) ? rawSort : "latest";

  useDocumentTitle(`${config.label} · 灵作`);

  const all = useMemo(() => works.filter((work) => work.type === type), [type]);
  const weeklyNew = all.filter(
    (work) => Date.now() - new Date(work.createdAt).getTime() < 7 * 86400000,
  ).length;
  const picks = all.filter((work) => work.editorsPick).slice(0, 3);
  const isFollowing = followed.includes(type);

  const genreOptions = useMemo(() => unique(all.flatMap(genreValues)), [all]);
  const levelOptions = useMemo(() => unique(all.flatMap(levelValues)), [all]);
  const extraOptions = useMemo(() => unique(all.flatMap(extraValues)), [all]);

  const lengthOptions = useMemo(() => {
    switch (type) {
      case "game":
        return [
          { value: "short", label: "8 分钟以内" },
          { value: "mid", label: "8–12 分钟" },
          { value: "long", label: "12 分钟以上" },
        ];
      case "drama":
        return [
          { value: "short", label: "4 集以内" },
          { value: "long", label: "5 集以上" },
        ];
      case "novel":
        return [
          { value: "short", label: "10 万字以内" },
          { value: "long", label: "10 万字以上" },
        ];
      case "tutorial":
        return [
          { value: "short", label: "30 分钟以内" },
          { value: "long", label: "30 分钟以上" },
        ];
    }
  }, [type]);

  const filtersActive = Boolean(genre || level || length || extra);

  const filtered = useMemo(() => {
    const list = all.filter((work) => {
      if (genre && !genreValues(work).includes(genre)) return false;
      if (level && !levelValues(work).includes(level)) return false;
      if (length && !lengthMatch(work, length)) return false;
      if (extra && !extraValues(work).includes(extra)) return false;
      return true;
    });
    return sortWorks(list, sort);
  }, [all, genre, level, length, extra, sort]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: false });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (sort !== "latest") next.set("sort", sort);
    setParams(next, { replace: false });
  };

  const extraLabel =
    type === "game" ? "引擎" : type === "drama" ? "单集时长" : type === "novel" ? "视角" : "产出";
  const levelLabel =
    type === "game" || type === "tutorial" ? "难度" : "状态";

  const activeFilterCount = [genre, level, length, extra].filter(Boolean).length;

  const follow = () => {
    setFollowed((prev) =>
      isFollowing ? prev.filter((item) => item !== type) : [...prev, type],
    );
    toast({
      title: isFollowing ? `已取消关注 ${config.label}` : `关注了 ${config.label}`,
      desc: isFollowing
        ? "分类页还是可以正常逛，只是新作不会再优先提醒。"
        : "有新作品时，会在你的首页里优先出现。",
      tone: isFollowing ? "ink" : "game",
    });
  };

  const heroCovers = [...all]
    .sort((a, b) => hotValue(b) - hotValue(a))
    .slice(0, 3);

  return (
    <div className={cn("category-page", `category-page--${type}`)} style={{ "--cat": config.color } as CSSProperties}>
      <section className="category-hero">
        <div className="container category-hero__grid">
          <div className="category-hero__copy">
            <div className="category-hero__eyebrow">
              <span className="eyebrow">
                {config.code} / {String(all.length).padStart(2, "0")} WORKS
              </span>
              <span className="category-hero__dot" aria-hidden="true" />
              <span className="category-hero__weekly">本周新增 {weeklyNew} 件</span>
            </div>
            <h1>
              <span className="category-hero__crumb">{config.code}</span>
              {copy.title}
            </h1>
            <p className="category-hero__desc">{copy.desc}</p>
            <div className="category-hero__meta">
              <span>{all.length} 件作品</span>
              <span>{formatCount(all.reduce((sum, work) => sum + work.stats.likes, 0))} 次喜欢</span>
              <span>每件都带配方</span>
            </div>
            <div className="category-hero__actions">
              <button
                type="button"
                className={cn("btn btn--sm", isFollowing ? "btn--outline" : "btn--primary")}
                aria-pressed={isFollowing}
                onClick={follow}
              >
                {isFollowing ? <Check size={14} /> : <Plus size={14} />}
                {isFollowing ? "已关注分类" : "关注分类"}
              </button>
              {type === "drama" ? (
                <Link className="btn btn--outline btn--sm" to="/dramas/ai-tongshi-cizhi/watch">
                  <ArrowRight size={14} />
                  进入刷剧
                </Link>
              ) : type === "novel" ? (
                <Link className="btn btn--outline btn--sm" to="/novels/yueliang-weixiuzhan">
                  找一本开始读
                  <ArrowRight size={14} />
                </Link>
              ) : type === "tutorial" ? (
                <a className="btn btn--outline btn--sm" href="#paths">
                  看学习路径
                  <ArrowRight size={14} />
                </a>
              ) : (
                <Link className="btn btn--outline btn--sm" to="/games/bianlidian-yeban">
                  随便玩一个
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          <div className="category-hero__art" aria-hidden="true">
            <span className="category-hero__ghost">{copy.glyph}</span>
            {heroCovers.map((work, index) => (
              <span key={work.id} className={`category-hero__cover category-hero__cover--${index}`}>
                <Cover cover={work.cover} />
              </span>
            ))}
            <span className="category-hero__sticker">
              <Sparkles size={13} />
              编辑精选 {picks.length} 件
            </span>
          </div>
        </div>
      </section>

      <section className="container picks-section">
        <SectionHead
          title="编辑精选"
          desc={`本周编辑部想先给你看的 ${picks.length} 件。`}
          action={<span className="mono-small">每周三更新 / PICKED BY EDITORS</span>}
        />
        <div className="picks">
          {picks.map((work, index) => (
            <WorkCard
              key={work.id}
              work={work}
              compact
              ratio={index === 0 ? "wide" : "square"}
              className={index === 0 ? "picks__lead" : undefined}
            />
          ))}
        </div>
      </section>

      {type === "tutorial" ? (
        <section className="container paths-section" id="paths">
          <SectionHead
            title="学习路径"
            desc="不知道从哪开始？挑一条三步路径，跟着做完。"
            action={<span className="mono-small">3 条路径 / 9 步</span>}
          />
          <div className="paths">
            {LEARNING_PATHS.map((path) => (
              <Link key={path.title} className="path-card" to={path.href} style={{ "--path-color": path.color } as React.CSSProperties}>
                <span className="path-card__top">
                  <span className="path-card__num">{String(LEARNING_PATHS.indexOf(path) + 1).padStart(2, "0")}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </span>
                <h3>{path.title}</h3>
                <p>{path.desc}</p>
                <ol className="path-card__steps">
                  {path.steps.map((step, index) => (
                    <li key={step}>
                      <span>{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="filter-bar">
        <div className="container filter-bar__inner">
          <div className="filter-group filter-group--main">
            <span className="filter-group__label">{type === "tutorial" ? "工具" : "题材"}</span>
            <div className="filter-chips">
              <button
                type="button"
                className={cn("chip chip--sm", !genre && "is-active")}
                aria-pressed={!genre}
                onClick={() => updateParam("genre", "")}
              >
                全部
              </button>
              {genreOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn("chip chip--sm", genre === option && "is-active")}
                  aria-pressed={genre === option}
                  onClick={() => updateParam("genre", genre === option ? "" : option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-bar__right">
            <button
              type="button"
              className={cn("filter-more-btn", moreOpen && "is-open")}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((value) => !value)}
            >
              更多筛选
              {activeFilterCount ? <span className="filter-count">{activeFilterCount}</span> : null}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            <div className="sort-group" role="group" aria-label="排序方式">
              {validSorts.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn("sort-btn", sort === option.value && "is-active")}
                  aria-pressed={sort === option.value}
                  onClick={() => updateParam("sort", option.value === "latest" ? "" : option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {moreOpen ? (
          <div className="container filter-more">
            <div className="filter-group">
              <span className="filter-group__label">{levelLabel}</span>
              <div className="filter-chips">
                <button
                  type="button"
                  className={cn("chip chip--xs", !level && "is-active")}
                  aria-pressed={!level}
                  onClick={() => updateParam("level", "")}
                >
                  全部
                </button>
                {levelOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn("chip chip--xs", level === option && "is-active")}
                    aria-pressed={level === option}
                    onClick={() => updateParam("level", level === option ? "" : option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-group__label">
                {type === "game" ? "时长" : type === "drama" ? "集数" : type === "novel" ? "篇幅" : "耗时"}
              </span>
              <div className="filter-chips">
                <button
                  type="button"
                  className={cn("chip chip--xs", !length && "is-active")}
                  aria-pressed={!length}
                  onClick={() => updateParam("length", "")}
                >
                  全部
                </button>
                {lengthOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn("chip chip--xs", length === option.value && "is-active")}
                    aria-pressed={length === option.value}
                    onClick={() => updateParam("length", length === option.value ? "" : option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-group__label">{extraLabel}</span>
              <div className="filter-chips">
                <button
                  type="button"
                  className={cn("chip chip--xs", !extra && "is-active")}
                  aria-pressed={!extra}
                  onClick={() => updateParam("extra", "")}
                >
                  全部
                </button>
                {extraOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn("chip chip--xs", extra === option && "is-active")}
                    aria-pressed={extra === option}
                    onClick={() => updateParam("extra", extra === option ? "" : option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {filtersActive ? (
              <button type="button" className="text-btn filter-clear" onClick={clearFilters}>
                <X size={13} />
                清除筛选
              </button>
            ) : (
              <span className="filter-more__hint">筛选只在当前分类里缩小范围，不是全站搜索。</span>
            )}
          </div>
        ) : null}
      </div>

      <section className="container category-feed">
        <div className="category-feed__head">
          <div>
            <span className="eyebrow">BROWSE / {config.code}</span>
            <h2>
              {filtersActive ? "筛选结果" : type === "drama" ? "全部短剧" : type === "novel" ? "全部小说" : type === "tutorial" ? "全部教程" : "全部游戏"}
              <span className="category-feed__count">{filtered.length}</span>
            </h2>
          </div>
          <span className="mono-small">按「{validSorts.find((option) => option.value === sort)?.label ?? "最新"}」排序</span>
        </div>

        {filtered.length ? (
          type === "game" ? (
            <div className="game-grid">
              {filtered.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          ) : type === "drama" ? (
            <div className="drama-grid">
              {filtered.map((work) => (
                <WorkCard key={work.id} work={work} ratio="type" />
              ))}
            </div>
          ) : type === "novel" ? (
            <div className="novel-list">
              {filtered.map((work) =>
                work.type === "novel" ? <NovelRow key={work.id} work={work} /> : null,
              )}
            </div>
          ) : (
            <div className="tutorial-list">
              {filtered.map((work) =>
                work.type === "tutorial" ? <TutorialRow key={work.id} work={work} /> : null,
              )}
            </div>
          )
        ) : (
          <EmptyState
            glyph="筛"
            title="这个筛选组合下暂时没有作品"
            desc="把条件放宽一点，或者清除筛选看看全部。"
            actions={
              <button type="button" className="btn btn--primary" onClick={clearFilters}>
                清除筛选
              </button>
            }
          />
        )}
      </section>

      <section className="section category-ranking">
        <div className="container">
          <SectionHead
            num="—"
            title={RANKING_TITLE[type]}
            desc="按有效喜欢、评论和完成度综合排序，不只看播放量。"
            action={<span className="mono-small">每小时更新</span>}
          />
          <div className="ranking">
            <div className="ranking-list">
              {[...all]
                .sort((a, b) => hotValue(b) - hotValue(a))
                .slice(0, 3)
                .map((work, index) => (
                  <Link key={work.id} className="ranking-row" to={workLink(work)}>
                    <span className="ranking-row__num">{String(index + 1).padStart(2, "0")}</span>
                    <span className="ranking-row__cover">
                      <Cover cover={work.cover} />
                    </span>
                    <span className="ranking-row__copy">
                      <strong>{work.title}</strong>
                      <small>{metaLine(work)}</small>
                    </span>
                    <span className="ranking-row__author">
                      <AuthorLine handle={work.authorHandle} size="xs" link={false} />
                    </span>
                    <span className="ranking-row__stat">{formatCount(work.stats.likes)} 喜欢</span>
                    <ArrowUpRight size={16} className="ranking-row__arrow" aria-hidden="true" />
                  </Link>
                ))}
            </div>
            <aside className="ranking-note">
              <Clock3 size={15} />
              <p>
                榜单只看真实互动：喜欢、收藏、完整体验和评论。
                新作品有 7 天保护期，不会被老作品一直压着。
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
