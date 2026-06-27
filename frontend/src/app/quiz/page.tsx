"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { BookOpen, HelpCircle, Trophy, Sparkles, XCircle, RefreshCw, ChevronRight, ChevronLeft, Award, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizPage() {
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<any>({});
  const [evaluation, setEvaluation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Extra Practice states
  const [isExtra, setIsExtra] = useState(false);
  const [error, setError] = useState("");

  const fetchActiveLessonAndQuiz = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setQuiz(null);
    setEvaluation(null);
    setAnswers({});
    setCurrentStep(0);
    setIsExtra(false);
    setError("");
    try {
      const activeRes = await fetch("/api/roadmap/active", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        const current = activeData.milestones?.flatMap((m: any) => m.lessons).find((l: any) => l.status === "Current");
        setActiveLesson(current);

        if (current) {
          const quizRes = await fetch(`/api/quiz/generate/${current.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (quizRes.ok) {
            const quizData = await quizRes.json();
            setQuiz(quizData);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraQuiz = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setEvaluation(null);
    setAnswers({});
    setCurrentStep(0);
    setError("");
    try {
      const res = await fetch(`/api/quiz/generate-extra/${activeLesson.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuiz(data);
        setIsExtra(true);
      } else {
        const err = await res.json();
        setError(err.detail || "Failed to load extra quiz. Maximum attempts reached or pre-requisite failed.");
        setIsExtra(false);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load extra quiz.");
      setIsExtra(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLessonAndQuiz();
  }, []);

  const handleSelectOption = (qId: number, optIdx: number) => {
    setAnswers((prev: any) => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_idx: optIdx }
    }));
  };

  const handleTextChange = (qId: number, text: string) => {
    setAnswers((prev: any) => ({
      ...prev,
      [qId]: { ...prev[qId], short_answer_text: text }
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const token = localStorage.getItem("token");
    
    const formattedAnswers = quiz.questions.map((q: any) => ({
      question_id: q.question_id,
      selected_option_idx: answers[q.question_id]?.selected_option_idx ?? null,
      short_answer_text: answers[q.question_id]?.short_answer_text ?? ""
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers: formattedAnswers
        })
      });

      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      } else {
        const err = await res.json();
        setError(err.detail || "Failed to submit quiz.");
      }
    } catch (e: any) {
      setError(e.message || "Submission error.");
    } finally {
      setSubmitting(false);
    }
  };



  const questionsCount = quiz?.questions?.length || 0;
  const progressPercent = questionsCount > 0 ? Math.round(((currentStep + 1) / questionsCount) * 100) : 0;
  const activeQuestion = quiz?.questions?.[currentStep];

  return (
    <AppShell mainClassName="overflow-y-auto p-4 sm:p-6 xl:p-8 space-y-6 flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <BookOpen className="w-12 h-12 text-indigo-500 animate-pulse mb-3" />
            <span className="text-text-muted font-medium text-sm tracking-wider">Generating Quiz Module...</span>
          </div>
        ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-xs text-primary font-semibold tracking-widest uppercase">
                  {isExtra ? "Extra Practice Mode" : "Skill Check"}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-text">
                Evaluation Center
              </h1>
              <p className="text-text-muted text-sm mt-1 font-medium">
                {activeLesson ? `Topic: ${activeLesson.title}` : "No active lesson to quiz."}
              </p>
            </div>
            
            {isExtra && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-emerald-450 text-[10px] font-bold uppercase tracking-wider">
                Practice Session
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl max-w-2xl mx-auto flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Action Failed</p>
                <p className="text-xs text-text-muted mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError("")} className="text-xs hover:underline text-text-muted">Dismiss</button>
            </div>
          )}

          {/* Content Body */}
          {!activeLesson ? (
            <div className="bg-card/40 backdrop-blur-3xl border border-border/40 shadow-xl shadow-black/5 p-4 sm:p-8 rounded-[2rem] max-w-lg text-center space-y-4 mx-auto">
              <h3 className="font-bold text-lg text-text">Ready for evaluation?</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Generate a roadmap first and complete study sections before testing your skills.
              </p>
              <Link href="/roadmap" className="inline-block bg-primary text-primary-foreground hover:bg-indigo-500 font-bold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer">
                View Learning Roadmap
              </Link>
            </div>
          ) : evaluation ? (
            /* Scoring details screen */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className={`bg-card/40 backdrop-blur-3xl p-4 sm:p-8 rounded-[2rem] border ${evaluation.passed ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.1)]" : "border-red-500/50 bg-red-500/5 shadow-[0_0_40px_rgba(239,68,68,0.1)]"} text-center space-y-5 relative overflow-hidden`}>
                <div className="mx-auto w-16 h-16 rounded-full bg-card border border-slate-850 flex items-center justify-center mb-2">
                  {evaluation.passed ? (
                    <Trophy className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <h2 className="text-2xl font-extrabold text-text tracking-tight">
                  {evaluation.passed ? "Evaluation Complete!" : "Needs Revision"}
                </h2>
                <div className="flex justify-center items-center gap-2">
                  <span className="text-text-muted text-sm font-semibold">Your Score:</span>
                  <span className={`text-xl font-black ${evaluation.passed ? "text-emerald-400" : "text-red-400"}`}>{evaluation.score}%</span>
                </div>
                <p className="text-slate-350 text-sm leading-relaxed max-w-md mx-auto">{evaluation.explanation}</p>
                
                {evaluation.adjustments_made && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 animate-bounce" />
                    Planner adjusted roadmap with revision tasks!
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Link href="/roadmap" className="flex-1 bg-primary text-primary-foreground hover:bg-indigo-500 font-bold py-3.5 rounded-xl text-center transition shadow-lg shadow-primary/10 cursor-pointer">
                  Return to Roadmap
                </Link>
                {evaluation.passed ? (
                  <button onClick={fetchExtraQuiz} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-text font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer">
                    <Award className="w-4 h-4" />
                    Attend More Quizzes
                  </button>
                ) : (
                  <button 
                    onClick={isExtra ? fetchExtraQuiz : fetchActiveLessonAndQuiz} 
                    className="flex-1 bg-card hover:bg-slate-100 dark:hover:bg-slate-800 border border-border text-text font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer hover:border-primary/30"
                  >
                    <RefreshCw className="w-4 h-4 text-primary" />
                    Retake Quiz
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Progressive steps rendering */
            <div className="max-w-3xl space-y-6 mx-auto w-full">
              {/* Progress Tracker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-text-muted">
                  <span>Question {currentStep + 1} of {questionsCount}</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="w-full bg-progress-track h-2 rounded-full overflow-hidden border border-border/80">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary/80 to-primary" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Animated viewport */}
              <div className="relative overflow-hidden min-h-[300px]">
                <AnimatePresence mode="wait">
                  {activeQuestion && (
                    <motion.div 
                      key={activeQuestion.question_id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      className="bg-card/40 backdrop-blur-3xl border border-border/40 p-10 rounded-[2rem] space-y-8 shadow-2xl shadow-black/5"
                    >
                      <div className="flex gap-3">
                        <HelpCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <h4 className="font-extrabold text-text text-lg tracking-tight leading-relaxed">
                          {activeQuestion.question}
                        </h4>
                      </div>

                      {activeQuestion.type === "MCQ" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                          {activeQuestion.options.map((opt: string, optIdx: number) => {
                            const isSelected = answers[activeQuestion.question_id]?.selected_option_idx === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(activeQuestion.question_id, optIdx)}
                                className={`text-left p-4.5 rounded-xl border text-sm transition-all cursor-pointer font-medium ${
                                  isSelected
                                    ? "border-primary bg-primary/5 text-text font-bold"
                                    : "border-border hover:border-primary/30 bg-card text-text-muted"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {activeQuestion.type === "TF" && (
                        <div className="flex gap-4 pl-9">
                          {["True", "False"].map((opt: string, optIdx: number) => {
                            const isSelected = answers[activeQuestion.question_id]?.selected_option_idx === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(activeQuestion.question_id, optIdx)}
                                className={`px-8 py-3.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "border-primary bg-primary/5 text-text"
                                    : "border-border hover:border-primary/30 bg-card text-text-muted"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {activeQuestion.type === "SA" && (
                        <div className="pl-9">
                          <textarea
                            rows={4}
                            value={answers[activeQuestion.question_id]?.short_answer_text || ""}
                            onChange={(e) => handleTextChange(activeQuestion.question_id, e.target.value)}
                            placeholder="Explain your answer clearly..."
                            className="w-full bg-card/60 border border-border rounded-xl p-4 text-text placeholder-slate-500 focus:outline-none focus:border-primary/85 transition text-sm"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Wizard bar */}
              <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="bg-card hover:bg-border/50 disabled:opacity-40 text-text border border-border px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                {currentStep < questionsCount - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="bg-card hover:bg-border/50 text-text border border-border px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-text font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/10 cursor-pointer"
                  >
                    {submitting ? "Evaluating..." : "Submit Answers"}
                    <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </AppShell>
  );
}
