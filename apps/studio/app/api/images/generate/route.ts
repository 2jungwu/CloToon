import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildImageGenerationPrompt,
  GEMINI_IMAGE_MODEL,
  getSelectedCharacter,
} from "@/lib/image-generation/prompt-builder";
import {
  isAllowedReferenceImageDataUrl,
  isSupportedGeneratedImageMimeType,
  maxCutImageDataUrlLength,
  maxReferenceImageDataUrlLength,
} from "@/lib/cuts/image-data-url";

export const runtime = "nodejs";
export const maxDuration = 120;

const geminiRequestTimeoutMs = 120_000;
const maxGenerateRequestBodyLength = 7_000_000;

const expressionSchema = z.object({
  id: z.string().max(200),
  name: z.string().max(500),
  dataUrl: z
    .string()
    .max(maxReferenceImageDataUrlLength)
    .refine(isAllowedReferenceImageDataUrl, "Expression image must be a png, jpeg, or webp data URL."),
});

const characterSchema = z.object({
  id: z.string().max(200),
  name: z.string().max(200),
  markdown: z.string().max(20_000),
  expressions: z.array(expressionSchema).max(10),
});

const requestSchema = z.object({
  apiKey: z.string().trim().min(1).max(500),
  project: z.object({
    id: z.string().max(200),
    name: z.string().max(500),
    contentType: z.enum(["comic", "card-news"]),
    canvasPreset: z.enum(["1:1", "4:5", "9:16"]),
  }),
  cut: z.object({
    id: z.string().max(200),
    position: z.number().int().positive(),
    template: z.enum(["comic", "card-news"]),
    scenario: z.string().max(4000),
    caption: z.string().max(1000),
    dialogue: z.string().max(2000),
    imagePrompt: z.string().max(4000),
    negativePrompt: z.string().max(2000),
  }),
  assets: z.object({
    selectedCharacterId: z.string().max(200),
    characters: z.array(characterSchema).min(1).max(20),
    background: z.object({
      name: z.string().max(200),
      prompt: z.string().max(4000),
      color: z.string().max(40),
    }),
  }),
});

type GeminiPart =
  | { text: string }
  | {
      inline_data: {
        mime_type: string;
        data: string;
      };
    };

type GeminiResponsePart = {
  text?: string;
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
  inline_data?: {
    mime_type?: string;
    data?: string;
  };
};

type GeminiResponseBody = {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[];
    };
  }>;
  error?: {
    status?: string;
    message?: string;
  };
};

export async function POST(request: Request) {
  const body = await readJsonPayload(request);

  if (!body.ok) {
    return NextResponse.json(
      {
        error: body.error,
        status: body.status,
        message: body.message,
      },
      { status: body.httpStatus },
    );
  }

  const result = requestSchema.safeParse(body.value);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid image generation payload",
        status: "INVALID_REQUEST",
        message: "이미지 생성 요청 형식이 올바르지 않습니다.",
      },
      { status: 400 },
    );
  }

  const { apiKey, assets, cut, project } = result.data;
  const prompt = buildImageGenerationPrompt({ assets, cut, project });
  const selectedCharacter = getSelectedCharacter(assets);
  const parts: GeminiPart[] = [
    { text: prompt },
    ...selectedCharacter.expressions.slice(0, 3).flatMap((expression) => {
      const inlinePart = dataUrlToInlinePart(expression.dataUrl);
      return inlinePart ? [inlinePart] : [];
    }),
  ];

  let geminiResponse: Response;

  try {
    geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            responseModalities: ["Image"],
            imageConfig: {
              aspectRatio: project.canvasPreset,
              imageSize: "1K",
            },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(geminiRequestTimeoutMs),
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Gemini request failed",
        status: "NETWORK_ERROR",
        message: "Gemini 이미지 생성 요청 중 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 502 },
    );
  }

  const responseText = await geminiResponse.text();
  const responseBody = parseGeminiResponse(responseText);

  if (!geminiResponse.ok) {
    return NextResponse.json(
      {
        error: "Gemini request failed",
        status: responseBody?.error?.status ?? String(geminiResponse.status),
        message: sanitizeProviderMessage(responseBody?.error?.message ?? responseText, apiKey),
      },
      { status: geminiResponse.status },
    );
  }

  const imagePart = findImagePart(responseBody);

  if (!imagePart?.data) {
    return NextResponse.json(
      {
        error: "Gemini response did not include an image",
        status: "NO_IMAGE",
        message: "Gemini 응답에 이미지 데이터가 포함되지 않았습니다.",
      },
      { status: 502 },
    );
  }

  const mimeType = imagePart.mimeType || "image/png";

  if (!isSupportedGeneratedImageMimeType(mimeType)) {
    return NextResponse.json(
      {
        error: "Gemini response included an unsupported image type",
        status: "UNSUPPORTED_IMAGE_TYPE",
        message: "Gemini 응답 이미지 형식이 지원되지 않습니다.",
      },
      { status: 502 },
    );
  }

  const imageDataUrl = `data:${mimeType};base64,${imagePart.data}`;

  if (imageDataUrl.length > maxCutImageDataUrlLength) {
    return NextResponse.json(
      {
        error: "Generated image is too large",
        status: "IMAGE_TOO_LARGE",
        message: "생성된 이미지가 현재 컷 저장 한도를 초과했습니다.",
      },
      { status: 413 },
    );
  }

  return NextResponse.json({
    imageDataUrl,
    mimeType,
    model: GEMINI_IMAGE_MODEL,
  });
}

function dataUrlToInlinePart(dataUrl: string): GeminiPart | null {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i.exec(dataUrl);

  if (!match) {
    return null;
  }

  return {
    inline_data: {
      mime_type: match[1],
      data: match[2],
    },
  };
}

async function readJsonPayload(request: Request): Promise<
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: string;
      status: string;
      message: string;
      httpStatus: number;
    }
> {
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "", 10);

  if (Number.isFinite(contentLength) && contentLength > maxGenerateRequestBodyLength) {
    return {
      ok: false,
      error: "Image generation payload is too large",
      status: "PAYLOAD_TOO_LARGE",
      message: "이미지 생성 요청이 너무 큽니다. 캐릭터 표정 이미지를 더 작은 파일로 줄여주세요.",
      httpStatus: 413,
    };
  }

  const requestText = await request.text().catch(() => null);

  if (requestText === null) {
    return {
      ok: false,
      error: "Image generation payload could not be read",
      status: "INVALID_REQUEST",
      message: "이미지 생성 요청을 읽지 못했습니다.",
      httpStatus: 400,
    };
  }

  if (requestText.length > maxGenerateRequestBodyLength) {
    return {
      ok: false,
      error: "Image generation payload is too large",
      status: "PAYLOAD_TOO_LARGE",
      message: "이미지 생성 요청이 너무 큽니다. 캐릭터 표정 이미지를 더 작은 파일로 줄여주세요.",
      httpStatus: 413,
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(requestText) as unknown,
    };
  } catch {
    return {
      ok: false,
      error: "Invalid image generation payload",
      status: "INVALID_REQUEST",
      message: "이미지 생성 요청 형식이 올바르지 않습니다.",
      httpStatus: 400,
    };
  }
}

function parseGeminiResponse(responseText: string): GeminiResponseBody | null {
  try {
    return JSON.parse(responseText) as GeminiResponseBody;
  } catch {
    return null;
  }
}

function findImagePart(responseBody: GeminiResponseBody | null) {
  const parts = responseBody?.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType,
        data: part.inlineData.data,
      };
    }

    if (part.inline_data?.data) {
      return {
        mimeType: part.inline_data.mime_type,
        data: part.inline_data.data,
      };
    }
  }

  return null;
}

function redactApiKey(message: string, apiKey: string) {
  return message.replaceAll(apiKey, "[REDACTED]");
}

function sanitizeProviderMessage(message: string, apiKey: string) {
  return redactApiKey(message, apiKey).slice(0, 2000);
}
