import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, Link2, Share2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { WORK_TYPE_CONFIG } from "@/data/config";
import { creatorMap } from "@/data/seed";
import { CURRENT_USER } from "@/data/config";
import { getMediaBlob } from "@/lib/media";
import { currentName } from "@/lib/currentUser";
import type { Work } from "@/types";
import { copyText } from "@/lib/utils";
import { track } from "@/lib/analytics";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number, maxLines = 4): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let current = "";
  for (const char of clean) {
    current += char;
    if (current.length >= maxChars) {
      lines.push(current);
      current = "";
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && clean.length > lines.join("").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, maxChars - 1)}…`;
  }
  return lines;
}

function authorName(work: Work): string {
  return (
    creatorMap.get(work.authorHandle)?.name ??
    (work.authorHandle === CURRENT_USER.handle ? currentName() : work.authorHandle)
  );
}

function buildPoster(work: Work, size: "3:4" | "9:16", coverData?: string): string {
  const width = 1080;
  const height = size === "9:16" ? 1920 : 1440;
  const config = WORK_TYPE_CONFIG[work.type];
  const accentByType: Record<Work["type"], string> = {
    game: "#D8FF3E",
    drama: "#FF5A3C",
    novel: "#B9A6FF",
    tutorial: "#FFC24B",
  };
  const accent = accentByType[work.type];
  const coverImage = coverData
    ? `<defs><clipPath id="poster-cover"><rect x="${width - 320}" y="150" width="240" height="160" rx="6"/></clipPath></defs>
       <image href="${escapeXml(coverData)}" x="${width - 320}" y="150" width="240" height="160" preserveAspectRatio="xMidYMid slice" clip-path="url(#poster-cover)"/>
       <rect x="${width - 320}" y="150" width="240" height="160" rx="6" fill="none" stroke="#15130F" stroke-width="3"/>`
    : "";
  const titleLines = wrapText(work.title, size === "9:16" ? 8 : 9, 3);
  const summaryLines = wrapText(work.summary, size === "9:16" ? 22 : 24, 4);
  const titleSize = size === "9:16" ? 100 : 92;
  const titleY = size === "9:16" ? 470 : 430;
  const summaryY = titleY + titleLines.length * titleSize * 1.22 + 54;
  const glyphSize = size === "9:16" ? 480 : 420;
  const qrSize = 140;
  const qrX = 82;
  const qrY = height - 300;
  const footerY = height - 390;
  const glyphX = width - 250;
  const glyphY = size === "9:16" ? 1360 : height - 360;
  const quoteLines = size === "9:16" ? wrapText(work.hook, 14, 3) : [];
  const quoteY = 1050;
  const quoteSvg = quoteLines
    .map(
      (line, index) =>
        `<tspan x="82" ${index === 0 ? `y="${quoteY}"` : `dy="62"`}>${escapeXml(line)}</tspan>`,
    )
    .join("");

  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<tspan x="82" ${index === 0 ? `y="${titleY}"` : `dy="${titleSize * 1.18}"`}>${escapeXml(line)}</tspan>`,
    )
    .join("");
  const summarySvg = summaryLines
    .map(
      (line, index) =>
        `<tspan x="84" ${index === 0 ? `y="${summaryY}"` : `dy="52"`}>${escapeXml(line)}</tspan>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#F4F0E6"/>
    <rect x="28" y="28" width="${width - 56}" height="${height - 56}" fill="none" stroke="#15130F" stroke-width="6"/>
    <rect x="44" y="44" width="${width - 88}" height="${height - 88}" fill="none" stroke="#D8D0C0" stroke-width="2"/>
    ${coverImage}
    <text x="82" y="120" font-family="'Courier New', monospace" font-size="22" letter-spacing="5" fill="#15130F">灵作 / MADE WITH AI</text>
    <text x="${width - 82}" y="120" text-anchor="end" font-family="'Courier New', monospace" font-size="20" letter-spacing="3" fill="#6C665D">${escapeXml(work.cover.code)}</text>
    <rect x="82" y="168" width="${Math.max(150, config.label.length * 32 + 40)}" height="52" rx="4" fill="${accent}" stroke="#15130F" stroke-width="3"/>
    <text x="102" y="202" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="24" font-weight="700" fill="#15130F">${escapeXml(config.label)}</text>
    <text x="82" y="${titleY - 66}" font-family="'Courier New', monospace" font-size="19" letter-spacing="4" fill="#6C665D">${escapeXml(work.tools.slice(0, 2).join(" / "))}</text>
    <text font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="${titleSize}" font-weight="900" fill="#15130F">${titleSvg}</text>
    <text font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="30" fill="#5F5A52">${summarySvg}</text>
    ${size === "9:16"
      ? `<text font-family="'Noto Serif SC',serif" font-size="46" font-weight="600" fill="#15130F">${quoteSvg}</text>
    <text x="82" y="${quoteY + 260}" font-family="'Courier New', monospace" font-size="18" letter-spacing="3" fill="#6C665D">${escapeXml(work.tags.slice(0, 3).join(" / "))}</text>
    <line x1="82" y1="${quoteY + 228}" x2="${width - 82}" y2="${quoteY + 228}" stroke="#C9C1B2" stroke-width="1"/>`
      : ""}
    <text x="82" y="${footerY}" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="30" font-weight="700" fill="#15130F">${escapeXml(authorName(work))}</text>
    <text x="82" y="${footerY + 46}" font-family="'Courier New', monospace" font-size="18" letter-spacing="2" fill="#6C665D">${escapeXml(work.license)}</text>
    <rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" fill="#FFFDF7" stroke="#15130F" stroke-width="3"/>
    <g fill="#15130F">
      <rect x="${qrX + 16}" y="${qrY + 16}" width="30" height="30"/><rect x="${qrX + 94}" y="${qrY + 16}" width="30" height="30"/>
      <rect x="${qrX + 16}" y="${qrY + 94}" width="30" height="30"/><rect x="${qrX + 60}" y="${qrY + 58}" width="18" height="18"/>
      <rect x="${qrX + 88}" y="${qrY + 74}" width="16" height="16"/><rect x="${qrX + 90}" y="${qrY + 108}" width="30" height="30"/>
      <rect x="${qrX + 50}" y="${qrY + 42}" width="14" height="14"/>
    </g>
    <text x="82" y="${height - 110}" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="20" fill="#6C665D">扫码看作品 · 二维码占位</text>
    <text x="82" y="${height - 48}" font-family="'Courier New', monospace" font-size="16" fill="#6C665D">lingzuo.demo / ${escapeXml(work.type)}</text>
    <text x="${width - 82}" y="${height - 44}" text-anchor="end" font-family="'Courier New', monospace" font-size="18" letter-spacing="3" fill="#15130F">玩一局 · 追一集 · 读两页 · 学一手</text>
    <text x="${glyphX}" y="${glyphY}" text-anchor="middle" font-family="'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" font-size="${glyphSize}" font-weight="400" fill="${accent}" opacity="0.45" transform="rotate(-6 ${glyphX} ${glyphY})">${escapeXml(work.cover.glyph)}</text>
  </svg>`;
}

export function ShareSheet({
  work,
  open,
  onClose,
}: {
  work: Work;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [size, setSize] = useState<"3:4" | "9:16">(work.type === "drama" ? "9:16" : "3:4");
  const [copyTab, setCopyTab] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [coverData, setCoverData] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    if (!work.cover.imageId) {
      setCoverData(undefined);
      return;
    }
    getMediaBlob(work.cover.imageId)
      .then((blob) => {
        if (!blob || cancelled) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (!cancelled) setCoverData(String(reader.result));
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => setCoverData(undefined));
    return () => {
      cancelled = true;
    };
  }, [work.cover.imageId]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const dataUrl = useMemo(() => {
    const svg = buildPoster(work, size, coverData);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [work, size, coverData]);

  if (!open) return null;
  const config = WORK_TYPE_CONFIG[work.type];
  const copyTexts = [
    `在灵作看到《${work.title}》：${work.summary} 每个作品都带配方，可以拆开看怎么做。`,
    `我做了一件${config.label}《${work.title}》。${work.summary} 配方在灵作，欢迎二创。`,
    `本周灵作挑战还在继续。来玩《${work.title}》，或者用同一个命题做你自己的版本。`,
  ];

  const download = async () => {
    setDownloading(true);
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("poster load failed"));
        image.src = dataUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = size === "9:16" ? 1080 : 1080;
      canvas.height = size === "9:16" ? 1920 : 1440;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas not supported");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("blob failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${work.slug}-poster-${size.replace(":", "x")}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      track("share_poster", { work: work.id, size });
      toast({ title: "海报已下载", desc: "PNG 已保存到下载文件夹。", tone: "game" });
    } catch {
      toast({
        title: "海报生成失败",
        desc: "可以直接截图预览图，或者先复制作品链接。",
      });
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="share-backdrop" role="presentation" onClick={onClose}>
      <div className="share-sheet" role="dialog" aria-modal="true" aria-label="分享作品" onClick={(event) => event.stopPropagation()}>
        <div className="share-head">
          <div>
            <span className="eyebrow">SHARE / 分享</span>
            <h2>把《{work.title}》发出去</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭分享">
            <X size={18} />
          </button>
        </div>

        <div className="share-body">
          <div className="share-preview">
            <img src={dataUrl} alt={`${work.title} 分享海报预览`} />
            <div className="share-size">
              {(["3:4", "9:16"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={size === item ? "is-active" : ""}
                  onClick={() => setSize(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="share-actions">
            <button
              type="button"
              className="share-action-btn"
              onClick={async () => {
                const ok = await copyText(window.location.href);
                if (ok) track("share_copy", { work: work.id });
                toast({ title: ok ? "作品链接已复制" : "复制失败", desc: ok ? "发给朋友，或者存进自己的收藏。" : "可以手动复制浏览器地址。" });
              }}
            >
              <Link2 size={17} />
              复制作品链接
            </button>
            {typeof navigator !== "undefined" &&
            typeof navigator.share === "function" &&
            /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? (
              <button
                type="button"
                className="share-action-btn"
                onClick={() => {
                  void navigator.share({ title: work.title, text: work.summary, url: window.location.href });
                }}
              >
                <Share2 size={17} />
                系统分享
              </button>
            ) : null}
            <button type="button" className="share-action-btn" onClick={download} disabled={downloading}>
              <Download size={17} />
              {downloading ? "正在生成…" : `下载 ${size} 海报`}
            </button>

            <div className="share-copy">
              <div className="share-copy__tabs">
                {["安利向", "作者自述", "挑战邀请"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={copyTab === index ? "is-active" : ""}
                    onClick={() => setCopyTab(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p>{copyTexts[copyTab]}</p>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={async () => {
                  const ok = await copyText(copyTexts[copyTab]);
                  toast({ title: ok ? "分享文案已复制" : "复制失败" });
                }}
              >
                <Copy size={13} />
                复制这段文案
              </button>
            </div>

            <p className="share-note">
              海报里的二维码是演示占位。正式版会生成指向作品的短链二维码。
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
