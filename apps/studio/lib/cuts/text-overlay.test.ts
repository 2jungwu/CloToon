import assert from "node:assert/strict";
import test from "node:test";

import { getCutTextOverlay } from "./text-overlay.ts";

test("getCutTextOverlay preserves only caption text for HTML overlay rendering", () => {
  const caption = "This warning should stay editable.";
  const dialogue = "This dialogue belongs inside the generated image.";

  const overlay = getCutTextOverlay({
    caption,
    dialogue,
  });

  assert.equal(overlay.caption, caption);
  assert.equal(overlay.dialogue, "");
  assert.equal(overlay.hasCaption, true);
  assert.equal(overlay.hasDialogue, false);
});

test("getCutTextOverlay hides empty caption without adding fallback text", () => {
  const overlay = getCutTextOverlay({
    caption: "   ",
    dialogue: "Dialogue belongs to the generated image.",
  });

  assert.equal(overlay.caption, "");
  assert.equal(overlay.dialogue, "");
  assert.equal(overlay.hasCaption, false);
  assert.equal(overlay.hasDialogue, false);
});
