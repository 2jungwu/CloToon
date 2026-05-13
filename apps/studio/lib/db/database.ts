import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = resolveDataDir();
const dbPath = path.join(dataDir, "app.db");

let database: Database.Database | null = null;

export function getDatabase() {
  if (!database) {
    fs.mkdirSync(dataDir, { recursive: true });
    database = new Database(dbPath);
    database.pragma("journal_mode = WAL");
    migrate(database);
  }

  return database;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      canvas_preset TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cuts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      template TEXT NOT NULL,
      scenario TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      dialogue TEXT NOT NULL DEFAULT '',
      image_prompt TEXT NOT NULL DEFAULT '',
      negative_prompt TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cuts_project_position
      ON cuts(project_id, position);
  `);

  addColumnIfMissing(db, "cuts", "image_data_url", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(db, "cuts", "image_status", "TEXT NOT NULL DEFAULT 'empty'");
  addColumnIfMissing(db, "cuts", "caption_style_json", "TEXT NOT NULL DEFAULT ''");
}

function addColumnIfMissing(
  db: Database.Database,
  tableName: string,
  columnName: string,
  definition: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];

  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function resolveDataDir() {
  const configuredDataDir = process.env.LOCAL_STUDIO_DATA_DIR;

  if (configuredDataDir) {
    return path.resolve(configuredDataDir);
  }

  return path.join(findWorkspaceRoot(process.cwd()), "data");
}

function findWorkspaceRoot(startDir: string) {
  let currentDir = startDir;

  while (true) {
    const packageJsonPath = path.join(currentDir, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
          workspaces?: unknown;
        };

        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch {
        // Keep walking upward if a package file is unreadable or malformed.
      }
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return startDir;
    }

    currentDir = parentDir;
  }
}
