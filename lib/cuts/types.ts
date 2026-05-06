export type CutTemplate = "comic" | "card-news";

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
};

export type UpdateCutInput = Partial<
  Pick<Cut, "template" | "scenario" | "caption" | "dialogue" | "imagePrompt" | "negativePrompt">
>;
