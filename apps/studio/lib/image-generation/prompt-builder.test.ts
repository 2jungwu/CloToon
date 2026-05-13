import assert from "node:assert/strict";
import test from "node:test";

import { defaultGeminiImageModel } from "./models.ts";
import { buildImageGenerationPrompt } from "./prompt-builder.ts";
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

test("buildImageGenerationPrompt combines assets and cut context while keeping caption as overlay", () => {
  const prompt = buildImageGenerationPrompt({ assets, cut, project });

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
  assert.match(prompt, /do not invent extra readable text/);
  assert.doesNotMatch(prompt, /No readable text, captions, speech bubbles, Korean lettering, UI text, subtitles, or dialogue/);
  assert.doesNotMatch(prompt, new RegExp(defaultGeminiImageModel));
  assert.doesNotMatch(prompt, /data:image\/png;base64,AAAA/);
});
