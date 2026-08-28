import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  HelpCircle,
  Users,
  Clock,
  FileText,
  Plug,
  ArrowRight,
  AlertTriangle,
  Play,
  CheckCircle2,
  Sparkles,
  Gamepad2,
  Plus,
  Zap,
} from 'lucide-react';
import { getProjects, getAdmins, getRecentQuestions } from '../api';
import { useAuth } from '../context/AuthContext';
import { PUBLIC_API_BASE, sessionUrl, getPublicApiBase } from '../config';
import GameSimulatorModal from '../components/GameSimulatorModal';

const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(seconds / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const getProjectEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('cricket')) return '🏏';
  if (n.includes('math')) return '🧮';
  if (n.includes('vocab') || n.includes('word') || n.includes('spell')) return '📚';
  if (n.includes('science') || n.includes('bio')) return '🧪';
  if (n.includes('history')) return '🏛️';
  if (n.includes('code') || n.includes('dev')) return '💻';
  if (n.includes('trivia') || n.includes('quiz') || n.includes('gk')) return '🎯';
  return '🎮';
};

export default function Overview() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, questions: 0, admins: 0 });
  const [projects, setProjects] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [apiBase, setApiBase] = useState(PUBLIC_API_BASE);
  const [simulatorTarget, setSimulatorTarget] = useState(null);

  useEffect(() => {
    getPublicApiBase().then(setApiBase);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, adminsRes, recentRes] = await Promise.all([
          getProjects({ limit: 100 }),
          admin?.role === 'super_admin' ? getAdmins() : Promise.resolve({ data: [] }),
          getRecentQuestions({ limit: 6 }),
        ]);
        const list = projectsRes.data.projects || [];
        setProjects(list);
        setStats({
          projects: projectsRes.data.total || list.length,
          questions: list.reduce((sum, p) => sum + (p.questionCount || 0), 0),
          admins: adminsRes.data.length || 0,
        });
        setRecentQuestions(recentRes.data || []);
        setLoadError('');
      } catch (err) {
        setLoadError(
          err.response?.data?.message ||
            (err.response ? `The API replied ${err.response.status}.` : 'The API did not respond. Is the backend running?')
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [admin]);

  const cards = [
    {
      label: 'Game Projects',
      value: stats.projects,
      desc: 'Active educational games',
      icon: FolderKanban,
      gradient: 'from-indigo-500 to-purple-600',
      bgGlow: 'bg-indigo-500/10',
    },
    {
      label: 'Question Bank',
      value: stats.questions,
      desc: 'Stored in MySQL database',
      icon: HelpCircle,
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10',
    },
    {
      label: 'Admin Accounts',
      value: stats.admins,
      desc: 'Super admins & managers',
      icon: Users,
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center rounded-full bg-indigo-500/30 px-2.5 text-[11px] font-bold text-indigo-300">
                MySQL Admin Hub
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Database Connected
              </span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {admin?.name || 'Admin'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Manage multi-game schemas, curate randomized question pools, and connect client game frontends via high-speed API endpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all hover:bg-slate-100 hover:scale-105"
            >
              <Plus size={15} />
              <span>New Game</span>
            </button>
            {projects.length > 0 && (
              <button
                onClick={() => setSimulatorTarget(projects[0])}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:scale-105"
              >
                <Play size={14} className="fill-white" />
                <span>Play Test First Game</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">Dashboard status error</p>
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.08 }}
            className="card relative overflow-hidden p-5 border-slate-200/80 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                <h3 className="mt-2 font-heading text-3xl font-extrabold text-slate-900">
                  {loading ? '—' : card.value}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-md`}
              >
                <card.icon size={22} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Game Health & Live Projects Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Games & Health Overview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">Game Project Health</h2>
              <p className="text-xs text-slate-500">Live question pools and endpoint readiness</p>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>View all games</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20 animate-pulse bg-slate-100/70" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="card flex flex-col items-center justify-center p-8 text-center">
              <Gamepad2 size={36} className="text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-800">No games created yet</p>
              <p className="text-xs text-slate-500 max-w-xs mt-0.5">
                Create a project (like Cricket Trivia or Vocab) to start building questions.
              </p>
              <button onClick={() => navigate('/projects')} className="btn-primary mt-4 text-xs">
                <Plus size={14} /> Create Game
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((p) => {
                const count = p.questionCount || 0;
                const req = p.questionsPerQuiz || 15;
                const isReady = count >= req;
                const isMcq = p.projectType === 'mcq';

                return (
                  <div
                    key={p._id}
                    className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl shadow-inner">
                        {getProjectEmoji(p.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              isMcq ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isMcq ? 'MCQ' : 'Classic'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <code>{p.slug}</code>
                          <span>•</span>
                          <span>{count} / {req} per quiz</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          count === 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isReady
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {count === 0 ? 'Empty' : isReady ? '✅ Ready' : '⚠️ Low Pool'}
                      </span>

                      <button
                        onClick={() => setSimulatorTarget(p)}
                        className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <Play size={11} className="fill-indigo-700" />
                        <span>Play</span>
                      </button>

                      <button
                        onClick={() => navigate(`/projects/${p._id}/questions`)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Questions Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-slate-900">Recent Questions</h2>
              <p className="text-xs text-slate-500">Latest additions to question pool</p>
            </div>
          </div>

          {loading ? (
            <div className="card h-64 animate-pulse bg-slate-100/70" />
          ) : recentQuestions.length === 0 ? (
            <div className="card p-6 text-center text-xs text-slate-400">No questions added yet.</div>
          ) : (
            <div className="card divide-y divide-slate-100 p-0 overflow-hidden border-slate-200/80">
              {recentQuestions.map((q) => (
                <div key={q._id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-indigo-600">{q.projectName}</span>
                    <span>{timeAgo(q.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-800 line-clamp-2">{q.field1 || '—'}</p>
                  {q.correctAnswer && (
                    <span className="mt-1.5 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                      Answer: {q.correctAnswer}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Game Simulator Modal */}
      <GameSimulatorModal
        isOpen={!!simulatorTarget}
        onClose={() => setSimulatorTarget(null)}
        project={simulatorTarget}
      />
    </div>
  );
}
