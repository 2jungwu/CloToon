const fs = require("node:fs");
const path = require("node:path");

const desktopDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopDir, "..", "..");
const studioDir = path.join(repoRoot, "apps", "studio");
const standaloneSource = path.join(studioDir, ".next", "standalone");
const staticSource = path.join(studioDir, ".next", "static");
const publicSource = path.join(studioDir, "public");
const requiredServerFilesSource = path.join(studioDir, ".next", "required-server-files.json");
const resourcesDir = path.join(desktopDir, "resources");
const studioResourceDir = path.join(resourcesDir, "studio");
const standaloneTarget = path.join(studioResourceDir, "standalone");
const nodeTargetDir = path.join(resourcesDir, "node", "win-x64");
const nodeTarget = path.join(nodeTargetDir, "node.exe");
const expectedNodeRuntimeVersion = "v24.8.0";

main();

function main() {
  assertWindowsX64();
  assertDirectory(standaloneSource, "Next standalone output");
  assertDirectory(staticSource, "Next static output");
  assertDirectory(publicSource, "Studio public directory");
  assertFile(requiredServerFilesSource, "Next required server files manifest");

  fs.rmSync(resourcesDir, { force: true, recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });

  copyDirectory(standaloneSource, standaloneTarget);

  const serverEntry = findServerEntry(standaloneTarget, readRelativeAppDir());
  const serverDir = path.dirname(serverEntry);

  copyDirectory(staticSource, path.join(serverDir, ".next", "static"));
  copyDirectory(publicSource, path.join(serverDir, "public"));
  copyNodeRuntime();

  writeRuntimeManifest({
    nodeExecutable: toPortablePath(path.relative(resourcesDir, nodeTarget)),
    serverEntry: toPortablePath(path.relative(resourcesDir, serverEntry)),
  });

  console.log(`Desktop resources prepared: ${resourcesDir}`);
}

function assertWindowsX64() {
  if (process.platform !== "win32" || process.arch !== "x64") {
    throw new Error("desktop:prepare는 Windows x64 환경에서 실행해야 합니다.");
  }
}

function assertDirectory(directory, label) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`${label}를 찾을 수 없습니다: ${directory}`);
  }
}

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`${label}를 찾을 수 없습니다: ${filePath}`);
  }
}

function readRelativeAppDir() {
  const manifest = JSON.parse(fs.readFileSync(requiredServerFilesSource, "utf8"));

  if (typeof manifest.relativeAppDir === "string" && manifest.relativeAppDir.length > 0) {
    return manifest.relativeAppDir;
  }

  if (typeof manifest.appDir === "string" && typeof manifest.config?.outputFileTracingRoot === "string") {
    return path.relative(manifest.config.outputFileTracingRoot, manifest.appDir);
  }

  throw new Error("Next required server files manifest에 앱 디렉터리 정보가 없습니다.");
}

function findServerEntry(root, relativeAppDir) {
  const candidates = [
    path.join(root, ...relativeAppDir.split(/[\\/]+/), "server.js"),
    path.join(root, "apps", "studio", "server.js"),
    path.join(root, "server.js"),
  ];

  const serverEntry = candidates.find(isStandaloneServerEntry);

  if (serverEntry) {
    return serverEntry;
  }

  const recursiveEntry = findFirstStandaloneServer(root);

  if (!recursiveEntry) {
    throw new Error(`Next standalone server.js를 찾을 수 없습니다: ${root}`);
  }

  return recursiveEntry;
}

function findFirstStandaloneServer(root) {
  const entries = fs.readdirSync(root, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (
      entry.isFile() &&
      entry.name === "server.js" &&
      !entryPath.includes(`${path.sep}node_modules${path.sep}`) &&
      isStandaloneServerEntry(entryPath)
    ) {
      return entryPath;
    }

    if (entry.isDirectory() && entry.name !== "node_modules") {
      const found = findFirstStandaloneServer(entryPath);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

function isStandaloneServerEntry(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  return fs.existsSync(path.join(path.dirname(filePath), ".next", "required-server-files.json"));
}

function copyNodeRuntime() {
  if (process.version !== expectedNodeRuntimeVersion) {
    throw new Error(
      `desktop:prepare는 Node ${expectedNodeRuntimeVersion} 런타임이 필요합니다. 현재 런타임: ${process.version}`,
    );
  }

  if (!process.execPath.toLowerCase().endsWith("node.exe")) {
    throw new Error(`현재 프로세스가 Windows node.exe가 아닙니다: ${process.execPath}`);
  }

  fs.mkdirSync(nodeTargetDir, { recursive: true });
  fs.copyFileSync(process.execPath, nodeTarget);
}

function writeRuntimeManifest(manifest) {
  fs.writeFileSync(
    path.join(resourcesDir, "desktop-runtime.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

function copyDirectory(source, target) {
  fs.cpSync(source, target, {
    recursive: true,
    force: true,
    dereference: true,
  });
}

function toPortablePath(value) {
  return value.split(path.sep).join("/");
}
