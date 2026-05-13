# CloToon Local Studio

로컬 PC에서 실행하는 인스타툰/카드뉴스 제작 스튜디오입니다. 프로젝트를 만들고, 컷별 시나리오, 자막, 대사, 이미지 프롬프트를 편집한 뒤 HTML/CSS 기반 컷 미리보기를 PNG 또는 ZIP으로 내보냅니다.

현재 앱은 local-first 제품입니다. 프로젝트와 컷 데이터는 루트 `data/app.db`에 저장하고, 캐릭터/배경/폰트/자막 스타일/API Key/내보내기 설정은 브라우저 `localStorage`에 저장합니다. Gemini 이미지 생성은 사용자가 API Key를 등록하고 워크스페이스에서 명시적으로 `이미지 생성`을 누를 때만 실행됩니다.

## 현재 구조

이 저장소는 npm workspaces 기반 모노레포입니다.

```text
apps/studio/              실제 Next.js App Router 애플리케이션
apps/studio/app/          페이지, 레이아웃, 전역 CSS, API route
apps/studio/components/   공유 React 컴포넌트와 UI 래퍼
apps/studio/lib/          SQLite repository, 도메인 타입, Gemini prompt 유틸
apps/studio/test/         Node test runner용 별칭 로더
docs/                     이미지 생성 규칙, PRD 보조 문서, 과거 작업 기록
data/                     로컬 SQLite 데이터와 로컬 자산
artifacts/                과거 QA 산출물, 커밋 제외
output/                   현재 검증 산출물, 커밋 제외
```

루트 `package.json`은 워크스페이스 실행용 스크립트를 제공하고, 실제 앱 의존성과 Next.js 설정은 `apps/studio/` 아래에 있습니다.

## 실행

루트에서 실행합니다.

```bash
npm install
npm run dev
```

기본 개발 서버:

```text
http://127.0.0.1:3000
```

주요 화면:

- `/projects`: 프로젝트 목록, 생성, 삭제, 워크스페이스 진입
- `/workspace/[projectId]`: 컷 편집, 자막 레이어 편집, 이미지 생성, PNG/ZIP 내보내기
- `/assets`: 캐릭터, 배경, 폰트, 자막 스타일, API Key, 내보내기 설정
- `/settings`: 기존 북마크 호환용 `/assets?section=api-key` 리다이렉트

## 검증

루트에서 실행합니다.

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

현재 `npm run test`는 `apps/studio`의 Node test runner 기반 단위 테스트를 실행합니다. 표준 Playwright/E2E 스크립트는 없으며, 브라우저 검증이 필요하면 로컬 서버에서 수동 또는 임시 Playwright 검증을 사용합니다.

## 현재 구현 기준

- 앱 내비게이션은 좌측 side rail이며 `프로젝트`, `에셋`만 노출합니다.
- `Settings`는 별도 설정 화면이 아니라 `Assets`의 API Key 섹션으로 통합되었습니다.
- 컷 미리보기와 export는 자막을 HTML/CSS 레이어로 렌더링합니다.
- 자막 레이어 편집은 글자 색상, 크기, 굵게/기울임/밑줄, 정렬, 박스 배경, 테두리, 선 두께, 모서리, 안쪽여백 X/Y, 너비 모드를 지원합니다.
- Assets의 `자막 스타일` 기본값은 앞으로 생성하는 새 컷에 자동 적용되며, 기존 컷은 Workspace의 `기본 스타일 적용` 액션으로만 변경합니다.
- 대사는 HTML 오버레이로 중복 렌더링하지 않고, Gemini 이미지 생성 시 사용자가 입력한 문구에 한해 이미지 안 말풍선/대사 표현으로 반영할 수 있습니다.
- Gemini API Key는 브라우저 `localStorage`에서만 보관하고, 코드/DB/문서/로그/git에 저장하지 않습니다.

## 로컬 데이터

- SQLite 데이터베이스는 루트 `data/app.db`에 저장됩니다.
- `apps/studio`에서 앱이 실행되어도 루트 `data/`를 사용합니다.
- `LOCAL_STUDIO_DATA_DIR` 환경 변수를 지정하면 별도 데이터 디렉터리를 사용할 수 있습니다.
- `data/`는 사용자 작업 데이터로 취급하며, 요청 없이 삭제하거나 초기화하지 않습니다.

## 문서

- 요구사항: [PRD.md](PRD.md)
- 개발 계획: [ROADMAP.md](ROADMAP.md)
- 디자인 기준: [DESIGN.md](DESIGN.md)
- 이미지 생성 규칙: [docs/IMAGE_GENERATION.md](docs/IMAGE_GENERATION.md)
- 에이전트 작업 규칙: [AGENTS.md](AGENTS.md)
- 과거 작업 기록: [docs/superpowers](docs/superpowers)
