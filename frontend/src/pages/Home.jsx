import { Link } from "react-router-dom";
import {
  ArrowRight, BellRing, Brain, CalendarClock, GraduationCap, HeartHandshake, MessagesSquare, ShieldCheck, Sparkles,
} from "lucide-react";
import { Logo } from "../components/Layout";
import { homeFor, useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: GraduationCap, title: "Subject interests & level", text: "Choose your subjects and rate yourself. Groups mix strong and developing students so everyone learns." },
  { icon: CalendarClock, title: "Real availability", text: "Mark the days and times you are free. A group is only formed when everyone shares a slot." },
  { icon: HeartHandshake, title: "Social preferences", text: "Communication style, team role, pace and language are matched, not ignored." },
  { icon: Brain, title: "AI that learns", text: "Every rating you give retrains the matching model, so the next matches are better." },
  { icon: BellRing, title: "Instant notifications", text: "You are told the moment you are matched, with the reasons why." },
  { icon: MessagesSquare, title: "Built-in collaboration", text: "Group chat, session planning and attendance in one place." },
];

const STEPS = [
  ["Create your profile", "Subjects, level, study type, free times and study style - about 3 minutes."],
  ["Get matched by AI", "K-Nearest Neighbours finds similar students, then 7 factors balance each group."],
  ["Accept and study", "Accept the invitation, chat, schedule sessions and track attendance."],
  ["Rate your group", "Your feedback teaches the model what makes a group work."],
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            {user ? (
              <Link to={homeFor(user)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Open my dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Sign in</Link>
                <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered adaptive matching
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Find the study group that <span className="text-brand-600">actually works</span> for you.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Random groups and grade-only grouping ignore how people study. StudyMatch AI matches you on subjects,
              skill level, free time and social style - then learns from every group's feedback.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-brand-700">
                Create my profile <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
                Try the demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Try it: demo student <b>student@demo.lk</b> · admin <b>admin@studymatch.lk</b></p>
          </div>

          <div className="relative">
            <div className="card mx-auto max-w-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">New match</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">Database Systems - Study Group 3</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-emerald-500 text-sm font-bold text-slate-900">83%</div>
              </div>
              <div className="mt-5 flex -space-x-2">
                {["AP", "NF", "KS", "RH"].map((i, k) => (
                  <div key={i} className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white ${["bg-brand-100 text-brand-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-sky-100 text-sky-700"][k]}`}>{i}</div>
                ))}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Everyone is free on Tue evening</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Skill mix: 1 strong, 2 average, 1 needs support</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> One natural leader, the rest contribute</li>
                <li className="flex gap-2"><span className="text-emerald-600">✓</span> Common language: English</li>
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white">Accept</div>
                <div className="rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold text-slate-600">Decline</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Matched on what really matters</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">K-Nearest Neighbours plus seven compatibility factors, weighted by a model that keeps learning from students' ratings.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="inline-flex rounded-lg bg-brand-50 p-2.5 text-brand-600"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <div key={t}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-bold">{i + 1}</div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><ShieldCheck className="h-6 w-6" /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Your data, your choice</h3>
            <p className="mt-1 text-sm text-slate-600">
              We only collect what is needed for matching - never gender, ethnicity or religion. You give consent before
              anything is used, and you can withdraw at any time from your preferences page.
            </p>
          </div>
          <Link to="/register" className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">Join now</Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        StudyMatch AI · Final year project, Faculty of IT, Horizon Campus
      </footer>
    </div>
  );
}
