# Caption Style Layout Adjustments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assets의 자막 스타일 화면과 Workspace 컷 편집 UI를 요청한 배치, 라벨, 메뉴 스타일 기준으로 조정한다.

**Architecture:** 저장 모델, API, 자막 스타일 정규화 로직은 유지한다. `CaptionLayerEditor`의 공용 라벨을 한 번 바꿔 Assets와 Workspace에 동시에 반영하고, Assets 전용 preview 배치와 Workspace 전용 편집 헤더/컷 목록 스타일은 각 화면의 wrapper CSS로 조정한다.

**Tech Stack:** Next.js App Router, React, TypeScript strict mode, Tailwind CSS v4/global CSS, shadcn UI, Node test runner.

---

## 확정 변경 범위

- Assets > `자막 스타일` 미리보기는 폭을 `400px` 기준으로 중앙 배치한다. 모바일 overflow를 막기 위해 CSS는 `width: min(400px, 100%)`를 쓴다.
- 미리보기는 `CaptionLayerEditor`보다 위에 배치해 `폰트 스타일` 컨트롤 위에 보이게 한다.
- Workspace `컷 시나리오` 입력 영역은 선택 컷 편집 패널에서 제거한다.
- Workspace `기본 스타일 적용` 버튼은 제목 우측이 아니라 제목 하단에 배치한다.
- 공용 자막 스타일 UI의 섹션 라벨 `자막`은 `폰트`로, `텍스트 글자 스타일`은 `폰트 스타일`로 바꾼다.
- Workspace 컷 목록에서 선택 컷 title은 `font-weight: 700`, 미선택 컷 title은 `font-weight: 500`으로 맞춘다.
- Assets 좌측 메뉴는 Workspace `컷 수` 메뉴와 같은 방향의 스타일로 맞춘다. 즉 active 상태는 회색 블록 배경보다 파란 텍스트 강조와 같은 메뉴 타이포그래피 중심으로 맞춘다.

## 파일 구조

- Modify: `apps/studio/app/assets/page.tsx`
  - `CaptionStylePanel` 내부에서 preview를 `CaptionLayerEditor` 위로 이동한다.
  - preview wrapper를 추가해 중앙 정렬 책임을 분리한다.
- Modify: `apps/studio/components/studio/caption-layer-editor.tsx`
  - 공용 labels만 변경한다.
  - 로직과 props는 변경하지 않는다.
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
  - `CutEditor`에서 컷 시나리오 field를 제거한다.
  - `기본 스타일 적용` 버튼을 title 하단 row로 이동한다.
  - 제거 후 미사용 label이 있으면 같이 제거한다.
- Modify: `apps/studio/app/styles.css`
  - Assets preview 폭/중앙 정렬 class 추가.
  - Workspace title action row style 추가.
  - Workspace 컷 목록 font weight 조정.
  - Assets menu item style을 Workspace cut menu에 맞게 scope 조정.

---

## Task 1: 공용 라벨 변경

**Files:**
- Modify: `apps/studio/components/studio/caption-layer-editor.tsx`

- [ ] **Step 1: 공용 labels를 바꾼다.**

`CaptionLayerEditor`의 labels에서 아래 값만 수정한다.

```ts
const labels = {
  // ...
  caption: "\ud3f0\ud2b8",
  captionTextStyle: "\ud3f0\ud2b8 \uc2a4\ud0c0\uc77c",
  // ...
};
```

- [ ] **Step 2: 라벨 변경 범위를 확인한다.**

Run:

```bash
npm run typecheck
```

Expected: TypeScript error 0. Workspace와 Assets가 같은 공용 컴포넌트를 쓰므로 두 화면에 라벨이 함께 반영된다.

---

## Task 2: Assets 자막 스타일 미리보기 배치 변경

**Files:**
- Modify: `apps/studio/app/assets/page.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: preview를 editor 위로 이동한다.**

`CaptionStylePanel` return 안에서 `CaptionLayerEditor`보다 먼저 preview를 렌더링한다.

```tsx
<div className="caption-style-preview-wrap">
  <div
    className="asset-preview caption-style-default-preview"
    style={getCaptionLayerStyle(assets.captionStyleDefaults) as CaptionLayerCSSProperties}
  >
    <p className="image-preview-caption">{previewCaption}</p>
  </div>
</div>

<CaptionLayerEditor
  onChange={(next) => onUpdate(next.captionStyle)}
  showCaptionTextarea={false}
  value={{
    caption: previewCaption,
    captionStyle: assets.captionStyleDefaults,
  }}
/>
```

- [ ] **Step 2: preview 중앙 정렬과 400px 폭을 추가한다.**

`apps/studio/app/styles.css`의 `.caption-style-default-preview` 근처에 추가/수정한다.

```css
.caption-style-preview-wrap {
  display: grid;
  justify-items: center;
}

.caption-style-default-preview {
  aspect-ratio: 1 / 1;
  background: #f5f5f7;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  position: relative;
  width: min(400px, 100%);
}
```

- [ ] **Step 3: 정적 검사를 실행한다.**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: error 0.

---

## Task 3: Workspace 컷 편집 패널 정리

**Files:**
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: 컷 시나리오 입력 영역을 제거한다.**

`CutEditor`에서 아래 블록을 삭제한다.

```tsx
<label className="field-stack">
  {labels.cutScenario}
  <textarea
    onBlur={onFlushSelectedCut}
    onChange={(event) => onUpdateSelectedCut({ scenario: event.target.value })}
    placeholder={labels.cutScenarioPlaceholder}
    rows={5}
    value={selectedCut.scenario}
  />
</label>
```

- [ ] **Step 2: 미사용 label을 제거한다.**

`labels`에서 `cutScenario`, `cutScenarioPlaceholder`가 더 이상 쓰이지 않으면 삭제한다.

- [ ] **Step 3: 기본 스타일 적용 버튼을 title 하단으로 이동한다.**

`CutEditor` header를 아래 구조로 바꾼다.

```tsx
<div className="panel-heading selected-cut-heading">
  <div>
    <h2>{selectedCut.caption || labels.selectedCut}</h2>
    <div className="selected-cut-heading-actions">
      <Button onClick={applyCaptionStyleDefaultsToSelectedCut} type="button" variant="secondary">
        {labels.applyCaptionStyleDefaults}
      </Button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: title 하단 버튼 row style을 추가한다.**

```css
.selected-cut-heading {
  align-items: start;
}

.selected-cut-heading-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
```

- [ ] **Step 5: 정적 검사를 실행한다.**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: 미사용 label/import error 0.

---

## Task 4: 컷 목록과 Assets 메뉴 스타일 조정

**Files:**
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: Workspace 컷 목록 font weight를 맞춘다.**

현재 `.workspace-cut-item strong`의 font weight를 500으로 낮추고 active 상태만 700으로 올린다.

```css
.workspace-cut-item strong {
  font-size: 16px;
  font-weight: 500;
}

.workspace-cut-item[data-active="true"] strong {
  font-weight: 700;
}
```

- [ ] **Step 2: Assets 메뉴를 Workspace 컷 메뉴 스타일에 맞춘다.**

Assets 메뉴에만 scope를 걸어 active 배경을 투명하게 하고, 타이포그래피를 컷 목록과 맞춘다.

```css
.asset-layout .split-menu-item {
  color: var(--app-text-secondary);
  font-size: 16px;
  font-weight: 500;
  min-height: 54px;
}

.asset-layout .split-menu-item:hover,
.asset-layout .split-menu-item:focus-visible {
  background: transparent;
  color: var(--app-blue);
}

.asset-layout .split-menu-item[data-active="true"] {
  background: transparent;
  color: var(--app-blue);
  font-weight: 700;
}
```

- [ ] **Step 3: 모바일 메뉴 overflow를 확인한다.**

Run:

```bash
npm run lint
```

Expected: CSS lint 대상은 아니지만 ESLint error 0. 브라우저 검증에서 모바일 폭도 확인한다.

---

## Task 5: 브라우저 검증

**Files:**
- All touched files

- [ ] **Step 1: 전체 검증 명령을 실행한다.**

Run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: 모두 exit 0. `git diff --check`의 CRLF warning은 허용하되 whitespace error는 없어야 한다.

- [ ] **Step 2: 로컬 브라우저에서 Assets를 확인한다.**

Run:

```bash
npm run dev
```

확인 URL:

- `http://127.0.0.1:3000/assets?section=caption-style`

확인 기준:

- 좌측 Assets 메뉴가 Workspace 컷 목록 메뉴와 같은 느낌의 active/hover 스타일을 쓴다.
- `자막 스타일` preview가 `폰트 스타일` 컨트롤 위에 있다.
- preview는 중앙 정렬되어 있고 desktop 기준 폭이 400px이다.
- 모바일 폭에서 preview가 화면을 넘지 않는다.
- 공용 편집기 첫 섹션 title은 `폰트`, subtitle은 `폰트 스타일`이다.

- [ ] **Step 3: 로컬 브라우저에서 Workspace를 확인한다.**

확인 URL:

- `http://127.0.0.1:3000/workspace/[projectId]`

확인 기준:

- 선택 컷 편집 패널에서 `컷 시나리오` 입력 영역이 보이지 않는다.
- `기본 스타일 적용` 버튼이 title 하단에 있다.
- 공용 편집기 첫 섹션 title은 `폰트`, subtitle은 `폰트 스타일`이다.
- 컷 목록에서 선택 컷 title은 굵게 700, 미선택 title은 500이다.
- 기존 caption, dialogue, imagePrompt 편집과 자막 스타일 편집 동작은 유지된다.

---

## Self-Review

- Spec coverage: 6개 사용자 지시를 Task 1-4에 모두 배치했다.
- Placeholder scan: 미정 항목 없이 파일, selector, CSS, 검증 URL을 명시했다.
- Type consistency: 저장 필드와 API는 변경하지 않는다. 변경 대상은 공용 labels, JSX 배치, CSS class뿐이다.
