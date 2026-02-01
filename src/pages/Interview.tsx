import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import InterviewSetup from "@/components/interview/InterviewSetup";
import MCQPhase from "@/components/interview/MCQPhase";
import ResumePhase from "@/components/interview/ResumePhase";
import BehavioralPhase from "@/components/interview/BehavioralPhase";
import PhaseTransition from "@/components/interview/PhaseTransition";
import SessionReportView from "@/components/interview/SessionReportView";
import type { ResumeData, InterviewPhase } from "@/types/interview";

type ViewState = "setup" | "mcq" | "mcq-complete" | "resume" | "resume-complete" | "behavioral" | "behavioral-complete" | "report";

const Interview = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [viewState, setViewState] = useState<ViewState>("setup");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    session,
    isLoading,
    error,
    mcqQuestions,
    resumeQuestions,
    behavioralQuestions,
    currentQuestionIndex,
    createSession,
    answerMCQ,
    completeMCQPhase,
    completeResumePhase,
    completeBehavioralPhase,
    analyzeResponse,
    nextPhase,
    nextQuestion,
  } = useInterviewSession();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser({ id: user.id });
    };
    getUser();
  }, [navigate]);

  // Handle starting the interview
  const handleStart = useCallback(async (jobRole: string, resumeData?: ResumeData) => {
    if (!user) return;
    
    try {
      await createSession(user.id, jobRole, resumeData);
      setViewState("mcq");
    } catch (err) {
      console.error("Failed to start interview:", err);
    }
  }, [user, createSession]);

  // Handle MCQ answer
  const handleMCQAnswer = useCallback((questionId: string, answer: string, timeTaken: number) => {
    answerMCQ(questionId, answer, timeTaken);
  }, [answerMCQ]);

  // Handle MCQ completion
  const handleMCQComplete = useCallback(async () => {
    setIsTransitioning(true);
    try {
      await completeMCQPhase();
      setViewState("mcq-complete");
    } finally {
      setIsTransitioning(false);
    }
  }, [completeMCQPhase]);

  // Handle transition to resume phase
  const handleContinueToResume = useCallback(async () => {
    setIsTransitioning(true);
    try {
      await nextPhase();
      setViewState("resume");
    } finally {
      setIsTransitioning(false);
    }
  }, [nextPhase]);

  // Handle resume response analysis
  const handleResumeAnalyze = useCallback(async (
    question: string,
    transcript: string,
    facialMetrics?: { avgSmileScore: number; avgEyeContact: number; avgAttention: number; expressionConfidence: number },
    postureMetrics?: { avgPostureScore: number; headStability: number; shoulderAlignment: number }
  ) => {
    const result = await analyzeResponse("resume", question, transcript, facialMetrics, postureMetrics);
    return {
      resumeAlignmentScore: result.resumeAlignmentScore || result.overallScore || 0,
      feedback: result.feedback || "",
      matchedClaims: result.matchedClaims || [],
      gaps: result.gaps || [],
    };
  }, [analyzeResponse]);

  // Handle resume phase completion
  const handleResumeComplete = useCallback(async (
    results: Array<{ score: number; gaps: string[]; strengths: string[] }>,
    fullTranscript: string
  ) => {
    setIsTransitioning(true);
    try {
      await completeResumePhase(results, fullTranscript);
      setViewState("resume-complete");
    } finally {
      setIsTransitioning(false);
    }
  }, [completeResumePhase]);

  // Handle transition to behavioral phase
  const handleContinueToBehavioral = useCallback(async () => {
    setIsTransitioning(true);
    try {
      await nextPhase();
      setViewState("behavioral");
    } finally {
      setIsTransitioning(false);
    }
  }, [nextPhase]);

  // Handle behavioral response analysis
  const handleBehavioralAnalyze = useCallback(async (
    question: string,
    transcript: string,
    facialMetrics?: { avgSmileScore: number; avgEyeContact: number; avgAttention: number; expressionConfidence: number },
    postureMetrics?: { avgPostureScore: number; headStability: number; shoulderAlignment: number }
  ) => {
    const result = await analyzeResponse("behavioral", question, transcript, facialMetrics, postureMetrics);
    return {
      starScore: result.starScore || { situation: 0, task: 0, action: 0, result: 0 },
      overallScore: result.overallScore || 0,
      softSkillsScore: result.softSkillsScore || 0,
      demonstratedSkills: result.demonstratedSkills || [],
      improvementAreas: result.improvementAreas || [],
      feedback: result.feedback || "",
      emotionAnalysis: result.emotionAnalysis || {
        primaryEmotion: "neutral",
        confidenceLevel: "medium",
        engagementLevel: "medium",
      },
    };
  }, [analyzeResponse]);

  // Handle behavioral phase completion
  const handleBehavioralComplete = useCallback(async (
    results: Array<{
      starScore: { situation: number; task: number; action: number; result: number };
      softSkills: string[];
      improvementAreas: string[];
      overallScore: number;
    }>,
    fullTranscript: string
  ) => {
    setIsTransitioning(true);
    try {
      await completeBehavioralPhase(results, fullTranscript);
      setViewState("behavioral-complete");
    } finally {
      setIsTransitioning(false);
    }
  }, [completeBehavioralPhase]);

  // Handle transition to report
  const handleContinueToReport = useCallback(async () => {
    setIsTransitioning(true);
    try {
      await nextPhase();
      setViewState("report");
    } finally {
      setIsTransitioning(false);
    }
  }, [nextPhase]);

  // Handle starting a new interview
  const handleStartNew = useCallback(() => {
    setViewState("setup");
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const getPhaseIndicator = (): InterviewPhase => {
    if (viewState === "setup") return "setup";
    if (viewState.startsWith("mcq")) return "mcq";
    if (viewState.startsWith("resume")) return "resume";
    if (viewState.startsWith("behavioral")) return "behavioral";
    return "complete";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Phase:</span>
            <div className="flex gap-1">
              {(["mcq", "resume", "behavioral"] as const).map((phase) => {
                const currentPhase = getPhaseIndicator();
                const phases: InterviewPhase[] = ["mcq", "resume", "behavioral"];
                const currentIdx = phases.indexOf(currentPhase as typeof phase);
                const phaseIdx = phases.indexOf(phase);
                
                return (
                  <div
                    key={phase}
                    className={`
                      w-16 h-1.5 rounded-full
                      ${phaseIdx < currentIdx ? "bg-green-500" : 
                        phaseIdx === currentIdx ? "bg-primary" : "bg-muted"}
                    `}
                  />
                );
              })}
            </div>
          </div>

          <div className="text-sm">
            {session?.jobRole && (
              <span className="text-muted-foreground">
                Role: <span className="text-foreground">{session.jobRole}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-xl text-destructive">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Setup Phase */}
          {viewState === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InterviewSetup onStart={handleStart} isLoading={isLoading} />
            </motion.div>
          )}

          {/* MCQ Phase */}
          {viewState === "mcq" && (
            <motion.div
              key="mcq"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Generating personalized questions...</p>
                </div>
              ) : (
                <MCQPhase
                  questions={mcqQuestions}
                  currentIndex={currentQuestionIndex}
                  onAnswer={handleMCQAnswer}
                  onNext={nextQuestion}
                  onComplete={handleMCQComplete}
                />
              )}
            </motion.div>
          )}

          {/* MCQ Complete */}
          {viewState === "mcq-complete" && session?.phaseResults.mcq && (
            <motion.div
              key="mcq-complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <PhaseTransition
                fromPhase="mcq"
                toPhase="resume"
                score={session.phaseResults.mcq.score}
                passed={session.phaseResults.mcq.passed}
                feedback={`You answered ${session.phaseResults.mcq.correctAnswers} out of ${session.phaseResults.mcq.totalQuestions} questions correctly.`}
                onContinue={handleContinueToResume}
                isLoading={isTransitioning}
              />
            </motion.div>
          )}

          {/* Resume Phase */}
          {viewState === "resume" && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Preparing resume questions...</p>
                </div>
              ) : (
                <ResumePhase
                  questions={resumeQuestions}
                  currentIndex={currentQuestionIndex}
                  resumeContext={session?.resumeData?.rawText}
                  onAnalyze={handleResumeAnalyze}
                  onNext={nextQuestion}
                  onComplete={handleResumeComplete}
                />
              )}
            </motion.div>
          )}

          {/* Resume Complete */}
          {viewState === "resume-complete" && session?.phaseResults.resume && (
            <motion.div
              key="resume-complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <PhaseTransition
                fromPhase="resume"
                toPhase="behavioral"
                score={session.phaseResults.resume.score}
                passed={session.phaseResults.resume.passed}
                feedback={`Resume alignment: ${session.phaseResults.resume.strengths.length} verified claims, ${session.phaseResults.resume.gaps.length} areas to improve.`}
                onContinue={handleContinueToBehavioral}
                isLoading={isTransitioning}
              />
            </motion.div>
          )}

          {/* Behavioral Phase */}
          {viewState === "behavioral" && (
            <motion.div
              key="behavioral"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Preparing behavioral questions...</p>
                </div>
              ) : (
                <BehavioralPhase
                  questions={behavioralQuestions}
                  currentIndex={currentQuestionIndex}
                  onAnalyze={handleBehavioralAnalyze}
                  onNext={nextQuestion}
                  onComplete={handleBehavioralComplete}
                />
              )}
            </motion.div>
          )}

          {/* Behavioral Complete */}
          {viewState === "behavioral-complete" && session?.phaseResults.behavioral && (
            <motion.div
              key="behavioral-complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <PhaseTransition
                fromPhase="behavioral"
                toPhase="complete"
                score={session.phaseResults.behavioral.score}
                passed={session.phaseResults.behavioral.passed}
                feedback={`STAR method analysis complete. ${session.phaseResults.behavioral.softSkills.length} soft skills demonstrated.`}
                onContinue={handleContinueToReport}
                isLoading={isTransitioning}
              />
            </motion.div>
          )}

          {/* Report */}
          {viewState === "report" && session?.report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SessionReportView
                report={session.report}
                onStartNew={handleStartNew}
                onGoToDashboard={() => navigate("/dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Interview;
