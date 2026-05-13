const { app, BrowserWindow, dialog, session, shell } = require("electron");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const productName = "CloToon";
const host = "127.0.0.1";
const port = 41521;
const appUrl = `http://${host}:${port}`;
const desktopAuthCookieName = "clotoon_desktop_token";
const desktopAuthToken = crypto.randomBytes(32).toString("hex");

let mainWindow = null;
let serverProcess = null;

const appDataRoot = resolveAppDataRoot();
const electronDataDir = path.join(appDataRoot, "electron");
const studioDataDir = path.join(appDataRoot, "data");

fs.mkdirSync(electronDataDir, { recursive: true });
fs.mkdirSync(studioDataDir, { recursive: true });

app.setName(productName);
app.setPath("userData", electronDataDir);

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app.whenReady().then(bootstrap).catch((error) => {
    showFatalError(error);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverProcess) {
      createMainWindow();
    }
  });

  app.on("before-quit", () => {
    stopServer();
  });
}

async function bootstrap() {
  await assertPortAvailable();
  startServer();
  await waitForServer();
  await setDesktopAuthCookie();
  createMainWindow();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: productName,
    width: 1280,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternalUrl(url)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isInternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(appUrl);
}

function startServer() {
  const runtime = readRuntimeManifest();
  const serverEntry = path.join(getResourcesRoot(), runtime.serverEntry);
  const serverExecutable = runtime.nodeExecutable
    ? path.join(getResourcesRoot(), runtime.nodeExecutable)
    : process.execPath;

  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Next 서버 엔트리를 찾을 수 없습니다: ${serverEntry}`);
  }

  if (!fs.existsSync(serverExecutable)) {
    throw new Error(`Node server executable을 찾을 수 없습니다: ${serverExecutable}`);
  }

  const serverEnv = buildServerEnvironment(runtime);

  serverProcess = spawn(serverExecutable, [serverEntry], {
    cwd: path.dirname(serverEntry),
    env: serverEnv,
    stdio: "ignore",
    windowsHide: true,
  });

  serverProcess.once("error", (error) => {
    serverProcess = null;

    if (!app.isQuitting) {
      showFatalError(error);
      app.quit();
    }
  });

  serverProcess.once("exit", (code, signal) => {
    serverProcess = null;

    if (!app.isQuitting) {
      showFatalError(
        new Error(`로컬 서버가 종료되었습니다. code=${code ?? "none"}, signal=${signal ?? "none"}`),
      );
      app.quit();
    }
  });

  serverProcess.unref();
}

function buildServerEnvironment(runtime) {
  const serverEnv = {
    HOSTNAME: host,
    LOCAL_STUDIO_DATA_DIR: studioDataDir,
    LOCAL_STUDIO_DESKTOP_AUTH_COOKIE: desktopAuthCookieName,
    LOCAL_STUDIO_DESKTOP_AUTH_TOKEN: desktopAuthToken,
    LOCAL_STUDIO_DESKTOP_ORIGIN: appUrl,
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_ENV: "production",
    PORT: String(port),
  };

  copyExistingEnvironmentValues(serverEnv, [
    "APPDATA",
    "COMSPEC",
    "LOCALAPPDATA",
    "PATH",
    "Path",
    "SystemRoot",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "WINDIR",
  ]);

  if (!runtime.nodeExecutable) {
    serverEnv.ELECTRON_RUN_AS_NODE = "1";
  }

  return serverEnv;
}

function copyExistingEnvironmentValues(target, names) {
  for (const name of names) {
    if (process.env[name]) {
      target[name] = process.env[name];
    }
  }
}

function setDesktopAuthCookie() {
  return session.defaultSession.cookies.set({
    url: appUrl,
    name: desktopAuthCookieName,
    value: desktopAuthToken,
    httpOnly: true,
    sameSite: "strict",
    expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
}

function stopServer() {
  app.isQuitting = true;

  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
}

function assertPortAvailable() {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once("error", () => {
      reject(
        new Error(
          `${host}:${port} 포트를 사용할 수 없습니다. 이미 실행 중인 CloToon 또는 다른 앱을 종료한 뒤 다시 실행하세요.`,
        ),
      );
    });

    tester.once("listening", () => {
      tester.close(resolve);
    });

    tester.listen(port, host);
  });
}

function waitForServer(timeoutMs = 30_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const ping = () => {
      const request = http.get(appUrl, (response) => {
        response.resume();
        resolve();
      });

      request.once("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error("로컬 서버 시작 시간이 초과되었습니다."));
          return;
        }

        setTimeout(ping, 250);
      });

      request.setTimeout(2000, () => {
        request.destroy();
      });
    };

    ping();
  });
}

function readRuntimeManifest() {
  const manifestPath = path.join(getResourcesRoot(), "desktop-runtime.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`데스크톱 런타임 manifest를 찾을 수 없습니다: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (
    !manifest ||
    typeof manifest !== "object" ||
    typeof manifest.serverEntry !== "string"
  ) {
    throw new Error("데스크톱 런타임 manifest 형식이 올바르지 않습니다.");
  }

  if ("nodeExecutable" in manifest && typeof manifest.nodeExecutable !== "string") {
    throw new Error("데스크톱 런타임 manifest 형식이 올바르지 않습니다.");
  }

  return manifest;
}

function getResourcesRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "resources");
  }

  return path.join(__dirname, "resources");
}

function resolveAppDataRoot() {
  const appData = process.env.APPDATA || app.getPath("appData");
  return path.join(appData, productName);
}

function isInternalUrl(url) {
  return url === appUrl || url.startsWith(`${appUrl}/`);
}

function showFatalError(error) {
  dialog.showErrorBox(productName, error instanceof Error ? error.message : String(error));
}
