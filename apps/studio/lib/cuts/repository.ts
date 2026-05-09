import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/database";
import { getProject, touchProject } from "@/lib/projects/repository";
import type { CreateCutInput, Cut, UpdateCutInput } from "@/lib/cuts/types";

type CutRow = {
  id: string;
  project_id: string;
  position: number;
  template: Cut["template"];
  scenario: string;
  caption: string;
  dialogue: string;
  image_prompt: string;
  negative_prompt: string;
  image_data_url: string;
  image_status: Cut["imageStatus"];
  created_at: string;
  updated_at: string;
};

export function listCuts(projectId: string): Cut[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, project_id, position, template, scenario, caption, dialogue,
              image_prompt, negative_prompt, image_data_url, image_status, created_at, updated_at
       FROM cuts
       WHERE project_id = ?
       ORDER BY position ASC, created_at ASC`,
    )
    .all(projectId) as CutRow[];

  return rows.map(toCut);
}

export function getCut(projectId: string, cutId: string): Cut | null {
  const row = getDatabase()
    .prepare(
      `SELECT id, project_id, position, template, scenario, caption, dialogue,
              image_prompt, negative_prompt, image_data_url, image_status, created_at, updated_at
       FROM cuts
       WHERE project_id = ? AND id = ?`,
    )
    .get(projectId, cutId) as CutRow | undefined;

  return row ? toCut(row) : null;
}

export function createCut(input: CreateCutInput): Cut {
  if (!getProject(input.projectId)) {
    throw new Error("Project not found");
  }

  const now = new Date().toISOString();
  const position = nextPosition(input.projectId);
  const cut: Cut = {
    id: randomUUID(),
    projectId: input.projectId,
    position,
    template: input.template,
    scenario: input.scenario ?? "",
    caption: input.caption ?? "",
    dialogue: input.dialogue ?? "",
    imagePrompt: input.imagePrompt ?? "",
    negativePrompt: input.negativePrompt ?? "",
    imageDataUrl: input.imageDataUrl ?? "",
    imageStatus: input.imageStatus ?? "empty",
    createdAt: now,
    updatedAt: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO cuts (
        id, project_id, position, template, scenario, caption, dialogue,
        image_prompt, negative_prompt, image_data_url, image_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      cut.id,
      cut.projectId,
      cut.position,
      cut.template,
      cut.scenario,
      cut.caption,
      cut.dialogue,
      cut.imagePrompt,
      cut.negativePrompt,
      cut.imageDataUrl,
      cut.imageStatus,
      cut.createdAt,
      cut.updatedAt,
    );

  touchProject(input.projectId, now);

  return cut;
}

export function updateCut(projectId: string, cutId: string, input: UpdateCutInput): Cut | null {
  const current = getCut(projectId, cutId);

  if (!current) {
    return null;
  }

  const next: Cut = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  getDatabase()
    .prepare(
      `UPDATE cuts
       SET template = ?,
           scenario = ?,
           caption = ?,
           dialogue = ?,
           image_prompt = ?,
           negative_prompt = ?,
           image_data_url = ?,
           image_status = ?,
           updated_at = ?
       WHERE project_id = ? AND id = ?`,
    )
    .run(
      next.template,
      next.scenario,
      next.caption,
      next.dialogue,
      next.imagePrompt,
      next.negativePrompt,
      next.imageDataUrl,
      next.imageStatus,
      next.updatedAt,
      projectId,
      cutId,
    );

  touchProject(projectId, next.updatedAt);

  return next;
}

export function duplicateCut(projectId: string, cutId: string): Cut | null {
  const source = getCut(projectId, cutId);

  if (!source) {
    return null;
  }

  return createCut({
    projectId,
    template: source.template,
    scenario: source.scenario,
    caption: source.caption,
    dialogue: source.dialogue,
    imagePrompt: source.imagePrompt,
    negativePrompt: source.negativePrompt,
    imageDataUrl: source.imageDataUrl,
    imageStatus: source.imageStatus,
  });
}

export function deleteCut(projectId: string, cutId: string): boolean {
  const result = getDatabase()
    .prepare(`DELETE FROM cuts WHERE project_id = ? AND id = ?`)
    .run(projectId, cutId);

  if (result.changes > 0) {
    normalizePositions(projectId);
    touchProject(projectId);
    return true;
  }

  return false;
}

export function reorderCuts(projectId: string, cutIds: string[]): Cut[] {
  const existingCuts = listCuts(projectId);
  const existingIds = new Set(existingCuts.map((cut) => cut.id));
  const uniqueCutIds = [...new Set(cutIds)].filter((cutId) => existingIds.has(cutId));
  const orderedCutIds = [
    ...uniqueCutIds,
    ...existingCuts.filter((cut) => !uniqueCutIds.includes(cut.id)).map((cut) => cut.id),
  ];

  const db = getDatabase();
  const update = db.prepare(
    `UPDATE cuts SET position = ?, updated_at = ? WHERE project_id = ? AND id = ?`,
  );
  const now = new Date().toISOString();

  db.transaction(() => {
    orderedCutIds.forEach((cutId, index) => {
      update.run(index + 1, now, projectId, cutId);
    });
  })();

  touchProject(projectId, now);

  return listCuts(projectId);
}

function nextPosition(projectId: string): number {
  const row = getDatabase()
    .prepare(`SELECT COALESCE(MAX(position), 0) + 1 AS position FROM cuts WHERE project_id = ?`)
    .get(projectId) as { position: number };

  return row.position;
}

function normalizePositions(projectId: string) {
  const cuts = listCuts(projectId);
  reorderCuts(
    projectId,
    cuts.map((cut) => cut.id),
  );
}

function toCut(row: CutRow): Cut {
  return {
    id: row.id,
    projectId: row.project_id,
    position: row.position,
    template: row.template,
    scenario: row.scenario,
    caption: row.caption,
    dialogue: row.dialogue,
    imagePrompt: row.image_prompt,
    negativePrompt: row.negative_prompt,
    imageDataUrl: row.image_data_url,
    imageStatus: row.image_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
