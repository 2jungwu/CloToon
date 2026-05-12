"use client";

import type { CSSProperties, FormEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toCssImageUrl } from "@/lib/cuts/image-data-url";
import { getCutTextOverlay } from "@/lib/cuts/text-overlay";
import type { Cut, CutTemplate, UpdateCutInput } from "@/lib/cuts/types";
import {
  loadGeminiApiKeyFromStorage,
  loadImageGenerationAssetsFromStorage,
  loadSelectedGeminiImageModelFromStorage,
} from "@/lib/image-generation/storage";
import type { ImageGenerationAssets } from "@/lib/image-generation/types";
import type { CanvasPreset, ContentType, Project } from "@/lib/projects/types";
import {
  defaultStudioPreferences,
  getExportPixelRatio,
  loadStudioPreferencesFromStorage,
  type StudioExportSettings,
  type StudioFonts,
} from "@/lib/studio-preferences";

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

type CutResponse = {
  cut: Cut;
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

const labels = {
  studio: "\uc2a4\ud29c\ub514\uc624",
  workbench: "\ud504\ub85c\uc81d\ud2b8",
  workbenchAria: "\uc2a4\ud29c\ub514\uc624 \uc6cc\ud06c\ubca4\uce58",
  projectsTitle: "\ud504\ub85c\uc81d\ud2b8",
  projectListTitle: "\ud504\ub85c\uc81d\ud2b8 \ubaa9\ub85d",
  newProject: "새로 만들기",
  emptyHeroCardNews: "카드뉴스",
  emptyHeroComic: "인스타툰",
  emptyHeroTitlePrefix: "아이디어를",
  emptyHeroTitleAccent: "장면",
  emptyHeroTitleSuffix: "으로 바꾸세요",
  emptyHeroCopy: "상상하던 장면을 더 빠르고 쉽게.",
  emptyBuilderTitle: "새 프로젝트를 먼저 만드세요",
  emptyBuilderCopy: "먼저 제작 형식을 정하세요. 나머지는 워크벤치에서 이어집니다.",
  emptyCreateProject: "프로젝트 생성",
  cancel: "\ucde8\uc18c",
  create: "\uc0dd\uc131",
  creating: "\uc0dd\uc131 \uc911...",
  projectName: "\ud504\ub85c\uc81d\ud2b8 \uc774\ub984",
  projectNamePlaceholder: "\uc608: 5\uc6d4 \uce74\ub4dc\ub274\uc2a4 \uae30\ud68d",
  contentType: "\ucf58\ud150\uce20 \uc720\ud615",
  canvas: "\uce94\ubc84\uc2a4",
  deleteProject: "\uc0ad\uc81c",
  createProjectError: "\ud504\ub85c\uc81d\ud2b8\ub97c \ucd94\uac00\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  deleteProjectError: "\ud504\ub85c\uc81d\ud2b8\ub97c \uc0ad\uc81c\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  confirmDeleteProject: "\uc774 \ud504\ub85c\uc81d\ud2b8\ub97c \uc0ad\uc81c\ud560\uae4c\uc694?",
  cutList: "\ucef7 \ubaa9\ub85d",
  selectedProjectArea: "\uc120\ud0dd\ud55c \ud504\ub85c\uc81d\ud2b8 \uc791\uc5c5 \uc601\uc5ed",
  selectProject: "\ud504\ub85c\uc81d\ud2b8\ub97c \uc120\ud0dd\ud558\uc138\uc694",
  selectProjectHelp: "\uc67c\ucabd \ubaa9\ub85d\uc5d0\uc11c \uc791\uc5c5\ud560 \ud504\ub85c\uc81d\ud2b8\ub97c \uc120\ud0dd\ud558\uc138\uc694.",
  cutCount: "\ucef7 \uc218",
  decreaseCutCount: "\ucef7 \uc218 \uc904\uc774\uae30",
  increaseCutCount: "\ucef7 \uc218 \ub298\ub9ac\uae30",
  status: "\uc0c1\ud0dc",
  noContent: "\ub0b4\uc6a9 \uc5c6\uc74c",
  selectedCut: "\uc120\ud0dd\ud55c \ucef7",
  cutScenario: "\ucef7 \uc2dc\ub098\ub9ac\uc624",
  cutScenarioPlaceholder: "\uc774 \ucef7\uc5d0\uc11c \ubcf4\uc5ec\uc904 \uc7a5\uba74\uc744 \uc801\uc5b4\uc8fc\uc138\uc694.",
  fullScenario: "\uc804\uccb4 \uc2dc\ub098\ub9ac\uc624",
  fullScenarioPlaceholder:
    "\uce74\ub4dc\ub274\uc2a4 \uc804\uccb4 \ud750\ub984\uc744 \uc801\uc5b4\uc8fc\uc138\uc694.",
  produceAll: "\ud55c \ubc88\uc5d0 \uc81c\uc791",
  caption: "\uc790\ub9c9",
  captionPlaceholder: "\ud654\uba74\uc5d0 \ud45c\uc2dc\ud560 \uc790\ub9c9\uc744 \uc785\ub825\ud558\uc138\uc694.",
  dialogue: "\ub300\uc0ac",
  dialoguePlaceholder: "\ub300\uc0ac \ub610\ub294 \ubcf8\ubb38\uc744 \uc785\ub825\ud558\uc138\uc694.",
  imagePrompt: "\uc774\ubbf8\uc9c0 \ud504\ub86c\ud504\ud2b8",
  imagePromptPlaceholder: "\uc774\ubbf8\uc9c0\ub85c \ub9cc\ub4e4 \uc7a5\uba74\uc744 \uc124\uba85\ud558\uc138\uc694.",
  generateImage: "\uc774\ubbf8\uc9c0 \uc0dd\uc131",
  none: "\uc5c6\uc74c",
  generation: "\uc0dd\uc131",
  export: "\ub0b4\ubcf4\ub0b4\uae30",
  assetSummary: "\uc774\ubbf8\uc9c0 \uc790\uc0b0",
  assetCountSuffix: "\uac1c",
  exportScale: "\ub0b4\ubcf4\ub0b4\uae30 \ubc30\uc728",
  imageOnlyPreview: "\uc774\ubbf8\uc9c0 \ubbf8\ub9ac\ubcf4\uae30",
  imageOnlyPreviewTitle: "\ucef7 \uc774\ubbf8\uc9c0",
  imagePreviewPlaceholder: "\uc0dd\uc131\ub418\uac70\ub098 \uc5c5\ub85c\ub4dc\ub41c \uc774\ubbf8\uc9c0\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.",
  currentCutPng: "\ud604\uc7ac \ucef7 PNG",
  allCutsZip: "\uc804\uccb4 ZIP",
  exportDone: "\ub2e4\uc6b4\ub85c\ub4dc \uc0dd\uc131 \uc644\ub8cc",
  exportFailed: "\ub2e4\uc6b4\ub85c\ub4dc \uc2e4\ud328",
  exportCutNotFound: "\ub0b4\ubcf4\ub0bc \ucef7\uc744 \ucc3e\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  exportNoCuts: "\ub0b4\ubcf4\ub0bc \ucef7\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
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
  saveCutError: "\ucef7\uc744 \uc800\uc7a5\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  shell: "\uc258",
  generating: "\uc0dd\uc131 \uc911",
  done: "\uc644\ub8cc",
  waiting: "\ub300\uae30",
  exporting: "\ub0b4\ubcf4\ub0b4\ub294 \uc911",
  missingApiKey: "\uc790\uc0b0 > API Key\uc5d0\uc11c Gemini API Key\ub97c \uba3c\uc800 \uc800\uc7a5\ud574\uc8fc\uc138\uc694.",
  missingImageModel: "\uc790\uc0b0 > API\uc5d0\uc11c Gemini \uc774\ubbf8\uc9c0 \ubaa8\ub378\uc744 \uba3c\uc800 \uc800\uc7a5\ud574\uc8fc\uc138\uc694.",
  generationSaving: "\ucef7 \uc218\uc815 \ub0b4\uc6a9\uc744 \uc800\uc7a5\ud55c \ub4a4 \uc774\ubbf8\uc9c0\ub97c \uc0dd\uc131\ud558\ub294 \uc911...",
  generationDone: "\uc774\ubbf8\uc9c0 \uc0dd\uc131\uc774 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4.",
  generationFailed: "\uc774\ubbf8\uc9c0 \uc0dd\uc131\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  onePassCardNewsOnly: "\ud55c \ubc88\uc5d0 \uc81c\uc791\uc740 \uce74\ub4dc\ub274\uc2a4 \ud504\ub85c\uc81d\ud2b8\uc5d0\uc11c\ub9cc \uc0ac\uc6a9\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  onePassScenarioRequired: "\uc804\uccb4 \uc2dc\ub098\ub9ac\uc624\ub97c \uba3c\uc800 \uc785\ub825\ud574\uc8fc\uc138\uc694.",
  onePassReady: "\ud55c \ubc88\uc5d0 \uc81c\uc791\ud560 \ucef7\uc744 \uc900\ube44\ud558\ub294 \uc911...",
  onePassProgressSuffix: "\ubc88\uc9f8 \ucef7 \uc774\ubbf8\uc9c0 \uc0dd\uc131 \uc911",
  apiKeyError: "Gemini API Key\ub97c \ud655\uc778\ud574\uc8fc\uc138\uc694.",
  quotaError:
    "Gemini \uc774\ubbf8\uc9c0 \uc0dd\uc131 \ud560\ub2f9\ub7c9\uc774 \ubd80\uc871\ud569\ub2c8\ub2e4. Google AI Studio\uc758 billing/quota\ub97c \ud655\uc778\ud574\uc8fc\uc138\uc694.",
  badRequestError: "\uc774\ubbf8\uc9c0 \uc0dd\uc131 \uc694\uccad\uc744 \ub9cc\ub4e4\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  networkError: "\uc774\ubbf8\uc9c0 \uc0dd\uc131 \uc694\uccad \uc911 \ub124\ud2b8\uc6cc\ud06c \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
  serviceError: "Gemini \uc11c\ube44\uc2a4 \uc751\ub2f5\uc774 \ubd88\uc548\uc815\ud569\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
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

const defaultProjectNameByContentType: Record<ContentType, string> = {
  comic: "새 인스타툰 프로젝트",
  "card-news": "새 카드뉴스 프로젝트",
};

const defaultCanvasPresetByContentType: Record<ContentType, CanvasPreset> = {
  comic: "1:1",
  "card-news": "4:5",
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

const cutTemplatesByContentType: Record<ContentType, CutTemplate> = {
  comic: "comic",
  "card-news": "card-news",
};

export function StudioWorkbench({ initialProjectId }: StudioWorkbenchProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? "");
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [selectedCutId, setSelectedCutId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contentType, setContentType] = useState<ContentType>("comic");
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>("1:1");
  const [newProjectName, setNewProjectName] = useState(defaultProjectNameByContentType["card-news"]);
  const [newContentType, setNewContentType] = useState<ContentType>("card-news");
  const [newCanvasPreset, setNewCanvasPreset] = useState<CanvasPreset>("4:5");
  const [projectCreateModalOpen, setProjectCreateModalOpen] = useState(false);
  const [projectActionError, setProjectActionError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [fullScenario, setFullScenario] = useState("");
  const [projectLoadState, setProjectLoadState] = useState<LoadState>("idle");
  const [cutLoadState, setCutLoadState] = useState<LoadState>("idle");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [generationMessage, setGenerationMessage] = useState("");
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [imageGenerationAssets] = useState<ImageGenerationAssets>(emptyImageGenerationAssets);
  const [studioPreferences, setStudioPreferences] = useState(defaultStudioPreferences);
  const exportRootRef = useRef<HTMLDivElement | null>(null);
  const cutRequestIdRef = useRef(0);
  const projectRequestIdRef = useRef(0);
  const projectsRef = useRef<Project[]>([]);
  const selectedProjectIdRef = useRef(initialProjectId ?? "");
  const selectedCutIdRef = useRef("");
  const pendingCutPatchesRef = useRef<Record<string, UpdateCutInput>>({});
  const pendingCutProjectIdsRef = useRef<Record<string, string>>({});
  const patchTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const cutPatchChainsRef = useRef<Record<string, Promise<Cut | null>>>({});
  const generationInFlightRef = useRef(false);
  const newProjectButtonRef = useRef<HTMLButtonElement | null>(null);
  const projectDrawerCloseTimerRef = useRef<number | null>(null);
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);

  const cancelProjectDrawerClose = useCallback(() => {
    if (projectDrawerCloseTimerRef.current) {
      window.clearTimeout(projectDrawerCloseTimerRef.current);
      projectDrawerCloseTimerRef.current = null;
    }
  }, []);

  const openProjectDrawer = useCallback(() => {
    cancelProjectDrawerClose();
    setProjectDrawerOpen(true);
  }, [cancelProjectDrawerClose]);

  const scheduleProjectDrawerClose = useCallback(() => {
    cancelProjectDrawerClose();
    projectDrawerCloseTimerRef.current = window.setTimeout(() => {
      setProjectDrawerOpen(false);
      projectDrawerCloseTimerRef.current = null;
    }, 160);
  }, [cancelProjectDrawerClose]);

  const patchCut = useCallback(
    (cutId: string, patch: UpdateCutInput, projectId = selectedProjectIdRef.current) => {
      if (!projectId) {
        return Promise.resolve(null);
      }

      const currentChain = cutPatchChainsRef.current[cutId] ?? Promise.resolve(null);

      const nextChain = currentChain
        .catch(() => undefined)
        .then(async () => {
          setSaveState("saving");

          try {
            const response = await fetch(`/api/projects/${projectId}/cuts/${cutId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(patch),
            });

            if (!response.ok) {
              throw new Error("Unable to update cut.");
            }

            const payload = (await response.json()) as CutResponse;

            if (selectedProjectIdRef.current === projectId) {
              setCuts((currentCuts) =>
                currentCuts.map((cut) => (cut.id === payload.cut.id ? payload.cut : cut)),
              );
              setSaveState("saved");
            }

            return payload.cut;
          } catch {
            if (selectedProjectIdRef.current === projectId) {
              setSaveState("error");
            }

            return null;
          }
        })
        .finally(() => {
          if (cutPatchChainsRef.current[cutId] === nextChain) {
            delete cutPatchChainsRef.current[cutId];
          }
        });

      cutPatchChainsRef.current[cutId] = nextChain;
      return nextChain;
    },
    [],
  );

  const flushPendingCutPatch = useCallback(
    (cutId: string) => {
      const timer = patchTimersRef.current[cutId];

      if (timer) {
        clearTimeout(timer);
      }

      const pendingPatch = pendingCutPatchesRef.current[cutId];
      const projectId = pendingCutProjectIdsRef.current[cutId] ?? selectedProjectIdRef.current;

      delete patchTimersRef.current[cutId];
      delete pendingCutPatchesRef.current[cutId];
      delete pendingCutProjectIdsRef.current[cutId];

      if (!pendingPatch) {
        return cutPatchChainsRef.current[cutId] ?? Promise.resolve(null);
      }

      return patchCut(cutId, pendingPatch, projectId);
    },
    [patchCut],
  );

  const flushAllPendingCutPatches = useCallback(() => {
    Object.keys(pendingCutPatchesRef.current).forEach((cutId) => flushPendingCutPatch(cutId));
  }, [flushPendingCutPatch]);

  const clearPendingCutPatch = useCallback((cutId: string) => {
    const timer = patchTimersRef.current[cutId];

    if (timer) {
      clearTimeout(timer);
    }

    delete patchTimersRef.current[cutId];
    delete pendingCutPatchesRef.current[cutId];
    delete pendingCutProjectIdsRef.current[cutId];
  }, []);

  const saveEditableCut = useCallback(
    async (cut: Cut, patch: UpdateCutInput = {}) => {
      const timer = patchTimersRef.current[cut.id];

      if (timer) {
        clearTimeout(timer);
      }

      const pendingPatch = pendingCutPatchesRef.current[cut.id];
      const projectId = pendingCutProjectIdsRef.current[cut.id] ?? cut.projectId;
      const mergedPatch = {
        ...pendingPatch,
        ...patch,
      };

      delete patchTimersRef.current[cut.id];
      delete pendingCutPatchesRef.current[cut.id];
      delete pendingCutProjectIdsRef.current[cut.id];

      if (Object.keys(mergedPatch).length === 0) {
        return (await cutPatchChainsRef.current[cut.id]) ?? cut;
      }

      setCuts((currentCuts) =>
        currentCuts.map((item) => (item.id === cut.id ? { ...item, ...mergedPatch } : item)),
      );

      const savedCut = await patchCut(cut.id, mergedPatch, projectId);

      if (!savedCut) {
        throw new Error(labels.saveCutError);
      }

      return savedCut;
    },
    [patchCut],
  );

  const selectCut = useCallback((cutId: string) => {
    if (selectedCutIdRef.current && selectedCutIdRef.current !== cutId) {
      flushPendingCutPatch(selectedCutIdRef.current);
    }

    selectedCutIdRef.current = cutId;
    setSelectedCutId(cutId);
  }, [flushPendingCutPatch]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const selectedCut = useMemo(
    () => cuts.find((cut) => cut.id === selectedCutId) ?? cuts[0] ?? null,
    [cuts, selectedCutId],
  );
  const sortedCuts = useMemo(() => [...cuts].sort((a, b) => a.position - b.position), [cuts]);

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
      selectCut(
        loadedCuts.some((cut) => cut.id === selectedCutIdRef.current)
          ? selectedCutIdRef.current
          : (loadedCuts[0]?.id ?? ""),
      );
      setCutLoadState("ready");
    } catch {
      if (requestId !== cutRequestIdRef.current || selectedProjectIdRef.current !== projectId) {
        return;
      }

      setCuts([]);
      selectCut("");
      setCutLoadState("error");
    }
  }, [selectCut]);

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
        selectCut("");
        await loadCuts(preferredProject.id);
      } else {
        cutRequestIdRef.current += 1;
        setCuts([]);
        selectCut("");
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
      selectCut("");
      setProjectLoadState("error");
    }
  }, [initialProjectId, loadCuts, selectCut]);

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

  useEffect(() => {
    const projectNavLink = document.querySelector<HTMLElement>('[data-nav-key="projects"]');

    if (!projectNavLink) {
      return undefined;
    }

    projectNavLink.addEventListener("pointerenter", openProjectDrawer);
    projectNavLink.addEventListener("focusin", openProjectDrawer);
    projectNavLink.addEventListener("focusout", scheduleProjectDrawerClose);

    return () => {
      projectNavLink.removeEventListener("pointerenter", openProjectDrawer);
      projectNavLink.removeEventListener("focusin", openProjectDrawer);
      projectNavLink.removeEventListener("focusout", scheduleProjectDrawerClose);
      cancelProjectDrawerClose();
    };
  }, [cancelProjectDrawerClose, openProjectDrawer, scheduleProjectDrawerClose]);

  useEffect(() => {
    if (!projectDrawerOpen) {
      return undefined;
    }

    function isInsideRect(x: number, y: number, rect: DOMRect) {
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    function handlePointerMove(event: PointerEvent) {
      const projectNavLink = document.querySelector<HTMLElement>('[data-nav-key="projects"]');
      const projectDrawer = document.querySelector<HTMLElement>(".project-drawer");

      if (!projectNavLink || !projectDrawer) {
        setProjectDrawerOpen(false);
        return;
      }

      const navRect = projectNavLink.getBoundingClientRect();
      const drawerRect = projectDrawer.getBoundingClientRect();
      const bridgeRect = new DOMRect(
        Math.min(navRect.right, drawerRect.left),
        drawerRect.top,
        Math.abs(drawerRect.left - navRect.right),
        drawerRect.height,
      );
      const x = event.clientX;
      const y = event.clientY;
      const insideProjectLayer =
        isInsideRect(x, y, navRect) ||
        isInsideRect(x, y, drawerRect) ||
        isInsideRect(x, y, bridgeRect);

      if (!insideProjectLayer) {
        setProjectDrawerOpen(false);
      }
    }

    document.addEventListener("pointermove", handlePointerMove);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, [projectDrawerOpen]);

  useEffect(() => {
    const patchTimers = patchTimersRef.current;

    return () => {
      flushAllPendingCutPatches();
      Object.values(patchTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [flushAllPendingCutPatches]);

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
    flushAllPendingCutPatches();
    setSelectedProjectId("");
    selectedProjectIdRef.current = "";
    setProjectDetails(null);
    cutRequestIdRef.current += 1;
    setCuts([]);
    selectCut("");
    setCutLoadState("idle");
  }

  function selectProject(project: Project) {
    flushAllPendingCutPatches();
    projectRequestIdRef.current += 1;
    setSelectedProjectId(project.id);
    selectedProjectIdRef.current = project.id;
    setProjectDetails(project);
    setProjectLoadState("ready");
    setCuts([]);
    selectCut("");
    void loadCuts(project.id);
  }

  function handleProjectSelect(projectId: string) {
    const project = projects.find((item) => item.id === projectId) ?? null;

    if (project) {
      selectProject(project);
    }
  }

  function openProjectCreateModal() {
    setProjectActionError(null);
    setProjectCreateModalOpen(true);
  }

  function closeProjectCreateModal() {
    setProjectCreateModalOpen(false);
    window.requestAnimationFrame(() => newProjectButtonRef.current?.focus());
  }

  function handleNewContentTypeChange(nextContentType: ContentType) {
    const previousDefaultName = defaultProjectNameByContentType[newContentType];
    const previousDefaultCanvas = defaultCanvasPresetByContentType[newContentType];

    setNewContentType(nextContentType);

    if (newProjectName.trim().length === 0 || newProjectName === previousDefaultName) {
      setNewProjectName(defaultProjectNameByContentType[nextContentType]);
    }

    if (newCanvasPreset === previousDefaultCanvas) {
      setNewCanvasPreset(defaultCanvasPresetByContentType[nextContentType]);
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
      setNewProjectName(defaultProjectNameByContentType[newContentType]);
      setProjectLoadState("ready");
      selectProject(createdProject);
      if (projectCreateModalOpen) {
        closeProjectCreateModal();
      }
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

  async function createCut() {
    const projectId = selectedProjectIdRef.current;
    const project = projectsRef.current.find((item) => item.id === projectId) ?? null;

    if (!project) {
      return;
    }

    setSaveState("saving");

    try {
      const response = await fetch(`/api/projects/${projectId}/cuts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: cutTemplatesByContentType[project.contentType],
          scenario: "",
          caption: "",
          dialogue: "",
          imagePrompt: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create cut.");
      }

      const payload = (await response.json()) as CutResponse;

      if (selectedProjectIdRef.current !== projectId) {
        return;
      }

      setCuts((currentCuts) => [...currentCuts, payload.cut]);
      selectCut(payload.cut.id);
      setCutLoadState("ready");
      setSaveState("saved");
      return payload.cut;
    } catch {
      if (selectedProjectIdRef.current === projectId) {
        setSaveState("error");
      }

      return null;
    }
  }

  async function deleteCut(cutId: string) {
    const projectId = selectedProjectIdRef.current;

    if (!projectId) {
      return;
    }

    setSaveState("saving");

    try {
      const response = await fetch(`/api/projects/${projectId}/cuts/${cutId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete cut.");
      }

      if (selectedProjectIdRef.current !== projectId) {
        return;
      }

      setCuts((currentCuts) => {
        const deletedIndex = currentCuts.findIndex((cut) => cut.id === cutId);
        const remainingCuts = currentCuts.filter((cut) => cut.id !== cutId);

        clearPendingCutPatch(cutId);

        if (selectedCutIdRef.current === cutId) {
          const nextSelectedCut = remainingCuts[deletedIndex] ?? remainingCuts[deletedIndex - 1] ?? null;
          selectCut(nextSelectedCut?.id ?? "");
        }

        return remainingCuts;
      });
      setSaveState("saved");
    } catch {
      if (selectedProjectIdRef.current === projectId) {
        setSaveState("error");
      }
    }
  }

  function updateSelectedCut(patch: UpdateCutInput) {
    if (!selectedCut) {
      return;
    }

    setGenerationState("idle");
    setGenerationMessage("");

    const cutId = selectedCut.id;
    const projectId = selectedProjectIdRef.current;

    setCuts((currentCuts) =>
      currentCuts.map((cut) => (cut.id === cutId ? { ...cut, ...patch } : cut)),
    );

    pendingCutPatchesRef.current[cutId] = {
      ...pendingCutPatchesRef.current[cutId],
      ...patch,
    };
    pendingCutProjectIdsRef.current[cutId] = projectId;

    const currentTimer = patchTimersRef.current[cutId];

    if (currentTimer) {
      clearTimeout(currentTimer);
    }

    patchTimersRef.current[cutId] = setTimeout(() => {
      flushPendingCutPatch(cutId);
    }, 350);
  }

  function increaseCutCount() {
    if (!selectedProject || cutLoadState === "loading") {
      return;
    }

    void createCut();
  }

  function decreaseCutCount() {
    const lastCut = cuts.at(-1);

    if (!lastCut) {
      return;
    }

    void deleteCut(lastCut.id);
  }

  function loadGeminiApiKeyForGeneration() {
    const apiKey = loadGeminiApiKeyFromStorage(window.localStorage);

    if (!apiKey) {
      throw new Error(labels.missingApiKey);
    }

    return apiKey;
  }

  function loadGeminiImageModelForGeneration() {
    const model = loadSelectedGeminiImageModelFromStorage(window.localStorage);

    if (!model) {
      throw new Error(labels.missingImageModel);
    }

    return model;
  }

  async function generateImageForCut(cut: Cut, patch: UpdateCutInput = {}) {
    const project = projectsRef.current.find((item) => item.id === cut.projectId) ?? selectedProject;

    if (!project) {
      throw new Error(labels.projectLoadError);
    }

    const apiKey = loadGeminiApiKeyForGeneration();
    const model = loadGeminiImageModelForGeneration();

    let savedCut: Cut | null = null;

    try {
      const assets = limitExpressionReferences(loadImageGenerationAssetsFromStorage(window.localStorage));
      savedCut = await saveEditableCut(cut, patch);

      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
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

      return await saveEditableCut(savedCut, {
        imageDataUrl: payload.imageDataUrl,
        imageStatus: "generated",
      });
    } catch (error) {
      if (savedCut) {
        await saveEditableCut(savedCut, { imageStatus: "failed" }).catch(() => undefined);
      }

      throw error;
    }
  }

  async function generateSelectedCutImage() {
    if (!selectedCut || generationInFlightRef.current) {
      return;
    }

    generationInFlightRef.current = true;
    setGenerationState("generating");
    setGenerationMessage(labels.generationSaving);

    try {
      await generateImageForCut(selectedCut);
      setGenerationState("done");
      setGenerationMessage(labels.generationDone);
    } catch (error) {
      setGenerationState("error");
      setGenerationMessage(getClientImageGenerationErrorMessage(error));
    } finally {
      generationInFlightRef.current = false;
    }
  }

  async function buildCardNewsInOnePass() {
    if (!selectedProject || generationInFlightRef.current) {
      return;
    }

    generationInFlightRef.current = true;

    try {
      loadGeminiApiKeyForGeneration();

      if (selectedProject.contentType !== "card-news") {
        setGenerationState("error");
        setGenerationMessage(labels.onePassCardNewsOnly);
        return;
      }

      if (fullScenario.trim().length === 0) {
        setGenerationState("error");
        setGenerationMessage(labels.onePassScenarioRequired);
        return;
      }

      setGenerationState("generating");
      setGenerationMessage(labels.onePassReady);

      const total = Math.max(cuts.length, 1);
      const segments = splitScenario(fullScenario, total);
      const preparedCuts: Cut[] = [...cuts].sort((a, b) => a.position - b.position);

      while (preparedCuts.length < total) {
        const createdCut = await createCut();

        if (!createdCut) {
          throw new Error(labels.saveCutError);
        }

        preparedCuts.push(createdCut);
      }

      const savedCuts: Cut[] = [];

      for (let index = 0; index < total; index += 1) {
        const segment = segments[index] ?? "";
        const cut = preparedCuts[index];

        if (!cut) {
          throw new Error(labels.saveCutError);
        }

        savedCuts.push(
          await saveEditableCut(cut, {
            scenario: segment,
            caption: `\ucef7 ${index + 1}`,
            dialogue: segment,
            imagePrompt: `\uce74\ub4dc\ub274\uc2a4 \ucef7 ${index + 1}: ${segment}. \uae54\ub054\ud55c \uc5d0\ub514\ud1a0\ub9ac\uc5bc \uce74\ub4dc\ub274\uc2a4 \uc774\ubbf8\uc9c0, \uc77d\uc744 \uc218 \uc788\ub294 \uae00\uc790 \uc5c6\uc74c`,
          }),
        );
      }

      for (let index = 0; index < savedCuts.length; index += 1) {
        setGenerationMessage(`${index + 1}/${total} ${labels.onePassProgressSuffix}`);
        await generateImageForCut(savedCuts[index]);
      }

      setGenerationState("done");
      setGenerationMessage(labels.generationDone);
    } catch (error) {
      setGenerationState("error");
      setGenerationMessage(getClientImageGenerationErrorMessage(error));
    } finally {
      generationInFlightRef.current = false;
    }
  }

  async function flushCutsBeforeExport() {
    await Promise.all(Object.keys(pendingCutPatchesRef.current).map((cutId) => flushPendingCutPatch(cutId)));
  }

  async function downloadCurrentCut() {
    if (!selectedProject || !selectedCut || !exportRootRef.current) {
      return;
    }

    setExportState("exporting");

    try {
      await flushCutsBeforeExport();
      const preferences = loadStudioPreferencesFromStorage(window.localStorage);
      setStudioPreferences(preferences);
      applyExportFontVariables(exportRootRef.current, preferences.fonts);
      const node = exportRootRef.current.querySelector<HTMLElement>(
        `[data-export-cut-id="${selectedCut.id}"]`,
      );

      if (!node) {
        throw new Error(labels.exportCutNotFound);
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: getExportPixelRatio(preferences.export),
        backgroundColor: "#ffffff",
      });

      downloadDataUrl(dataUrl, `${safeFileName(selectedProject.name)}-cut-${selectedCut.position}.png`);
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  async function downloadAllCutsZip() {
    if (!selectedProject || !exportRootRef.current) {
      return;
    }

    setExportState("exporting");

    try {
      await flushCutsBeforeExport();
      const preferences = loadStudioPreferencesFromStorage(window.localStorage);
      setStudioPreferences(preferences);
      applyExportFontVariables(exportRootRef.current, preferences.fonts);
      const zip = new JSZip();
      let pngCount = 0;

      if (sortedCuts.length === 0) {
        throw new Error(labels.exportNoCuts);
      }

      for (const cut of sortedCuts) {
        const node = exportRootRef.current.querySelector<HTMLElement>(
          `[data-export-cut-id="${cut.id}"]`,
        );

        if (!node) {
          throw new Error(labels.exportCutNotFound);
        }

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: getExportPixelRatio(preferences.export),
          backgroundColor: "#ffffff",
        });

        zip.file(`cut-${String(cut.position).padStart(2, "0")}.png`, dataUrlToBlob(dataUrl));
        pngCount += 1;

        if (preferences.export.saveOriginalHtml) {
          zip.file(
            `cut-${String(cut.position).padStart(2, "0")}.html`,
            createCutHtmlDocument(node, selectedProject, cut),
          );
        }
      }

      if (pngCount === 0) {
        throw new Error(labels.exportNoCuts);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${safeFileName(selectedProject.name)}-cuts.zip`);
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  const showEmptyProjectLanding = projectLoadState === "ready" && projects.length === 0;

  return (
    <>
      <section
        className={showEmptyProjectLanding ? "studio-workbench-shell empty-project-shell" : "studio-workbench-shell"}
        aria-label={labels.workbenchAria}
      >
        <ProjectDrawer
          deletingProjectId={deletingProjectId}
          error={projectActionError}
          open={projectDrawerOpen}
          onDeleteProject={deleteProject}
          onKeepOpen={openProjectDrawer}
          onNewProject={openProjectCreateModal}
          onProjectSelect={handleProjectSelect}
          projectLoadState={projectLoadState}
          projects={projects}
          newProjectButtonRef={newProjectButtonRef}
          selectedProjectId={selectedProjectId}
        />

        <div className={showEmptyProjectLanding ? "studio-workbench-main empty-project-main" : "studio-workbench-main"}>
          {showEmptyProjectLanding ? (
            <EmptyProjectLanding
              canvasPreset={newCanvasPreset}
              contentType={newContentType}
              creatingProject={creatingProject}
              error={projectActionError}
              name={newProjectName}
              onCanvasPresetChange={setNewCanvasPreset}
              onContentTypeChange={handleNewContentTypeChange}
              onCreateProject={createProject}
              onNameChange={setNewProjectName}
            />
          ) : (
            <>
              <header className="studio-workbench-head">
                <div>
                  <p className="eyebrow">{labels.workbench}</p>
                  <h2>{projectName || labels.selectProject}</h2>
                  {selectedProject ? (
                    <span className="project-context-chips">
                      <StudioChip>{contentTypeLabels[contentType]}</StudioChip>
                      <StudioChip>{canvasPresetLabels[canvasPreset]}</StudioChip>
                      <StudioChip>{getSaveLabel(saveState)}</StudioChip>
                    </span>
                  ) : (
                    <p>{labels.selectProjectHelp}</p>
                  )}
                </div>
                {selectedProject ? (
                  <button
                    aria-label={`${selectedProject.name} ${labels.deleteProject}`}
                    className="studio-workbench-delete"
                    disabled={deletingProjectId === selectedProject.id}
                    onClick={() => deleteProject(selectedProject)}
                    type="button"
                  >
                    <TrashIcon />
                  </button>
                ) : null}
              </header>

              <div className="studio-workbench-grid">
                <CutList
                  cutLoadState={cutLoadState}
                  cuts={cuts}
                  canIncreaseCutCount={Boolean(selectedProject) && cutLoadState !== "loading"}
                  onDecreaseCutCount={decreaseCutCount}
                  onIncreaseCutCount={increaseCutCount}
                  onSelectCut={selectCut}
                  selectedCutId={selectedCut?.id ?? ""}
                />

                <ProductionPanel
                  cutLoadState={cutLoadState}
                  exportSettings={studioPreferences.export}
                  exportState={exportState}
                  fullScenario={fullScenario}
                  generationState={generationState}
                  generationMessage={generationMessage}
                  imageGenerationAssets={imageGenerationAssets}
                  onBuildCardNewsInOnePass={buildCardNewsInOnePass}
                  onFlushSelectedCut={() => {
                    if (selectedCut) {
                      flushPendingCutPatch(selectedCut.id);
                    }
                  }}
                  onGenerateSelectedCutImage={generateSelectedCutImage}
                  onFullScenarioChange={setFullScenario}
                  onUpdateSelectedCut={updateSelectedCut}
                  saveState={saveState}
                  selectedCut={selectedCut}
                  selectedProject={selectedProject}
                />

                <ImagePreviewPanel
                  canvasPreset={canvasPreset}
                  cut={selectedCut}
                  exportState={exportState}
                  fonts={studioPreferences.fonts}
                  canDownloadAllCutsZip={sortedCuts.length > 0}
                  onDownloadAllCutsZip={downloadAllCutsZip}
                  onDownloadCurrentCut={downloadCurrentCut}
                  project={selectedProject}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {projectCreateModalOpen ? (
        <ProjectCreateModal
          canvasPreset={newCanvasPreset}
          contentType={newContentType}
          creatingProject={creatingProject}
          error={projectActionError}
          name={newProjectName}
          onCanvasPresetChange={setNewCanvasPreset}
          onClose={() => {
            if (!creatingProject) {
              closeProjectCreateModal();
            }
          }}
          onContentTypeChange={handleNewContentTypeChange}
          onCreateProject={createProject}
          onNameChange={setNewProjectName}
        />
      ) : null}

      {selectedProject ? (
        <div className="export-stack" ref={exportRootRef} aria-hidden>
          {sortedCuts.map((cut) => (
            <CutExportCanvas
              cut={cut}
              exportId={cut.id}
              fonts={studioPreferences.fonts}
              key={cut.id}
              project={selectedProject}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

type StudioChipProps = {
  children: ReactNode;
};

function StudioChip({ children }: StudioChipProps) {
  return <span className="ui-chip">{children}</span>;
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M10 11v6m4-6v6m5-11v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

type ProjectDrawerProps = {
  deletingProjectId: string;
  error: string | null;
  newProjectButtonRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onDeleteProject: (project: Project) => void;
  onKeepOpen: () => void;
  onNewProject: () => void;
  onProjectSelect: (projectId: string) => void;
  projectLoadState: LoadState;
  projects: Project[];
  selectedProjectId: string;
};

function ProjectDrawer({
  deletingProjectId,
  error,
  newProjectButtonRef,
  open,
  onDeleteProject,
  onKeepOpen,
  onNewProject,
  onProjectSelect,
  projectLoadState,
  projects,
  selectedProjectId,
}: ProjectDrawerProps) {
  return (
    <aside
      className="split-menu workspace-menu project-drawer"
      aria-label={labels.projectListTitle}
      data-open={open}
      onFocus={onKeepOpen}
      onPointerEnter={onKeepOpen}
    >
      <div className="project-drawer-head">
        <p className="eyebrow">{labels.projectListTitle}</p>
        <button
          className="project-create-button"
          onClick={onNewProject}
          ref={newProjectButtonRef}
          type="button"
        >
          {labels.newProject}
        </button>
      </div>

      <p className="sr-only">{getProjectLoadMessage(projectLoadState, projects.length)}</p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="split-menu-list project-drawer-list">
        {projects.map((project) => {
          const active = project.id === selectedProjectId;

          return (
            <div className="project-drawer-row" data-active={active} key={project.id}>
              <button
                aria-current={active ? "page" : undefined}
                className="split-menu-item project-menu-item"
                onClick={() => onProjectSelect(project.id)}
                type="button"
              >
                <span>{project.name}</span>
                <small>{formatProjectCreatedAt(project.createdAt)}</small>
                <span className="project-drawer-meta">
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
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

type EmptyProjectLandingProps = {
  canvasPreset: CanvasPreset;
  contentType: ContentType;
  creatingProject: boolean;
  error: string | null;
  name: string;
  onCanvasPresetChange: (canvasPreset: CanvasPreset) => void;
  onContentTypeChange: (contentType: ContentType) => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
  onNameChange: (name: string) => void;
};

function EmptyProjectLanding({
  canvasPreset,
  contentType,
  creatingProject,
  error,
  name,
  onCanvasPresetChange,
  onContentTypeChange,
  onCreateProject,
  onNameChange,
}: EmptyProjectLandingProps) {
  return (
    <section className="empty-project-landing" aria-labelledby="empty-project-title">
      <div className="empty-project-hero">
        <div className="empty-project-chip-row" aria-label={`${labels.emptyHeroCardNews}, ${labels.emptyHeroComic}`}>
          <StudioChip>{labels.emptyHeroCardNews}</StudioChip>
          <StudioChip>{labels.emptyHeroComic}</StudioChip>
        </div>
        <h1 className="empty-project-title" id="empty-project-title">
          <span>{labels.emptyHeroTitlePrefix}</span>
          <span>
            <em>{labels.emptyHeroTitleAccent}</em>
            {labels.emptyHeroTitleSuffix}
          </span>
        </h1>
        <p className="empty-project-copy">{labels.emptyHeroCopy}</p>
      </div>

      <form className="empty-project-builder" onSubmit={onCreateProject}>
        <div className="empty-project-builder-head">
          <h2>{labels.emptyBuilderTitle}</h2>
          <p>{labels.emptyBuilderCopy}</p>
        </div>

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
            <SelectContent className="project-modal-select-content">
              <SelectItem value="card-news">{labels.cardNews}</SelectItem>
              <SelectItem value="comic">{labels.comic}</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="field-stack">
          {labels.canvas}
          <Select value={canvasPreset} onValueChange={(value) => onCanvasPresetChange(value as CanvasPreset)}>
            <SelectTrigger aria-label={labels.canvas}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="project-modal-select-content">
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="4:5">4:5</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="empty-project-submit" disabled={creatingProject || name.trim().length === 0} type="submit">
          {creatingProject ? labels.creating : labels.emptyCreateProject}
        </button>
      </form>
    </section>
  );
}

type ProjectCreateModalProps = {
  canvasPreset: CanvasPreset;
  contentType: ContentType;
  creatingProject: boolean;
  error: string | null;
  name: string;
  onCanvasPresetChange: (canvasPreset: CanvasPreset) => void;
  onClose: () => void;
  onContentTypeChange: (contentType: ContentType) => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
  onNameChange: (name: string) => void;
};

function ProjectCreateModal({
  canvasPreset,
  contentType,
  creatingProject,
  error,
  name,
  onCanvasPresetChange,
  onClose,
  onContentTypeChange,
  onCreateProject,
  onNameChange,
}: ProjectCreateModalProps) {
  const modalRef = useRef<HTMLFormElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  function handleModalKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      modalRef.current?.querySelectorAll<HTMLElement>(
        [
          "button:not([disabled])",
          "input:not([disabled])",
          "textarea:not([disabled])",
          '[data-slot="select-trigger"]:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(", "),
      ) ?? [],
    ).filter((element) => element.offsetParent !== null);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="project-modal-overlay" role="presentation">
      <form
        aria-modal="true"
        aria-labelledby="project-create-modal-title"
        className="project-create-modal"
        onKeyDown={handleModalKeyDown}
        onSubmit={onCreateProject}
        ref={modalRef}
        role="dialog"
      >
        <div className="project-modal-head">
          <div>
            <p className="eyebrow">{labels.projectsTitle}</p>
            <h2 id="project-create-modal-title">{labels.create}</h2>
          </div>
        </div>

        <label className="field-stack">
          {labels.projectName}
          <Input
            aria-label={labels.projectName}
            autoFocus
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={labels.projectNamePlaceholder}
            ref={nameInputRef}
            value={name}
          />
        </label>

        <label className="field-stack">
          {labels.contentType}
          <Select value={contentType} onValueChange={(value) => onContentTypeChange(value as ContentType)}>
            <SelectTrigger aria-label={labels.contentType}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="project-modal-select-content">
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
            <SelectContent className="project-modal-select-content">
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="4:5">4:5</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="project-modal-actions">
          <Button disabled={creatingProject} onClick={onClose} type="button" variant="secondary">
            {labels.cancel}
          </Button>
          <Button disabled={creatingProject || name.trim().length === 0} type="submit">
            {creatingProject ? labels.creating : labels.create}
          </Button>
        </div>
      </form>
    </div>
  );
}

type ProductionPanelProps = {
  cutLoadState: LoadState;
  exportSettings: StudioExportSettings;
  exportState: ExportState;
  fullScenario: string;
  generationMessage: string;
  generationState: GenerationState;
  imageGenerationAssets: ImageGenerationAssets;
  onBuildCardNewsInOnePass: () => void;
  onFlushSelectedCut: () => void;
  onFullScenarioChange: (value: string) => void;
  onGenerateSelectedCutImage: () => void;
  onUpdateSelectedCut: (patch: UpdateCutInput) => void;
  saveState: SaveState;
  selectedCut: Cut | null;
  selectedProject: Project | null;
};

function ProductionPanel({
  cutLoadState,
  exportSettings,
  exportState,
  fullScenario,
  generationMessage,
  generationState,
  imageGenerationAssets,
  onBuildCardNewsInOnePass,
  onFlushSelectedCut,
  onFullScenarioChange,
  onGenerateSelectedCutImage,
  onUpdateSelectedCut,
  saveState,
  selectedCut,
  selectedProject,
}: ProductionPanelProps) {
  const isCardNews = selectedProject?.contentType === "card-news";

  return (
    <div className="split-content production-panel">
      {isCardNews ? (
        <section className="full-scenario-panel" aria-label={labels.fullScenario}>
          <label className="field-stack">
            {labels.fullScenario}
            <textarea
              onChange={(event) => onFullScenarioChange(event.target.value)}
              placeholder={labels.fullScenarioPlaceholder}
              rows={5}
              value={fullScenario}
            />
          </label>
          <button
            className="production-text-button"
            disabled={generationState === "generating" || cutLoadState === "loading"}
            onClick={onBuildCardNewsInOnePass}
            type="button"
          >
            {labels.produceAll}
          </button>
        </section>
      ) : null}

      <section aria-label={labels.selectedProjectArea}>
        <CutEditor
          generationState={generationState}
          onGenerateSelectedCutImage={onGenerateSelectedCutImage}
          onFlushSelectedCut={onFlushSelectedCut}
          onUpdateSelectedCut={onUpdateSelectedCut}
          selectedCut={selectedCut}
        />
      </section>

      <p className={`save-state save-state-${getStatusMessageClass(saveState, generationState)}`}>
        {labels.generation}: {getGenerationLabel(generationState)} - {labels.export}:{" "}
        {getExportLabel(exportState)}
      </p>
      {generationMessage ? (
        <p className={`generation-message save-state-${getStatusMessageClass(saveState, generationState)}`}>
          {generationMessage}
        </p>
      ) : null}
      <p className="sr-only">
        {labels.assetSummary} {imageGenerationAssets.characters.length}
        {labels.assetCountSuffix}, {labels.exportScale} {exportSettings.exportScale}
      </p>
    </div>
  );
}

type CutListProps = {
  canIncreaseCutCount: boolean;
  cutLoadState: LoadState;
  cuts: Cut[];
  onDecreaseCutCount: () => void;
  onIncreaseCutCount: () => void;
  onSelectCut: (cutId: string) => void;
  selectedCutId: string;
};

function CutList({
  canIncreaseCutCount,
  cutLoadState,
  cuts,
  onDecreaseCutCount,
  onIncreaseCutCount,
  onSelectCut,
  selectedCutId,
}: CutListProps) {
  return (
    <aside className="split-menu workspace-menu production-cut-list" aria-label={labels.cutList}>
      <div className="storyboard-info">
        <div className="cut-count-stepper">
          <span>{labels.cutCount}</span>
          <div>
            <button
              aria-label={labels.decreaseCutCount}
              disabled={cuts.length === 0}
              onClick={onDecreaseCutCount}
              type="button"
            >
              -
            </button>
            <strong>{cuts.length}</strong>
            <button
              aria-label={labels.increaseCutCount}
              disabled={!canIncreaseCutCount}
              onClick={onIncreaseCutCount}
              type="button"
            >
              +
            </button>
          </div>
        </div>
        <p className="sr-only">{getCutLoadMessage(cutLoadState)}</p>
      </div>

      <div className="split-menu-list cut-list">
        {cuts.map((cut) => {
          const active = cut.id === selectedCutId;

          return (
            <button
              aria-current={active ? "page" : undefined}
              className="split-menu-item workspace-cut-item"
              data-active={active}
              key={cut.id}
              onClick={() => onSelectCut(cut.id)}
              type="button"
            >
              <strong>
                #{cut.position} {getCutTitle(cut)}
              </strong>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

type CutEditorProps = {
  generationState: GenerationState;
  onGenerateSelectedCutImage: () => void;
  onFlushSelectedCut: () => void;
  onUpdateSelectedCut: (patch: UpdateCutInput) => void;
  selectedCut: Cut | null;
};

function CutEditor({
  generationState,
  onGenerateSelectedCutImage,
  onFlushSelectedCut,
  onUpdateSelectedCut,
  selectedCut,
}: CutEditorProps) {
  if (!selectedCut) {
    return (
      <div className="editor-panel production-editor">
        <p className="empty-state">{labels.noSelectedCut}</p>
      </div>
    );
  }

  return (
    <div className="editor-panel production-editor">
      <div className="panel-heading inline-heading">
        <div>
          <h2>{selectedCut.caption || labels.selectedCut}</h2>
        </div>
      </div>

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

      <label className="field-stack">
        {labels.caption}
        <textarea
          onBlur={onFlushSelectedCut}
          onChange={(event) => onUpdateSelectedCut({ caption: event.target.value })}
          placeholder={labels.captionPlaceholder}
          rows={3}
          value={selectedCut.caption}
        />
      </label>

      <label className="field-stack">
        {labels.dialogue}
        <textarea
          onBlur={onFlushSelectedCut}
          onChange={(event) => onUpdateSelectedCut({ dialogue: event.target.value })}
          placeholder={labels.dialoguePlaceholder}
          rows={4}
          value={selectedCut.dialogue}
        />
      </label>

      <label className="field-stack">
        {labels.imagePrompt}
        <textarea
          onBlur={onFlushSelectedCut}
          onChange={(event) => onUpdateSelectedCut({ imagePrompt: event.target.value })}
          placeholder={labels.imagePromptPlaceholder}
          rows={5}
          value={selectedCut.imagePrompt}
        />
      </label>

      <div className="editor-action-row">
        <Button
          disabled={generationState === "generating"}
          onClick={onGenerateSelectedCutImage}
          type="button"
        >
          {labels.generateImage}
        </Button>
      </div>
    </div>
  );
}

type ImagePreviewPanelProps = {
  canDownloadAllCutsZip: boolean;
  canvasPreset: CanvasPreset;
  cut: Cut | null;
  exportState: ExportState;
  fonts: StudioFonts;
  onDownloadAllCutsZip: () => void;
  onDownloadCurrentCut: () => void;
  project: Project | null;
};

function ImagePreviewPanel({
  canDownloadAllCutsZip,
  canvasPreset,
  cut,
  exportState,
  fonts,
  onDownloadAllCutsZip,
  onDownloadCurrentCut,
  project,
}: ImagePreviewPanelProps) {
  return (
    <aside className="image-preview-panel" aria-label={labels.imageOnlyPreview}>
      <div className="preview-toolbar">
        <div>
          <h2>{labels.imageOnlyPreviewTitle}</h2>
        </div>
      </div>

      {project && cut ? (
        <CutExportCanvas cut={cut} exportId={`preview-${cut.id}`} fonts={fonts} project={project} />
      ) : (
        <div
          aria-label={labels.imagePreviewPlaceholder}
          className={`image-preview-canvas ${getCanvasRatioClass(canvasPreset)}`}
          role="img"
        >
          <div className="image-preview-placeholder" aria-hidden="true" />
        </div>
      )}

      <div className="toolbar-row export-actions">
        <Button
          disabled={!project || !cut || exportState === "exporting"}
          onClick={onDownloadCurrentCut}
          type="button"
          variant="secondary"
        >
          {labels.currentCutPng}
        </Button>
        <Button
          disabled={!project || !canDownloadAllCutsZip || exportState === "exporting"}
          onClick={onDownloadAllCutsZip}
          type="button"
          variant="secondary"
        >
          {labels.allCutsZip}
        </Button>
      </div>

      <p className={`save-state save-state-${exportState}`}>
        {exportState === "exporting" ? labels.exporting : null}
        {exportState === "done" ? labels.exportDone : null}
        {exportState === "error" ? labels.exportFailed : null}
      </p>
    </aside>
  );
}

function CutExportCanvas({
  cut,
  exportId,
  fonts,
  project,
}: {
  cut: Cut;
  exportId: string;
  fonts: StudioFonts;
  project: Project;
}) {
  const templateClass = cut.template === "card-news" ? "card-news" : "comic";
  const cssImageUrl = toCssImageUrl(cut.imageDataUrl);
  const hasImage = cssImageUrl !== "none";
  const overlay = getCutTextOverlay(cut);

  return (
    <article
      className={`cut-canvas ${getCanvasRatioClass(project.canvasPreset)} ${templateClass}`}
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
            <span>{labels.imagePreviewPlaceholder}</span>
          </div>
        ) : null}
      </div>
      <div className="cut-overlay-layer" aria-hidden={!overlay.hasCaption}>
        {overlay.hasCaption ? <p className="comic-caption">{overlay.caption}</p> : null}
      </div>
    </article>
  );
}

function getCanvasRatioClass(canvasPreset: CanvasPreset) {
  if (canvasPreset === "9:16") {
    return "canvas-9-16";
  }

  if (canvasPreset === "4:5") {
    return "canvas-4-5";
  }

  return "canvas-1-1";
}

function getCutTitle(cut: Cut) {
  return cut.caption || cut.scenario || cut.dialogue || labels.noContent;
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

  return labels.waiting;
}

function formatProjectCreatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

function splitScenario(text: string, count: number) {
  const trimmed = text.trim();

  if (count <= 0) {
    return [];
  }

  if (!trimmed) {
    return Array.from({ length: count }, () => "");
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const sourceSegments =
    paragraphs.length >= count
      ? paragraphs
      : trimmed
          .split(/(?<=[.!?\u3002\uff01\uff1f])\s+|\n+/)
          .map((item) => item.trim())
          .filter(Boolean);

  if (sourceSegments.length >= count) {
    const segments = sourceSegments.slice(0, count);
    const overflow = sourceSegments.slice(count).join(" ");

    if (overflow) {
      segments[count - 1] = `${segments[count - 1]} ${overflow}`.trim();
    }

    return segments;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);

  if (words.length >= count) {
    const size = Math.ceil(words.length / count);
    return Array.from({ length: count }, (_, index) =>
      words.slice(index * size, (index + 1) * size).join(" ").trim(),
    );
  }

  return Array.from({ length: count }, (_, index) => sourceSegments[index] ?? trimmed);
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
    return labels.apiKeyError;
  }

  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(detail)) {
    return labels.quotaError;
  }

  if (status === 400) {
    return labels.badRequestError;
  }

  if (payload?.status === "NETWORK_ERROR" || /network/i.test(detail)) {
    return labels.networkError;
  }

  if (status >= 500) {
    return labels.serviceError;
  }

  return labels.generationFailed;
}

function getClientImageGenerationErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return labels.generationFailed;
  }

  const message = error.message.trim();
  const knownKoreanMessages = new Set([
    labels.missingApiKey,
    labels.missingImageModel,
    labels.projectLoadError,
    labels.saveCutError,
    labels.apiKeyError,
    labels.quotaError,
    labels.badRequestError,
    labels.serviceError,
    labels.generationFailed,
  ]);

  if (knownKoreanMessages.has(message)) {
    return message;
  }

  return labels.networkError;
}

function getStatusMessageClass(saveState: SaveState, generationStatus: GenerationState) {
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

function applyExportFontVariables(root: HTMLElement | null, fonts: StudioFonts) {
  root?.querySelectorAll<HTMLElement>(".cut-canvas").forEach((node) => {
    node.style.setProperty("--cut-caption-font", fonts.subtitle);
    node.style.setProperty("--cut-dialogue-font", fonts.dialogue);
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
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
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
