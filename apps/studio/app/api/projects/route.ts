import { NextResponse } from "next/server";
import { z } from "zod";
import { createProject, listProjects } from "@/lib/projects/repository";
import { rejectInvalidDesktopMutation } from "@/lib/security/desktop-request-guard";

export const runtime = "nodejs";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  contentType: z.enum(["comic", "card-news"]).default("comic"),
  canvasPreset: z.enum(["1:1", "4:5", "9:16"]).default("1:1"),
});

export function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(request: Request) {
  const blockedResponse = rejectInvalidDesktopMutation(request);

  if (blockedResponse) {
    return blockedResponse;
  }

  const body = await request.json().catch(() => null);
  const result = createProjectSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid project payload", issues: result.error.issues },
      { status: 400 },
    );
  }

  const project = createProject(result.data);
  return NextResponse.json({ project }, { status: 201 });
}
