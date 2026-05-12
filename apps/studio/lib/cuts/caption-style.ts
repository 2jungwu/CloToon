export const captionPositions = ["top", "middle", "bottom"] as const;
export const captionAlignments = ["left", "center", "right"] as const;

export type CaptionPosition = (typeof captionPositions)[number];
export type CaptionAlign = (typeof captionAlignments)[number];

export type CaptionStyle = {
  position: CaptionPosition;
  align: CaptionAlign;
  fontSize: number;
};

export type CaptionStyleOverride = Partial<CaptionStyle>;

export const captionFontSizeMin = 28;
export const captionFontSizeMax = 96;

export const defaultCaptionStyle: CaptionStyle = {
  position: "bottom",
  align: "center",
  fontSize: 56,
};

export function resolveCaptionStyle(override: CaptionStyleOverride | null | undefined): CaptionStyle {
  return {
    ...defaultCaptionStyle,
    ...normalizeCaptionStyleOverride(override),
  };
}

export function normalizeCaptionStyleOverride(input: unknown): CaptionStyleOverride {
  if (!isRecord(input)) {
    return {};
  }

  const output: CaptionStyleOverride = {};

  if (typeof input.align === "string" && isCaptionAlign(input.align)) {
    output.align = input.align;
  }

  if (typeof input.fontSize === "number" && Number.isFinite(input.fontSize)) {
    output.fontSize = clamp(Math.round(input.fontSize), captionFontSizeMin, captionFontSizeMax);
  }

  if (typeof input.position === "string" && isCaptionPosition(input.position)) {
    output.position = input.position;
  }

  return output;
}

export function normalizeCaptionStyleOverrideOrNull(
  input: unknown,
): CaptionStyleOverride | null {
  const normalized = normalizeCaptionStyleOverride(input);
  return isCaptionStyleOverrideEmpty(normalized) ? null : normalized;
}

export function parseCaptionStyleOverride(value: string | null | undefined): CaptionStyleOverride | null {
  if (!value) {
    return null;
  }

  try {
    return normalizeCaptionStyleOverrideOrNull(JSON.parse(value));
  } catch {
    return null;
  }
}

export function serializeCaptionStyleOverride(value: CaptionStyleOverride | null | undefined): string {
  const normalized = normalizeCaptionStyleOverride(value);

  if (isCaptionStyleOverrideEmpty(normalized)) {
    return "";
  }

  const ordered: CaptionStyleOverride = {};

  if (normalized.align) {
    ordered.align = normalized.align;
  }

  if (normalized.fontSize) {
    ordered.fontSize = normalized.fontSize;
  }

  if (normalized.position) {
    ordered.position = normalized.position;
  }

  return JSON.stringify(ordered);
}

function isCaptionPosition(value: string): value is CaptionPosition {
  return captionPositions.some((position) => position === value);
}

function isCaptionAlign(value: string): value is CaptionAlign {
  return captionAlignments.some((align) => align === value);
}

function isCaptionStyleOverrideEmpty(value: CaptionStyleOverride) {
  return value.align === undefined && value.fontSize === undefined && value.position === undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
