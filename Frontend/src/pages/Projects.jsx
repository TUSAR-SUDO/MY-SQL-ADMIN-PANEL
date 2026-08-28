import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ListChecks, Search, Plug, Globe, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ConnectGame from '../components/ConnectGame';
import { getProjects, createProject, updateProject, deleteProject } from '../api';

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

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [connectTarget, setConnectTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjects({ search, page, limit: 10 });
      setProjects(res.data.projects);
      setTotal(res.data.total);
      setLoadError('');
    } catch (err) {
      // Keep the reason on screen: an empty table and a failed request
      // should never look the same.
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
      field1: project.fieldLabels.field1,
      field2: project.fieldLabels.field2,
      field3: project.fieldLabels.field3,
      mainQuestionField: project.mainQuestionField,
      questionsPerQuiz: project.questionsPerQuiz,
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

  const columns = [
    {
      key: 'name',
      label: 'Project',
      render: (r) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink">{r.name}</p>
          <code className="font-mono text-xs text-muted">{r.slug}</code>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className={r.projectType === 'mcq' ? 'badge-accent' : 'badge-neutral'}>
          {r.projectType === 'mcq' ? 'MCQ' : 'Classic'}
        </span>
      ),
    },
    {
      key: 'fields',
      label: 'Fields',
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.projectType === 'mcq' ? (
            <span className="badge-primary">Question + 4 Options</span>
          ) : (
            ['field1', 'field2', 'field3'].map((key) => (
              <span
                key={key}
                className={key === r.mainQuestionField ? 'badge-primary' : 'badge-neutral'}
              >
                {r.fieldLabels[key]}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'questionsPerQuiz',
      label: 'Per session',
      render: (r) => <span className="font-semibold text-ink">{r.questionsPerQuiz}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
            placeholder="Search projects"
          />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} className="btn-primary">
          <Plus size={16} />
          Add project
        </motion.button>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        page={page}
        total={total}
        limit={10}
        onPageChange={setPage}
        loading={loading}
        error={loadError}
        onRetry={load}
        onRowClick={(r) => navigate(`/projects/${r._id}/questions`)}
        emptyMessage={search ? 'No project matches that' : 'No projects yet'}
        emptyHint={
          search
            ? 'Try a shorter search term.'
            : 'A project is one game: its three field labels, how many questions a session serves, and the endpoint your game reads.'
        }
        emptyAction={
          !search && (
            <button onClick={openAdd} className="btn-primary mt-1">
              <Plus size={16} />
              Create your first project
            </button>
          )
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Configure project' : 'Add project'}
        description={
          editing
            ? 'Field labels apply to every question in this bank.'
            : 'Name it after the game, then label the three fields your questions use.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="e.g. Vocab Kicker"
              required
            />
            <p className="hint">The slug your game uses is generated from this name.</p>
          </div>

          <div>
            <label className="label">Project type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, projectType: 'classic' })}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all ${
                  form.projectType === 'classic'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-line bg-surface text-muted hover:border-primary-200'
                }`}
              >
                <span className="block text-base">📝</span>
                Classic
                <span className="mt-0.5 block text-xs font-normal opacity-70">3 custom fields</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, projectType: 'mcq' })}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all ${
                  form.projectType === 'mcq'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-line bg-surface text-muted hover:border-primary-200'
                }`}
              >
                <span className="block text-base">🔘</span>
                MCQ
                <span className="mt-0.5 block text-xs font-normal opacity-70">Question + 4 options</span>
              </button>
            </div>
          </div>

          {form.projectType === 'classic' && (
            <>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Field 1 label</label>
                <input
                  value={form.field1}
                  onChange={(e) => setForm({ ...form, field1: e.target.value })}
                  className="input"
                  placeholder="Word"
                  required
                />
              </div>
              <div>
                <label className="label">Field 2 label</label>
                <input
                  value={form.field2}
                  onChange={(e) => setForm({ ...form, field2: e.target.value })}
                  className="input"
                  placeholder="Definition"
                  required
                />
              </div>
              <div>
                <label className="label">Field 3 label</label>
                <input
                  value={form.field3}
                  onChange={(e) => setForm({ ...form, field3: e.target.value })}
                  className="input"
                  placeholder="Hint"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Questions per session</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.questionsPerQuiz}
                  onChange={(e) => setForm({ ...form, questionsPerQuiz: e.target.value })}
                  className="input"
                  required
                />
                <p className="hint">How many the endpoint returns, chosen at random each call.</p>
              </div>
              <div>
                <label className="label">Field the game asks with</label>
                <select
                  value={form.mainQuestionField}
                  onChange={(e) => setForm({ ...form, mainQuestionField: e.target.value })}
                  className="input"
                >
                  <option value="field1">{form.field1}</option>
                  <option value="field2">{form.field2}</option>
                  <option value="field3">{form.field3}</option>
                </select>
                <p className="hint">Sent as `mainQuestionField` so the game knows the prompt.</p>
              </div>
            </div>
            </>
          )}

          {form.projectType === 'mcq' && (
            <div>
              <label className="label">Questions per session</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.questionsPerQuiz}
                onChange={(e) => setForm({ ...form, questionsPerQuiz: e.target.value })}
                className="input"
                required
              />
              <p className="hint">How many MCQs the endpoint returns per call.</p>
            </div>
          )}

          <div>
            <label className="label">Allowed game origins</label>
            <div className="flex gap-2">
              <input
                value={form.newOrigin || ''}
                onChange={(e) => setForm({ ...form, newOrigin: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const url = (form.newOrigin || '').trim().replace(/\/$/, '');
                    if (!url) return;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      toast.error('Enter a full URL starting with https://');
                      return;
                    }
                    if (form.allowedOrigins.includes(url)) {
                      toast.error('Already added');
                      return;
                    }
                    setForm({ ...form, allowedOrigins: [...form.allowedOrigins, url], newOrigin: '' });
                  }
                }}
                className="input flex-1"
                placeholder="https://my-game.vercel.app"
              />
              <button
                type="button"
                onClick={() => {
                  const url = (form.newOrigin || '').trim().replace(/\/$/, '');
                  if (!url) return;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    toast.error('Enter a full URL starting with https://');
                    return;
                  }
                  if (form.allowedOrigins.includes(url)) {
                    toast.error('Already added');
                    return;
                  }
                  setForm({ ...form, allowedOrigins: [...form.allowedOrigins, url], newOrigin: '' });
                }}
                className="btn-secondary px-3"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="hint">
              Add the game's URL so CORS allows it to fetch questions from this project.
            </p>
            {form.allowedOrigins && form.allowedOrigins.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {form.allowedOrigins.map((origin) => (
                  <div
                    key={origin}
                    className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe size={12} className="shrink-0 text-primary-500" />
                      <code className="truncate font-mono text-xs text-ink">{origin}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          allowedOrigins: form.allowedOrigins.filter((o) => o !== origin),
                        })
                      }
                      className="shrink-0 rounded p-0.5 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!connectTarget}
        onClose={() => setConnectTarget(null)}
        title={`Connect a game to ${connectTarget?.name || ''}`}
        description="Point your game at this endpoint and it pulls questions live."
        size="lg"
      >
        {connectTarget && (
          <ConnectGame
            project={connectTarget}
            onProjectUpdate={(updated) => {
              setConnectTarget(updated);
              setProjects((prev) =>
                prev.map((p) => (p._id === updated._id ? { ...p, allowedOrigins: updated.allowedOrigins } : p))
              );
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete project"
        message={`"${deleteTarget?.name}" and every question in it will be removed, and any game reading its endpoint will start getting 404s. This can't be undone.`}
        loading={deleting}
      />
    </div>
  );
};

export default Projects;
