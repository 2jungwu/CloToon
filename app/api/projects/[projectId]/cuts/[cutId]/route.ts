import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCut, updateCut } from "@/lib/cuts/repository";

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
  imageDataUrl: z.string().max(8_000_000).optional(),
  imageStatus: z.enum(["empty", "mock", "uploaded", "generated", "failed"]).optional(),
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

  const cut = updateCut(projectId, cutId, result.data);

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
