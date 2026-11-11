import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ExternalLink, Bookmark, Trash2 } from 'lucide-react';
import { Button, Empty, Field, Glass, Modal, PageHeader, Segmented, Swatches, stagger } from '../components/ui';
import { LINK_TAGS, useStore } from '../store';
import { fmtShort } from '../lib/date';
import { colorOf, domainOf } from '../lib/format';
import { LINK_ICONS } from '../lib/icons';

const LINK_COLORS = ['blue', 'amber', 'violet', 'green', 'rose'];

const normalizeUrl = (raw) => {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.includes('.') ? u.href : null;
  } catch {
    return null;
  }
};

function LinkModal({ open, onClose }) {
  const addLink = useStore((s) => s.addLink);
  const blank = { url: '', title: '', description: '', tag: LINK_TAGS[0], color: 'blue', icon: 'layers' };
  const [f, setF] = useState(blank);
  const set = (patch) => setF((v) => ({ ...v, ...patch }));
  useEffect(() => {
    if (open) setF(blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const url = normalizeUrl(f.url);
  const submit = (e) => {
    e.preventDefault();
    if (!url) return;
    addLink({ ...f, url, title: f.title.trim() || domainOf(url), description: f.description.trim() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add link" subtitle="Save something to come back to">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5">
        <Field label="Address">
          <input autoFocus className="field" value={f.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://example.com/article" />
        </Field>
        {f.url.trim() && !url && <p className="-mt-1 text-[11px] text-rose-300">That doesn't look like a web address.</p>}
        <Field label="Title">
          <input className="field" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="Leave empty to use the site name" />
        </Field>
        <Field label="Description (optional)">
          <input className="field" value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="Why is it worth keeping?" />
        </Field>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium text-white/55">Type</span>
          <Segmented className="w-full" glass={false} options={LINK_TAGS} value={f.tag} onChange={(tag) => set({ tag })} />
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="mb-1.5 block text-[11px] font-medium text-white/55">Colour</span>
            <Swatches value={f.color} onChange={(color) => set({ color })} options={LINK_COLORS} />
          </div>
          <div>
            <span className="mb-1.5 block text-[11px] font-medium text-white/55">Icon</span>
            <div className="flex gap-1.5">
              {Object.entries(LINK_ICONS).slice(0, 6).map(([key, Icon]) => (
                <button key={key} type="button" aria-label={key} aria-pressed={f.icon === key} onClick={() => set({ icon: key })}
                  className={`grid size-7 place-items-center rounded-full border transition-colors ${f.icon === key ? 'border-white bg-white text-neutral-900' : 'border-white/10 bg-white/[0.07] text-white/75 hover:bg-white/[0.14]'}`}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" className={url ? '' : 'opacity-50'}>Save link</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Saved() {
  const links = useStore((s) => s.links);
  const deleteLink = useStore((s) => s.deleteLink);
  const [tag, setTag] = useState('All');
  const [modal, setModal] = useState(false);
  const shown = links.filter((l) => tag === 'All' || l.tag === tag);
  const open = (url) => window.open(url, '_blank', 'noopener');

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit="exit">
      <PageHeader title="Saved" subtitle="Articles, videos and tools worth coming back to">
        <Segmented options={['All', ...LINK_TAGS]} value={tag} onChange={setTag} />
        <Button variant="primary" icon={Plus} onClick={() => setModal(true)}>Add link</Button>
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(204px,1fr))] gap-[18px] max-md:grid-cols-2 max-md:gap-3">
          {shown.map((l) => {
            const c = colorOf(l.color);
            const Icon = LINK_ICONS[l.icon] ?? Bookmark;
            return (
              <Glass key={l.id} lift layout className="flex flex-col p-2.5">
                <button
                  type="button" onClick={() => open(l.url)} aria-label={`Open ${l.title}`}
                  className="relative h-[92px] w-full overflow-hidden rounded-[16px] text-left"
                  style={{ background: `linear-gradient(150deg, ${c.hex}cc 0%, ${c.solid}99 100%)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.12)' }}
                >
                  <span className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.28), transparent 55%)' }} />
                  <Icon size={22} strokeWidth={1.8} className="absolute left-3 top-3 text-white" />
                  <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/25 bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">{l.tag}</span>
                </button>
                <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
                  <p className="truncate text-[13px] font-semibold text-white">{l.title}</p>
                  <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] leading-4 text-white/55">{l.description}</p>
                  <div className="mt-3 flex items-center gap-1 border-t border-white/10 pt-2">
                    <span className="min-w-0 flex-1 truncate text-[10px] text-white/45">{domainOf(l.url)} · {fmtShort(new Date(l.createdAt))}</span>
                    <button type="button" aria-label={`Open ${l.title} in browser`} onClick={() => open(l.url)} className="grid size-6 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                      <ExternalLink size={12} />
                    </button>
                    <button type="button" aria-label={`Remove ${l.title}`} title="Remove from saved" onClick={() => deleteLink(l.id)} className="group grid size-6 place-items-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-rose-300">
                      <Bookmark size={12} fill="currentColor" className="group-hover:hidden" />
                      <Trash2 size={12} className="hidden group-hover:block" />
                    </button>
                  </div>
                </div>
              </Glass>
            );
          })}
      </div>

      {!shown.length && (
        <Glass className="p-5">
          <Empty icon={Bookmark} title={links.length ? `Nothing saved under ${tag}` : 'No saved links yet'} hint="Use Add link to keep an article, video or tool here." />
        </Glass>
      )}

      <LinkModal open={modal} onClose={() => setModal(false)} />
    </motion.div>
  );
}
