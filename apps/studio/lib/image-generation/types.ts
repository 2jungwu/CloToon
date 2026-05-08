import type { CutTemplate } from "@/lib/cuts/types";
import type { CanvasPreset, ContentType } from "@/lib/projects/types";

export type ImageGenerationExpression = {
  id: string;
  name: string;
  dataUrl: string;
};

export type ImageGenerationCharacter = {
  id: string;
  name: string;
  markdown: string;
  expressions: ImageGenerationExpression[];
};

export type ImageGenerationAssets = {
  selectedCharacterId: string;
  characters: ImageGenerationCharacter[];
  background: {
    name: string;
    prompt: string;
    color: string;
  };
};

export type ImageGenerationProject = {
  id: string;
  name: string;
  contentType: ContentType;
  canvasPreset: CanvasPreset;
};

export type ImageGenerationCut = {
  id: string;
  position: number;
  template: CutTemplate;
  scenario: string;
  caption: string;
  dialogue: string;
  imagePrompt: string;
  negativePrompt: string;
};

export type BuildImagePromptInput = {
  assets: ImageGenerationAssets;
  cut: ImageGenerationCut;
  project: ImageGenerationProject;
};
