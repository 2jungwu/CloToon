"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Cut, CutImageStatus } from "@/lib/cuts/types";
import type { ImageGenerationAssets } from "@/lib/image-generation/types";
import type { CanvasPreset, ContentType, Project } from "@/lib/projects/types";
import type { StudioExportSettings } from "@/lib/studio-preferences";

type StudioWorkbenchProps = {
  initialProjectId?: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";
type GenerationState = "idle" | "generating" | "done" | "error";
type ExportState = "idle" | "exporting" | "done" | "error";

type ProjectsResponse = {
  projects: Project[];
};

type CreateProjectResponse = {
  project: Project;
};

type CutsResponse = {
  cuts: Cut[];
};

const labels = {
  studio: "\uc2a4\ud29c\ub514\uc624",
  workbench: "\uc6cc\ud06c\ubca4\uce58",
  workbenchAria: "\uc2a4\ud29c\ub514\uc624 \uc6cc\ud06c\ubca4\uce58",
  projectList: "\ud504\ub85c\uc81d\ud2b8 \ubaa9\ub85d",
  projectName: "\ud504\ub85c\uc81d\ud2b8 \uc774\ub984",
  projectNamePlaceholder: "\uc608: 5\uc6d4 \uce74\ub4dc\ub274\uc2a4 \uae30\ud68d",
  contentType: "\ucf58\ud150\uce20 \uc720\ud615",
  canvas: "\uce94\ubc84\uc2a4",
  addProject: "\ud504\ub85c\uc81d\ud2b8 \ucd94\uac00",
  addingProject: "\ucd94\uac00 \uc911...",
  deleteProject: "\uc0ad\uc81c",
  createProjectError: "\ud504\ub85c\uc81d\ud2b8\ub97c \ucd94\uac00\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  deleteProjectError: "\ud504\ub85c\uc81d\ud2b8\ub97c \uc0ad\uc81c\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  confirmDeleteProject: "\uc774 \ud504\ub85c\uc81d\ud2b8\ub97c \uc0ad\uc81c\ud560\uae4c\uc694?",
  cutList: "\ucef7 \ubaa9\ub85d",
  selectedProjectArea: "\uc120\ud0dd\ud55c \ud504\ub85c\uc81d\ud2b8 \uc791\uc5c5 \uc601\uc5ed",
  selectProject: "\ud504\ub85c\uc81d\ud2b8\ub97c \uc120\ud0dd\ud558\uc138\uc694",
  selectProjectHelp: "\uc67c\ucabd \ubaa9\ub85d\uc5d0\uc11c \uc791\uc5c5\ud560 \ud504\ub85c\uc81d\ud2b8\ub97c \uc120\ud0dd\ud558\uc138\uc694.",
  cutCount: "\ucef7 \uc218",
  status: "\uc0c1\ud0dc",
  noContent: "\ub0b4\uc6a9 \uc5c6\uc74c",
  selectedCut: "\uc120\ud0dd\ud55c \ucef7",
  fullScenario: "\uc804\uccb4 \uc2dc\ub098\ub9ac\uc624",
  fullScenarioPlaceholder:
    "\ub2e4\uc74c \uc791\uc5c5\uc5d0\uc11c \uc804\uccb4 \uc2dc\ub098\ub9ac\uc624 \ud3b8\uc9d1 \uc601\uc5ed\uc774 \uc5f0\uacb0\ub429\ub2c8\ub2e4.",
  caption: "\uc790\ub9c9",
  dialogue: "\ub300\uc0ac",
  imagePrompt: "\uc774\ubbf8\uc9c0 \ud504\ub86c\ud504\ud2b8",
  none: "\uc5c6\uc74c",
  generation: "\uc0dd\uc131",
  export: "\ub0b4\ubcf4\ub0b4\uae30",
  assetSummary: "\uc774\ubbf8\uc9c0 \uc790\uc0b0",
  assetCountSuffix: "\uac1c",
  exportScale: "\ub0b4\ubcf4\ub0b4\uae30 \ubc30\uc728",
  noSelectedCut: "\uc120\ud0dd\ud55c \ucef7\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
  comic: "\uc778\uc2a4\ud0c0\ud230",
  cardNews: "\uce74\ub4dc\ub274\uc2a4",
  projectLoading: "\ud504\ub85c\uc81d\ud2b8\ub97c \ubd88\ub7ec\uc624\ub294 \uc911...",
  projectLoadError: "\ud504\ub85c\uc81d\ud2b8\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  projectReady: "\ud504\ub85c\uc81d\ud2b8\ub97c \uc120\ud0dd\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  noProjects: "\uc544\uc9c1 \ud504\ub85c\uc81d\ud2b8\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.",
  cutLoading: "\ubd88\ub7ec\uc624\ub294 \uc911",
  error: "\uc624\ub958",
  ready: "\uc900\ube44\ub428",
  saving: "\uc800\uc7a5 \uc911",
  saved: "\uc800\uc7a5\ub428",
  saveError: "\uc800\uc7a5 \uc624\ub958",
  shell: "\uc258",
  generating: "\uc0dd\uc131 \uc911",
  done: "\uc644\ub8cc",
  waiting: "\ub300\uae30",
  exporting: "\ub0b4\ubcf4\ub0b4\ub294 \uc911",
};

const contentTypeLabels: Record<ContentType, string> = {
  comic: labels.comic,
  "card-news": labels.cardNews,
};

const canvasPresetLabels: Record<CanvasPreset, string> = {
  "1:1": "1:1",
  "4:5": "4:5",
  "9:16": "9:16",
};

const cutImageStatusLabels: Record<CutImageStatus, string> = {
  empty: "\uc774\ubbf8\uc9c0 \uc5c6\uc74c",
  mock: "\ubaa9\uc5c5 \uc774\ubbf8\uc9c0",
  uploaded: "\uc5c5\ub85c\ub4dc \uc774\ubbf8\uc9c0",
  generated: "\uc0dd\uc131 \uc774\ubbf8\uc9c0",
  failed: "\uc0dd\uc131 \uc2e4\ud328",
};

const emptyImageGenerationAssets: ImageGenerationAssets = {
  selectedCharacterId: "",
  characters: [],
  background: {
    name: "",
    prompt: "",
    color: "",
  },
};

const defaultExportSettings: StudioExportSettings = {
  exportScale: "1080",
  saveOriginalHtml: true,
};

export function StudioWorkbench({ initialProjectId }: StudioWorkbenchProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? "");
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [selectedCutId, setSelectedCutId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contentType, setContentType] = useState<ContentType>("comic");
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>("1:1");
  const [newProjectName, setNewProjectName] = useState("");
  const [newContentType, setNewContentType] = useState<ContentType>("comic");
  const [newCanvasPreset, setNewCanvasPreset] = useState<CanvasPreset>("1:1");
  const [projectActionError, setProjectActionError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [fullScenario, setFullScenario] = useState("");
  const [projectLoadState, setProjectLoadState] = useState<LoadState>("idle");
  const [cutLoadState, setCutLoadState] = useState<LoadState>("idle");
  const [saveState] = useState<SaveState>("idle");
  const [generationState] = useState<GenerationState>("idle");
  const [exportState] = useState<ExportState>("idle");
  const [imageGenerationAssets] = useState<ImageGenerationAssets>(emptyImageGenerationAssets);
  const [exportSettings] = useState<StudioExportSettings>(defaultExportSettings);
  const cutRequestIdRef = useRef(0);
  const projectRequestIdRef = useRef(0);
  const projectsRef = useRef<Project[]>([]);
  const selectedProjectIdRef = useRef(initialProjectId ?? "");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const selectedCut = useMemo(
    () => cuts.find((cut) => cut.id === selectedCutId) ?? cuts[0] ?? null,
    [cuts, selectedCutId],
  );

  const loadCuts = useCallback(async (projectId: string) => {
    const requestId = cutRequestIdRef.current + 1;
    cutRequestIdRef.current = requestId;
    setCutLoadState("loading");

    try {
      const response = await fetch(`/api/projects/${projectId}/cuts`);

      if (!response.ok) {
        throw new Error("Unable to load cuts.");
      }

      const payload = (await response.json()) as CutsResponse;
      const loadedCuts = payload.cuts;

      if (requestId !== cutRequestIdRef.current || selectedProjectIdRef.current !== projectId) {
        return;
      }

      setCuts(loadedCuts);
      setSelectedCutId((currentCutId) => {
        if (loadedCuts.some((cut) => cut.id === currentCutId)) {
          return currentCutId;
        }

        return loadedCuts[0]?.id ?? "";
      });
      setCutLoadState("ready");
    } catch {
      if (requestId !== cutRequestIdRef.current || selectedProjectIdRef.current !== projectId) {
        return;
      }

      setCuts([]);
      setSelectedCutId("");
      setCutLoadState("error");
    }
  }, []);

  const loadProjects = useCallback(async () => {
    const requestId = projectRequestIdRef.current + 1;
    projectRequestIdRef.current = requestId;
    setProjectLoadState("loading");

    try {
      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("Unable to load projects.");
      }

      const payload = (await response.json()) as ProjectsResponse;
      const loadedProjects = payload.projects;

      if (requestId !== projectRequestIdRef.current) {
        return;
      }

      const preferredProject =
        (initialProjectId
          ? loadedProjects.find((project) => project.id === initialProjectId)
          : null) ??
        loadedProjects[0] ??
        null;

      projectsRef.current = loadedProjects;
      setProjects(loadedProjects);
      setSelectedProjectId(preferredProject?.id ?? "");
      selectedProjectIdRef.current = preferredProject?.id ?? "";
      setProjectDetails(preferredProject);
      setProjectLoadState("ready");

      if (preferredProject) {
        setCuts([]);
        setSelectedCutId("");
        await loadCuts(preferredProject.id);
      } else {
        cutRequestIdRef.current += 1;
        setCuts([]);
        setSelectedCutId("");
      }
    } catch {
      if (requestId !== projectRequestIdRef.current) {
        return;
      }

      projectsRef.current = [];
      setProjects([]);
      setSelectedProjectId("");
      selectedProjectIdRef.current = "";
      cutRequestIdRef.current += 1;
      setCuts([]);
      setSelectedCutId("");
      setProjectLoadState("error");
    }
  }, [initialProjectId, loadCuts]);

  useEffect(() => {
    let cancelled = false;

    window.queueMicrotask(() => {
      if (!cancelled) {
        void loadProjects();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  function setProjectDetails(project: Project | null) {
    if (!project) {
      setProjectName("");
      setContentType("comic");
      setCanvasPreset("1:1");
      return;
    }

    setProjectName(project.name);
    setContentType(project.contentType);
    setCanvasPreset(project.canvasPreset);
  }

  function clearSelectedProject() {
    setSelectedProjectId("");
    selectedProjectIdRef.current = "";
    setProjectDetails(null);
    cutRequestIdRef.current += 1;
    setCuts([]);
    setSelectedCutId("");
    setCutLoadState("idle");
  }

  function selectProject(project: Project) {
    projectRequestIdRef.current += 1;
    setSelectedProjectId(project.id);
    selectedProjectIdRef.current = project.id;
    setProjectDetails(project);
    setProjectLoadState("ready");
    setCuts([]);
    setSelectedCutId("");
    void loadCuts(project.id);
  }

  function handleProjectSelect(projectId: string) {
    const project = projects.find((item) => item.id === projectId) ?? null;

    if (project) {
      selectProject(project);
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newProjectName.trim();

    if (!name) {
      return;
    }

    setCreatingProject(true);
    setProjectActionError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          contentType: newContentType,
          canvasPreset: newCanvasPreset,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create project.");
      }

      const payload = (await response.json()) as CreateProjectResponse;
      const createdProject = payload.project;

      projectRequestIdRef.current += 1;
      setProjects((currentProjects) => {
        const nextProjects = [createdProject, ...currentProjects];

        projectsRef.current = nextProjects;
        return nextProjects;
      });
      setNewProjectName("");
      setProjectLoadState("ready");
      selectProject(createdProject);
    } catch {
      setProjectActionError(labels.createProjectError);
    } finally {
      setCreatingProject(false);
    }
  }

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(`${project.name}\n${labels.confirmDeleteProject}`);

    if (!confirmed) {
      return;
    }

    setDeletingProjectId(project.id);
    setProjectActionError(null);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete project.");
      }

      const currentProjects = projectsRef.current;
      const deletedIndex = currentProjects.findIndex((item) => item.id === project.id);
      const remainingProjects = currentProjects.filter((item) => item.id !== project.id);
      const deletedProjectStillSelected = selectedProjectIdRef.current === project.id;
      const nextSelectedProject = deletedProjectStillSelected
        ? remainingProjects[deletedIndex] ?? remainingProjects[deletedIndex - 1]
        : null;

      projectRequestIdRef.current += 1;
      setProjects((currentProjects) => {
        const remainingProjects = currentProjects.filter((item) => item.id !== project.id);

        projectsRef.current = remainingProjects;
        return remainingProjects;
      });
      setProjectLoadState("ready");

      if (remainingProjects.length === 0 || (deletedProjectStillSelected && !nextSelectedProject)) {
        clearSelectedProject();
      } else if (nextSelectedProject) {
        selectProject(nextSelectedProject);
      }
    } catch {
      setProjectActionError(labels.deleteProjectError);
    } finally {
      setDeletingProjectId("");
    }
  }

  return (
    <section className="split-layout workspace-layout" aria-label={labels.workbenchAria}>
      <ProjectRail
        canvasPreset={newCanvasPreset}
        contentType={newContentType}
        creatingProject={creatingProject}
        deletingProjectId={deletingProjectId}
        error={projectActionError}
        name={newProjectName}
        onCanvasPresetChange={setNewCanvasPreset}
        onContentTypeChange={setNewContentType}
        onCreateProject={createProject}
        onDeleteProject={deleteProject}
        onNameChange={setNewProjectName}
        onProjectSelect={handleProjectSelect}
        projectLoadState={projectLoadState}
        projects={projects}
        selectedProjectId={selectedProjectId}
      />

      <div className="split-content">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Workbench</p>
            <h2>{projectName || labels.selectProject}</h2>
            <p>
              {selectedProject
                ? `${contentTypeLabels[contentType]} - ${canvasPreset}`
                : labels.selectProjectHelp}
            </p>
          </div>
          <span className="save-badge">{getSaveLabel(saveState)}</span>
        </div>

        <section className="workspace-detail-grid" aria-label={labels.selectedProjectArea}>
          <aside className="split-menu workspace-menu" aria-label={labels.cutList}>
            <div className="storyboard-info">
              <p className="eyebrow">Cuts</p>
              <dl>
                <div>
                  <dt>{labels.cutCount}</dt>
                  <dd>{cuts.length}</dd>
                </div>
                <div>
                  <dt>{labels.status}</dt>
                  <dd>{getCutLoadMessage(cutLoadState)}</dd>
                </div>
              </dl>
            </div>

            <div className="split-menu-list cut-list">
              {cuts.map((cut) => {
                const active = cut.id === selectedCut?.id;

                return (
                  <button
                    aria-current={active ? "page" : undefined}
                    className="split-menu-item workspace-cut-item"
                    data-active={active}
                    key={cut.id}
                    onClick={() => setSelectedCutId(cut.id)}
                    type="button"
                  >
                    <span>#{cut.position}</span>
                    <strong>{cut.caption || cut.dialogue || labels.noContent}</strong>
                    <small>{cutImageStatusLabels[cut.imageStatus]}</small>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="editor-panel">
            {selectedCut ? (
              <>
                <div className="panel-heading inline-heading">
                  <div>
                    <p className="eyebrow">Cut {selectedCut.position}</p>
                    <h2>{selectedCut.caption || labels.selectedCut}</h2>
                  </div>
                </div>

                <label className="field-stack">
                  {labels.fullScenario}
                  <textarea
                    onChange={(event) => setFullScenario(event.target.value)}
                    placeholder={labels.fullScenarioPlaceholder}
                    rows={5}
                    value={fullScenario}
                  />
                </label>

                <div className="storyboard-info">
                  <dl>
                    <div>
                      <dt>{labels.caption}</dt>
                      <dd>{selectedCut.caption || labels.none}</dd>
                    </div>
                    <div>
                      <dt>{labels.dialogue}</dt>
                      <dd>{selectedCut.dialogue || labels.none}</dd>
                    </div>
                    <div>
                      <dt>{labels.imagePrompt}</dt>
                      <dd>{selectedCut.imagePrompt || labels.none}</dd>
                    </div>
                  </dl>
                </div>

                <p className="save-state">
                  {labels.generation}: {getGenerationLabel(generationState)} - {labels.export}:{" "}
                  {getExportLabel(exportState)}
                </p>
                <p className="sr-only">
                  {labels.assetSummary} {imageGenerationAssets.characters.length}
                  {labels.assetCountSuffix}, {labels.exportScale} {exportSettings.exportScale}
                </p>
              </>
            ) : (
              <p className="empty-state">{labels.noSelectedCut}</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

type StudioChipProps = {
  children: ReactNode;
};

function StudioChip({ children }: StudioChipProps) {
  return <span className="studio-chip">{children}</span>;
}

type ProjectRailProps = {
  canvasPreset: CanvasPreset;
  contentType: ContentType;
  creatingProject: boolean;
  deletingProjectId: string;
  error: string | null;
  name: string;
  onCanvasPresetChange: (canvasPreset: CanvasPreset) => void;
  onContentTypeChange: (contentType: ContentType) => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteProject: (project: Project) => void;
  onNameChange: (name: string) => void;
  onProjectSelect: (projectId: string) => void;
  projectLoadState: LoadState;
  projects: Project[];
  selectedProjectId: string;
};

function ProjectRail({
  canvasPreset,
  contentType,
  creatingProject,
  deletingProjectId,
  error,
  name,
  onCanvasPresetChange,
  onContentTypeChange,
  onCreateProject,
  onDeleteProject,
  onNameChange,
  onProjectSelect,
  projectLoadState,
  projects,
  selectedProjectId,
}: ProjectRailProps) {
  return (
    <aside className="split-menu workspace-menu project-rail" aria-label={labels.projectList}>
      <div className="storyboard-info">
        <p className="eyebrow">{labels.studio}</p>
        <h1 className="sr-only">{labels.studio}</h1>
        <p className="save-state">{getProjectLoadMessage(projectLoadState, projects.length)}</p>
      </div>

      <form className="project-rail-form" onSubmit={onCreateProject}>
        <label className="field-stack">
          {labels.projectName}
          <Input
            aria-label={labels.projectName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={labels.projectNamePlaceholder}
            value={name}
          />
        </label>

        <label className="field-stack">
          {labels.contentType}
          <Select value={contentType} onValueChange={(value) => onContentTypeChange(value as ContentType)}>
            <SelectTrigger aria-label={labels.contentType}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comic">{labels.comic}</SelectItem>
              <SelectItem value="card-news">{labels.cardNews}</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="field-stack">
          {labels.canvas}
          <Select
            value={canvasPreset}
            onValueChange={(value) => onCanvasPresetChange(value as CanvasPreset)}
          >
            <SelectTrigger aria-label={labels.canvas}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="4:5">4:5</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <Button disabled={creatingProject || name.trim().length === 0} type="submit">
          {creatingProject ? labels.addingProject : labels.addProject}
        </Button>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="split-menu-list project-rail-list">
        {projects.map((project) => {
          const active = project.id === selectedProjectId;

          return (
            <div className="project-rail-row" data-active={active} key={project.id}>
              <button
                aria-current={active ? "page" : undefined}
                className="split-menu-item project-menu-item"
                onClick={() => onProjectSelect(project.id)}
                type="button"
              >
                <span>{project.name}</span>
                <span className="project-rail-meta">
                  <StudioChip>{contentTypeLabels[project.contentType]}</StudioChip>
                  <StudioChip>{canvasPresetLabels[project.canvasPreset]}</StudioChip>
                </span>
              </button>
              <button
                aria-label={`${project.name} ${labels.deleteProject}`}
                className="project-row-delete"
                disabled={deletingProjectId === project.id}
                onClick={() => onDeleteProject(project)}
                type="button"
              >
                {labels.deleteProject}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function getProjectLoadMessage(state: LoadState, projectCount: number) {
  if (state === "loading") {
    return labels.projectLoading;
  }

  if (state === "error") {
    return labels.projectLoadError;
  }

  if (projectCount === 0) {
    return labels.noProjects;
  }

  return labels.projectReady;
}

function getCutLoadMessage(state: LoadState) {
  if (state === "loading") {
    return labels.cutLoading;
  }

  if (state === "error") {
    return labels.error;
  }

  return labels.ready;
}

function getSaveLabel(state: SaveState) {
  if (state === "saving") {
    return labels.saving;
  }

  if (state === "saved") {
    return labels.saved;
  }

  if (state === "error") {
    return labels.saveError;
  }

  return labels.shell;
}

function getGenerationLabel(state: GenerationState) {
  if (state === "generating") {
    return labels.generating;
  }

  if (state === "done") {
    return labels.done;
  }

  if (state === "error") {
    return labels.error;
  }

  return labels.waiting;
}

function getExportLabel(state: ExportState) {
  if (state === "exporting") {
    return labels.exporting;
  }

  if (state === "done") {
    return labels.done;
  }

  if (state === "error") {
    return labels.error;
  }

  return labels.waiting;
}
