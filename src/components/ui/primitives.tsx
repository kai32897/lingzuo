import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { creatorMap } from "@/data/seed";
import { CURRENT_USER, typeConfig } from "@/data/config";
import { currentAvatarText, currentName } from "@/lib/currentUser";
import type { ContentType, SearchType } from "@/types";
import { cn, formatCount } from "@/lib/utils";

export function TypeSticker({
  type,
  variant = "solid",
  label,
}: {
  type: SearchType;
  variant?: "solid" | "outline" | "tag";
  label?: string;
}) {
  const config = typeConfig(type);
  return (
    <span
      className={cn("type-sticker", `type-sticker--${variant}`)}
      style={{ "--sticker": config.color } as CSSProperties}
    >
      <span className="type-sticker__dot" aria-hidden="true" />
      {label ?? config.label}
    </span>
  );
}

export function Avatar({
  handle,
  name,
  text,
  color,
  size = "md",
  className,
}: {
  handle?: string;
  name?: string;
  text?: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const creator = handle ? creatorMap.get(handle) : undefined;
  const fallback = handle === CURRENT_USER.handle ? CURRENT_USER : undefined;
  const label = text ?? creator?.avatarText ?? (fallback ? currentAvatarText() : undefined) ?? name?.slice(0, 1) ?? "灵";
  const bg = color ?? creator?.avatarColor ?? fallback?.avatarColor ?? "#D8FF3E";
  return (
    <span
      className={cn("avatar", `avatar--${size}`, className)}
      style={{ "--av-bg": bg } as CSSProperties}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

export function AuthorLine({
  handle,
  prefix,
  size = "sm",
  link = true,
}: {
  handle: string;
  prefix?: string;
  size?: "xs" | "sm";
  link?: boolean;
}) {
  const creator = creatorMap.get(handle);
  const isCurrent = handle === CURRENT_USER.handle;
  if (!creator && !isCurrent) {
    return (
      <span className="author-line">
        <Avatar handle={handle} size={size === "xs" ? "xs" : "sm"} />
        <span className="author-line__name">{prefix}{handle}</span>
      </span>
    );
  }
  const name = creator?.name ?? currentName();
  const inner = (
    <>
      <Avatar handle={handle} size={size === "xs" ? "xs" : "sm"} />
      <span className="author-line__name">
        {prefix}
        {name}
      </span>
    </>
  );
  if (!link) return <span className="author-line">{inner}</span>;
  return (
    <Link className="author-line" to={`/u/${handle}`} onClick={(event) => event.stopPropagation()}>
      {inner}
    </Link>
  );
}

export function SectionHead({
  num,
  title,
  desc,
  action,
  dark = false,
  id,
}: {
  num?: string;
  title: string;
  desc?: ReactNode;
  action?: ReactNode;
  dark?: boolean;
  id?: string;
}) {
  return (
    <header className={cn("section-head", dark && "section-head--dark")} id={id}>
      <div className="section-head__left">
        {num ? (
          <span className="section-head__num" aria-hidden="true">
            {num}
          </span>
        ) : null}
        <div className="section-head__copy">
          <h2>{title}</h2>
          {desc ? <p className="section-head__desc">{desc}</p> : null}
        </div>
      </div>
      {action ? <div className="section-head__right">{action}</div> : null}
    </header>
  );
}

export function StatItem({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <span className="stat-item" aria-label={`${label} ${value}`}>
      {icon}
      <span>{typeof value === "number" ? formatCount(value) : value}</span>
    </span>
  );
}

export function Spark({ children }: { children: ReactNode }) {
  return (
    <span className="spark-note">
      <Sparkles size={13} aria-hidden="true" />
      {children}
    </span>
  );
}

export function TagRow({ tags, max = 3 }: { tags: string[]; max?: number }) {
  return (
    <span className="tag-row">
      {tags.slice(0, max).map((tag) => (
        <Link key={tag} className="tag-row__item" to={`/topics/${encodeURIComponent(tag)}`}>
          #{tag}
        </Link>
      ))}
    </span>
  );
}

export function ArrowLink({
  to,
  children,
  onClick,
}: {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link className="arrow-link" to={to} onClick={onClick}>
      {children}
      <ArrowUpRight size={15} aria-hidden="true" />
    </Link>
  );
}

export function EmptyState({
  glyph = "空",
  title,
  desc,
  actions,
}: {
  glyph?: string;
  title: string;
  desc?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__glyph" aria-hidden="true">
        {glyph}
      </div>
      <h3>{title}</h3>
      {desc ? <p>{desc}</p> : null}
      {actions ? <div className="empty-state__actions">{actions}</div> : null}
    </div>
  );
}

export function WorkTypeDot({ type }: { type: ContentType }) {
  return (
    <span
      className="work-type-dot"
      style={{ "--dot": typeConfig(type).color } as CSSProperties}
      aria-hidden="true"
    />
  );
}
