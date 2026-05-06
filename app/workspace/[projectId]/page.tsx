import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceEditor } from "@/components/workspace/workspace-editor";
import { listCuts } from "@/lib/cuts/repository";
import { getProject } from "@/lib/projects/repository";

type WorkspacePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { projectId } = await params;
  const project = getProject(projectId);

  if (!project) {
    notFound();
  }

  const cuts = listCuts(project.id);

  return (
    <section className="page-shell">
      <Link href="/projects" className="text-link">
        Back to projects
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Workspace</p>
        <h1>{project.name}</h1>
        <p>
          {project.contentType === "comic" ? "인스타툰" : "카드뉴스"} · {project.canvasPreset}
        </p>
      </div>
      <WorkspaceEditor project={project} initialCuts={cuts} />
    </section>
  );
}
