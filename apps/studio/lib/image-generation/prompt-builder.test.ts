import assert from "node:assert/strict";
import test from "node:test";

import { buildImageGenerationPrompt, GENERATED_IMAGE_TEXT_POLICY } from "./prompt-builder.ts";
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

test("buildImageGenerationPrompt creates an art-layer prompt while keeping caption as overlay", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

  assert.match(prompt, /generated art layer/);
  assert.match(prompt, /clo/);
  assert.match(prompt, /round silhouette/);
  assert.match(prompt, /sunny studio/);
  assert.match(prompt, /glowing laptop/);
  assert.match(prompt, /soft editorial webtoon composition/);
  assert.match(prompt, /Unexpected message/);
  assert.match(prompt, /What is this/);
  assert.match(prompt, /1:1 square canvas/);
  assert.match(prompt, /Quality guardrails/);
  assert.match(prompt, /Caption overlay only, do not render in image/);
  assert.match(prompt, /Dialogue to render in image if present/);
  assert.match(prompt, /speech bubble or natural dialogue element/);
  assert.match(prompt, new RegExp(GENERATED_IMAGE_TEXT_POLICY));
  assert.doesNotMatch(prompt, /No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue/);
  assert.doesNotMatch(prompt, /gemini-/i);
  assert.doesNotMatch(prompt, /data:image\/png;base64,AAAA/);
});

test("buildImageGenerationPrompt keeps reference image data URLs out of the prompt text", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

  assert.match(prompt, /Expression reference images provided: smile\.png/);
  assert.doesNotMatch(prompt, /data:image/i);
  assert.doesNotMatch(prompt, /AAAA/);
});

test("buildImageGenerationPrompt omits speech bubbles when dialogue is empty", () => {
  const prompt = buildImageGenerationPrompt({
    assets,
    cut: { ...cut, dialogue: "" },
    project,
  });

  assert.match(prompt, /Dialogue to render in image if present: No dialogue provided/);
  assert.match(prompt, /If no dialogue is provided, do not draw a speech bubble/);
});

test("buildImageGenerationPrompt describes supported canvas presets", () => {
  assert.match(buildImageGenerationPrompt({ assets, cut, project }), /1:1 square canvas/);
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
