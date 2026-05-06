import { NextResponse } from "next/server";
import { getProject } from "@/lib/projects/repository";

export const runtime = "nodejs";

type ProjectRouteProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, { params }: ProjectRouteProps) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}
