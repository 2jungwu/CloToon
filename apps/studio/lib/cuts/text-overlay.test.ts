import assert from "node:assert/strict";
import test from "node:test";

import { getCutTextOverlay } from "./text-overlay.ts";

test("getCutTextOverlay preserves Korean caption and dialogue text for HTML overlay rendering", () => {
  const caption =
    "이 악귀가 무서운 건 나만의 얘기가 아니라는 것.\n단지 증상의 종류와 강도가 다를 뿐.";
  const dialogue = "꺼져!";

  const overlay = getCutTextOverlay({
    caption,
    dialogue,
  });

  assert.equal(overlay.caption, caption);
  assert.equal(overlay.dialogue, dialogue);
  assert.equal(overlay.hasCaption, true);
  assert.equal(overlay.hasDialogue, true);
});

test("getCutTextOverlay hides empty caption and dialogue without adding fallback text", () => {
  const overlay = getCutTextOverlay({
    caption: "   ",
    dialogue: "",
  });

  assert.equal(overlay.caption, "");
  assert.equal(overlay.dialogue, "");
  assert.equal(overlay.hasCaption, false);
  assert.equal(overlay.hasDialogue, false);
});
