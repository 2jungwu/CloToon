import assert from "node:assert/strict";
import test from "node:test";

import {
  captionFontSizeMax,
  captionFontSizeMin,
  defaultCaptionStyle,
  normalizeCaptionStyleOverride,
  normalizeCaptionStyleOverrideOrNull,
  resolveCaptionStyle,
  serializeCaptionStyleOverride,
} from "./caption-style.ts";

test("resolveCaptionStyle returns the default caption style without overrides", () => {
  const style = resolveCaptionStyle(null);

  assert.deepEqual(style, defaultCaptionStyle);
});

test("resolveCaptionStyle merges valid cut-level caption style overrides", () => {
  const style = resolveCaptionStyle({
    align: "left",
    fontSize: 64,
    position: "top",
  });

  assert.deepEqual(style, {
    ...defaultCaptionStyle,
    align: "left",
    fontSize: 64,
    position: "top",
  });
});

test("normalizeCaptionStyleOverride clamps font size and ignores invalid values", () => {
  assert.deepEqual(
    normalizeCaptionStyleOverride({
      align: "wrong",
      fontSize: captionFontSizeMax + 100,
      position: "side",
    }),
    {
      fontSize: captionFontSizeMax,
    },
  );

  assert.deepEqual(normalizeCaptionStyleOverride({ fontSize: captionFontSizeMin - 100 }), {
    fontSize: captionFontSizeMin,
  });
});

test("serializeCaptionStyleOverride stores only meaningful override data", () => {
  assert.equal(serializeCaptionStyleOverride(null), "");
  assert.equal(serializeCaptionStyleOverride({}), "");
  assert.equal(serializeCaptionStyleOverride({ align: "right" }), '{"align":"right"}');
});

test("normalizeCaptionStyleOverrideOrNull removes empty override payloads", () => {
  assert.equal(normalizeCaptionStyleOverrideOrNull({}), null);
  assert.equal(normalizeCaptionStyleOverrideOrNull({ align: "wrong" }), null);
  assert.deepEqual(normalizeCaptionStyleOverrideOrNull({ fontSize: 56.4 }), { fontSize: 56 });
});
