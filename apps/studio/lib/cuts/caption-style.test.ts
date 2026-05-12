import assert from "node:assert/strict";
import test from "node:test";

import {
  captionBorderWidthMax,
  captionBoxHeightMax,
  captionBoxHeightMin,
  captionBoxWidthMax,
  captionBoxWidthMin,
  captionFontSizeMax,
  captionFontSizeMin,
  captionFontWeightMax,
  captionPaddingMax,
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
    yPct: 4,
  });
});

test("resolveCaptionStyle supports box geometry, padding, colors, and weight", () => {
  const style = resolveCaptionStyle({
    align: "right",
    backgroundColor: "#F8FAFC",
    borderColor: "#111827",
    borderWidth: 4,
    color: "#0F172A",
    fontSize: 72,
    fontWeight: 700,
    heightPct: 22,
    paddingXPct: 6,
    paddingYPct: 3,
    widthPct: 82,
    xPct: 9,
    yPct: 64,
  });

  assert.deepEqual(style, {
    ...defaultCaptionStyle,
    align: "right",
    backgroundColor: "#f8fafc",
    borderColor: "#111827",
    borderWidth: 4,
    color: "#0f172a",
    fontSize: 72,
    fontWeight: 700,
    heightPct: 22,
    paddingXPct: 6,
    paddingYPct: 3,
    widthPct: 82,
    xPct: 9,
    yPct: 64,
  });
});

test("resolveCaptionStyle maps legacy position presets to editable box positions", () => {
  assert.equal(resolveCaptionStyle({ position: "top" }).yPct, 4);
  assert.equal(resolveCaptionStyle({ position: "middle" }).yPct, 41);
  assert.equal(resolveCaptionStyle({ position: "bottom" }).yPct, 78);
  assert.equal(resolveCaptionStyle({ position: "top", yPct: 12 }).yPct, 12);
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

test("normalizeCaptionStyleOverride clamps editor bounds and ignores invalid colors", () => {
  assert.deepEqual(
    normalizeCaptionStyleOverride({
      backgroundColor: "white",
      borderColor: "#GGGGGG",
      borderWidth: captionBorderWidthMax + 10,
      color: "#ABC",
      fontWeight: captionFontWeightMax + 200,
      heightPct: captionBoxHeightMax + 100,
      paddingXPct: captionPaddingMax + 10,
      paddingYPct: -4,
      widthPct: captionBoxWidthMax + 100,
      xPct: 150,
      yPct: -10,
    }),
    {
      borderWidth: captionBorderWidthMax,
      color: "#abc",
      fontWeight: captionFontWeightMax,
      heightPct: captionBoxHeightMax,
      paddingXPct: captionPaddingMax,
      paddingYPct: 0,
      widthPct: captionBoxWidthMax,
      xPct: 100,
      yPct: 0,
    },
  );

  assert.deepEqual(
    normalizeCaptionStyleOverride({
      heightPct: captionBoxHeightMin - 2,
      widthPct: captionBoxWidthMin - 2,
    }),
    {
      heightPct: captionBoxHeightMin,
      widthPct: captionBoxWidthMin,
    },
  );
});

test("serializeCaptionStyleOverride stores only meaningful override data", () => {
  assert.equal(serializeCaptionStyleOverride(null), "");
  assert.equal(serializeCaptionStyleOverride({}), "");
  assert.equal(serializeCaptionStyleOverride({ align: "right" }), '{"align":"right"}');
  assert.equal(
    serializeCaptionStyleOverride({
      backgroundColor: "#FFFFFF",
      color: "#111827",
      widthPct: 80.4,
    }),
    '{"backgroundColor":"#ffffff","color":"#111827","widthPct":80.4}',
  );
});

test("normalizeCaptionStyleOverrideOrNull removes empty override payloads", () => {
  assert.equal(normalizeCaptionStyleOverrideOrNull({}), null);
  assert.equal(normalizeCaptionStyleOverrideOrNull({ align: "wrong" }), null);
  assert.deepEqual(normalizeCaptionStyleOverrideOrNull({ fontSize: 56.4 }), { fontSize: 56 });
});
