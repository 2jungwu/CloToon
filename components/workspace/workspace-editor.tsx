"use client";

import { useMemo, useState } from "react";
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
import type { Cut, CutTemplate } from "@/lib/cuts/types";
import type { Project } from "@/lib/projects/types";

type WorkspaceEditorProps = {
  project: Project;
  initialCuts: Cut[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function WorkspaceEditor({ project, initialCuts }: WorkspaceEditorProps) {
  const [cuts, setCuts] = useState(initialCuts);
  const [selectedCutId, setSelectedCutId] = useState(initialCuts[0]?.id ?? "");
  const [scenario, setScenario] = useState("");
  const [targetCount, setTargetCount] = useState(Math.max(initialCuts.length, 4));
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const selectedCut = useMemo(
    () => cuts.find((cut) => cut.id === selectedCutId) ?? cuts[0] ?? null,
    [cuts, selectedCutId],
  );

  async function addCut(template: CutTemplate = project.contentType) {
    const result = await request<{ cut: Cut }>(`/api/projects/${project.id}/cuts`, {
      method: "POST",
      body: JSON.stringify({ template }),
    });
    setCuts((current) => [...current, result.cut]);
    setSelectedCutId(result.cut.id);
  }

  async function buildManualCuts() {
    const missingCount = Math.max(targetCount - cuts.length, 0);

    if (missingCount === 0) {
      return;
    }

    let nextCuts = cuts;
    for (let index = 0; index < missingCount; index += 1) {
      const position = nextCuts.length + 1;
      const result = await request<{ cut: Cut }>(`/api/projects/${project.id}/cuts`, {
        method: "POST",
        body: JSON.stringify({
          template: project.contentType,
          scenario,
          caption: `컷 ${position}`,
          imagePrompt: scenario ? `Scene ${position}: ${scenario}` : "",
        }),
      });
      nextCuts = [...nextCuts, result.cut];
    }

    setCuts(nextCuts);
    setSelectedCutId(nextCuts[0]?.id ?? "");
  }

  async function duplicateSelectedCut() {
    if (!selectedCut) {
      return;
    }

    const result = await request<{ cut: Cut }>(`/api/projects/${project.id}/cuts`, {
      method: "POST",
      body: JSON.stringify({ duplicateFromCutId: selectedCut.id }),
    });
    setCuts((current) => [...current, result.cut]);
    setSelectedCutId(result.cut.id);
  }

  async function deleteSelectedCut() {
    if (!selectedCut) {
      return;
    }

    await request(`/api/projects/${project.id}/cuts/${selectedCut.id}`, {
      method: "DELETE",
    });
    setCuts((current) => {
      const next = current.filter((cut) => cut.id !== selectedCut.id);
      setSelectedCutId(next[0]?.id ?? "");
      return next.map((cut, index) => ({ ...cut, position: index + 1 }));
    });
  }

  async function moveSelectedCut(direction: -1 | 1) {
    if (!selectedCut) {
      return;
    }

    const currentIndex = cuts.findIndex((cut) => cut.id === selectedCut.id);
    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= cuts.length) {
      return;
    }

    const reordered = [...cuts];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);
    const positioned = reordered.map((cut, index) => ({ ...cut, position: index + 1 }));
    setCuts(positioned);

    const result = await request<{ cuts: Cut[] }>(`/api/projects/${project.id}/cuts/reorder`, {
      method: "POST",
      body: JSON.stringify({ cutIds: positioned.map((cut) => cut.id) }),
    });
    setCuts(result.cuts);
  }

  function updateSelectedCut(patch: Partial<Cut>) {
    if (!selectedCut) {
      return;
    }

    setCuts((current) =>
      current.map((cut) => (cut.id === selectedCut.id ? { ...cut, ...patch } : cut)),
    );
    setSaveState("idle");
  }

  async function saveSelectedCut() {
    if (!selectedCut) {
      return;
    }

    setSaveState("saving");

    try {
      const result = await request<{ cut: Cut }>(`/api/projects/${project.id}/cuts/${selectedCut.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          template: selectedCut.template,
          scenario: selectedCut.scenario,
          caption: selectedCut.caption,
          dialogue: selectedCut.dialogue,
          imagePrompt: selectedCut.imagePrompt,
          negativePrompt: selectedCut.negativePrompt,
        }),
      });
      setCuts((current) => current.map((cut) => (cut.id === result.cut.id ? result.cut : cut)));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="workspace-grid">
      <aside className="workspace-panel">
        <div className="accent-strip" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Scenario</p>
            <h2>시나리오 입력</h2>
          </div>
          <Badge variant="outline">{cuts.length} cuts</Badge>
        </div>
        <div className="field">
          <Label htmlFor="story-scenario">전체 시나리오</Label>
          <Textarea
            id="story-scenario"
            rows={8}
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            placeholder="전체 이야기 흐름을 입력하세요."
          />
        </div>
        <div className="field compact-field">
          <Label htmlFor="target-cut-count">컷 수</Label>
          <Input
            id="target-cut-count"
            min={1}
            max={30}
            type="number"
            value={targetCount}
            onChange={(event) => setTargetCount(Number(event.target.value))}
          />
        </div>
        <div className="button-row">
          <Button type="button" onClick={buildManualCuts}>
            컷 수 맞추기
          </Button>
          <Button type="button" variant="outline" onClick={() => addCut()}>
            <HugeiconsIcon icon={Add01Icon} />
            컷 추가
          </Button>
        </div>

        <div className="cut-list">
          {cuts.length === 0 ? (
            <p className="empty-state">아직 컷이 없습니다. 컷을 추가해 편집을 시작하세요.</p>
          ) : (
            cuts.map((cut) => (
              <button
                key={cut.id}
                type="button"
                className={cut.id === selectedCut?.id ? "cut-list-item active" : "cut-list-item"}
                onClick={() => setSelectedCutId(cut.id)}
              >
                <strong>컷 {cut.position}</strong>
                <span>{cut.caption || cut.scenario || "빈 컷"}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="workspace-panel editor-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cut Editor</p>
            <h2>{selectedCut ? `컷 ${selectedCut.position}` : "컷 편집"}</h2>
          </div>
          <span className={`save-badge ${saveState}`}>{saveLabel(saveState)}</span>
        </div>

        {selectedCut ? (
          <>
            <div className="toolbar-row">
              <Button
                aria-label="선택한 컷 위로 이동"
                size="icon"
                type="button"
                variant="outline"
                onClick={() => moveSelectedCut(-1)}
              >
                <HugeiconsIcon icon={ArrowUp01Icon} />
              </Button>
              <Button
                aria-label="선택한 컷 아래로 이동"
                size="icon"
                type="button"
                variant="outline"
                onClick={() => moveSelectedCut(1)}
              >
                <HugeiconsIcon icon={ArrowDown01Icon} />
              </Button>
              <Button type="button" variant="outline" onClick={duplicateSelectedCut}>
                <HugeiconsIcon icon={Copy01Icon} />
                복제
              </Button>
              <Button type="button" variant="destructive" onClick={deleteSelectedCut}>
                <HugeiconsIcon icon={Delete02Icon} />
                삭제
              </Button>
            </div>
            <div className="field">
              <Label>템플릿</Label>
              <Select
                value={selectedCut.template}
                onValueChange={(value) => updateSelectedCut({ template: value as CutTemplate })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comic">인스타툰</SelectItem>
                  <SelectItem value="card-news">카드뉴스</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="field">
              <Label htmlFor="cut-scenario">컷별 시나리오</Label>
              <Textarea
                id="cut-scenario"
                rows={4}
                value={selectedCut.scenario}
                onChange={(event) => updateSelectedCut({ scenario: event.target.value })}
              />
            </div>
            <div className="field">
              <Label htmlFor="cut-caption">자막</Label>
              <Input
                id="cut-caption"
                value={selectedCut.caption}
                onChange={(event) => updateSelectedCut({ caption: event.target.value })}
              />
            </div>
            <div className="field">
              <Label htmlFor="cut-dialogue">대사</Label>
              <Textarea
                id="cut-dialogue"
                rows={3}
                value={selectedCut.dialogue}
                onChange={(event) => updateSelectedCut({ dialogue: event.target.value })}
              />
            </div>
            <div className="field">
              <Label htmlFor="cut-image-prompt">이미지 프롬프트</Label>
              <Textarea
                id="cut-image-prompt"
                rows={5}
                value={selectedCut.imagePrompt}
                onChange={(event) => updateSelectedCut({ imagePrompt: event.target.value })}
              />
            </div>
            <div className="field">
              <Label htmlFor="cut-negative-prompt">네거티브 프롬프트</Label>
              <Textarea
                id="cut-negative-prompt"
                rows={3}
                value={selectedCut.negativePrompt}
                onChange={(event) => updateSelectedCut({ negativePrompt: event.target.value })}
              />
            </div>
            <Button type="button" onClick={saveSelectedCut}>
              <HugeiconsIcon icon={SaveIcon} />
              변경 내용 저장
            </Button>
          </>
        ) : (
          <p className="empty-state">편집할 컷을 선택하거나 새 컷을 추가하세요.</p>
        )}
      </main>

      <aside className="preview-column">
        <div className="preview-toolbar">
          <span>HTML Preview</span>
          <small>{project.canvasPreset}</small>
        </div>
        {selectedCut ? <CutPreview cut={selectedCut} canvasPreset={project.canvasPreset} /> : null}
      </aside>
    </div>
  );
}

function CutPreview({
  cut,
  canvasPreset,
}: {
  cut: Cut;
  canvasPreset: Project["canvasPreset"];
}) {
  return (
    <article className={`cut-canvas ${canvasPresetClass(canvasPreset)} ${cut.template}`}>
      <div className="cut-art-layer">
        <span>{cut.imagePrompt || "이미지 생성 영역"}</span>
      </div>
      {cut.template === "comic" ? (
        <>
          <div className="speech-bubble">{cut.dialogue || "대사"}</div>
          <div className="comic-caption">{cut.caption || "자막"}</div>
        </>
      ) : (
        <div className="card-copy">
          <strong>{cut.caption || "카드뉴스 제목"}</strong>
          <p>{cut.dialogue || cut.scenario || "본문 요약"}</p>
        </div>
      )}
    </article>
  );
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function canvasPresetClass(canvasPreset: Project["canvasPreset"]) {
  if (canvasPreset === "4:5") {
    return "canvas-4-5";
  }

  if (canvasPreset === "9:16") {
    return "canvas-9-16";
  }

  return "canvas-1-1";
}

function saveLabel(saveState: SaveState) {
  if (saveState === "saving") {
    return "저장 중";
  }

  if (saveState === "saved") {
    return "저장됨";
  }

  if (saveState === "error") {
    return "저장 실패";
  }

  return "수정 중";
}
