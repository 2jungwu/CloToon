import { notFound } from "next/navigation";

import { StudioWorkbench } from "@/components/studio/studio-workbench";
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

  return <StudioWorkbench initialProjectId={project.id} />;
}
