import assert from "node:assert/strict";
import test from "node:test";

import { buildImageGenerationPrompt, GENERATED_IMAGE_TEXT_BAN } from "./prompt-builder.ts";
import type {
  ImageGenerationAssets,
  ImageGenerationCut,
  ImageGenerationProject,
} from "./types";

const project: ImageGenerationProject = {
  id: "project-1",
  name: "Launch Comic",
  contentType: "comic",
  canvasPreset: "1:1",
};

const cut: ImageGenerationCut = {
  id: "cut-1",
  position: 2,
  template: "comic",
  scenario: "The character walks into a small room and notices a glowing laptop.",
  caption: "Unexpected message",
  captionStyleOverride: {
    align: "left",
    fontSize: 72,
    position: "top",
  },
  dialogue: "What is this?",
  imagePrompt: "soft editorial webtoon composition, curious expression",
};

const assets: ImageGenerationAssets = {
  selectedCharacterId: "character-1",
  characters: [
    {
      id: "character-1",
      name: "clo",
      markdown: "# clo\n\n- round silhouette\n- bright eyes",
      expressions: [{ id: "expression-1", name: "smile.png", dataUrl: "data:image/png;base64,AAAA" }],
    },
  ],
  background: {
    name: "sunny studio",
    prompt: "clean sunny studio with a white desk",
    color: "#f5f5f7",
  },
};

test("buildImageGenerationPrompt creates an art-layer prompt with editable caption and model-rendered dialogue", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

  assert.match(prompt, /generated art layer/);
  assert.match(prompt, /editable caption overlay/);
  assert.match(prompt, /clo/);
  assert.match(prompt, /round silhouette/);
  assert.match(prompt, /sunny studio/);
  assert.match(prompt, /glowing laptop/);
  assert.match(prompt, /soft editorial webtoon composition/);
  assert.match(prompt, /Caption overlay context only, never draw this text: Unexpected message/);
  assert.match(prompt, /Editable caption overlay placement: top area; alignment: left; font size: 72px/);
  assert.match(prompt, /Dialogue to render inside the generated image speech bubble: What is this/);
  assert.match(prompt, /1:1 square canvas/);
  assert.match(prompt, /Quality guardrails/);
  assert.match(prompt, new RegExp(GENERATED_IMAGE_TEXT_BAN));
  assert.doesNotMatch(prompt, /gemini-/i);
});

test("buildImageGenerationPrompt keeps reference image data URLs out of the prompt text", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

  assert.match(prompt, /Expression reference images provided: smile\.png/);
  assert.doesNotMatch(prompt, /data:image/i);
  assert.doesNotMatch(prompt, /AAAA/);
});

test("buildImageGenerationPrompt reserves the requested caption area for the app overlay", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

  assert.match(prompt, /Draw the dialogue as a speech bubble only when dialogue is provided/i);
  assert.match(prompt, /The app will add the editable caption box/i);
  assert.match(prompt, /Leave a clean, low-detail area for the app's editable caption overlay near the top area/i);
  assert.match(prompt, /Do not draw comic frames, panel borders, color gradient bars, subtitles, caption boxes, or UI text/i);
});

test("buildImageGenerationPrompt documents empty cut fields with safe fallback text", () => {
  const prompt = buildImageGenerationPrompt({
    assets,
    project,
    cut: {
      ...cut,
      scenario: "",
      caption: "",
      dialogue: "",
      imagePrompt: "",
    },
  });

  assert.match(prompt, /Scenario: No scenario provided\./);
  assert.match(prompt, /Caption overlay context only, never draw this text: No caption provided\./);
  assert.match(prompt, /Dialogue: No dialogue provided\. Do not draw a speech bubble\./);
  assert.match(prompt, /Clean editorial webtoon composition, consistent character, no random text\./);
  assert.doesNotMatch(prompt, /consistent character, no text\./);
});

test("buildImageGenerationPrompt preserves canvas-specific composition context", () => {
  assert.match(
    buildImageGenerationPrompt({
      assets,
      cut,
      project: { ...project, canvasPreset: "4:5" },
    }),
    /4:5 vertical feed canvas/,
  );
  assert.match(
    buildImageGenerationPrompt({
      assets,
      cut,
      project: { ...project, canvasPreset: "9:16" },
    }),
    /9:16 story\/reels canvas/,
  );
});
