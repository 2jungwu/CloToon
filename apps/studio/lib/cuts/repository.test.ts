import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import type { CaptionStyle } from "@/lib/caption-style/types";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "clotoon-cuts-"));
process.env.LOCAL_STUDIO_DATA_DIR = testDataDir;

const { defaultCaptionStyle } = await import("@/lib/caption-style/types");
const { getDatabase } = await import("@/lib/db/database");
const { createCut, duplicateCut, getCut, listCuts, updateCut } = await import(
  "@/lib/cuts/repository"
);
const { createProject } = await import("@/lib/projects/repository");

after(() => {
  getDatabase().close();
  fs.rmSync(testDataDir, { force: true, recursive: true });
  delete process.env.LOCAL_STUDIO_DATA_DIR;
});

const customCaptionStyle: CaptionStyle = {
  ...defaultCaptionStyle,
  text: {
    ...defaultCaptionStyle.text,
    color: "#ff3b30",
    fontSize: 44,
    fontWeight: 800,
    textAlign: "left",
  },
  box: {
    ...defaultCaptionStyle.box,
    backgroundColor: "#ffffff",
    borderColor: "#0071e3",
    borderWidth: 4,
    paddingX: 36,
    paddingY: 18,
  },
};

test("cut repository persists caption style through create and list", () => {
  const project = createProject({
    canvasPreset: "1:1",
    contentType: "comic",
    name: "Caption style create test",
  });

  const created = createCut({
    projectId: project.id,
    template: "comic",
    captionStyle: customCaptionStyle,
  });

  assert.deepEqual(created.captionStyle, customCaptionStyle);

  const [stored] = listCuts(project.id);
  assert.deepEqual(stored.captionStyle, created.captionStyle);

  const row = getDatabase()
    .prepare("SELECT caption_style_json FROM cuts WHERE id = ?")
    .get(created.id) as { caption_style_json: string };

  assert.deepEqual(JSON.parse(row.caption_style_json), customCaptionStyle);
});

test("cut repository updates caption style", () => {
  const project = createProject({
    canvasPreset: "4:5",
    contentType: "card-news",
    name: "Caption style update test",
  });
  const cut = createCut({
    projectId: project.id,
    template: "card-news",
    captionStyle: customCaptionStyle,
  });
  const nextCaptionStyle: CaptionStyle = {
    ...customCaptionStyle,
    text: {
      ...customCaptionStyle.text,
      color: "#34c759",
      textAlign: "center",
    },
    box: {
      ...customCaptionStyle.box,
      borderRadius: 16,
      widthMode: "fixed",
      widthPx: 720,
    },
  };

  const updated = updateCut(project.id, cut.id, {
    captionStyle: nextCaptionStyle,
  });

  assert.deepEqual(updated?.captionStyle, nextCaptionStyle);
  assert.deepEqual(getCut(project.id, cut.id)?.captionStyle, nextCaptionStyle);
});

test("cut repository duplicates caption style", () => {
  const project = createProject({
    canvasPreset: "9:16",
    contentType: "comic",
    name: "Caption style duplicate test",
  });
  const cut = createCut({
    projectId: project.id,
    template: "comic",
    captionStyle: customCaptionStyle,
  });

  const duplicated = duplicateCut(project.id, cut.id);

  assert.ok(duplicated);
  assert.notEqual(duplicated.id, cut.id);
  assert.deepEqual(duplicated.captionStyle, cut.captionStyle);
  assert.deepEqual(getCut(project.id, duplicated.id)?.captionStyle, cut.captionStyle);
});
