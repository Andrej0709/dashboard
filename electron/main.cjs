const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

// DASH_DEV_URL: load the Vite dev server instead of the built files.
// DASH_CAPTURE: write a PNG of the window to this path once it has rendered, then quit (used to verify the build).
const devUrl = process.env.DASH_DEV_URL;
const capturePath = process.env.DASH_CAPTURE;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win = null;

  const createWindow = () => {
    win = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1120,
      minHeight: 700,
      show: false,
      backgroundColor: '#14110f',
      title: 'Glassy Dashboard',
      // content runs edge to edge; Windows draws its own buttons on top of the wallpaper
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: 'rgba(0,0,0,0)', symbolColor: '#ffffff', height: 34 },
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
    });

    win.once('ready-to-show', () => win.show());

    // links open in the real browser, never inside the app window
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (event, url) => {
      if (url !== win.webContents.getURL()) event.preventDefault();
    });

    if (devUrl) win.loadURL(devUrl);
    else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

    if (capturePath) {
      win.webContents.once('did-finish-load', () => {
        setTimeout(async () => {
          const image = await win.webContents.capturePage();
          fs.writeFileSync(capturePath, image.toPNG());
          app.quit();
        }, Number(process.env.DASH_CAPTURE_DELAY) || 4500);
      });
    }
  };

  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });

  app.on('window-all-closed', () => app.quit());
}
