# Caption Style Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assets에 `자막 스타일` 메뉴를 추가해 전역 기본 자막 스타일을 저장하고, 새 컷에는 자동 적용하며 기존 컷은 사용자가 명시적으로 적용할 때만 변경한다.

**Architecture:** `local-studio-assets`에 `captionStyleDefaults`를 추가하고 `CaptionStyle` 정규화 로직을 재사용한다. Workspace의 자막 레이어 편집 UI를 공용 컴포넌트로 분리해 Assets와 Workspace가 같은 컨트롤을 쓰게 한다. 새 컷 생성 경로는 localStorage의 기본 스타일을 읽어 `captionStyle`로 전달하고, 기존 컷은 `기본 스타일 적용` 버튼을 눌렀을 때만 PATCH한다.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, localStorage, SQLite cuts API, zod, Node test runner, Tailwind CSS v4/global CSS.

---

## 확정 정책

- `Assets > 자막 스타일` 메뉴를 새로 만든다.
- `자막 스타일` 화면에는 Workspace에서 만든 자막 레이어 편집 UI와 같은 컨트롤을 적용한다.
- Assets의 기본 스타일은 앞으로 생성되는 새 컷에 자동 적용한다.
- 기존 컷은 전역 기본 스타일 저장만으로 변경하지 않는다.
- 기존 컷은 Workspace에서 `기본 스타일 적용`을 눌렀을 때 선택 컷에만 적용한다.
- 컷 복제는 새 기본값이 아니라 원본 컷의 `captionStyle`을 유지한다.

## 파일 구조

- Modify: `apps/studio/lib/caption-style/types.ts`
  - 기존 `defaultCaptionStyle`을 계속 기준값으로 사용한다.
- Modify: `apps/studio/lib/caption-style/schema.ts`
  - assets 저장값에도 사용할 수 있도록 `normalizeCaptionStyle`을 재사용한다.
- Create: `apps/studio/lib/caption-style/storage.ts`
  - `loadCaptionStyleDefaultsFromStorage(storage)` 추가.
  - `readCaptionStyleDefaultsFromAssets(value)` 추가.
- Modify: `apps/studio/lib/caption-style/caption-style.test.ts`
  - assets 기본 스타일 로딩/정규화 테스트 추가.
- Create: `apps/studio/components/studio/caption-layer-editor.tsx`
  - Workspace에 있던 `CaptionLayerEditor`, `CaptionColorControl`, 숫자 입력, 박스 컨트롤 UI를 공용 컴포넌트로 분리한다.
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
  - 분리한 공용 컴포넌트를 사용한다.
  - 새 컷 생성 시 Assets 기본 스타일을 적용한다.
  - `기본 스타일 적용` 버튼을 선택 컷 자막 편집 영역에 추가한다.
- Modify: `apps/studio/app/assets/page.tsx`
  - `AssetSection`에 `"caption-style"` 추가.
  - `StudioAssets`에 `captionStyleDefaults: CaptionStyle` 추가.
  - `CaptionStylePanel` 추가.
  - 저장/마이그레이션/preview payload에 기본 자막 스타일 반영.
- Modify: `apps/studio/app/styles.css`
  - 공용 자막 스타일 컨트롤이 Assets와 Workspace에서 모두 깨지지 않도록 필요한 layout class 조정.
- Modify: `PRD.md`, `ROADMAP.md`, `DESIGN.md`, `AGENTS.md`, `docs/IMAGE_GENERATION.md`
  - Assets `자막 스타일` 메뉴와 기본 스타일 적용 정책 문서화.

---

## Task 1: Caption Style Defaults Storage

**Files:**
- Create: `apps/studio/lib/caption-style/storage.ts`
- Modify: `apps/studio/lib/caption-style/caption-style.test.ts`

- [ ] **Step 1: storage helper의 실패 테스트를 추가한다.**

`apps/studio/lib/caption-style/caption-style.test.ts`에 아래 테스트를 추가한다.

```ts
import {
  loadCaptionStyleDefaultsFromStorage,
  readCaptionStyleDefaultsFromAssets,
} from "./storage.ts";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

test("readCaptionStyleDefaultsFromAssets falls back to default style", () => {
  assert.deepEqual(readCaptionStyleDefaultsFromAssets({}), defaultCaptionStyle);
});

test("readCaptionStyleDefaultsFromAssets normalizes saved caption style defaults", () => {
  const style = readCaptionStyleDefaultsFromAssets({
    captionStyleDefaults: {
      text: { color: "#ABCDEF", fontSize: 40 },
      box: { backgroundColor: "#101010", borderWidth: 4, paddingX: 44 },
    },
  });

  assert.equal(style.text.color, "#abcdef");
  assert.equal(style.text.fontSize, 40);
  assert.equal(style.box.backgroundColor, "#101010");
  assert.equal(style.box.borderWidth, 4);
  assert.equal(style.box.paddingX, 44);
  assert.equal(style.box.paddingY, defaultCaptionStyle.box.paddingY);
});

test("loadCaptionStyleDefaultsFromStorage reads local-studio-assets caption defaults", () => {
  const storage = new MemoryStorage();
  storage.setItem(
    "local-studio-assets",
    JSON.stringify({
      captionStyleDefaults: {
        text: { color: "#123456" },
        box: { borderRadius: 12 },
      },
    }),
  );

  const style = loadCaptionStyleDefaultsFromStorage(storage);

  assert.equal(style.text.color, "#123456");
  assert.equal(style.box.borderRadius, 12);
});
```

- [ ] **Step 2: 실패를 확인한다.**

Run:

```bash
npm run test -- --test-name-pattern "CaptionStyleDefaults|readCaptionStyleDefaults|loadCaptionStyleDefaults"
```

Expected: `apps/studio/lib/caption-style/storage.ts`가 없어서 import 실패.

- [ ] **Step 3: storage helper를 구현한다.**

`apps/studio/lib/caption-style/storage.ts`를 생성한다.

```ts
import { assetsStorageKey } from "@/lib/image-generation/storage";
import { defaultCaptionStyle, type CaptionStyle } from "./types";
import { normalizeCaptionStyle } from "./schema";

export function loadCaptionStyleDefaultsFromStorage(storage: Storage): CaptionStyle {
  return readCaptionStyleDefaultsFromAssets(readStorageJson(storage, assetsStorageKey));
}

export function readCaptionStyleDefaultsFromAssets(value: unknown): CaptionStyle {
  if (!isRecord(value)) {
    return defaultCaptionStyle;
  }

  return normalizeCaptionStyle(value.captionStyleDefaults);
}

function readStorageJson(storage: Storage, key: string) {
  try {
    const saved = storage.getItem(key);
    return saved ? (JSON.parse(saved) as unknown) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

- [ ] **Step 4: 테스트 통과를 확인한다.**

Run:

```bash
npm run test -- --test-name-pattern "readCaptionStyleDefaults|loadCaptionStyleDefaults"
```

Expected: 새 테스트 통과.

---

## Task 2: Assets Data Model and Migration

**Files:**
- Modify: `apps/studio/app/assets/page.tsx`

- [ ] **Step 1: Assets 타입에 기본 자막 스타일을 추가한다.**

상단 import에 추가한다.

```ts
import { normalizeCaptionStyle } from "@/lib/caption-style/schema";
import { defaultCaptionStyle, type CaptionStyle } from "@/lib/caption-style/types";
```

`StudioAssets`에 필드를 추가한다.

```ts
type StudioAssets = {
  version: 2;
  characters: CharacterAsset[];
  selectedCharacterId: string;
  background: {
    name: string;
    prompt: string;
    color: string;
  };
  fonts: {
    subtitle: string;
    dialogue: string;
  };
  captionStyleDefaults: CaptionStyle;
};
```

- [ ] **Step 2: migration에 `captionStyleDefaults`를 반영한다.**

`migrateAssets`의 modern branch에서 `captionStyleDefaults`를 추가한다.

```ts
captionStyleDefaults: normalizeCaptionStyle(value.captionStyleDefaults),
```

legacy branch에서도 같은 값을 추가한다.

```ts
captionStyleDefaults: defaultCaptionStyle,
```

`createDefaultAssets`에도 추가한다.

```ts
captionStyleDefaults: defaultCaptionStyle,
```

`ensureAssets`에서 누락 저장값을 보정한다.

```ts
return {
  ...assets,
  characters,
  selectedCharacterId,
  captionStyleDefaults: normalizeCaptionStyle(assets.captionStyleDefaults),
};
```

- [ ] **Step 3: preview payload에 기본 자막 스타일을 넣는다.**

`buildPreview`의 payload에 아래를 추가한다.

```ts
captionStyleDefaults: assets.captionStyleDefaults,
```

- [ ] **Step 4: 타입 체크로 migration 오류를 확인한다.**

Run:

```bash
npm run typecheck
```

Expected: assets 타입 오류 없음.

---

## Task 3: Shared Caption Layer Editor Component

**Files:**
- Create: `apps/studio/components/studio/caption-layer-editor.tsx`
- Modify: `apps/studio/components/studio/studio-workbench.tsx`

- [ ] **Step 1: 기존 editor props를 공용 형태로 정의한다.**

새 파일 `apps/studio/components/studio/caption-layer-editor.tsx`를 만들고 아래 public props를 기준으로 구현한다.

```tsx
"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { TextAlignCenterIcon, TextAlignLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  clampNumber,
  getColorAreaHsv,
  hexToRgb,
  hsvToRgb,
  normalizeHexColor,
  rgbToHex,
  rgbToHsv,
} from "@/lib/caption-style/color";
import { normalizeCaptionStyle } from "@/lib/caption-style/schema";
import type { CaptionStyle, CaptionWidthMode } from "@/lib/caption-style/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CaptionLayerEditorValue = {
  caption: string;
  captionStyle: CaptionStyle;
};

type CaptionLayerEditorProps = {
  onBlur?: () => void;
  onChange: (value: CaptionLayerEditorValue) => void;
  showCaptionTextarea?: boolean;
  value: CaptionLayerEditorValue;
};
```

- [ ] **Step 2: Workspace에 있던 구현을 새 파일로 이동한다.**

`studio-workbench.tsx`의 아래 구현을 새 파일로 옮긴다.

- `CaptionLayerEditor`
- `CaptionControlField`
- `CaptionColorControl`
- `CaptionNumberInput`
- `mergeCaptionStyle`
- `captionColorPresets`
- `captionFontSizeOptions`
- `captionBorderWidthOptions`
- `captionBorderRadiusOptions`
- `captionWidthModeLabels`

공용 컴포넌트는 `selectedCut`을 직접 받지 않고 `value`와 `onChange`만 사용한다.

```tsx
export function CaptionLayerEditor({
  onBlur,
  onChange,
  showCaptionTextarea = true,
  value,
}: CaptionLayerEditorProps) {
  const captionStyle = normalizeCaptionStyle(value.captionStyle);

  function updateCaptionStyle(patch: CaptionStylePatch) {
    onChange({
      ...value,
      captionStyle: mergeCaptionStyle(captionStyle, patch),
    });
  }

  function updateCaption(caption: string) {
    onChange({ ...value, caption });
  }

  return (
    <section className="caption-layer-editor" aria-label={labels.captionLayerEdit}>
      {/* 기존 Workspace UI와 같은 텍스트 툴바, 박스 컨트롤, 너비 컨트롤을 유지한다. */}
      {showCaptionTextarea ? (
        <textarea
          className="caption-textarea"
          onBlur={onBlur}
          onChange={(event) => updateCaption(event.target.value)}
          placeholder={labels.captionPlaceholder}
          rows={3}
          value={value.caption}
        />
      ) : null}
    </section>
  );
}
```

이 step에서 실제 JSX는 기존 `studio-workbench.tsx`의 동작을 그대로 옮긴다. 버튼 라벨과 class 이름은 유지한다.

- [ ] **Step 3: Workspace에서 공용 컴포넌트를 사용한다.**

`studio-workbench.tsx`에 import를 추가한다.

```ts
import { CaptionLayerEditor } from "@/components/studio/caption-layer-editor";
```

기존 Workspace wrapper는 아래 형태로 단순화한다.

```tsx
<CaptionLayerEditor
  onBlur={onFlushSelectedCut}
  onChange={(next) =>
    onUpdateSelectedCut({
      caption: next.caption,
      captionStyle: next.captionStyle,
    })
  }
  value={{
    caption: selectedCut.caption,
    captionStyle: selectedCut.captionStyle,
  }}
/>
```

- [ ] **Step 4: 타입 체크로 이동 누락을 확인한다.**

Run:

```bash
npm run typecheck
```

Expected: missing import, duplicate declaration, unused declaration 없음.

---

## Task 4: Assets Caption Style Menu

**Files:**
- Modify: `apps/studio/app/assets/page.tsx`
- Modify: `apps/studio/app/styles.css`

- [ ] **Step 1: 메뉴 타입과 항목을 추가한다.**

`AssetSection`을 변경한다.

```ts
type AssetSection =
  | "characters"
  | "background"
  | "fonts"
  | "caption-style"
  | "api-key"
  | "export";
```

`menuItems`에 추가한다.

```ts
{ id: "caption-style", label: "자막 스타일" },
```

`isAssetSection`도 업데이트한다.

```ts
return (
  value === "characters" ||
  value === "background" ||
  value === "fonts" ||
  value === "caption-style" ||
  value === "api-key" ||
  value === "export"
);
```

- [ ] **Step 2: CaptionStylePanel을 추가한다.**

`assets/page.tsx`에 import를 추가한다.

```ts
import { CaptionLayerEditor } from "@/components/studio/caption-layer-editor";
```

패널 컴포넌트를 추가한다.

```tsx
function CaptionStylePanel({
  assets,
  onSave,
  onUpdate,
  saveState,
}: {
  assets: StudioAssets;
  onSave: () => void;
  onUpdate: (captionStyleDefaults: CaptionStyle) => void;
  saveState: "idle" | "assets" | "settings";
}) {
  return (
    <div className="asset-panel-stack">
      <PanelHead
        eyebrow="Caption"
        title="자막 스타일"
        description="새 컷에 자동 적용할 기본 자막 글자와 박스 스타일을 설정합니다."
      />
      <CaptionLayerEditor
        onChange={(next) => onUpdate(next.captionStyle)}
        showCaptionTextarea={false}
        value={{
          caption: "자막 스타일 미리보기",
          captionStyle: assets.captionStyleDefaults,
        }}
      />
      <div
        className="asset-preview caption-style-default-preview"
        style={getCaptionLayerStyle(assets.captionStyleDefaults)}
      >
        <p className="image-preview-caption">자막 스타일 미리보기</p>
      </div>
      <SaveRow onSave={onSave} saved={saveState === "assets"} />
    </div>
  );
}
```

주의: `getCaptionLayerStyle`가 현재 `studio-workbench.tsx` 내부 함수라면 Task 3에서 `caption-layer-editor.tsx` 또는 별도 util로 export해야 한다.

- [ ] **Step 3: AssetsClient 렌더링에 패널을 연결한다.**

`split-content` 조건 렌더링에 추가한다.

```tsx
{activeSection === "caption-style" ? (
  <CaptionStylePanel
    assets={assets}
    onSave={saveAssets}
    onUpdate={(captionStyleDefaults) =>
      updateAssets((current) => ({ ...current, captionStyleDefaults }))
    }
    saveState={saveState}
  />
) : null}
```

- [ ] **Step 4: preview 스타일을 보강한다.**

`styles.css`에 추가한다.

```css
.caption-style-default-preview {
  aspect-ratio: 1 / 1;
  background: #f1f1f4;
  min-height: 240px;
  overflow: hidden;
  position: relative;
}

.caption-style-default-preview .image-preview-caption {
  bottom: 8%;
}
```

- [ ] **Step 5: 브라우저 없이 정적 검증을 실행한다.**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: error 0.

---

## Task 5: Apply Defaults to New Cuts

**Files:**
- Modify: `apps/studio/components/studio/studio-workbench.tsx`
- Modify: `apps/studio/lib/cuts/repository.test.ts`

- [ ] **Step 1: 새 컷 기본 스타일 적용 테스트를 추가한다.**

`apps/studio/lib/cuts/repository.test.ts`에는 repository가 `captionStyle`을 전달받으면 보존하는 테스트가 이미 있다. 이 task의 핵심은 UI handler이므로 별도 unit test가 어렵다. 대신 repository regression은 유지하고, implementation 후 브라우저 검증에서 새 컷 생성 경로를 확인한다.

- [ ] **Step 2: Workspace에서 기본 스타일을 로드한다.**

`studio-workbench.tsx` import에 추가한다.

```ts
import { loadCaptionStyleDefaultsFromStorage } from "@/lib/caption-style/storage";
```

helper를 추가한다.

```ts
function getCaptionStyleDefaults() {
  if (typeof window === "undefined") {
    return defaultCaptionStyle;
  }

  return loadCaptionStyleDefaultsFromStorage(window.localStorage);
}
```

- [ ] **Step 3: 새 컷 생성 경로에 기본 스타일을 넣는다.**

`createCut` 또는 새 컷 POST를 호출하는 handler에서 `captionStyle`을 추가한다.

```ts
captionStyle: getCaptionStyleDefaults(),
```

적용 대상:

- 일반 새 컷 추가
- 카드뉴스/인스타툰 컷 초안 생성

제외 대상:

- 컷 복제: 원본 컷 스타일 유지
- 기존 컷 로드: DB 값 유지

- [ ] **Step 4: 타입 체크를 실행한다.**

Run:

```bash
npm run typecheck
```

Expected: handler 입력 타입 오류 없음.

---

## Task 6: Manual Apply Default Style to Existing Cut

**Files:**
- Modify: `apps/studio/components/studio/studio-workbench.tsx`

- [ ] **Step 1: 선택 컷에 기본 스타일 적용 handler를 추가한다.**

`CaptionLayerEditor`가 렌더링되는 주변에 handler를 추가한다.

```ts
function applyCaptionStyleDefaultsToSelectedCut() {
  if (!selectedCut) {
    return;
  }

  onUpdateSelectedCut({
    captionStyle: getCaptionStyleDefaults(),
  });
}
```

실제 위치에서는 `selectedCut`과 `onUpdateSelectedCut`이 접근 가능한 컴포넌트 경계에 맞춰 작성한다.

- [ ] **Step 2: 버튼을 추가한다.**

자막 레이어 편집기 헤더 근처에 secondary 버튼을 추가한다.

```tsx
<Button
  onClick={applyCaptionStyleDefaultsToSelectedCut}
  type="button"
  variant="secondary"
>
  기본 스타일 적용
</Button>
```

동작:

- 선택 컷의 `captionStyle`만 바꾼다.
- `caption` 텍스트는 바꾸지 않는다.
- blur 또는 기존 저장 흐름을 통해 PATCH된다.

- [ ] **Step 3: 기존 컷 자동 변경이 없는지 확인한다.**

검토 기준:

- Assets 저장 함수는 cuts API를 호출하지 않는다.
- Workspace initial load는 DB의 `captionStyle`을 그대로 사용한다.
- 기본 스타일 적용 버튼 클릭 때만 선택 컷 `captionStyle`이 바뀐다.

- [ ] **Step 4: lint를 실행한다.**

Run:

```bash
npm run lint
```

Expected: error 0.

---

## Task 7: Documentation Updates

**Files:**
- Modify: `PRD.md`
- Modify: `ROADMAP.md`
- Modify: `DESIGN.md`
- Modify: `AGENTS.md`
- Modify: `docs/IMAGE_GENERATION.md`

- [ ] **Step 1: PRD를 업데이트한다.**

반영 문구:

```md
- Assets의 `자막 스타일` 섹션에서 새 컷에 적용할 기본 자막 글자/박스 스타일을 저장한다.
- 기존 컷은 기본 스타일 저장만으로 자동 변경하지 않고, Workspace의 `기본 스타일 적용` 액션으로 선택 컷에 수동 적용한다.
```

- [ ] **Step 2: ROADMAP을 업데이트한다.**

Phase 추가:

```md
### Phase 7. Assets 자막 스타일 기본값

상태: 완료 예정

- Assets에 `자막 스타일` 메뉴를 추가한다.
- Workspace 자막 레이어 편집 UI를 공용화해 같은 컨트롤을 사용한다.
- 새 컷은 Assets 기본 자막 스타일을 자동 적용한다.
- 기존 컷은 명시 버튼으로만 기본 스타일을 적용한다.
```

- [ ] **Step 3: DESIGN을 업데이트한다.**

반영 문구:

```md
- Assets의 `자막 스타일` 화면은 Workspace 자막 레이어 편집기와 동일한 컨트롤 패턴을 사용한다.
- 기본 스타일 preview는 실제 caption layer CSS 변수로 렌더링한다.
```

- [ ] **Step 4: AGENTS와 IMAGE_GENERATION을 업데이트한다.**

반영 문구:

```md
- `captionStyleDefaults`: `local-studio-assets`에 저장되는 새 컷용 기본 자막 스타일.
- 이미지 생성 payload는 자막 스타일을 장면/레이아웃 맥락으로만 사용하고, 자막을 이미지에 굽지 않는다.
```

- [ ] **Step 5: 문서 diff를 검증한다.**

Run:

```bash
git diff --check
```

Expected: whitespace error 0.

---

## Task 8: Final Verification

**Files:**
- All touched files

- [ ] **Step 1: 단위 테스트를 실행한다.**

Run:

```bash
npm run test
```

Expected: 모든 Node test runner 테스트 통과.

- [ ] **Step 2: 타입 체크를 실행한다.**

Run:

```bash
npm run typecheck
```

Expected: TypeScript error 0.

- [ ] **Step 3: 린트를 실행한다.**

Run:

```bash
npm run lint
```

Expected: ESLint error 0.

- [ ] **Step 4: 빌드를 실행한다.**

Run:

```bash
npm run build
```

Expected: Next build 성공.

- [ ] **Step 5: 브라우저 검증을 실행한다.**

Run:

```bash
npm run dev -- --port 4001
```

확인 URL:

- `http://127.0.0.1:4001/assets?section=caption-style`
- `http://127.0.0.1:4001/projects`
- `http://127.0.0.1:4001/workspace/[projectId]`

확인 항목:

- Assets 메뉴에 `자막 스타일`이 보인다.
- `자막 스타일` 화면이 Workspace 자막 레이어 편집 UI와 같은 컨트롤 패턴을 사용한다.
- 기본 스타일을 저장한 뒤 새 컷을 만들면 새 컷에 적용된다.
- 기존 컷은 Assets 저장만으로 바뀌지 않는다.
- 기존 컷에서 `기본 스타일 적용`을 누르면 선택 컷 스타일만 바뀐다.
- 컷 복제는 원본 컷 스타일을 유지한다.
- PNG/ZIP export에 자막 스타일이 반영된다.

---

## Self-Review

- Spec coverage: Assets 메뉴 추가, Workspace UI 재사용, 새 컷 자동 적용, 기존 컷 수동 적용, 복제 유지, 문서 업데이트, 검증을 모두 task로 포함했다.
- Placeholder scan: 계획에는 `TBD`, `TODO`, "나중에 구현" 같은 미정 항목이 없다.
- Type consistency: 저장 필드는 `captionStyleDefaults`, 컷 필드는 `captionStyle`, DB 직렬화 필드는 `caption_style_json`으로 구분했다.
- Scope: 기본 스타일과 적용 정책만 다루며, drag 기반 직접 편집이나 전체 컷 일괄 적용은 포함하지 않는다.
