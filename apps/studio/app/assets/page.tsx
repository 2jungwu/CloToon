"use client";

import Image from "next/image";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Add01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isAllowedReferenceImageDataUrl } from "@/lib/cuts/image-data-url";
import { assetsStorageKey, settingsStorageKey } from "@/lib/image-generation/storage";
import {
  defaultGeminiImageModel,
  geminiImageModels,
  normalizeGeminiImageModel,
  type GeminiImageModel,
} from "@/lib/image-generation/models";

type AssetSection = "characters" | "background" | "fonts" | "api-key" | "export";

type ExpressionImage = {
  id: string;
  name: string;
  dataUrl: string;
};

type CharacterAsset = {
  id: string;
  name: string;
  markdown: string;
  expressions: ExpressionImage[];
};

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
};

type StudioSettings = {
  provider: "gemini";
  geminiApiKey: string;
  geminiModel: GeminiImageModel;
  exportScale: "1080" | "2160";
  saveOriginalHtml: boolean;
};

const menuItems: { id: AssetSection; label: string }[] = [
  { id: "characters", label: "캐릭터" },
  { id: "background", label: "배경" },
  { id: "fonts", label: "폰트" },
  { id: "api-key", label: "API" },
  { id: "export", label: "내보내기" },
];

const defaultMarkdown = `# clo

- 로컬 제작 흐름에 사용하는 기본 캐릭터
- 밝고 선명한 인스타툰 톤
- 과장되지 않은 표정과 깨끗한 실루엣`;

export default function AssetsPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <AssetsLoading />;
  }

  return (
    <AssetsClient
      initialAssets={loadAssets()}
      initialSection={loadInitialSection()}
      initialSettings={loadSettings()}
    />
  );
}

function AssetsClient({
  initialAssets,
  initialSection,
  initialSettings,
}: {
  initialAssets: StudioAssets;
  initialSection: AssetSection;
  initialSettings: StudioSettings;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [settings, setSettings] = useState(initialSettings);
  const [activeSection, setActiveSection] = useState<AssetSection>(initialSection);
  const [expandedCharacterId, setExpandedCharacterId] = useState(initialAssets.selectedCharacterId);
  const [saveState, setSaveState] = useState<"idle" | "assets" | "settings">("idle");

  const selectedCharacter = useMemo(
    () =>
      assets.characters.find((character) => character.id === assets.selectedCharacterId) ??
      assets.characters[0],
    [assets.characters, assets.selectedCharacterId],
  );

  function changeSection(section: AssetSection) {
    setActiveSection(section);
    window.history.replaceState(null, "", section === "characters" ? "/assets" : `/assets?section=${section}`);
  }

  function updateAssets(updater: (current: StudioAssets) => StudioAssets) {
    setAssets((current) => ensureAssets(updater(current)));
    setSaveState("idle");
  }

  function updateSettings(patch: Partial<StudioSettings>) {
    setSettings((current) => ({ ...current, ...patch, provider: "gemini" }));
    setSaveState("idle");
  }

  function saveAssets() {
    window.localStorage.setItem(assetsStorageKey, JSON.stringify(assets));
    setSaveState("assets");
  }

  function saveSettings() {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify({ ...settings, provider: "gemini" }));
    setSaveState("settings");
  }

  function addCharacter() {
    const nextNumber = assets.characters.length + 1;
    const character = createCharacter(`새 캐릭터 ${nextNumber}`);
    setExpandedCharacterId(character.id);
    updateAssets((current) => ({
      ...current,
      characters: [...current.characters, character],
      selectedCharacterId: character.id,
    }));
  }

  function deleteSelectedCharacter() {
    if (assets.characters.length <= 1) {
      return;
    }

    const confirmed = window.confirm(`"${selectedCharacter.name}" 캐릭터를 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    const nextCharacterId =
      assets.characters.find((character) => character.id !== selectedCharacter.id)?.id ??
      selectedCharacter.id;
    setExpandedCharacterId(nextCharacterId);

    updateAssets((current) => {
      const characters = current.characters.filter((character) => character.id !== selectedCharacter.id);
      return {
        ...current,
        characters,
        selectedCharacterId: characters[0]?.id ?? current.selectedCharacterId,
      };
    });
  }

  function selectCharacter(characterId: string) {
    updateAssets((current) => ({ ...current, selectedCharacterId: characterId }));
  }

  function toggleCharacter(characterId: string) {
    setExpandedCharacterId((current) => (current === characterId ? "" : characterId));
    selectCharacter(characterId);
  }

  function updateCharacter(characterId: string, patch: Partial<CharacterAsset>) {
    updateAssets((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === characterId ? { ...character, ...patch } : character,
      ),
    }));
  }

  async function importMarkdown(characterId: string, file: File | null) {
    if (!file) {
      return;
    }

    updateCharacter(characterId, { markdown: await file.text() });
  }

  async function importExpressions(characterId: string, files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const images = await Promise.all(
      Array.from(files).map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);

        return isAllowedReferenceImageDataUrl(dataUrl)
          ? {
              id: createId("expression"),
              name: file.name,
              dataUrl,
            }
          : null;
      }),
    );

    updateAssets((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === characterId
          ? {
              ...character,
              expressions: [
                ...character.expressions,
                ...images.filter((image): image is ExpressionImage => image !== null),
              ],
            }
          : character,
      ),
    }));
  }

  function deleteExpression(characterId: string, expressionId: string) {
    updateAssets((current) => ({
      ...current,
      characters: current.characters.map((character) =>
        character.id === characterId
          ? {
              ...character,
              expressions: character.expressions.filter((image) => image.id !== expressionId),
            }
          : character,
      ),
    }));
  }

  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Assets</p>
        <h1>에셋 설정</h1>
        <p>캐릭터, 배경, 폰트, API, 내보내기 옵션을 로컬에 저장합니다.</p>
      </div>

      <div className="split-layout asset-layout">
        <aside className="split-menu" aria-label="Assets menu">
          <div className="split-menu-list">
            {menuItems.map((item) => (
              <button
                aria-current={activeSection === item.id ? "page" : undefined}
                className="split-menu-item"
                data-active={activeSection === item.id}
                key={item.id}
                onClick={() => changeSection(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="split-content asset-detail">
          {activeSection === "characters" ? (
            <CharacterPanel
              characterCount={assets.characters.length}
              characters={assets.characters}
              onAddCharacter={addCharacter}
              onDeleteCharacter={deleteSelectedCharacter}
              onDeleteExpression={deleteExpression}
              onImportExpressions={importExpressions}
              onImportMarkdown={importMarkdown}
              onSave={saveAssets}
              onToggleCharacter={toggleCharacter}
              onUpdateCharacter={updateCharacter}
              expandedCharacterId={expandedCharacterId}
              saveState={saveState}
            />
          ) : null}

          {activeSection === "background" ? (
            <BackgroundPanel
              assets={assets}
              onSave={saveAssets}
              onUpdate={(background) => updateAssets((current) => ({ ...current, background }))}
              saveState={saveState}
            />
          ) : null}

          {activeSection === "fonts" ? (
            <FontsPanel
              assets={assets}
              onSave={saveAssets}
              onUpdate={(fonts) => updateAssets((current) => ({ ...current, fonts }))}
              saveState={saveState}
            />
          ) : null}

          {activeSection === "api-key" ? (
            <ApiKeyPanel
              onSave={saveSettings}
              onUpdate={updateSettings}
              saveState={saveState}
              settings={settings}
            />
          ) : null}

          {activeSection === "export" ? (
            <ExportPanel
              assets={assets}
              onSave={saveSettings}
              onUpdate={updateSettings}
              saveState={saveState}
              settings={settings}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AssetsLoading() {
  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Assets</p>
        <h1>에셋 설정</h1>
        <p>로컬 에셋 설정을 불러오는 중입니다.</p>
      </div>
      <div className="split-layout asset-layout">
        <aside className="split-menu" aria-label="Assets menu">
          <p className="empty-state">메뉴를 준비하는 중입니다.</p>
        </aside>
        <div className="split-content asset-detail">
          <p className="empty-state">세부 설정을 준비하는 중입니다.</p>
        </div>
      </div>
    </section>
  );
}

function CharacterPanel({
  characterCount,
  characters,
  onDeleteCharacter,
  onDeleteExpression,
  onAddCharacter,
  onImportExpressions,
  onImportMarkdown,
  onSave,
  onToggleCharacter,
  onUpdateCharacter,
  expandedCharacterId,
  saveState,
}: {
  characterCount: number;
  characters: CharacterAsset[];
  onAddCharacter: () => void;
  onDeleteCharacter: () => void;
  onDeleteExpression: (characterId: string, expressionId: string) => void;
  onImportExpressions: (characterId: string, files: FileList | null) => void;
  onImportMarkdown: (characterId: string, file: File | null) => void;
  onSave: () => void;
  onToggleCharacter: (characterId: string) => void;
  onUpdateCharacter: (characterId: string, patch: Partial<CharacterAsset>) => void;
  expandedCharacterId: string;
  saveState: "idle" | "assets" | "settings";
}) {
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>캐릭터</h2>
        </div>
        <Button onClick={onAddCharacter} type="button" variant="secondary">
          <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden />
          캐릭터 추가
        </Button>
      </div>

      <div className="character-disclosure-list">
        {characters.map((character) => {
          const expanded = character.id === expandedCharacterId;
          const bodyId = `character-${character.id}-body`;

          return (
            <section className="character-disclosure" data-open={expanded} key={character.id}>
              <button
                aria-controls={bodyId}
                aria-expanded={expanded}
                className="character-disclosure-trigger"
                onClick={() => onToggleCharacter(character.id)}
                type="button"
              >
                <span className="character-disclosure-title">{character.name}</span>
                <span className="character-disclosure-meta">
                  캐릭터 표정 {character.expressions.length}개
                  <span aria-hidden className="character-disclosure-chevron" />
                </span>
              </button>

              {expanded ? (
                <div className="character-disclosure-body" id={bodyId}>
                  <Label className="field-stack">
                    캐릭터 이름
                    <Input
                      value={character.name}
                      onChange={(event) => onUpdateCharacter(character.id, { name: event.target.value })}
                    />
                  </Label>

                  <Label className="field-stack">
                    캐릭터 설명(md)
                    <Textarea
                      value={character.markdown}
                      rows={10}
                      onChange={(event) => onUpdateCharacter(character.id, { markdown: event.target.value })}
                    />
                  </Label>

                  <div className="toolbar-row">
                    <Label className="upload-button">
                      Markdown 업로드
                      <input
                        type="file"
                        accept=".md,text/markdown,text/plain"
                        onChange={(event) =>
                          onImportMarkdown(character.id, event.target.files?.[0] ?? null)
                        }
                      />
                    </Label>
                    <Label className="upload-button">
                      캐릭터 표정 업로드
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => onImportExpressions(character.id, event.target.files)}
                      />
                    </Label>
                    <Button
                      disabled={characterCount <= 1}
                      onClick={onDeleteCharacter}
                      type="button"
                      variant="destructive"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={18} aria-hidden />
                      캐릭터 삭제
                    </Button>
                  </div>

                  <div className="expression-grid">
                    {character.expressions.map((image) => (
                      <figure key={image.id} className="expression-card">
                        <Image src={image.dataUrl} alt={image.name} width={160} height={160} unoptimized />
                        <figcaption>
                          <span>{image.name}</span>
                          <Button
                            aria-label={`${image.name} 캐릭터 표정 삭제`}
                            onClick={() => onDeleteExpression(character.id, image.id)}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} aria-hidden />
                          </Button>
                        </figcaption>
                      </figure>
                    ))}
                    {character.expressions.length === 0 ? (
                      <p className="empty-state">아직 등록된 캐릭터 표정이 없습니다.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <SaveRow onSave={onSave} saved={saveState === "assets"} />
    </>
  );
}

function BackgroundPanel({
  assets,
  onSave,
  onUpdate,
  saveState,
}: {
  assets: StudioAssets;
  onSave: () => void;
  onUpdate: (background: StudioAssets["background"]) => void;
  saveState: "idle" | "assets" | "settings";
}) {
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>배경 설정</h2>
          <p>컷 생성에 참고할 배경 이름, 프롬프트, 색상을 저장합니다.</p>
        </div>
      </div>

      <Label className="field-stack">
        배경 이름
        <Input
          value={assets.background.name}
          onChange={(event) => onUpdate({ ...assets.background, name: event.target.value })}
        />
      </Label>

      <Label className="field-stack">
        배경 프롬프트
        <Textarea
          value={assets.background.prompt}
          rows={5}
          onChange={(event) => onUpdate({ ...assets.background, prompt: event.target.value })}
        />
      </Label>

      <Label className="field-stack">
        배경 색상
        <Input
          type="color"
          value={assets.background.color}
          onChange={(event) => onUpdate({ ...assets.background, color: event.target.value })}
        />
      </Label>

      <div className="asset-preview" style={{ background: assets.background.color }}>
        <strong>{assets.background.name}</strong>
      </div>

      <SaveRow onSave={onSave} saved={saveState === "assets"} />
    </>
  );
}

function FontsPanel({
  assets,
  onSave,
  onUpdate,
  saveState,
}: {
  assets: StudioAssets;
  onSave: () => void;
  onUpdate: (fonts: StudioAssets["fonts"]) => void;
  saveState: "idle" | "assets" | "settings";
}) {
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>폰트 설정</h2>
          <p>HTML 미리보기와 내보내기에서 사용할 자막/대사 폰트를 관리합니다.</p>
        </div>
      </div>

      <div className="form-grid compact">
        <Label className="field-stack">
          자막 폰트
          <FontSelect
            value={assets.fonts.subtitle}
            onChange={(value) => onUpdate({ ...assets.fonts, subtitle: value })}
          />
        </Label>
        <Label className="field-stack">
          대사 폰트
          <FontSelect
            value={assets.fonts.dialogue}
            onChange={(value) => onUpdate({ ...assets.fonts, dialogue: value })}
          />
        </Label>
      </div>

      <div className="asset-preview">
        <strong style={{ fontFamily: assets.fonts.subtitle }}>자막 폰트 미리보기</strong>
        <span style={{ fontFamily: assets.fonts.dialogue }}>
          대사 폰트가 적용된 문장입니다. 컷 안의 텍스트는 이미지에 굽지 않고 HTML/CSS로 렌더링합니다.
        </span>
      </div>

      <SaveRow onSave={onSave} saved={saveState === "assets"} />
    </>
  );
}

function ApiKeyPanel({
  onSave,
  onUpdate,
  saveState,
  settings,
}: {
  onSave: () => void;
  onUpdate: (patch: Partial<StudioSettings>) => void;
  saveState: "idle" | "assets" | "settings";
  settings: StudioSettings;
}) {
  const apiKeyReady = settings.geminiApiKey.trim().length > 0;

  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>API 등록</h2>
          <p>이미지 생성에 사용할 Gemini API Key와 호출 모델을 브라우저 로컬 저장소에 저장합니다.</p>
        </div>
        <span className={apiKeyReady ? "status-pill ready" : "status-pill warning"}>
          {apiKeyReady ? "Ready" : "API Key 필요"}
        </span>
      </div>

      <Label className="field-stack">
        Gemini API Key
        <Input
          type="password"
          value={settings.geminiApiKey}
          placeholder="브라우저 로컬 저장소에만 저장됩니다."
          onChange={(event) => onUpdate({ geminiApiKey: event.target.value })}
        />
      </Label>

      <div className="field-stack">
        <span>Gemini 이미지 모델</span>
        <div className="model-option-list" aria-label="Gemini 이미지 모델" role="radiogroup">
          {geminiImageModels.map((model) => (
            <button
              aria-checked={settings.geminiModel === model.id}
              className="model-option-item"
              data-active={settings.geminiModel === model.id}
              key={model.id}
              onClick={() => onUpdate({ geminiModel: model.id })}
              role="radio"
              type="button"
            >
              <strong>{model.label}</strong>
              <span>{model.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="notice-panel">
        Provider 선택은 제거되었고 Gemini API Key 등록을 기본 설정으로 사용합니다. Google 로그인만으로
        유료 API 사용을 우회하는 기능은 제공하지 않습니다.
      </div>

      <SaveRow onSave={onSave} saved={saveState === "settings"} />
    </>
  );
}

function ExportPanel({
  assets,
  onSave,
  onUpdate,
  saveState,
  settings,
}: {
  assets: StudioAssets;
  onSave: () => void;
  onUpdate: (patch: Partial<StudioSettings>) => void;
  saveState: "idle" | "assets" | "settings";
  settings: StudioSettings;
}) {
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>내보내기 옵션</h2>
          <p>PNG/ZIP 다운로드와 provider payload preview 옵션을 저장합니다.</p>
        </div>
      </div>

      <Label className="field-stack">
        PNG 기준 해상도
        <Select
          value={settings.exportScale}
          onValueChange={(value) => onUpdate({ exportScale: value as StudioSettings["exportScale"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1080">1080 기준</SelectItem>
            <SelectItem value="2160">2160 기준</SelectItem>
          </SelectContent>
        </Select>
      </Label>

      <Label className="check-row">
        <input
          type="checkbox"
          checked={settings.saveOriginalHtml}
          onChange={(event) => onUpdate({ saveOriginalHtml: event.target.checked })}
        />
        HTML 원본을 프로젝트 데이터에 함께 유지
      </Label>

      <Label className="field-stack">
        Provider payload preview
        <Textarea readOnly rows={10} value={buildPreview(assets, settings)} />
      </Label>

      <SaveRow onSave={onSave} saved={saveState === "settings"} />
    </>
  );
}

function SaveRow({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="toolbar-row">
      <Button type="button" onClick={onSave}>
        저장
      </Button>
      <p className="save-state save-state-saved">{saved ? "저장 완료" : ""}</p>
    </div>
  );
}

function FontSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Pretendard">Pretendard</SelectItem>
        <SelectItem value="Arial">Arial</SelectItem>
        <SelectItem value="Noto Sans KR">Noto Sans KR</SelectItem>
        <SelectItem value="system-ui">System UI</SelectItem>
      </SelectContent>
    </Select>
  );
}

function buildPreview(assets: StudioAssets, settings: StudioSettings) {
  const selectedCharacter =
    assets.characters.find((character) => character.id === assets.selectedCharacterId) ?? assets.characters[0];

  return JSON.stringify(
    {
      provider: "gemini",
      model: settings.geminiModel,
      apiKeyRegistered: settings.geminiApiKey.trim().length > 0,
      promptParts: [
        "cut.imagePrompt",
        "selectedCharacter.markdown",
        "selectedCharacter.expressions",
        "assets.background.prompt",
      ],
      selectedCharacter: {
        name: selectedCharacter.name,
        expressionCount: selectedCharacter.expressions.length,
      },
      output: {
        exportScale: settings.exportScale,
        saveOriginalHtml: settings.saveOriginalHtml,
        textInImage: false,
        finalDownload: "HTML rendered PNG",
        bundle: "ZIP per cut",
      },
    },
    null,
    2,
  );
}

function loadAssets(): StudioAssets {
  if (typeof window === "undefined") {
    return createDefaultAssets();
  }

  try {
    const saved = window.localStorage.getItem(assetsStorageKey);
    return saved ? migrateAssets(JSON.parse(saved)) : createDefaultAssets();
  } catch {
    return createDefaultAssets();
  }
}

function loadInitialSection(): AssetSection {
  if (typeof window === "undefined") {
    return "characters";
  }

  const section = new URLSearchParams(window.location.search).get("section");
  return isAssetSection(section) ? section : "characters";
}

function useHydrated() {
  return useSyncExternalStore(subscribeToHydration, getClientHydrationSnapshot, getServerHydrationSnapshot);
}

function subscribeToHydration() {
  return () => undefined;
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function loadSettings(): StudioSettings {
  if (typeof window === "undefined") {
    return createDefaultSettings();
  }

  try {
    const saved = window.localStorage.getItem(settingsStorageKey);
    return saved ? migrateSettings(JSON.parse(saved)) : createDefaultSettings();
  } catch {
    return createDefaultSettings();
  }
}

function migrateAssets(value: unknown): StudioAssets {
  if (!isRecord(value)) {
    return createDefaultAssets();
  }

  if (Array.isArray(value.characters)) {
    return ensureAssets({
      version: 2,
      characters: value.characters.map(normalizeCharacter).filter(Boolean) as CharacterAsset[],
      selectedCharacterId:
        typeof value.selectedCharacterId === "string" ? value.selectedCharacterId : "character-default",
      background: {
        name: getString(getRecord(value.background)?.name, "studio-room"),
        prompt: getString(
          getRecord(value.background)?.prompt,
          "clean local studio room, soft daylight, editorial webtoon background, no text",
        ),
        color: getString(getRecord(value.background)?.color, "#f7f7f7"),
      },
      fonts: {
        subtitle: getString(getRecord(value.fonts)?.subtitle, "Pretendard"),
        dialogue: getString(getRecord(value.fonts)?.dialogue, "Pretendard"),
      },
    });
  }

  const legacyCharacter = createCharacter(
    getString(value.characterName, "clo"),
    getString(value.characterMarkdown, defaultMarkdown),
    normalizeExpressions(value.expressions),
  );

  return ensureAssets({
    version: 2,
    characters: [legacyCharacter],
    selectedCharacterId: legacyCharacter.id,
    background: {
      name: getString(value.backgroundName, "studio-room"),
      prompt: getString(
        value.backgroundPrompt,
        "clean local studio room, soft daylight, editorial webtoon background, no text",
      ),
      color: getString(value.backgroundColor, "#f7f7f7"),
    },
    fonts: {
      subtitle: getString(value.subtitleFont, "Pretendard"),
      dialogue: getString(value.dialogueFont, "Pretendard"),
    },
  });
}

function migrateSettings(value: unknown): StudioSettings {
  if (!isRecord(value)) {
    return createDefaultSettings();
  }

  return {
    provider: "gemini",
    geminiApiKey: getString(value.geminiApiKey, ""),
    geminiModel: normalizeGeminiImageModel(value.geminiModel),
    exportScale: value.exportScale === "2160" ? "2160" : "1080",
    saveOriginalHtml: typeof value.saveOriginalHtml === "boolean" ? value.saveOriginalHtml : true,
  };
}

function ensureAssets(assets: StudioAssets): StudioAssets {
  const characters = assets.characters.length > 0 ? assets.characters : [createCharacter("clo")];
  const selectedCharacterId = characters.some((character) => character.id === assets.selectedCharacterId)
    ? assets.selectedCharacterId
    : characters[0].id;

  return {
    ...assets,
    characters,
    selectedCharacterId,
  };
}

function createDefaultAssets(): StudioAssets {
  const character = createCharacter("clo", defaultMarkdown);

  return {
    version: 2,
    characters: [character],
    selectedCharacterId: character.id,
    background: {
      name: "studio-room",
      prompt: "clean local studio room, soft daylight, editorial webtoon background, no text",
      color: "#f7f7f7",
    },
    fonts: {
      subtitle: "Pretendard",
      dialogue: "Pretendard",
    },
  };
}

function createDefaultSettings(): StudioSettings {
  return {
    provider: "gemini",
    geminiApiKey: "",
    geminiModel: defaultGeminiImageModel,
    exportScale: "1080",
    saveOriginalHtml: true,
  };
}

function createCharacter(name: string, markdown = defaultMarkdown, expressions: ExpressionImage[] = []) {
  return {
    id: createId("character"),
    name,
    markdown,
    expressions,
  };
}

function normalizeCharacter(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: getString(value.id, createId("character")),
    name: getString(value.name, "새 캐릭터"),
    markdown: getString(value.markdown, defaultMarkdown),
    expressions: normalizeExpressions(value.expressions),
  };
}

function normalizeExpressions(value: unknown): ExpressionImage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const dataUrl = getString(item.dataUrl, "");

      if (!isAllowedReferenceImageDataUrl(dataUrl)) {
        return null;
      }

      return {
        id: getString(item.id, createId("expression")),
        name: getString(item.name, "캐릭터 표정"),
        dataUrl,
      };
    })
    .filter((item): item is ExpressionImage => item !== null);
}

function isAssetSection(value: string | null): value is AssetSection {
  return value === "characters" || value === "background" || value === "fonts" || value === "api-key" || value === "export";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
