// Renders the app icon with Chromium and writes build/icon.png + build/icon.ico.
// Run with: npm run icon
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const html = `<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">
<div style="width:256px;height:256px;border-radius:58px;position:relative;overflow:hidden;
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

/** ICO container holding PNG-encoded images (supported since Windows Vista). */
function toIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 256, height: 256, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
  // Offscreen windows hand every rendered frame to 'paint'; capturePage() never resolves for a hidden window on Windows.
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
  const out = path.join(__dirname, '..', 'build');
  fs.mkdirSync(out, { recursive: true });
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = sizes.map((size) => ({ size, png: shot.resize({ width: size, height: size, quality: 'best' }).toPNG() }));
  fs.writeFileSync(path.join(out, 'icon.png'), images[images.length - 1].png);
  fs.writeFileSync(path.join(out, 'icon.ico'), toIco(images));
  console.log(`icon written: ${sizes.join(', ')} px`);
  app.quit();
});
