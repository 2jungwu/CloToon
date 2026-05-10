export const geminiImageModelIds = [
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
] as const;

export type GeminiImageModel = (typeof geminiImageModelIds)[number];

export const defaultGeminiImageModel: GeminiImageModel = "gemini-3.1-flash-image-preview";

export const geminiImageModels: Array<{
  id: GeminiImageModel;
  label: string;
  description: string;
}> = [
  {
    id: "gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image Preview",
    description: "균형형 기본 모델",
  },
  {
    id: "gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image Preview",
    description: "복잡한 지시와 고품질 자산용",
  },
  {
    id: "gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
    description: "속도와 효율 중심",
  },
];

export function isGeminiImageModel(value: unknown): value is GeminiImageModel {
  return typeof value === "string" && geminiImageModelIds.includes(value as GeminiImageModel);
}

export function normalizeGeminiImageModel(value: unknown): GeminiImageModel {
  return isGeminiImageModel(value) ? value : defaultGeminiImageModel;
}

export function supportsGeminiImageSize(model: GeminiImageModel) {
  return model !== "gemini-2.5-flash-image";
}
