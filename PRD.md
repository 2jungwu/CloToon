# CloToon Local Studio PRD

## 1. 제품 요약

CloToon은 로컬 PC에서 실행하는 인스타툰/카드뉴스 제작 스튜디오다. 사용자는 프로젝트를 만들고, 컷별 시나리오, 자막, 대사, 이미지 프롬프트를 편집한 뒤 HTML/CSS 기반 컷 미리보기를 PNG 또는 ZIP으로 내보낸다.

현재 제품은 local-first 원칙을 따른다. 프로젝트와 컷 데이터는 로컬 SQLite에 저장하고, 캐릭터/배경/폰트/자막 스타일/API Key/내보내기 설정은 브라우저 `localStorage`에 저장한다. 외부 이미지 생성은 사용자가 Gemini API Key를 등록하고 워크스페이스에서 `이미지 생성`을 누를 때만 수행한다.

## 2. 현재 구현 기준

- 저장소는 npm workspaces 기반 모노레포다.
- 실제 앱은 `apps/studio`의 Next.js App Router 애플리케이션이다.
- 루트 `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run typecheck`는 `apps/studio` 워크스페이스 스크립트를 실행한다.
- 로컬 서버는 `127.0.0.1:3000`에 바인딩한다.
- 데이터베이스는 루트 `data/app.db`를 사용한다.
- 좌측 side rail 내비게이션은 `프로젝트`, `에셋`만 노출한다.
- `/settings`는 삭제하지 않고 `/assets?section=api-key`로 리다이렉트한다.
- 앱 UI는 Apple 제품 페이지에서 영감을 받은 밝고 절제된 제품형 UI를 기준으로 한다.
- export 컷의 시각 스타일은 앱 UI 테마와 분리한다.
- 표준 단위 테스트는 `npm run test`로 실행하며, Playwright/E2E는 아직 표준 스크립트로 고정하지 않았다.

## 3. 목표

- 로컬에서 프로젝트와 컷을 안정적으로 만들고 다시 열 수 있다.
- 캐릭터, 배경, 폰트, 자막 스타일, API Key, 내보내기 설정을 전역 로컬 설정으로 관리한다.
- 컷 텍스트, 자막 레이어 스타일, 이미지 생성 프롬프트를 분리해 관리한다.
- Gemini 이미지 생성 결과를 컷 이미지로 저장하되, 자막은 HTML/CSS 레이어로 유지하고 대사는 생성 이미지 안의 말풍선/대사 표현으로 반영할 수 있다.
- Gemini quota, key, provider 실패가 있어도 mock 이미지와 직접 업로드로 제작 흐름을 계속 진행할 수 있다.
- 완성 컷을 현재 컷 PNG 또는 전체 컷 ZIP으로 내보낼 수 있다.

## 4. 비목표

- 클라우드 저장, 계정 동기화, 협업 편집은 현재 범위가 아니다.
- Google 로그인만으로 유료 API 사용을 우회하지 않는다.
- API Key를 코드, DB, 파일, git에 저장하지 않는다.
- 생성 이미지 내부에는 사용자가 입력한 대사만 허용하고, 임의 한국어 텍스트, UI 텍스트, 워터마크, 로고에는 의존하지 않는다.
- 배포형 SaaS 운영 정책은 현재 범위가 아니다.

## 5. 사용자와 주요 작업

### 5.1 제작자

개인 창작자가 로컬 PC에서 카드뉴스나 인스타툰을 반복 제작한다. 캐릭터 일관성, 빠른 컷 편집, PNG/ZIP 내보내기가 중요하다.

### 5.2 기본 작업 흐름

1. `npm install` 후 `npm run dev`로 로컬 앱을 실행한다.
2. `/assets`에서 캐릭터, 배경, 폰트, 자막 스타일, API Key, 내보내기 설정을 등록한다.
3. `/projects`에서 프로젝트를 만들거나 기존 프로젝트를 선택한다.
4. `/workspace/[projectId]`에서 컷 시나리오, 자막, 대사, 이미지 프롬프트를 작성한다.
5. `이미지 생성`을 눌러 현재 컷 텍스트를 저장하고 Gemini 이미지 생성을 요청한다.
6. Gemini 실패 시 mock 이미지 또는 직접 업로드로 대체한다.
7. 미리보기에서 자막은 HTML/CSS 레이어로 유지되고, 대사는 HTML 오버레이로 중복 렌더링되지 않는지 확인한다.
8. 현재 컷 PNG 또는 전체 ZIP을 내려받는다.

## 6. 화면 구조

### 6.1 Projects

- 좌측 메뉴: 새 프로젝트와 저장된 프로젝트 목록.
- 우측 상세: 새 프로젝트 생성 폼 또는 선택된 프로젝트 상세.
- 프로젝트 상세에서 워크스페이스 열기와 삭제를 제공한다.

### 6.2 Workspace

- 좌측 메뉴: 전체 시나리오 입력, 컷 수, 컷 초안 생성, 컷 목록.
- 우측 상세: 선택 컷 편집 폼, 자막 레이어 편집기, HTML 미리보기.
- 주요 CTA는 `이미지 생성`이다.
- `Mock 이미지`, `이미지 업로드`, 컷 복제/삭제/순서 변경, PNG/ZIP 내보내기를 유지한다.
- 자막 레이어 편집기는 글자 색상, 크기, 굵게/기울임/밑줄, 정렬, 박스 배경색, 테두리색, 선 두께, 모서리, 안쪽여백 X/Y, 너비 모드를 제공한다.

### 6.3 Assets

Assets는 전역 로컬 설정 화면이다. 좌측 메뉴와 우측 세부 설정 화면으로 구성한다.

- `캐릭터`: 캐릭터 추가/삭제, 캐릭터 선택, 캐릭터 이름, 캐릭터 설명(md), 캐릭터 표정 업로드/삭제/저장.
- `배경`: 배경 이름, 배경 프롬프트, 배경 색상, 미리보기.
- `폰트`: 자막 폰트, 대사 폰트, 폰트 미리보기.
- `자막 스타일`: 새 컷에 자동 적용할 기본 자막 글자/박스 스타일을 Workspace 자막 레이어 편집기와 같은 컨트롤로 설정한다.
- 기존 컷은 `자막 스타일` 저장만으로 자동 변경하지 않고, Workspace의 `기본 스타일 적용` 액션으로 선택 컷에만 수동 적용한다.
- `API Key`: Gemini API Key 등록. Provider dropdown은 없다.
- `내보내기`: PNG 해상도, HTML 원본 포함 옵션, payload preview.

### 6.4 Settings

`/settings`는 기존 북마크 호환을 위해 `/assets?section=api-key`로 이동한다.

## 7. 기능 요구사항

| ID | 기능 | 요구사항 |
| --- | --- | --- |
| F001 | 로컬 프로젝트 관리 | 프로젝트 생성, 목록 조회, 선택, 삭제, 최근 수정일 표시를 제공한다. |
| F002 | 컷 관리 | 컷 추가, 삭제, 복제, 순서 변경, 선택을 제공한다. |
| F003 | 컷 텍스트와 자막 레이어 편집 | 컷 시나리오, 자막, 대사, 이미지 프롬프트, 자막 글자 스타일, 자막 박스 스타일을 편집한다. |
| F004 | HTML 컷 미리보기 | 생성/업로드 이미지 위에 자막을 HTML/CSS 레이어로 렌더링하고, 대사 HTML 오버레이는 중복 렌더링하지 않는다. |
| F005 | Assets 통합 설정 | 캐릭터, 배경, 폰트, 자막 스타일, API Key, 내보내기 설정을 `/assets`에서 관리한다. |
| F006 | 캐릭터 세트 관리 | 캐릭터 프로필과 캐릭터 표정 이미지를 하나의 세트로 관리한다. |
| F007 | Gemini 이미지 생성 | 현재 컷 저장 후 Assets 설정과 컷 내용을 조합해 `/api/images/generate`로 이미지를 생성한다. |
| F008 | fallback 이미지 적용 | Gemini 실패와 무관하게 mock 이미지와 직접 업로드를 사용할 수 있다. |
| F009 | PNG/ZIP 내보내기 | 현재 컷 PNG와 전체 컷 ZIP 내보내기를 제공한다. |
| F010 | 기존 데이터 호환 | 기존 `local-studio-assets`, `local-studio-settings`, `/settings` 북마크를 최대한 유지한다. |

## 8. 데이터와 저장소

### 8.1 SQLite

로컬 DB는 루트 `data/app.db`를 사용한다. 클라이언트 컴포넌트에서 직접 접근하지 않고 API route와 repository 계층을 통해 접근한다.

주요 도메인:

- `Project`: `id`, `name`, `contentType`, `canvasPreset`, `updatedAt`
- `Cut`: `id`, `projectId`, `position`, `template`, `scenario`, `caption`, `dialogue`, `imagePrompt`, `negativePrompt`, `imageDataUrl`, `imageStatus`, `captionStyle`

SQLite에는 자막 레이어 스타일을 `caption_style_json`으로 직렬화해 저장하고, API와 클라이언트 타입에서는 `captionStyle`로 다룬다.

### 8.2 localStorage

- `local-studio-assets`: 캐릭터 세트, 선택 캐릭터, 배경, 폰트, 새 컷용 `captionStyleDefaults`.
- `local-studio-settings`: `provider: "gemini"` 호환값, `geminiApiKey`, `geminiImageModel`, `exportScale`, `saveOriginalHtml`.

API Key는 브라우저 localStorage에만 저장한다. 코드, DB, 문서, 로그, git에 저장하지 않는다.

## 9. 이미지 생성 정책

Gemini 생성은 선택 기능이다. 사용자가 API Key를 등록하고 워크스페이스에서 `이미지 생성`을 누를 때만 외부 요청을 보낸다.

요청에 포함되는 정보:

- 선택 캐릭터 이름
- 캐릭터 설명 Markdown
- 선택 캐릭터의 캐릭터 표정 이미지 일부
- 기본 배경 이름, 프롬프트, 색상
- 프로젝트 이름, 콘텐츠 유형, 캔버스 비율
- 컷 시나리오, 이미지 프롬프트, 자막 레이어 스타일 정보
- 자막은 최종 HTML/CSS 오버레이 문맥으로만 포함하며 이미지 안에 그리도록 지시하지 않는다.
- 대사는 사용자가 입력한 문구에 한해 생성 이미지 안의 말풍선/대사 표현으로 반영할 수 있다.

강제 원칙:

- 이미지 안에는 사용자가 입력한 대사 외의 임의 텍스트, 자막, UI 텍스트, 워터마크, 로고를 생성하지 않는다.
- 최종 자막은 HTML/CSS 레이어로 렌더링한다.
- 실패 시 quota/API key/일반 오류를 구분해 사용자에게 안내한다.
- 실패한 컷은 `imageStatus: "failed"`로 표시한다.

## 10. 디자인 기준

앱 UI는 Apple 제품 페이지에서 영감을 받은 밝고 절제된 제품형 UI를 기준으로 한다.

- 배경: `#f5f5f7`
- 표면: `#ffffff`
- 본문 텍스트: `#1d1d1f`
- 보조 텍스트: `#6e6e73`
- primary: `#0071e3`
- border: `#d2d2d7`
- 페이지는 넓은 여백, 낮은 depth, pill CTA, 얇은 경계선을 사용한다.
- 반복 항목 외에는 카드 중첩을 피하고, Projects/Assets/Workspace는 좌측 메뉴와 우측 상세 화면 구조를 공유한다.
- 컬러 피커는 에디터형 popover 패턴을 사용하고, 자막 박스 설정은 색상/선/모서리/안쪽여백 컨트롤을 같은 필드 그리드 스타일로 통일한다.
- export 캔버스의 출력 스타일은 앱 chrome과 독립적으로 유지한다.

상세 디자인 기준은 `DESIGN.md`를 따른다.

## 11. 검증 기준

기본 검증:

- `npm run typecheck`
- `npm run test`
- `npm run lint`
- `npm run build`

브라우저 검증:

- `/projects`
- `/assets`
- `/settings`
- 기존 프로젝트가 있으면 `/workspace/[projectId]`

확인 기준:

- 콘솔 오류 0건.
- 데스크톱과 모바일 폭에서 헤더, 메뉴, 버튼, 폼 텍스트가 겹치지 않음.
- Workspace의 데스크톱/모바일 반응형 전환 유지.
- 컷 미리보기와 PNG/ZIP export 출력이 의도치 않게 바뀌지 않음.
- API Key가 응답, 로그, 커밋에 포함되지 않음.

## 12. 초기화 시 남은 확인 사항

- 표준 단위 테스트는 `npm run test`로 실행한다.
- Playwright는 임시 브라우저 검증에 사용할 수 있지만 표준 E2E 스크립트는 아직 없다.
- Gemini quota/billing 상태는 사용자 Google AI Studio 프로젝트 설정에 의존한다.
- Gemini 모델명, 할당량, 가격, 인증 방식은 외부 정책 변경 가능성이 있어 문서화나 구현 전 확인이 필요하다.
