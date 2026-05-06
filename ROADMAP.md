# ROADMAP: 로컬호스트 기반 인스타툰/카드뉴스 제작 스튜디오

## 1. 기준 문서와 판정

기준 PRD: [PRD.md](PRD.md)  
검증 기준: [docs/prd-generator.md](docs/prd-generator.md), [docs/prd-validator.md](docs/prd-validator.md)  
수정일: 2026-05-06

판정: 조건부 통과. 핵심 구조는 구현 가능하며, 로드맵은 PRD의 기능 ID `F001`~`F014`를 단계별로 구현하도록 정렬한다.

### 검증 요약

- [FACT] Next.js CLI는 `-H` 또는 `--hostname` 옵션을 제공하므로 `127.0.0.1`에 바인딩한 localhost 실행 구조를 만들 수 있다.
- [FACT] Next.js App Router는 `app` 디렉터리 안의 `route.ts` 파일로 Route Handlers를 만들 수 있어 별도 API 서버 없이 로컬 API를 구성할 수 있다.
- [FACT] Gemini API는 API 키 기반 호출, 이미지 생성, 구조화 출력을 공식 문서로 제공한다.
- [FACT] Gemini 구조화 출력은 JSON Schema 일부만 지원하므로 컷 생성 schema는 단순하게 유지해야 한다.
- [FACT] Playwright는 페이지 스크린샷과 screenshot assertion을 지원하므로 HTML/CSS 기반 PNG export 검증에 적합하다.
- [INFERENCE] mock provider를 먼저 구현하면 실제 Gemini 키 없이도 핵심 제작 흐름을 검증할 수 있다.
- [UNCERTAIN] 실제 Gemini 이미지 생성 가능 모델, 무료 한도, 지역 제한, 과금 상태는 사용자 API 키와 Google 정책에 따라 달라진다.

## 2. 구현 원칙

- PRD의 MVP 기능 ID를 구현 기준으로 삼는다.
- 실제 Gemini API 없이도 `F001`~`F007` 핵심 제작 흐름이 검증되어야 한다.
- `F013` Provider 설정은 mock provider를 기본값으로 둔다.
- `F014` 전송 데이터 확인은 Gemini 호출보다 먼저 구현한다.
- HTML/CSS 컷이 최종 원본이므로 단일 컷 PNG export를 초기에 검증한다.
- 실제 Gemini API 호출은 선택 테스트로 분리하고 기본 테스트에는 포함하지 않는다.

## 3. Phase 0: 로컬 앱 기반 구축

목표: Next.js App Router 기반 localhost 앱, Route Handlers, SQLite 저장 기반을 만든다.

### 구현 기능

- `F001` 로컬 프로젝트 관리의 최소 구현

### 범위

- Next.js 16.2.4 + React 19.2.5 + TypeScript 6.0.3 앱 스캐폴드
- App Router 기반 페이지 구조
- Route Handlers 기반 로컬 API
- `next dev --hostname 127.0.0.1` 로컬 실행 스크립트
- better-sqlite3 12.9.0 연결
- Project 모델과 기본 마이그레이션
- 프로젝트 목록 페이지
- 프로젝트 생성, 목록 조회, 열기

### 완료 기준

- 사용자가 `http://localhost:3000`에서 프로젝트 목록 페이지를 볼 수 있다.
- 새 프로젝트를 만들고 새로고침 후 다시 열 수 있다.
- 기본 실행과 테스트에 Gemini API 키가 필요 없다.

### 권장 프로젝트 구조

```text
app/
├── layout.tsx
├── page.tsx
├── projects/page.tsx
├── workspace/[projectId]/page.tsx
├── assets/page.tsx
├── settings/page.tsx
└── api/
    ├── projects/route.ts
    ├── projects/[projectId]/route.ts
    ├── cuts/route.ts
    ├── assets/route.ts
    ├── storyboard/route.ts
    ├── images/route.ts
    ├── exports/route.ts
    └── settings/route.ts
components/
├── workspace/
├── assets/
├── export/
└── ui/
lib/
├── db/
├── providers/
├── render/
├── validation/
└── filesystem/
data/
├── app.db
└── assets/
tests/
├── unit/
├── integration/
└── e2e/
```

## 4. Phase 1: 컷 편집기와 HTML 미리보기

목표: AI 없이도 프로젝트 안에서 컷을 만들고 편집하며 HTML 미리보기를 확인한다.

### 구현 기능

- `F002` 시나리오 입력
- `F003` 컷 관리
- `F004` 컷 텍스트 편집
- `F005` HTML 컷 미리보기

### 범위

- 프로젝트 워크벤치 3패널 레이아웃
- 콘텐츠 유형 선택: 인스타툰, 카드뉴스
- 전체 시나리오 입력
- 컷 수 지정 및 컷별 입력
- 컷 추가, 삭제, 복제, 순서 변경
- 자막, 대사, 이미지 프롬프트, 네거티브 프롬프트 편집
- 인스타툰 템플릿 v1
- 카드뉴스 템플릿 v1
- HTML/CSS 미리보기

### 완료 기준

- 사용자가 API 키 없이 컷을 수동으로 작성할 수 있다.
- 인스타툰과 카드뉴스 템플릿이 서로 다르게 렌더링된다.
- 자막과 대사는 AI 이미지가 아니라 HTML 레이어로 표시된다.
- 편집 변경이 미리보기에 즉시 반영된다.

## 5. Phase 2: 이미지 적용과 단일 컷 export

목표: 직접 업로드 또는 mock 이미지로 컷 이미지를 적용하고, 단일 컷 PNG export를 조기에 검증한다.

### 구현 기능

- `F006` 이미지 적용의 mock/업로드 경로
- `F007` PNG/ZIP 다운로드 중 현재 컷 PNG

### 범위

- 로컬 이미지 업로드
- mock image provider
- 컷 이미지 적용 상태
- Playwright 1.59.1 기반 현재 컷 PNG export
- 기본 `1080x1080` export
- 폰트 로딩 완료 대기
- 텍스트 overflow 경고

### 완료 기준

- 사용자가 이미지 API 없이 로컬 이미지를 컷에 적용할 수 있다.
- mock provider로 이미지 적용 흐름을 테스트할 수 있다.
- 현재 컷을 `1080x1080` PNG로 다운로드할 수 있다.
- PNG에 이미지, 자막, 대사, 폰트 스타일이 모두 반영된다.

## 6. Phase 3: 자산 설정

목표: 캐릭터, 배경, 폰트 자산을 등록하고 컷 편집에 연결한다.

### 구현 기능

- `F010` 캐릭터 설정
- `F011` 배경 설정
- `F012` 폰트 설정

### 범위

- 자산 설정 페이지
- Character, CharacterExpression, Asset 모델
- `clo.md` 같은 Markdown 설명 파일 업로드
- `happy.png`, `sad.png`, `angry.png` 같은 표정 이미지 업로드
- 배경 프리셋 생성
- 폰트 프로필 생성
- 컷에서 캐릭터, 표정, 배경, 폰트 선택
- 폰트 프로필을 HTML 미리보기에 적용

### 완료 기준

- 사용자가 `clo` 캐릭터를 만들고 설명 Markdown과 표정 이미지를 등록할 수 있다.
- 컷에서 `clo`와 표정을 선택할 수 있다.
- 폰트 프로필 변경 시 HTML 미리보기 스타일이 갱신된다.
- 업로드 파일은 앱 자산 폴더에 복사되고 DB는 경로와 메타데이터만 저장한다.

## 7. Phase 4: 스토리보드와 프롬프트 초안 생성

목표: Next.js Route Handler를 통해 전체 시나리오 또는 컷 수 지정 입력에서 컷 구조와 프롬프트 초안을 생성한다.

### 구현 기능

- `F002` 시나리오 입력의 자동 컷 초안 생성
- `F004` 프롬프트 초안 생성과 사용자 수정 보호

### 범위

- `app/api/storyboard/route.ts` 구현
- mock storyboard provider
- Gemini text provider 추상화
- Zod 4.4.3 기반 컷 출력 schema
- Gemini 구조화 출력용 단순 JSON Schema
- 전체 시나리오를 컷 JSON으로 변환
- 컷 수 지정 시 지정 개수에 맞춘 컷 생성
- AI 출력 파싱 실패 fallback
- 사용자가 직접 수정한 프롬프트 보호 확인

### 완료 기준

- mock provider로 전체 시나리오에서 여러 컷을 생성할 수 있다.
- 구조화 출력 검증 실패 시 기본 컷이 생성된다.
- 사용자가 수정한 프롬프트는 자동 재생성으로 바로 덮어쓰지 않는다.
- 캐릭터/배경/템플릿 선택값이 프롬프트 초안에 반영된다.

## 8. Phase 5: Provider 설정과 Gemini 이미지 생성

목표: Next.js Route Handler에서 사용자 Gemini API 키를 통한 이미지 생성을 연결하되, 비용과 실패 위험을 제어한다.

### 구현 기능

- `F006` Gemini 이미지 생성 경로
- `F013` Provider 설정
- `F014` 전송 데이터 확인

### 범위

- `app/api/images/route.ts` 구현
- @google/genai 1.52.0 연동
- 설정 페이지의 API 키 입력 안내
- `.env.local` 또는 프로세스 환경 변수 우선 지원
- provider 상태 확인
- Gemini 호출 전 전송 데이터 미리보기
- 컷별 Gemini 이미지 생성 요청
- 오류 메시지 표준화
- 실패 시 직접 업로드 fallback

### 완료 기준

- mock provider가 기본값으로 동작한다.
- Gemini 호출 전 사용자가 전송될 데이터 범위를 확인할 수 있다.
- Gemini 설정 검증 실패 시 다음 행동이 명확히 표시된다.
- Gemini 실패 시 컷 상태가 실패로 표시되고 직접 업로드 fallback이 제공된다.

### 보류 항목

- Google OAuth 로그인
- OS credential store
- 계정별 무료/유료 한도 판단
- 이미지 모델 자동 추천

## 9. Phase 6: 전체 다운로드와 품질 게이트

목표: Next.js Route Handler에서 전체 컷 ZIP export와 시각 품질 검증을 완성한다.

### 구현 기능

- `F007` 전체 PNG/ZIP 다운로드 완성

### 범위

- `app/api/exports/route.ts` 구현
- 선택 컷 PNG export
- 전체 컷 ZIP export
- archiver 7.0.1 기반 ZIP 생성
- `4:5`, `9:16` 프리셋 export
- export job 상태 표시
- Playwright screenshot assertion 기반 시각 회귀 테스트
- 텍스트 overflow와 폰트 로딩 실패 감지

### 완료 기준

- 현재 컷, 선택 컷, 전체 컷 다운로드가 가능하다.
- 전체 ZIP에 컷 순서대로 PNG가 포함된다.
- export 전 폰트 로딩 완료를 기다린다.
- 텍스트 overflow가 감지되면 다운로드 전에 경고한다.

## 10. Phase 7: v1.0 안정화

목표: 1인 창작자가 실제 작업에 쓸 수 있도록 복구성과 문서를 갖춘다.

### 범위

- 샘플 `clo` 프로젝트
- 설치/실행 가이드
- provider별 오류 가이드
- 프로젝트 백업/복원
- 자산 누락 복구 UX
- 전체 회귀 테스트 정리

### 완료 기준

- 신규 사용자가 문서만 보고 로컬 앱을 실행할 수 있다.
- 샘플 `clo` 프로젝트로 인스타툰과 카드뉴스 PNG를 다운로드할 수 있다.
- 실제 Gemini API 키 없이 mock provider와 직접 업로드로 전체 제작 흐름이 가능하다.
- 기본 테스트 스위트가 실제 API 비용 없이 통과한다.

## 11. 권장 구현 순서

1. Phase 0: `F001` 프로젝트 기반
2. Phase 1: `F002`~`F005` 컷 편집과 HTML 미리보기
3. Phase 2: `F006` mock/업로드 이미지 적용, `F007` 단일 컷 PNG
4. Phase 3: `F010`~`F012` 자산 설정
5. Phase 4: `F002`, `F004` 자동 컷/프롬프트 초안
6. Phase 5: `F013`, `F014`, Gemini 이미지 생성
7. Phase 6: `F007` 전체 ZIP과 품질 게이트
8. Phase 7: v1.0 안정화

## 12. PRD 정합성 반영 상태

- 기능 ID `F001`~`F014`가 로드맵 단계에 매핑되어 있다.
- PRD의 메뉴 구조와 페이지별 상세 기능을 기준으로 단계가 구성되어 있다.
- mock provider가 실제 API보다 먼저 구현되도록 조정했다.
- PRD의 "MVP 이후 기능"은 Phase 7 이전 로드맵에서 제외했다.
- 이전 ROADMAP의 "개발 전 PRD 보강 권장사항"은 보강된 PRD에 반영되어 제거했다.

## 13. 참고 문서

- [PRD.md](PRD.md)
- [docs/prd-generator.md](docs/prd-generator.md)
- [docs/prd-validator.md](docs/prd-validator.md)
- Gemini image generation: https://ai.google.dev/gemini-api/docs/image-generation
- Gemini API keys: https://ai.google.dev/gemini-api/docs/api-key
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
- Next.js App Router: https://nextjs.org/docs/app
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js CLI hostname option: https://nextjs.org/docs/api-reference/cli
- Playwright screenshot assertions: https://playwright.dev/docs/api/class-pageassertions
