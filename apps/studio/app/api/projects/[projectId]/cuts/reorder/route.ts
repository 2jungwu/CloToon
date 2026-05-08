import { NextResponse } from "next/server";
import { z } from "zod";
import { reorderCuts } from "@/lib/cuts/repository";
import { getProject } from "@/lib/projects/repository";

export const runtime = "nodejs";

type ReorderRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

const reorderSchema = z.object({
  cutIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request: Request, { params }: ReorderRouteProps) {
  const { projectId } = await params;
  const body = await request.json().catch(() => null);
  const result = reorderSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid reorder payload", issues: result.error.issues },
      { status: 400 },
    );
  }

  if (!getProject(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ cuts: reorderCuts(projectId, result.data.cutIds) });
}
