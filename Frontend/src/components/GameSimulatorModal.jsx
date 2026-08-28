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
  Volume2,
} from 'lucide-react';
import { getPublicApiBase } from '../config';

export default function GameSimulatorModal({ isOpen, onClose, project }) {
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

  useEffect(() => {
    getPublicApiBase().then(setApiBase);
  }, []);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-bold text-white">{project.name}</h3>
                <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  {isMcq ? 'MCQ Simulator' : 'Classic Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Live Endpoint Test & Simulator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSession}
              title="Fetch new random batch"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Reshuffle</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 size={36} className="animate-spin text-indigo-500" />
              <p className="mt-4 text-sm font-medium">Serving live random session...</p>
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
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-2 rounded-full border border-dashed border-amber-400/40"
                />
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
                  Play Again (New Batch)
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Close Simulator
                </button>
              </div>
            </motion.div>
          ) : (
            /* Active Game Screen */
            <div className="space-y-6">
              {/* Progress & Stats Bar */}
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

              {/* Progress Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Question Card */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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

                    {/* MCQ Options */}
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
                  /* Classic Mode (Prompt ➔ Answer) */
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          {project.fieldLabels?.[answerField] || 'Answer'}
                        </span>
                        <p className="mt-1 text-lg font-bold text-emerald-200">
                          {currentQ[answerField]}
                        </p>
                      </motion.div>
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

                {/* Hint Bar */}
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

              {/* Action Controls */}
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
      </div>
    </div>
  );
}
