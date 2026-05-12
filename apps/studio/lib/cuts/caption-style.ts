export const captionPositions = ["top", "middle", "bottom"] as const;
export const captionAlignments = ["left", "center", "right"] as const;

export type CaptionPosition = (typeof captionPositions)[number];
export type CaptionAlign = (typeof captionAlignments)[number];

export type CaptionStyle = {
  position: CaptionPosition;
  align: CaptionAlign;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  paddingXPct: number;
  paddingYPct: number;
};

export type CaptionStyleOverride = Partial<CaptionStyle>;

export const captionFontSizeMin = 28;
export const captionFontSizeMax = 96;
export const captionFontWeightMin = 400;
export const captionFontWeightMax = 900;
export const captionBoxWidthMin = 24;
export const captionBoxWidthMax = 96;
export const captionBoxHeightMin = 8;
export const captionBoxHeightMax = 80;
export const captionPaddingMax = 12;
export const captionBorderWidthMax = 8;

export const defaultCaptionStyle: CaptionStyle = {
  position: "bottom",
  align: "center",
  fontSize: 56,
  fontWeight: 900,
  color: "#000000",
  backgroundColor: "#ffffff",
  borderColor: "#000000",
  borderWidth: 2,
  xPct: 4,
  yPct: 78,
  widthPct: 92,
  heightPct: 18,
  paddingXPct: 5,
  paddingYPct: 4.5,
};

export function resolveCaptionStyle(override: CaptionStyleOverride | null | undefined): CaptionStyle {
  const normalizedOverride = normalizeCaptionStyleOverride(override);
  const style = {
    ...defaultCaptionStyle,
    ...normalizedOverride,
  };

  if (normalizedOverride.position !== undefined && normalizedOverride.yPct === undefined) {
    style.yPct = getCaptionPositionYPct(normalizedOverride.position);
  }

  return fitCaptionStyle(style);
}

export function normalizeCaptionStyleOverride(input: unknown): CaptionStyleOverride {
  if (!isRecord(input)) {
    return {};
  }

  const output: CaptionStyleOverride = {};

  if (typeof input.align === "string" && isCaptionAlign(input.align)) {
    output.align = input.align;
  }

  if (typeof input.backgroundColor === "string" && isHexColor(input.backgroundColor)) {
    output.backgroundColor = input.backgroundColor.toLowerCase();
  }

  if (typeof input.borderColor === "string" && isHexColor(input.borderColor)) {
    output.borderColor = input.borderColor.toLowerCase();
  }

  if (typeof input.borderWidth === "number" && Number.isFinite(input.borderWidth)) {
    output.borderWidth = clamp(Math.round(input.borderWidth), 0, captionBorderWidthMax);
  }

  if (typeof input.color === "string" && isHexColor(input.color)) {
    output.color = input.color.toLowerCase();
  }

  if (typeof input.fontSize === "number" && Number.isFinite(input.fontSize)) {
    output.fontSize = clamp(Math.round(input.fontSize), captionFontSizeMin, captionFontSizeMax);
  }

  if (typeof input.fontWeight === "number" && Number.isFinite(input.fontWeight)) {
    output.fontWeight = clamp(
      Math.round(input.fontWeight / 100) * 100,
      captionFontWeightMin,
      captionFontWeightMax,
    );
  }

  if (typeof input.heightPct === "number" && Number.isFinite(input.heightPct)) {
    output.heightPct = clamp(roundPercent(input.heightPct), captionBoxHeightMin, captionBoxHeightMax);
  }

  if (typeof input.paddingXPct === "number" && Number.isFinite(input.paddingXPct)) {
    output.paddingXPct = clamp(roundPercent(input.paddingXPct), 0, captionPaddingMax);
  }

  if (typeof input.paddingYPct === "number" && Number.isFinite(input.paddingYPct)) {
    output.paddingYPct = clamp(roundPercent(input.paddingYPct), 0, captionPaddingMax);
  }

  if (typeof input.position === "string" && isCaptionPosition(input.position)) {
    output.position = input.position;
  }

  if (typeof input.widthPct === "number" && Number.isFinite(input.widthPct)) {
    output.widthPct = clamp(roundPercent(input.widthPct), captionBoxWidthMin, captionBoxWidthMax);
  }

  if (typeof input.xPct === "number" && Number.isFinite(input.xPct)) {
    output.xPct = clamp(roundPercent(input.xPct), 0, 100);
  }

  if (typeof input.yPct === "number" && Number.isFinite(input.yPct)) {
    output.yPct = clamp(roundPercent(input.yPct), 0, 100);
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

  if (normalized.backgroundColor) {
    ordered.backgroundColor = normalized.backgroundColor;
  }

  if (normalized.borderColor) {
    ordered.borderColor = normalized.borderColor;
  }

  if (normalized.borderWidth !== undefined) {
    ordered.borderWidth = normalized.borderWidth;
  }

  if (normalized.color) {
    ordered.color = normalized.color;
  }

  if (normalized.fontSize) {
    ordered.fontSize = normalized.fontSize;
  }

  if (normalized.fontWeight) {
    ordered.fontWeight = normalized.fontWeight;
  }

  if (normalized.heightPct !== undefined) {
    ordered.heightPct = normalized.heightPct;
  }

  if (normalized.paddingXPct !== undefined) {
    ordered.paddingXPct = normalized.paddingXPct;
  }

  if (normalized.paddingYPct !== undefined) {
    ordered.paddingYPct = normalized.paddingYPct;
  }

  if (normalized.position) {
    ordered.position = normalized.position;
  }

  if (normalized.widthPct !== undefined) {
    ordered.widthPct = normalized.widthPct;
  }

  if (normalized.xPct !== undefined) {
    ordered.xPct = normalized.xPct;
  }

  if (normalized.yPct !== undefined) {
    ordered.yPct = normalized.yPct;
  }

  return JSON.stringify(ordered);
}

export function getCaptionPositionYPct(position: CaptionPosition) {
  if (position === "top") {
    return 4;
  }

  if (position === "middle") {
    return 41;
  }

  return 78;
}

function fitCaptionStyle(style: CaptionStyle): CaptionStyle {
  const widthPct = clamp(style.widthPct, captionBoxWidthMin, captionBoxWidthMax);
  const heightPct = clamp(style.heightPct, captionBoxHeightMin, captionBoxHeightMax);

  return {
    ...style,
    widthPct,
    heightPct,
    xPct: clamp(style.xPct, 0, 100 - widthPct),
    yPct: clamp(style.yPct, 0, 100 - heightPct),
  };
}

function isCaptionPosition(value: string): value is CaptionPosition {
  return captionPositions.some((position) => position === value);
}

function isCaptionAlign(value: string): value is CaptionAlign {
  return captionAlignments.some((align) => align === value);
}

function isCaptionStyleOverrideEmpty(value: CaptionStyleOverride) {
  return (
    value.align === undefined &&
    value.backgroundColor === undefined &&
    value.borderColor === undefined &&
    value.borderWidth === undefined &&
    value.color === undefined &&
    value.fontSize === undefined &&
    value.fontWeight === undefined &&
    value.heightPct === undefined &&
    value.paddingXPct === undefined &&
    value.paddingYPct === undefined &&
    value.position === undefined &&
    value.widthPct === undefined &&
    value.xPct === undefined &&
    value.yPct === undefined
  );
}

function isHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
