export type ContentType = "comic" | "card-news";

export type CanvasPreset = "1:1" | "4:5" | "9:16";

export type Project = {
  id: string;
  name: string;
  contentType: ContentType;
  canvasPreset: CanvasPreset;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  contentType: ContentType;
  canvasPreset: CanvasPreset;
};
