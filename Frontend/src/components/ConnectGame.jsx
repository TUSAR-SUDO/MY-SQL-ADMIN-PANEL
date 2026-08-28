import { useState, useEffect } from 'react';
import { Check, Copy, Loader2, Plug, CircleCheck, CircleX, ExternalLink, Globe, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicApiBase } from '../config';
import { updateProject } from '../api';

/** Clipboard with a graceful fallback for non-secure contexts. */
const useCopy = () => {
  const [copiedKey, setCopiedKey] = useState('');

  const copy = async (key, text) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1600);
    } catch {
      setCopiedKey('');
    }
  };

  return { copiedKey, copy };
};

const CopyButton = ({ id, value, copiedKey, onCopy, label = 'Copy' }) => (
  <button
    type="button"
    onClick={() => onCopy(id, value)}
    className="btn-secondary shrink-0 px-3 py-2 text-xs"
  >
    {copiedKey === id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
    {copiedKey === id ? 'Copied' : label}
  </button>
);

const snippetFor = (project, apiBase) => {
  const isMcq = (project.projectType || 'classic') === 'mcq';
  const base = apiBase || 'https://admin-panel-gx47.onrender.com';

  if (isMcq) {
    return `// questions.js — drop this in your MCQ game
const API = import.meta.env.VITE_API_BASE || '${base}';

export async function loadQuestions() {
  const res = await fetch(\`\${API}/api/public/projects/${project.slug}/session\`);
  if (!res.ok) throw new Error(\`Question bank replied \${res.status}\`);

  const { questions, projectType } = await res.json();

  // projectType === "mcq" — each question has optionA/B/C/D + correctAnswer
  return questions.map((q) => ({
    question: q.field1,
    options: [
      { label: 'A', text: q.optionA },
      { label: 'B', text: q.optionB },
      { label: 'C', text: q.optionC },
      { label: 'D', text: q.optionD },
    ],
    correctAnswer: q.correctAnswer,  // "A", "B", "C", or "D"
    hint: q.hint || '',
  }));
}`;
  }

  const main = project.mainQuestionField || 'field2';
  const answerField = main === 'field1' ? 'field2' : 'field1';
  return `// questions.js — drop this in your game
const API = import.meta.env.VITE_API_BASE || '${base}';

export async function loadQuestions() {
  const res = await fetch(\`\${API}/api/public/projects/${project.slug}/session\`);
  if (!res.ok) throw new Error(\`Question bank replied \${res.status}\`);

  const { questions, fieldLabels, mainQuestionField } = await res.json();

  // This project asks with "${project.fieldLabels?.[main] || main}" (${main}).
  return questions.map((q) => ({
    prompt: q.${main},
    answer: q.${answerField},
    hint: q.field3,
  }));
}`;
};

/**
 * The connection sheet for one project.
 *
 * The slug is the only thing a game needs to know, and until now it was never
 * shown anywhere in the panel — so this surfaces it, proves the endpoint
 * answers, and hands over code that already has the right field mapping.
 */
const ConnectGame = ({ project, onProjectUpdate }) => {
  const { copiedKey, copy } = useCopy();
  const [test, setTest] = useState({ state: 'idle' });
  const [gameUrl, setGameUrl] = useState('');
  const [savingOrigin, setSavingOrigin] = useState(false);
  const [apiBase, setApiBase] = useState('');

  useEffect(() => {
    getPublicApiBase().then(setApiBase);
  }, []);

  const url = apiBase ? `${apiBase}/api/public/projects/${project.slug}/session` : '';

  const runTest = async () => {
    setTest({ state: 'running' });
    const startedAt = performance.now();
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const ms = Math.round(performance.now() - startedAt);

      if (res.status === 404) {
        setTest({
          state: 'failed',
          title: 'No project with that slug',
          detail: `The API answered, but nothing is registered as "${project.slug}". Renaming a project changes its slug — update the game too.`,
        });
        return;
      }
      if (!res.ok) {
        setTest({
          state: 'failed',
          title: `The API replied ${res.status}`,
          detail: 'The endpoint is reachable but refused this request.',
        });
        return;
      }

      const data = await res.json();
      const count = data.questions?.length ?? 0;
      setTest({
        state: count > 0 ? 'ok' : 'empty',
        title: count > 0 ? `${count} question${count === 1 ? '' : 's'} served in ${ms} ms` : 'Connected, but the bank is empty',
        detail:
          count > 0
            ? `First prompt: "${data.questions[0]?.[data.mainQuestionField] ?? '—'}"`
            : 'Add questions to this project and your game will pick them up on the next session.',
      });
    } catch {
      setTest({
        state: 'failed',
        title: `Couldn't reach ${apiBase || 'the API'}`,
        detail:
          'Either the API is not running, the base URL is wrong (set VITE_PUBLIC_API_BASE), or this origin is not in ALLOWED_GAME_ORIGINS.',
      });
    }
  };

  const addGameOrigin = async () => {
    const url = gameUrl.trim().replace(/\/$/, '');
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Enter a full URL starting with https://');
      return;
    }
    const currentOrigins = project.allowedOrigins || [];
    if (currentOrigins.includes(url)) {
      toast.error('This URL is already allowed');
      return;
    }
    setSavingOrigin(true);
    try {
      await updateProject(project._id, {
        allowedOrigins: [...currentOrigins, url],
      });
      toast.success('Game URL added to allowed origins');
      setGameUrl('');
      if (onProjectUpdate) {
        onProjectUpdate({ ...project, allowedOrigins: [...currentOrigins, url] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add origin');
    } finally {
      setSavingOrigin(false);
    }
  };

  const resultTone = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    empty: 'border-amber-200 bg-amber-50 text-amber-900',
    failed: 'border-red-200 bg-red-50 text-red-900',
  }[test.state];

  return (
    <div className="space-y-6">
      {/* Step 1 — the slug */}
      <section>
        <p className="eyebrow">The only value your game needs</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="chip-mono flex-1 truncate px-3 py-2 text-sm">{project.slug}</code>
          <CopyButton id="slug" value={project.slug} copiedKey={copiedKey} onCopy={copy} label="Copy slug" />
        </div>
        <p className="hint">
          Derived from the project name. Rename the project and this changes — the game will 404 until
          you update it.
        </p>
      </section>

      {/* Step 2 — the endpoint */}
      <section>
        <p className="eyebrow">Session endpoint</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="chip-mono flex-1 overflow-x-auto whitespace-nowrap px-3 py-2 text-sm">
            {url}
          </code>
          <CopyButton id="url" value={url} copiedKey={copiedKey} onCopy={copy} label="Copy URL" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={runTest} className="btn-primary px-3 py-2 text-xs" disabled={test.state === 'running'}>
            {test.state === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />}
            {test.state === 'running' ? 'Testing…' : 'Test connection'}
          </button>
          <a href={url} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-xs">
            <ExternalLink size={14} />
            Open raw response
          </a>
          <span className="badge-neutral">
            Returns {project.questionsPerQuiz} random question
            {project.questionsPerQuiz === 1 ? '' : 's'} per call
          </span>
        </div>

        {test.state !== 'idle' && test.state !== 'running' && (
          <div className={`mt-3 rounded-xl border px-3.5 py-3 text-sm ${resultTone}`}>
            <p className="flex items-center gap-2 font-semibold">
              {test.state === 'failed' ? <CircleX size={15} /> : <CircleCheck size={15} />}
              {test.title}
            </p>
            <p className="mt-1 text-xs opacity-90">{test.detail}</p>
          </div>
        )}
      </section>

      {/* Step 3 — the code */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Paste into your game</p>
          <CopyButton id="snippet" value={snippetFor(project, apiBase)} copiedKey={copiedKey} onCopy={copy} label="Copy code" />
        </div>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-ink px-4 py-3.5 font-mono text-xs leading-relaxed text-primary-100">
          {snippetFor(project, apiBase)}
        </pre>
      </section>

      {/* Step 4 — allowed origins */}
      <section className="panel-gradient p-4">
        <p className="text-sm font-semibold text-ink">Allowed game origins for this project</p>
        
        {/* Quick add game URL */}
        <div className="mt-3 flex gap-2">
          <input
            value={gameUrl}
            onChange={(e) => setGameUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGameOrigin();
              }
            }}
            className="input flex-1 text-sm"
            placeholder="https://my-game.vercel.app"
          />
          <button
            type="button"
            onClick={addGameOrigin}
            className="btn-primary px-3 py-2 text-xs"
            disabled={savingOrigin}
          >
            {savingOrigin ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Add
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          Paste your game's URL above and click Add — it will be allowed to fetch questions from this project instantly.
        </p>

        {project.allowedOrigins && project.allowedOrigins.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {project.allowedOrigins.map((origin) => (
              <li key={origin} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe size={12} className="shrink-0 text-primary-500" />
                  <code className="truncate font-mono text-xs text-primary-700">{origin}</code>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const newOrigins = project.allowedOrigins.filter((o) => o !== origin);
                      await updateProject(project._id, { allowedOrigins: newOrigins });
                      toast.success('Origin removed');
                      if (onProjectUpdate) {
                        onProjectUpdate({ ...project, allowedOrigins: newOrigins });
                      }
                    } catch {
                      toast.error('Failed to remove origin');
                    }
                  }}
                  className="shrink-0 rounded p-0.5 text-muted hover:bg-red-50 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No origins set yet — add your game's URL above to allow it.
          </p>
        )}
      </section>
    </div>
  );
};

export default ConnectGame;
