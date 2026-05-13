import assert from "node:assert/strict";
import { test } from "node:test";
import { getColorAreaHsv, hsvToRgb, rgbToHex } from "./color.ts";
import { normalizeCaptionStyle, parseCaptionStyle, serializeCaptionStyle } from "./schema.ts";
import { defaultCaptionStyle } from "./types.ts";

test("parseCaptionStyle falls back to the default style for empty or malformed values", () => {
  assert.deepEqual(parseCaptionStyle(""), defaultCaptionStyle);
  assert.deepEqual(parseCaptionStyle("{not-json"), defaultCaptionStyle);
});

test("normalizeCaptionStyle merges partial user style with safe defaults", () => {
  const style = normalizeCaptionStyle({
    text: {
      color: "#AA00FF",
      fontSize: 36,
      fontWeight: 800,
      fontStyle: "italic",
      textDecoration: "underline",
      textAlign: "left",
    },
    box: {
      backgroundColor: "#F7F7F7",
      borderColor: "#111111",
      borderWidth: 4,
      borderRadius: 12,
      opacity: 0.8,
      paddingX: 40,
      paddingY: 18,
      widthMode: "fixed",
      widthPx: 760,
    },
  });

  assert.equal(style.text.color, "#aa00ff");
  assert.equal(style.text.fontSize, 36);
  assert.equal(style.text.fontWeight, 800);
  assert.equal(style.text.fontStyle, "italic");
  assert.equal(style.text.textDecoration, "underline");
  assert.equal(style.text.textAlign, "left");
  assert.equal(style.box.backgroundColor, "#f7f7f7");
  assert.equal(style.box.opacity, 0.8);
  assert.equal(style.box.widthMode, "fixed");
  assert.equal(style.box.widthPx, 760);
});

test("normalizeCaptionStyle clamps numeric values and rejects invalid enums", () => {
  const style = normalizeCaptionStyle({
    text: {
      fontSize: 999,
      fontWeight: 900,
      textAlign: "right",
    },
    box: {
      borderWidth: -10,
      borderRadius: 999,
      opacity: 2,
      paddingX: 999,
      widthPx: 10,
      widthMode: "percent",
    },
  });

  assert.equal(style.text.fontSize, 96);
  assert.equal(style.text.fontWeight, defaultCaptionStyle.text.fontWeight);
  assert.equal(style.text.textAlign, defaultCaptionStyle.text.textAlign);
  assert.equal(style.box.borderWidth, 0);
  assert.equal(style.box.borderRadius, 64);
  assert.equal(style.box.opacity, 1);
  assert.equal(style.box.paddingX, 96);
  assert.equal(style.box.widthPx, 240);
  assert.equal(style.box.widthMode, defaultCaptionStyle.box.widthMode);
});

test("serializeCaptionStyle returns a normalized JSON payload", () => {
  const serialized = serializeCaptionStyle({ text: { color: "#00AAFF" } });
  const parsed = JSON.parse(serialized) as { text: { color: string; fontSize: number } };

  assert.equal(parsed.text.color, "#00aaff");
  assert.equal(parsed.text.fontSize, defaultCaptionStyle.text.fontSize);
});

test("getColorAreaHsv maps color area coordinates to saturation and brightness", () => {
  const hsv = getColorAreaHsv({
    clientX: 110,
    clientY: 70,
    hue: 120,
    rect: {
      height: 100,
      left: 10,
      top: 20,
      width: 200,
    },
  });
  const rgb = hsvToRgb(hsv);

  assert.deepEqual(hsv, { hue: 120, saturation: 50, value: 50 });
  assert.equal(rgbToHex(rgb.r, rgb.g, rgb.b), "#408040");
});

test("getColorAreaHsv clamps pointer coordinates to the visible color area", () => {
  const topRight = getColorAreaHsv({
    clientX: 999,
    clientY: -10,
    hue: 240,
    rect: {
      height: 100,
      left: 10,
      top: 20,
      width: 200,
    },
  });
  const bottomLeft = getColorAreaHsv({
    clientX: -10,
    clientY: 999,
    hue: 240,
    rect: {
      height: 100,
      left: 10,
      top: 20,
      width: 200,
    },
  });

  assert.deepEqual(topRight, { hue: 240, saturation: 100, value: 100 });
  assert.deepEqual(bottomLeft, { hue: 240, saturation: 0, value: 0 });
});
