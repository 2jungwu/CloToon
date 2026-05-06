import { NextResponse } from "next/server";
import { deleteProject, getProject } from "@/lib/projects/repository";

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

export async function DELETE(_request: Request, { params }: ProjectRouteProps) {
  const { projectId } = await params;
  const deleted = deleteProject(projectId);

  if (!deleted) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
