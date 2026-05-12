# CloToon Local Studio Roadmap

## 1. 기준 문서

- 제품 요구사항: [PRD.md](PRD.md)
- 디자인 기준: [DESIGN.md](DESIGN.md)
- 이미지 생성 규칙: [docs/IMAGE_GENERATION.md](docs/IMAGE_GENERATION.md)
- 에이전트 작업 규칙: [AGENTS.md](AGENTS.md)

마지막 정리일: 2026-05-09

## 2. 현재 상태 요약

현재 저장소는 npm workspaces 기반 모노레포이며, 실제 애플리케이션은 `apps/studio`에 있다. 앱은 Next.js App Router, React, TypeScript, SQLite, localStorage를 사용한다.

최근 반영된 주요 변화:

- 모노레포 구조 전환.
- Apple 제품 페이지에서 영감을 받은 밝고 절제된 앱 UI.
- 상단 내비게이션을 `Projects`, `Assets`로 정리.
- `Settings`를 `Assets`에 통합하고 `/settings`는 `/assets?section=api-key`로 리다이렉트.
- Assets를 캐릭터, 배경, 폰트, API Key, 내보내기 메뉴로 구성.
- Projects와 Workspace도 Assets와 같은 좌측 메뉴/우측 상세 화면 구조로 정리.
- `POST /api/images/generate` 로컬 route를 통한 Gemini 이미지 생성.
- 자막은 HTML/CSS 레이어로 유지하고, 대사는 생성 이미지 안의 말풍선/대사 표현으로 반영.
- mock 이미지와 직접 업로드 fallback 유지.

## 3. 완료된 단계

### Phase 0. 모노레포와 로컬 앱 기반

상태: 완료

- 루트 npm workspaces 구성.
- `apps/studio`로 Next.js 앱 이동.
- 루트 스크립트가 워크스페이스 스크립트를 호출하도록 정리.
- 로컬 SQLite DB 경로를 루트 `data/` 기준으로 유지.

검증 기준:

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Phase 1. 프로젝트와 컷 편집 기반

상태: 완료

- 프로젝트 생성, 조회, 삭제.
- 컷 생성, 복제, 삭제, 순서 변경.
- 컷 시나리오, 자막, 대사, 이미지 프롬프트, 자막 오버레이 스타일 편집.
- HTML/CSS 기반 컷 미리보기.

### Phase 2. Assets/Settings 통합

상태: 완료

- `/assets` 2분할 설정 화면.
- 캐릭터 세트 관리: 이름, 설명 Markdown, 캐릭터 표정 이미지.
- 배경 설정 분리.
- 폰트 설정 분리.
- API Key 설정 분리.
- 내보내기 설정 이동.
- `/settings` 리다이렉트 호환.
- 기존 `local-studio-assets`, `local-studio-settings` 호환 처리.

### Phase 3. Apple형 앱 UI 정리

상태: 완료

- 전역 앱 UI 토큰을 밝은 Apple형 제품 UI 기준으로 정리.
- Projects, Assets, Workspace의 좌측 메뉴/우측 상세 화면 패턴 통일.
- export 캔버스 스타일은 별도 토큰으로 분리해 유지.

### Phase 4. Gemini 로컬 이미지 생성 통합

상태: 완료

- `POST /api/images/generate` route 추가.
- `lib/image-generation/prompt-builder.ts`에 prompt 조합 로직 분리.
- `docs/IMAGE_GENERATION.md` 추가.
- 워크스페이스 주요 CTA를 `이미지 생성`으로 변경.
- 이미지 생성 전 현재 컷 저장.
- Assets/localStorage의 캐릭터와 배경 설정을 생성 prompt에 반영.
- Gemini 생성 결과를 기존 컷 PATCH API로 저장.
- API key는 요청 처리 중에만 사용하고 저장하지 않음.

## 4. 프로젝트 초기화 단계

### Phase 5. 문서와 저장소 기준 정리

상태: 진행 중

목표:

- 초기화 기준 문서가 현재 구현과 일치하도록 정리한다.
- 깨진 한글 인코딩 문서를 UTF-8 한국어 문서로 정리한다.
- 새 사용자가 문서만 보고 설치, 실행, 제작 흐름을 이해할 수 있게 한다.

이번 작업 범위:

- `PRD.md` 업데이트.
- `AGENTS.md` 업데이트.
- `ROADMAP.md` 업데이트.

이번 작업에서 바로 수정하지 않는 파일:

- `README.md`
- `DESIGN.md`
- `.gitignore`
- 테스트 설정 파일

위 파일은 사용자의 승인 후 별도 작업으로 정리한다.

### 완료 기준

- 문서가 현재 경로(`apps/studio`)와 루트 npm scripts를 정확히 설명한다.
- Settings 통합, Assets 구조, Gemini 생성 흐름이 문서에 반영된다.
- API Key 저장 정책과 외부 전송 경계가 명확하다.
- `git diff --check`가 통과한다.

## 5. 다음 권장 작업

### Phase 6. README와 DESIGN 정리

상태: 계획 필요

권장 이유:

- `README.md`와 `DESIGN.md`에도 깨진 한글이 남아 있다.
- README는 새 사용자의 첫 진입 문서이므로 초기화 작업에서 중요하다.
- DESIGN은 이미 Apple형 방향을 담고 있지만 현재 Projects/Workspace split layout까지 반영해 다듬을 필요가 있다.

권장 변경:

- `README.md`를 설치, 실행, 데이터 위치, 주요 화면, 검증 명령 중심으로 다시 작성.
- `DESIGN.md`를 현재 전역 split menu 패턴과 export 캔버스 분리 원칙 기준으로 업데이트.

### Phase 7. 저장소 위생 정리

상태: 계획 필요

권장 이유:

- `output/` 검증 산출물이 untracked로 남아 있다.
- `artifacts/`, `data/`, `tsconfig.tsbuildinfo` 같은 파일의 커밋/무시 정책을 명확히 해야 한다.

권장 변경:

- `.gitignore`에 `output/` 포함 여부 확인.
- `tsconfig.tsbuildinfo` 추적 여부 확인.
- `data/app.db-shm`, `data/app.db-wal` 무시 여부 확인.
- 이미 커밋된 산출물은 사용자 승인 후 별도 정리.

### Phase 8. 테스트 표준화

상태: 계획 필요

권장 이유:

- 현재 `npm test` 스크립트가 없다.
- `prompt-builder.test.ts` 파일은 있지만 표준 테스트 러너가 없다.
- Playwright 검증은 임시 명령에 의존한다.

권장 변경:

- unit test runner 도입 여부 결정.
- `npm test` 스크립트 추가 여부 결정.
- 브라우저 smoke test 스크립트 추가 여부 결정.
- Gemini 실제 호출은 기본 테스트에서 제외하고 수동 검증으로 분리.

### Phase 9. Gemini 실패 진단 UX 개선

상태: 계획 필요

권장 이유:

- Gemini 생성 실패 원인은 key 누락, invalid key, quota/billing, 모델/정책 오류로 나뉜다.
- 사용자에게 어떤 조치가 필요한지 더 직접적으로 안내할 수 있다.

권장 변경:

- 실패 상태에 Gemini status code와 사용자용 설명을 함께 표시.
- `RESOURCE_EXHAUSTED`는 Google AI Studio quota/billing 확인 안내로 분리.
- invalid key는 Assets > API Key 저장 여부와 key 제한 설정 확인 안내로 분리.
- API key는 절대 화면, 로그, 응답에 원문 노출하지 않는다.

## 6. 보류 항목

- 클라우드 저장과 계정 동기화.
- Google OAuth 로그인.
- OS credential store 저장.
- 다중 사용자 협업.
- 외부 배포 정책.
- 과금/무료 할당량 자동 판별.
- 이미지 모델 자동 추천.

## 7. 검증 명령

코드 변경 시:

```bash
npm run typecheck
npm run lint
npm run build
```

문서만 변경 시:

```bash
git diff --check
```

UI 변경 시 브라우저 확인 대상:

- `http://127.0.0.1:3000/projects`
- `http://127.0.0.1:3000/assets`
- `http://127.0.0.1:3000/settings`
- `http://127.0.0.1:3000/workspace/[projectId]`
