import { NextResponse } from "next/server";
import { z } from "zod";
import { createCut, duplicateCut, listCuts } from "@/lib/cuts/repository";
import { getProject } from "@/lib/projects/repository";
import { rejectInvalidDesktopMutation } from "@/lib/security/desktop-request-guard";

export const runtime = "nodejs";

type CutsRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const createCutSchema = z.object({
  template: z.enum(["comic", "card-news"]).default("comic"),
  scenario: z.string().max(4000).optional(),
  caption: z.string().max(1000).optional(),
  dialogue: z.string().max(2000).optional(),
  imagePrompt: z.string().max(4000).optional(),
  negativePrompt: z.string().max(2000).optional(),
  duplicateFromCutId: z.string().uuid().optional(),
});

export async function GET(_request: Request, { params }: CutsRouteProps) {
  const { projectId } = await params;

  if (!getProject(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ cuts: listCuts(projectId) });
}

export async function POST(request: Request, { params }: CutsRouteProps) {
  const blockedResponse = rejectInvalidDesktopMutation(request);

  if (blockedResponse) {
    return blockedResponse;
  }

  const { projectId } = await params;
  const body = await request.json().catch(() => null);
  const result = createCutSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid cut payload", issues: result.error.issues },
      { status: 400 },
    );
  }

  if (!getProject(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (result.data.duplicateFromCutId) {
    const cut = duplicateCut(projectId, result.data.duplicateFromCutId);

    if (!cut) {
      return NextResponse.json({ error: "Cut not found" }, { status: 404 });
    }

    return NextResponse.json({ cut }, { status: 201 });
  }

  const cut = createCut({
    projectId,
    template: result.data.template,
    scenario: result.data.scenario,
    caption: result.data.caption,
    dialogue: result.data.dialogue,
    imagePrompt: result.data.imagePrompt,
    negativePrompt: result.data.negativePrompt,
  });

  return NextResponse.json({ cut }, { status: 201 });
}
