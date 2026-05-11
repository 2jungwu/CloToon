import type {
  BuildImagePromptInput,
  ImageGenerationAssets,
  ImageGenerationCharacter,
} from "@/lib/image-generation/types";

export const GENERATED_IMAGE_TEXT_BAN =
  "No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue inside the generated image.";

export function buildImageGenerationPrompt({ assets, cut, project }: BuildImagePromptInput) {
  const character = getSelectedCharacter(assets);
  const canvasDescription = getCanvasDescription(project.canvasPreset);
  const expressionNames = character.expressions.map((expression) => expression.name).filter(Boolean);

  return [
    "Create only the generated art layer for a local Instagram comic/card-news cut.",
    GENERATED_IMAGE_TEXT_BAN,
    "The final cut will be composed later with editable HTML/CSS text overlays, so keep the art layer clean and text-free.",
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
    `Dialogue overlay context only, never draw this text: ${cut.dialogue || "No dialogue provided."}`,
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
    "- Use caption and dialogue only to understand emotion, action, and layout needs.",
    "- Leave comfortable empty areas for later caption/dialogue HTML/CSS overlays.",
    "- The app will add the black frame, dialogue bubble, and bottom caption box.",
    "- Do not draw comic frames, panel borders, color gradient bars, speech bubbles, caption boxes, or text containers.",
    "- Do not draw title cards, subtitles, labels, signs, watermarks, logos, or UI.",
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
