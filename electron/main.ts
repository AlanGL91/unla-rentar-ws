import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  screen,
  Tray,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  type Point,
} from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { IPC } from './ipc-channels';
import { createTrayIcon } from './tray-icon';
import {
  clampToWorkArea,
  defaultBounds,
  isOnScreen,
  loadWindowState,
  resizeAnchoredBottom,
  saveWindowState,
  WINDOW_SIZES,
  type WindowMode,
} from './window-state';

const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
const TOGGLE_SHORTCUT = 'Control+Alt+P';

// Transparent windows can flicker on some Windows GPUs; opt-out without code changes.
if (process.env.COMPANION_DISABLE_GPU === '1') app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let mode: WindowMode = 'collapsed';
let drag: { cursor: Point; window: Point } | null = null;

function isTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  if (!mainWindow || event.sender !== mainWindow.webContents) return false;
  const url = event.senderFrame?.url ?? '';
  return devServerUrl ? url.startsWith(devServerUrl) : url === pathToFileURL(indexHtml).href;
}

function persist(): void {
  if (!mainWindow) return;
  const { x, y } = mainWindow.getBounds();
  saveWindowState({ x, y, mode });
}

function initialBounds() {
  const saved = loadWindowState();
  if (saved) {
    const bounds = { x: saved.x, y: saved.y, ...WINDOW_SIZES[saved.mode] };
    if (isOnScreen(bounds)) {
      mode = saved.mode;
      return clampToWorkArea(bounds);
    }
  }
  return defaultBounds(mode);
}

function setMode(next: WindowMode): void {
  if (!mainWindow) return;
  mode = next;
  mainWindow.setBounds(resizeAnchoredBottom(mainWindow.getBounds(), next));
  mainWindow.webContents.send(IPC.windowModeChanged, next);
  persist();
}

function toggleVisibility(): void {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.showInactive();
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    ...initialBounds(),
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  // Keep it above full-screen-ish windows too.
  mainWindow.setAlwaysOnTop(true, 'floating');
  // Transparent areas let clicks through; the renderer turns this off over interactive elements.
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());

  mainWindow.once('ready-to-show', () => mainWindow?.showInactive());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(indexHtml);
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.windowGetMode, (event) => (isTrustedSender(event) ? mode : null));

  ipcMain.on(IPC.windowSetMode, (event, next: unknown) => {
    if (!isTrustedSender(event)) return;
    if (next === 'collapsed' || next === 'expanded') setMode(next);
  });

  ipcMain.on(IPC.windowSetIgnoreMouse, (event, ignore: unknown) => {
    if (!isTrustedSender(event) || typeof ignore !== 'boolean' || drag) return;
    mainWindow?.setIgnoreMouseEvents(ignore, { forward: true });
  });

  // Manual drag: positions come from the OS cursor, never from the renderer.
  ipcMain.on(IPC.windowDragStart, (event) => {
    if (!isTrustedSender(event) || !mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    drag = { cursor: screen.getCursorScreenPoint(), window: { x, y } };
  });

  ipcMain.on(IPC.windowDragMove, (event) => {
    if (!isTrustedSender(event) || !mainWindow || !drag) return;
    const cursor = screen.getCursorScreenPoint();
    mainWindow.setPosition(
      drag.window.x + cursor.x - drag.cursor.x,
      drag.window.y + cursor.y - drag.cursor.y,
    );
  });

  ipcMain.on(IPC.windowDragEnd, (event) => {
    if (!isTrustedSender(event) || !mainWindow) return;
    drag = null;
    mainWindow.setBounds(clampToWorkArea(mainWindow.getBounds()));
    persist();
  });
}

function createTray(): void {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Companion');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Mostrar / ocultar', click: toggleVisibility },
      { type: 'separator' },
      { label: 'Salir', click: () => app.quit() },
    ]),
  );
  tray.on('click', toggleVisibility);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => mainWindow?.showInactive());

  app.whenReady().then(() => {
    registerIpc();
    createWindow();
    createTray();
    if (!globalShortcut.register(TOGGLE_SHORTCUT, toggleVisibility)) {
      console.warn(`[main] could not register ${TOGGLE_SHORTCUT}`);
    }
  });

  app.on('before-quit', persist);
  app.on('will-quit', () => globalShortcut.unregisterAll());
  app.on('window-all-closed', () => app.quit());
}
