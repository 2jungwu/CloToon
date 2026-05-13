import { assetsStorageKey } from "@/lib/image-generation/storage";

import { normalizeCaptionStyle } from "./schema";
import { defaultCaptionStyle, type CaptionStyle } from "./types";

export function loadCaptionStyleDefaultsFromStorage(storage: Storage): CaptionStyle {
  return readCaptionStyleDefaultsFromAssets(readStorageJson(storage, assetsStorageKey));
}

export function readCaptionStyleDefaultsFromAssets(value: unknown): CaptionStyle {
  if (!isRecord(value)) {
    return defaultCaptionStyle;
  }

  return normalizeCaptionStyle(value.captionStyleDefaults);
}

function readStorageJson(storage: Storage, key: string) {
  try {
    const saved = storage.getItem(key);
    return saved ? (JSON.parse(saved) as unknown) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
