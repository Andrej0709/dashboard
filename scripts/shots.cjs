// Dev check: opens the built app with a throwaway profile and demo data, then saves a PNG of every page.
// Usage: electron scripts/shots.cjs <outDir> [width] [height]
// Your real data is never touched; the throwaway profile lives inside <outDir>.
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const [outDir, w = '1440', h = '900'] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: electron scripts/shots.cjs <outDir> [width] [height]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
app.setPath('userData', path.join(outDir, 'profile'));

const seed = `(() => {
  const pad = (n) => String(n).padStart(2, '0');
  const key = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const iso = (o) => { const d = new Date(); d.setDate(d.getDate() + o); d.setHours(0, 1, 0, 0); return d.toISOString(); };
  let n = 0; const id = () => 't' + n++;
  const tasks = [['Plan the week', 0, 'high', 'personal', false], ['Finish portfolio landing page with a very long title that has to truncate somewhere', 0, 'high', 'work', false],
    ['Reply to emails', -1, 'med', 'work', false], ['Read 20 pages', 1, 'low', 'personal', false], ['Prepare for the exam', 3, 'high', 'study', false],
    ['Old thing', -2, 'med', 'study', true], ['Another done', -1, 'med', 'work', true], ['Done today', 0, 'med', 'personal', true], ['Earlier', -3, 'med', 'personal', true], ['Earlier 2', -3, 'med', 'personal', true]]
    .map(([title, due, priority, list, done], i) => ({ id: id(), title, done, doneAt: done ? iso(due) : null, createdAt: iso(-3), due: key(due), priority, list, notes: '', starred: i === 1 }));
  const habits = [['Workout', 'dumbbell', 'rose'], ['Read', 'book', 'amber'], ['Drink 2L of water', 'droplets', 'blue'], ['Sleep before midnight', 'moon', 'violet']]
    .map(([name, icon, color], i) => { const log = {}; for (let d = -13; d <= 0; d++) if ((d + i) % 3 !== 0) log[key(d)] = true; return { id: id(), name, icon, color, log, createdAt: iso(-14) }; });
  const events = [[0, '07:30', '08:30', 'Morning workout', 'green', 'Gym'], [0, '10:00', '12:00', 'Deep work — portfolio', 'amber', ''], [0, '14:00', '15:30', 'Study session', 'rose', 'Library'],
    [0, '19:00', '19:45', 'Evening walk', 'violet', ''], [1, '09:00', '09:30', 'Weekly planning', 'blue', ''], [2, '18:00', '20:00', 'Dinner with friends', 'amber', 'City centre'], [2, '10:00', '11:00', 'Second', 'blue', ''], [2, '12:00', '13:00', 'Third', 'rose', '']]
    .map(([d, start, end, title, color, location]) => ({ id: id(), date: key(d), start, end, title, color, location }));
  const tx = [[-20, 'income', 180000, 'Salary', 'Monthly salary'], [-18, 'expense', 35000, 'Bills', 'Rent'], [-10, 'expense', 4200, 'Food', 'Groceries'], [-6, 'expense', 1800, 'Transport', 'Bus pass'],
    [-4, 'expense', 6500, 'Shopping', 'Sneakers'], [-2, 'expense', 2300, 'Fun', 'Cinema'], [-1, 'expense', 2800, 'Health', 'Gym'], [0, 'expense', 680, 'Food', 'Coffee and a sandwich']]
    .map(([d, type, amount, category, note]) => ({ id: id(), date: key(d), type, amount, category, note }));
  const links = [['React documentation', 'https://react.dev/learn', 'The official guide to thinking in React.', 'Articles', 'blue', 'layers'], ['Tailwind CSS docs', 'https://tailwindcss.com/docs', 'Utility classes, theming and layout reference.', 'Tools', 'amber', 'sparkles'],
    ['Easing functions cheat sheet', 'https://easings.net', 'Every cubic-bezier you need for natural motion.', 'Tools', 'violet', 'zap'], ['Motion for React', 'https://motion.dev/docs/react', 'Springs and layout animations.', 'Articles', 'green', 'file']]
    .map(([title, url, description, tag, color, icon]) => ({ id: id(), title, url, description, tag, color, icon, createdAt: iso(-2) }));
  const activity = [['money', 'Spent', 'Coffee and a sandwich'], ['task', 'Completed', 'Done today'], ['habit', 'Checked in', 'Read'], ['event', 'Scheduled', 'Dinner with friends'], ['link', 'Saved', 'React documentation'], ['task', 'Added', 'Plan the week']]
    .map(([kind, verb, text]) => ({ id: id(), kind, verb, text, at: iso(0) }));
  const raw = JSON.parse(localStorage.getItem('glassy-dashboard') || '{}');
  localStorage.setItem('glassy-dashboard', JSON.stringify({ state: { ...(raw.state || {}), sample: false, tasks, habits, events, tx, links, activity }, version: 2 }));
})()`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: Number(w), height: Number(h), useContentSize: true, show: true, backgroundColor: '#14110f' });
  win.setMenu(null);
  const index = path.join(__dirname, '..', 'dist', 'index.html');
  await win.loadFile(index);
  await win.webContents.executeJavaScript(seed);
  await win.loadFile(index);
  await wait(4000);

  const shoot = async (name) => fs.writeFileSync(path.join(outDir, `${name}.png`), (await win.webContents.capturePage()).toPNG());
  const click = (js) => win.webContents.executeJavaScript(`(${js}).click()`);

  for (const page of ['Home', 'Tasks', 'Calendar', 'Habits', 'Finance', 'Weather', 'Saved']) {
    await click(`document.querySelector('nav[aria-label="Sections"] button[aria-label="${page}"]')`);
    await wait(2500);
    await shoot(page.toLowerCase());
    const more = await win.webContents.executeJavaScript(`(() => { const m = document.querySelector('main'); if (m.scrollHeight <= m.clientHeight + 20) return false; m.scrollTo(0, m.scrollHeight); return true; })()`);
    if (more) {
      await wait(600);
      await shoot(`${page.toLowerCase()}-bottom`);
    }
  }
  await click(`[...document.querySelectorAll('nav[aria-label="Main"] button')].find((b) => b.textContent.includes('Settings'))`);
  await wait(2500);
  await shoot('settings');
  app.quit();
});
