import { ProjectList } from "@/components/projects/project-list";

export default function ProjectsPage() {
  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Studio Projects</p>
        <h1>프로젝트 목록</h1>
        <p>로컬에 저장된 인스타툰과 카드뉴스 제작 프로젝트를 만들고 다시 엽니다.</p>
      </div>
      <ProjectList />
    </section>
  );
}
