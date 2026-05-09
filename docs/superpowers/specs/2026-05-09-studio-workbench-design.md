# Studio Workbench Design

## Summary

Projects and Workspace will be merged into a single Studio Workbench screen. The product should feel like a focused creation tool, not a set of separate setup pages. Users select or create a project on the left, edit the selected project and cut content in the center, and inspect generated image results on the right.

The approved visual direction is a Linear Studio-inspired interface: high contrast, restrained color, thin dividers, dense but readable tool layout, and blue primary actions. The UI should avoid card-heavy composition. Screen structure should be expressed through columns, rows, separators, active rows, chips, and form groups.

## Approved Direction

- Use a single workbench layout for project selection, project creation, cut editing, and preview.
- Keep three major columns on desktop:
  - Left: project list and project creation.
  - Center: selected project setup, full card-news scenario, cut list, and cut-specific fields.
  - Right: generated image preview and export actions.
- Do not move cut fields below the preview. Cut scenario, caption, dialogue, and image prompt stay in the center column.
- The right preview column shows generated image output. Caption and dialogue are not shown as visible text in the v1 preview.
- Dark mode is out of scope.
- Genspark-style direct element selection/editing inside the preview is v2 scope only.

## Layout

### Global Navigation

The top nav should use `Studio` and `Assets`. `Studio` replaces the current split mental model of `Projects` and `Workspace`. Existing navigation labels can be adjusted during implementation, but `Assets` remains separate because it manages global local settings.

### Left Column: Projects

The left column owns project discovery and project creation only.

Contents:

- `Projects` heading.
- New project form.
- Project name input.
- Separate dropdowns for content type and canvas preset.
- Blue primary `프로젝트 추가` action.
- Project list.
- Each project row uses chips for content type, canvas preset, and cut count.
- Project delete action appears on row hover.

Removed from this column:

- Project search.
- Cut controls.
- Workspace-level forms.
- Card-style project detail panels.

### Center Column: Production Input

The center column owns all writing and generation inputs.

Top project setup area:

- Selected project name.
- Content type, canvas preset, and cut count chips.
- Project delete or secondary management action, if needed.
- Full scenario area only for `card-news`.
- The full scenario action label is `한 번에 제작`.

`한 번에 제작` behavior:

- Available only for card-news projects.
- Uses the entered full scenario and configured cut count.
- Calls Gemini through the local app flow to create the full card-news draft.
- It should generate or update the cut structure and images for the card-news flow.
- It must use the localStorage API key only at request time and must not persist the key to files, SQLite, logs, or git.

Lower center area:

- Split center content into cut list and cut editor.
- Cut list includes cut count controls and cut rows.
- Cut count controls show borderless `+` and `-` icon-only controls.
- Cut rows show only the primary cut label, for example `#1 첫 장면`.
- Remove secondary cut subtitles such as `생성 이미지`.
- Cut editor includes:
  - 컷 시나리오
  - 자막
  - 대사
  - 이미지 프롬프트
  - Blue primary `이미지 생성` below the image prompt.

`이미지 생성` behavior:

- Generates only the selected/current cut image.
- Uses character and background assets, cut scenario, caption, dialogue, and image prompt.
- Caption and dialogue are context for generation quality, not text to draw inside the generated image.
- The generated image appears in the right preview column.

### Right Column: Preview

The right column owns visual output and export.

Contents:

- `Preview` heading.
- Generated image preview canvas.
- Placeholder state with gray placeholder text.
- Export actions:
  - `현재 컷 PNG`
  - `전체 ZIP`

The preview should not show caption/dialogue text as a visible layer in v1. This is a change from the earlier HTML text-layer preview direction. In this design, caption and dialogue are generation references and editing fields. Direct editable text overlay is reserved for v2.

## Visual Style

Theme: Linear Studio-inspired.

Rules:

- Use white and near-white surfaces.
- Use thin neutral borders for layout separation.
- Use high-contrast text for labels and active information.
- Keep primary actions blue.
- Use blue for primary CTA, active nav state, focus, and key accents.
- Use chips for compact project metadata.
- Avoid card-heavy page composition.
- Avoid decorative gradients, color strips, and large shadows.
- Placeholders should use a clear gray tone, not low-contrast pale text.
- Maintain strong contrast between labels, input text, placeholder text, dividers, and active rows.

## Routing

Recommended route behavior:

- `/projects` becomes the Studio Workbench entry point.
- `/projects` with no selected project shows the project creation state and/or first available project.
- `/workspace/[projectId]` remains for compatibility and opens the same workbench with that project selected.
- `/assets` remains the global assets/settings screen.
- `/settings` continues redirecting to `/assets?section=api-key`.

## Data And Compatibility

This redesign should not require DB schema changes.

Keep:

- Existing `Project` shape.
- Existing `Cut` shape.
- Existing project and cut APIs unless implementation discovers a necessary local route for batch card-news generation.
- Existing localStorage keys for assets and settings.
- Existing PNG/ZIP export structure.

Changes are primarily UI composition and orchestration.

## V1 Scope

Included:

- Single Studio Workbench layout.
- Linear Studio visual treatment.
- Left project creation/list area.
- Center card-news full scenario and cut editor.
- Right generated image preview and export area.
- Card-news-only `전체 시나리오` and `한 번에 제작`.
- Current-cut `이미지 생성` below `이미지 프롬프트`.
- Project chips.
- Hover delete action for project rows.
- Borderless cut count plus/minus controls.
- Preview focused on generated images.

Excluded:

- Direct in-preview element selection.
- Rich text toolbar.
- Drag handles around preview elements.
- Dark mode.
- Cloud sync or remote persistence.
- API key storage outside browser localStorage.

## V2 Notes

Genspark-style advanced editing is a future feature. In v2, users may select text or visual elements directly inside the preview and edit them with a floating toolbar. That will require a separate interaction model, selection state, and likely a more explicit document/layer representation. It should not be mixed into the v1 workbench refactor.

## Responsive Behavior

Desktop:

- Three columns: Projects, Production Input, Preview.
- Center column can internally split into cut list and cut editor.

Tablet:

- Projects and Production Input can remain side by side.
- Preview may move below or become a sticky panel depending on available width.

Mobile:

- Use stacked sections or tabbed panes.
- Keep the same mental model: Projects, Cuts/Input, Preview.
- Avoid horizontal overflow.
- Form controls and action buttons must keep readable text and accessible tap targets.

## Acceptance Criteria

- Users can create a project from the left column.
- Users can select existing projects from the left column.
- Project rows show metadata through chips.
- Hovering a project row reveals a delete control on desktop.
- Card-news projects show the full scenario input and `한 번에 제작`.
- Comic projects do not show the full scenario batch area.
- Cut count controls use borderless icon-only plus/minus controls.
- Cut rows do not show secondary image status subtitles.
- Cut scenario, caption, dialogue, and image prompt are edited in the center column.
- The selected cut image is generated through the center `이미지 생성` button.
- The preview column shows generated image output, not caption/dialogue text layers.
- Export actions remain available from the preview column.
- The UI uses Linear Studio-like contrast, separators, chips, and blue primary actions.
- Existing project data, cut data, assets, settings, and export formats remain compatible.

## Verification Plan

Static verification:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Browser verification:

- `/projects`
- `/workspace/[projectId]` compatibility route
- `/assets`
- Card-news project flow: full scenario, cut count, `한 번에 제작`.
- Comic project flow: no full scenario batch area.
- Current-cut flow: edit fields, click `이미지 생성`, verify preview updates.
- Export flow: current cut PNG and full ZIP.

Responsive verification:

- Desktop workbench has no overlapping columns or clipped controls.
- Tablet/mobile layouts do not overflow horizontally.
- Project chips and icon-only cut controls remain readable and tappable.
