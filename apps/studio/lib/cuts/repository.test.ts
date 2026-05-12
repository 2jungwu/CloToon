import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "clotoon-cuts-"));
process.env.LOCAL_STUDIO_DATA_DIR = testDataDir;

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

test("cut repository persists caption style overrides through create and list", () => {
  const project = createProject({
    canvasPreset: "1:1",
    contentType: "comic",
    name: "Caption style create test",
  });

  const created = createCut({
    projectId: project.id,
    template: "comic",
    captionStyleOverride: {
      align: "right",
      fontSize: 72,
      position: "top",
    },
  });

  assert.deepEqual(created.captionStyleOverride, {
    align: "right",
    fontSize: 72,
    position: "top",
  });

  const [stored] = listCuts(project.id);
  assert.deepEqual(stored.captionStyleOverride, created.captionStyleOverride);

  const row = getDatabase()
    .prepare("SELECT caption_style_json FROM cuts WHERE id = ?")
    .get(created.id) as { caption_style_json: string };

  assert.deepEqual(JSON.parse(row.caption_style_json), {
    align: "right",
    fontSize: 72,
    position: "top",
  });
});

test("cut repository updates and resets caption style overrides", () => {
  const project = createProject({
    canvasPreset: "4:5",
    contentType: "card-news",
    name: "Caption style update test",
  });
  const cut = createCut({
    projectId: project.id,
    template: "card-news",
    captionStyleOverride: {
      align: "left",
      fontSize: 40,
      position: "bottom",
    },
  });

  const updated = updateCut(project.id, cut.id, {
    captionStyleOverride: {
      fontSize: 96,
      position: "middle",
    },
  });

  assert.deepEqual(updated?.captionStyleOverride, {
    fontSize: 96,
    position: "middle",
  });
  assert.deepEqual(getCut(project.id, cut.id)?.captionStyleOverride, {
    fontSize: 96,
    position: "middle",
  });

  const reset = updateCut(project.id, cut.id, {
    captionStyleOverride: null,
  });

  assert.equal(reset?.captionStyleOverride, null);
  assert.equal(getCut(project.id, cut.id)?.captionStyleOverride, null);

  const row = getDatabase()
    .prepare("SELECT caption_style_json FROM cuts WHERE id = ?")
    .get(cut.id) as { caption_style_json: string };

  assert.equal(row.caption_style_json, "");
});

test("cut repository duplicates caption style overrides", () => {
  const project = createProject({
    canvasPreset: "9:16",
    contentType: "comic",
    name: "Caption style duplicate test",
  });
  const cut = createCut({
    projectId: project.id,
    template: "comic",
    captionStyleOverride: {
      align: "center",
      fontSize: 64,
      position: "middle",
    },
  });

  const duplicated = duplicateCut(project.id, cut.id);

  assert.ok(duplicated);
  assert.notEqual(duplicated.id, cut.id);
  assert.deepEqual(duplicated.captionStyleOverride, cut.captionStyleOverride);
  assert.deepEqual(
    getCut(project.id, duplicated.id)?.captionStyleOverride,
    cut.captionStyleOverride,
  );
});
