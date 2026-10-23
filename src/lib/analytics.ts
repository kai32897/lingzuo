import { readLocal, writeLocal } from "@/lib/storage";

const STORAGE_KEY = "lz:analytics";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  const payload = {
    event,
    props,
    path: window.location.pathname,
    at: new Date().toISOString(),
  };
  try {
    const history = readLocal<typeof payload[]>(STORAGE_KEY, []);
    writeLocal(STORAGE_KEY, [...history, payload].slice(-300));
  } catch {
    // Analytics must never block the page.
  }
  window.plausible?.(event, { props });
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...props });
}
