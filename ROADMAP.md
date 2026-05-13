# CloToon Local Studio Roadmap

## 1. 기준 문서

- 제품 요구사항: [PRD.md](PRD.md)
- 디자인 기준: [DESIGN.md](DESIGN.md)
- 이미지 생성 규칙: [docs/IMAGE_GENERATION.md](docs/IMAGE_GENERATION.md)
- 에이전트 작업 규칙: [AGENTS.md](AGENTS.md)
- 과거 작업 기록: [docs/superpowers](docs/superpowers)

마지막 정리일: 2026-05-13

## 2. 현재 상태 요약

현재 저장소는 npm workspaces 기반 모노레포이며, 실제 애플리케이션은 `apps/studio`에 있다. 앱은 Next.js App Router, React, TypeScript, SQLite, localStorage를 사용한다.

현재 반영된 주요 기준:

- 루트 npm scripts가 `apps/studio` 워크스페이스의 `dev`, `build`, `start`, `lint`, `test`, `typecheck`를 호출한다.
- 앱 내비게이션은 좌측 side rail이며 `프로젝트`, `에셋`만 노출한다.
- `Settings`는 `Assets`에 통합되어 있고 `/settings`는 `/assets?section=api-key`로 리다이렉트한다.
- Assets는 캐릭터, 배경, 폰트, 자막 스타일, API Key, 내보내기 메뉴로 구성한다.
- Projects와 Workspace는 좌측 메뉴/우측 상세 화면 구조를 공유한다.
- `POST /api/images/generate` 로컬 route를 통해 Gemini 이미지 생성을 수행한다.
- 사용자가 명시적으로 `이미지 생성`을 누를 때만 외부 provider 호출이 발생한다.
- 자막은 HTML/CSS 레이어로 유지하고, 대사는 사용자가 입력한 문구에 한해 생성 이미지 안의 말풍선/대사 표현으로 반영할 수 있다.
- 자막 레이어 편집기는 글자 색상, 크기, 굵게/기울임/밑줄, 정렬, 박스 배경, 테두리, 선, 모서리, 안쪽여백 X/Y, 너비 모드를 지원한다.
- mock 이미지와 직접 업로드 fallback을 유지한다.
- `npm run test`는 Node test runner 기반 단위 테스트를 실행한다.

## 3. 완료된 단계

### Phase 0. 모노레포와 로컬 앱 기반

상태: 완료

- 루트 npm workspaces 구성.
- `apps/studio`로 Next.js 앱 이동.
- 루트 스크립트가 워크스페이스 스크립트를 호출하도록 정리.
- 로컬 SQLite DB 경로를 루트 `data/` 기준으로 유지.

검증 기준:

- `npm install`
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Phase 1. 프로젝트와 컷 편집 기반

상태: 완료

- 프로젝트 생성, 조회, 삭제.
- 컷 생성, 복제, 삭제, 순서 변경.
- 컷 시나리오, 자막, 대사, 이미지 프롬프트 편집.
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
- 전역 내비게이션을 좌측 side rail로 정리.
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

### Phase 5. 자막 레이어 편집

상태: 완료

- `captionStyle` 타입과 `caption_style_json` 저장을 추가.
- 컷 생성, 수정, 복제, 목록 조회에서 자막 스타일을 보존한다.
- 자막 텍스트 툴바와 박스 스타일 컨트롤을 Workspace에 통합한다.
- 컬러 피커의 2D gradient 선택, hue slider, hex/RGB 입력, preset swatch 동작을 연결한다.
- 미리보기와 PNG/ZIP export에 같은 자막 CSS 변수를 적용한다.

### Phase 6. 프로젝트 초기화 문서 정리

상태: 완료

- `README.md`, `PRD.md`, `ROADMAP.md`, `DESIGN.md`를 현재 구현 기준으로 갱신한다.
- `npm run test` 기준과 Node test runner 범위를 문서에 반영한다.
- `.gitignore`의 `output/`, `.worktrees/`, `*.tsbuildinfo`, `data/*.db*` 무시 정책을 확인한다.
- 과거 Superpowers 작업 기록에는 현재 방향과 달라진 이유를 명시한다.

### Phase 7. Assets 자막 스타일 기본값

상태: 완료

- Assets에 `자막 스타일` 메뉴를 추가한다.
- Workspace 자막 레이어 편집 UI를 공용 컴포넌트로 분리해 Assets와 Workspace가 같은 컨트롤을 사용한다.
- 새 컷은 `local-studio-assets.captionStyleDefaults`를 읽어 기본 자막 스타일을 자동 적용한다.
- 기존 컷은 기본 스타일 저장만으로 자동 변경하지 않고, Workspace의 `기본 스타일 적용` 버튼으로 선택 컷에만 수동 적용한다.

## 4. 과거 작업 기록 관리

`docs/superpowers/` 아래 문서는 현재 제품 기준 문서가 아니라 과거 구현 계획과 스펙의 기록이다. 당시에는 빠르게 제작 화면을 안정화하는 것이 목적이어서 이미지 중심 미리보기와 간소화된 컷 편집을 우선했다.

현재 방향으로 전환한 이유:

- 제작자는 생성 이미지 확인뿐 아니라 최종 출력에 가까운 자막 위치와 박스 스타일을 즉시 확인해야 한다.
- 자막을 이미지에 굽지 않는 정책을 유지하려면, 미리보기와 export 모두 HTML/CSS 자막 레이어를 같은 방식으로 렌더링해야 한다.
- `image-only preview`는 생성 이미지 검수에는 단순하지만, 자막 레이어 편집 기능과 충돌한다.
- 대사는 이미지 생성 모델이 말풍선으로 반영할 수 있지만, HTML 대사 오버레이를 다시 얹으면 중복 렌더링 위험이 있다.
- 그래서 현재 기준은 `자막은 HTML/CSS 레이어`, `대사는 이미지 안 표현 가능`, `미리보기는 자막 레이어 포함`, `export는 동일 자막 스타일 유지`로 정리한다.

## 5. 다음 권장 작업

### Phase 8. 브라우저 검증 표준화

상태: 계획 필요

권장 이유:

- 현재 단위 테스트는 표준화되어 있지만 Playwright/E2E 스크립트는 없다.
- UI 변경은 `/projects`, `/assets`, `/settings`, `/workspace/[projectId]`를 수동 또는 임시 Playwright로 확인하고 있다.

권장 변경:

- 브라우저 smoke test 스크립트 추가 여부 결정.
- Gemini 실제 호출은 기본 자동 테스트에서 제외하고 수동 검증으로 분리.
- 자막 컬러 피커, 자막 박스 컨트롤, PNG/ZIP export를 브라우저 검증 체크리스트에 포함.

### Phase 9. Gemini 실패 진단 UX 개선

상태: 부분 완료, 추가 개선 가능

현재 기준:

- key 오류, quota/`RESOURCE_EXHAUSTED`, bad request, network, server 오류를 사용자 메시지로 분리한다.
- API key 원문은 화면, 로그, 응답에 노출하지 않는다.

추가 개선 후보:

- 실패 상태에 provider status code와 사용자용 조치 안내를 더 명확히 표시.
- `RESOURCE_EXHAUSTED`는 Google AI Studio quota/billing 확인 안내로 분리.
- invalid key는 Assets > API Key 저장 여부와 key 제한 설정 확인 안내로 분리.

### Phase 9. Windows exe 패키징

상태: 별도 브랜치 진행

- 로컬 브랜치 `codex/windows-exe-packaging`에서 진행한다.
- 메인 제품 기준 문서에는 패키징 정책이 확정된 뒤 반영한다.

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
npm run test
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
