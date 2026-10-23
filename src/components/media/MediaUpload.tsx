import { useEffect, useId, useState } from "react";
import { Film, FileCode2, Image as ImageIcon, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  getMediaMeta,
  saveMedia,
  useMediaUrl,
  type MediaKind,
  type MediaMeta,
} from "@/lib/media";
import { cn } from "@/lib/utils";

const ICONS: Record<MediaKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Film,
  html: FileCode2,
};

const LABELS: Record<MediaKind, string> = {
  image: "图片",
  video: "视频",
  html: "HTML 文件",
};

export interface ImagePreset {
  label: string;
  width: number;
  height: number;
}

export type CropAnchor = "center" | "top" | "bottom" | "left" | "right";

async function compressImage(file: File, maxSide = 1600): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("图片读取失败。"));
      element.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    if (scale === 1 && file.size < 900 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.82);
    const type = webp.startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));
    if (!blob || blob.size >= file.size) return file;
    const extension = type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `image-${canvas.width}x${canvas.height}.${extension}`, { type });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function cropImage(file: File, preset: ImagePreset, anchor: CropAnchor): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("图片读取失败。"));
      element.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持图片裁剪。");
    const scale = Math.max(preset.width / image.width, preset.height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x =
      anchor === "left" ? 0 : anchor === "right" ? preset.width - drawWidth : (preset.width - drawWidth) / 2;
    const y =
      anchor === "top" ? 0 : anchor === "bottom" ? preset.height - drawHeight : (preset.height - drawHeight) / 2;
    context.drawImage(image, x, y, drawWidth, drawHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) throw new Error("图片裁剪失败。");
    return new File([blob], `cover-${preset.width}x${preset.height}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeText(size: number): string {
  return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function MediaUpload({
  kind,
  value,
  onChange,
  onPresetChange,
  label,
  compact = false,
  imagePresets,
}: {
  kind: MediaKind;
  value?: string;
  onChange: (id: string | undefined) => void;
  onPresetChange?: (preset: ImagePreset) => void;
  label?: string;
  compact?: boolean;
  imagePresets?: ImagePreset[];
}) {
  const inputId = useId();
  const { toast } = useToast();
  const Icon = ICONS[kind];
  const [meta, setMeta] = useState<MediaMeta>();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);
  const [anchor, setAnchor] = useState<CropAnchor>("center");
  const url = useMediaUrl(value);
  const preset = imagePresets?.[presetIndex];

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setMeta(undefined);
      return;
    }
    getMediaMeta(value)
      .then((item) => {
        if (!cancelled) setMeta(item);
      })
      .catch(() => {
        if (!cancelled) setMeta(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className={cn("media-upload", compact && "media-upload--compact")}>
      <div className="media-upload__head">
        <span>
          <Icon size={13} />
          {label ?? `上传${LABELS[kind]}`}
        </span>
        {value ? (
          <button type="button" className="media-upload__remove" onClick={() => onChange(undefined)}>
            <X size={12} />
            {kind === "video" ? "删除视频" : "移除"}
          </button>
        ) : null}
      </div>
      {!value && kind === "image" && imagePresets?.length ? (
        <div className="media-crop-options">
          <span>取景</span>
          {([
            ["center", "居中"],
            ["top", "偏上"],
            ["bottom", "偏下"],
            ["left", "偏左"],
            ["right", "偏右"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={anchor === value ? "is-active" : ""}
              onClick={() => setAnchor(value)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {imagePresets?.length ? (
        <div className="media-size-options">
          <span>常用尺寸</span>
          {imagePresets.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={presetIndex === index ? "is-active" : ""}
              onClick={() => setPresetIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {busy ? (
        <div className="media-progress">
          <span style={{ width: `${progress}%` }} />
          <small>正在写入本地 · {progress}%</small>
        </div>
      ) : null}
      {value ? (
        <>
          <div className="media-upload__file">
            {kind === "image" && url ? <img src={url} alt="" /> : null}
            <span>
              <strong>{meta?.name ?? "已上传素材"}</strong>
              <small>
                {meta ? `${LABELS[kind]} · ${sizeText(meta.size)}` : "素材保存在本地"} · 已就绪
              </small>
            </span>
            <label className="media-upload__replace" htmlFor={inputId}>
              更换
            </label>
          </div>
          {kind === "video" && url ? (
            <video className="media-upload__video" src={url} controls preload="metadata" />
          ) : null}
        </>
      ) : (
        <label className="media-upload__drop" htmlFor={inputId}>
          <Upload size={16} />
          <span>{busy ? "正在保存…" : `选择${LABELS[kind]}`}</span>
          <small>
            {kind === "video"
              ? "MP4 / WebM，演示版上限 300MB"
              : kind === "image"
                ? "JPG / PNG / WebP，上限 12MB"
                : "单个 .html 文件，上限 2MB"}
          </small>
        </label>
      )}
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={kind === "image" ? "image/*" : kind === "video" ? "video/*" : ".html,.htm,text/html"}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy(true);
          setProgress(4);
          const timer = window.setInterval(() => {
            setProgress((current) => Math.min(92, current + 7));
          }, 120);
          try {
            const source =
              kind === "image"
                ? preset
                  ? await cropImage(file, preset, anchor)
                  : await compressImage(file)
                : file;
            const saved = await saveMedia(source, kind);
            setProgress(100);
            onChange(saved.id);
            if (preset) onPresetChange?.(preset);
            toast({
              title: "素材已保存到本地",
              desc: `${saved.name} · ${sizeText(saved.size)}${preset ? ` · ${preset.width}×${preset.height}` : ""}`,
            });
          } catch (error) {
            toast({
              title: "素材没有保存",
              desc: error instanceof Error ? error.message : "请换一个文件再试。",
            });
          } finally {
            window.clearInterval(timer);
            setBusy(false);
            window.setTimeout(() => setProgress(0), 900);
          }
        }}
      />
    </div>
  );
}

export function MediaImage({
  id,
  alt = "",
  className,
  caption,
}: {
  id?: string;
  alt?: string;
  className?: string;
  caption?: string;
}) {
  const url = useMediaUrl(id);
  if (!url) return <span className={cn("media-placeholder", className)}>图片素材读取中…</span>;
  return (
    <figure className={cn("media-figure", className)}>
      <img src={url} alt={alt} loading="lazy" decoding="async" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function MediaVideo({
  id,
  className,
  caption,
  controls = true,
  autoPlay = false,
  muted = false,
}: {
  id?: string;
  className?: string;
  caption?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}) {
  const url = useMediaUrl(id);
  if (!url) return <span className={cn("media-placeholder", className)}>视频素材读取中…</span>;
  return (
    <figure className={cn("media-figure media-figure--video", className)}>
      <video src={url} controls={controls} playsInline autoPlay={autoPlay} muted={muted} preload="metadata" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
