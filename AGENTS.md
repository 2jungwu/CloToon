# AGENTS.md

## Project Overview

- 이 저장소는 로컬 PC에서 실행하는 인스타툰/카드뉴스 제작 스튜디오입니다.
- 사용자는 프로젝트를 만들고, 컷별 시나리오, 자막, 대사, 이미지 프롬프트를 편집하고, HTML/CSS 컷 미리보기를 PNG/ZIP으로 내보냅니다.
- 제품 요구사항은 `PRD.md`, 개발 계획은 `ROADMAP.md`, 디자인 기준은 `DESIGN.md`를 참고합니다.
- 현재 구조는 npm workspaces 기반 모노레포이며 실제 앱은 `apps/studio`에 있습니다.

## Tech Stack

- 모노레포: npm workspaces
- 앱 프레임워크: Next.js App Router (`apps/studio/app`), React, TypeScript
- 스타일링: Tailwind CSS v4, `apps/studio/app/styles.css`, shadcn UI, Radix UI, Hugeicons
- 데이터 저장: 로컬 SQLite (`better-sqlite3`), 루트 `data/app.db`
- 브라우저 설정 저장: `localStorage`
- API 검증: `zod`
- 내보내기: `html-to-image`, `jszip`
- 패키지 매니저: npm (`package-lock.json` 기준)

## Commands

루트에서 실행합니다.

- 의존성 설치: `npm install`
- 개발 서버 실행: `npm run dev`
- 프로덕션 빌드: `npm run build`
- 린트: `npm run lint`
- 타입 체크: `npm run typecheck`
- 테스트: 현재 루트 `package.json`에 `test` 스크립트가 없습니다.
- 브라우저/E2E 테스트: 표준 스크립트는 없고, 필요 시 Playwright를 임시 검증에 사용합니다.

## Directory Map

- `apps/studio/`: 실제 Next.js 애플리케이션
- `apps/studio/app/`: 페이지, 레이아웃, 전역 CSS, API route handler
- `apps/studio/app/api/projects/`: 프로젝트, 컷, 순서 변경, 수정, 삭제를 위한 로컬 JSON API
- `apps/studio/app/api/images/generate/`: Gemini 이미지 생성을 위한 로컬 API route
- `apps/studio/components/`: 공유 React 컴포넌트
- `apps/studio/components/ui/`: shadcn/Radix UI 래퍼 컴포넌트
- `apps/studio/components/projects/`: 프로젝트 목록, 생성, 삭제 UI
- `apps/studio/components/workspace/`: 컷 편집기, HTML 미리보기, mock 이미지, 업로드, PNG/ZIP export
- `apps/studio/lib/db/`: SQLite 연결과 마이그레이션
- `apps/studio/lib/projects/`: 프로젝트 타입과 repository 함수
- `apps/studio/lib/cuts/`: 컷 타입과 repository 함수
- `apps/studio/lib/image-generation/`: Gemini prompt 조합, localStorage 로드, 이미지 생성 타입
- `docs/`: PRD 생성/검증 보조 문서와 이미지 생성 규칙 문서
- `data/`: 로컬 런타임 SQLite 데이터. 사용자 데이터로 취급합니다.
- `artifacts/`: 과거 스크린샷과 다운로드 검증 산출물. 사용자가 요청하지 않으면 커밋하지 않습니다.
- `output/`: 현재 검증 산출물. 사용자가 요청하지 않으면 커밋하지 않습니다.

## Agent Working Rules

- 사용자가 요청한 변경만 수행합니다.
- 요청과 무관한 리팩터링을 하지 않습니다.
- 수정 전에 관련 파일과 주변 패턴을 먼저 확인합니다.
- 더러운 작업 트리에서 사용자 또는 이전 에이전트 변경을 되돌리지 않습니다.
- import는 `apps/studio/tsconfig.json`과 `apps/studio/components.json`에 맞춰 `@/*` 별칭을 사용합니다.
- TypeScript `strict` 기준을 유지합니다.
- `any`는 기존 경계가 불가피할 때만 사용하고, 가능한 구체 타입을 작성합니다.
- SQLite 또는 Node 전용 API를 쓰는 route handler는 `runtime = "nodejs"`를 유지합니다.
- API 입력값은 repository 호출 전에 `zod`로 검증합니다.
- SQLite 쿼리는 `lib/*/repository.ts`에 둡니다. 클라이언트 컴포넌트에서 DB에 직접 접근하지 않습니다.
- `localStorage`, `FileReader`, 브라우저 다운로드, `html-to-image`는 `"use client"` 컴포넌트 안에서만 사용합니다.
- 의존성을 추가할 때는 필요성을 확인하고 `package-lock.json`도 함께 갱신합니다.
- 검증 산출물, 스크린샷, 다운로드 파일은 사용자가 요청하지 않으면 커밋하지 않습니다.

## Workflow

- 제품 동작이나 디자인을 바꿀 때는 `PRD.md`, `ROADMAP.md`, `DESIGN.md`를 먼저 확인합니다.
- API 변경 시 관련 타입, repository 구현, route validation을 함께 맞춥니다.
- UI 변경 시 기존 shadcn/Hugeicons 컴포넌트와 `apps/studio/app/styles.css`의 전역 클래스를 우선 사용합니다.
- 삭제 같은 파괴적 작업은 명시적인 사용자 액션을 요구합니다.
- API에서 대상이 없으면 일관되게 `404` 응답을 반환합니다.
- 로컬 데이터 변경 시 `data/app.db`에 사용자의 실제 작업물이 있을 수 있다고 가정합니다.
- `/settings`는 `/assets?section=api-key` 리다이렉트 호환을 유지합니다.
- API Key는 브라우저 localStorage에만 저장하고, 코드/DB/문서/로그/git에 남기지 않습니다.

## Verification

- TypeScript 또는 API 변경 후 `npm run typecheck`를 실행합니다.
- 컴포넌트, route, 스타일 변경 후 `npm run lint`를 실행합니다.
- 완료 또는 배포 가능 상태를 말하기 전 `npm run build`를 실행합니다.
- 브라우저에 보이는 UI를 바꾸면 `http://127.0.0.1:3000` 또는 사용 중인 로컬 포트에서 해당 route를 확인합니다.
- 확인 대상 route: `/projects`, `/assets`, `/settings`, 가능한 경우 `/workspace/[projectId]`.
- export 기능을 바꾸면 PNG 또는 ZIP이 생성되는지 확인합니다.
- ZIP export는 예상 컷 파일이 포함되는지 확인합니다.
- 실행하지 못한 검증 명령은 최종 답변에 명시합니다.
- 문서만 변경한 경우에는 최소 `git diff --check`로 whitespace 문제를 확인합니다.

## Safety Rules

- 이 앱은 local-first 제품입니다. 요청 없이 클라우드 저장, 외부 영속화, 웹 배포 동작을 추가하지 않습니다.
- 로컬 서버는 `package.json` 스크립트 기준 `127.0.0.1` 바인딩을 유지합니다.
- 사용자가 이미지 생성 액션을 명시적으로 실행하지 않으면 프로젝트 데이터, 캐릭터 Markdown, 업로드 이미지, API key를 외부 서비스로 보내지 않습니다.
- Gemini 연동은 선택 기능입니다. mock provider와 업로드 워크플로는 외부 인증 없이 계속 동작해야 합니다.
- Google 로그인만으로 유료 API 사용을 우회하는 기능을 구현하지 않습니다.
- 사용자의 명시 요청 없이 `data/app.db`, 생성 자산, 기존 프로젝트를 삭제하거나 초기화하지 않습니다.
- API key 또는 key로 보이는 문자열이 소스에 포함되어 있으면 커밋하지 않습니다.

## Domain Terms

- `project`: `contentType`과 `canvasPreset`을 가진 로컬 제작 단위
- `contentType`: `"comic"`은 인스타툰, `"card-news"`는 카드뉴스
- `canvasPreset`: `"1:1"`, `"4:5"`, `"9:16"`
- `cut`: 프로젝트 안의 한 장면/페이지. `position`으로 정렬됩니다.
- `caption`: HTML 미리보기에 표시되는 자막 또는 제목
- `dialogue`: HTML 미리보기에 표시되는 대사 또는 본문
- `imagePrompt`: mock 또는 AI 이미지 생성에 쓰는 프롬프트
- `negativePrompt`: 이미지 생성 제외 조건
- `imageDataUrl`: mock, 업로드, 생성 컷 이미지의 data URL
- `imageStatus`: `"empty"`, `"mock"`, `"uploaded"`, `"generated"`, `"failed"`
- `character`: 캐릭터 이름, 캐릭터 설명 Markdown, 캐릭터 표정 이미지를 포함하는 로컬 세트
- `assets`: 캐릭터, 배경, 폰트 설정을 포함하는 브라우저 localStorage 데이터
- `settings`: API Key와 export 옵션을 포함하는 브라우저 localStorage 데이터

## AI / LLM Engineering Rules

- 최종 텍스트는 HTML/CSS 레이어로 렌더링합니다. 생성 이미지 안의 읽을 수 있는 한국어 텍스트에 의존하지 않습니다.
- 이미지 프롬프트와 자막/대사는 분리합니다.
- 캐릭터 일관성 자산은 사용자 로컬 입력인 캐릭터 Markdown과 캐릭터 표정 이미지로 취급합니다.
- Gemini payload는 어떤 데이터가 외부로 나가는지 사용자가 알 수 있어야 합니다.
- mock 생성은 로컬 테스트가 가능하도록 재현 가능한 흐름을 유지합니다.
- 모델명, Gemini 가격, 무료 할당량, API 제공 여부는 변동 가능하므로 문서화나 구현 전에 확인합니다.

## Final Response Format

- 사용자에게 보이는 결과를 한국어로 요약합니다.
- 리뷰에 도움이 될 때만 변경 파일을 나열합니다.
- 실행한 검증 명령을 정확히 적습니다.
- 실행하지 못한 검증은 별도 문장으로 밝힙니다.
- 실행 중인 페이지를 변경하거나 테스트했다면 로컬 URL을 포함합니다.
- 명령 출력으로 확인하지 않은 성공을 주장하지 않습니다.

## 확인 필요

- 공식 테스트 러너와 `npm test` 스크립트가 없습니다.
- 저장소 표준 Playwright, unit, integration 테스트 설정이 없습니다.
- Gemini provider 모델명, 할당량, 가격, 인증 방식은 외부 정책에 따라 변동될 수 있습니다.
- localhost 외 배포 정책은 현재 제품 범위 밖입니다.
