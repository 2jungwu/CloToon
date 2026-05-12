# 자막 박스 에디터 2단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 자막 HTML/CSS 오버레이를 유지하면서, 미리보기에서 자막 박스를 선택해 위치, 크기, 패딩, 폰트, 색상, 테두리를 컷별로 편집하고 저장할 수 있게 만든다.

**Architecture:** Gemini는 이미지와 대사까지 포함한 아트 레이어를 만들고, `caption`은 HTML/CSS 자막 박스로 합성한다. 편집 화면에서는 `react-moveable`을 자막 DOM 요소에만 붙이고, PNG/ZIP export에서는 편집 핸들을 렌더링하지 않는다. 모든 위치와 크기는 캔버스 기준 퍼센트로 저장해 preview/export 스케일 차이를 흡수한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, local SQLite, `html-to-image`, `react-moveable`.

---

## 파일 구조

- Modify: `apps/studio/package.json`
  - `react-moveable` 의존성을 추가한다.
- Modify: `package-lock.json`
  - `npm install react-moveable` 결과를 반영한다.
- Modify: `apps/studio/lib/cuts/caption-style.ts`
  - 자막 스타일 타입을 위치/크기/패딩/색상/두께까지 확장한다.
  - 기존 `position`, `align`, `fontSize` 저장값을 새 구조로 호환 처리한다.
- Modify: `apps/studio/lib/cuts/caption-style.test.ts`
  - normalize/serialize/parse 호환성과 clamp 동작을 테스트한다.
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
  - `CutExportCanvas`에 `mode: "preview" | "export"`를 추가한다.
  - `EditableCaptionOverlay` 또는 동등한 내부 컴포넌트를 추가해 `react-moveable`을 연결한다.
  - `CaptionStyleControls`를 자막 속성 패널로 확장한다.
- Modify: `apps/studio/app/styles.css`
  - 자막 박스를 CSS variable 기반 geometry/style로 변경한다.
  - 편집 핸들 전용 스타일과 export 제외 스타일을 추가한다.
- Modify: `apps/studio/lib/cuts/types.ts`
  - `CaptionStyleOverride` 확장 타입을 컷 타입에 반영한다.
- Modify: `apps/studio/lib/cuts/repository.ts`
  - 기존 JSON 저장 문자열을 그대로 사용하되 확장된 타입 normalize를 통과시킨다.
- Modify: `apps/studio/app/api/projects/[projectId]/cuts/[cutId]/route.ts`
  - PATCH validation이 확장된 `captionStyleOverride`를 허용하는지 확인하고 필요 시 보정한다.
- Modify: `docs/IMAGE_GENERATION.md`
  - 자막은 편집 가능한 HTML/CSS 레이어이며, 대사는 이미지 생성 모델에 맡기는 현재 정책을 반영한다.

---

### Task 1: 의존성 추가와 기준 검증

**Files:**
- Modify: `apps/studio/package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: 현재 테스트 기준선을 확인한다**

Run:

```powershell
npm run test
npm run typecheck
```

Expected: 현재 브랜치 기준으로 둘 다 통과한다.

- [ ] **Step 2: `react-moveable` 의존성을 추가한다**

Run:

```powershell
npm install react-moveable --workspace apps/studio
```

Expected: `apps/studio/package.json`의 `dependencies`에 `react-moveable`이 추가되고 `package-lock.json`이 갱신된다.

- [ ] **Step 3: 의존성 추가 후 타입 체크를 확인한다**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: 커밋한다**

Run:

```powershell
git add apps/studio/package.json package-lock.json
git commit -m "chore: add caption editor dependency"
```

---

### Task 2: 자막 스타일 타입을 편집 가능한 박스 모델로 확장

**Files:**
- Modify: `apps/studio/lib/cuts/caption-style.ts`
- Modify: `apps/studio/lib/cuts/caption-style.test.ts`

- [ ] **Step 1: 실패 테스트를 먼저 추가한다**

`apps/studio/lib/cuts/caption-style.test.ts`에 다음 케이스를 추가한다.

```ts
test("normalizes caption geometry and visual style", () => {
  const normalized = normalizeCaptionStyleOverride({
    xPct: -10,
    yPct: 110,
    widthPct: 200,
    heightPct: 1,
    paddingXPct: 20,
    paddingYPct: -1,
    fontSize: 999,
    fontWeight: 100,
    color: "#111111",
    backgroundColor: "#ffffff",
    borderColor: "#000000",
    borderWidth: 12,
    align: "left",
  });

  assert.equal(normalized.xPct, 0);
  assert.equal(normalized.yPct, 100);
  assert.equal(normalized.widthPct, 96);
  assert.equal(normalized.heightPct, 8);
  assert.equal(normalized.paddingXPct, 12);
  assert.equal(normalized.paddingYPct, 0);
  assert.equal(normalized.fontSize, captionFontSizeMax);
  assert.equal(normalized.fontWeight, 400);
  assert.equal(normalized.color, "#111111");
  assert.equal(normalized.backgroundColor, "#ffffff");
  assert.equal(normalized.borderColor, "#000000");
  assert.equal(normalized.borderWidth, 8);
  assert.equal(normalized.align, "left");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run:

```powershell
npm run test
```

Expected: 새 필드가 아직 없어서 FAIL.

- [ ] **Step 3: `CaptionStyle` 타입과 기본값을 확장한다**

`apps/studio/lib/cuts/caption-style.ts`의 타입을 다음 의미로 확장한다.

```ts
export type CaptionStyle = {
  align: CaptionAlign;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  color: string;
  fontSize: number;
  fontWeight: number;
  heightPct: number;
  paddingXPct: number;
  paddingYPct: number;
  position: CaptionPosition;
  widthPct: number;
  xPct: number;
  yPct: number;
};
```

기본값은 기존 하단 자막 형태를 유지한다.

```ts
export const defaultCaptionStyle: CaptionStyle = {
  align: "center",
  backgroundColor: "#ffffff",
  borderColor: "#000000",
  borderWidth: 2,
  color: "#000000",
  fontSize: 56,
  fontWeight: 900,
  heightPct: 18,
  paddingXPct: 5,
  paddingYPct: 4.5,
  position: "bottom",
  widthPct: 92,
  xPct: 4,
  yPct: 78,
};
```

- [ ] **Step 4: legacy `position` 호환을 유지한다**

`normalizeCaptionStyleOverride`에서 `position`만 저장된 기존 컷은 다음처럼 geometry를 보정한다.

```ts
if (normalized.position === "top") {
  normalized.yPct = normalized.yPct ?? 4;
}

if (normalized.position === "middle") {
  normalized.yPct = normalized.yPct ?? 41;
}

if (normalized.position === "bottom") {
  normalized.yPct = normalized.yPct ?? 78;
}
```

- [ ] **Step 5: 테스트를 통과시킨다**

Run:

```powershell
npm run test
```

Expected: PASS.

- [ ] **Step 6: 커밋한다**

Run:

```powershell
git add apps/studio/lib/cuts/caption-style.ts apps/studio/lib/cuts/caption-style.test.ts
git commit -m "feat: extend caption style model"
```

---

### Task 3: export와 preview 렌더링을 CSS variable 기반 박스로 변경

**Files:**
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: `CutExportCanvas`에 mode를 추가한다**

`CutExportCanvas` props를 다음처럼 바꾼다.

```ts
function CutExportCanvas({
  captionStyle,
  cut,
  exportId,
  fonts,
  mode = "export",
  project,
}: {
  captionStyle: CaptionStyle;
  cut: Cut;
  exportId: string;
  fonts: StudioFonts;
  mode?: "preview" | "export";
  project: Project;
}) {
```

- [ ] **Step 2: 자막 style 변수를 geometry까지 확장한다**

`article` style에 다음 변수를 추가한다.

```ts
"--cut-caption-x-pct": captionStyle.xPct,
"--cut-caption-y-pct": captionStyle.yPct,
"--cut-caption-width-pct": captionStyle.widthPct,
"--cut-caption-height-pct": captionStyle.heightPct,
"--cut-caption-padding-x-pct": captionStyle.paddingXPct,
"--cut-caption-padding-y-pct": captionStyle.paddingYPct,
"--cut-caption-color": captionStyle.color,
"--cut-caption-background": captionStyle.backgroundColor,
"--cut-caption-border-color": captionStyle.borderColor,
"--cut-caption-border-width-px": captionStyle.borderWidth,
"--cut-caption-font-weight": captionStyle.fontWeight,
```

- [ ] **Step 3: CSS에서 위치 class 의존도를 낮춘다**

`.comic-caption`의 `left`, `right`, `bottom`, `min-height`, `padding`, `font-weight`, `background`, `border`를 CSS variable 기반으로 바꾼다.

```css
.comic-caption {
  background: var(--cut-caption-background, #ffffff);
  border: calc(var(--cut-caption-border-width-px, 2) * 1px) solid
    var(--cut-caption-border-color, var(--export-black));
  color: var(--cut-caption-color, var(--export-black));
  font-weight: var(--cut-caption-font-weight, 900);
  height: calc(var(--cut-caption-height-pct, 18) * 1%);
  left: calc(var(--cut-caption-x-pct, 4) * 1%);
  padding: calc(var(--cut-caption-padding-y-pct, 4.5) * 1%)
    calc(var(--cut-caption-padding-x-pct, 5) * 1%);
  top: calc(var(--cut-caption-y-pct, 78) * 1%);
  width: calc(var(--cut-caption-width-pct, 92) * 1%);
}
```

- [ ] **Step 4: export가 기존과 비슷한지 브라우저에서 확인한다**

Run:

```powershell
npm run typecheck
npm run lint
```

Expected: PASS.

브라우저 확인:
- `http://127.0.0.1:4001/projects`
- 자막이 기존 하단 박스와 유사하게 보인다.
- 대사 HTML 오버레이는 보이지 않는다.

- [ ] **Step 5: 커밋한다**

Run:

```powershell
git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
git commit -m "feat: render caption box with editable geometry"
```

---

### Task 4: `react-moveable` 기반 자막 직접 조작 컴포넌트 추가

**Files:**
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: `ImagePreviewPanel`에 편집 콜백을 전달한다**

`ImagePreviewPanelProps`에 다음을 추가한다.

```ts
onChangeCaptionStyle: (patch: Partial<CaptionStyle>) => void;
onCommitCaptionStyle: () => void;
```

- [ ] **Step 2: preview mode에서만 moveable을 렌더링한다**

`ImagePreviewPanel`의 `CutExportCanvas` 호출에 다음 props를 전달한다.

```tsx
<CutExportCanvas
  captionStyle={resolveCaptionStyle(cut.captionStyleOverride)}
  cut={cut}
  exportId={`preview-${cut.id}`}
  fonts={fonts}
  mode="preview"
  onChangeCaptionStyle={onChangeCaptionStyle}
  onCommitCaptionStyle={onCommitCaptionStyle}
  project={project}
/>
```

- [ ] **Step 3: `EditableCaptionMoveable` 컴포넌트를 추가한다**

동일 파일 하단에 `Moveable`을 동적 import로 붙인다.

```tsx
const Moveable = dynamic(() => import("react-moveable"), {
  ssr: false,
});
```

자막 `p` 요소에는 ref를 연결한다.

```tsx
const captionRef = useRef<HTMLParagraphElement | null>(null);
```

- [ ] **Step 4: drag/resize 결과를 퍼센트로 저장한다**

핸들 이벤트에서 캔버스 rect 기준으로 계산한다.

```ts
function toPct(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}
```

drag 종료 시:

```ts
onChangeCaptionStyle({
  xPct: clamp(toPct(nextLeft, canvasRect.width), 0, 100),
  yPct: clamp(toPct(nextTop, canvasRect.height), 0, 100),
});
onCommitCaptionStyle();
```

resize 종료 시:

```ts
onChangeCaptionStyle({
  heightPct: clamp(toPct(nextHeight, canvasRect.height), 8, 80),
  widthPct: clamp(toPct(nextWidth, canvasRect.width), 24, 96),
  xPct: clamp(toPct(nextLeft, canvasRect.width), 0, 100),
  yPct: clamp(toPct(nextTop, canvasRect.height), 0, 100),
});
onCommitCaptionStyle();
```

- [ ] **Step 5: 편집 핸들이 export에 찍히지 않는지 구조로 보장한다**

`Moveable`은 `mode === "preview"`이고 `overlay.hasCaption`일 때만 렌더링한다. `onDownloadCurrentCut`과 ZIP export는 기존처럼 `data-export-cut-id` article만 캡처하므로 Moveable DOM이 해당 article 밖에 있거나 `data-html2canvas-ignore` 성격의 class를 가진다.

- [ ] **Step 6: 스타일을 추가한다**

```css
.caption-moveable-target {
  cursor: move;
}

.moveable-control-box {
  z-index: 20;
}
```

- [ ] **Step 7: 브라우저에서 직접 조작을 확인한다**

확인 기준:
- 자막 박스를 드래그하면 위치가 바뀐다.
- 자막 박스를 리사이즈하면 폭/높이가 바뀐다.
- 컷을 바꿨다가 돌아와도 저장된 위치가 유지된다.
- PNG export에 핸들이 포함되지 않는다.

- [ ] **Step 8: 커밋한다**

Run:

```powershell
git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
git commit -m "feat: add direct caption box editor"
```

---

### Task 5: 자막 속성 패널 확장

**Files:**
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: 기존 `CaptionStyleControls`에 시각 속성을 추가한다**

필드는 다음 순서로 둔다.

1. 위치/정렬
2. 폰트 크기
3. 폰트 굵기
4. 글자색
5. 배경색
6. 테두리색
7. 테두리 두께
8. 패딩

- [ ] **Step 2: 폰트 굵기 옵션을 segmented control로 추가한다**

```tsx
{[400, 600, 700, 900].map((fontWeight) => (
  <button
    data-active={style.fontWeight === fontWeight}
    key={fontWeight}
    onBlur={onCommit}
    onClick={() => onChange({ fontWeight })}
    type="button"
  >
    {fontWeight}
  </button>
))}
```

- [ ] **Step 3: 색상 input을 추가한다**

```tsx
<input
  aria-label="자막 글자색"
  onBlur={onCommit}
  onChange={(event) => onChange({ color: event.target.value })}
  type="color"
  value={style.color}
/>
```

`backgroundColor`, `borderColor`도 같은 패턴으로 추가한다.

- [ ] **Step 4: border/padding numeric input을 추가한다**

```tsx
<input
  max={8}
  min={0}
  onBlur={onCommit}
  onChange={(event) => updateNumber("borderWidth", event.target.value)}
  type="number"
  value={style.borderWidth}
/>
```

- [ ] **Step 5: 패널 레이아웃이 좁은 중앙 컬럼에서 깨지지 않게 CSS를 정리한다**

`.caption-style-editor`는 2열 grid가 아니라 compact row 기반으로 유지한다. 모바일 폭에서는 1열로 자연스럽게 접힌다.

- [ ] **Step 6: 커밋한다**

Run:

```powershell
git add apps/studio/components/studio/studio-workbench.tsx apps/studio/app/styles.css
git commit -m "feat: expand caption style controls"
```

---

### Task 6: API 저장 호환성과 문서 반영

**Files:**
- Modify: `apps/studio/lib/cuts/types.ts`
- Modify: `apps/studio/lib/cuts/repository.ts`
- Modify: `apps/studio/app/api/projects/[projectId]/cuts/[cutId]/route.ts`
- Modify: `docs/IMAGE_GENERATION.md`

- [ ] **Step 1: route validation이 새 필드를 보존하는지 확인한다**

`captionStyleOverride`는 unknown JSON을 받은 뒤 `normalizeCaptionStyleOverrideOrNull`로 정규화한다. 지원하지 않는 필드는 저장하지 않는다.

- [ ] **Step 2: repository 테스트를 추가한다**

`apps/studio/lib/cuts/repository.test.ts`에 다음 기대를 추가한다.

```ts
assert.deepEqual(savedCut.captionStyleOverride, {
  align: "center",
  fontSize: 64,
  heightPct: 20,
  widthPct: 80,
  xPct: 10,
  yPct: 70,
});
```

- [ ] **Step 3: 문서에 자막 편집 정책을 반영한다**

`docs/IMAGE_GENERATION.md`에 다음 문장을 포함한다.

```md
자막은 Gemini가 이미지 픽셀에 굽는 텍스트가 아니라, 최종 컷의 HTML/CSS 자막 박스로 렌더링한다. 사용자는 컷별로 위치, 크기, 패딩, 폰트 크기, 굵기, 색상, 배경, 테두리를 조정할 수 있다.
```

- [ ] **Step 4: 테스트를 실행한다**

Run:

```powershell
npm run test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: 커밋한다**

Run:

```powershell
git add apps/studio/lib/cuts/types.ts apps/studio/lib/cuts/repository.ts apps/studio/app/api/projects/[projectId]/cuts/[cutId]/route.ts apps/studio/lib/cuts/repository.test.ts docs/IMAGE_GENERATION.md
git commit -m "feat: persist caption editor settings"
```

---

### Task 7: 최종 검증

**Files:**
- No file changes expected.

- [ ] **Step 1: 정적 검증을 실행한다**

Run:

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

Expected: 모두 PASS.

- [ ] **Step 2: 브라우저 검증을 실행한다**

확인 URL:

```text
http://127.0.0.1:4001/projects
http://127.0.0.1:4001/assets?section=api-key
```

확인 기준:
- 자막 박스 선택/이동/리사이즈가 작동한다.
- 자막 속성 패널에서 폰트 크기, 굵기, 색상, 배경, 테두리, 패딩이 반영된다.
- 컷별 스타일이 저장된다.
- 다른 컷으로 이동해도 각 컷의 스타일이 독립적으로 유지된다.
- PNG export에 편집 핸들이 포함되지 않는다.
- 대사 HTML 오버레이가 중복으로 보이지 않는다.

- [ ] **Step 3: 마지막 커밋 또는 수정 커밋을 만든다**

Run:

```powershell
git status --short
```

작업 트리가 비어 있지 않으면 관련 파일만 stage 후 커밋한다.

---

## Self-Review

- Spec coverage: 자막 박스 직접 편집, 컷별 저장, 기존 export 호환, 대사 이미지 생성 정책을 모두 포함했다.
- Placeholder scan: 구현 세부가 필요한 항목마다 실제 파일, 함수, 명령, 기대 결과를 적었다.
- Type consistency: `CaptionStyle`, `CaptionStyleOverride`, `captionStyleOverride` 필드명으로 통일했다.
- Scope check: 이미지 전체 편집기, 대사 편집기, 다중 텍스트 레이어, 회전/스티커/도형 편집은 이번 범위에서 제외했다.
