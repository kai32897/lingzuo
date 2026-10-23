import type { CSSProperties, ReactNode } from "react";
import type { CoverSpec } from "@/types";
import { useMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function Cover({
  cover,
  className,
  label,
  children,
}: {
  cover: CoverSpec;
  className?: string;
  label?: string;
  children?: ReactNode;
}) {
  const imageUrl = useMediaUrl(cover.imageId);
  return (
    <div
      className={cn("cover", `cover--${cover.pattern}`, imageUrl && "cover--image", className)}
      style={
        {
          "--cv-bg": cover.bg,
          "--cv-ink": cover.ink,
          "--cv-accent": cover.accent,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {imageUrl ? <img className="cover__image" src={imageUrl} alt="" loading="lazy" decoding="async" /> : null}
      <span className="cover__pattern" />
      <span className="cover__code">{cover.code}</span>
      <span className="cover__glyph">{cover.glyph}</span>
      <span className="cover__mark">MADE WITH AI</span>
      {label ? <span className="cover__label">{label}</span> : null}
      {children}
    </div>
  );
}
