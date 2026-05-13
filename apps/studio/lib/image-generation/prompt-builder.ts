import type {
  BuildImagePromptInput,
  ImageGenerationAssets,
  ImageGenerationCharacter,
} from "@/lib/image-generation/types";

export const GENERATED_IMAGE_TEXT_POLICY =
  "Render only the user-provided dialogue inside the image when it belongs in the scene; do not invent extra readable text, captions, watermarks, logos, UI, signs, labels, or subtitles.";

export function buildImageGenerationPrompt({ assets, cut, project }: BuildImagePromptInput) {
  const character = getSelectedCharacter(assets);
  const canvasDescription = getCanvasDescription(project.canvasPreset);
  const expressionNames = character.expressions.map((expression) => expression.name).filter(Boolean);

  return [
    "Create the generated art layer for a local Instagram comic/card-news cut.",
    GENERATED_IMAGE_TEXT_POLICY,
    "The Korean caption is a separate HTML/CSS overlay and must not be drawn into the generated image.",
    "The Korean dialogue may be rendered inside the image as a speech bubble or natural dialogue element, using the user text exactly as provided.",
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
    `Caption overlay only, do not render in image: ${cut.caption || "No caption provided."}`,
    `Dialogue to render in image if present: ${cut.dialogue || "No dialogue provided."}`,
    "",
    "Visual direction:",
    cut.imagePrompt || "Clean editorial webtoon composition with a consistent character, no random text.",
    "",
    "Quality guardrails:",
    "Avoid text artifacts, distorted hands, extra limbs, low quality, blurry details.",
    "",
    "Composition requirements:",
    "- Keep the selected character visually consistent with the markdown and expression references.",
    "- Use the background prompt as the default environment unless the cut prompt clearly overrides it.",
    "- Use the caption only to understand emotion, action, and layout needs.",
    "- Leave comfortable lower-frame space for the later editable HTML/CSS caption overlay.",
    "- Draw the dialogue as a speech bubble or natural dialogue element only when dialogue is provided.",
    "- If no dialogue is provided, do not draw a speech bubble.",
    "- Do not draw title cards, subtitles, labels, signs, watermarks, logos, UI, or any text not explicitly provided by the user.",
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
