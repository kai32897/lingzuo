import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Heart, MessageCircle, Sparkles, X } from "lucide-react";
import { Cover } from "@/components/work/Cover";
import { AuthorLine, TypeSticker } from "@/components/ui/primitives";
import { WORK_TYPE_CONFIG } from "@/data/config";
import type { Work } from "@/types";
import { cn, formatCount } from "@/lib/utils";
import { metaLine, workLink } from "@/lib/work";

export function WorkCard({
  work,
  reason,
  onDismiss,
  compact = false,
  showSummary = true,
  ratio = "type",
  rank,
  className,
  priority = false,
}: {
  work: Work;
  reason?: string;
  onDismiss?: () => void;
  compact?: boolean;
  showSummary?: boolean;
  ratio?: "type" | "wide" | "square" | "tall";
  rank?: number;
  className?: string;
  priority?: boolean;
}) {
  const config = WORK_TYPE_CONFIG[work.type];
  const href = workLink(work);
  const ratioValue =
    work.cover.aspect ??
    (ratio === "wide" ? "16 / 10" : ratio === "square" ? "1 / 1" : ratio === "tall" ? "3 / 4" : config.type === "drama" ? "9 / 16" : config.type === "novel" ? "3 / 4" : "16 / 10");

  return (
    <article
      className={cn("work-card", compact && "work-card--compact", className)}
      style={{ "--cat": config.color } as CSSProperties}
    >
      <div className={cn("work-card__media", priority && "work-card__media--priority")} style={{ aspectRatio: ratioValue }}>
        <Link to={href} className="work-card__media-link" aria-label={`${work.title}，${config.action}`}>
          <Cover cover={work.cover} />
        </Link>
        <TypeSticker type={work.type} />
        {rank ? <span className="work-card__rank">{String(rank).padStart(2, "0")}</span> : null}
        {onDismiss ? (
          <button
            type="button"
            className="work-card__dismiss"
            onClick={onDismiss}
            aria-label={`不感兴趣：${work.title}`}
            title="不感兴趣"
          >
            <X size={13} />
          </button>
        ) : null}
        <span className="work-card__hover-action" aria-hidden="true">
          {config.action}
          <ArrowUpRight size={14} />
        </span>
      </div>

      <div className="work-card__body">
        <div className="work-card__meta-row">
          <span className="work-card__meta">{metaLine(work)}</span>
          {work.editorsPick ? <span className="pick-mark">编辑精选</span> : null}
        </div>
        <h3 className="work-card__title">
          <Link to={href}>{work.title}</Link>
        </h3>
        {showSummary ? <p className="work-card__summary">{work.summary}</p> : null}
        {reason ? (
          <p className="reason-chip">
            <Sparkles size={13} aria-hidden="true" />
            <span>{reason}</span>
          </p>
        ) : null}
        <div className="work-card__foot">
          <AuthorLine handle={work.authorHandle} size="xs" />
          <div className="work-card__stats">
            <span className="card-stat" aria-label={`喜欢 ${work.stats.likes}`}>
              <Heart size={12} aria-hidden="true" />
              {formatCount(work.stats.likes)}
            </span>
            <span className="card-stat" aria-label={`评论 ${work.stats.comments}`}>
              <MessageCircle size={12} aria-hidden="true" />
              {work.stats.comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
