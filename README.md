# Local Comic Card Studio

로컬 PC에서 실행하는 인스타툰/카드뉴스 제작 스튜디오입니다. 프로젝트를 만들고, 컷별 시나리오·자막·대사·이미지 프롬프트를 편집한 뒤 HTML/CSS 미리보기를 PNG 또는 ZIP으로 내보낼 수 있습니다.

## 주요 기능

- 로컬 프로젝트 생성, 목록 조회, 삭제
- 인스타툰/카드뉴스 콘텐츠 유형 선택
- `1:1`, `4:5`, `9:16` 캔버스 프리셋
- 전체 시나리오 기반 컷 초안 생성
- 컷별 자막, 대사, 이미지 프롬프트, 네거티브 프롬프트 편집
- mock 이미지 또는 업로드 이미지 적용
- HTML/CSS 기반 컷 미리보기
- 현재 컷 PNG 다운로드
- 전체 컷 ZIP 다운로드
- 캐릭터 Markdown, 표정 이미지, 배경, 폰트 로컬 설정
- mock/Gemini provider 설정 화면

## 기술 스택

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn UI / Radix UI
- Hugeicons
- SQLite (`better-sqlite3`)
- Zod
- `html-to-image`
- `jszip`

## 실행 방법

의존성 설치:

```bash
npm install
```

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 접속:

```text
http://127.0.0.1:3000
```

`package.json`의 dev/start 스크립트는 `127.0.0.1:3000`에 바인딩되어 있습니다.

## 검증 명령어

타입 체크:

```bash
npm run typecheck
```

린트:

```bash
npm run lint
```

프로덕션 빌드:

```bash
npm run build
```

테스트 스크립트는 아직 없습니다. `npm test`는 현재 `package.json`에 정의되어 있지 않습니다.

## 디렉터리 구조

```text
app/                      Next.js App Router 페이지, 레이아웃, 전역 CSS, API route
app/api/projects/         프로젝트/컷 CRUD와 reorder API
components/               React 컴포넌트
components/ui/            shadcn/Radix 기반 UI 컴포넌트
components/projects/      프로젝트 목록, 생성, 삭제 UI
components/workspace/     컷 편집기, 미리보기, PNG/ZIP export
lib/db/                   SQLite 연결과 마이그레이션
lib/projects/             프로젝트 타입과 repository
lib/cuts/                 컷 타입과 repository
docs/                     PRD 생성/검증 보조 문서
data/                     로컬 SQLite 런타임 데이터
artifacts/                브라우저 QA 스크린샷/다운로드 산출물
```

## 로컬 데이터

- SQLite 데이터베이스는 `data/app.db`에 저장됩니다.
- `data/`는 사용자 작업 데이터로 간주합니다.
- 임의로 삭제하거나 초기화하지 마세요.
- `artifacts/`는 검증용 산출물이며 일반적으로 커밋하지 않습니다.

## 제품 문서

- 요구사항: [PRD.md](PRD.md)
- 개발 로드맵: [ROADMAP.md](ROADMAP.md)
- 디자인 참고: [DESIGN.md](DESIGN.md)
- 에이전트 작업 규칙: [AGENTS.md](AGENTS.md)

## AI / 이미지 생성 정책

- 기본 제작 흐름은 외부 API 없이 mock provider와 업로드 이미지로 동작해야 합니다.
- Gemini API는 선택 provider입니다.
- Google 로그인만으로 유료 API 사용을 우회하는 기능은 제공하지 않습니다.
- 최종 텍스트는 이미지 안에 굽지 않고 HTML/CSS 자막·대사 레이어로 렌더링하는 방향을 우선합니다.

## 현재 확인 필요

- 공식 테스트 러너와 `npm test` 스크립트
- Playwright E2E 테스트를 저장소 표준으로 둘지 여부
- Gemini provider의 실제 모델명, 과금, 쿼터, 인증 방식
- 로컬 전용 외 배포 정책
