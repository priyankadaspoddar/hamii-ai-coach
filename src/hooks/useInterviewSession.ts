import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, Json } from "@/integrations/supabase/types";
import type { 
  InterviewSession, 
  InterviewPhase, 
  ResumeData, 
  MCQQuestion,
  ResumeQuestion,
  BehavioralQuestion,
  MCQPhaseResult,
  ResumePhaseResult,
  BehavioralPhaseResult,
  EmotionDataPoint,
  SessionReport
} from "@/types/interview";
import type { AnalysisMetrics } from "@/hooks/useMediaPipe";

const PASSING_SCORE = 70;

export function useInterviewSession() {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Questions for each phase
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [resumeQuestions, setResumeQuestions] = useState<ResumeQuestion[]>([]);
  const [behavioralQuestions, setBehavioralQuestions] = useState<BehavioralQuestion[]>([]);
  
  // Current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Emotion tracking
  const emotionTimelineRef = useRef<EmotionDataPoint[]>([]);

  // Create a new interview session
  const createSession = useCallback(async (userId: string, jobRole: string, resumeData?: ResumeData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Save resume if provided
      let savedResumeId: string | undefined;
      if (resumeData) {
        const resumeInsert: TablesInsert<"resumes"> = {
          user_id: userId,
          filename: resumeData.filename,
          raw_text: resumeData.rawText,
          skills: resumeData.skills,
          experience_years: resumeData.experienceYears,
          education: resumeData.education,
          parsed_sections: resumeData.parsedSections as Json,
        };
        
        const { data: resumeResult, error: resumeError } = await supabase
          .from("resumes")
          .insert(resumeInsert)
          .select()
          .single();

        if (resumeError) throw resumeError;
        savedResumeId = resumeResult.id;
      }

      // Create interview session
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: userId,
          session_type: "full_interview",
          status: "in_progress",
          job_role: jobRole,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const newSession: InterviewSession = {
        id: sessionData.id,
        userId,
        sessionType: "full_interview",
        status: "in_progress",
        currentPhase: "mcq",
        jobRole,
        startedAt: new Date(sessionData.started_at),
        resumeData: resumeData ? { ...resumeData, id: savedResumeId } : undefined,
        phaseResults: {},
      };

      setSession(newSession);
      setCurrentPhase("mcq");
      setCurrentQuestionIndex(0);
      emotionTimelineRef.current = [];

      // Generate MCQ questions
      await generateMCQQuestions(resumeData, jobRole);

      setIsLoading(false);
      return newSession;
    } catch (err) {
      console.error("Failed to create session:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create session";
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Generate MCQ questions
  const generateMCQQuestions = useCallback(async (resumeData?: ResumeData, jobRole?: string) => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("generate-questions", {
        body: {
          phase: "mcq",
          resumeData: resumeData ? {
            skills: resumeData.skills,
            experience: `${resumeData.experienceYears} years`,
            education: resumeData.education,
            rawText: resumeData.rawText.slice(0, 2000),
          } : undefined,
          jobRole,
          questionCount: 12,
        },
      });

      if (response.error) throw response.error;

      const questions = (response.data.questions || []).map((q: MCQQuestion, i: number) => ({
        ...q,
        id: `mcq-${i}`,
      }));

      setMcqQuestions(questions);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to generate MCQ questions:", err);
      setError("Failed to generate questions");
      setIsLoading(false);
    }
  }, []);

  // Generate resume questions
  const generateResumeQuestions = useCallback(async () => {
    if (!session?.resumeData) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("generate-questions", {
        body: {
          phase: "resume",
          resumeData: {
            skills: session.resumeData.skills,
            experience: `${session.resumeData.experienceYears} years`,
            education: session.resumeData.education,
            rawText: session.resumeData.rawText.slice(0, 3000),
          },
          jobRole: session.jobRole,
          questionCount: 5,
        },
      });

      if (response.error) throw response.error;

      const questions = (response.data.questions || []).map((q: ResumeQuestion, i: number) => ({
        ...q,
        id: `resume-${i}`,
      }));

      setResumeQuestions(questions);
      setCurrentQuestionIndex(0);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to generate resume questions:", err);
      setError("Failed to generate questions");
      setIsLoading(false);
    }
  }, [session]);

  // Generate behavioral questions
  const generateBehavioralQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("generate-questions", {
        body: {
          phase: "behavioral",
          resumeData: session?.resumeData ? {
            skills: session.resumeData.skills,
            experience: `${session.resumeData.experienceYears} years`,
            education: session.resumeData.education,
            rawText: session.resumeData.rawText.slice(0, 2000),
          } : undefined,
          jobRole: session?.jobRole,
          questionCount: 5,
        },
      });

      if (response.error) throw response.error;

      const questions = (response.data.questions || []).map((q: BehavioralQuestion, i: number) => ({
        ...q,
        id: `behavioral-${i}`,
      }));

      setBehavioralQuestions(questions);
      setCurrentQuestionIndex(0);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to generate behavioral questions:", err);
      setError("Failed to generate questions");
      setIsLoading(false);
    }
  }, [session]);

  // Answer MCQ question
  const answerMCQ = useCallback((questionId: string, answer: string, timeTaken: number) => {
    setMcqQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          userAnswer: answer,
          isCorrect: q.correctAnswer === answer,
          timeTaken,
        };
      }
      return q;
    }));
  }, []);

  // Complete MCQ phase
  const completeMCQPhase = useCallback(async (): Promise<MCQPhaseResult> => {
    const answeredQuestions = mcqQuestions.filter(q => q.userAnswer);
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const score = (correctAnswers / mcqQuestions.length) * 100;

    // Calculate skill breakdown
    const skillBreakdown: Record<string, { correct: number; total: number }> = {};
    for (const q of mcqQuestions) {
      const skill = q.skillArea || "General";
      if (!skillBreakdown[skill]) {
        skillBreakdown[skill] = { correct: 0, total: 0 };
      }
      skillBreakdown[skill].total++;
      if (q.isCorrect) {
        skillBreakdown[skill].correct++;
      }
    }

    const result: MCQPhaseResult = {
      phase: "mcq",
      score,
      passed: score >= PASSING_SCORE,
      durationSeconds: answeredQuestions.reduce((sum, q) => sum + (q.timeTaken || 0), 0),
      feedback: { skillBreakdown },
      totalQuestions: mcqQuestions.length,
      correctAnswers,
      skillBreakdown,
    };

    // Save to database
    if (session) {
      const phaseResultInsert: TablesInsert<"phase_results"> = {
        session_id: session.id,
        user_id: session.userId,
        phase: "mcq",
        score,
        passed: result.passed,
        duration_seconds: result.durationSeconds,
        feedback: result.feedback as Json,
        analysis_data: { skillBreakdown } as Json,
      };
      await supabase.from("phase_results").insert(phaseResultInsert);

      // Save individual questions
      for (const q of mcqQuestions) {
        const questionInsert: TablesInsert<"session_questions"> = {
          session_id: session.id,
          user_id: session.userId,
          phase: "mcq",
          question_text: q.question,
          options: q.options as Json,
          correct_answer: q.correctAnswer,
          user_answer: q.userAnswer,
          is_correct: q.isCorrect,
          explanation: q.explanation,
          skill_area: q.skillArea,
          difficulty: q.difficulty,
          time_taken_seconds: q.timeTaken,
        };
        await supabase.from("session_questions").insert(questionInsert);
      }
    }

    setSession(prev => prev ? {
      ...prev,
      phaseResults: { ...prev.phaseResults, mcq: result }
    } : null);

    return result;
  }, [mcqQuestions, session]);

  // Track emotion data point
  const trackEmotion = useCallback((metrics: AnalysisMetrics) => {
    const dataPoint: EmotionDataPoint = {
      timestamp: Date.now(),
      smileScore: metrics.smileScore,
      eyeContact: metrics.eyeContactScore,
      attention: metrics.attentionScore,
      confidence: metrics.expressionConfidence,
      posture: metrics.postureScore,
      emotion: metrics.expressionConfidence > 0.6 
        ? (metrics.smileScore > 0.5 ? "confident" : "engaged")
        : (metrics.attentionScore < 0.4 ? "distracted" : "neutral"),
    };
    emotionTimelineRef.current.push(dataPoint);
  }, []);

  // Analyze response (for resume/behavioral phases)
  const analyzeResponse = useCallback(async (
    phase: "resume" | "behavioral",
    question: string,
    transcript: string,
    facialMetrics?: { avgSmileScore: number; avgEyeContact: number; avgAttention: number; expressionConfidence: number },
    postureMetrics?: { avgPostureScore: number; headStability: number; shoulderAlignment: number }
  ) => {
    try {
      const response = await supabase.functions.invoke("analyze-response", {
        body: {
          phase,
          question,
          transcript,
          resumeContext: session?.resumeData?.rawText?.slice(0, 2000),
          facialMetrics,
          postureMetrics,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (err) {
      console.error("Failed to analyze response:", err);
      throw err;
    }
  }, [session]);

  // Complete resume phase
  const completeResumePhase = useCallback(async (
    analysisResults: Array<{ score: number; gaps: string[]; strengths: string[] }>,
    transcript: string
  ): Promise<ResumePhaseResult> => {
    const avgScore = analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length;
    const allGaps = analysisResults.flatMap(r => r.gaps);
    const allStrengths = analysisResults.flatMap(r => r.strengths);

    const result: ResumePhaseResult = {
      phase: "resume",
      score: avgScore,
      passed: avgScore >= PASSING_SCORE,
      durationSeconds: 0, // Will be set by caller
      feedback: { gaps: allGaps, strengths: allStrengths },
      transcript,
      alignmentScores: analysisResults.map(r => r.score),
      gaps: [...new Set(allGaps)],
      strengths: [...new Set(allStrengths)],
    };

    if (session) {
      const phaseResultInsert: TablesInsert<"phase_results"> = {
        session_id: session.id,
        user_id: session.userId,
        phase: "resume",
        score: avgScore,
        passed: result.passed,
        duration_seconds: result.durationSeconds,
        feedback: result.feedback as Json,
        transcript,
        analysis_data: { alignmentScores: result.alignmentScores } as Json,
      };
      await supabase.from("phase_results").insert(phaseResultInsert);
    }

    setSession(prev => prev ? {
      ...prev,
      phaseResults: { ...prev.phaseResults, resume: result }
    } : null);

    return result;
  }, [session]);

  // Complete behavioral phase
  const completeBehavioralPhase = useCallback(async (
    analysisResults: Array<{ 
      starScore: { situation: number; task: number; action: number; result: number };
      softSkills: string[];
      improvementAreas: string[];
      overallScore: number;
    }>,
    transcript: string
  ): Promise<BehavioralPhaseResult> => {
    const avgScore = analysisResults.reduce((sum, r) => sum + r.overallScore, 0) / analysisResults.length;
    
    const avgStarScores = {
      situation: analysisResults.reduce((sum, r) => sum + r.starScore.situation, 0) / analysisResults.length,
      task: analysisResults.reduce((sum, r) => sum + r.starScore.task, 0) / analysisResults.length,
      action: analysisResults.reduce((sum, r) => sum + r.starScore.action, 0) / analysisResults.length,
      result: analysisResults.reduce((sum, r) => sum + r.starScore.result, 0) / analysisResults.length,
    };

    const allSoftSkills = [...new Set(analysisResults.flatMap(r => r.softSkills))];
    const allImprovementAreas = [...new Set(analysisResults.flatMap(r => r.improvementAreas))];

    const result: BehavioralPhaseResult = {
      phase: "behavioral",
      score: avgScore,
      passed: avgScore >= PASSING_SCORE,
      durationSeconds: 0,
      feedback: { starScores: avgStarScores, softSkills: allSoftSkills },
      transcript,
      starScores: avgStarScores,
      softSkills: allSoftSkills,
      improvementAreas: allImprovementAreas,
    };

    if (session) {
      const phaseResultInsert: TablesInsert<"phase_results"> = {
        session_id: session.id,
        user_id: session.userId,
        phase: "behavioral",
        score: avgScore,
        passed: result.passed,
        duration_seconds: result.durationSeconds,
        feedback: result.feedback as Json,
        transcript,
        analysis_data: { starScores: avgStarScores } as Json,
      };
      await supabase.from("phase_results").insert(phaseResultInsert);
    }

    setSession(prev => prev ? {
      ...prev,
      phaseResults: { ...prev.phaseResults, behavioral: result }
    } : null);

    return result;
  }, [session]);

  // Generate final report
  const generateReport = useCallback(async (): Promise<SessionReport> => {
    if (!session) throw new Error("No active session");

    const phases = {
      mcq: {
        score: session.phaseResults.mcq?.score || 0,
        totalQuestions: session.phaseResults.mcq?.totalQuestions || 0,
        correctAnswers: session.phaseResults.mcq?.correctAnswers || 0,
        skillBreakdown: session.phaseResults.mcq?.skillBreakdown || {},
      },
      resume: {
        score: session.phaseResults.resume?.score || 0,
        alignmentScores: session.phaseResults.resume?.alignmentScores || [],
        gaps: session.phaseResults.resume?.gaps || [],
        strengths: session.phaseResults.resume?.strengths || [],
      },
      behavioral: {
        score: session.phaseResults.behavioral?.score || 0,
        starScores: session.phaseResults.behavioral?.starScores || { situation: 0, task: 0, action: 0, result: 0 },
        softSkills: session.phaseResults.behavioral?.softSkills || [],
        improvementAreas: session.phaseResults.behavioral?.improvementAreas || [],
      },
    };

    const response = await supabase.functions.invoke("generate-report", {
      body: {
        sessionId: session.id,
        phases,
        emotionTimeline: emotionTimelineRef.current.map(e => ({
          timestamp: e.timestamp,
          emotion: e.emotion,
          confidence: e.confidence,
        })),
        resumeContext: session.resumeData?.rawText?.slice(0, 1000),
        jobRole: session.jobRole,
      },
    });

    if (response.error) throw response.error;

    const report: SessionReport = response.data;

    // Save report to database
    const reportInsert: TablesInsert<"session_reports"> = {
      session_id: session.id,
      user_id: session.userId,
      overall_score: report.overallScore,
      tech_score: report.phaseScores.technical,
      resume_score: report.phaseScores.resume,
      behavioral_score: report.phaseScores.behavioral,
      strengths: report.strengths,
      weaknesses: report.areasForImprovement,
      improvement_areas: report.areasForImprovement,
      detailed_feedback: report.detailedAnalysis as Json,
      emotion_timeline: emotionTimelineRef.current as unknown as Json,
    };
    await supabase.from("session_reports").insert(reportInsert);

    // Update session status
    await supabase.from("interview_sessions")
      .update({ 
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    setSession(prev => prev ? { ...prev, report, status: "completed" } : null);
    setCurrentPhase("complete");

    return report;
  }, [session]);

  // Move to next phase
  const nextPhase = useCallback(async () => {
    if (currentPhase === "mcq") {
      setCurrentPhase("resume");
      await generateResumeQuestions();
    } else if (currentPhase === "resume") {
      setCurrentPhase("behavioral");
      await generateBehavioralQuestions();
    } else if (currentPhase === "behavioral") {
      setCurrentPhase("complete");
      await generateReport();
    }
  }, [currentPhase, generateResumeQuestions, generateBehavioralQuestions, generateReport]);

  // Next question
  const nextQuestion = useCallback(() => {
    if (currentPhase === "mcq" && currentQuestionIndex < mcqQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentPhase === "resume" && currentQuestionIndex < resumeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentPhase === "behavioral" && currentQuestionIndex < behavioralQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentPhase, currentQuestionIndex, mcqQuestions.length, resumeQuestions.length, behavioralQuestions.length]);

  return {
    session,
    currentPhase,
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
    trackEmotion,
    generateReport,
    nextPhase,
    nextQuestion,
    setCurrentPhase,
    emotionTimeline: emotionTimelineRef.current,
  };
}
