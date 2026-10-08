import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, CardHeader, ErrorBox, PageHeader, Spinner, cx, useToast } from "../components/ui";
import api, { errorText } from "../api";

// The standard System Usability Scale (Brooke, 1996), worded for this platform.
const SUS = [
  "I think that I would like to use this platform frequently.",
  "I found the platform unnecessarily complex.",
  "I thought the platform was easy to use.",
  "I think that I would need help from a technical person to use this platform.",
  "I found the various functions in this platform were well integrated.",
  "I thought there was too much inconsistency in this platform.",
  "I would imagine that most students would learn to use this platform very quickly.",
  "I found the platform very awkward to use.",
  "I felt very confident using the platform.",
  "I needed to learn a lot of things before I could get going with this platform.",
];

const EXTRA = [
  ["fairness", "The way the AI formed my group felt fair."],
  ["usefulness", "The matches were useful for my studies."],
  ["ease", "Finding and joining a study group was easy."],
];

function Scale({ value, onChange, name }) {
  return (
    <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={name}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)}
          className={cx("rounded-lg border py-2 text-sm font-semibold transition",
            value === n ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-300")}>
          {n}
        </button>
      ))}
    </div>
  );
}

export default function Survey() {
  const toast = useToast();
  const [state, setState] = useState(null);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/users/me/survey").then(({ data: r }) => {
      setState(r ? { ...r, sus: r.sus_answers } : { sus: Array(10).fill(0), fairness: 0, usefulness: 0, ease: 0, comment: "" });
      if (r) setDone(r.sus_score);
    }).catch((e) => setError(errorText(e)));
  }, []);

  if (!state) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />;

  const submit = async () => {
    if (state.sus.some((x) => !x) || !state.fairness || !state.usefulness || !state.ease) {
      return setError("Please answer every question");
    }
    setBusy(true);
    setError("");
    try {
      const { data: r } = await api.post("/survey", { sus_answers: state.sus, fairness: state.fairness, usefulness: state.usefulness, ease: state.ease, comment: state.comment || null });
      setDone(r.sus_score);
      toast("Thank you for helping the research");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Platform survey" subtitle="13 short questions. 1 = strongly disagree, 5 = strongly agree. Answers are used anonymously." />
      {done !== null && (
        <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50/60 p-5">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="text-sm text-slate-700">You have answered this survey (usability score {done}/100). You can change your answers below.</p>
        </Card>
      )}
      <Card>
        <CardHeader title="Usability" subtitle="System Usability Scale" />
        <ol className="divide-y divide-slate-100">
          {SUS.map((q, i) => (
            <li key={q} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_16rem] sm:items-center">
              <p className="text-sm text-slate-700"><span className="mr-2 font-semibold text-slate-400">{i + 1}.</span>{q}</p>
              <Scale name={q} value={state.sus[i]} onChange={(v) => setState({ ...state, sus: state.sus.map((x, k) => (k === i ? v : x)) })} />
            </li>
          ))}
        </ol>
      </Card>
      <Card>
        <CardHeader title="Fairness and usefulness" />
        <div className="divide-y divide-slate-100">
          {EXTRA.map(([k, q]) => (
            <div key={k} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_16rem] sm:items-center">
              <p className="text-sm text-slate-700">{q}</p>
              <Scale name={q} value={state[k]} onChange={(v) => setState({ ...state, [k]: v })} />
            </div>
          ))}
          <div className="px-5 py-4">
            <label className="label" htmlFor="sc">Suggestions <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea id="sc" rows={3} className="input" maxLength={1000} value={state.comment || ""} onChange={(e) => setState({ ...state, comment: e.target.value })} />
          </div>
        </div>
      </Card>
      <ErrorBox>{error}</ErrorBox>
      <Button onClick={submit} loading={busy} size="lg">{done !== null ? "Update my answers" : "Submit survey"}</Button>
    </div>
  );
}
