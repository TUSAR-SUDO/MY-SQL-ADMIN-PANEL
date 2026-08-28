import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { getProjects, getAdmins, getRecentQuestions } from '../api';
import { useAuth } from '../context/AuthContext';
import { PUBLIC_API_BASE, sessionUrl, getPublicApiBase } from '../config';

const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Overview = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState({ projects: 0, questions: 0, admins: 0 });
  const [projects, setProjects] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [apiBase, setApiBase] = useState(PUBLIC_API_BASE);

  useEffect(() => {
    getPublicApiBase().then(setApiBase);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, adminsRes, recentRes] = await Promise.all([
          getProjects({ limit: 100 }),
          admin?.role === 'super_admin' ? getAdmins() : Promise.resolve({ data: [] }),
          getRecentQuestions({ limit: 8 }),
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
            (err.response
              ? `The API replied ${err.response.status}.`
              : 'The API did not respond. Is the backend running?')
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [admin]);

  const cards = [
    { label: 'Projects', value: stats.projects, icon: FolderKanban, tone: 'from-primary-500 to-primary-700' },
    { label: 'Questions', value: stats.questions, icon: HelpCircle, tone: 'from-accent-400 to-accent-600' },
    { label: 'Admins', value: stats.admins, icon: Users, tone: 'from-primary-400 to-accent-400' },
  ];

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">Dashboard numbers may be out of date</p>
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.07 }}
            className="card relative overflow-hidden p-5"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.tone}`} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{card.label}</p>
                {loading ? (
                  <div className="skeleton mt-2 h-9 w-16" />
                ) : (
                  <p className="mt-1 font-heading text-4xl font-extrabold leading-none text-ink">
                    {card.value}
                  </p>
                )}
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${card.tone} text-white shadow-glow`}>
                <card.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.24 }}
          className="card p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <Clock size={19} />
            </div>
            <div>
              <h2 className="font-bold text-ink">Latest questions</h2>
              <p className="text-sm text-muted">Added most recently, across all projects</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="skeleton h-12" />
              ))}
            </div>
          ) : recentQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-primary-400 ring-1 ring-primary-100">
                <FileText size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">No questions yet</p>
              <p className="mt-1 text-sm text-muted">Open a project to add some or upload a CSV.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuestions.map((q, idx) => (
                <motion.div
                  key={q._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.24 + idx * 0.04 }}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-surface"
                >
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                    <HelpCircle size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{q.field1 || 'Untitled'}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {q.projectType === 'mcq'
                        ? `A: ${q.optionA || '—'} · B: ${q.optionB || '—'} · ✓${q.correctAnswer || '?'}`
                        : q.field2}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1.5">
                      {q.projectType === 'mcq' && <span className="badge-accent">MCQ</span>}
                      <span className="badge-neutral max-w-[130px] truncate">{q.projectName}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{timeAgo(q.createdAt)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Connection panel — the slug is the one thing a game needs, so it
            belongs on the first screen rather than buried in a settings sheet. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.3 }}
          className="card p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-50 text-accent-600">
              <Plug size={19} />
            </div>
            <div>
              <h2 className="font-bold text-ink">Live endpoints</h2>
              <p className="text-sm text-muted">What your games read from</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">API base</p>
            <code className="mt-1 block break-all font-mono text-xs text-primary-700">{apiBase}</code>
            <p className="hint">
              Set with VITE_PUBLIC_API_BASE at build time. A deployed game needs an HTTPS URL here.
            </p>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton h-10" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-primary-200 bg-brand-soft px-4 py-5 text-center">
              <p className="text-sm font-semibold text-ink">No endpoints yet</p>
              <p className="mt-1 text-sm text-muted">Every project you create gets one automatically.</p>
              <Link to="/projects" className="btn-primary mt-3">
                Create a project
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {projects.slice(0, 5).map((p) => (
                <li
                  key={p._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                    <code className="block truncate font-mono text-[11px] text-muted">
                      {sessionUrl(p.slug)}
                    </code>
                  </div>
                  <span className="badge-accent shrink-0">{p.questionsPerQuiz}/session</span>
                </li>
              ))}
              <li>
                <Link
                  to="/projects"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800"
                >
                  {projects.length > 5 ? `All ${projects.length} projects` : 'Manage projects'}
                  <ArrowRight size={15} />
                </Link>
              </li>
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Overview;
