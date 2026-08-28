import { useState, useEffect } from 'react';
import {
  Check,
  Copy,
  Loader2,
  Plug,
  CircleCheck,
  CircleX,
  ExternalLink,
  Globe,
  Plus,
  X,
  Play,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicApiBase } from '../config';
import { updateProject } from '../api';
import GameSimulatorModal from './GameSimulatorModal';

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
      toast.success('Snippet copied to clipboard');
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
    className="btn-secondary shrink-0 px-3 py-1.5 text-xs font-semibold gap-1.5 inline-flex items-center"
  >
    {copiedKey === id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
    {copiedKey === id ? 'Copied' : label}
  </button>
);

const frameworks = [
  { id: 'react', label: 'React (Hook)', icon: Code2 },
  { id: 'vanilla', label: 'Vanilla JS', icon: Code2 },
  { id: 'ts', label: 'TypeScript', icon: Code2 },
  { id: 'curl', label: 'cURL / API', icon: Terminal },
  { id: 'unity', label: 'Unity (C#)', icon: Gamepad2 },
];

const generateSnippet = (framework, project, apiBase) => {
  const isMcq = (project.projectType || 'classic') === 'mcq';
  const base = apiBase || window.location.origin;
  const endpoint = `${base}/api/public/projects/${project.slug}/session`;

  if (framework === 'curl') {
    return `# Test endpoint in terminal or Postman
curl -X GET "${endpoint}" \\
  -H "Accept: application/json"`;
  }

  if (framework === 'react') {
    if (isMcq) {
      return `import { useState, useEffect } from 'react';

// Custom React hook for your MCQ Game
export function useQuiz() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('${endpoint}');
      if (!res.ok) throw new Error(\`Failed to fetch: \${res.status}\`);
      const data = await res.json();
      
      // Each question: field1 (Text), optionA/B/C/D, correctAnswer ('A'|'B'|'C'|'D'), hint
      setQuestions(data.questions.map((q) => ({
        question: q.field1,
        options: [
          { key: 'A', text: q.optionA },
          { key: 'B', text: q.optionB },
          { key: 'C', text: q.optionC },
          { key: 'D', text: q.optionD },
        ].filter(opt => opt.text),
        correctAnswer: q.correctAnswer,
        hint: q.hint || '',
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { questions, loading, error, refetch: fetchSession };
}`;
    }

    const main = project.mainQuestionField || 'field2';
    const ans = main === 'field1' ? 'field2' : 'field1';
    return `import { useState, useEffect } from 'react';

// Custom React hook for your Classic Quiz Game
export function useQuiz() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('${endpoint}');
      const data = await res.json();
      setQuestions(data.questions.map((q) => ({
        prompt: q.${main},
        answer: q.${ans},
        hint: q.field3 || '',
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { questions, loading, refetch: fetchSession };
}`;
  }

  if (framework === 'ts') {
    if (isMcq) {
      return `export interface MCQQuestion {
  field1: string;          // Question text
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  hint: string;
}

export interface QuizSessionResponse {
  project: { name: string; slug: string };
  projectType: 'mcq' | 'classic';
  questions: MCQQuestion[];
}

export async function loadQuizSession(): Promise<MCQQuestion[]> {
  const res = await fetch('${endpoint}');
  if (!res.ok) throw new Error(\`Failed with status \${res.status}\`);
  const data: QuizSessionResponse = await res.json();
  return data.questions;
}`;
    }

    return `export interface ClassicQuestion {
  field1: string;
  field2: string;
  field3: string;
}

export async function loadQuizSession(): Promise<ClassicQuestion[]> {
  const res = await fetch('${endpoint}');
  const data = await res.json();
  return data.questions;
}`;
  }

  if (framework === 'unity') {
    return `using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[Serializable]
public class QuestionData {
    public string field1;
    public string optionA;
    public string optionB;
    public string optionC;
    public string optionD;
    public string correctAnswer;
    public string hint;
}

[Serializable]
public class SessionResponse {
    public QuestionData[] questions;
}

public class QuizManager : MonoBehaviour {
    private string url = "${endpoint}";

    public IEnumerator LoadQuizSession(Action<QuestionData[]> callback) {
        using (UnityWebRequest req = UnityWebRequest.Get(url)) {
            yield return req.SendWebRequest();
            if (req.result == UnityWebRequest.Result.Success) {
                SessionResponse res = JsonUtility.FromJson<SessionResponse>(req.downloadHandler.text);
                callback?.Invoke(res.questions);
            } else {
                Debug.LogError("Error loading quiz: " + req.error);
            }
        }
    }
}`;
  }

  // Vanilla JS
  if (isMcq) {
    return `// questions.js — drop this in your game
export async function loadQuestions() {
  const res = await fetch('${endpoint}');
  if (!res.ok) throw new Error(\`API returned \${res.status}\`);

  const { questions } = await res.json();

  return questions.map((q) => ({
    question: q.field1,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctAnswer: q.correctAnswer, // "A", "B", "C", or "D"
    hint: q.hint || '',
  }));
}`;
  }

  const main = project.mainQuestionField || 'field2';
  const ans = main === 'field1' ? 'field2' : 'field1';
  return `export async function loadQuestions() {
  const res = await fetch('${endpoint}');
  const { questions } = await res.json();

  return questions.map((q) => ({
    prompt: q.${main},
    answer: q.${ans},
    hint: q.field3,
  }));
}`;
};

export default function ConnectGame({ project, onProjectUpdate }) {
  const { copiedKey, copy } = useCopy();
  const [test, setTest] = useState({ state: 'idle' });
  const [gameUrl, setGameUrl] = useState('');
  const [savingOrigin, setSavingOrigin] = useState(false);
  const [apiBase, setApiBase] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('react');
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  useEffect(() => {
    getPublicApiBase().then(setApiBase);
  }, []);

  const endpointUrl = apiBase ? `${apiBase}/api/public/projects/${project.slug}/session` : '';

  const runTest = async () => {
    setTest({ state: 'running' });
    const startedAt = performance.now();
    try {
      const res = await fetch(endpointUrl, { headers: { Accept: 'application/json' } });
      const ms = Math.round(performance.now() - startedAt);

      if (res.status === 404) {
        setTest({
          state: 'failed',
          title: 'Project slug not found',
          detail: `Endpoint reached, but no project matches slug "${project.slug}".`,
        });
        return;
      }
      if (!res.ok) {
        setTest({
          state: 'failed',
          title: `API returned status ${res.status}`,
          detail: 'Endpoint rejected the request.',
        });
        return;
      }

      const data = await res.json();
      const count = data.questions?.length ?? 0;
      setTest({
        state: count > 0 ? 'ok' : 'empty',
        title: count > 0 ? `Serving ${count} questions in ${ms} ms` : 'Endpoint ready, but question bank is empty',
        detail:
          count > 0
            ? `First question sample: "${data.questions[0]?.field1 || '...'}"`
            : 'Add questions to this project to start serving real game sessions.',
      });
    } catch {
      setTest({
        state: 'failed',
        title: `Could not reach ${apiBase || 'API'}`,
        detail: 'Ensure your backend server is running and CORS allows this origin.',
      });
    }
  };

  const addGameOrigin = async () => {
    let cleanUrl = gameUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const parsed = new URL(cleanUrl);
      cleanUrl = parsed.origin;
    } catch {
      toast.error('Please enter a valid website URL');
      return;
    }

    const currentOrigins = project.allowedOrigins || [];
    if (currentOrigins.includes(cleanUrl)) {
      toast.error('This URL is already allowed');
      return;
    }

    setSavingOrigin(true);
    try {
      const updatedOrigins = [...currentOrigins, cleanUrl];
      await updateProject(project._id, {
        allowedOrigins: updatedOrigins,
      });
      toast.success('Game URL authorized in CORS');
      setGameUrl('');
      if (onProjectUpdate) {
        onProjectUpdate({ ...project, allowedOrigins: updatedOrigins });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add origin');
    } finally {
      setSavingOrigin(false);
    }
  };

  const removeOrigin = async (originToRemove) => {
    const currentOrigins = project.allowedOrigins || [];
    const updatedOrigins = currentOrigins.filter((o) => o !== originToRemove);
    try {
      await updateProject(project._id, { allowedOrigins: updatedOrigins });
      toast.success('Origin removed');
      if (onProjectUpdate) {
        onProjectUpdate({ ...project, allowedOrigins: updatedOrigins });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove origin');
    }
  };

  const resultTone = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    empty: 'border-amber-200 bg-amber-50 text-amber-900',
    failed: 'border-red-200 bg-red-50 text-red-900',
  }[test.state];

  return (
    <div className="space-y-6">
      {/* Live Play-Testing Hero Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h4 className="font-heading text-sm font-bold text-slate-900">Interactive Game Simulator</h4>
            <p className="text-xs text-slate-600">Test how your questions look and play in real-time before deploying.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSimulatorOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-700 hover:scale-105"
        >
          <Play size={14} className="fill-white" />
          <span>Launch Simulator</span>
        </button>
      </div>

      {/* Endpoint URL & Diagnostics */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Session Endpoint</p>
          <span className="badge-neutral text-xs">Serves {project.questionsPerQuiz} random questions</span>
        </div>

        <div className="flex items-center gap-2">
          <code className="chip-mono flex-1 truncate px-3 py-2 text-xs font-medium text-slate-800">
            {endpointUrl}
          </code>
          <CopyButton id="endpoint" value={endpointUrl} copiedKey={copiedKey} onCopy={copy} label="Copy Endpoint" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runTest}
            className="btn-secondary px-3 py-1.5 text-xs font-semibold gap-1.5"
            disabled={test.state === 'running'}
          >
            {test.state === 'running' ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />}
            {test.state === 'running' ? 'Testing Connection...' : 'Test Endpoint'}
          </button>
          <a
            href={endpointUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <ExternalLink size={13} />
            View Raw JSON
          </a>
        </div>

        {test.state !== 'idle' && test.state !== 'running' && (
          <div className={`rounded-xl border px-3.5 py-2.5 text-xs ${resultTone}`}>
            <p className="flex items-center gap-2 font-bold">
              {test.state === 'failed' ? <CircleX size={15} /> : <CircleCheck size={15} />}
              {test.title}
            </p>
            <p className="mt-0.5 opacity-90">{test.detail}</p>
          </div>
        )}
      </section>

      {/* Allowed Game Origins (CORS) */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Authorized Game URLs (CORS)</p>
            <p className="text-xs text-slate-500">Allow your deployed games (like Vercel or Netlify) to call this API.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. https://cricket-nine-phi.vercel.app"
              value={gameUrl}
              onChange={(e) => setGameUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGameOrigin()}
              className="input-field pl-9 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={addGameOrigin}
            disabled={savingOrigin || !gameUrl.trim()}
            className="btn-primary px-3 py-2 text-xs font-semibold gap-1"
          >
            {savingOrigin ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            <span>Allow URL</span>
          </button>
        </div>

        {project.allowedOrigins && project.allowedOrigins.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {project.allowedOrigins.map((origin) => (
              <span
                key={origin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {origin}
                <button
                  type="button"
                  onClick={() => removeOrigin(origin)}
                  title="Revoke access"
                  className="rounded p-0.5 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-900"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No specific URLs restricted — falls back to global settings.</p>
        )}
      </section>

      {/* Multi-Framework Code Generator */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Integration Code Snippet</p>
          <CopyButton
            id="snippet"
            value={generateSnippet(selectedFramework, project, apiBase)}
            copiedKey={copiedKey}
            onCopy={copy}
            label="Copy Code"
          />
        </div>

        {/* Framework Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              type="button"
              onClick={() => setSelectedFramework(fw.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedFramework === fw.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <fw.icon size={13} />
              <span>{fw.label}</span>
            </button>
          ))}
        </div>

        {/* Code Box */}
        <pre className="max-h-64 overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-indigo-200 border border-slate-800">
          <code>{generateSnippet(selectedFramework, project, apiBase)}</code>
        </pre>
      </section>

      {/* Simulator Modal */}
      <GameSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        project={project}
      />
    </div>
  );
}
