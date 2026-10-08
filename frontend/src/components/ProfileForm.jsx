import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { BLOCKS, DAYS, LEVELS, OPTIONS, splitSubjects } from '../lib/format';
import { ChoiceCards, cx } from './ui';

// --- conversion between the API and the form -----------------------------------------

function minutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

export function availabilityToKeys(rows = []) {
  const keys = new Set();
  for (const r of rows) {
    const s = minutes(r.start_time);
    const e = minutes(r.end_time) || 24 * 60;
    for (const b of BLOCKS) {
      if (s < minutes(b.end) && e > minutes(b.start)) keys.add(`${r.day_of_week}|${b.key}`);
    }
  }
  return keys;
}

export function keysToAvailability(keys) {
  const rows = [];
  for (const day of DAYS) {
    let current = null;
    for (const b of BLOCKS) {
      if (keys.has(`${day}|${b.key}`)) {
        if (current) current.end_time = b.end;
        else current = { day_of_week: day, start_time: b.start, end_time: b.end };
      } else if (current) {
        rows.push(current);
        current = null;
      }
    }
    if (current) rows.push(current);
  }
  return rows;
}

export function prefToForm(pref, availability) {
  return {
    subjects: splitSubjects(pref?.subjects_of_interest),
    subject_levels: { ...(pref?.subject_levels || {}) },
    competency_level: pref?.competency_level || '',
    learning_style: pref?.learning_style || '',
    communication_preference: pref?.communication_preference || '',
    preferred_study_type: pref?.preferred_study_type || 'Group',
    collaboration_tendency: pref?.collaboration_tendency || 'Collaborative Peer',
    preferred_group_size: pref?.preferred_group_size || 4,
    availability: availabilityToKeys(availability || []),
  };
}

export function formToPref(form) {
  const levels = Object.fromEntries(form.subjects.map((s) => [s, form.subject_levels[s] || 'Intermediate']));
  // The overall level defaults to the most common subject level.
  const counts = Object.values(levels).reduce((a, l) => ({ ...a, [l]: (a[l] || 0) + 1 }), {});
  const overall = form.competency_level || Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Intermediate';
  return {
    subjects_of_interest: form.subjects.join(', '),
    subject_levels: levels,
    competency_level: overall,
    learning_style: form.learning_style || null,
    communication_preference: form.communication_preference || null,
    preferred_study_type: form.preferred_study_type,
    collaboration_tendency: form.collaboration_tendency,
    preferred_group_size: form.preferred_group_size,
  };
}

export function validate(form, step) {
  if (step === 'subjects' && !form.subjects.length) return 'Choose at least one subject.';
  if (step === 'style' && (!form.learning_style || !form.communication_preference)) return 'Choose a learning style and how you like to communicate.';
  if (step === 'availability' && !form.availability.size) return 'Mark at least one time you are free.';
  return null;
}

// --- sections ----------------------------------------------------------------------------

function Section({ title, hint, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function SubjectsSection({ form, set, catalogue }) {
  const [custom, setCustom] = useState('');
  const chosen = new Set(form.subjects.map((s) => s.toLowerCase()));
  // Functional updates, so quick clicks never overwrite each other.
  const toggle = (name) => set((f) => (f.subjects.some((s) => s.toLowerCase() === name.toLowerCase())
    ? { subjects: f.subjects.filter((s) => s.toLowerCase() !== name.toLowerCase()) }
    : { subjects: [...f.subjects, name], subject_levels: { ...f.subject_levels, [name]: f.subject_levels[name] || 'Intermediate' } }));
  const addCustom = () => {
    const name = custom.trim();
    if (name && !chosen.has(name.toLowerCase())) toggle(name);
    setCustom('');
  };
  const extra = form.subjects.filter((s) => !catalogue.some((c) => c.name.toLowerCase() === s.toLowerCase()));

  return (
    <Section title="Subjects and your level" hint="Pick the subjects you want to study with others and rate yourself honestly. Groups mix levels so stronger and weaker students learn from each other.">
      <div className="grid gap-3 md:grid-cols-2">
        {[...catalogue.map((c) => c.name), ...extra].map((name) => {
          const on = chosen.has(name.toLowerCase());
          const key = form.subjects.find((s) => s.toLowerCase() === name.toLowerCase()) || name;
          return (
            <div key={name} className={cx('rounded-xl border-2 p-4 transition', on ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200 bg-white')}>
              <button type="button" onClick={() => toggle(name)} className="flex w-full items-center gap-3 text-left" aria-pressed={on}>
                <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="font-semibold text-slate-900">{name}</span>
              </button>
              {on && (
                <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200" role="radiogroup" aria-label={`Your level in ${name}`}>
                  {LEVELS.map((l) => (
                    <button key={l} type="button" role="radio" aria-checked={form.subject_levels[key] === l}
                      onClick={() => set({ subject_levels: { ...form.subject_levels, [key]: l } })}
                      className={cx('rounded-md px-1 py-1.5 text-[11px] font-semibold transition sm:text-xs',
                        (form.subject_levels[key] || 'Intermediate') === l ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input className="input" placeholder="Another subject, e.g. Calculus" value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} aria-label="Add another subject" />
        <button type="button" onClick={addCustom} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </Section>
  );
}

export function StyleSection({ form, set }) {
  return (
    <div className="space-y-8">
      <Section title="How do you want to study?" hint="A group, one study buddy, or let the AI decide.">
        <ChoiceCards options={OPTIONS.preferred_study_type} value={form.preferred_study_type} onChange={(v) => set({ preferred_study_type: v })} />
        {form.preferred_study_type !== 'Buddy' && (
          <div>
            <p className="label">Preferred group size</p>
            <div className="inline-flex rounded-lg bg-slate-100 p-1" role="radiogroup" aria-label="Preferred group size">
              {[3, 4, 5, 6].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={form.preferred_group_size === n} onClick={() => set({ preferred_group_size: n })}
                  className={cx('rounded-md px-4 py-1.5 text-sm font-semibold', form.preferred_group_size === n ? 'bg-white text-brand-700 shadow' : 'text-slate-600')}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </Section>
      <Section title="How do you usually work in a group?" hint="Two strong leaders often clash, so this helps balance the group.">
        <ChoiceCards options={OPTIONS.collaboration_tendency} value={form.collaboration_tendency} onChange={(v) => set({ collaboration_tendency: v })} />
      </Section>
      <Section title="How do you learn best?">
        <ChoiceCards options={OPTIONS.learning_style} value={form.learning_style} onChange={(v) => set({ learning_style: v })} columns={4} />
      </Section>
      <Section title="How do you like to communicate?">
        <ChoiceCards options={OPTIONS.communication_preference} value={form.communication_preference} onChange={(v) => set({ communication_preference: v })} columns={4} />
      </Section>
    </div>
  );
}

export function AvailabilitySection({ form, set }) {
  const keys = form.availability;
  const toggle = (k) => set((f) => {
    const next = new Set(f.availability);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    return { availability: next };
  });
  const toggleDay = (day) => {
    const next = new Set(keys);
    const all = BLOCKS.every((b) => next.has(`${day}|${b.key}`));
    BLOCKS.forEach((b) => (all ? next.delete(`${day}|${b.key}`) : next.add(`${day}|${b.key}`)));
    set({ availability: next });
  };
  return (
    <Section title="When are you free to study?" hint="Tap every time you could meet each week. More free time means better matches - a group is only formed when everyone shares a time.">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[560px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-28" />
              {DAYS.map((d) => (
                <th key={d}>
                  <button type="button" onClick={() => toggleDay(d)} className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100" title={`Select all of ${d}`}>
                    {d.slice(0, 3)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((b) => (
              <tr key={b.key}>
                <td className="pr-2 text-xs">
                  <span className="font-semibold text-slate-700">{b.label}</span>
                  <span className="block text-slate-400">{b.start}-{b.end === '23:59' ? '24:00' : b.end}</span>
                </td>
                {DAYS.map((d) => {
                  const k = `${d}|${b.key}`;
                  const on = keys.has(k);
                  return (
                    <td key={k}>
                      <button type="button" onClick={() => toggle(k)} aria-pressed={on} aria-label={`${d} ${b.label}`}
                        className={cx('flex h-11 w-full items-center justify-center rounded-lg border transition',
                          on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-transparent hover:border-brand-300 hover:bg-brand-50')}>
                        <Check className="h-4 w-4" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span><b className="text-slate-800">{keys.size}</b> time blocks selected</span>
        {keys.size > 0 && (
          <button type="button" onClick={() => set({ availability: new Set() })} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-800">
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>
    </Section>
  );
}
