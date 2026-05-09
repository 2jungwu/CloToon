# Studio Workbench 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 구현할 때는 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 단계 추적은 checkbox 문법(`- [ ]`)을 사용한다.

**목표:** `Projects`와 `Workspace`를 하나의 Linear Studio 스타일 Workbench로 통합한다.

**아키텍처:** 새 client component `apps/studio/components/studio/studio-workbench.tsx`를 추가해 프로젝트 선택, 프로젝트 생성/삭제, 컷 목록, 컷별 입력, Gemini 이미지 생성, preview, export orchestration을 담당한다. 기존 DB schema, 기존 프로젝트/컷 API, 기존 Assets localStorage 구조는 유지한다. `/projects`와 `/workspace/[projectId]`는 같은 Workbench를 렌더링하며, `/workspace/[projectId]`는 해당 프로젝트를 선택한 deep link로 동작한다.

**기술 스택:** Next.js App Router, React, TypeScript strict mode, 기존 shadcn/Radix UI wrapper, SQLite-backed JSON API, Gemini image route, `html-to-image`, `jszip`, Tailwind CSS v4, `apps/studio/app/styles.css`.

---

## 현재 상태와 주의사항

- 현재 작업 트리에 이전 UI 수정이 남아 있을 수 있다.
  - `apps/studio/app/styles.css`
  - `apps/studio/components/projects/project-list.tsx`
  - `apps/studio/components/workspace/workspace-editor.tsx`
- 해당 변경은 되돌리지 않는다.
- `.superpowers/`와 `output/`은 사용자가 명시하지 않으면 커밋하지 않는다.
- API key는 계속 브라우저 `localStorage`와 요청 처리 중에만 사용한다.
- `한 번에 제작`은 사용자가 누를 때만 실행한다.
- `한 번에 제작`은 Gemini 호출을 병렬로 보내지 않고 순차 처리한다.
- Genspark식 preview 요소 선택 편집은 v2 범위이며 이번 구현에서 제외한다.

## 변경 파일 구조

생성:

- `apps/studio/components/studio/studio-workbench.tsx`
  - Workbench 전체 상태와 orchestration 담당
  - 내부 subcomponent: `ProjectRail`, `StudioChip`, `ProductionPanel`, `CutList`, `CutEditor`, `ImagePreviewPanel`, `CutExportCanvas`

수정:

- `apps/studio/app/projects/page.tsx`
  - 기존 `ProjectList` 화면 대신 `StudioWorkbench` 렌더링
- `apps/studio/app/workspace/[projectId]/page.tsx`
  - 기존 Workspace 상세 UI 대신 `StudioWorkbench initialProjectId={projectId}` 렌더링
- `apps/studio/components/app-nav.tsx`
  - `/projects` label을 `Studio`로 변경
- `apps/studio/app/styles.css`
  - Linear Studio workbench layout, chip, hover delete, icon-only stepper, image-only preview, responsive style 추가

유지:

- `apps/studio/components/projects/project-list.tsx`
- `apps/studio/components/workspace/workspace-editor.tsx`

위 두 파일은 route 교체 후 바로 삭제하지 않는다. 검증 완료 후 별도 정리 대상으로 둔다.

---

## Task 1: Workbench Shell과 라우팅 연결

**파일:**

- 생성: `apps/studio/components/studio/studio-workbench.tsx`
- 수정: `apps/studio/app/projects/page.tsx`
- 수정: `apps/studio/app/workspace/[projectId]/page.tsx`
- 수정: `apps/studio/components/app-nav.tsx`

- [ ] `StudioWorkbench` client component skeleton을 만든다.
- [ ] `Project`, `Cut`, image generation, export에 필요한 기존 타입과 helper를 import한다.
- [ ] `projects`, `selectedProjectId`, `cuts`, `selectedCutId`, `projectName`, `contentType`, `canvasPreset`, `fullScenario`, loading/save/generation/export state를 둔다.
- [ ] `/api/projects`로 프로젝트 목록을 불러오는 `loadProjects`를 구현한다.
- [ ] `/api/projects/[projectId]/cuts`로 컷 목록을 불러오는 `loadCuts`를 구현한다.
- [ ] `initialProjectId`가 있으면 해당 프로젝트를 우선 선택한다.
- [ ] `/projects`는 `StudioWorkbench`를 렌더링한다.
- [ ] `/workspace/[projectId]`는 프로젝트 존재 여부를 확인한 뒤 `StudioWorkbench initialProjectId={projectId}`를 렌더링한다.
- [ ] `AppNav`의 visible label을 `Projects`에서 `Studio`로 바꾼다.
- [ ] 검증: `npm run typecheck`
- [ ] 커밋: `Add studio workbench shell`

수용 기준:

- `/projects`와 `/workspace/[projectId]`가 같은 Workbench shell을 렌더링한다.
- `/workspace/[projectId]`는 기존처럼 없는 프로젝트에서 `notFound()` 처리한다.
- 타입 체크가 통과한다.

---

## Task 2: 왼쪽 Projects Rail 구현

**파일:**

- 수정: `apps/studio/components/studio/studio-workbench.tsx`
- 수정: `apps/studio/app/styles.css`

- [ ] `createProject` handler를 구현한다.
  - POST `/api/projects`
  - body: `{ name, contentType, canvasPreset }`
  - 성공 시 목록 앞에 추가하고 새 프로젝트를 선택한다.
- [ ] `deleteProject` handler를 구현한다.
  - 삭제 전 `window.confirm`
  - DELETE `/api/projects/[projectId]`
  - 성공 시 목록에서 제거하고 다음 프로젝트를 선택한다.
- [ ] `StudioChip` component를 추가한다.
- [ ] `ProjectRail` component를 추가한다.
- [ ] 프로젝트 검색 UI는 만들지 않는다.
- [ ] 새 프로젝트 폼은 프로젝트 이름, 콘텐츠 유형 dropdown, 캔버스 dropdown, `프로젝트 추가` 버튼으로 구성한다.
- [ ] 프로젝트 행에는 chip을 사용한다.
  - 콘텐츠 유형
  - 캔버스
  - 필요 시 컷 수
- [ ] 프로젝트 삭제 버튼은 hover/focus에서 노출한다.
- [ ] primary 색상은 블루 계열로 유지한다.
- [ ] styles.css에 rail, chip, hover delete, form style을 추가한다.
- [ ] 검증: `npm run typecheck`, `npm run lint`
- [ ] 커밋: `Build studio project rail`

수용 기준:

- 왼쪽 열에서 프로젝트 생성이 가능하다.
- 콘텐츠 유형과 캔버스가 분리된 dropdown이다.
- 프로젝트 목록은 chip metadata를 사용한다.
- 프로젝트 검색이 없다.
- hover/focus 시 삭제 버튼이 보인다.

---

## Task 3: 중앙 Production Panel 구현

**파일:**

- 수정: `apps/studio/components/studio/studio-workbench.tsx`
- 수정: `apps/studio/app/styles.css`

- [ ] `createCut`, `deleteCut`, `patchCut`, `updateSelectedCut`, `increaseCutCount`, `decreaseCutCount` helper를 구현한다.
- [ ] `ProductionPanel` component를 추가한다.
- [ ] 프로젝트 context 영역에 프로젝트 이름과 chip을 표시한다.
- [ ] 카드뉴스 프로젝트에서만 `전체 시나리오`와 `한 번에 제작`을 표시한다.
- [ ] 인스타툰 프로젝트에서는 전체 시나리오 영역을 숨긴다.
- [ ] 중앙 하단을 `CutList`와 `CutEditor`로 나눈다.
- [ ] `CutList`에 컷 수 컨트롤을 표시한다.
- [ ] 컷 수 `+`, `-`는 border 없는 icon-only control로 표시한다.
- [ ] 컷 목록 행은 `#1 첫 장면`처럼 주 정보만 표시한다.
- [ ] `생성 이미지`, `Mock 이미지`, `이미지 없음` 같은 부제목을 표시하지 않는다.
- [ ] `CutEditor`에 컷 시나리오, 자막, 대사, 이미지 프롬프트를 표시한다.
- [ ] placeholder는 충분히 읽히는 회색으로 맞춘다.
- [ ] styles.css에 중앙 panel, batch panel, cut list, cut editor style을 추가한다.
- [ ] 검증: `npm run typecheck`, `npm run lint`
- [ ] 커밋: `Build studio production panel`

수용 기준:

- 카드뉴스와 인스타툰의 노출 조건이 다르다.
- 컷 수 버튼에 border가 없다.
- 컷 목록에 이미지 상태 부제목이 없다.
- 중앙에서 컷별 입력을 편집할 수 있다.

---

## Task 4: 현재 컷 이미지 생성과 한 번에 제작 연결

**파일:**

- 수정: `apps/studio/components/studio/studio-workbench.tsx`
- 수정: `apps/studio/app/styles.css`

- [ ] `saveEditableCut` helper를 추가한다.
- [ ] `generateImageForCut` helper를 추가한다.
  - `localStorage`에서 Gemini API key 로드
  - Assets 설정 로드
  - POST `/api/images/generate`
  - 성공 시 `imageDataUrl`, `imageStatus: "generated"` 저장
  - 실패 시 사용자 메시지 표시
- [ ] `generateSelectedCutImage`를 추가한다.
- [ ] `이미지 생성` 버튼을 중앙 `이미지 프롬프트` 아래에 둔다.
- [ ] 이미지 생성 요청에는 컷 시나리오, 자막, 대사, 이미지 프롬프트가 모두 포함되게 한다.
- [ ] 자막과 대사는 이미지 안에 글자를 그리는 지시가 아니라 context로 사용한다.
- [ ] `buildCardNewsInOnePass`를 구현한다.
  - 카드뉴스에서만 동작
  - 전체 시나리오를 현재 컷 수에 맞게 분할
  - 부족한 컷 생성
  - 각 컷의 scenario/caption/dialogue/imagePrompt 저장
  - 각 컷 이미지를 Gemini route로 순차 생성
  - 진행 상태를 `n/total`로 표시
- [ ] 병렬 Gemini 호출을 만들지 않는다.
- [ ] `splitScenario`, `limitExpressionReferences`, `getImageGenerationErrorMessage`, `getStatusMessageClass` helper를 추가한다.
- [ ] styles.css에 `studio-generate-row`를 추가한다.
- [ ] 검증: `npm run typecheck`, `npm run lint`
- [ ] 커밋: `Wire studio image generation actions`

수용 기준:

- `이미지 생성`은 중앙의 이미지 프롬프트 아래에 있다.
- API key가 없으면 provider 호출 없이 안내 메시지를 표시한다.
- `한 번에 제작`은 카드뉴스에서만 보인다.
- `한 번에 제작`은 Gemini 호출을 순차로 수행한다.

---

## Task 5: 오른쪽 Image-only Preview와 Export 유지

**파일:**

- 수정: `apps/studio/components/studio/studio-workbench.tsx`
- 수정: `apps/studio/app/styles.css`

- [ ] `ImagePreviewPanel` component를 추가한다.
- [ ] 오른쪽 preview는 생성 이미지 결과만 표시한다.
- [ ] preview placeholder는 회색 텍스트로 표시한다.
- [ ] 오른쪽 preview에 자막/대사 텍스트 레이어를 표시하지 않는다.
- [ ] 오른쪽 preview에 `현재 컷 PNG`, `전체 ZIP` 액션을 둔다.
- [ ] 기존 export 호환을 위해 숨겨진 `CutExportCanvas`를 추가한다.
- [ ] 기존 `workspace-editor.tsx`의 export helper를 필요한 범위에서 복사한다.
  - `applyExportFontVariables`
  - `downloadDataUrl`
  - `downloadBlob`
  - `dataUrlToBlob`
  - `createCutHtmlDocument`
  - `safeFileName`
  - `escapeHtml`
- [ ] `downloadCurrentCut`, `downloadAllCutsZip`를 Workbench에 연결한다.
- [ ] styles.css에 image preview와 export action style을 추가한다.
- [ ] 검증: `npm run typecheck`, `npm run lint`
- [ ] 커밋: `Add studio image preview and export actions`

수용 기준:

- 오른쪽 preview는 image-only다.
- 자막과 대사는 오른쪽 preview에 노출되지 않는다.
- PNG/ZIP export는 기존 방식과 호환된다.

---

## Task 6: 반응형 스타일과 브라우저 검증

**파일:**

- 수정: `apps/studio/app/styles.css`
- 필요 시 수정: `apps/studio/components/studio/studio-workbench.tsx`

- [ ] 데스크톱 3열 layout을 안정화한다.
- [ ] 1180px 이하에서 preview가 아래로 내려가도록 조정한다.
- [ ] 760px 이하에서 Projects, Production Input, Preview를 세로로 쌓는다.
- [ ] 모바일에서 가로 overflow가 없도록 한다.
- [ ] chip, 버튼, 긴 한국어 텍스트가 겹치지 않게 한다.
- [ ] 정적 검증을 실행한다.
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- [ ] 브라우저 검증을 실행한다.
  - `http://127.0.0.1:4001/projects`
  - `http://127.0.0.1:4001/workspace/[projectId]`
  - `http://127.0.0.1:4001/assets`
- [ ] 데스크톱 확인 기준:
  - console error 0
  - nav는 `Studio`, `Assets`
  - `/projects`에서 3열 Workbench 표시
  - 프로젝트 검색 없음
  - 프로젝트 추가 form의 콘텐츠 유형/캔버스 dropdown 분리
  - 프로젝트 목록 chip 표시
  - 프로젝트 삭제 hover/focus 표시
  - 카드뉴스에서 `전체 시나리오`, `한 번에 제작` 표시
  - 인스타툰에서 full scenario batch 영역 미노출
  - 컷 수 `+`, `-` border 없음
  - 컷 목록 부제목 없음
  - `이미지 생성`이 중앙 `이미지 프롬프트` 아래 있음
  - 오른쪽 preview에 자막/대사 텍스트 없음
  - preview placeholder 회색 가독성 확보
- [ ] 모바일 확인 기준:
  - horizontal overflow 없음
  - 세 영역이 자연스럽게 stacked layout으로 전환
  - icon-only cut control이 터치 가능
- [ ] Gemini 실제 호출은 사용자가 명시하지 않는 한 하지 않는다.
- [ ] API key가 없는 상태에서 `이미지 생성`을 눌렀을 때 provider 호출 없이 API key 필요 메시지가 보이는지 확인한다.
- [ ] 최종 커밋: `Refine studio workbench responsive UI`

수용 기준:

- 정적 검증이 모두 통과한다.
- 브라우저 검증에서 console error가 없다.
- 데스크톱/모바일에서 텍스트와 버튼이 겹치지 않는다.

---

## 자체 점검

설계 반영:

- 단일 Workbench: Task 1
- 프로젝트 rail: Task 2
- 중앙 제작 입력: Task 3
- 이미지 생성과 한 번에 제작: Task 4
- image-only preview와 export: Task 5
- 반응형과 브라우저 검증: Task 6

범위 제외:

- Genspark식 직접 preview 요소 편집은 v2로 유지한다.
- 다크 모드는 제외한다.
- DB schema와 localStorage key는 바꾸지 않는다.

리스크:

- `한 번에 제작`은 컷 수만큼 Gemini를 순차 호출하므로 실제 호출은 비용/쿼터를 고려해야 한다.
- 기존 export는 HTML/CSS layer를 유지한다. 화면 preview는 image-only지만 export까지 image-only로 바꾸려면 별도 제품 결정이 필요하다.
