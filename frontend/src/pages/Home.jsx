import { Link } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';

// Plain, editorial landing page: black on white, thin rules, one real picture of how matching works.
const SANS = { fontFamily: "'IBM Plex Sans', system-ui, sans-serif" };
const MONO = "font-['IBM_Plex_Mono',monospace]";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];
const PEOPLE = [
  { name: 'Amaya', color: '#E8A100', free: ['Mon-Evening', 'Tue-Morning', 'Thu-Evening', 'Sat-Morning', 'Sat-Afternoon'] },
  { name: 'Nimal', color: '#C2389A', free: ['Tue-Evening', 'Wed-Afternoon', 'Thu-Evening', 'Sat-Afternoon'] },
  { name: 'Kavindu', color: '#3B3BD6', free: ['Mon-Evening', 'Wed-Afternoon', 'Thu-Evening', 'Fri-Morning', 'Sun-Afternoon'] },
];

const HOW = [
  ['Similar students first', "A k-nearest-neighbours model compares your subjects, weekly hours and study habits with everyone else's and picks the closest people."],
  ['Then the group is balanced', 'Levels are mixed so someone can explain and someone can ask. Two people who both want to lead are kept apart.'],
  ["Nobody is put in a group they can't meet", "Every member has to share at least one free hour. If that isn't possible yet, you wait for the next round instead."],
  ['Ratings change the weights', 'After a few sessions you rate the group. Those ratings re-train how much each factor counts, using logistic regression.'],
];

const FILL = [
  ['Subjects and level', 'Database Systems - advanced; Data Structures & Algorithms - beginner'],
  ['Group or buddy', 'A group of 3-6, one study partner, or either'],
  ['Free time', 'Morning, afternoon, evening or night, for each day of the week'],
  ['How you work', 'Lead, collaborate or focus on your part; how you learn; how you like to talk'],
  ['Not asked', 'Gender, ethnicity, religion. You agree to take part first and can withdraw from your profile page.'],
];

function Timetable() {
  return (
    <figure className="m-0 min-w-0 flex-[1.3_1_520px]">
      <div className="overflow-x-auto">
        <div className="grid min-w-[520px] grid-cols-[92px_repeat(7,minmax(0,1fr))] border-l border-t border-l-[#DADADA] border-t-[#111]">
          <div className="border-b border-r border-[#DADADA]" />
          {DAYS.map((d) => <div key={d} className={`border-b border-r border-[#DADADA] px-1.5 py-2 text-xs text-[#555] ${MONO}`}>{d}</div>)}
          {SLOTS.map((slot) => [
            <div key={slot} className={`border-b border-r border-[#DADADA] px-1.5 py-2.5 text-xs text-[#555] ${MONO}`}>{slot}</div>,
            ...DAYS.map((d) => {
              const here = PEOPLE.filter((p) => p.free.includes(`${d}-${slot}`));
              const all = here.length === PEOPLE.length;
              return (
                <div key={d + slot} className={`flex h-[54px] items-end border-b border-r border-[#DADADA] p-1.5 ${all ? 'bg-[#111]' : ''}`}
                  title={here.length ? `${d} ${slot.toLowerCase()}: ${here.map((p) => p.name).join(', ')}` : undefined}>
                  {all ? <span className={`text-[11px] leading-tight text-white ${MONO}`}>all 3<br />free</span> : (
                    <span className="flex gap-[3px]">{here.map((p) => <span key={p.name} className="block h-[30px] w-1.5" style={{ background: p.color }} />)}</span>
                  )}
                </div>
              );
            }),
          ])}
        </div>
      </div>
      <figcaption className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#3A3A3A]">
        {PEOPLE.map((p) => <span key={p.name} className="inline-flex items-center gap-2"><span className="h-3.5 w-3.5" style={{ background: p.color }} />{p.name}</span>)}
        <span className="basis-full">Their free time overlaps on one evening, so the group is built around Thursday 17:00-21:00.</span>
      </figcaption>
    </figure>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const start = user ? homeFor(user) : '/register';
  const link = 'underline underline-offset-[3px] hover:text-[#3B3BD6]';
  return (
    <div className="min-h-screen bg-white text-[#111]" style={SANS}>
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-baseline justify-between gap-4 border-b border-[#111] px-6 py-[22px]">
        <Link to="/" className="text-lg font-bold tracking-tight">studymatch</Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-7 gap-y-2 text-[15px]">
          <a href="#how" className={link}>How matching works</a>
          <a href="#fill" className={link}>What you fill in</a>
          {user ? <Link to={homeFor(user)} className={`${link} font-semibold`}>Open my dashboard →</Link> : (
            <>
              <Link to="/login" className={link}>Sign in</Link>
              <Link to="/register" className={`${link} font-semibold`}>Create a profile →</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto flex max-w-[1180px] flex-wrap items-start gap-14 px-6 pb-[72px] pt-16">
        <div className="min-w-0 flex-[1_1_400px]">
          <h1 className="text-[clamp(40px,5vw,64px)] font-bold leading-[1.04] tracking-[-0.03em]">Study groups that can actually meet.</h1>
          <p className="mt-7 max-w-[470px] text-lg leading-relaxed text-[#3A3A3A]">
            You tell us your subjects, your level in each, and the hours you are free. We put you with students who are free at the same time, at a mix of levels, and who work the way you do.
          </p>
          <p className="mt-7 flex flex-wrap gap-5">
            <Link to={start} className={`${link} font-semibold`}>Create a profile →</Link>
            <Link to="/login" className={link}>Look around with the demo account</Link>
          </p>
          <p className={`mt-3 text-xs text-[#555] ${MONO}`}>demo: student@demo.lk / Demo@1234</p>
        </div>
        <Timetable />
      </section>

      <section id="how" className="border-t border-[#111]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap gap-10 px-6 pb-16 pt-14">
          <h2 className="flex-[1_1_260px] text-[28px] font-bold leading-tight tracking-tight">How matching works</h2>
          <dl className="grid min-w-0 flex-[3_1_620px] gap-x-12 gap-y-8 sm:grid-cols-2">
            {HOW.map(([t, d]) => (
              <div key={t}><dt className="text-[17px] font-semibold">{t}</dt><dd className="mt-2 leading-relaxed text-[#3A3A3A]">{d}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section id="fill" className="border-t border-[#111]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap gap-10 px-6 pb-16 pt-14">
          <h2 className="flex-[1_1_260px] text-[28px] font-bold leading-tight tracking-tight">What you fill in</h2>
          <div className="min-w-0 flex-[3_1_620px] overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[15px]">
              <tbody>
                {FILL.map(([k, v]) => (
                  <tr key={k} className="border-y border-[#DADADA]">
                    <th scope="row" className="w-[200px] py-3.5 pr-4 text-left align-top font-semibold">{k}</th>
                    <td className="py-3.5 text-[#3A3A3A]">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-[#111]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline justify-between gap-5 px-6 pb-[72px] pt-14">
          <p className="max-w-[640px] text-[22px] leading-snug">Setting up a profile takes about three minutes. You get a notification when a group is found.</p>
          <Link to={start} className={`${link} text-lg font-semibold`}>Create a profile →</Link>
        </div>
      </section>

      <footer className="border-t border-[#DADADA]">
        <div className={`mx-auto flex max-w-[1180px] flex-wrap justify-between gap-3 px-6 py-6 text-xs text-[#555] ${MONO}`}>
          <span>Final-year project · BSc (Hons) IT · Horizon Campus</span>
          <span>F.F. Fasmina, S.F. Saheela · supervised by Ms. Anuradha Yapa</span>
        </div>
      </footer>
    </div>
  );
}
