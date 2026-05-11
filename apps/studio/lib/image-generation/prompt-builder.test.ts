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

test("buildImageGenerationPrompt creates an art-layer prompt with overlay-only text context", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

  assert.match(prompt, /generated art layer/);
  assert.match(prompt, /HTML\/CSS text overlays/);
  assert.match(prompt, /clo/);
  assert.match(prompt, /round silhouette/);
  assert.match(prompt, /sunny studio/);
  assert.match(prompt, /glowing laptop/);
  assert.match(prompt, /soft editorial webtoon composition/);
  assert.match(prompt, /Caption overlay context only, never draw this text: Unexpected message/);
  assert.match(prompt, /Dialogue overlay context only, never draw this text: What is this/);
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
  assert.match(prompt, /Dialogue overlay context only, never draw this text: No dialogue provided\./);
  assert.match(prompt, /Clean editorial webtoon composition, consistent character, no text\./);
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
