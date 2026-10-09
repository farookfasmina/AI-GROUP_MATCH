import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Scale, Star, TrendingUp, UsersRound } from 'lucide-react';
import { cx, TILE_COLORS } from '../components/ui';
import { homeFor, useAuth } from '../context/AuthContext';

// Landing page in the same look as the app: gradient ground, white panels, colour tiles.
// Motion is the shared CSS in index.css (sm-enter on load, sm-reveal on scroll, sm-marquee).

const EXAMPLES = [
  { subject: 'Database Systems', kind: 'Group of 4', score: 86, color: 0, slot: 'Thursday evening',
    people: ['Amaya Perera', 'Nimal Silva', 'Kavindu Jayasinghe', 'Dilini Fernando'],
    reasons: ['Same subject, mixed levels: 2 advanced, 2 beginner', 'All four free on Thursday evening', 'Everyone prefers discussing out loud'] },
  { subject: 'Data Structures & Algorithms', kind: 'Study buddy', score: 79, color: 1, slot: 'Saturday afternoon',
    people: ['Amaya Perera', 'Ishan Wickrama'],
    reasons: ['One advanced, one beginner', 'Both free on Saturday afternoon', 'Both like working through problems together'] },
  { subject: 'Machine Learning', kind: 'Group of 3', score: 82, color: 3, slot: 'Wednesday afternoon',
    people: ['Amaya Perera', 'Tharushi Bandara', 'Ravindu Herath'],
    reasons: ['Same subject and similar weekly hours', 'All three free on Wednesday afternoon', 'One leader, two collaborators'] },
];

const SUBJECTS = ['Database Systems', 'Data Structures & Algorithms', 'Computer Networks', 'Machine Learning', 'Software Engineering',
  'Web Development', 'Statistics', 'Information Security', 'Programming Fundamentals'];

const HOW = [
  [TrendingUp, 'Similar students first', "A k-nearest-neighbours model compares your subjects, weekly hours and study habits with everyone else's and picks the closest people."],
  [Scale, 'Then the group is balanced', 'Levels are mixed so someone can explain and someone can ask. Two people who both want to lead are kept apart.'],
  [Clock, "Nobody is put in a group they can't meet", "Every member has to share at least one free hour. If that isn't possible yet, you wait for the next round instead."],
  [Star, 'Ratings change the weights', 'After a few sessions you rate the group. Those ratings re-train how much each factor counts, using logistic regression.'],
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const PEOPLE = [
  { name: 'Amaya', color: '#c98500', free: ['Mon-Evening', 'Tue-Morning', 'Thu-Evening', 'Sat-Morning', 'Sat-Afternoon'] },
  { name: 'Nimal', color: '#c2389a', free: ['Tue-Evening', 'Wed-Afternoon', 'Thu-Evening', 'Sat-Afternoon'] },
  { name: 'Kavindu', color: '#3b55e6', free: ['Mon-Evening', 'Wed-Afternoon', 'Thu-Evening', 'Fri-Morning', 'Sun-Afternoon'] },
];

const FILL = [
  ['Subjects and level', 'Database Systems - advanced; Data Structures & Algorithms - beginner'],
  ['Group or buddy', 'A group of 3-6, one study partner, or either'],
  ['Free time', 'Morning, afternoon, evening or night, for each day of the week'],
  ['How you work', 'Lead, collaborate or focus on your part; how you learn; how you like to talk'],
  ['Not asked', 'Gender, ethnicity, religion. You agree to take part first and can withdraw from your profile page.'],
];

const PANEL = 'rounded-[28px] bg-white shadow-[0_18px_50px_-24px_rgba(49,46,129,0.45)]';
const PRIMARY = 'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4f7cff] to-[#5b4ff0] font-bold text-white shadow-[0_10px_24px_-10px_rgba(79,70,229,0.8)] transition hover:brightness-110 active:scale-[0.97]';
const ROUND = 'flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200';

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('');
}

// Example matches: slides on its own every 4.5 s, stops while the pointer or keyboard focus is on it.
function ExampleSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (n) => setI((n + EXAMPLES.length) % EXAMPLES.length);
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 4500);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div className={cx(PANEL, 'sm-enter flex min-w-0 flex-[1_1_400px] flex-col gap-4 p-6')} style={{ animationDelay: '0.2s' }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight">Example matches</h2>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous example" onClick={() => go(i - 1)} className={ROUND}><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Next example" onClick={() => go(i + 1)} className={ROUND}><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden rounded-[22px]">
        <div className="flex w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
          {EXAMPLES.map((s, n) => (
            <article key={s.subject} aria-hidden={n !== i} aria-label={`Example ${n + 1} of ${EXAMPLES.length}: ${s.subject}`}
              className={cx('flex min-h-[330px] w-full shrink-0 flex-col gap-4 p-6 text-slate-900', TILE_COLORS[s.color].tile)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900/75">{s.kind}</p>
                  <p className="text-2xl font-extrabold leading-tight tracking-tight">{s.subject}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/70 px-3.5 py-2 text-[15px] font-extrabold">{s.score}% match</span>
              </div>
              <div className="flex items-center">
                {s.people.map((p) => (
                  <span key={p} title={p} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white/90 bg-indigo-950 text-[13px] font-bold text-white">{initials(p)}</span>
                ))}
                <span className="pl-5 text-sm font-semibold">{s.people.map((p) => p.split(' ')[0]).join(', ')}</span>
              </div>
              <ul className="space-y-2 text-sm font-semibold">
                {s.reasons.map((r) => <li key={r} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" strokeWidth={2.6} />{r}</li>)}
              </ul>
              <p className="mt-auto flex items-center gap-2 rounded-2xl bg-white/70 px-3.5 py-3 text-sm font-bold"><CalendarDays className="h-[18px] w-[18px]" />Meets {s.slot}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        {EXAMPLES.map((s, n) => (
          <button key={s.subject} type="button" aria-label={`Show example ${n + 1}`} aria-current={n === i}
            onClick={() => go(n)} className={cx('h-2.5 rounded-full transition-all duration-300', n === i ? 'w-8 bg-indigo-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400')} />
        ))}
      </div>
    </div>
  );
}

function Timetable() {
  return (
    <div className="min-w-0 flex-[1.5_1_480px] overflow-x-auto">
      <div className="grid min-w-[520px] grid-cols-[96px_repeat(7,minmax(0,1fr))] gap-1.5">
        <span />
        {DAYS.map((d) => <span key={d} className="py-1.5 text-center text-[13px] font-bold text-slate-600">{d}</span>)}
        {SLOTS.map((slot) => [
          <span key={slot} className="flex items-center text-[13px] font-bold text-slate-600">{slot}</span>,
          ...DAYS.map((d) => {
            const here = PEOPLE.filter((p) => p.free.includes(`${d}-${slot}`));
            const all = here.length === PEOPLE.length;
            return (
              <div key={d + slot} title={`${d} ${slot.toLowerCase()}: ${all ? 'all three free' : `${here.map((p) => p.name).join(', ') || 'nobody'} free`}`}
                className={cx('flex h-[52px] items-center justify-center gap-1 rounded-2xl', all ? `${TILE_COLORS[0].tile} shadow-[0_10px_22px_-10px_rgba(217,119,6,0.8)]` : 'bg-slate-100')}>
                {here.map((p) => <span key={p.name} className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />)}
              </div>
            );
          }),
        ])}
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const start = user ? homeFor(user) : '/register';
  const navLink = 'rounded-full px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50';

  return (
    <div className="min-h-screen px-4 pb-10 pt-5 text-slate-900">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-7">
        <header className={cx(PANEL, 'sm-enter flex flex-wrap items-center justify-between gap-3 rounded-[28px] py-2.5 pl-5 pr-2.5 sm:rounded-full')}>
          <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-gradient-to-br from-[#4f7cff] to-[#5b4ff0]"><UsersRound className="h-5 w-5 text-white" /></span>
            StudyMatch AI
          </Link>
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
            <a href="#how" className={navLink}>How it works</a>
            <a href="#time" className={navLink}>Free time</a>
            <a href="#share" className={navLink}>What you share</a>
            {user ? <Link to={homeFor(user)} className={cx(PRIMARY, 'px-5 py-2.5 text-sm')}>Open my dashboard</Link> : (
              <>
                <Link to="/login" className={navLink}>Sign in</Link>
                <Link to="/register" className={cx(PRIMARY, 'px-5 py-2.5 text-sm')}>Create account</Link>
              </>
            )}
          </nav>
        </header>

        <section className="flex flex-wrap items-stretch gap-7">
          <div className={cx(PANEL, 'sm-enter flex min-w-0 flex-[1.1_1_440px] flex-col justify-center gap-5 px-7 py-10 sm:px-11 sm:py-12')} style={{ animationDelay: '0.08s' }}>
            <h1 className="text-[clamp(36px,4.6vw,56px)] font-extrabold leading-[1.04] tracking-[-0.035em]">Study with people who share your subjects and your free time.</h1>
            <p className="max-w-[34em] text-lg leading-relaxed text-slate-600">
              Tell StudyMatch what you study, your level, when you are free and how you like to work. It suggests study buddies, forms balanced groups, and learns from how each group rates its sessions.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link to={start} className={cx(PRIMARY, 'px-7 py-3.5 text-base')}>{user ? 'Open my dashboard' : 'Create an account'} <ArrowRight className="h-[18px] w-[18px]" /></Link>
              {!user && <Link to="/login" className="inline-flex items-center rounded-full bg-indigo-50 px-7 py-3.5 text-base font-bold text-slate-800 transition hover:bg-indigo-100">Sign in</Link>}
            </div>
            {!user && <p className="text-sm text-slate-500">Demo account: student@demo.lk / Demo@1234</p>}
          </div>
          <ExampleSlider />
        </section>

        <div className="sm-marquee-box sm-enter overflow-hidden py-1.5" style={{ animationDelay: '0.3s' }} aria-label="Subjects you can match on">
          <div className="sm-marquee">
            {SUBJECTS.concat(SUBJECTS).map((s, n) => (
              <span key={n} aria-hidden={n >= SUBJECTS.length} className="shrink-0 whitespace-nowrap rounded-full bg-white/80 px-5 py-3 text-[15px] font-bold text-indigo-950">{s}</span>
            ))}
          </div>
        </div>

        <section id="how" className="flex scroll-mt-6 flex-col gap-5 pt-6">
          <h2 className="sm-reveal text-[clamp(30px,3.4vw,42px)] font-extrabold tracking-[-0.03em]">How a group is formed</h2>
          <div className="flex flex-wrap gap-5">
            {HOW.map(([Icon, title, text], n) => (
              <article key={title} className={cx('sm-reveal sm-lift flex min-h-[280px] min-w-0 flex-[1_1_240px] flex-col gap-3.5 rounded-[28px] p-6 text-slate-900', TILE_COLORS[n].tile)}>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70"><Icon className="h-6 w-6" /></span>
                <h3 className="text-[21px] font-extrabold leading-tight tracking-tight">{title}</h3>
                <p className="text-[15px] font-medium leading-relaxed">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="time" className={cx(PANEL, 'sm-reveal flex scroll-mt-6 flex-wrap gap-8 p-7 sm:p-10')}>
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <h2 className="text-[clamp(28px,3vw,38px)] font-extrabold leading-tight tracking-[-0.03em]">Nobody is put in a group they can't meet</h2>
            <p className="leading-relaxed text-slate-600">Every member has to share at least one free hour. Amaya, Nimal and Kavindu only overlap on Thursday evening, so that becomes their meeting time. If no hour works yet, you wait for the next round instead.</p>
            <ul className="space-y-2.5 text-[15px] font-semibold text-slate-800">
              {PEOPLE.map((p) => <li key={p.name} className="flex items-center gap-2.5"><span className="h-3.5 w-3.5 rounded-full" style={{ background: p.color }} />{p.name} is free</li>)}
              <li className="flex items-center gap-2.5"><span className={cx('h-3.5 w-3.5 rounded', TILE_COLORS[0].tile)} />All three are free</li>
            </ul>
          </div>
          <Timetable />
        </section>

        <section id="share" className={cx(PANEL, 'sm-reveal flex scroll-mt-6 flex-wrap gap-8 p-7 sm:p-10')}>
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5">
            <h2 className="text-[clamp(28px,3vw,38px)] font-extrabold leading-tight tracking-[-0.03em]">What you tell it</h2>
            <p className="leading-relaxed text-slate-600">Five short steps when you sign up. You can change any of it later from Preferences.</p>
          </div>
          <dl className="min-w-0 flex-[2_1_480px]">
            {FILL.map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-6 gap-y-1.5 border-b border-slate-200 py-4">
                <dt className="flex-[0_0_180px] text-[15px] font-extrabold">{k}</dt>
                <dd className="flex-[1_1_260px] text-[15px] leading-relaxed text-slate-600">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={cx('sm-reveal flex flex-wrap items-center justify-between gap-5 rounded-[28px] px-7 py-9 text-slate-900 sm:px-10', TILE_COLORS[2].tile)}>
          <h2 className="flex-[1_1_360px] text-[clamp(24px,2.6vw,32px)] font-extrabold leading-tight tracking-[-0.025em]">Fill in your subjects and free time, and see your first matches.</h2>
          <div className="flex flex-wrap gap-3">
            <Link to={start} className="rounded-full bg-white px-6 py-3.5 font-extrabold text-indigo-950 transition hover:bg-indigo-50">{user ? 'Open my dashboard' : 'Create an account'}</Link>
            {!user && <Link to="/login" className="rounded-full bg-white/40 px-6 py-3.5 font-bold text-indigo-950 transition hover:bg-white/60">Sign in</Link>}
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-2 px-2 text-sm font-semibold text-indigo-950">
          <span>StudyMatch AI · Final-year project · BSc (Hons) IT · Horizon Campus</span>
          <span>F.F. Fasmina, S.F. Saheela · supervised by Ms. Anuradha Yapa</span>
        </footer>
      </div>
    </div>
  );
}
