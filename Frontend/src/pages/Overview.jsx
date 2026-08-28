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

const AnimatedCounter = ({ value, duration = 0.8 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const end = parseInt(value, 10);
    if (isNaN(end)) {
      setDisplayValue(value);
      return;
    }
    if (end === 0) {
      setDisplayValue(0);
      return;
    }

    const totalFrames = Math.round(duration * 60);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const current = Math.round(end * (1 - Math.pow(2, -10 * progress)));
      setDisplayValue(Math.min(current, end));

      if (frame === totalFrames) {
        clearInterval(counter);
        setDisplayValue(end);
      }
    }, 1000 / 60);

    return () => clearInterval(counter);
  }, [value, duration]);

  return <span>{displayValue}</span>;
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
      gradient: 'from-[#C15C3D] to-[#973C24]',
      glow: 'group-hover:shadow-glow',
    },
    {
      label: 'Question Bank',
      value: stats.questions,
      desc: 'Stored in MySQL database',
      icon: HelpCircle,
      gradient: 'from-[#4A7C59] to-[#365A40]',
      glow: 'group-hover:shadow-glow-emerald',
    },
    {
      label: 'Admin Accounts',
      value: stats.admins,
      desc: 'Super admins & managers',
      icon: Users,
      gradient: 'from-[#D99B43] to-[#A36C22]',
      glow: 'group-hover:shadow-glow-accent',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#3D3730] bg-gradient-to-br from-[#1C1A18] via-[#292420] to-[#1C1A18] p-6 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center rounded-full bg-primary-500/20 px-2.5 text-[11px] font-bold text-primary-300 border border-primary-500/30">
                MySQL Admin Hub
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#D5CEC5]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live Database Connected
              </span>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {admin?.name || 'Admin'}
            </h1>
            <p className="text-xs md:text-sm text-[#D5CEC5] max-w-xl">
              Manage multi-game schemas, curate randomized question pools, and connect client game frontends via high-speed API endpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/projects')}
              className="flex items-center gap-2 rounded-xl bg-[#FAF8F5] px-4 py-2.5 text-xs font-bold text-[#191716] shadow-md transition-colors hover:bg-[#F3EFEA]"
            >
              <Plus size={15} />
              <span>New Game</span>
            </motion.button>
            {projects.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSimulatorTarget(projects[0])}
                className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600"
              >
                <Play size={14} className="fill-white" />
                <span>Play Test First Game</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Decorative background warm glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-400">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold">Dashboard status error</p>
            <p className="text-sm opacity-90">{loadError}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25, delay: idx * 0.08 }}
            className={`card group relative overflow-hidden p-5 cursor-default transition-all duration-300 ${card.glow}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">{card.label}</p>
                <h3 className="mt-2 font-heading text-3xl font-extrabold text-ink tracking-tight">
                  {loading ? '—' : <AnimatedCounter value={card.value} />}
                </h3>
                <p className="mt-1 text-xs text-muted">{card.desc}</p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
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
              <h2 className="font-heading text-base font-bold text-ink">Game Project Health</h2>
              <p className="text-xs text-muted">Live question pools and endpoint readiness</p>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              <span>View all games</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20 skeleton" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="card flex flex-col items-center justify-center p-8 text-center">
              <Gamepad2 size={36} className="text-muted" />
              <p className="mt-2 text-sm font-bold text-ink">No games created yet</p>
              <p className="text-xs text-muted max-w-xs mt-0.5">
                Create a project (like Cricket Trivia or Vocab) to start building questions.
              </p>
              <button onClick={() => navigate('/projects')} className="btn-primary mt-4 text-xs">
                <Plus size={14} /> Create Game
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((p, idx) => {
                const count = p.questionCount || 0;
                const req = p.questionsPerQuiz || 15;
                const isReady = count >= req;
                const isMcq = p.projectType === 'mcq';

                return (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:border-primary-400/80 hover:shadow-card-hover transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface border border-line text-xl shadow-inner transition-transform duration-200 hover:rotate-6">
                        {getProjectEmoji(p.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-ink truncate">{p.name}</h4>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              isMcq
                                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                                : 'bg-surface text-muted border border-line'
                            }`}
                          >
                            {isMcq ? 'MCQ' : 'Classic'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          <code className="font-mono text-primary-600 dark:text-primary-300">{p.slug}</code>
                          <span>•</span>
                          <span>{count} / {req} per quiz</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          count === 0
                            ? 'bg-[#C94A4A]/15 text-[#C94A4A] dark:text-[#E87A7A] border border-[#C94A4A]/30'
                            : isReady
                            ? 'bg-[#4A7C59]/15 text-[#4A7C59] dark:text-[#78B48B] border border-[#4A7C59]/30'
                            : 'bg-[#D99B43]/15 text-[#B87A28] dark:text-[#F3BE65] border border-[#D99B43]/30'
                        }`}
                      >
                        {count === 0 ? 'Empty' : isReady ? '✅ Ready' : '⚠️ Low Pool'}
                      </span>

                      <button
                        onClick={() => setSimulatorTarget(p)}
                        className="flex items-center gap-1 rounded-lg border border-primary-500/30 bg-primary-500/10 px-2.5 py-1 text-xs font-bold text-primary-600 dark:text-primary-300 hover:bg-primary-500/20 active:scale-95 transition-all"
                      >
                        <Play size={11} className="fill-primary-600 dark:fill-primary-300" />
                        <span>Play</span>
                      </button>

                      <button
                        onClick={() => navigate(`/projects/${p._id}/questions`)}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        Manage
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Questions Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-ink">Recent Questions</h2>
              <p className="text-xs text-muted">Latest additions to question pool</p>
            </div>
          </div>

          {loading ? (
            <div className="card h-64 skeleton" />
          ) : recentQuestions.length === 0 ? (
            <div className="card p-6 text-center text-xs text-muted">No questions added yet.</div>
          ) : (
            <div className="card divide-y divide-line p-0 overflow-hidden">
              {recentQuestions.map((q, idx) => (
                <motion.div
                  key={q._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="p-3.5 hover:bg-surface/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="font-semibold text-primary-600 dark:text-primary-400">{q.projectName}</span>
                    <span>{timeAgo(q.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink line-clamp-2">{q.field1 || '—'}</p>
                  {q.correctAnswer && (
                    <span className="mt-1.5 inline-block text-[10px] font-bold text-[#4A7C59] dark:text-[#78B48B] bg-[#4A7C59]/15 border border-[#4A7C59]/30 rounded px-1.5 py-0.5">
                      Answer: {q.correctAnswer}
                    </span>
                  )}
                </motion.div>
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
