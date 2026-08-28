import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  ListChecks,
  Search,
  Plug,
  Globe,
  X,
  Play,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ConnectGame from '../components/ConnectGame';
import GameSimulatorModal from '../components/GameSimulatorModal';
import { getProjects, createProject, updateProject, deleteProject } from '../api';

const getProjectEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('cricket')) return '🏏';
  if (n.includes('math') || n.includes('calc')) return '🧮';
  if (n.includes('vocab') || n.includes('word') || n.includes('spell') || n.includes('english')) return '📚';
  if (n.includes('science') || n.includes('bio') || n.includes('chem') || n.includes('physics')) return '🧪';
  if (n.includes('history') || n.includes('geo')) return '🏛️';
  if (n.includes('code') || n.includes('dev') || n.includes('tech')) return '💻';
  if (n.includes('trivia') || n.includes('quiz') || n.includes('gk')) return '🎯';
  return '🎮';
};

const emptyForm = {
  name: '',
  projectType: 'classic',
  field1: 'Word',
  field2: 'Definition',
  field3: 'Hint',
  mainQuestionField: 'field2',
  questionsPerQuiz: 15,
  allowedOrigins: [],
  newOrigin: '',
};

const IconAction = ({ label, onClick, danger, children }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`rounded-lg p-2 text-muted transition-colors ${
      danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-primary-50 hover:text-primary-700'
    }`}
  >
    {children}
  </button>
);

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('projects_view_mode') || 'grid');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null);
  const [simulatorTarget, setSimulatorTarget] = useState(null);

  const setView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('projects_view_mode', mode);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjects({ search, page, limit: 30 });
      setProjects(res.data.projects || []);
      setTotal(res.data.total || 0);
      setLoadError('');
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          (err.response ? `The API replied ${err.response.status}.` : 'The API did not respond. Is the backend running?')
      );
      setProjects([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      name: project.name,
      projectType: project.projectType || 'classic',
      field1: project.fieldLabels?.field1 || 'Field 1',
      field2: project.fieldLabels?.field2 || 'Field 2',
      field3: project.fieldLabels?.field3 || 'Field 3',
      mainQuestionField: project.mainQuestionField || 'field2',
      questionsPerQuiz: project.questionsPerQuiz || 15,
      allowedOrigins: project.allowedOrigins || [],
      newOrigin: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        projectType: form.projectType,
        fieldLabels: { field1: form.field1, field2: form.field2, field3: form.field3 },
        mainQuestionField: form.mainQuestionField,
        questionsPerQuiz: Number(form.questionsPerQuiz),
        allowedOrigins: form.allowedOrigins,
      };
      if (editing) {
        await updateProject(editing._id, data);
        toast.success('Project updated');
      } else {
        await createProject(data);
        toast.success('Project created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(deleteTarget._id);
      toast.success('Project deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (typeFilter === 'mcq') return p.projectType === 'mcq';
    if (typeFilter === 'classic') return p.projectType !== 'mcq';
    return true;
  });

  const columns = [
    {
      key: 'name',
      label: 'Project',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg">
            {getProjectEmoji(r.name)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{r.name}</p>
            <code className="font-mono text-xs text-muted">{r.slug}</code>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className={r.projectType === 'mcq' ? 'badge-accent' : 'badge-neutral'}>
          {r.projectType === 'mcq' ? 'MCQ Quiz' : 'Classic'}
        </span>
      ),
    },
    {
      key: 'health',
      label: 'Bank Health',
      render: (r) => {
        const count = r.questionCount || 0;
        const required = r.questionsPerQuiz || 15;
        const isReady = count >= required;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                count === 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : isReady
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {count === 0 ? 'Empty' : isReady ? 'Ready' : 'Low Bank'}
            </span>
            <span className="text-xs text-slate-500">
              ({count} / {required})
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSimulatorTarget(r)}
            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Play size={12} className="fill-indigo-700" />
            <span>Play Test</span>
          </button>
          <IconAction label="Connect a game" onClick={() => setConnectTarget(r)}>
            <Plug size={16} />
          </IconAction>
          <IconAction label="Questions" onClick={() => navigate(`/projects/${r._id}/questions`)}>
            <ListChecks size={16} />
          </IconAction>
          <IconAction label="Configure" onClick={() => openEdit(r)}>
            <Pencil size={16} />
          </IconAction>
          <IconAction label="Delete" danger onClick={() => setDeleteTarget(r)}>
            <Trash2 size={16} />
          </IconAction>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-10 text-xs"
              placeholder="Search games & projects..."
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center rounded-xl border border-line bg-surface p-1 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                typeFilter === 'all' ? 'bg-panel font-bold text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setTypeFilter('mcq')}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                typeFilter === 'mcq' ? 'bg-panel font-bold text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              MCQ
            </button>
            <button
              onClick={() => setTypeFilter('classic')}
              className={`rounded-lg px-3 py-1 font-medium transition-all ${
                typeFilter === 'classic' ? 'bg-panel font-bold text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Classic
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-line bg-surface p-1">
            <button
              onClick={() => setView('grid')}
              title="Card Grid View"
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-panel text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView('table')}
              title="Table View"
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'table' ? 'bg-panel text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <TableIcon size={16} />
            </button>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} className="btn-primary text-xs">
            <Plus size={15} />
            Create Game
          </motion.button>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-48 animate-pulse bg-slate-100/80" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="card flex flex-col items-center justify-center p-12 text-center">
            <Gamepad2 size={40} className="text-slate-300" />
            <h3 className="mt-3 font-heading text-base font-bold text-slate-800">
              {search ? 'No matching games found' : 'No game projects yet'}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Create your first game project to start managing questions and connecting clients.
            </p>
            <button onClick={openAdd} className="btn-primary mt-4 text-xs">
              <Plus size={14} /> Create Game
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const count = p.questionCount || 0;
              const required = p.questionsPerQuiz || 15;
              const isReady = count >= required;
              const isMcq = p.projectType === 'mcq';

              return (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card group relative flex flex-col justify-between overflow-hidden border-slate-200/80 p-5 transition-all hover:border-indigo-300 hover:shadow-xl"
                >
                  {/* Top Info */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-2xl shadow-inner border border-line">
                          {getProjectEmoji(p.name)}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-heading text-base font-bold text-ink group-hover:text-primary-500 transition-colors">
                            {p.name}
                          </h3>
                          <code className="chip-mono text-[11px]">{p.slug}</code>
                        </div>
                      </div>

                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          isMcq ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' : 'bg-surface text-muted border border-line'
                        }`}
                      >
                        {isMcq ? 'MCQ' : 'Classic'}
                      </span>
                    </div>

                    {/* Question Health Status */}
                    <div className="mt-5 rounded-xl border border-line bg-surface/50 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Question Pool</span>
                        <span className="font-bold text-ink">
                          {count} <span className="font-normal text-muted">/ {required} per quiz</span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full transition-all ${
                            isReady ? 'bg-emerald-500' : count > 0 ? 'bg-amber-500' : 'bg-rose-400'
                          }`}
                          style={{ width: `${Math.min(100, (count / required) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            count === 0 ? 'text-rose-500' : isReady ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        >
                          {count === 0 ? (
                            '❌ Empty Pool'
                          ) : isReady ? (
                            <>
                              <CheckCircle2 size={12} /> Ready for Play
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} /> Low Pool ({required - count} needed)
                            </>
                          )}
                        </span>
                        {p.allowedOrigins && p.allowedOrigins.length > 0 && (
                          <span className="text-muted" title={p.allowedOrigins.join(', ')}>
                            🌐 {p.allowedOrigins.length} client{p.allowedOrigins.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-line flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSimulatorTarget(p)}
                        className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary-500/20 hover:bg-primary-700 transition-all hover:scale-105"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Play Test</span>
                      </button>
                      <button
                        onClick={() => navigate(`/projects/${p._id}/questions`)}
                        className="btn-secondary px-3 py-1.5 text-xs font-semibold"
                      >
                        <ListChecks size={13} />
                        <span>Questions</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <IconAction label="Connect a game" onClick={() => setConnectTarget(p)}>
                        <Plug size={15} />
                      </IconAction>
                      <IconAction label="Configure" onClick={() => openEdit(p)}>
                        <Pencil size={15} />
                      </IconAction>
                      <IconAction label="Delete" danger onClick={() => setDeleteTarget(p)}>
                        <Trash2 size={15} />
                      </IconAction>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* Table Mode */
        <DataTable
          columns={columns}
          data={filteredProjects}
          page={page}
          total={total}
          limit={10}
          onPageChange={setPage}
          loading={loading}
          error={loadError}
          onRetry={load}
          onRowClick={(r) => navigate(`/projects/${r._id}/questions`)}
          emptyMessage={search ? 'No project matches that' : 'No projects yet'}
          emptyHint="A project is one game: its field labels, question limits, and API endpoint."
        />
      )}

      {/* Edit / Create Project Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Configure: ${editing.name}` : 'Create New Game Project'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Game / Project Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input text-sm"
              placeholder="e.g. Cricket World Cup Trivia"
            />
          </div>

          <div>
            <label className="label">Game Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all ${
                  form.projectType === 'mcq'
                    ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30 ring-2 ring-primary-500/20'
                    : 'border-line bg-panel hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="projectType"
                  value="mcq"
                  checked={form.projectType === 'mcq'}
                  onChange={() => setForm({ ...form, projectType: 'mcq' })}
                  className="sr-only"
                />
                <span className="text-sm font-bold text-ink">MCQ Quiz</span>
                <span className="mt-1 text-xs text-muted">Question with 4 options (A, B, C, D) + Correct Answer + Hint</span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all ${
                  form.projectType === 'classic'
                    ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30 ring-2 ring-primary-500/20'
                    : 'border-line bg-panel hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="projectType"
                  value="classic"
                  checked={form.projectType === 'classic'}
                  onChange={() => setForm({ ...form, projectType: 'classic' })}
                  className="sr-only"
                />
                <span className="text-sm font-bold text-ink">Classic Prompt / Answer</span>
                <span className="mt-1 text-xs text-muted">Custom 3 fields (e.g. Word, Definition, Hint)</span>
              </label>
            </div>
          </div>

          {form.projectType === 'classic' && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Custom Field Labels</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Field 1</label>
                  <input
                    value={form.field1}
                    onChange={(e) => setForm({ ...form, field1: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Field 2</label>
                  <input
                    value={form.field2}
                    onChange={(e) => setForm({ ...form, field2: e.target.value })}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Field 3</label>
                  <input
                    value={form.field3}
                    onChange={(e) => setForm({ ...form, field3: e.target.value })}
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label">Questions Per Quiz Session</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={form.questionsPerQuiz}
              onChange={(e) => setForm({ ...form, questionsPerQuiz: e.target.value })}
              className="input text-sm"
            />
            <p className="hint">How many random questions the <code>/session</code> API returns on each call.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-xs">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Connect Game Modal */}
      {connectTarget && (
        <Modal isOpen={!!connectTarget} onClose={() => setConnectTarget(null)} title={`Connect Game: ${connectTarget.name}`}>
          <ConnectGame
            project={connectTarget}
            onProjectUpdate={(updated) => {
              setConnectTarget(updated);
              setProjects((prev) => prev.map((p) => (p._id === updated._id ? { ...p, allowedOrigins: updated.allowedOrigins } : p)));
            }}
          />
        </Modal>
      )}

      {/* Live Game Simulator Modal */}
      <GameSimulatorModal
        isOpen={!!simulatorTarget}
        onClose={() => setSimulatorTarget(null)}
        project={simulatorTarget}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated questions will be permanently deleted.`}
        confirmText="Delete Project"
        loading={deleting}
      />
    </div>
  );
}
