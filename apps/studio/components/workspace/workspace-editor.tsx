"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toCssImageUrl } from "@/lib/cuts/image-data-url";
import type { Cut, CutImageStatus } from "@/lib/cuts/types";
import {
  loadGeminiApiKeyFromStorage,
  loadImageGenerationAssetsFromStorage,
} from "@/lib/image-generation/storage";
import type { ImageGenerationAssets } from "@/lib/image-generation/types";
import type { Project } from "@/lib/projects/types";
import {
  defaultStudioPreferences,
  getExportPixelRatio,
  loadStudioPreferencesFromStorage,
  type StudioFonts,
} from "@/lib/studio-preferences";

type WorkspaceEditorProps = {
  project: Project;
  initialCuts: Cut[];
};

type GenerationState = {
  status: "idle" | "generating" | "done" | "error";
  message: string;
};

type ImageGenerationSuccess = {
  imageDataUrl: string;
  mimeType: string;
  model: string;
};

type ImageGenerationFailure = {
  error: string;
  status?: string;
  message?: string;
};

const statusLabels: Record<CutImageStatus, string> = {
  empty: "이미지 없음",
  mock: "Mock 이미지",
  uploaded: "업로드 이미지",
  generated: "생성 이미지",
  failed: "생성 실패",
};

const MINIMUM_CUT_COUNT = 2;

export function WorkspaceEditor({ project, initialCuts }: WorkspaceEditorProps) {
  const [cuts, setCuts] = useState(initialCuts);
  const [selectedCutId, setSelectedCutId] = useState(initialCuts[0]?.id ?? "");
  const [scenario, setScenario] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
    message: "",
  });
  const [studioPreferences, setStudioPreferences] = useState(defaultStudioPreferences);
  const [exportState, setExportState] = useState<"idle" | "exporting" | "done" | "error">("idle");
  const exportRootRef = useRef<HTMLDivElement | null>(null);

  const selectedCut = useMemo(
    () => cuts.find((cut) => cut.id === selectedCutId) ?? cuts[0],
    [cuts, selectedCutId],
  );

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) {
        setStudioPreferences(loadStudioPreferencesFromStorage(window.localStorage));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function persistCutPatch(cut: Cut, patch: Partial<Cut>) {
    setSaveState("saving");
    const response = await fetch(`/api/projects/${project.id}/cuts/${cut.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSaveState("error");
      throw new Error("컷 저장에 실패했습니다.");
    }

    const { cut: updated } = (await response.json()) as { cut: Cut };
    setCuts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSaveState("saved");
    return updated;
  }

  async function createCut(position?: number, seedText = "") {
    const nextPosition = position ?? cuts.length + 1;
    const response = await fetch(`/api/projects/${project.id}/cuts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: project.contentType,
        position: nextPosition,
        scenario: seedText,
        caption: seedText ? `컷 ${nextPosition}` : "",
        dialogue: seedText,
        imagePrompt: seedText
          ? `consistent character illustration, ${seedText}, clean editorial composition, no text`
          : "",
      }),
    });

    if (!response.ok) {
      return;
    }

    const { cut: newCut } = (await response.json()) as { cut: Cut };
    setCuts((current) => [...current, newCut].sort((a, b) => a.position - b.position));
    setSelectedCutId(newCut.id);
  }

  async function deleteCut(cut: Cut) {
    if (cuts.length <= 1) {
      return;
    }

    const response = await fetch(`/api/projects/${project.id}/cuts/${cut.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return;
    }

    setCuts((current) => {
      const remaining = current.filter((item) => item.id !== cut.id);
      if (selectedCutId === cut.id) {
        setSelectedCutId(remaining[0]?.id ?? "");
      }
      return remaining;
    });
  }

  async function updateSelectedCut(field: keyof Cut, value: string) {
    if (!selectedCut) {
      return;
    }

    setGenerationState({ status: "idle", message: "" });
    setCuts((current) =>
      current.map((cut) => (cut.id === selectedCut.id ? { ...cut, [field]: value } : cut)),
    );
  }

  async function buildManualCuts() {
    const count = Math.max(cuts.length, MINIMUM_CUT_COUNT);
    if (count < MINIMUM_CUT_COUNT) {
      return;
    }

    const segments = splitScenario(scenario, count);
    const sorted = [...cuts].sort((a, b) => a.position - b.position);
    const existingCuts = sorted.slice(0, count);

    await Promise.all(
      existingCuts.map((cut, index) =>
        persistCutPatch(cut, {
          scenario: segments[index] ?? cut.scenario,
          caption: cut.caption || `컷 ${index + 1}`,
          dialogue: cut.dialogue || segments[index] || "",
          imagePrompt:
            cut.imagePrompt ||
            `consistent character illustration, ${segments[index] ?? scenario}, clean editorial composition, no text`,
        }),
      ),
    );

    for (let index = existingCuts.length; index < count; index += 1) {
      await createCut(index + 1, segments[index] ?? "");
    }
  }

  async function generateSelectedCutImage() {
    if (!selectedCut) {
      return;
    }

    const apiKey = loadGeminiApiKeyFromStorage(window.localStorage);

    if (!apiKey) {
      setGenerationState({
        status: "error",
        message: "Assets > API Key에서 Gemini API Key를 먼저 저장해주세요.",
      });
      return;
    }

    let savedCut: Cut | null = null;
    setGenerationState({ status: "generating", message: "컷 저장 후 이미지 생성 중..." });

    try {
      const assets = limitExpressionReferences(loadImageGenerationAssetsFromStorage(window.localStorage));
      savedCut = await persistCutPatch(selectedCut, {
        ...getEditableCutPatch(selectedCut),
        imageDataUrl: selectedCut.imageDataUrl,
        imageStatus: selectedCut.imageStatus,
      });

      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          project: {
            id: project.id,
            name: project.name,
            contentType: project.contentType,
            canvasPreset: project.canvasPreset,
          },
          cut: {
            id: savedCut.id,
            position: savedCut.position,
            template: savedCut.template,
            scenario: savedCut.scenario,
            caption: savedCut.caption,
            dialogue: savedCut.dialogue,
            imagePrompt: savedCut.imagePrompt,
            negativePrompt: savedCut.negativePrompt,
          },
          assets,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ImageGenerationSuccess
        | ImageGenerationFailure
        | null;

      if (!response.ok || !payload || !("imageDataUrl" in payload)) {
        throw new Error(
          getImageGenerationErrorMessage(response.status, payload && "error" in payload ? payload : null),
        );
      }

      await persistCutPatch(savedCut, {
        imageDataUrl: payload.imageDataUrl,
        imageStatus: "generated",
      });
      setGenerationState({ status: "done", message: "이미지 생성 완료" });
    } catch (error) {
      if (savedCut) {
        await persistCutPatch(savedCut, { imageStatus: "failed" }).catch(() => undefined);
      }

      setGenerationState({
        status: "error",
        message: error instanceof Error ? error.message : "이미지 생성에 실패했습니다.",
      });
    }
  }

  async function downloadCurrentCut() {
    if (!selectedCut || !exportRootRef.current) {
      return;
    }

    setExportState("exporting");
    try {
      const preferences = loadStudioPreferencesFromStorage(window.localStorage);
      setStudioPreferences(preferences);
      applyExportFontVariables(exportRootRef.current, preferences.fonts);
      const node = exportRootRef.current.querySelector<HTMLElement>(
        `[data-export-cut-id="${selectedCut.id}"]`,
      );
      if (!node) {
        throw new Error("내보낼 컷을 찾지 못했습니다.");
      }
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: getExportPixelRatio(preferences.export),
        backgroundColor: "#ffffff",
      });
      downloadDataUrl(dataUrl, `${safeFileName(project.name)}-cut-${selectedCut.position}.png`);
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  async function downloadAllCutsZip() {
    if (!exportRootRef.current) {
      return;
    }

    setExportState("exporting");
    try {
      const preferences = loadStudioPreferencesFromStorage(window.localStorage);
      setStudioPreferences(preferences);
      applyExportFontVariables(exportRootRef.current, preferences.fonts);
      const zip = new JSZip();
      const sortedCuts = [...cuts].sort((a, b) => a.position - b.position);

      for (const cut of sortedCuts) {
        const node = exportRootRef.current.querySelector<HTMLElement>(
          `[data-export-cut-id="${cut.id}"]`,
        );
        if (!node) {
          continue;
        }

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: getExportPixelRatio(preferences.export),
          backgroundColor: "#ffffff",
        });
        zip.file(`cut-${String(cut.position).padStart(2, "0")}.png`, dataUrlToBlob(dataUrl));

        if (preferences.export.saveOriginalHtml) {
          zip.file(
            `cut-${String(cut.position).padStart(2, "0")}.html`,
            createCutHtmlDocument(node, project, cut),
          );
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${safeFileName(project.name)}-cuts.zip`);
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  const sortedCuts = [...cuts].sort((a, b) => a.position - b.position);
  const cutCount = sortedCuts.length;

  function increaseCutCount() {
    void createCut();
  }

  function decreaseCutCount() {
    const lastCut = sortedCuts[sortedCuts.length - 1];
    if (lastCut) {
      void deleteCut(lastCut);
    }
  }

  return (
    <>
      <section className="split-layout workspace-layout" aria-label="제작 워크스페이스">
        <aside className="split-menu workspace-menu" aria-label="Cuts menu">
          <div className="storyboard-info">
            <p className="eyebrow">Storyboard</p>
            <dl>
              <div>
                <dt>유형</dt>
                <dd>{project.contentType === "card-news" ? "카드뉴스" : "인스타툰"}</dd>
              </div>
              <div>
                <dt>캔버스</dt>
                <dd>{project.canvasPreset}</dd>
              </div>
            </dl>
          </div>

          <div className="cut-count-stepper" aria-label="컷 수">
            <span>컷 수:</span>
            <div>
              <button
                type="button"
                aria-label="컷 수 줄이기"
                onClick={decreaseCutCount}
                disabled={cutCount <= 1}
              >
                -
              </button>
              <strong>{cutCount}</strong>
              <button
                type="button"
                aria-label="컷 수 늘리기"
                onClick={increaseCutCount}
              >
                +
              </button>
            </div>
          </div>

          {project.contentType === "card-news" ? (
            <Label className="field-stack">
              전체 시나리오
              <Textarea
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
                placeholder="전체 줄거리를 입력하면 컷별 초안 생성에 활용됩니다."
                rows={6}
              />
            </Label>
          ) : null}

          {project.contentType === "card-news" ? (
            <div className="toolbar-row">
              <Button type="button" onClick={buildManualCuts}>
                <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden />
                컷 초안 생성
              </Button>
            </div>
          ) : null}

          <div className="split-menu-list cut-list" aria-label="컷 목록">
            {sortedCuts.map((cut) => (
              <button
                key={cut.id}
                type="button"
                className="split-menu-item workspace-cut-item"
                data-active={cut.id === selectedCut?.id}
                onClick={() => setSelectedCutId(cut.id)}
              >
                <span>#{cut.position}</span>
                <strong>{cut.caption || cut.dialogue || "내용 없음"}</strong>
                <small>{statusLabels[cut.imageStatus]}</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="split-content workspace-detail">
          <div className="workspace-detail-grid">
            <div className="editor-panel">
              {selectedCut ? (
                <>
                  <div className="panel-heading inline-heading">
                    <div>
                      <p className="eyebrow">Cut {selectedCut.position}</p>
                      <h2>자막, 대사, 프롬프트</h2>
                    </div>
                  </div>

                  <Label className="field-stack">
                    컷 시나리오
                    <Textarea
                      value={selectedCut.scenario}
                      onChange={(event) => updateSelectedCut("scenario", event.target.value)}
                      rows={4}
                    />
                  </Label>
                  <Label className="field-stack">
                    자막
                    <Input
                      value={selectedCut.caption}
                      onChange={(event) => updateSelectedCut("caption", event.target.value)}
                    />
                  </Label>
                  <Label className="field-stack">
                    대사
                    <Textarea
                      value={selectedCut.dialogue}
                      onChange={(event) => updateSelectedCut("dialogue", event.target.value)}
                      rows={3}
                    />
                  </Label>
                  <Label className="field-stack">
                    이미지 프롬프트
                    <Textarea
                      value={selectedCut.imagePrompt}
                      onChange={(event) => updateSelectedCut("imagePrompt", event.target.value)}
                      rows={4}
                    />
                  </Label>

                  <div className="toolbar-row">
                    <Button
                      type="button"
                      onClick={generateSelectedCutImage}
                      disabled={generationState.status === "generating"}
                    >
                      {generationState.status === "generating" ? "이미지 생성 중..." : "이미지 생성"}
                    </Button>
                    <Button type="button" variant="destructive" onClick={() => deleteCut(selectedCut)}>
                      삭제
                    </Button>
                  </div>

                  <p className={`save-state save-state-${getStatusMessageClass(saveState, generationState.status)}`}>
                    {generationState.message ||
                      (saveState === "saving" && "저장 중...") ||
                      (saveState === "saved" && "저장 완료") ||
                      (saveState === "error" && "저장 실패") ||
                      ""}
                  </p>
                </>
              ) : (
                <p>선택할 컷이 없습니다.</p>
              )}
            </div>

            <aside className="preview-column">
              <div className="preview-toolbar">
                <div>
                  <p className="eyebrow">HTML Preview</p>
                  <h2>이미지 원본</h2>
                </div>
              </div>

              {selectedCut ? (
                <CutPreview cut={selectedCut} project={project} fonts={studioPreferences.fonts} />
              ) : null}

              <div className="toolbar-row export-actions">
                <Button type="button" onClick={downloadCurrentCut}>
                  현재 컷 PNG
                </Button>
                <Button type="button" variant="secondary" onClick={downloadAllCutsZip}>
                  전체 ZIP
                </Button>
              </div>
              <p className={`save-state save-state-${exportState}`}>
                {exportState === "exporting" && "내보내는 중..."}
                {exportState === "done" && "다운로드 생성 완료"}
                {exportState === "error" && "다운로드 실패"}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <div className="export-stack" ref={exportRootRef} aria-hidden>
        {sortedCuts.map((cut) => (
          <CutPreview
            key={cut.id}
            cut={cut}
            project={project}
            exportId={cut.id}
            fonts={studioPreferences.fonts}
          />
        ))}
      </div>
    </>
  );
}

function CutPreview({
  cut,
  project,
  exportId,
  fonts,
}: {
  cut: Cut;
  project: Project;
  exportId?: string;
  fonts: StudioFonts;
}) {
  const ratioClass =
    project.canvasPreset === "9:16"
      ? "canvas-9-16"
      : project.canvasPreset === "4:5"
        ? "canvas-4-5"
        : "canvas-1-1";
  const templateClass = cut.template === "card-news" ? "card-news" : "comic";
  const cssImageUrl = toCssImageUrl(cut.imageDataUrl);
  const hasImage = cssImageUrl !== "none";

  return (
    <article
      className={`cut-canvas ${ratioClass} ${templateClass}`}
      data-export-cut-id={exportId}
      style={
        {
          "--cut-image": cssImageUrl,
          "--cut-caption-font": fonts.subtitle,
          "--cut-dialogue-font": fonts.dialogue,
        } as CSSProperties
      }
    >
      <div className={hasImage ? "cut-art-layer has-image" : "cut-art-layer"}>
        {!hasImage ? (
          <div className="art-placeholder">
            <span>{cut.imagePrompt || "이미지 프롬프트를 입력하세요."}</span>
          </div>
        ) : null}
      </div>
      {cut.template === "card-news" ? (
        <div className="card-copy">
          {cut.caption ? <strong>{cut.caption}</strong> : null}
          {cut.dialogue ? <p>{cut.dialogue}</p> : null}
        </div>
      ) : (
        <>
          {cut.dialogue ? <p className="speech-bubble">{cut.dialogue}</p> : null}
          {cut.caption ? <p className="comic-caption">{cut.caption}</p> : null}
        </>
      )}
    </article>
  );
}

function getEditableCutPatch(cut: Cut) {
  return {
    template: cut.template,
    scenario: cut.scenario,
    caption: cut.caption,
    dialogue: cut.dialogue,
    imagePrompt: cut.imagePrompt,
    negativePrompt: cut.negativePrompt,
  };
}

function applyExportFontVariables(root: HTMLElement | null, fonts: StudioFonts) {
  root?.querySelectorAll<HTMLElement>(".cut-canvas").forEach((node) => {
    node.style.setProperty("--cut-caption-font", fonts.subtitle);
    node.style.setProperty("--cut-dialogue-font", fonts.dialogue);
  });
}

function splitScenario(text: string, count: number) {
  const trimmed = text.trim();
  if (!trimmed) {
    return Array.from({ length: count }, (_, index) => `컷 ${index + 1} 장면`);
  }

  const sentences = trimmed
    .split(/(?<=[.!?。！？\n])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length >= count) {
    return sentences.slice(0, count);
  }

  return Array.from({ length: count }, (_, index) => sentences[index % sentences.length] ?? trimmed);
}

function limitExpressionReferences(assets: ImageGenerationAssets): ImageGenerationAssets {
  return {
    ...assets,
    characters: assets.characters.map((character) => ({
      ...character,
      expressions:
        character.id === assets.selectedCharacterId ? character.expressions.slice(0, 3) : [],
    })),
  };
}

function getImageGenerationErrorMessage(status: number, payload: ImageGenerationFailure | null) {
  const detail = [payload?.status, payload?.message, payload?.error].filter(Boolean).join(" ");

  if (status === 401 || status === 403) {
    return "Gemini API Key를 확인해주세요.";
  }

  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(detail)) {
    return "Gemini 이미지 생성 할당량이 부족합니다. Google AI Studio의 billing/quota를 확인해주세요.";
  }

  if (status === 400) {
    return payload?.message || "이미지 생성 요청을 만들지 못했습니다.";
  }

  if (status >= 500) {
    return "Gemini 서비스 응답이 불안정합니다. 잠시 후 다시 시도해주세요.";
  }

  return payload?.message || "이미지 생성에 실패했습니다.";
}

function getStatusMessageClass(
  saveState: "idle" | "saving" | "saved" | "error",
  generationStatus: GenerationState["status"],
) {
  if (generationStatus === "generating") {
    return "saving";
  }

  if (generationStatus === "done") {
    return "saved";
  }

  if (generationStatus === "error") {
    return "error";
  }

  return saveState;
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function createCutHtmlDocument(node: HTMLElement, project: Project, cut: Cut) {
  return [
    "<!doctype html>",
    '<html lang="ko">',
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(project.name)} - Cut ${cut.position}</title>`,
    "</head>",
    "<body>",
    node.outerHTML,
    "</body>",
    "</html>",
  ].join("\n");
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "local-studio";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
