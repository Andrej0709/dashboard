// Renders the app icon as square, full-bleed PNGs for the phone web app (the phone rounds the corners itself).
// Writes public/icons/icon-512.png, icon-192.png and apple-touch-icon.png (180).
// Run with: npm run icon:pwa
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

// same artwork as scripts/make-icon.cjs, drawn at 2x and without the rounded corners
const html = `<!doctype html><html><body style="margin:0;background:#2b2330;overflow:hidden">
<div style="zoom:2;width:256px;height:256px;position:relative;overflow:hidden;
  background:linear-gradient(160deg,#fdba74 0%,#f97316 28%,#9f4a2e 58%,#2b2330 100%)">
  <div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 20% 0%,rgba(255,255,255,.55),transparent 55%)"></div>
  <div style="position:absolute;left:38px;top:58px;width:180px;height:150px;border-radius:34px;
    background:linear-gradient(145deg,rgba(255,255,255,.42),rgba(255,255,255,.12));
    box-shadow:inset 0 2px 0 rgba(255,255,255,.7),inset 0 0 0 2px rgba(255,255,255,.28),0 22px 40px -14px rgba(0,0,0,.6)">
    <div style="position:absolute;left:30px;bottom:26px;width:26px;height:52px;border-radius:13px;background:rgba(255,255,255,.72)"></div>
    <div style="position:absolute;left:77px;bottom:26px;width:26px;height:98px;border-radius:13px;
      background:linear-gradient(180deg,#7ab6ff,#3b82f6);box-shadow:0 0 22px rgba(59,130,246,.9)"></div>
    <div style="position:absolute;left:124px;bottom:26px;width:26px;height:72px;border-radius:13px;background:rgba(255,255,255,.72)"></div>
  </div>
</div></body></html>`;

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 512, height: 512, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
  let shot = null;
  win.webContents.on('paint', (_event, _dirty, image) => {
    shot = image;
  });
  win.webContents.setFrameRate(30);
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  for (let i = 0; i < 40 && !shot; i++) await new Promise((r) => setTimeout(r, 100));
  await new Promise((r) => setTimeout(r, 300));
  if (!shot) {
    console.error('no frame was rendered');
    app.exit(1);
    return;
  }
  const out = path.join(__dirname, '..', 'public', 'icons');
  fs.mkdirSync(out, { recursive: true });
  const size = (n) => shot.resize({ width: n, height: n, quality: 'best' }).toPNG();
  fs.writeFileSync(path.join(out, 'icon-512.png'), size(512));
  fs.writeFileSync(path.join(out, 'icon-192.png'), size(192));
  fs.writeFileSync(path.join(out, 'apple-touch-icon.png'), size(180));
  console.log('pwa icons written to public/icons');
  app.quit();
});
