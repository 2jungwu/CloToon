# Studio Workbench Implementation Plan

## 문서 상태

이 문서는 2026-05-09에 작성된 과거 구현 계획이다. 현재 제품 기준은 `PRD.md`, `ROADMAP.md`, `DESIGN.md`를 따른다. 이 계획은 당시 작업 흐름과 폐기된 판단을 추적하기 위한 기록으로 보존한다.

2026-05-13 기준 방향 전환 사유:

- 당시 계획은 `image-only preview`로 생성 이미지 확인을 단순화하려 했지만, 이후 자막 레이어 편집이 핵심 제작 기능으로 확정되면서 미리보기에도 HTML/CSS 자막 레이어를 표시하도록 바뀌었다.
- 자막과 대사를 모두 Gemini payload context로만 사용하는 방향은 폐기되었다. 현재 기준은 자막은 HTML/CSS 레이어로 최종 렌더링하고, 대사는 사용자가 입력한 문구에 한해 생성 이미지 안 말풍선/대사 표현으로 반영한다.
- Mock 이미지, 이미지 업로드, 컷 복제/순서 변경을 숨기는 방향은 폐기되었다. Gemini quota, key, provider 실패와 무관하게 로컬 제작을 계속하려면 fallback과 컷 관리 액션이 필요하다.
- 고급 자막 편집을 전부 후속 버전으로 미루는 방향은 일부 폐기되었다. 현재 v1은 글자 색상, 크기, 굵게/기울임/밑줄, 정렬, 박스 배경/테두리/선/모서리/안쪽여백/너비 컨트롤을 포함한다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Projects`와 `Workspace`를 카드형 UI가 아닌 분할형 Studio Workbench로 통합하고, 사이드 레일, 프로젝트 drawer, 생성 modal, 단일 chip 규격을 실제 앱에 적용한다.

**Architecture:** 기존 `apps/studio/components/studio/studio-workbench.tsx`가 이미 프로젝트/컷/Gemini/export orchestration을 담당하므로 새 화면을 다시 만들지 않고 이 컴포넌트를 최신 스펙에 맞게 재구성한다. 전역 상단 header는 side rail 기반 app navigation으로 바꾸고, 프로젝트 목록은 Workbench 내부 drawer로 분리하며, 프로젝트 생성은 inline form이 아니라 modal에서 처리한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, Tailwind CSS v4, Radix Select wrapper, shadcn-style Button/Input/Textarea, existing SQLite JSON API, existing Gemini image route, `html-to-image`, `jszip`, `apps/studio/app/styles.css`.

---

## 현재 상태

- 당시 구현 브랜치: `codex/studio-workbench`
- 당시 설계 스펙: `docs/superpowers/specs/2026-05-09-studio-workbench-design.md`
- 현재 기준: 이 계획은 최신 구현 지시가 아니며, 자막 레이어 편집과 HTML/CSS 자막 미리보기 방향으로 대체되었다.
- 기존 Workbench 컴포넌트: `apps/studio/components/studio/studio-workbench.tsx`
- 기존 route 연결:
  - `apps/studio/app/projects/page.tsx`
  - `apps/studio/app/workspace/[projectId]/page.tsx`
- 기존 생성/export 로직은 유지한다.
- `.superpowers/`와 `output/`은 커밋하지 않는다.

## 파일 구조

수정:

- `apps/studio/app/layout.tsx`
  - 상단 header 제거
  - side rail navigation을 전역 navigation으로 렌더링
  - `main`에 side rail 폭을 고려한 layout class 부여
- `apps/studio/components/app-nav.tsx`
  - 상단 pill nav에서 vertical side rail로 전환
  - 로고 PNG placeholder, 수평 라인, `프로젝트`, `에셋` 메뉴 구현
- `apps/studio/components/studio/studio-workbench.tsx`
  - `ProjectRail`을 `ProjectDrawer`로 개편
  - inline 프로젝트 생성 form 제거
  - `ProjectCreateModal` 추가
  - `StudioChip` class를 단일 `.ui-chip`로 전환
  - Workbench head, 컷 수, 컷 목록, 미리보기 영역 구조 정리
- `apps/studio/app/styles.css`
  - app side rail
  - project drawer
  - project create modal
  - split-only Workbench layout
  - 단일 `.ui-chip`
  - 1180px 컨테이너
  - 80px header/main spacing 대체 spacing
  - responsive rules

유지:

- `apps/studio/app/api/**`
- `apps/studio/lib/projects/**`
- `apps/studio/lib/cuts/**`
- `apps/studio/lib/image-generation/**`
- `apps/studio/components/workspace/workspace-editor.tsx`
- `apps/studio/components/projects/project-list.tsx`

---

## Task 1: 전역 Header를 Side Rail Navigation으로 전환

**Files:**

- Modify: `apps/studio/app/layout.tsx`
- Modify: `apps/studio/components/app-nav.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: `layout.tsx`에서 header wrapper를 제거하고 side rail을 main과 나란히 둔다.**

  적용 형태:

  ```tsx
  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="ko" className="font-sans">
        <body>
          <AppNav />
          <main className="app-main">{children}</main>
        </body>
      </html>
    );
  }
  ```

- [ ] **Step 2: `AppNav`를 vertical side rail로 바꾼다.**

  적용 형태:

  ```tsx
  const navItems = [
    { href: "/projects", label: "프로젝트", activePrefixes: ["/projects", "/workspace"] },
    { href: "/assets", label: "에셋", activePrefixes: ["/assets", "/settings"] },
  ];

  export function AppNav() {
    const pathname = usePathname();

    return (
      <nav className="app-side-rail" aria-label="Primary navigation">
        <div className="app-logo-slot" aria-label="로고 PNG 자리">
          Logo
        </div>
        <div className="app-side-divider" />
        {navItems.map((item) => {
          const active = item.activePrefixes.some(
            (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
          );

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="app-side-link"
              data-active={active}
              href={item.href}
              key={item.href}
            >
              <span className="app-side-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }
  ```

- [ ] **Step 3: side rail CSS를 추가한다.**

  핵심 규격:

  ```css
  .app-main {
    min-height: 100vh;
    padding-left: 72px;
  }

  .app-side-rail {
    align-items: center;
    background: #1f2024;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 10px;
    inset: 0 auto 0 0;
    padding: 18px 8px;
    position: fixed;
    width: 72px;
    z-index: 40;
  }

  .app-logo-slot {
    align-items: center;
    border: 1px dashed rgba(255, 255, 255, 0.45);
    color: rgba(255, 255, 255, 0.68);
    display: flex;
    font-size: 10px;
    height: 48px;
    justify-content: center;
    line-height: 1.1;
    text-align: center;
    width: 48px;
  }

  .app-side-divider {
    background: rgba(255, 255, 255, 0.5);
    height: 1px;
    margin: 4px 0 8px;
    width: 40px;
  }
  ```

- [ ] **Step 4: 기존 `.app-header`, `.app-header-inner`, `.brand`가 더 이상 렌더링되지 않는지 확인한다.**

  실행:

  ```powershell
  npm run typecheck
  ```

  기대 결과: TypeScript error 0.

- [ ] **Step 5: 커밋한다.**

  ```powershell
  git add apps/studio/app/layout.tsx apps/studio/components/app-nav.tsx apps/studio/app/styles.css
  git commit -m "Add side rail navigation" -m "Replaces the top header with the Workbench side rail skeleton and keeps Studio/Assets routing intact." -m "Constraint: navigation-only change; no project, cut, provider, or export data changes." -m "Tested: npm run typecheck." -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
  ```

수용 기준:

- 사이드바에는 로고 자리, 수평 라인 1개, `프로젝트`, `에셋`만 보인다.
- 로고와 메뉴 사이에만 수평 라인이 있다.
- `New`는 side rail에 보이지 않는다.
- `/projects`, `/workspace/[projectId]`, `/assets` navigation이 유지된다.

---

## Task 2: 프로젝트 목록을 Drawer로 분리하고 생성 Modal 추가

**Files:**

- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: Workbench state에 modal과 drawer 상태를 추가한다.**

  `StudioWorkbench` 내부 state 근처에 추가:

  ```tsx
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(true);
  const [projectCreateModalOpen, setProjectCreateModalOpen] = useState(false);
  ```

- [ ] **Step 2: `createProject` 완료 후 modal을 닫는다.**

  생성 성공 흐름에서 `selectProject(createdProject);` 다음에 추가:

  ```tsx
  setProjectCreateModalOpen(false);
  ```

- [ ] **Step 3: 기존 `ProjectRail` props를 drawer/modal 기준으로 바꾼다.**

  교체할 props 형태:

  ```tsx
  <ProjectDrawer
    deletingProjectId={deletingProjectId}
    error={projectActionError}
    onCreateClick={() => setProjectCreateModalOpen(true)}
    onDeleteProject={deleteProject}
    onMouseEnter={() => setProjectDrawerOpen(true)}
    onProjectSelect={handleProjectSelect}
    open={projectDrawerOpen}
    projectLoadState={projectLoadState}
    projects={projects}
    selectedProjectId={selectedProjectId}
  />

  <ProjectCreateModal
    canvasPreset={newCanvasPreset}
    contentType={newContentType}
    creatingProject={creatingProject}
    name={newProjectName}
    onCanvasPresetChange={setNewCanvasPreset}
    onClose={() => setProjectCreateModalOpen(false)}
    onContentTypeChange={setNewContentType}
    onCreateProject={createProject}
    onNameChange={setNewProjectName}
    open={projectCreateModalOpen}
  />
  ```

- [ ] **Step 4: `ProjectRail`을 `ProjectDrawer`로 이름과 markup을 바꾼다.**

  drawer의 구조:

  ```tsx
  function ProjectDrawer({
    deletingProjectId,
    error,
    onCreateClick,
    onDeleteProject,
    onMouseEnter,
    onProjectSelect,
    open,
    projectLoadState,
    projects,
    selectedProjectId,
  }: ProjectDrawerProps) {
    return (
      <aside
        className="project-drawer"
        data-open={open}
        onMouseEnter={onMouseEnter}
        aria-label={labels.projectList}
      >
        <div className="project-drawer-head">
          <div>
            <p className="eyebrow">Studio</p>
            <h2>프로젝트</h2>
          </div>
          <button className="project-new-button" onClick={onCreateClick} type="button">
            + New
          </button>
        </div>
        <p className="project-drawer-status">{getProjectLoadMessage(projectLoadState, projects.length)}</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="project-row-list">
          {projects.map((project) => {
            const active = project.id === selectedProjectId;
            return (
              <div className="project-row" data-active={active} key={project.id}>
                <button
                  aria-current={active ? "page" : undefined}
                  className="project-row-main"
                  onClick={() => onProjectSelect(project.id)}
                  type="button"
                >
                  <strong>{project.name}</strong>
                  <span className="project-row-meta">
                    <StudioChip>{contentTypeLabels[project.contentType]}</StudioChip>
                    <StudioChip>{canvasPresetLabels[project.canvasPreset]}</StudioChip>
                  </span>
                </button>
                <button
                  aria-label={`${project.name} ${labels.deleteProject}`}
                  className="project-row-delete"
                  disabled={deletingProjectId === project.id}
                  onClick={() => onDeleteProject(project)}
                  type="button"
                >
                  {labels.deleteProject}
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }
  ```

- [ ] **Step 5: `ProjectCreateModal`을 추가한다.**

  modal 구조:

  ```tsx
  function ProjectCreateModal({
    canvasPreset,
    contentType,
    creatingProject,
    name,
    onCanvasPresetChange,
    onClose,
    onContentTypeChange,
    onCreateProject,
    onNameChange,
    open,
  }: ProjectCreateModalProps) {
    if (!open) {
      return null;
    }

    return (
      <div className="project-modal-backdrop" role="presentation">
        <form className="project-create-modal" onSubmit={onCreateProject}>
          <div className="project-modal-head">
            <h2>새 프로젝트 생성</h2>
            <button aria-label="닫기" className="modal-close-button" onClick={onClose} type="button">
              ×
            </button>
          </div>
          <label className="field-stack">
            {labels.projectName}
            <Input
              aria-label={labels.projectName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={labels.projectNamePlaceholder}
              value={name}
            />
          </label>
          <label className="field-stack">
            {labels.contentType}
            <Select value={contentType} onValueChange={(value) => onContentTypeChange(value as ContentType)}>
              <SelectTrigger aria-label={labels.contentType}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comic">{labels.comic}</SelectItem>
                <SelectItem value="card-news">{labels.cardNews}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="field-stack">
            {labels.canvas}
            <Select value={canvasPreset} onValueChange={(value) => onCanvasPresetChange(value as CanvasPreset)}>
              <SelectTrigger aria-label={labels.canvas}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="4:5">4:5</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="project-modal-actions">
            <Button onClick={onClose} type="button" variant="secondary">
              취소
            </Button>
            <Button disabled={creatingProject || name.trim().length === 0} type="submit">
              {creatingProject ? labels.addingProject : "생성"}
            </Button>
          </div>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 6: drawer/modal CSS를 추가하고 inline form CSS를 제거 대상에서 분리한다.**

  핵심 규격:

  ```css
  .project-drawer {
    background: #f2f3f5;
    border-right: 1px solid var(--app-border);
    bottom: 0;
    left: 72px;
    padding: 28px 18px;
    position: fixed;
    top: 0;
    transform: translateX(-100%);
    transition: transform 180ms ease;
    width: 280px;
    z-index: 30;
  }

  .project-drawer[data-open="true"],
  .app-side-rail:has(.app-side-link[href="/projects"]:hover) + .app-main .project-drawer {
    transform: translateX(0);
  }

  .project-create-modal {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: var(--app-shadow-card);
    display: grid;
    gap: 18px;
    padding: 28px;
    width: min(420px, calc(100vw - 40px));
  }
  ```

  CSS selector `:has()`는 필수로 의존하지 않는다. React state의 `data-open`이 primary 동작이다.

- [ ] **Step 7: 검증한다.**

  ```powershell
  npm run typecheck
  npm run lint
  ```

  기대 결과: 두 명령 모두 error 0.

- [ ] **Step 8: 커밋한다.**

  ```powershell
  git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
  git commit -m "Add project drawer and create modal" -m "Moves New into the project drawer, replaces inline project creation with a rounded modal, and keeps project row delete on hover." -m "Constraint: project API and database schema unchanged." -m "Tested: npm run typecheck; npm run lint." -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
  ```

수용 기준:

- `New`는 기본 side rail에 없다.
- 프로젝트 drawer 안에만 `+ New`가 있다.
- `+ New` 클릭 시 radius 있는 modal이 열린다.
- 프로젝트 생성 후 modal이 닫히고 생성된 프로젝트가 선택된다.
- 프로젝트 목록은 카드가 아니라 row list로 보인다.

---

## Task 3: Workbench 본문을 카드가 아닌 분할형 구조로 재정렬

**Files:**

- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: Workbench 최상위 markup을 `page-shell` 중심에서 split-only shell로 바꾼다.**

  현재:

  ```tsx
  <section className="split-layout workspace-layout studio-workbench-layout" aria-label={labels.workbenchAria}>
  ```

  변경:

  ```tsx
  <section className="studio-workbench-shell" aria-label={labels.workbenchAria}>
    <div className="studio-workbench-head">
      ...
    </div>
    <div className="studio-workbench-grid">
      ...
    </div>
  </section>
  ```

- [ ] **Step 2: Workbench head를 `ProductionPanel` 밖으로 끌어올린다.**

  head에 표시:

  ```tsx
  <p className="eyebrow">{labels.workbench}</p>
  <h1>{projectName || labels.selectProject}</h1>
  <span className="project-context-chips">
    <StudioChip>{contentTypeLabels[contentType]}</StudioChip>
    <StudioChip>{canvasPresetLabels[canvasPreset]}</StudioChip>
    <StudioChip>{getSaveLabel(saveState)}</StudioChip>
  </span>
  {selectedProject ? (
    <button className="workbench-delete-button" onClick={() => deleteProject(selectedProject)} type="button">
      {labels.deleteProject}
    </button>
  ) : null}
  ```

- [ ] **Step 3: `ProductionPanel`에서는 head를 제거하고 실제 입력 영역만 남긴다.**

  `ProductionPanelProps`에서 `projectName`, `saveState`, `canvasPreset`, `contentType`가 head 전용으로만 쓰이면 제거한다.

- [ ] **Step 4: 본문 grid는 `컷 수 / 컷 세부설정 / 이미지 미리보기` 3분할로 구성한다.**

  적용 형태:

  ```tsx
  <div className="studio-workbench-grid">
    <CutList ... />
    <ProductionPanel ... />
    <ImagePreviewPanel ... />
  </div>
  ```

  `ProductionPanel` 안의 `production-detail-grid`는 제거한다.

- [ ] **Step 5: 미리보기는 head 아래에만 위치하게 한다.**

  `ImagePreviewPanel`은 `studio-workbench-grid` 세 번째 열로 이동하고, CSS에서 margin/pull-up/negative positioning을 사용하지 않는다.

- [ ] **Step 6: split-only CSS를 적용한다.**

  핵심 규격:

  ```css
  .studio-workbench-shell {
    margin: 0 auto;
    max-width: 1180px;
    padding: 80px 32px 56px;
  }

  .studio-workbench-grid {
    align-items: start;
    display: grid;
    gap: 28px;
    grid-template-columns: minmax(140px, 180px) minmax(320px, 1fr) minmax(320px, 420px);
  }

  .production-cut-list,
  .production-panel,
  .image-preview-panel {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }
  ```

- [ ] **Step 7: 기존 카드형 Workbench class 사용을 제거한다.**

  제거 대상:

  - `.split-layout`를 Workbench shell layout에 의존하는 사용
  - `.split-content`를 Workbench card처럼 쓰는 사용
  - `.workspace-layout`를 Workbench grid로 쓰는 사용
  - `.project-rail-form`
  - `.project-rail`

- [ ] **Step 8: 검증한다.**

  ```powershell
  npm run typecheck
  npm run lint
  ```

  기대 결과: 두 명령 모두 error 0.

- [ ] **Step 9: 커밋한다.**

  ```powershell
  git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
  git commit -m "Restructure workbench split layout" -m "Moves the workbench head above the editor grid and lays out cut count, cut settings, and image preview as split columns instead of cards." -m "Constraint: keep Gemini, cut persistence, and export behavior unchanged." -m "Tested: npm run typecheck; npm run lint." -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
  ```

수용 기준:

- 본문은 카드형 panel 반복이 아니라 세로 분할과 열 분할로 보인다.
- 전체 컨테이너는 1180px 기준이다.
- Workbench head 아래에 입력 영역과 미리보기가 있다.
- 프로젝트 삭제는 Workbench head 보조 액션으로 보인다.

---

## Task 4: 단일 Chip Component와 컷 목록 시각 규칙 정리

**Files:**

- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: `StudioChip` className을 `.ui-chip`로 바꾼다.**

  ```tsx
  function StudioChip({ children }: StudioChipProps) {
    return <span className="ui-chip">{children}</span>;
  }
  ```

- [ ] **Step 2: `.studio-chip` CSS를 `.ui-chip`로 이동하고 `.studio-chip` 사용을 제거한다.**

  단일 chip CSS:

  ```css
  .ui-chip {
    align-items: center;
    background: rgba(0, 113, 227, 0.1);
    border: 0;
    border-radius: 999px;
    color: var(--app-blue);
    display: inline-flex;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    min-height: 24px;
    padding: 0 8px;
    white-space: nowrap;
  }
  ```

- [ ] **Step 3: eyebrow 전역 규칙을 14px regular로 고정한다.**

  ```css
  .eyebrow {
    color: var(--app-text-secondary);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.4;
    margin: 0;
    text-transform: none;
  }
  ```

- [ ] **Step 4: 컷 수 텍스트 규칙을 맞춘다.**

  ```css
  .cut-count-stepper span,
  .cut-count-stepper strong,
  .cut-ready-label {
    font-size: 16px;
    font-weight: 500;
  }
  ```

- [ ] **Step 5: 컷 수 `+`, `-`는 border 없는 icon-only로 유지한다.**

  ```css
  .cut-count-stepper button {
    background: transparent;
    border: 0;
    box-shadow: none;
    color: var(--app-blue);
    height: 32px;
    width: 32px;
  }
  ```

- [ ] **Step 6: 컷 목록 row에서 부제목이 렌더링되지 않는지 확인한다.**

  유지할 형태:

  ```tsx
  <button className="cut-row" ...>
    <strong>#{cut.position} {getCutTitle(cut)}</strong>
  </button>
  ```

- [ ] **Step 7: placeholder 색상을 입력값보다 낮은 대비로 맞춘다.**

  ```css
  input::placeholder,
  textarea::placeholder {
    color: #a8a8ae;
  }
  ```

- [ ] **Step 8: 검증한다.**

  ```powershell
  npm run typecheck
  npm run lint
  ```

  기대 결과: 두 명령 모두 error 0.

- [ ] **Step 9: 커밋한다.**

  ```powershell
  git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
  git commit -m "Unify workbench metadata chips" -m "Consolidates metadata chips into one ui-chip style and tightens cut count, eyebrow, placeholder, and cut row rules." -m "Constraint: visual-only cleanup; no data or provider behavior changes." -m "Tested: npm run typecheck; npm run lint." -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
  ```

수용 기준:

- chip은 `.ui-chip` 한 형태로만 관리된다.
- chip마다 다른 radius, shadow, border가 없다.
- eyebrow는 14px regular로 통일된다.
- 컷 목록에는 이미지 상태 부제목이 없다.

---

## Task 5: 이미지 생성 UX와 미리보기 위치를 최신 스펙에 맞게 고정

**Files:**

- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: `이미지 생성` 버튼이 `이미지 프롬프트` 아래에만 있는지 확인한다.**

  유지할 구조:

  ```tsx
  <label className="field-stack">
    {labels.imagePrompt}
    <textarea ... />
  </label>
  <div className="editor-action-row">
    <Button ...>{labels.generateImage}</Button>
  </div>
  ```

- [ ] **Step 2: `ImagePreviewPanel`에 자막/대사 렌더링이 없는지 확인한다.**

  유지할 구조:

  ```tsx
  <div className={`image-preview-canvas ${getCanvasRatioClass(canvasPreset)}`}>
    {hasImage ? <div className="image-preview-art" /> : null}
    {!hasImage ? <p>{labels.imagePreviewPlaceholder}</p> : null}
  </div>
  ```

- [ ] **Step 3: 미리보기 placeholder를 회색 background로만 표현한다.**

  ```css
  .image-preview-canvas {
    background: #ededf0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
  ```

- [ ] **Step 4: export용 hidden canvas는 기존 HTML/CSS 레이어를 유지한다.**

  유지:

  - `CutExportCanvas`
  - `downloadCurrentCut`
  - `downloadAllCutsZip`
  - `createCutHtmlDocument`

- [ ] **Step 5: `한 번에 제작`은 카드뉴스에서만 보이게 유지한다.**

  유지할 조건:

  ```tsx
  const isCardNews = selectedProject?.contentType === "card-news";
  {isCardNews ? <section className="full-scenario-panel">...</section> : null}
  ```

- [ ] **Step 6: Gemini 자동 호출이 없는지 확인한다.**

  확인 기준:

  - `generateSelectedCutImage`는 버튼 클릭 handler에서만 호출된다.
  - `buildCardNewsInOnePass`는 `한 번에 제작` 버튼 클릭 handler에서만 호출된다.
  - `useEffect` 안에서 Gemini route를 호출하지 않는다.

- [ ] **Step 7: 검증한다.**

  ```powershell
  npm run typecheck
  npm run lint
  ```

  기대 결과: 두 명령 모두 error 0.

- [ ] **Step 8: 커밋한다.**

  ```powershell
  git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
  git commit -m "Align workbench generation preview UX" -m "Keeps generation actions in the input column and preserves an image-only preview while export canvases retain text layers." -m "Constraint: no automatic provider calls and no API key persistence changes." -m "Tested: npm run typecheck; npm run lint." -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
  ```

수용 기준:

- 당시 수용 기준이었던 "대사와 자막은 미리보기 화면에 보이지 않는다"는 폐기되었다.
- 현재 기준에서 자막은 미리보기와 export에 HTML/CSS 레이어로 표시된다.
- 현재 기준에서 대사는 HTML 오버레이로 표시하지 않고, 사용자가 입력한 문구에 한해 생성 이미지 안 말풍선/대사 표현으로 반영할 수 있다.
- 이미지 미리보기는 회색 placeholder, 생성/업로드 이미지, 자막 레이어를 함께 다룬다.
- export 기능은 기존 HTML/CSS 텍스트 레이어 호환을 유지한다.

---

## Task 6: 반응형, 브라우저 QA, 최종 커밋

**Files:**

- Modify: `apps/studio/app/styles.css`
- Modify: `apps/studio/components/studio/studio-workbench.tsx`

- [ ] **Step 1: 데스크톱 layout을 1180px 컨테이너로 확인한다.**

  CSS 기준:

  ```css
  .studio-workbench-shell {
    max-width: 1180px;
  }
  ```

- [ ] **Step 2: 1180px 이하에서 grid가 자연스럽게 2열 또는 1열로 접히게 한다.**

  ```css
  @media (max-width: 1180px) {
    .studio-workbench-grid {
      grid-template-columns: minmax(150px, 200px) minmax(0, 1fr);
    }

    .image-preview-panel {
      grid-column: 2;
    }
  }
  ```

- [ ] **Step 3: 760px 이하에서 모든 영역을 세로로 쌓는다.**

  ```css
  @media (max-width: 760px) {
    .app-main {
      padding-left: 0;
      padding-top: 72px;
    }

    .app-side-rail {
      bottom: auto;
      flex-direction: row;
      height: 72px;
      right: 0;
      width: auto;
    }

    .project-drawer {
      left: 0;
      top: 72px;
      width: min(320px, 100vw);
    }

    .studio-workbench-grid {
      grid-template-columns: 1fr;
    }

    .image-preview-panel {
      grid-column: auto;
    }
  }
  ```

- [ ] **Step 4: 정적 검증을 실행한다.**

  ```powershell
  npm run typecheck
  npm run lint
  npm run build
  ```

  기대 결과: 세 명령 모두 error 0.

- [ ] **Step 5: 개발 서버를 4001 포트로 실행한다.**

  ```powershell
  npm run dev -- --port 4001
  ```

  기대 결과: `http://127.0.0.1:4001`에서 Next dev server가 열린다.

- [ ] **Step 6: 브라우저에서 `/projects`를 검증한다.**

  확인 항목:

  - console error 0
  - side rail에 로고 자리, 수평 라인, `프로젝트`, `에셋` 표시
  - side rail에 `New` 없음
  - 프로젝트 drawer에 `+ New` 표시
  - `+ New` 클릭 시 modal 표시
  - modal radius 적용
  - 프로젝트 row는 카드처럼 보이지 않음
  - chip 형태가 모두 동일

- [ ] **Step 7: 브라우저에서 `/workspace/[projectId]`를 검증한다.**

  확인 항목:

  - deep link가 같은 Workbench를 열고 해당 프로젝트를 선택
  - Workbench head 아래에 세 분할 영역 표시
  - 미리보기가 head 영역 위로 올라오지 않음
  - 카드뉴스에서 전체 시나리오와 `한 번에 제작` 표시
  - 인스타툰에서 전체 시나리오 영역 미노출
  - `이미지 생성` 버튼이 이미지 프롬프트 아래에 있음
  - preview에 HTML/CSS 자막 레이어 표시
  - 대사 HTML 오버레이 없음

- [ ] **Step 8: 브라우저에서 `/assets`를 검증한다.**

  확인 항목:

  - side rail이 assets route에서도 보임
  - `에셋` 메뉴 active state 표시
  - 기존 Assets 세부 메뉴와 입력 화면이 깨지지 않음

- [ ] **Step 9: 최종 커밋한다.**

  최종 QA 중 CSS 보정이 발생했을 때만 실행:

  ```powershell
  git add apps/studio/app/styles.css apps/studio/components/studio/studio-workbench.tsx
  git commit -m "Polish workbench responsive layout" -m "Finalizes responsive side rail, project drawer, split workbench, and image preview layout after browser QA." -m "Constraint: visual and layout polish only; project data, provider routes, and export structure unchanged." -m "Tested: npm run typecheck; npm run lint; npm run build; browser QA on /projects, /workspace/[projectId], and /assets." -m "Co-authored-by: OmX <omx@oh-my-codex.dev>"
  ```

수용 기준:

- 데스크톱과 모바일 폭에서 UI 요소가 겹치지 않는다.
- console error가 없다.
- provider 호출은 사용자 클릭 없이는 발생하지 않는다.
- API key가 파일, DB, git diff, 로그에 남지 않는다.
- export PNG/ZIP 액션이 유지된다.

---

## Self-Review

- 스펙의 카드형 UI 금지는 Task 3과 Task 6에서 분할형 layout으로 반영한다.
- 사이드바 로고 자리와 로고 아래 수평 라인은 Task 1에서 반영한다.
- `New`를 side rail에서 제거하고 프로젝트 drawer 안으로 이동하는 요구는 Task 2에서 반영한다.
- 생성 modal radius 요구는 Task 2에서 `12px` modal로 반영한다.
- chip 단일화 요구는 Task 4에서 `.ui-chip` 단일 규격으로 반영한다.
- 전체 시나리오는 카드뉴스에서만 보이고 Gemini 호출은 명시 클릭에서만 수행한다는 요구는 Task 5에서 검증한다.
- `/projects`, `/workspace/[projectId]`, `/assets` 검증은 Task 6에 포함한다.
- 데이터 모델, DB schema, API route, export 구조는 수정 대상에서 제외했다.
