import { useEffect, useState } from "react";

export type MediaKind = "image" | "video" | "html";

export interface MediaMeta {
  id: string;
  name: string;
  type: string;
  kind: MediaKind;
  size: number;
  createdAt: string;
}

interface MediaRecord extends MediaMeta {
  blob: Blob;
}

const DB_NAME = "lingzuo-media";
const STORE = "media";
const LIMITS: Record<MediaKind, number> = {
  image: 12 * 1024 * 1024,
  video: 300 * 1024 * 1024,
  html: 2 * 1024 * 1024,
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("这个浏览器不支持本地文件存储。"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("本地素材库打开失败。"));
  });
  return dbPromise;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function validate(file: File, kind: MediaKind): void {
  if (file.size > LIMITS[kind]) {
    const mb = Math.round(LIMITS[kind] / 1024 / 1024);
    throw new Error(`${kind === "video" ? "视频" : kind === "image" ? "图片" : "HTML"}不能超过 ${mb}MB。`);
  }
  if (kind === "image" && !file.type.startsWith("image/")) {
    throw new Error("请选择图片文件。");
  }
  if (kind === "video" && !file.type.startsWith("video/")) {
    throw new Error("请选择视频文件。");
  }
  if (kind === "html" && !/\.html?$/i.test(file.name) && file.type !== "text/html") {
    throw new Error("请选择 .html 单文件。");
  }
}

export async function saveMedia(file: File, kind: MediaKind): Promise<MediaMeta> {
  validate(file, kind);
  const db = await openDb();
  const record: MediaRecord = {
    id: makeId(),
    name: file.name,
    type: file.type || (kind === "html" ? "text/html" : "application/octet-stream"),
    kind,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("素材保存失败。"));
  });
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    kind: record.kind,
    size: record.size,
    createdAt: record.createdAt,
  };
}

export async function getMediaRecord(id: string): Promise<MediaRecord | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result as MediaRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error("素材读取失败。"));
  });
}

export async function getMediaBlob(id: string): Promise<Blob | undefined> {
  return (await getMediaRecord(id))?.blob;
}

export async function getMediaMeta(id: string): Promise<MediaMeta | undefined> {
  const record = await getMediaRecord(id);
  if (!record) return undefined;
  const { blob: _blob, ...meta } = record;
  return meta;
}

export async function getMediaText(id: string): Promise<string | undefined> {
  const blob = await getMediaBlob(id);
  return blob ? blob.text() : undefined;
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("素材删除失败。"));
  });
}

export function useMediaUrl(id?: string): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    if (!id) {
      setUrl(undefined);
      return;
    }
    getMediaBlob(id)
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(undefined));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}

export function useMediaText(id?: string): { text: string; loading: boolean; error: string } {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setText("");
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    getMediaText(id)
      .then((value) => {
        if (cancelled) return;
        setText(value ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("本地素材读取失败。");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return { text, loading, error };
}
