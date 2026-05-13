import assert from "node:assert/strict";
import test from "node:test";

import {
  loadGeminiImageModelFromStorage,
  loadSelectedGeminiImageModelFromStorage,
  settingsStorageKey,
} from "@/lib/image-generation/storage";

function createStorage(value: unknown): Storage {
  return {
    getItem(key: string) {
      return key === settingsStorageKey ? JSON.stringify(value) : null;
    },
  } as Storage;
}

test("loadGeminiImageModelFromStorage reads the current geminiImageModel key", () => {
  const storage = createStorage({ geminiImageModel: "gemini-3-pro-image-preview" });

  assert.equal(loadGeminiImageModelFromStorage(storage), "gemini-3-pro-image-preview");
  assert.equal(loadSelectedGeminiImageModelFromStorage(storage), "gemini-3-pro-image-preview");
});

test("loadGeminiImageModelFromStorage keeps legacy geminiModel compatibility", () => {
  const storage = createStorage({ geminiModel: "gemini-2.5-flash-image" });

  assert.equal(loadGeminiImageModelFromStorage(storage), "gemini-2.5-flash-image");
  assert.equal(loadSelectedGeminiImageModelFromStorage(storage), "gemini-2.5-flash-image");
});

test("loadGeminiImageModelFromStorage prefers geminiImageModel over legacy geminiModel", () => {
  const storage = createStorage({
    geminiImageModel: "gemini-3-pro-image-preview",
    geminiModel: "gemini-2.5-flash-image",
  });

  assert.equal(loadGeminiImageModelFromStorage(storage), "gemini-3-pro-image-preview");
  assert.equal(loadSelectedGeminiImageModelFromStorage(storage), "gemini-3-pro-image-preview");
});
