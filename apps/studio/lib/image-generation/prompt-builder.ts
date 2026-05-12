import type {
  BuildImagePromptInput,
  ImageGenerationAssets,
  ImageGenerationCharacter,
} from "@/lib/image-generation/types";
import { resolveCaptionStyle, type CaptionPosition } from "@/lib/cuts/caption-style";

export const GENERATED_IMAGE_TEXT_BAN =
  "No readable text other than the provided dialogue; no captions, subtitles, labels, signs, UI text, watermarks, logos, or random Korean lettering inside the generated image.";

export function buildImageGenerationPrompt({ assets, cut, project }: BuildImagePromptInput) {
  const character = getSelectedCharacter(assets);
  const canvasDescription = getCanvasDescription(project.canvasPreset);
  const captionStyle = resolveCaptionStyle(cut.captionStyleOverride);
  const captionPlacement = getCaptionPlacementDescription(captionStyle.position);
  const expressionNames = character.expressions.map((expression) => expression.name).filter(Boolean);
  const dialogueInstruction =
    cut.dialogue.trim().length > 0
      ? `Dialogue to render inside the generated image speech bubble: ${cut.dialogue}`
      : "Dialogue: No dialogue provided. Do not draw a speech bubble.";

  return [
    "Create the generated art layer for a local Instagram comic/card-news cut.",
    GENERATED_IMAGE_TEXT_BAN,
    "The final cut keeps the caption as an editable caption overlay, so never draw the caption text.",
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
    `Caption overlay context only, never draw this text: ${cut.caption || "No caption provided."}`,
    `Editable caption overlay placement: ${captionPlacement}; alignment: ${captionStyle.align}; font size: ${captionStyle.fontSize}px.`,
    dialogueInstruction,
    "",
    "Visual direction:",
    cut.imagePrompt || "Clean editorial webtoon composition, consistent character, no random text.",
    "",
    "Quality guardrails:",
    "Avoid text artifacts, distorted hands, extra limbs, low quality, blurry details.",
    "",
    "Composition requirements:",
    "- Keep the selected character visually consistent with the markdown and expression references.",
    "- Use the background prompt as the default environment unless the cut prompt clearly overrides it.",
    "- Use the caption only to understand emotion, action, and layout needs.",
    `- Leave a clean, low-detail area for the app's editable caption overlay near the ${captionPlacement}.`,
    "- Draw the dialogue as a speech bubble only when dialogue is provided.",
    "- If no dialogue is provided, do not draw a speech bubble.",
    "- The app will add the editable caption box.",
    "- Do not draw comic frames, panel borders, color gradient bars, subtitles, caption boxes, or UI text.",
    "- Do not draw title cards, labels, signs, watermarks, logos, or random text.",
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

function getCaptionPlacementDescription(position: CaptionPosition) {
  if (position === "top") {
    return "top area";
  }

  if (position === "middle") {
    return "middle area";
  }

  return "lower area";
}
