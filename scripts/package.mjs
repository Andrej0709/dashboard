// Builds release/Glassy Dashboard-win32-x64/Glassy Dashboard.exe
// Run with: npm run package   (runs `vite build` first)
import { packager } from '@electron/packager';

// Vite already bundled every dependency into dist/, so the app only needs these.
const keep = ['/package.json', '/electron', '/dist'];

const [out] = await packager({
  dir: '.',
  name: 'Glassy Dashboard',
  platform: 'win32',
  arch: 'x64',
  out: 'release',
  overwrite: true,
  asar: true,
  icon: 'build/icon.ico',
  appCopyright: 'Personal use',
  ignore: (file) => file !== '' && !keep.some((k) => file === k || file.startsWith(`${k}/`)),
});

console.log(`packaged: ${out}`);
