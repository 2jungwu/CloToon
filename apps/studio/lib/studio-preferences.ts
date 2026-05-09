import { assetsStorageKey, settingsStorageKey } from "@/lib/image-generation/storage";

export type StudioFonts = {
  subtitle: string;
  dialogue: string;
};

export type StudioExportSettings = {
  exportScale: "1080" | "2160";
  saveOriginalHtml: boolean;
};

export type StudioPreferences = {
  fonts: StudioFonts;
  export: StudioExportSettings;
};

export const defaultStudioPreferences: StudioPreferences = {
  fonts: {
    subtitle: "Pretendard",
    dialogue: "Pretendard",
  },
  export: {
    exportScale: "1080",
    saveOriginalHtml: true,
  },
};

const fontFamilyByName: Record<string, string> = {
  Arial: 'Arial, "Helvetica Neue", sans-serif',
  "Noto Sans KR": '"Noto Sans KR", Pretendard, sans-serif',
  Pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "system-ui": '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export function loadStudioPreferencesFromStorage(storage: Storage): StudioPreferences {
  const assets = readStorageJson(storage, assetsStorageKey);
  const settings = readStorageJson(storage, settingsStorageKey);
  const fonts = isRecord(assets) ? getRecord(assets.fonts) : null;

  return {
    fonts: {
      subtitle: getFontFamily(getString(fonts?.subtitle, defaultStudioPreferences.fonts.subtitle)),
      dialogue: getFontFamily(getString(fonts?.dialogue, defaultStudioPreferences.fonts.dialogue)),
    },
    export: {
      exportScale: isRecord(settings) && settings.exportScale === "2160" ? "2160" : "1080",
      saveOriginalHtml:
        isRecord(settings) && typeof settings.saveOriginalHtml === "boolean"
          ? settings.saveOriginalHtml
          : defaultStudioPreferences.export.saveOriginalHtml,
    },
  };
}

export function getExportPixelRatio(settings: StudioExportSettings) {
  return settings.exportScale === "2160" ? 2 : 1;
}

function getFontFamily(value: string) {
  return fontFamilyByName[value] ?? fontFamilyByName.Pretendard;
}

function readStorageJson(storage: Storage, key: string) {
  try {
    const saved = storage.getItem(key);
    return saved ? (JSON.parse(saved) as unknown) : null;
  } catch {
    return null;
  }
}

function getRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}
