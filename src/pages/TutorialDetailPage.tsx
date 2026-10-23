import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  GraduationCap,
  ListChecks,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { MediaImage, MediaVideo } from "@/components/media/MediaUpload";
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
import { PostCard } from "@/components/cards/PostCard";
import { useToast } from "@/components/ui/Toast";
import { commentsFor, posts, workBySlug, works } from "@/data/seed";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { getUserContent } from "@/lib/userContent";
import { LS_KEYS, useLocalStorage } from "@/lib/storage";
import { copyText } from "@/lib/utils";
import type { TutorialWork } from "@/types";

export function TutorialDetailPage() {
  const { slug } = useParams();
  const work = slug ? workBySlug.get(`tutorial/${slug}`) : undefined;
  useDocumentTitle(work ? `${work.title} · AI 教程 · 灵作` : "AI 教程 · 灵作");
  if (!work || work.type !== "tutorial") return <NotFoundPage />;
  return <TutorialDetail work={work} />;
}

function TutorialDetail({ work }: { work: TutorialWork }) {
  const { toast } = useToast();
  const [progress, setProgress] = useLocalStorage<Record<string, number[]>>(LS_KEYS.tutorialProgress, {});
  const done = progress[work.id] ?? [];
  const steps = work.meta.steps;
  const percent = steps.length ? Math.round((done.length / steps.length) * 100) : 0;
  const homework = posts.filter((post) => post.type === "交作业" && post.relatedWorkId === work.id);
  const content = getUserContent(work.id);
  const blocks = content?.blocks ?? [];
  const allPrompts = steps
    .filter((step) => step.prompt)
    .map((step, index) => `【第 ${index + 1} 步：${step.title}】\n${step.prompt}`)
    .join("\n\n");

  const toggleStep = (index: number) => {
    const isDone = done.includes(index);
    const next = isDone
      ? done.filter((item) => item !== index)
      : [...done, index].sort((a, b) => a - b);
    setProgress((prev) => ({ ...prev, [work.id]: next }));
    if (!isDone && next.length === steps.length) {
      toast({
        title: "全部步骤完成",
        desc: "现在可以把结果发出来，成为第一份作业。",
        tone: "game",
      });
    } else {
      toast({
        title: isDone ? "已取消完成" : `第 ${index + 1} 步完成`,
        desc: isDone ? "进度会重新计算。" : `还差 ${steps.length - next.length} 步。`,
      });
    }
  };

  return (
    <div className="detail-page tutorial-detail">
      <div className="container">
        <WorkBreadcrumb work={work} />
        <WorkHeader work={work} />

        <div className="detail-layout">
          <div className="detail-main">
            <section className="tutorial-hero">
              <div
                className="tutorial-hero__media"
                style={{ aspectRatio: work.cover.aspect ?? "16 / 10" }}
              >
                <Cover cover={work.cover} />
                <span className="tutorial-hero__output">
                  <Sparkles size={13} />
                  产出：{work.meta.output}
                </span>
              </div>
              <div className="tutorial-hero__copy">
                <span className="eyebrow">TUTORIAL / 结果演示</span>
                <h2>学完你会做出一件能发出来的东西</h2>
                <p>{work.hook}</p>
                <div className="tutorial-hero__meta">
                  <span>{work.meta.difficulty}</span>
                  <span>{work.meta.minutes} 分钟</span>
                  <span>{steps.length} 个步骤</span>
                  <span>{work.tools.join(" / ")}</span>
                </div>
                <div className="tutorial-hero__actions">
                  <a className="btn btn--primary btn--lg" href="#steps">
                    <GraduationCap size={17} />
                    {done.length ? "继续学习" : "开始学习"}
                  </a>
                  <button
                    type="button"
                    className="btn btn--outline btn--lg"
                    disabled={!allPrompts}
                    onClick={async () => {
                      const ok = await copyText(allPrompts);
                      toast({
                        title: ok ? "素材包已复制" : "复制失败",
                        desc: ok ? `${steps.filter((step) => step.prompt).length} 条提示词模板都在剪贴板里。` : "可以逐个步骤复制。",
                        tone: ok ? "game" : "ink",
                      });
                    }}
                  >
                    <Download size={16} />
                    复制素材包
                  </button>
                </div>
                {steps.length ? (
                  <div className="tutorial-progress">
                    <div className="tutorial-progress__top">
                      <span>学习进度</span>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="tutorial-progress__bar">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <p>{done.length} / {steps.length} 步完成，进度会保存在本地。</p>
                  </div>
                ) : null}
              </div>
            </section>

            <ActionBar work={work} />

            <section className="detail-section" id="steps">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">STEPS / 步骤</span>
                  <h2>一步一步，直接交作业</h2>
                </div>
                <span className="mono-small">
                  <ListChecks size={13} /> 可勾选
                </span>
              </div>
              <div className="tutorial-steps">
                {steps.length ? steps.map((step, index) => {
                  const isDone = done.includes(index);
                  return (
                    <article key={step.title} className={`tutorial-step ${isDone ? "is-done" : ""}`}>
                      <div className="tutorial-step__side">
                        <span className="tutorial-step__num">{String(index + 1).padStart(2, "0")}</span>
                        <span className="tutorial-step__line" aria-hidden="true" />
                      </div>
                      <div className="tutorial-step__body">
                        <div className="tutorial-step__head">
                          <h3>{step.title}</h3>
                          <button
                            type="button"
                            className={`step-check ${isDone ? "is-done" : ""}`}
                            onClick={() => toggleStep(index)}
                            aria-pressed={isDone}
                          >
                            <Check size={13} />
                            {isDone ? "已完成" : "标记完成"}
                          </button>
                        </div>
                        <p>{step.body}</p>
                        {step.prompt ? (
                          <div className="prompt-block">
                            <div className="prompt-block__head">
                              <span>可复制提示词</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await copyText(step.prompt ?? "");
                                  toast({ title: ok ? "提示词已复制" : "复制失败", desc: "记得把「____」换成你的内容。" });
                                }}
                              >
                                <Copy size={13} />
                                复制
                              </button>
                            </div>
                            <pre>{step.prompt}</pre>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                }) : (
                  <p className="detail-empty-text">作者没有分步骤，直接看下面的过程与素材。</p>
                )}
              </div>
              {percent === 100 ? (
                <div className="tutorial-finish">
                  <Sparkles size={18} />
                  <div>
                    <strong>你走完了全部步骤。</strong>
                    <p>把结果整理成一条「交作业」动态，让作者看看它长成了什么。</p>
                  </div>
                  <Link className="btn btn--primary btn--sm" to={`/create/post?type=交作业&workId=${work.id}`}>
                    去交作业
                  </Link>
                </div>
              ) : null}
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">ASSETS / 素材包</span>
                  <h2>不需要从零开始</h2>
                </div>
                <span className="mono-small">复制即用</span>
              </div>
              <div className="asset-grid">
                <div className="asset-card">
                  <span className="asset-card__icon">
                    <Wrench size={18} />
                  </span>
                  <strong>工具清单</strong>
                  <p>{work.tools.join(" / ")}</p>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={async () => {
                      const ok = await copyText(work.tools.join(" / "));
                      toast({ title: ok ? "工具清单已复制" : "复制失败" });
                    }}
                  >
                    复制清单
                  </button>
                </div>
                <div className="asset-card">
                  <span className="asset-card__icon">
                    <Copy size={18} />
                  </span>
                  <strong>提示词模板</strong>
                  <p>{steps.filter((step) => step.prompt).length} 条，含占位符</p>
                  <button
                    type="button"
                    className="text-btn"
                    disabled={!allPrompts}
                    onClick={async () => {
                      const ok = await copyText(allPrompts);
                      toast({ title: ok ? "提示词已复制" : "复制失败" });
                    }}
                  >
                    复制全部
                  </button>
                </div>
                <div className="asset-card">
                  <span className="asset-card__icon">
                    <ListChecks size={18} />
                  </span>
                  <strong>交作业检查</strong>
                  <p>封面、配方、AI 声明、二创权限</p>
                  <Link className="text-btn" to={`/create/post?type=交作业&workId=${work.id}`}>
                    去检查
                  </Link>
                </div>
              </div>
            </section>

            {blocks.length ? (
              <section className="detail-section">
                <div className="detail-section__head">
                  <div>
                    <span className="eyebrow">PROCESS / 过程与素材</span>
                    <h2>作者留下的图、视频和踩坑记录</h2>
                  </div>
                  <span className="mono-small">{blocks.length} 块内容</span>
                </div>
                <div className="tutorial-blocks">
                  {blocks.map((block) => {
                    if (block.type === "text") {
                      return <p key={block.id}>{block.text?.trim() || "这一块还没有写内容。"}</p>;
                    }
                    if (block.type === "image") {
                      return <MediaImage key={block.id} id={block.mediaId} caption={block.caption} alt={block.caption || work.title} />;
                    }
                    return <MediaVideo key={block.id} id={block.mediaId} caption={block.caption} />;
                  })}
                </div>
              </section>
            ) : null}

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">BEFORE / AFTER / 前后对比</span>
                  <h2>你会改掉的一个习惯</h2>
                </div>
                <span className="mono-small">不是更多，是更准</span>
              </div>
              <div className="before-after">
                <div className="before-after__before">
                  <span>BEFORE</span>
                  <strong>把提示词写成说明书</strong>
                  <p>一次写十行，什么都想要。画面看起来很满，但没有一个地方让人停下来。</p>
                </div>
                <div className="before-after__after">
                  <span>AFTER</span>
                  <strong>先定光，再定人，最后定一口气</strong>
                  <p>只保留三个能看见的东西。画面变空了，但那一口气留下来了。</p>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section__head">
                <div>
                  <span className="eyebrow">HOMEWORK / 交作业</span>
                  <h2>看看别人做成了什么</h2>
                </div>
                <span className="mono-small">{homework.length} 份作业</span>
              </div>
              {homework.length ? (
                <div className="homework-grid">
                  {homework.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="detail-empty-box">
                  <p>还没有人交作业。你可以是这个教程的第一份作业。</p>
                  <Link className="btn btn--outline btn--sm" to={`/create/post?type=交作业&workId=${work.id}`}>
                    交第一份作业
                  </Link>
                </div>
              )}
            </section>

            <RecipePanel work={work} />
            <RemixTree work={work} />
            <CommentThread
              targetId={work.id}
              authorHandle={work.authorHandle}
              seedComments={commentsFor(work.id)}
              heading="学习中的问题"
              placeholder="卡在哪一步了？或者，你做出了什么不一样的结果？"
            />
          </div>
          <DetailAside work={work} />
        </div>

        <RelatedWorks work={work} works={works.filter((item) => item.type === "tutorial")} title="学完这个，再学一手" />
        <div className="detail-more">
          <span className="eyebrow">NEXT / 继续学</span>
          <div className="detail-more__author">
            <span>{work.meta.difficulty}</span>
            <span>{work.meta.minutes} 分钟</span>
            <span>{steps.length} 个步骤</span>
            <Link className="arrow-link" to="/tutorials">
              全部教程
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
