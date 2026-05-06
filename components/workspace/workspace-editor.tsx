"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Copy01Icon,
  Delete02Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
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
import type { Cut, CutImageStatus, CutTemplate } from "@/lib/cuts/types";
import type { Project } from "@/lib/projects/types";

type WorkspaceEditorProps = {
  project: Project;
  initialCuts: Cut[];
};

const templateLabels: Record<CutTemplate, string> = {
  comic: "인스타툰",
  "card-news": "카드뉴스",
};

const statusLabels: Record<CutImageStatus, string> = {
  empty: "이미지 없음",
  mock: "Mock 이미지",
  uploaded: "업로드 이미지",
  generated: "생성 이미지",
  failed: "생성 실패",
};

export function WorkspaceEditor({ project, initialCuts }: WorkspaceEditorProps) {
  const [cuts, setCuts] = useState(initialCuts);
  const [selectedCutId, setSelectedCutId] = useState(initialCuts[0]?.id ?? "");
  const [targetCount, setTargetCount] = useState(String(Math.max(initialCuts.length, 4)));
  const [scenario, setScenario] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [exportState, setExportState] = useState<"idle" | "exporting" | "done" | "error">("idle");
  const exportRootRef = useRef<HTMLDivElement | null>(null);

  const selectedCut = useMemo(
    () => cuts.find((cut) => cut.id === selectedCutId) ?? cuts[0],
    [cuts, selectedCutId],
  );

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

  async function duplicateCut(cut: Cut) {
    const response = await fetch(`/api/projects/${project.id}/cuts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duplicateFromCutId: cut.id }),
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

  async function moveCut(cut: Cut, direction: -1 | 1) {
    const sorted = [...cuts].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((item) => item.id === cut.id);
    const target = sorted[index + direction];

    if (!target) {
      return;
    }

    const nextOrder = [...sorted];
    nextOrder[index] = target;
    nextOrder[index + direction] = cut;

    const response = await fetch(`/api/projects/${project.id}/cuts/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cutIds: nextOrder.map((item) => item.id) }),
    });

    if (!response.ok) {
      return;
    }

    const { cuts: reorderedCuts } = (await response.json()) as { cuts: Cut[] };
    setCuts(reorderedCuts);
  }

  async function updateSelectedCut(field: keyof Cut, value: string) {
    if (!selectedCut) {
      return;
    }

    setCuts((current) =>
      current.map((cut) => (cut.id === selectedCut.id ? { ...cut, [field]: value } : cut)),
    );
  }

  async function saveSelectedCut() {
    if (!selectedCut) {
      return;
    }

    await persistCutPatch(selectedCut, {
      template: selectedCut.template,
      position: selectedCut.position,
      scenario: selectedCut.scenario,
      caption: selectedCut.caption,
      dialogue: selectedCut.dialogue,
      imagePrompt: selectedCut.imagePrompt,
      negativePrompt: selectedCut.negativePrompt,
      imageDataUrl: selectedCut.imageDataUrl,
      imageStatus: selectedCut.imageStatus,
    });
  }

  async function buildManualCuts() {
    const count = Number.parseInt(targetCount, 10);
    if (Number.isNaN(count) || count < 1) {
      return;
    }

    const segments = splitScenario(scenario, count);
    const missing = Math.max(0, count - cuts.length);

    for (let index = 0; index < missing; index += 1) {
      const position = cuts.length + index + 1;
      await createCut(position, segments[index] ?? "");
    }

    if (cuts.length >= count) {
      const updates = cuts
        .slice(0, count)
        .map((cut, index) =>
          persistCutPatch(cut, {
            scenario: segments[index] ?? cut.scenario,
            caption: cut.caption || `컷 ${index + 1}`,
            dialogue: cut.dialogue || segments[index] || "",
            imagePrompt:
              cut.imagePrompt ||
              `consistent character illustration, ${segments[index] ?? scenario}, clean editorial composition, no text`,
          }),
        );
      await Promise.all(updates);
    }
  }

  async function applyMockImage() {
    if (!selectedCut) {
      return;
    }

    await persistCutPatch(selectedCut, {
      imageDataUrl: createMockImageDataUrl(selectedCut, project),
      imageStatus: "mock",
    });
  }

  async function handleUpload(file: File | null) {
    if (!file || !selectedCut) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    await persistCutPatch(selectedCut, {
      imageDataUrl: dataUrl,
      imageStatus: "uploaded",
    });
  }

  async function downloadCurrentCut() {
    if (!selectedCut || !exportRootRef.current) {
      return;
    }

    setExportState("exporting");
    try {
      const node = exportRootRef.current.querySelector<HTMLElement>(
        `[data-export-cut-id="${selectedCut.id}"]`,
      );
      if (!node) {
        throw new Error("내보낼 컷을 찾지 못했습니다.");
      }
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 1, backgroundColor: "#ffffff" });
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
          pixelRatio: 1,
          backgroundColor: "#ffffff",
        });
        zip.file(`cut-${String(cut.position).padStart(2, "0")}.png`, dataUrlToBlob(dataUrl));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${safeFileName(project.name)}-cuts.zip`);
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  const sortedCuts = [...cuts].sort((a, b) => a.position - b.position);

  return (
    <>
      <section className="editor-grid" aria-label="제작 워크스페이스">
        <div className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Storyboard</p>
              <h1>{project.name}</h1>
              <p>전체 시나리오를 입력하거나 컷별로 내용을 다듬어 제작합니다.</p>
            </div>
          </div>

          <div className="form-grid compact">
            <Label className="field-stack">
              컷 수
              <Input value={targetCount} onChange={(event) => setTargetCount(event.target.value)} />
            </Label>
            <Label className="field-stack">
              기본 템플릿
              <Input value={project.contentType === "card-news" ? "카드뉴스" : "인스타툰"} readOnly />
            </Label>
          </div>

          <Label className="field-stack">
            전체 시나리오
            <Textarea
              value={scenario}
              onChange={(event) => setScenario(event.target.value)}
              placeholder="전체 줄거리를 입력하면 컷별 초안 생성에 활용됩니다."
              rows={6}
            />
          </Label>

          <div className="toolbar-row">
            <Button type="button" onClick={buildManualCuts}>
              <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden />
              컷 초안 생성
            </Button>
            <Button type="button" variant="secondary" onClick={() => createCut()}>
              <HugeiconsIcon icon={Add01Icon} size={18} aria-hidden />
              빈 컷 추가
            </Button>
          </div>

          <div className="cut-list" aria-label="컷 목록">
            {sortedCuts.map((cut) => (
              <button
                key={cut.id}
                type="button"
                className={cut.id === selectedCut?.id ? "cut-list-item active" : "cut-list-item"}
                onClick={() => setSelectedCutId(cut.id)}
              >
                <span>#{cut.position}</span>
                <strong>{cut.caption || cut.dialogue || "내용 없음"}</strong>
                <small>{statusLabels[cut.imageStatus]}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="editor-panel">
          {selectedCut ? (
            <>
              <div className="panel-heading inline-heading">
                <div>
                  <p className="eyebrow">Cut {selectedCut.position}</p>
                  <h2>자막, 대사, 프롬프트</h2>
                </div>
                <Badge className={`badge-${selectedCut.template === "card-news" ? "card-news" : "comic"}`}>
                  {templateLabels[selectedCut.template]}
                </Badge>
              </div>

              <div className="form-grid compact">
                <Label className="field-stack">
                  템플릿
                  <Select
                    value={selectedCut.template}
                    onValueChange={(value) => updateSelectedCut("template", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comic">인스타툰</SelectItem>
                      <SelectItem value="card-news">카드뉴스</SelectItem>
                    </SelectContent>
                  </Select>
                </Label>
                <Label className="field-stack">
                  이미지 상태
                  <Input value={statusLabels[selectedCut.imageStatus]} readOnly />
                </Label>
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
              <Label className="field-stack">
                네거티브 프롬프트
                <Textarea
                  value={selectedCut.negativePrompt}
                  onChange={(event) => updateSelectedCut("negativePrompt", event.target.value)}
                  rows={3}
                />
              </Label>

              <div className="toolbar-row">
                <Button type="button" onClick={saveSelectedCut}>
                  <HugeiconsIcon icon={SaveIcon} size={18} aria-hidden />
                  저장
                </Button>
                <Button type="button" variant="secondary" onClick={applyMockImage}>
                  Mock 이미지
                </Button>
                <Label className="upload-button">
                  이미지 업로드
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
                  />
                </Label>
              </div>

              <div className="toolbar-row muted-actions">
                <Button type="button" variant="secondary" onClick={() => moveCut(selectedCut, -1)}>
                  <HugeiconsIcon icon={ArrowUp01Icon} size={18} aria-hidden />
                  위로
                </Button>
                <Button type="button" variant="secondary" onClick={() => moveCut(selectedCut, 1)}>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={18} aria-hidden />
                  아래로
                </Button>
                <Button type="button" variant="secondary" onClick={() => duplicateCut(selectedCut)}>
                  <HugeiconsIcon icon={Copy01Icon} size={18} aria-hidden />
                  복제
                </Button>
                <Button type="button" variant="destructive" onClick={() => deleteCut(selectedCut)}>
                  <HugeiconsIcon icon={Delete02Icon} size={18} aria-hidden />
                  삭제
                </Button>
              </div>

              <p className={`save-state save-state-${saveState}`}>
                {saveState === "saving" && "저장 중..."}
                {saveState === "saved" && "저장 완료"}
                {saveState === "error" && "저장 실패"}
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
            <Badge className="badge-canvas">{project.canvasPreset}</Badge>
          </div>

          {selectedCut ? <CutPreview cut={selectedCut} project={project} /> : null}

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
      </section>

      <div className="export-stack" ref={exportRootRef} aria-hidden>
        {sortedCuts.map((cut) => (
          <CutPreview key={cut.id} cut={cut} project={project} exportId={cut.id} />
        ))}
      </div>
    </>
  );
}

function CutPreview({ cut, project, exportId }: { cut: Cut; project: Project; exportId?: string }) {
  const ratioClass =
    project.canvasPreset === "9:16"
      ? "canvas-9-16"
      : project.canvasPreset === "4:5"
        ? "canvas-4-5"
        : "canvas-1-1";
  const templateClass = cut.template === "card-news" ? "card-news" : "comic";

  return (
    <article
      className={`cut-canvas ${ratioClass} ${templateClass}`}
      data-export-cut-id={exportId}
      style={
        {
          "--cut-image": cut.imageDataUrl ? `url(${cut.imageDataUrl})` : "none",
        } as CSSProperties
      }
    >
      <div className={cut.imageDataUrl ? "cut-art-layer has-image" : "cut-art-layer"}>
        {!cut.imageDataUrl ? (
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

function createMockImageDataUrl(cut: Cut, project: Project) {
  const seed = `${project.id}-${cut.id}-${cut.position}`;
  const hue = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
  const caption = escapeXml(cut.caption || `Cut ${cut.position}`);
  const prompt = escapeXml((cut.imagePrompt || cut.scenario || project.name).slice(0, 92));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue}, 74%, 72%)"/>
          <stop offset="52%" stop-color="hsl(${(hue + 64) % 360}, 74%, 86%)"/>
          <stop offset="100%" stop-color="hsl(${(hue + 148) % 360}, 74%, 78%)"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1080" fill="url(#bg)"/>
      <circle cx="250" cy="260" r="150" fill="rgba(255,255,255,0.32)"/>
      <circle cx="830" cy="310" r="210" fill="rgba(20,25,35,0.12)"/>
      <rect x="162" y="690" width="756" height="142" rx="34" fill="rgba(255,255,255,0.76)"/>
      <text x="540" y="758" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#111827">${caption}</text>
      <text x="540" y="812" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#374151">${prompt}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "local-studio";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
