// Interview Types

export type InterviewPhase = "setup" | "mcq" | "resume" | "behavioral" | "complete";

export interface ResumeData {
  id?: string;
  filename: string;
  rawText: string;
  skills: string[];
  experienceYears: number;
  education: string;
  parsedSections: Record<string, string>;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  skillArea: string;
  difficulty: "easy" | "medium" | "hard";
  userAnswer?: string;
  isCorrect?: boolean;
  timeTaken?: number;
}

export interface ResumeQuestion {
  id: string;
  question: string;
  followUps: string[];
  expectedKeywords: string[];
  relevantResumeSection: string;
  assessmentCriteria: string;
}

export interface BehavioralQuestion {
  id: string;
  question: string;
  category: "leadership" | "teamwork" | "conflict" | "problem-solving" | "adaptability" | "communication";
  starPrompts: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  redFlags: string[];
  greenFlags: string[];
  linkedExperience?: string;
}

export interface PhaseResult {
  phase: InterviewPhase;
  score: number;
  passed: boolean;
  durationSeconds: number;
  feedback: Record<string, unknown>;
  transcript?: string;
  analysisData?: Record<string, unknown>;
}

export interface MCQPhaseResult extends PhaseResult {
  totalQuestions: number;
  correctAnswers: number;
  skillBreakdown: Record<string, { correct: number; total: number }>;
}

export interface ResumePhaseResult extends PhaseResult {
  alignmentScores: number[];
  gaps: string[];
  strengths: string[];
}

export interface BehavioralPhaseResult extends PhaseResult {
  starScores: {
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  softSkills: string[];
  improvementAreas: string[];
}

export interface SessionReport {
  sessionId: string;
  overallScore: number;
  phaseScores: {
    technical: number;
    resume: number;
    behavioral: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  executiveSummary: string;
  detailedAnalysis: {
    technical: { summary: string; recommendations: string[] };
    resume: { summary: string; recommendations: string[] };
    behavioral: { summary: string; recommendations: string[] };
  };
  actionPlan: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    timeframe: string;
    resources?: string[];
  }>;
  emotionTimeline: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
  }>;
  motivationalMessage: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  sessionType: string;
  status: "setup" | "in_progress" | "completed";
  currentPhase: InterviewPhase;
  jobRole?: string;
  industry?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  resumeData?: ResumeData;
  phaseResults: {
    mcq?: MCQPhaseResult;
    resume?: ResumePhaseResult;
    behavioral?: BehavioralPhaseResult;
  };
  report?: SessionReport;
}

export interface EmotionDataPoint {
  timestamp: number;
  smileScore: number;
  eyeContact: number;
  attention: number;
  confidence: number;
  posture: number;
  emotion: "confident" | "nervous" | "neutral" | "engaged" | "distracted";
}
