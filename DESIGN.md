# Design System Inspired by Apple Product Pages

## 1. Visual Theme & Atmosphere

이 앱의 화면 UI는 Apple.com 제품 페이지에서 느껴지는 밝고 절제된 제품형 디자인을 참고한다. 목적은 마케팅 페이지를 복제하는 것이 아니라, 로컬 제작 도구의 작업 밀도를 유지하면서 더 넓은 여백, 깨끗한 흰 표면, 시스템 블루, 얇은 경계, 부드러운 depth를 적용하는 것이다.

**핵심 특성**

- 밝은 회색 앱 배경 `#f5f5f7`
- 흰색 패널과 카드 `#ffffff`
- 주요 텍스트 `#1d1d1f`, 보조 텍스트 `#6e6e73`
- primary action과 active state는 시스템 블루 `#0071e3`
- 기능 UI 카드는 8px radius를 유지하고, 버튼과 상태 pill은 fully rounded
- 강한 다색 장식, 무지개 strip, 과한 그림자는 사용하지 않는다
- 한국어 가독성을 위해 시스템 폰트 우선, Pretendard fallback 사용

## 2. Color Palette & Roles

### App UI

- **Page background**: `#f5f5f7`
- **Surface**: `#ffffff`
- **Elevated surface**: `#fbfbfd`
- **Primary text**: `#1d1d1f`
- **Secondary text**: `#6e6e73`
- **Tertiary text / placeholder**: `#86868b`
- **Primary blue**: `#0071e3`
- **Primary hover**: `#0077ed`
- **Border**: `#d2d2d7`
- **Strong border**: `#b9b9c0`

### Status

- **Success**: `#1d8f45`
- **Warning**: `#bf5b00`
- **Error**: `#d70015`
- **Secondary accents**: purple `#5856d6`, pink `#ff2d55`

### Export Canvas

PNG/ZIP으로 나가는 컷 템플릿은 앱 UI 테마 변경과 분리한다. 컷 미리보기와 export 결과물에는 `--export-*` 토큰을 사용해 기존 출력 스타일을 보존한다.

## 3. Typography Rules

### Font stack

`-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", Arial, ui-sans-serif, system-ui, sans-serif`

| Role | Size | Weight | Line Height | Notes |
| --- | --- | --- | --- | --- |
| Page Title | 48px-52px | 700 | 1.06-1.12 | Apple product page tone |
| Panel Heading | 24px | 700-800 | 1.25 | Dense tool surfaces |
| Body Large | 18px-19px | 400-500 | 1.42 | Page intro |
| Body | 14px-16px | 400-500 | 1.5-1.6 | Forms, cards, help text |
| Control | 14px | 600 | 1.4 | Buttons, labels |
| Caption | 12px-13px | 500-600 | 1.4 | Status and metadata |

Letter spacing은 0을 기본으로 한다. 라벨과 내비게이션은 uppercase 변환을 하지 않는다.

## 4. Component Styling

### Buttons

- Primary: system blue background, white text, pill radius
- Secondary: light gray background, dark text, pill radius
- Outline: white surface, thin border, blue/strong-border hover
- Destructive: soft red background, red text

### Cards & Panels

- White background, `1px solid #d2d2d7`
- 8px radius
- Subtle shadow: low opacity, short spread
- Nested cards are avoided; repeated items can be cards, page sections stay unframed or panel-based

### Inputs & Selects

- White surface, thin border, 44px default control height
- Focus uses system blue border and soft blue ring
- Placeholder uses tertiary text

### Status Pills & Badges

- Fully rounded
- Low-opacity colored background
- No uppercase transformation

## 5. Layout

- Header: translucent, blurred, 52px tall desktop baseline
- Page shell: max width around 1180px
- Page heading: borderless, centered, generous top spacing
- Workspace/editor surfaces keep existing 3-column desktop and single-column responsive behavior
- Mobile widths must keep nav scrollable and avoid text overlap

## 6. Do's and Don'ts

**Do**

- Use system blue only for primary actions, links, active states, and focus.
- Keep panels calm and readable for repeated editing work.
- Preserve export canvas styling separately from app chrome.
- Use whitespace and hierarchy rather than decorative color strips.

**Don't**

- Do not copy Apple logos, product assets, or proprietary UI marks.
- Do not introduce cloud, account, or external provider behavior as part of visual theming.
- Do not use Webflow blue, Webflow naming, or multi-color Webflow accent strips in app chrome.
- Do not change DB schema, API contracts, localStorage keys, or export file structure for visual refresh work.

## 7. Verification Checklist

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Browser check on `/projects`, `/assets`, `/settings`, and one `/workspace/[projectId]` when a project exists
- Console errors should be 0
- Desktop and mobile layouts should not show overlapping text or broken controls
- Export canvas output should remain visually consistent with the existing template behavior
