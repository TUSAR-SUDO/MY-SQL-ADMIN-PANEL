import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Loader2,
  X,
  Flame,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Gamepad2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicApiBase } from '../config';
import { updateProject } from '../api';

export default function GameSimulatorModal({ isOpen, onClose, project, onProjectUpdate }) {
  const [activeTab, setActiveTab] = useState('embed'); // 'embed' | 'simulator' | 'json'
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  
  // Game Embed URL State
  const defaultUrl = (project?.allowedOrigins && project.allowedOrigins.length > 0)
    ? project.allowedOrigins[0]
    : 'https://cricket-nine-phi.vercel.app';
  const [embeddedUrl, setEmbeddedUrl] = useState(defaultUrl);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [iframeLoading, setIframeLoading] = useState(true);

  // Simulator Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameFinished, setGameFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [apiBase, setApiBase] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPublicApiBase().then(setApiBase);
  }, []);

  useEffect(() => {
    if (project?.allowedOrigins && project.allowedOrigins.length > 0) {
      setEmbeddedUrl(project.allowedOrigins[0]);
    }
  }, [project]);

  const loadSession = async () => {
    if (!project?.slug) return;
    setLoading(true);
    setError('');
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setShowHint(false);
    setScore(0);
    setStreak(0);
    setGameFinished(false);

    try {
      const base = apiBase || window.location.origin;
      const res = await fetch(`${base}/api/public/projects/${project.slug}/session`);
      if (!res.ok) {
        throw new Error(`Endpoint returned status ${res.status}`);
      }
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        setError('The question bank is currently empty. Add questions to this project to start play-testing.');
      } else {
        setQuestions(data.questions);
      }
    } catch (err) {
      setError(`Failed to fetch quiz session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      loadSession();
    }
  }, [isOpen, project, apiBase]);

  const handleRefreshIframe = () => {
    setIframeLoading(true);
    setIframeKey(Date.now());
  };

  const handleSaveGameUrl = async () => {
    let clean = embeddedUrl.trim().replace(/\/+$/, '');
    if (!clean) return;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
      setEmbeddedUrl(clean);
    }
    const current = project.allowedOrigins || [];
    if (!current.includes(clean)) {
      try {
        const updated = [clean, ...current.filter((o) => o !== clean)];
        await updateProject(project._id, { allowedOrigins: updated });
        toast.success('Saved game URL & authorized in CORS');
        if (onProjectUpdate) {
          onProjectUpdate({ ...project, allowedOrigins: updated });
        }
      } catch (err) {
        toast.error('Failed to save game URL');
      }
    }
    handleRefreshIframe();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
    setCopied(true);
    toast.success('Raw JSON copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  if (!isOpen || !project) return null;

  const isMcq = (project.projectType || 'classic') === 'mcq';
  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const progressPercent = totalQ > 0 ? ((currentIndex + 1) / totalQ) * 100 : 0;

  const handleSelectOption = (letter) => {
    if (selectedOption !== null || !currentQ) return;
    setSelectedOption(letter);
    const isCorrect = letter === currentQ.correctAnswer;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setScore((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < totalQ) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
      setShowHint(false);
    } else {
      setGameFinished(true);
    }
  };

  const mainField = project.mainQuestionField || 'field2';
  const answerField = mainField === 'field1' ? 'field2' : 'field1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md animate-fade-in">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/95 px-6 py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
              <Gamepad2 size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold text-white">{project.name}</h3>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                  {isMcq ? 'MCQ Quiz' : 'Classic'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Live Game Integration & Play-Testing Canvas</p>
            </div>
          </div>

          {/* Tab Controls */}
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1 text-xs">
            <button
              onClick={() => setActiveTab('embed')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                activeTab === 'embed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe size={13} />
              <span>Live Game (Embedded)</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>Quiz Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all ${
                activeTab === 'json' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 size={13} />
              <span>Raw JSON</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab 1: LIVE GAME EMBED (Play your actual Vercel/Web game here!) */}
        {activeTab === 'embed' && (
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
            {/* Top Toolbar for Embedded Game */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-2.5 gap-3 text-xs">
              {/* Game URL Input Bar */}
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <Globe size={14} className="text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={embeddedUrl}
                  onChange={(e) => setEmbeddedUrl(e.target.value)}
                  onBlur={handleSaveGameUrl}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGameUrl()}
                  placeholder="e.g. https://cricket-nine-phi.vercel.app"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveGameUrl}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Load
                </button>
              </div>

              {/* Viewport & Controls */}
              <div className="flex items-center gap-3">
                {/* Device Viewport Toggle */}
                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5">
                  <button
                    onClick={() => setDeviceView('desktop')}
                    title="Desktop View"
                    className={`rounded p-1.5 ${deviceView === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    onClick={() => setDeviceView('tablet')}
                    title="Tablet View (768px)"
                    className={`rounded p-1.5 ${deviceView === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Tablet size={14} />
                  </button>
                  <button
                    onClick={() => setDeviceView('mobile')}
                    title="Mobile View (390px)"
                    className={`rounded p-1.5 ${deviceView === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Smartphone size={14} />
                  </button>
                </div>

                {/* Reload & External Link */}
                <button
                  onClick={handleRefreshIframe}
                  title="Reload game (re-fetches questions)"
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw size={13} className={iframeLoading ? 'animate-spin' : ''} />
                  <span>Reload</span>
                </button>

                <a
                  href={embeddedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink size={13} />
                  <span>Open in Tab</span>
                </a>
              </div>
            </div>

            {/* Iframe Viewport Container */}
            <div className="flex flex-1 items-center justify-center overflow-auto p-4 bg-dot-pattern">
              <div
                className={`relative flex h-full overflow-hidden rounded-2xl border border-slate-700/80 bg-white shadow-2xl transition-all duration-300 ${
                  deviceView === 'mobile'
                    ? 'w-[390px] max-h-[780px] rounded-[36px] border-4 border-slate-700 shadow-indigo-500/10'
                    : deviceView === 'tablet'
                    ? 'w-[768px] max-h-[850px] border-2 border-slate-700'
                    : 'w-full h-full'
                }`}
              >
                {iframeLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                    <p className="mt-3 text-xs font-semibold">Loading live game preview...</p>
                    <p className="mt-1 text-[11px] text-slate-500">{embeddedUrl}</p>
                  </div>
                )}

                <iframe
                  key={iframeKey}
                  src={embeddedUrl}
                  title="Live Game Preview"
                  onLoad={() => setIframeLoading(false)}
                  className="h-full w-full border-0 bg-slate-950"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected to MySQL Database</span>
              </div>
              <span>
                Testing: <code className="text-slate-300">{project.slug}</code> (Serves {project.questionsPerQuiz} random questions/session)
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: IN-ADMIN QUIZ SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 size={36} className="animate-spin text-indigo-500" />
                <p className="mt-4 text-sm font-medium">Serving live random session from MySQL...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                  <HelpCircle size={24} />
                </div>
                <h4 className="mt-4 text-base font-bold text-slate-200">Session Not Available</h4>
                <p className="mt-1.5 max-w-md text-sm text-slate-400">{error}</p>
                <button
                  onClick={loadSession}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            ) : gameFinished ? (
              /* Results Screen */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-xl shadow-amber-500/25">
                  <Trophy size={48} className="text-slate-950" />
                </div>

                <h4 className="mt-6 text-2xl font-bold text-white">Session Complete!</h4>
                <p className="mt-1 text-sm text-slate-400">
                  Tested <span className="font-semibold text-slate-200">{totalQ} questions</span> from the live MySQL question bank.
                </p>

                {isMcq ? (
                  <div className="mt-6 flex items-center gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/60 px-6 py-4">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Final Score</p>
                      <p className="mt-1 font-heading text-3xl font-extrabold text-emerald-400">
                        {score} <span className="text-lg font-normal text-slate-500">/ {totalQ}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-800/60 px-6 py-4">
                      <p className="text-xs uppercase tracking-wider text-slate-400">Accuracy</p>
                      <p className="mt-1 font-heading text-3xl font-extrabold text-indigo-400">
                        {Math.round((score / totalQ) * 100)}%
                      </p>
                    </div>
                    {maxStreak > 1 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-800/60 px-6 py-4">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Max Streak</p>
                        <p className="mt-1 flex items-center gap-1 font-heading text-3xl font-extrabold text-amber-400">
                          <Flame size={24} className="text-orange-500" />
                          {maxStreak}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={loadSession}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                  >
                    <RotateCcw size={16} />
                    Play Again (New Random Batch)
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Active Game Screen */
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-indigo-400">
                    Question {currentIndex + 1} of {totalQ}
                  </span>
                  {isMcq && (
                    <div className="flex items-center gap-4">
                      {streak > 1 && (
                        <span className="flex items-center gap-1 font-bold text-orange-400">
                          <Flame size={14} className="animate-bounce" /> {streak} Streak!
                        </span>
                      )}
                      <span className="font-medium text-slate-300">
                        Score: <strong className="text-emerald-400">{score}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 shadow-inner"
                >
                  {isMcq ? (
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {project.fieldLabels?.field1 || 'Question'}
                      </span>
                      <h4 className="mt-2 text-xl font-bold leading-snug text-white">
                        {currentQ.field1}
                      </h4>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          { key: 'A', text: currentQ.optionA },
                          { key: 'B', text: currentQ.optionB },
                          { key: 'C', text: currentQ.optionC },
                          { key: 'D', text: currentQ.optionD },
                        ]
                          .filter((opt) => opt.text && opt.text.trim())
                          .map((opt) => {
                            const isSelected = selectedOption === opt.key;
                            const isCorrect = currentQ.correctAnswer === opt.key;
                            const hasAnswered = selectedOption !== null;

                            let btnStyle = 'border-slate-700 bg-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-750 text-slate-200';
                            if (hasAnswered) {
                              if (isCorrect) {
                                btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-500/40';
                              } else if (isSelected && !isCorrect) {
                                btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-200 ring-2 ring-rose-500/40';
                              } else {
                                btnStyle = 'border-slate-800/60 bg-slate-900/40 text-slate-500 opacity-60';
                              }
                            }

                            return (
                              <button
                                key={opt.key}
                                disabled={hasAnswered}
                                onClick={() => handleSelectOption(opt.key)}
                                className={`flex items-center gap-3 rounded-xl border p-4 text-left font-medium transition-all ${btnStyle}`}
                              >
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                    hasAnswered && isCorrect
                                      ? 'bg-emerald-500 text-slate-950'
                                      : hasAnswered && isSelected
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <span className="flex-1 text-sm">{opt.text}</span>
                                {hasAnswered && isCorrect && (
                                  <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                                )}
                                {hasAnswered && isSelected && !isCorrect && (
                                  <XCircle size={18} className="shrink-0 text-rose-400" />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {project.fieldLabels?.[mainField] || 'Prompt'}
                        </span>
                        <h4 className="mt-2 text-2xl font-extrabold text-white">
                          {currentQ[mainField]}
                        </h4>
                      </div>

                      {showAnswer ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            {project.fieldLabels?.[answerField] || 'Answer'}
                          </span>
                          <p className="mt-1 text-lg font-bold text-emerald-200">
                            {currentQ[answerField]}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 py-4 text-sm font-semibold text-slate-300 transition-colors hover:border-indigo-500 hover:text-white"
                        >
                          <Sparkles size={16} className="text-indigo-400" />
                          Click to Reveal Answer
                        </button>
                      )}
                    </div>
                  )}

                  {currentQ.hint && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {showHint ? (
                        <p className="flex items-start gap-2 text-xs text-amber-300/90">
                          <HelpCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                          <span><strong>Hint:</strong> {currentQ.hint}</span>
                        </p>
                      ) : (
                        <button
                          onClick={() => setShowHint(true)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <HelpCircle size={13} />
                          <span>Need a hint?</span>
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Endpoint: <code className="text-slate-400">/session</code>
                  </span>

                  {(isMcq ? selectedOption !== null : showAnswer) && (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:translate-x-0.5"
                    >
                      <span>{currentIndex + 1 === totalQ ? 'Finish Quiz' : 'Next Question'}</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: RAW JSON PAYLOAD INSPECTOR */}
        {activeTab === 'json' && (
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-950 p-6">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Live API Payload</h4>
                <p className="text-xs text-slate-400">
                  Exact JSON response served by <code>/api/public/projects/{project.slug}/session</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSession}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Fetch New Batch</span>
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-emerald-300">
              <code>{JSON.stringify(questions, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
