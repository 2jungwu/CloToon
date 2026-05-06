import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db/database";
import type { CreateProjectInput, Project } from "@/lib/projects/types";

type ProjectRow = {
  id: string;
  name: string;
  content_type: Project["contentType"];
  canvas_preset: Project["canvasPreset"];
  created_at: string;
  updated_at: string;
};

export function listProjects(): Project[] {
  const rows = getDatabase()
    .prepare(
      `SELECT id, name, content_type, canvas_preset, created_at, updated_at
       FROM projects
       ORDER BY updated_at DESC`,
    )
    .all() as ProjectRow[];

  return rows.map(toProject);
}

export function getProject(id: string): Project | null {
  const row = getDatabase()
    .prepare(
      `SELECT id, name, content_type, canvas_preset, created_at, updated_at
       FROM projects
       WHERE id = ?`,
    )
    .get(id) as ProjectRow | undefined;

  return row ? toProject(row) : null;
}

export function createProject(input: CreateProjectInput): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    name: input.name,
    contentType: input.contentType,
    canvasPreset: input.canvasPreset,
    createdAt: now,
    updatedAt: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO projects (
        id,
        name,
        content_type,
        canvas_preset,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      project.id,
      project.name,
      project.contentType,
      project.canvasPreset,
      project.createdAt,
      project.updatedAt,
    );

  return project;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    contentType: row.content_type,
    canvasPreset: row.canvas_preset,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
