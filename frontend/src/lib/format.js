export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Free-time grid: each block is saved as one availability row (day, start, end).
export const BLOCKS = [
  { key: 'morning', label: 'Morning', start: '08:00', end: '12:00' },
  { key: 'afternoon', label: 'Afternoon', start: '12:00', end: '17:00' },
  { key: 'evening', label: 'Evening', start: '17:00', end: '21:00' },
  { key: 'night', label: 'Night', start: '21:00', end: '23:59' },
];

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const LEVEL_TONE = { Beginner: 'amber', Intermediate: 'sky', Advanced: 'emerald', Expert: 'violet' };

export const OPTIONS = {
  preferred_study_type: [
    { value: 'Group', label: 'Study group', hint: '3-6 students working together' },
    { value: 'Buddy', label: 'Study buddy', hint: 'One partner, one-to-one' },
    { value: 'Either', label: 'Either', hint: 'Whatever gives the best match' },
  ],
  collaboration_tendency: [
    { value: 'Collaborative Peer', label: 'Collaborative peer', hint: 'I share the work evenly' },
    { value: 'Driven Leader', label: 'Driven leader', hint: 'I take the initiative and organise' },
    { value: 'Focused Learner', label: 'Focused learner', hint: 'I go deep on my part' },
  ],
  learning_style: [
    { value: 'Visual', label: 'Visual', hint: 'Diagrams, images, mind maps' },
    { value: 'Auditory', label: 'Auditory', hint: 'Listening and discussing' },
    { value: 'Reading/Writing', label: 'Reading / writing', hint: 'Notes and texts' },
    { value: 'Kinesthetic', label: 'Hands-on', hint: 'Practice and examples' },
  ],
  communication_preference: [
    { value: 'Text', label: 'Text chat', hint: 'Messages and forums' },
    { value: 'Voice', label: 'Voice calls', hint: 'Audio only' },
    { value: 'Video', label: 'Video calls', hint: 'Zoom, Meet, Teams' },
    { value: 'In-Person', label: 'In person', hint: 'Campus or library' },
  ],
};

export function optionLabel(field, value) {
  return OPTIONS[field]?.find((o) => o.value === value)?.label ?? value ?? '-';
}

export function pct(x, digits = 0) {
  if (x === null || x === undefined) return '-';
  return `${(x * 100).toFixed(digits)}%`;
}

export function num(x, digits = 1) {
  if (x === null || x === undefined) return '-';
  return Number(x).toFixed(digits);
}

// The API sends UTC times without a zone marker; treat them as UTC.
export function toDate(iso) {
  if (!iso) return null;
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

export function dateTime(iso) {
  const d = toDate(iso);
  return d ? d.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
}

export function dateOnly(iso) {
  const d = toDate(iso);
  return d ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export function timeAgo(iso) {
  const d = toDate(iso);
  if (!d) return '';
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} d ago`;
  return dateOnly(iso);
}

export function initials(name = '') {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export function splitSubjects(text) {
  return (text || '').split(',').map((s) => s.trim()).filter(Boolean);
}
