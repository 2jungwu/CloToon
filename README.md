# Local Comic Card Studio

로컬 PC에서 실행하는 인스타툰/카드뉴스 제작 스튜디오입니다. 프로젝트를 만들고, 컷별 시나리오·자막·대사·이미지 프롬프트를 편집하고, HTML/CSS 컷 미리보기를 PNG 또는 ZIP으로 내보냅니다.

## Monorepo Structure

이 저장소는 npm workspaces 기반 모노레포입니다.

```text
apps/studio/              Next.js App Router 애플리케이션
apps/studio/app/          페이지, 레이아웃, 전역 CSS, API route
apps/studio/components/   공유 React 컴포넌트와 UI 래퍼
apps/studio/lib/          SQLite repository, 도메인 타입, 유틸
docs/                     PRD 생성/검증 보조 문서
data/                     로컬 SQLite 데이터와 로컬 자산
artifacts/                브라우저 QA 스크린샷과 다운로드 검증 산출물
```

루트 `package.json`은 워크스페이스 실행용 스크립트를 제공하고, 실제 앱 의존성과 Next.js 설정은 `apps/studio/` 아래에 있습니다.

## Commands

의존성 설치:

```bash
npm install
```

개발 서버 실행:

```bash
npm run dev
```

브라우저 접속:

```text
http://127.0.0.1:3000
```

검증 명령:

```bash
npm run typecheck
npm run lint
npm run build
```

현재 `npm test` 스크립트는 없습니다.

## Local Data

- SQLite 데이터베이스는 루트 `data/app.db`에 저장됩니다.
- `apps/studio`에서 앱이 실행되어도 루트 `data/`를 사용합니다.
- `LOCAL_STUDIO_DATA_DIR` 환경 변수를 지정하면 별도 데이터 디렉터리를 사용할 수 있습니다.
- `data/`는 사용자 작업 데이터로 취급하며, 요청 없이 삭제하거나 초기화하지 않습니다.

## Product Docs

- 요구사항: [PRD.md](PRD.md)
- 개발 계획: [ROADMAP.md](ROADMAP.md)
- 디자인 기준: [DESIGN.md](DESIGN.md)
- 에이전트 작업 규칙: [AGENTS.md](AGENTS.md)
