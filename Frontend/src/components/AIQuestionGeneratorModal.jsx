import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Zap,
  Check,
  Loader2,
  X,
  Key,
  Flame,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateAIQuestions } from '../api';

const presets = [
  { label: '🏏 Cricket World Cup', prompt: 'ICC Cricket World Cup iconic moments, records, and captains' },
  { label: '🏆 IPL & T20 Records', prompt: 'IPL matches, highest scores, purple/orange cap records, and teams' },
  { label: '🌍 World Geography', prompt: 'World capitals, famous landmarks, rivers, and mountains' },
  { label: '🧪 Science & Inventions', prompt: 'Famous scientific discoveries, periodic table elements, and inventors' },
  { label: '📚 Vocabulary & Idioms', prompt: 'Advanced English vocabulary words, meanings, and common idioms' },
];

export default function AIQuestionGeneratorModal({ isOpen, onClose, project, onQuestionsGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);

  if (!isOpen || !project) return null;

  const isMcq = (project.projectType || 'classic') === 'mcq';

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter a topic or prompt');
      return;
    }

    setGenerating(true);
    setPreviewQuestions([]);

    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    }

    try {
      const res = await generateAIQuestions(project._id, {
        prompt: prompt.trim(),
        count: Number(count),
        difficulty,
        category: category.trim(),
        apiKey: apiKey.trim() || undefined,
      });

      toast.success(res.data.message || `Generated & saved ${res.data.count} questions to MySQL!`);
      if (onQuestionsGenerated) {
        onQuestionsGenerated();
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'AI generation failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('api key')) {
        setShowKeyInput(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#3A3530] bg-[#191716] text-[#FAF8F5] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2C2926] bg-gradient-to-r from-[#1D1B19] via-[#2A2622] to-[#1D1B19] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-glow">
              <Sparkles size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-white tracking-tight">AI Question Bank Generator</h3>
                <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-[10px] font-bold text-primary-300 border border-primary-500/30">
                  Powered by Gemini AI
                </span>
              </div>
              <p className="text-xs text-[#A8A196]">
                Generating for: <strong className="text-[#FAF8F5]">{project.name}</strong> ({isMcq ? 'MCQ Quiz' : 'Classic'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#A8A196] hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Preset Ideas */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A8A196] mb-2">
              <Lightbulb size={13} className="text-accent-400" />
              <span>Quick Prompt Ideas</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPrompt(p.prompt)}
                  className="rounded-lg border border-[#35312C] bg-[#24211E] px-2.5 py-1 text-xs font-medium text-[#D5CEC5] hover:border-primary-500/60 hover:bg-primary-500/10 hover:text-white transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic / Prompt Input */}
          <div>
            <label className="label text-xs font-bold uppercase text-[#D5CEC5]">
              Topic, Concept, or Instructions
            </label>
            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isMcq
                  ? 'e.g. 2024 IPL final match records, highest run scorers, and iconic catches with educational hints'
                  : 'e.g. Advanced vocabulary words about emotions and psychology with clear definitions and hints'
              }
              className="input text-xs resize-none bg-[#24211E] border-[#35312C] text-[#FAF8F5] focus:border-primary-500"
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Number of questions */}
            <div>
              <label className="label text-xs font-semibold text-[#D5CEC5]">Number of Questions</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="input text-xs bg-[#24211E] border-[#35312C] text-[#FAF8F5]"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="label text-xs font-semibold text-[#D5CEC5]">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input text-xs bg-[#24211E] border-[#35312C] text-[#FAF8F5]"
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>

            {/* Category / Sub-topic */}
            <div>
              <label className="label text-xs font-semibold text-[#D5CEC5]">Category Tag (Optional)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. IPL, WorldCup"
                className="input text-xs bg-[#24211E] border-[#35312C] text-[#FAF8F5]"
              />
            </div>
          </div>

          {/* Optional Gemini API Key Bar */}
          <div className="rounded-2xl border border-[#35312C] bg-[#24211E]/70 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-[#A8A196] font-medium">
                <Key size={13} className="text-primary-400" />
                <span>Gemini API Key</span>
              </span>
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-primary-400 hover:text-primary-300 underline text-xs font-medium"
              >
                {showKeyInput ? 'Hide Key' : apiKey ? 'Change Key' : 'Enter API Key'}
              </button>
            </div>

            {showKeyInput && (
              <div className="mt-2.5 space-y-1.5">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Google Gemini API Key (starts with AIzaSy...)"
                  className="input text-xs bg-[#191716] border-[#35312C] text-[#FAF8F5]"
                />
                <p className="text-[11px] text-[#A8A196]">
                  Get a free API key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-400 hover:underline"
                  >
                    aistudio.google.com/app/apikey
                  </a>
                  . Key is saved locally in your browser.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2926]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#35312C] bg-[#24211E] px-4 py-2 text-xs font-semibold text-[#D5CEC5] hover:bg-[#2F2C28] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 px-6 py-2 text-xs font-bold text-white shadow-glow hover:scale-105 transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating {count} Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate & Save to Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
