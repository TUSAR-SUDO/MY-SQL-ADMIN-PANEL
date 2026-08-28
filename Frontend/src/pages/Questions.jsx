import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Search,
  ArrowLeft,
  FileUp,
  ArrowRight,
  Columns3,
  Plug,
  PlugZap,
  Download,
  Play,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  CheckSquare,
  Square,
  RefreshCw,
  Flame,
  Tag,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ConnectGame from '../components/ConnectGame';
import GameSimulatorModal from '../components/GameSimulatorModal';
import AIQuestionGeneratorModal from '../components/AIQuestionGeneratorModal';
import {
  getProject,
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestions,
  bulkDeleteQuestions,
  seedSampleQuestions,
} from '../api';

const difficultyBadge = (difficulty = 'medium') => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#4A7C59]/15 px-2 py-0.5 text-[10px] font-bold text-[#4A7C59] dark:text-[#78B48B] border border-[#4A7C59]/30">🟢 Easy</span>;
    case 'hard':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#C94A4A]/15 px-2 py-0.5 text-[10px] font-bold text-[#C94A4A] dark:text-[#E87A7A] border border-[#C94A4A]/30">🔴 Hard</span>;
    default:
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#D99B43]/15 px-2 py-0.5 text-[10px] font-bold text-[#B87A28] dark:text-[#F3BE65] border border-[#D99B43]/30">🟡 Medium</span>;
  }
};

export default function Questions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    field1: '',
    field2: '',
    field3: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    hint: '',
    difficulty: 'medium',
    category: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [seedingSamples, setSeedingSamples] = useState(false);

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
        getQuestions(id, { search, page, limit: 10, difficulty: difficultyFilter }),
      ]);
      setProject(projectRes.data);
      setQuestions(questionsRes.data.questions || []);
      setTotal(questionsRes.data.total || 0);
      setLoadError('');
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          (err.response ? `The API replied ${err.response.status}.` : 'The API did not respond. Is the backend running?')
      );
      setQuestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [id, search, page, difficultyFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const isMcq = project?.projectType === 'mcq';

  // Toggle selection
  const toggleSelectOne = (qId) => {
    setSelectedIds((prev) => (prev.includes(qId) ? prev.filter((i) => i !== qId) : [...prev, qId]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q._id));
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      field1: '',
      field2: '',
      field3: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      hint: '',
      difficulty: 'medium',
      category: '',
    });
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditing(q);
    setForm({
      field1: q.field1 || '',
      field2: q.field2 || '',
      field3: q.field3 || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || '',
      hint: q.hint || q.field3 || '',
      difficulty: q.difficulty || 'medium',
      category: q.category || '',
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
      setSelectedIds((prev) => prev.filter((i) => i !== deleteTarget._id));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await bulkDeleteQuestions(id, selectedIds);
      toast.success(res.data.message || `Deleted ${selectedIds.length} questions`);
      setSelectedIds([]);
      setBulkConfirmOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSeedSamples = async () => {
    setSeedingSamples(true);
    try {
      const res = await seedSampleQuestions(id);
      toast.success(res.data.message || 'Seeded 5 sample questions!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed sample questions');
    } finally {
      setSeedingSamples(false);
    }
  };

  // Export to JSON
  const handleExportJSON = async () => {
    try {
      const allRes = await getQuestions(id, { limit: 1000 });
      const items = allRes.data.questions || [];
      const exportObject = {
        project: {
          name: project.name,
          slug: project.slug,
          projectType: project.projectType,
          questionsPerQuiz: project.questionsPerQuiz,
          fieldLabels: project.fieldLabels,
        },
        exportedAt: new Date().toISOString(),
        totalQuestions: items.length,
        questions: items,
      };
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-questions.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${items.length} questions to JSON`);
    } catch (err) {
      toast.error('Failed to export questions');
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      const allRes = await getQuestions(id, { limit: 1000 });
      const items = allRes.data.questions || [];
      let csvContent = '';

      if (isMcq) {
        csvContent = 'Question,Option A,Option B,Option C,Option D,Correct Answer,Hint,Difficulty,Category\n';
        items.forEach((q) => {
          const row = [
            `"${(q.field1 || '').replace(/"/g, '""')}"`,
            `"${(q.optionA || '').replace(/"/g, '""')}"`,
            `"${(q.optionB || '').replace(/"/g, '""')}"`,
            `"${(q.optionC || '').replace(/"/g, '""')}"`,
            `"${(q.optionD || '').replace(/"/g, '""')}"`,
            `"${q.correctAnswer || ''}"`,
            `"${(q.hint || '').replace(/"/g, '""')}"`,
            `"${q.difficulty || 'medium'}"`,
            `"${(q.category || '').replace(/"/g, '""')}"`,
          ];
          csvContent += row.join(',') + '\n';
        });
      } else {
        csvContent = `${project.fieldLabels?.field1 || 'Field 1'},${project.fieldLabels?.field2 || 'Field 2'},${project.fieldLabels?.field3 || 'Field 3'},Difficulty,Category\n`;
        items.forEach((q) => {
          const row = [
            `"${(q.field1 || '').replace(/"/g, '""')}"`,
            `"${(q.field2 || '').replace(/"/g, '""')}"`,
            `"${(q.field3 || '').replace(/"/g, '""')}"`,
            `"${q.difficulty || 'medium'}"`,
            `"${(q.category || '').replace(/"/g, '""')}"`,
          ];
          csvContent += row.join(',') + '\n';
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-questions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${items.length} questions to CSV`);
    } catch (err) {
      toast.error('Failed to export questions');
    }
  };

  // CSV parser for import
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

    if (selectedFile.name.toLowerCase().endsWith('.docx')) {
      setFile(selectedFile);
      setPreviewData([]);
      setDetectedHeaders([]);
      if (isMcq) {
        setColumnMapping({ field1: 0, optionA: 1, optionB: 2, optionC: 3, optionD: 4, correctAnswer: 5, hint: 6 });
      } else {
        setColumnMapping({ field1: 0, field2: 1, field3: 2 });
      }
      setUploadOpen(false);
      setPreviewOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const rows = parseCSVLocally(text);
      if (rows.length === 0) {
        toast.error('File appears to be empty');
        return;
      }
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
            <button onClick={() => navigate('/projects')} className="btn-secondary text-xs">
              <ArrowLeft size={15} /> All projects
            </button>
            <button onClick={load} className="btn-primary text-xs">
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

  const labels = project.fieldLabels || { field1: 'Field 1', field2: 'Field 2', field3: 'Field 3' };
  const poolRequired = project.questionsPerQuiz || 15;
  const isReady = total >= poolRequired;

  const columns = [
    {
      key: 'select',
      label: (
        <button
          type="button"
          onClick={toggleSelectAll}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          title={selectedIds.length === questions.length ? 'Deselect all' : 'Select all'}
        >
          {questions.length > 0 && selectedIds.length === questions.length ? (
            <CheckSquare size={16} className="text-indigo-600" />
          ) : (
            <Square size={16} />
          )}
        </button>
      ),
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectOne(r._id);
          }}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
        >
          {selectedIds.includes(r._id) ? (
            <CheckSquare size={16} className="text-indigo-600" />
          ) : (
            <Square size={16} />
          )}
        </button>
      ),
    },
    ...(isMcq
      ? [
          {
            key: 'field1',
            label: 'Question',
            render: (r) => (
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{r.field1 || '—'}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {difficultyBadge(r.difficulty)}
                  {r.category && (
                    <span className="inline-flex items-center gap-1 rounded bg-surface border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      <Tag size={10} /> {r.category}
                    </span>
                  )}
                  {r.hint && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                      <span className="font-medium">💡 Hint:</span> {r.hint}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'options',
            label: 'Options',
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const val = r[`option${letter}`];
                  if (!val) return null;
                  return (
                    <span
                      key={letter}
                      className={r.correctAnswer === letter ? 'badge-primary text-[11px]' : 'badge-neutral text-[11px]'}
                    >
                      {letter}: {val}
                    </span>
                  );
                })}
              </div>
            ),
          },
          {
            key: 'correctAnswer',
            label: 'Answer',
            render: (r) => <span className="badge-primary font-bold">{r.correctAnswer || '—'}</span>,
          },
        ]
      : [
          {
            key: 'field1',
            label: labels.field1,
            render: (r) => (
              <div>
                <p className="font-semibold text-ink">{r.field1 || '—'}</p>
                <div className="mt-1 flex items-center gap-2">
                  {difficultyBadge(r.difficulty)}
                  {r.category && (
                    <span className="rounded bg-surface border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                      #{r.category}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          { key: 'field2', label: labels.field2, render: (r) => <span className="text-ink/80">{r.field2 || '—'}</span> },
          { key: 'field3', label: labels.field3, render: (r) => <span className="text-muted">{r.field3 || '—'}</span> },
        ]),
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEdit(r)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-primary-500 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="btn-secondary mt-1 p-2"
            aria-label="Back to projects"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-bold text-ink">{project.name}</h2>
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-bold uppercase ${
                  isMcq ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' : 'bg-surface text-muted border border-line'
                }`}
              >
                {isMcq ? 'MCQ Quiz' : 'Classic'}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              <code className="chip-mono text-[11px]">{project.slug}</code>
              <span>•</span>
              <span>Serves <strong>{project.questionsPerQuiz}</strong> questions per session</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Generator Button */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-accent-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-primary-500/25 hover:scale-105 transition-all"
          >
            <Sparkles size={14} className="text-amber-200 animate-pulse" />
            <span>AI Generator</span>
          </button>

          <button
            onClick={() => setSimulatorOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/40 px-3.5 py-2 text-xs font-bold text-primary-700 dark:text-primary-300 hover:bg-primary-100 transition-all"
          >
            <Play size={13} className="fill-primary-700 dark:fill-primary-300" />
            <span>Play Test</span>
          </button>

          <button onClick={() => setConnectOpen(true)} className="btn-secondary text-xs">
            <Plug size={14} />
            <span>Connect</span>
          </button>

          <div className="flex items-center rounded-xl border border-line bg-surface p-0.5">
            <button
              onClick={handleExportJSON}
              title="Export to JSON"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-panel transition-colors"
            >
              <FileJson size={13} className="text-[#D99B43]" />
              <span>JSON</span>
            </button>
            <span className="text-line">|</span>
            <button
              onClick={handleExportCSV}
              title="Export to CSV"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-panel transition-colors"
            >
              <FileSpreadsheet size={13} className="text-[#4A7C59]" />
              <span>CSV</span>
            </button>
          </div>

          <button onClick={() => setUploadOpen(true)} className="btn-secondary text-xs">
            <Upload size={14} />
            <span>Import</span>
          </button>

          <button onClick={openAdd} className="btn-primary text-xs">
            <Plus size={14} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Pool Readiness Banner */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border p-4 text-xs ${
          total === 0
            ? 'border-[#C94A4A]/30 bg-[#C94A4A]/10 text-[#C94A4A] dark:text-[#E87A7A]'
            : isReady
            ? 'border-[#4A7C59]/30 bg-[#4A7C59]/10 text-[#4A7C59] dark:text-[#78B48B]'
            : 'border-[#D99B43]/30 bg-[#D99B43]/10 text-[#B87A28] dark:text-[#F3BE65]'
        }`}
      >
        <div className="flex items-center gap-3">
          {total === 0 ? (
            <AlertTriangle size={18} className="text-[#C94A4A] shrink-0" />
          ) : isReady ? (
            <CheckCircle2 size={18} className="text-[#4A7C59] shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-[#D99B43] shrink-0" />
          )}
          <div>
            <p className="font-bold">
              {total === 0
                ? 'Question pool is empty'
                : isReady
                ? `Ready to serve (${total} questions available in bank)`
                : `Low question bank (${total} / ${poolRequired} needed for random sessions)`}
            </p>
            <p className="mt-0.5 opacity-90">
              {total === 0
                ? 'Generate with AI or add questions manually to start serving real game sessions.'
                : isReady
                ? `Each game session will randomly select ${poolRequired} questions from your pool of ${total}.`
                : `We recommend adding at least ${poolRequired - total} more questions to prevent question repetition in games.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-primary-600 transition-all hover:scale-105"
          >
            <Sparkles size={13} className="text-amber-200" />
            <span>Generate with AI</span>
          </button>
          {total < poolRequired && (
            <button
              onClick={handleSeedSamples}
              disabled={seedingSamples}
              className="btn-secondary px-3 py-1.5 text-xs font-semibold"
            >
              <span>{seedingSamples ? 'Seeding...' : 'Seed 5 Samples'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search, Filter & Bulk Selection Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3 max-w-lg">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-10 text-xs"
              placeholder={isMcq ? 'Search questions by keyword...' : `Search by ${labels.field1.toLowerCase()}...`}
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center rounded-xl border border-line bg-surface p-1 text-xs">
            <button
              onClick={() => {
                setDifficultyFilter('all');
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                difficultyFilter === 'all' ? 'bg-panel font-bold text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setDifficultyFilter('easy');
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                difficultyFilter === 'easy' ? 'bg-panel font-bold text-emerald-500 shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => {
                setDifficultyFilter('medium');
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                difficultyFilter === 'medium' ? 'bg-panel font-bold text-amber-500 shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => {
                setDifficultyFilter('hard');
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                difficultyFilter === 'hard' ? 'bg-panel font-bold text-rose-500 shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Floating Bulk Action Indicator */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-3.5 py-1.5 text-xs text-white shadow-lg border border-slate-700"
            >
              <span className="font-semibold">{selectedIds.length} selected</span>
              <button
                onClick={() => setBulkConfirmOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question Table */}
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
        emptyMessage={search ? 'No questions match your query' : 'This question bank is empty'}
        emptyHint="Use the AI Question Generator to create questions in seconds, or add manually."
        emptyAction={
          !search && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <button onClick={() => setAiModalOpen(true)} className="btn-primary text-xs bg-gradient-to-r from-purple-600 to-indigo-600">
                <Sparkles size={13} className="text-amber-300" />
                Generate with AI
              </button>
              <button onClick={handleSeedSamples} disabled={seedingSamples} className="btn-secondary text-xs">
                Seed 5 Sample Questions
              </button>
              <button onClick={openAdd} className="btn-secondary text-xs">
                <Plus size={13} />
                Add Question
              </button>
            </div>
          )
        }
      />

      {/* Edit / Create Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Question' : 'Add New Question'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isMcq ? (
            <>
              <div>
                <label className="label">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={form.field1}
                  onChange={(e) => setForm({ ...form, field1: e.target.value })}
                  className="input text-sm resize-none"
                  placeholder="e.g. Which cricketer has the highest individual score in ODI cricket?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Option A</label>
                  <input
                    required
                    value={form.optionA}
                    onChange={(e) => setForm({ ...form, optionA: e.target.value })}
                    className="input text-xs"
                    placeholder="Option A"
                  />
                </div>
                <div>
                  <label className="label">Option B</label>
                  <input
                    required
                    value={form.optionB}
                    onChange={(e) => setForm({ ...form, optionB: e.target.value })}
                    className="input text-xs"
                    placeholder="Option B"
                  />
                </div>
                <div>
                  <label className="label">Option C</label>
                  <input
                    required
                    value={form.optionC}
                    onChange={(e) => setForm({ ...form, optionC: e.target.value })}
                    className="input text-xs"
                    placeholder="Option C"
                  />
                </div>
                <div>
                  <label className="label">Option D</label>
                  <input
                    required
                    value={form.optionD}
                    onChange={(e) => setForm({ ...form, optionD: e.target.value })}
                    className="input text-xs"
                    placeholder="Option D"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Correct Answer</label>
                  <select
                    required
                    value={form.correctAnswer}
                    onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    className="input text-xs font-bold"
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="input text-xs font-semibold"
                  >
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category / Tag</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input text-xs"
                    placeholder="e.g. IPL, WorldCup"
                  />
                </div>
              </div>

              <div>
                <label className="label">Hint (Optional)</label>
                <input
                  value={form.hint}
                  onChange={(e) => setForm({ ...form, hint: e.target.value })}
                  className="input text-xs"
                  placeholder="Clue for players"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">{labels.field1}</label>
                <input
                  required
                  value={form.field1}
                  onChange={(e) => setForm({ ...form, field1: e.target.value })}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">{labels.field2}</label>
                <textarea
                  rows={2}
                  value={form.field2}
                  onChange={(e) => setForm({ ...form, field2: e.target.value })}
                  className="input text-sm resize-none"
                />
              </div>
              <div>
                <label className="label">{labels.field3}</label>
                <input
                  value={form.field3}
                  onChange={(e) => setForm({ ...form, field3: e.target.value })}
                  className="input text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="input text-xs font-semibold"
                  >
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category / Tag</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input text-xs"
                    placeholder="e.g. Science, Grammar"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-xs">
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Question Generator Modal */}
      <AIQuestionGeneratorModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        project={project}
        onQuestionsGenerated={load}
      />

      {/* Upload File Modal */}
      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Import Question Bank">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload a <strong>CSV spreadsheet</strong> or <strong>Word (.docx) document</strong> to bulk import questions into this game.
          </p>
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-indigo-500 transition-colors">
            <FileUp size={36} className="text-indigo-500" />
            <label className="btn-primary mt-4 cursor-pointer text-xs font-semibold">
              <span>Choose CSV or DOCX file</span>
              <input
                type="file"
                accept=".csv,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv"
                onChange={handleFileSelected}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </Modal>

      {/* CSV Column Mapping Preview Modal */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Confirm File Import">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            File: <strong>{file?.name}</strong>. Confirm column associations before inserting into MySQL.
          </p>

          {isMcq ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['field1', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'hint'].map((key) => (
                <div key={key}>
                  <label className="font-semibold capitalize text-slate-700">{key}</label>
                  <select
                    value={columnMapping[key] ?? 0}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [key]: Number(e.target.value) })}
                    className="input mt-1 text-xs"
                  >
                    {detectedHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} (Col {i + 1})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['field1', 'field2', 'field3'].map((key) => (
                <div key={key}>
                  <label className="font-semibold text-slate-700">{labels[key]}</label>
                  <select
                    value={columnMapping[key] ?? 0}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [key]: Number(e.target.value) })}
                    className="input mt-1 text-xs"
                  >
                    {detectedHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} (Col {i + 1})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setPreviewOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmUpload} disabled={uploading} className="btn-primary text-xs">
              {uploading ? 'Importing...' : 'Confirm & Insert'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Connect Game Modal */}
      {connectOpen && (
        <Modal isOpen={connectOpen} onClose={() => setConnectOpen(false)} title={`Connect Game: ${project.name}`}>
          <ConnectGame
            project={project}
            onProjectUpdate={(updated) => setProject(updated)}
          />
        </Modal>
      )}

      {/* Game Simulator Modal */}
      <GameSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        project={project}
      />

      {/* Delete Single Question */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? It will no longer appear in game sessions."
        confirmText="Delete Question"
        loading={deleting}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedIds.length} Questions`}
        message={`Are you sure you want to permanently delete ${selectedIds.length} selected questions from MySQL?`}
        confirmText="Delete Selected"
        loading={bulkDeleting}
      />
    </div>
  );
}