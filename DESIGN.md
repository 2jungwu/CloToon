# CloToon 디자인 기준

## 1. 시각 방향

이 앱의 화면 UI는 Apple.com 제품 페이지에서 느껴지는 밝고 절제된 제품형 디자인을 참고한다. 목적은 마케팅 페이지를 복제하는 것이 아니라, 로컬 제작 도구의 작업 밀도를 유지하면서 넓은 여백, 깨끗한 흰 표면, 시스템 블루, 얇은 경계, 부드러운 depth를 적용하는 것이다.

핵심 특성:

- 밝은 회색 앱 배경 `#f5f5f7`
- 흰색 패널과 카드 `#ffffff`
- 주요 텍스트 `#1d1d1f`, 보조 텍스트 `#6e6e73`
- primary action과 active state는 시스템 블루 `#0071e3`
- 기능 UI 카드와 패널은 8px radius를 유지하고, 버튼과 상태 pill은 fully rounded
- 강한 다색 장식, 무지개 strip, 과한 그림자는 사용하지 않는다
- 한국어 가독성을 위해 시스템 폰트 우선, Pretendard fallback 사용

## 2. 색상 팔레트

### 앱 UI

- 페이지 배경: `#f5f5f7`
- 기본 표면: `#ffffff`
- 보조 표면: `#fbfbfd`
- 주요 텍스트: `#1d1d1f`
- 보조 텍스트: `#6e6e73`
- placeholder/3차 텍스트: `#86868b`
- primary blue: `#0071e3`
- primary hover: `#0077ed`
- border: `#d2d2d7`
- strong border: `#b9b9c0`

### 상태 색상

- 성공: `#1d8f45`
- 경고: `#bf5b00`
- 오류: `#d70015`
- 보조 accent: purple `#5856d6`, pink `#ff2d55`

### Export 캔버스

PNG/ZIP으로 나가는 컷 템플릿은 앱 UI 테마 변경과 분리한다. 컷 미리보기와 export 결과물에는 `--export-*`와 자막 레이어 CSS 변수를 사용해 출력 스타일을 안정적으로 유지한다.

## 3. 타이포그래피

기본 font stack:

```text
-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", Arial, ui-sans-serif, system-ui, sans-serif
```

| 역할 | 크기 | 굵기 | 행간 | 기준 |
| --- | --- | --- | --- | --- |
| 페이지 제목 | 48px-52px | 700 | 1.06-1.12 | 첫 화면 수준 제목 |
| 패널 제목 | 24px | 700-800 | 1.25 | 제작 도구 표면 |
| 큰 본문 | 18px-19px | 400-500 | 1.42 | 안내 문장 |
| 본문 | 14px-16px | 400-500 | 1.5-1.6 | 폼, 카드, 도움말 |
| 컨트롤 | 14px | 600 | 1.4 | 버튼, 라벨 |
| 캡션/메타 | 12px-13px | 500-600 | 1.4 | 상태와 부가 정보 |

Letter spacing은 0을 기본으로 한다. 라벨과 내비게이션은 uppercase 변환을 하지 않는다.

## 4. 컴포넌트 스타일

### 버튼

- Primary: 시스템 블루 배경, 흰색 텍스트, pill radius
- Secondary: 밝은 회색 배경, 어두운 텍스트, pill radius
- Outline: 흰 표면, 얇은 border, hover 시 blue 또는 strong-border
- Destructive: 낮은 채도의 붉은 배경, 붉은 텍스트

### 카드와 패널

- 흰 배경, `1px solid #d2d2d7`
- 8px radius
- 낮은 opacity의 짧은 shadow
- 중첩 카드는 피한다. 반복 항목은 카드가 될 수 있지만, 페이지 섹션은 카드 안의 카드처럼 만들지 않는다.

### 입력과 선택 컨트롤

- 흰 표면, 얇은 border, 기본 높이 44px
- focus는 시스템 블루 border와 부드러운 blue ring
- placeholder는 3차 텍스트 색상
- select, number input, segmented control은 같은 필드 그리드 안에서 예측 가능한 높이와 폭을 유지한다.

### 상태 pill과 badge

- fully rounded
- 낮은 opacity의 상태 색상 배경
- uppercase 변환 없음

### 자막 레이어 편집기

- 자막 편집기는 텍스트 툴바와 박스 속성 패널을 분리한다.
- 텍스트 툴바는 글자 색상, 크기, 굵게, 기울임, 밑줄, 좌측/가운데 정렬을 한 줄 도구 모음으로 제공한다.
- 색상 선택은 swatch trigger, 2D 색상 영역, hue slider, hex/RGB 입력, preset swatch, 적용/취소 액션을 가진 popover 패턴을 사용한다.
- 자막 박스 설정의 `배경`, `테두리`, `선`, `모서리`, `안쪽여백 X`, `안쪽여백 Y`는 같은 라벨-컨트롤 필드 스타일로 맞춘다.
- 박스 너비는 segmented control로 `전체`, `고정`, `맞춤` 모드를 제공하고, 고정 모드에서만 px 입력을 노출한다.
- Assets의 `자막 스타일` 화면은 Workspace 자막 레이어 편집기와 같은 컨트롤을 사용하고, 텍스트 입력 영역만 숨긴다.
- 기본 자막 스타일 미리보기는 실제 caption layer CSS 변수로 렌더링해 export 스타일과 어긋나지 않게 한다.
- 자막 편집 컨트롤은 앱 UI 편집 도구이고, export 캔버스의 출력 스타일과 충돌하지 않아야 한다.

## 5. 레이아웃

- 앱 내비게이션은 좌측 side rail을 기본으로 하며, 로고, 구분선, `프로젝트`, `에셋`만 노출한다.
- 페이지 본문 최대 폭은 약 1180px을 기준으로 한다.
- 페이지 제목은 border 없이 중앙 정렬하고 상단 여백을 넉넉하게 둔다.
- Projects, Assets, Workspace는 좌측 메뉴와 우측 상세 화면 구조를 공유한다.
- Workspace는 편집 영역과 미리보기 영역을 분리하고, 모바일에서는 단일 열로 자연스럽게 쌓는다.
- 모바일 폭에서는 내비게이션, 버튼, 라벨, 입력 텍스트가 겹치지 않아야 한다.

## 6. 해야 할 것과 하지 말아야 할 것

해야 할 것:

- primary action, link, active state, focus에만 시스템 블루를 사용한다.
- 반복 편집 작업에 맞게 패널을 차분하고 읽기 쉽게 유지한다.
- export 캔버스 스타일은 앱 chrome과 별도로 보존한다.
- 장식 색상보다 여백과 위계를 사용한다.
- 에디터 컨트롤은 색상, select, number input, segmented control의 크기와 라벨 구조를 통일한다.

하지 말아야 할 것:

- Apple 로고, 제품 자산, 독점 UI 표식을 복제하지 않는다.
- 시각 테마 작업의 일부로 클라우드, 계정, 외부 provider 동작을 추가하지 않는다.
- 앱 chrome에 Webflow blue, Webflow 명칭, 다색 strip을 넣지 않는다.
- 시각 refresh 작업에서 DB schema, API contract, localStorage key, export 파일 구조를 바꾸지 않는다.

## 7. 검증 체크리스트

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `/projects`, `/assets`, `/settings`, 기존 프로젝트가 있으면 `/workspace/[projectId]` 브라우저 확인
- 콘솔 오류 0건
- 데스크톱과 모바일 폭에서 텍스트와 컨트롤 겹침 없음
- 자막 컬러 피커, 자막 박스 컨트롤, Assets 기본 자막 스타일, 미리보기 자막 렌더링 동작 확인
- export 캔버스 출력이 기존 템플릿 동작과 의도치 않게 달라지지 않음
