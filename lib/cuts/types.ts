export type CutTemplate = "comic" | "card-news";
export type CutImageStatus = "empty" | "mock" | "uploaded" | "generated" | "failed";

export type Cut = {
  id: string;
  projectId: string;
  position: number;
  template: CutTemplate;
  scenario: string;
  caption: string;
  dialogue: string;
  imagePrompt: string;
  negativePrompt: string;
  imageDataUrl: string;
  imageStatus: CutImageStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateCutInput = {
  projectId: string;
  template: CutTemplate;
  scenario?: string;
  caption?: string;
  dialogue?: string;
  imagePrompt?: string;
  negativePrompt?: string;
  imageDataUrl?: string;
  imageStatus?: CutImageStatus;
};

export type UpdateCutInput = Partial<
  Pick<
    Cut,
    | "template"
    | "scenario"
    | "caption"
    | "dialogue"
    | "imagePrompt"
    | "negativePrompt"
    | "imageDataUrl"
    | "imageStatus"
  >
>;
