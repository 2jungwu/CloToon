# Studio Workbench 설계

## 요약

`Projects`와 `Workspace`를 하나의 제작 화면인 `Studio Workbench`로 통합한다. 사용자는 왼쪽에서 프로젝트를 만들고 선택하며, 중앙에서 전체 카드뉴스 시나리오와 컷별 입력값을 편집하고, 오른쪽에서 생성 이미지 결과와 내보내기 액션을 확인한다.

시각 방향은 Linear Studio에서 영감을 받은 밝은 작업 도구 UI다. 카드형 박스를 반복해서 쌓지 않고, 얇은 구분선, 열 분할, 활성 행, chip, 명확한 폼 그룹으로 화면 구조를 만든다. primary 색상은 기존 시스템 블루 계열을 유지한다.

## 확정 방향

- `/projects`와 `/workspace/[projectId]`는 같은 Workbench를 렌더링한다.
- 데스크톱 기준 3열 구조를 사용한다.
- 1열은 프로젝트 목록과 프로젝트 추가만 담당한다.
- 2열은 선택 프로젝트의 제작 입력을 담당한다.
- 3열은 생성 이미지 미리보기와 내보내기 액션을 담당한다.
- 컷 시나리오, 자막, 대사, 이미지 프롬프트 입력은 중앙에 둔다.
- `이미지 생성` 버튼은 중앙의 `이미지 프롬프트` 아래에 둔다.
- 오른쪽 미리보기는 생성 이미지 결과 중심이다.
- v1에서는 자막과 대사를 오른쪽 미리보기 텍스트 레이어로 노출하지 않는다.
- 자막과 대사는 Gemini 이미지 생성 품질을 높이는 참고 입력값으로 사용한다.
- 다크 모드는 고려하지 않는다.
- Genspark처럼 미리보기 요소를 직접 선택해 편집하는 기능은 v2 범위로 넘긴다.

## 화면 구조

### 상단 내비게이션

상단 내비게이션은 `Studio`, `Assets`를 사용한다. `Studio`는 기존 `Projects`와 `Workspace`의 역할을 합친 진입점이다. URL 호환성을 위해 실제 href는 `/projects`를 유지할 수 있다.

### 1열: Projects

역할은 프로젝트 생성, 프로젝트 선택, 프로젝트 삭제다.

포함 항목:

- `Projects` 제목
- 새 프로젝트 이름 입력
- 콘텐츠 유형 dropdown
- 캔버스 dropdown
- 블루 primary `프로젝트 추가` 버튼
- 프로젝트 목록
- 프로젝트 metadata chip
- 프로젝트 행 hover 시 삭제 버튼

제거 항목:

- 프로젝트 검색
- 컷 설정
- 워크스페이스 상세 폼
- 카드형 프로젝트 상세 패널

프로젝트 목록 chip:

- 콘텐츠 유형: `인스타툰` 또는 `카드뉴스`
- 캔버스: `1:1`, `4:5`, `9:16`
- 필요 시 컷 수

### 2열: Production Input

역할은 전체 카드뉴스 제작 입력과 컷별 세부 입력이다.

상단 프로젝트 설정 영역:

- 선택 프로젝트 이름
- 콘텐츠 유형 chip
- 캔버스 chip
- 컷 수 chip
- 카드뉴스일 때만 `전체 시나리오`
- 카드뉴스일 때만 `한 번에 제작`

`한 번에 제작` 동작:

- 카드뉴스 프로젝트에서만 노출한다.
- 사용자가 입력한 전체 시나리오와 현재 컷 수를 기준으로 동작한다.
- Gemini API를 호출해 전체 카드뉴스 컷을 제작하는 사용자 명시 액션이다.
- 자동 호출, 페이지 진입 시 호출, 프로젝트 선택 시 호출은 금지한다.
- 여러 컷 이미지를 만들 때는 API 호출 폭증을 막기 위해 순차 호출한다.
- API key는 요청 중에만 사용하고 파일, DB, 로그, git에 저장하지 않는다.

하단 컷 작업 영역:

- 중앙 내부를 다시 컷 목록과 컷 편집 폼으로 나눈다.
- 컷 목록에는 컷 수 조절과 컷 행만 둔다.
- 컷 수 `+`, `-`는 border 없는 아이콘형 컨트롤로 표시한다.
- 컷 행은 `#1 첫 장면`처럼 주 정보만 표시한다.
- 컷 행에서 `생성 이미지`, `Mock 이미지`, `이미지 없음` 같은 부제목은 제거한다.

컷 편집 필드:

- 컷 시나리오
- 자막
- 대사
- 이미지 프롬프트
- 이미지 프롬프트 아래 블루 primary `이미지 생성`

`이미지 생성` 동작:

- 현재 선택 컷만 생성한다.
- Assets의 캐릭터/배경 설정, 컷 시나리오, 자막, 대사, 이미지 프롬프트를 조합한다.
- 자막과 대사는 이미지 안에 글자로 그리라는 지시가 아니라 장면 이해를 위한 참고값이다.
- 생성 결과는 오른쪽 preview에 표시한다.

### 3열: Preview

역할은 생성 이미지 결과 확인과 내보내기다.

포함 항목:

- `Preview` 제목
- 생성 이미지 표시 영역
- 회색 placeholder
- `현재 컷 PNG`
- `전체 ZIP`

v1의 오른쪽 preview는 생성 이미지 결과를 보여주는 영역이다. 자막과 대사 텍스트 레이어는 보여주지 않는다. 기존 export 결과에서 HTML/CSS 레이어를 유지할지 여부는 구현 중 기존 export 호환성을 기준으로 판단한다.

## 시각 스타일

테마는 Linear Studio 계열이다.

규칙:

- 배경은 흰색과 near-white를 사용한다.
- 화면 구조는 얇은 중립 border로 나눈다.
- primary action은 블루 계열을 유지한다.
- active state, focus, 주요 CTA에만 블루를 쓴다.
- metadata는 chip으로 표시한다.
- 카드형 UI 반복을 피한다.
- 장식용 gradient, 컬러 strip, 큰 그림자는 쓰지 않는다.
- placeholder는 충분히 읽히는 회색으로 조정한다.
- label, 입력값, placeholder, divider, active row의 대비를 명확히 한다.

## 라우팅

- `/projects`: Studio Workbench 기본 진입점
- `/workspace/[projectId]`: 기존 북마크 호환용 deep link. 같은 Workbench를 열고 해당 프로젝트를 선택한다.
- `/assets`: 전역 Assets/Settings 화면 유지
- `/settings`: 기존대로 `/assets?section=api-key`로 redirect

## 데이터와 호환성

이번 개편은 UI composition과 orchestration 중심이다.

유지:

- 기존 `Project` 타입
- 기존 `Cut` 타입
- 기존 SQLite schema
- 기존 프로젝트/컷 API
- 기존 `local-studio-assets`
- 기존 `local-studio-settings`
- 기존 PNG/ZIP export 구조

필요 시 추가 가능한 것:

- `한 번에 제작`을 더 정교하게 만들기 위한 batch orchestration helper
- 단, API key 저장 정책과 local-first 원칙은 바꾸지 않는다.

## v1 범위

포함:

- 단일 Studio Workbench 화면
- Linear Studio 스타일
- 프로젝트 생성/목록/삭제 hover
- 프로젝트 metadata chip
- 카드뉴스 전용 `전체 시나리오`
- 카드뉴스 전용 `한 번에 제작`
- 컷 수 borderless icon stepper
- 컷 목록 부제목 제거
- 중앙 컷별 입력 폼
- 중앙 `이미지 생성`
- 오른쪽 image-only preview
- PNG/ZIP export 액션
- `/workspace/[projectId]` deep link 호환

제외:

- preview 요소 직접 선택 편집
- rich text toolbar
- preview 안 drag handle
- 다크 모드
- 클라우드 동기화
- API key 외부 저장

## v2 메모

Genspark식 고급 편집은 v2에서 다룬다. v2에서는 preview 안의 텍스트나 이미지 요소를 선택하고 floating toolbar로 편집할 수 있다. 이 기능은 별도의 layer/document model과 selection state가 필요하므로 v1 Workbench refactor와 섞지 않는다.

## 반응형

데스크톱:

- 3열: Projects, Production Input, Preview
- 중앙 열 내부는 컷 목록과 컷 편집 폼으로 재분할

태블릿:

- Projects와 Production Input은 가능한 한 유지
- Preview는 아래로 내려가거나 별도 섹션으로 접힌다.

모바일:

- 세 영역을 세로로 쌓는다.
- 같은 mental model을 유지한다: Projects, Cuts/Input, Preview.
- 가로 overflow와 텍스트 겹침이 없어야 한다.

## 수용 기준

- 왼쪽 열에서 프로젝트를 생성할 수 있다.
- 왼쪽 열에서 프로젝트를 선택할 수 있다.
- 프로젝트 행에는 chip metadata가 보인다.
- 프로젝트 행 hover 시 삭제 버튼이 보인다.
- 카드뉴스 프로젝트에는 `전체 시나리오`와 `한 번에 제작`이 보인다.
- 인스타툰 프로젝트에는 `전체 시나리오` batch 영역이 보이지 않는다.
- 컷 수 컨트롤은 border 없는 `+`, `-` 아이콘형이다.
- 컷 행에는 이미지 상태 부제목이 보이지 않는다.
- 컷 시나리오, 자막, 대사, 이미지 프롬프트는 중앙에서 편집한다.
- 현재 컷 이미지는 중앙의 `이미지 생성` 버튼으로 생성한다.
- 오른쪽 preview는 자막/대사 텍스트 레이어가 아니라 생성 이미지 결과를 보여준다.
- export 액션은 오른쪽 preview 열에서 사용할 수 있다.
- 기존 프로젝트/컷/Assets/Settings/export 데이터와 호환된다.

## 검증 계획

정적 검증:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

브라우저 검증:

- `/projects`
- `/workspace/[projectId]`
- `/assets`
- 카드뉴스 프로젝트에서 전체 시나리오, 컷 수, `한 번에 제작`
- 인스타툰 프로젝트에서 전체 시나리오 batch 영역 미노출
- 현재 컷에서 필드 수정 후 `이미지 생성`
- preview 업데이트 확인
- 현재 컷 PNG
- 전체 ZIP

반응형 검증:

- 데스크톱에서 열 겹침 없음
- 모바일에서 가로 overflow 없음
- 프로젝트 chip, icon-only cut control, 긴 한국어 텍스트가 겹치지 않음
