import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <section className="page-shell">
      <Link href="/projects" className="text-link">
        Back to projects
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Workspace</p>
        <h1>{project.name}</h1>
        <p>
          {project.contentType} · {project.canvasPreset}
        </p>
      </div>
      <div className="placeholder-panel">
        <h2>Phase 1 준비 영역</h2>
        <p>
          Phase 0에서는 프로젝트 생성과 열기만 제공합니다. 컷 편집기는 다음
          Phase에서 이 화면에 연결됩니다.
        </p>
      </div>
    </section>
  );
}
