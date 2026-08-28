import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload, Search, ArrowLeft, FileUp, ArrowRight, Columns3, Plug, PlugZap } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ConnectGame from '../components/ConnectGame';
import { getProject, getQuestions, addQuestion, updateQuestion, deleteQuestion, uploadQuestions } from '../api';

const Questions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ field1: '', field2: '', field3: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', hint: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({ field1: 0, field2: 1, field3: 2, optionA: 1, optionB: 2, optionC: 3, optionD: 4, correctAnswer: 5, hint: 6 });
  const [detectedHeaders, setDetectedHeaders] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, questionsRes] = await Promise.all([
        getProject(id),
        getQuestions(id, { search, page, limit: 10 }),
      ]);
      setProject(projectRes.data);
      setQuestions(questionsRes.data.questions);
      setTotal(questionsRes.data.total);
      setLoadError('');
    } catch (err) {
      // Without this the page spins forever when the project fetch fails.
      setLoadError(
        err.response?.data?.message ||
          (err.response
            ? `The API replied ${err.response.status}.`
            : 'The API did not respond. Is the backend running?')
      );
      setQuestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [id, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const isMcq = project?.projectType === 'mcq';

  const openAdd = () => {
    setEditing(null);
    setForm({ field1: '', field2: '', field3: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', hint: '' });
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({
      field1: q.field1, field2: q.field2, field3: q.field3,
      optionA: q.optionA || '', optionB: q.optionB || '', optionC: q.optionC || '', optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || '',
      hint: q.hint || q.field3 || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateQuestion(editing._id, form);
        toast.success('Question updated');
      } else {
        await addQuestion(id, form);
        toast.success('Question added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuestion(deleteTarget._id);
      toast.success('Question deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  // --- CSV/DOCX Preview Logic ---
  const parseCSVLocally = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += c;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  };

  const handleFileSelected = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // DOCX cannot be previewed client-side, send directly with a note
    if (selectedFile.name.toLowerCase().endsWith('.docx')) {
      setFile(selectedFile);
      setPreviewData([]);
      setDetectedHeaders([]);
      if (isMcq) {
        setColumnMapping({ field1: 0, optionA: 1, optionB: 2, optionC: 3, optionD: 4, correctAnswer: 5, hint: 6 });
      } else {
        setColumnMapping({ field1: 0, field2: 1, field3: 2 });
      }
      // Skip preview for DOCX, go straight to upload confirm
      setUploadOpen(false);
      setPreviewOpen(true);
      return;
    }

    // CSV: read and preview locally
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = parseCSVLocally(text);
      if (rows.length === 0) {
        toast.error('File appears to be empty');
        return;
      }
      // Detect if first row looks like headers
      const first = rows[0].map((c) => c.toLowerCase());
      const headerKeywords = ['word', 'definition', 'hint', 'question', 'answer', 'field1', 'field2', 'field3', 'option', 'opt a', 'option a'];
      const isHeader = first.some((c) => headerKeywords.some((k) => c.includes(k)));

      if (isHeader) {
        setDetectedHeaders(rows[0]);
        setPreviewData(rows.slice(1));
      } else {
        const maxCols = Math.max(...rows.map((r) => r.length));
        setDetectedHeaders(Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`));
        setPreviewData(rows);
      }
      // Auto-map columns
      if (isMcq) {
        setColumnMapping({
          field1: 0,
          optionA: Math.min(1, rows[0].length - 1),
          optionB: Math.min(2, rows[0].length - 1),
          optionC: Math.min(3, rows[0].length - 1),
          optionD: Math.min(4, rows[0].length - 1),
          correctAnswer: Math.min(5, rows[0].length - 1),
          hint: Math.min(6, rows[0].length - 1),
        });
      } else {
        setColumnMapping({ field1: 0, field2: Math.min(1, rows[0].length - 1), field3: Math.min(2, rows[0].length - 1) });
      }
      setFile(selectedFile);
      setUploadOpen(false);
      setPreviewOpen(true);
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmUpload = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Send column mapping to the backend
      formData.append('mapping[field1]', columnMapping.field1);
      if (isMcq) {
        formData.append('mapping[optionA]', columnMapping.optionA);
        formData.append('mapping[optionB]', columnMapping.optionB);
        formData.append('mapping[optionC]', columnMapping.optionC);
        formData.append('mapping[optionD]', columnMapping.optionD);
        formData.append('mapping[correctAnswer]', columnMapping.correctAnswer);
        formData.append('mapping[hint]', columnMapping.hint);
      } else {
        formData.append('mapping[field2]', columnMapping.field2);
        formData.append('mapping[field3]', columnMapping.field3);
      }
      const res = await uploadQuestions(id, formData);
      toast.success(`Imported ${res.data.inserted} questions${res.data.skipped ? ` (${res.data.skipped} skipped)` : ''}`);
      setPreviewOpen(false);
      setFile(null);
      setPreviewData([]);
      setDetectedHeaders([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!project) {
    if (loadError) {
      return (
        <div className="card mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-500">
            <PlugZap size={26} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">Couldn't open this project</h2>
          <p className="mt-1.5 text-sm text-muted">{loadError}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={() => navigate('/projects')} className="btn-secondary">
              <ArrowLeft size={16} />
              All projects
            </button>
            <button onClick={load} className="btn-primary">
              Try again
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-72" />
      </div>
    );
  }

  const labels = project.fieldLabels;

  const columns = isMcq
    ? [
        {
          key: 'field1',
          label: 'Question',
          render: (r) => (
            <div>
              <p className="font-semibold text-ink">{r.field1 || '—'}</p>
              {r.hint && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                  <span className="font-medium">💡 Hint:</span> {r.hint}
                </p>
              )}
            </div>
          ),
        },
        {
          key: 'options',
          label: 'Options',
          render: (r) => (
            <div className="flex flex-wrap gap-1">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <span
                  key={letter}
                  className={r.correctAnswer === letter ? 'badge-primary' : 'badge-neutral'}
                >
                  {letter}: {r[`option${letter}`] || '—'}
                </span>
              ))}
            </div>
          ),
        },
        {
          key: 'correctAnswer',
          label: 'Answer',
          render: (r) => (
            <span className="badge-primary font-bold">{r.correctAnswer || '—'}</span>
          ),
        },
        {
          key: 'actions',
          label: '',
          render: (r) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => openEdit(r)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-primary-50 hover:text-primary-700"
                title="Edit"
                aria-label="Edit question"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(r)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                title="Delete"
                aria-label="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ]
    : [
        {
          key: 'field1',
          label: labels.field1,
          render: (r) => <span className="font-semibold text-ink">{r.field1 || '—'}</span>,
        },
        { key: 'field2', label: labels.field2, render: (r) => <span className="text-muted">{r.field2 || '—'}</span> },
        { key: 'field3', label: labels.field3, render: (r) => <span className="text-muted">{r.field3 || '—'}</span> },
        {
          key: 'actions',
          label: '',
          render: (r) => (
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => openEdit(r)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-primary-50 hover:text-primary-700"
                title="Edit"
                aria-label="Edit question"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteTarget(r)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                title="Delete"
                aria-label="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ];

  const previewRows = previewData.slice(0, 10);
  const isDocx = file?.name?.toLowerCase().endsWith('.docx');

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="mt-0.5 rounded-lg p-2 text-muted transition-colors hover:bg-primary-50 hover:text-primary-700"
            aria-label="Back to projects"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">{project.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {['field1', 'field2', 'field3'].map((key) => (
                <span key={key} className={key === project.mainQuestionField ? 'badge-primary' : 'badge-neutral'}>
                  {labels[key]}
                </span>
              ))}
              {isMcq && <span className="badge-accent">MCQ</span>}
              <code className="chip-mono">{project.slug}</code>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setConnectOpen(true)} className="btn-secondary">
            <Plug size={16} />
            Connect a game
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setUploadOpen(true)} className="btn-secondary">
            <Upload size={16} />
            Import
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} className="btn-primary">
            <Plus size={16} />
            Add question
          </motion.button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input pl-10"
          placeholder={isMcq ? 'Search by question' : `Search by ${labels.field1.toLowerCase()}`}
        />
      </div>

      <DataTable
        columns={columns}
        data={questions}
        page={page}
        total={total}
        limit={10}
        onPageChange={setPage}
        loading={loading}
        error={loadError}
        onRetry={load}
        emptyMessage={search ? 'Nothing matches that' : 'This bank is empty'}
        emptyHint={
          search
            ? `No question has a ${labels.field1.toLowerCase()} like that.`
            : `Add one ${labels.field1.toLowerCase()} at a time, or import a CSV. Your game gets them on its next session.`
        }
        emptyAction={
          !search && (
            <button onClick={openAdd} className="btn-primary mt-1">
              <Plus size={16} />
              Add the first question
            </button>
          )
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit question' : 'Add question'}
        description={isMcq ? 'Fill in the question and all four options.' : `Your game asks with ${labels[project.mainQuestionField]}.`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{isMcq ? 'Question text' : labels.field1} (required)</label>
            <input
              value={form.field1}
              onChange={(e) => setForm({ ...form, field1: e.target.value })}
              className="input"
              placeholder={isMcq ? 'e.g. Who is India\'s Prime Minister?' : labels.field1}
              required
            />
          </div>

          {isMcq ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <div key={letter}>
                    <label className="label">Option {letter}</label>
                    <input
                      value={form[`option${letter}`]}
                      onChange={(e) => setForm({ ...form, [`option${letter}`]: e.target.value })}
                      className="input"
                      placeholder={`Option ${letter}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Correct answer</label>
                <select
                  value={form.correctAnswer}
                  onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select the correct option</option>
                  <option value="A">A{form.optionA ? ` — ${form.optionA}` : ''}</option>
                  <option value="B">B{form.optionB ? ` — ${form.optionB}` : ''}</option>
                  <option value="C">C{form.optionC ? ` — ${form.optionC}` : ''}</option>
                  <option value="D">D{form.optionD ? ` — ${form.optionD}` : ''}</option>
                </select>
              </div>

              <div>
                <label className="label">Hint (optional)</label>
                <input
                  value={form.hint}
                  onChange={(e) => setForm({ ...form, hint: e.target.value })}
                  className="input"
                  placeholder="e.g. Think about the Red Planet or its atmosphere"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">{labels.field2}</label>
                <input
                  value={form.field2}
                  onChange={(e) => setForm({ ...form, field2: e.target.value })}
                  className="input"
                  placeholder={labels.field2}
                />
              </div>
              <div>
                <label className="label">{labels.field3}</label>
                <input
                  value={form.field3}
                  onChange={(e) => setForm({ ...form, field3: e.target.value })}
                  className="input"
                  placeholder={labels.field3}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add question'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={connectOpen}
        onClose={() => setConnectOpen(false)}
        title={`Connect a game to ${project.name}`}
        description="Point your game at this endpoint and it pulls questions live."
        size="lg"
      >
        <ConnectGame project={project} />
      </Modal>

      {/* File Picker Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setFile(null);
        }}
        title="Import questions"
        description="CSV shows a preview and lets you map columns first. DOCX is parsed on the server."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-dashed border-primary-200 bg-brand-soft p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-panel text-primary-500 shadow-card">
              <FileUp size={22} />
            </div>
            <p className="mt-3 text-sm text-muted">Choose a .csv or .docx file</p>
            <input
              type="file"
              accept=".csv,.docx"
              onChange={handleFileSelected}
              className="mx-auto mt-3 block w-full text-sm text-muted file:mr-4 file:rounded-xl file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-700"
            />
          </div>
          <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
            {isMcq ? (
              <div className="space-y-1 text-xs text-muted">
                <p className="font-semibold text-ink">Supported DOCX & CSV format for MCQ with Hint:</p>
                <div className="rounded bg-panel p-2 font-mono text-[11px] text-primary-700">
                  1. Question text?<br />
                  A) Option 1<br />
                  B) Option 2<br />
                  C) Option 3<br />
                  D) Option 4<br />
                  Hint: Clue for this question<br />
                  Answer: D
                </div>
                <p>Or tables with 6-7 columns: Question | Option A | Option B | Option C | Option D | Answer | Hint</p>
              </div>
            ) : (
              <p className="text-xs text-muted">
                The first three columns map to <span className="font-semibold text-ink">{labels.field1}</span>,{' '}
                <span className="font-semibold text-ink">{labels.field2}</span> and{' '}
                <span className="font-semibold text-ink">{labels.field3}</span>. You can change that on the next step.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setUploadOpen(false);
                setFile(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview & Column Mapping Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setFile(null);
          setPreviewData([]);
          setDetectedHeaders([]);
        }}
        title="Preview and import"
        size="xl"
      >
        <div className="space-y-5">
          {/* Column Mapping */}
          {!isDocx && detectedHeaders.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Columns3 size={16} className="text-primary-600" />
                <h4 className="text-sm font-bold text-ink">Column mapping</h4>
              </div>
              <p className="mb-3 text-xs text-muted">
                Pick which column feeds each field. The preview below updates as you change it.
              </p>
              <div className={`grid grid-cols-1 gap-3 sm:grid-cols-${isMcq ? '3' : '3'}`}>
                {(isMcq
                  ? [
                      { key: 'field1', label: 'Question' },
                      { key: 'optionA', label: 'Option A' },
                      { key: 'optionB', label: 'Option B' },
                      { key: 'optionC', label: 'Option C' },
                      { key: 'optionD', label: 'Option D' },
                      { key: 'correctAnswer', label: 'Correct Answer' },
                      { key: 'hint', label: 'Hint' },
                    ]
                  : [
                      { key: 'field1', label: labels.field1 },
                      { key: 'field2', label: labels.field2 },
                      { key: 'field3', label: labels.field3 },
                    ]
                ).map((field) => (
                  <div key={field.key} className="rounded-xl border border-line bg-surface p-3">
                    <label className="label mb-1.5 text-primary-700">{field.label}</label>
                    <select
                      value={columnMapping[field.key]}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [field.key]: Number(e.target.value) })
                      }
                      className="input py-1.5 text-sm"
                    >
                      {detectedHeaders.map((h, i) => (
                        <option key={i} value={i}>
                          Col {i + 1}: {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {!isDocx && previewRows.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-bold text-ink">
                Preview — {previewData.length} row{previewData.length === 1 ? '' : 's'}
                {previewData.length > 10 ? ', first 10 shown' : ''}
              </h4>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface">
                      {isMcq ? (
                        <>
                          <th className="table-header">Question</th>
                          <th className="table-header">Opt A</th>
                          <th className="table-header">Opt B</th>
                          <th className="table-header">Opt C</th>
                          <th className="table-header">Opt D</th>
                          <th className="table-header">Answer</th>
                          <th className="table-header">Hint</th>
                        </>
                      ) : (
                        ['field1', 'field2', 'field3'].map((field) => (
                          <th key={field} className="table-header">
                            {labels[field]}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.02 }}
                        className="border-b border-line/60 last:border-0"
                      >
                        {isMcq ? (
                          <>
                            <td className="px-4 py-2 font-semibold text-ink">
                              {row[columnMapping.field1] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {row[columnMapping.optionA] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {row[columnMapping.optionB] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {row[columnMapping.optionC] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {row[columnMapping.optionD] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 font-bold text-primary-700">
                              {row[columnMapping.correctAnswer] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-xs text-muted">
                              {row[columnMapping.hint] || <span className="text-muted/50">—</span>}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2 font-semibold text-ink">
                              {row[columnMapping.field1] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {row[columnMapping.field2] || <span className="text-muted/50">—</span>}
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {row[columnMapping.field3] || <span className="text-muted/50">—</span>}
                            </td>
                          </>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isDocx ? (
            <div className="rounded-xl border border-primary-200 bg-brand-soft p-4">
              <p className="text-sm text-primary-900">
                {isMcq ? (
                  <>
                    Word DOCX will be automatically parsed into <span className="font-semibold">Question, 4 Options (A, B, C, D)</span> and <span className="font-semibold">Correct Answer</span>.
                  </>
                ) : (
                  <>
                    DOCX will be parsed on the server and mapped to <span className="font-semibold">{labels.field1}</span>, <span className="font-semibold">{labels.field2}</span> and <span className="font-semibold">{labels.field3}</span>.
                  </>
                )}
              </p>
              <p className="mt-2 text-xs text-muted">
                {file?.name} · {(file?.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setPreviewOpen(false);
                setUploadOpen(true);
                setFile(null);
                setPreviewData([]);
                setDetectedHeaders([]);
              }}
              className="btn-secondary"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPreviewOpen(false);
                  setFile(null);
                  setPreviewData([]);
                  setDetectedHeaders([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirmUpload}
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Importing…
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Import {previewData.length > 0 ? `${previewData.length} rows` : 'file'}
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete question"
        message={`"${deleteTarget?.field1 || 'This question'}" will be removed from the bank. This can't be undone.`}
        loading={deleting}
      />
    </div>
  );
};

export default Questions;