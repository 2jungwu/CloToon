import { ProjectList } from "@/components/projects/project-list";

export default function ProjectsPage() {
  return (
    <section className="page-shell">
      <div className="page-heading">
        <h1>Project</h1>
        <p>
          로컬에 저장된 에셋을 기준으로 프로젝트를 생성합니다.
          <br />
          에셋을 먼저 설정하세요
        </p>
      </div>
      <ProjectList />
    </section>
  );
}
