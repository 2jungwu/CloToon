import type {
  BuildImagePromptInput,
  ImageGenerationAssets,
  ImageGenerationCharacter,
} from "@/lib/image-generation/types";
import { defaultGeminiImageModel } from "@/lib/image-generation/models";

export const GEMINI_IMAGE_MODEL = defaultGeminiImageModel;

export const GENERATED_IMAGE_TEXT_BAN =
  "No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue inside the generated image.";

export function buildImageGenerationPrompt({ assets, cut, project }: BuildImagePromptInput) {
  const character = getSelectedCharacter(assets);
  const canvasDescription = getCanvasDescription(project.canvasPreset);
  const expressionNames = character.expressions.map((expression) => expression.name).filter(Boolean);

  return [
    "Create the image layer for a local Instagram comic/card-news cut.",
    GENERATED_IMAGE_TEXT_BAN,
    "The final Korean caption and dialogue will be rendered later as HTML/CSS overlays, so the image must remain clean.",
    "",
    `Project: ${project.name}`,
    `Content type: ${project.contentType}`,
    `Canvas: ${canvasDescription}`,
    `Cut position: ${cut.position}`,
    "",
    "Character reference:",
    `Name: ${character.name}`,
    character.markdown.trim() || "No character markdown was provided.",
    expressionNames.length > 0
      ? `Expression reference images provided: ${expressionNames.join(", ")}`
      : "No expression reference images were provided.",
    "",
    "Background reference:",
    `Name: ${assets.background.name}`,
    `Prompt: ${assets.background.prompt}`,
    `Base color: ${assets.background.color}`,
    "",
    "Cut context:",
    `Scenario: ${cut.scenario || "No scenario provided."}`,
    `Caption context only, do not render as text: ${cut.caption || "No caption provided."}`,
    `Dialogue context only, do not render as text: ${cut.dialogue || "No dialogue provided."}`,
    "",
    "Visual direction:",
    cut.imagePrompt || "Clean editorial webtoon composition, consistent character, no text.",
    "",
    "Quality guardrails:",
    "Avoid text artifacts, distorted hands, extra limbs, low quality, blurry details.",
    "",
    "Composition requirements:",
    "- Keep the selected character visually consistent with the markdown and expression references.",
    "- Use the background prompt as the default environment unless the cut prompt clearly overrides it.",
    "- Leave comfortable empty areas for later caption/dialogue overlays.",
    "- Do not draw speech bubbles, title cards, subtitles, labels, signs, watermarks, logos, or UI.",
  ].join("\n");
}

export function getSelectedCharacter(assets: ImageGenerationAssets): ImageGenerationCharacter {
  return (
    assets.characters.find((character) => character.id === assets.selectedCharacterId) ??
    assets.characters[0] ?? {
      id: "character-default",
      name: "clo",
      markdown: "# clo\n\n- consistent local studio character",
      expressions: [],
    }
  );
}

function getCanvasDescription(canvasPreset: string) {
  if (canvasPreset === "4:5") {
    return "4:5 vertical feed canvas";
  }

  if (canvasPreset === "9:16") {
    return "9:16 story/reels canvas";
  }

  return "1:1 square canvas";
}
