import { useEffect, useState } from 'react';
import { Button, Field, Modal, Swatches } from './ui';
import { useStore } from '../store';
import { todayKey } from '../lib/date';

const EVENT_COLORS = ['blue', 'amber', 'rose', 'violet', 'green'];

export default function EventModal({ open, onClose, date }) {
  const addEvent = useStore((s) => s.addEvent);
  const [f, setF] = useState({ title: '', date: todayKey(), start: '09:00', end: '10:00', color: 'blue', location: '' });
  const set = (patch) => setF((v) => ({ ...v, ...patch }));

  useEffect(() => {
    if (open) setF({ title: '', date: date ?? todayKey(), start: '09:00', end: '10:00', color: 'blue', location: '' });
  }, [open, date]);

  const valid = f.title.trim() && f.date && f.start && f.end && f.end > f.start;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    addEvent({ ...f, title: f.title.trim(), location: f.location.trim() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New event" subtitle="Add something to your schedule">
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5">
        <Field label="Title">
          <input autoFocus className="field" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Study session" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date">
            <input type="date" className="field" value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Starts">
            <input type="time" className="field" value={f.start} onChange={(e) => set({ start: e.target.value })} />
          </Field>
          <Field label="Ends">
            <input type="time" className="field" value={f.end} onChange={(e) => set({ end: e.target.value })} />
          </Field>
        </div>
        {f.start && f.end && f.end <= f.start && (
          <p className="-mt-1 text-[11px] text-rose-300">The end time has to be after the start time.</p>
        )}
        <Field label="Location (optional)">
          <input className="field" value={f.location} onChange={(e) => set({ location: e.target.value })} placeholder="Where?" />
        </Field>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium text-white/55">Colour</span>
          <Swatches value={f.color} onChange={(color) => set({ color })} options={EVENT_COLORS} />
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="soft" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={!valid} className={valid ? '' : 'opacity-50'}>Add event</Button>
        </div>
      </form>
    </Modal>
  );
}
