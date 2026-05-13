import { z } from "zod";
import { defaultCaptionStyle, type CaptionFontWeight, type CaptionStyle } from "./types";

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
const fontWeights = [400, 500, 600, 700, 800] as const;
const fontStyles = ["normal", "italic"] as const;
const textDecorations = ["none", "underline"] as const;
const textAligns = ["left", "center"] as const;
const widthModes = ["full-width", "fixed", "fit-content"] as const;

const hexColorSchema = z
  .string()
  .regex(hexColorPattern)
  .transform((value) => value.toLowerCase());

export const captionStyleSchema = z
  .object({
    text: z
      .object({
        color: hexColorSchema.optional(),
        fontSize: z.number().min(10).max(96).optional(),
        fontWeight: z
          .union([z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800)])
          .optional(),
        fontStyle: z.enum(fontStyles).optional(),
        textDecoration: z.enum(textDecorations).optional(),
        textAlign: z.enum(textAligns).optional(),
      })
      .strict()
      .optional(),
    box: z
      .object({
        backgroundColor: hexColorSchema.optional(),
        borderColor: hexColorSchema.optional(),
        borderWidth: z.number().min(0).max(12).optional(),
        borderRadius: z.number().min(0).max(64).optional(),
        opacity: z.number().min(0).max(1).optional(),
        paddingX: z.number().min(0).max(96).optional(),
        paddingY: z.number().min(0).max(96).optional(),
        widthMode: z.enum(widthModes).optional(),
        widthPx: z.number().min(240).max(1080).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export function parseCaptionStyle(value: string | null | undefined): CaptionStyle {
  if (!value) {
    return defaultCaptionStyle;
  }

  try {
    return normalizeCaptionStyle(JSON.parse(value) as unknown);
  } catch {
    return defaultCaptionStyle;
  }
}

export function serializeCaptionStyle(value: unknown): string {
  return JSON.stringify(normalizeCaptionStyle(value));
}

export function normalizeCaptionStyle(value: unknown): CaptionStyle {
  const source = isRecord(value) ? value : {};
  const text = isRecord(source.text) ? source.text : {};
  const box = isRecord(source.box) ? source.box : {};

  return {
    text: {
      color: readHexColor(text.color, defaultCaptionStyle.text.color),
      fontSize: readNumber(text.fontSize, defaultCaptionStyle.text.fontSize, 10, 96),
      fontWeight: readFontWeight(text.fontWeight, defaultCaptionStyle.text.fontWeight),
      fontStyle: readEnum(text.fontStyle, fontStyles, defaultCaptionStyle.text.fontStyle),
      textDecoration: readEnum(
        text.textDecoration,
        textDecorations,
        defaultCaptionStyle.text.textDecoration,
      ),
      textAlign: readEnum(text.textAlign, textAligns, defaultCaptionStyle.text.textAlign),
    },
    box: {
      backgroundColor: readHexColor(box.backgroundColor, defaultCaptionStyle.box.backgroundColor),
      borderColor: readHexColor(box.borderColor, defaultCaptionStyle.box.borderColor),
      borderWidth: readNumber(box.borderWidth, defaultCaptionStyle.box.borderWidth, 0, 12),
      borderRadius: readNumber(box.borderRadius, defaultCaptionStyle.box.borderRadius, 0, 64),
      opacity: readNumber(box.opacity, defaultCaptionStyle.box.opacity, 0, 1, {
        round: false,
      }),
      paddingX: readNumber(box.paddingX, defaultCaptionStyle.box.paddingX, 0, 96),
      paddingY: readNumber(box.paddingY, defaultCaptionStyle.box.paddingY, 0, 96),
      widthMode: readEnum(box.widthMode, widthModes, defaultCaptionStyle.box.widthMode),
      widthPx: readNumber(box.widthPx, defaultCaptionStyle.box.widthPx, 240, 1080),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHexColor(value: unknown, fallback: string) {
  return typeof value === "string" && hexColorPattern.test(value) ? value.toLowerCase() : fallback;
}

function readNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  options: { round?: boolean } = {},
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const normalized = options.round === false ? value : Math.round(value);
  return Math.min(max, Math.max(min, normalized));
}

function readFontWeight(value: unknown, fallback: CaptionFontWeight): CaptionFontWeight {
  return fontWeights.some((weight) => weight === value) ? (value as CaptionFontWeight) : fallback;
}

function readEnum<const T extends readonly string[]>(
  value: unknown,
  values: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && values.some((item) => item === value)
    ? (value as T[number])
    : fallback;
}
