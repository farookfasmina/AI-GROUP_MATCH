import { Link } from 'react-router-dom';
import { ArrowRight, Check, UsersRound } from 'lucide-react';
import { homeFor, useAuth } from '../context/AuthContext';

// Minimal landing page: calm off-white ground, one indigo accent, an italic serif for emphasis.
const SERIF = { fontFamily: "'Instrument Serif', serif" };

const STEPS = [
  ['Tell us how you study', 'Subjects and your level in each, group or buddy, the hours you are free, and how you like to work.'],
  ['Get matched', 'K-Nearest Neighbours finds similar students; the group builder mixes levels and makes sure everyone shares a free hour.'],
  ['Study, then rate it', 'Chat, share notes, plan sessions. Your rating teaches the model what makes a group work.'],
];

const FACTORS = [
  ['Shared free time', 'Groups only form when everyone can meet.', 'bg-[#F5B83D]'],
  ['Competency balance', 'Stronger and weaker students learn together.', 'bg-[#E05BC5]'],
  ['Shared subjects', 'From the course catalogue or your own.', 'bg-[#9B6BF2]'],
  ['Collaboration style', 'Two driven leaders rarely work out.', 'bg-[#5B7CF7]'],
  ['Learning style', 'Visual, auditory, reading or hands-on.', 'bg-[#F5B83D]'],
  ['Communication', 'Chat, voice, video or in person.', 'bg-[#E05BC5]'],
  ['Study type', 'A group of 3-6, or one study buddy.', 'bg-[#9B6BF2]'],
];

export default function Landing() {
  const { user } = useAuth();
  const start = user ? homeFor(user) : '/register';
  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#12131A]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <header className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-7">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#4F46E5] text-white"><UsersRound className="h-[18px] w-[18px]" /></span>
          StudyMatch
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-semibold md:flex">
          <a href="#how" className="hover:text-[#4F46E5]">How it works</a>
          <a href="#match" className="hover:text-[#4F46E5]">What we match</a>
          <a href="#privacy" className="hover:text-[#4F46E5]">Privacy</a>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to={homeFor(user)} className="rounded-full bg-[#12131A] px-5 py-3 text-[15px] font-bold text-white hover:bg-black">Open my dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="px-2 py-3 text-[15px] font-semibold hover:text-[#4F46E5]">Sign in</Link>
              <Link to="/register" className="rounded-full bg-[#12131A] px-5 py-3 text-[15px] font-bold text-white hover:bg-black">Get started</Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-16 px-6 pb-24 pt-12 sm:pt-16">
        <div className="min-w-0 flex-[999_1_480px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#E4E6EE] bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#4A4F5E]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#4F46E5]" /> Final-year project · Horizon Campus
          </p>
          <h1 className="mt-7 text-[clamp(44px,6vw,76px)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            Study with people<br />who <span style={SERIF} className="font-normal italic tracking-tight text-[#4F46E5]">actually fit.</span>
          </h1>
          <p className="mt-7 max-w-[520px] text-lg leading-relaxed text-[#4A4F5E]">
            StudyMatch forms study groups and study buddies from your subjects, level, free time and study style - then learns from every group's ratings.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={start} className="inline-flex items-center gap-2.5 rounded-full bg-[#4F46E5] px-7 py-4 font-bold text-white hover:bg-[#4338CA]">
              Create your profile <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
            <Link to="/login" className="rounded-full border border-[#E4E6EE] bg-white px-7 py-4 font-bold hover:border-[#C9CCE0]">Try the demo</Link>
          </div>
          <p className="mt-4 text-[13px] text-[#5B6070]">Takes about 3 minutes. Demo student: student@demo.lk / Demo@1234</p>
        </div>

        <div className="min-w-0 flex-[1_1_360px]">
          <div className="flex flex-col gap-[18px] rounded-[28px] border border-[#E4E6EE] bg-white p-[22px]">
            <div className="flex items-center justify-between text-[13px] text-[#5B6070]"><span className="font-bold">New match</span><span>just now</span></div>
            <div className="flex flex-col gap-3.5 rounded-[22px] bg-[#FFD36B] p-[22px] text-[#2B2105]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex">
                  {[['AP', 'bg-[#12131A]'], ['NH', 'bg-[#4F46E5]'], ['KS', 'bg-[#B4237A]']].map(([t, c], i) => (
                    <span key={t} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFD36B] text-xs font-bold text-white ${c} ${i ? '-ml-2' : ''}`}>{t}</span>
                  ))}
                </div>
                <span className="text-[30px] font-extrabold tracking-tight">79%</span>
              </div>
              <div>
                <p className="text-[21px] font-extrabold tracking-tight">Data Structures &amp; Algorithms</p>
                <p className="mt-1 text-sm font-semibold">Group of 3 · Thursday 19:00-21:00</p>
              </div>
              <div className="h-2 rounded-full bg-[#2B2105]/15"><div className="h-2 w-[79%] rounded-full bg-[#2B2105]" /></div>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm text-[#33374A]">
              {['Everyone is free on Thursday evening', 'Skill mix: 1 advanced, 2 beginners', 'No clashing leaders'].map((t) => (
                <li key={t} className="flex gap-2.5"><Check className="h-4 w-4 shrink-0 text-[#4F46E5]" strokeWidth={3} />{t}</li>
              ))}
            </ul>
            <div className="flex gap-2.5" aria-hidden="true">
              <span className="flex-1 rounded-full bg-[#12131A] py-3 text-center text-[15px] font-bold text-white">Accept</span>
              <span className="flex-1 rounded-full border border-[#E4E6EE] py-3 text-center text-[15px] font-bold">Decline</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-[#E4E6EE]">
        <div className="mx-auto max-w-[1120px] px-6 py-24">
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#5B6070]">How it works</p>
          <h2 className="mt-3.5 max-w-[640px] text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.035em]">Three steps. No awkward group chats with strangers.</h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <div key={title} className="border-t-2 border-[#12131A] pt-6">
                <p style={SERIF} className="text-[34px] italic text-[#4F46E5]">0{i + 1}</p>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight">{title}</h3>
                <p className="mt-2.5 leading-relaxed text-[#4A4F5E]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="match" className="border-y border-[#E4E6EE] bg-white">
        <div className="mx-auto flex max-w-[1120px] flex-wrap gap-14 px-6 py-24">
          <div className="min-w-0 flex-[1_1_300px]">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#5B6070]">What we match on</p>
            <h2 className="mt-3.5 text-[clamp(32px,4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.035em]">
              Seven factors,<br /><span style={SERIF} className="font-normal italic text-[#4F46E5]">not just grades.</span>
            </h2>
            <p className="mt-4 leading-relaxed text-[#4A4F5E]">Their weights are re-learned from students' ratings with logistic regression.</p>
          </div>
          <ul className="grid min-w-0 flex-[2_1_520px] gap-x-10 sm:grid-cols-2">
            {FACTORS.map(([title, text, dot]) => (
              <li key={title} className="flex items-baseline gap-3.5 border-b border-[#ECEEF4] py-[18px]">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                <span><b className="font-bold">{title}</b><br /><span className="text-sm text-[#5B6070]">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="privacy" className="mx-auto flex max-w-[1120px] flex-col gap-8 px-6 py-24">
        <div>
          <h2 className="text-[28px] font-extrabold tracking-tight">Your data, your choice.</h2>
          <p className="mt-3 max-w-[560px] leading-relaxed text-[#4A4F5E]">We never collect gender, ethnicity or religion. You agree before anything is used, and you can withdraw at any time.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[32px] bg-[#12131A] px-8 py-14 text-white sm:px-10">
          <h2 className="text-[clamp(30px,4vw,46px)] font-extrabold leading-[1.08] tracking-[-0.035em]">
            No more random groups.<br /><span style={SERIF} className="font-normal italic text-[#C7CBFF]">Find yours.</span>
          </h2>
          <Link to={start} className="rounded-full bg-white px-8 py-4 font-bold text-[#12131A] hover:bg-[#ECEEF4]">Create your profile</Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-3 px-6 pb-12 text-sm text-[#5B6070]">
        <span>StudyMatch AI · Faculty of IT, Horizon Campus</span>
        <span>Final-year project by F.F. Fasmina and S.F. Saheela</span>
      </footer>
    </div>
  );
}
