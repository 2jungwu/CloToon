import { NextResponse } from "next/server";
import { z } from "zod";
import { captionStyleSchema, normalizeCaptionStyle } from "@/lib/caption-style/schema";
import { deleteCut, updateCut } from "@/lib/cuts/repository";
import { isAllowedCutImageDataUrl, maxCutImageDataUrlLength } from "@/lib/cuts/image-data-url";
import type { UpdateCutInput } from "@/lib/cuts/types";

export const runtime = "nodejs";

type CutRouteProps = {
  params: Promise<{
    projectId: string;
    cutId: string;
  }>;
};

const updateCutSchema = z.object({
  template: z.enum(["comic", "card-news"]).optional(),
  scenario: z.string().max(4000).optional(),
  caption: z.string().max(1000).optional(),
  dialogue: z.string().max(2000).optional(),
  imagePrompt: z.string().max(4000).optional(),
  negativePrompt: z.string().max(2000).optional(),
  imageDataUrl: z
    .string()
    .max(maxCutImageDataUrlLength)
    .refine(isAllowedCutImageDataUrl, "imageDataUrl must be an allowed image data URL.")
    .optional(),
  imageStatus: z.enum(["empty", "mock", "uploaded", "generated", "failed"]).optional(),
  captionStyle: captionStyleSchema.optional(),
});

export async function PATCH(request: Request, { params }: CutRouteProps) {
  const { projectId, cutId } = await params;
  const body = await request.json().catch(() => null);
  const result = updateCutSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid cut payload", issues: result.error.issues },
      { status: 400 },
    );
  }

  const { captionStyle, ...cutData } = result.data;
  const update: UpdateCutInput = { ...cutData };

  if (captionStyle) {
    update.captionStyle = normalizeCaptionStyle(captionStyle);
  }

  const cut = updateCut(projectId, cutId, update);

  if (!cut) {
    return NextResponse.json({ error: "Cut not found" }, { status: 404 });
  }

  return NextResponse.json({ cut });
}

export async function DELETE(_request: Request, { params }: CutRouteProps) {
  const { projectId, cutId } = await params;
  const deleted = deleteCut(projectId, cutId);

  if (!deleted) {
    return NextResponse.json({ error: "Cut not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
