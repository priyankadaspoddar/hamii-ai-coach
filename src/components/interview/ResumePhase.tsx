import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Clock, ChevronRight, AlertCircle, CheckCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import type { ResumeQuestion } from "@/types/interview";

interface ResumePhaseProps {
  questions: ResumeQuestion[];
  currentIndex: number;
  resumeContext?: string;
  onAnalyze: (
    question: string,
    transcript: string,
    facialMetrics?: { avgSmileScore: number; avgEyeContact: number; avgAttention: number; expressionConfidence: number },
    postureMetrics?: { avgPostureScore: number; headStability: number; shoulderAlignment: number }
  ) => Promise<{ 
    resumeAlignmentScore: number; 
    feedback: string;
    matchedClaims: string[];
    gaps: string[];
  }>;
  onNext: () => void;
  onComplete: (results: Array<{ score: number; gaps: string[]; strengths: string[] }>, fullTranscript: string) => void;
}

const ResumePhase = ({ 
  questions, 
  currentIndex, 
  resumeContext,
  onAnalyze, 
  onNext, 
  onComplete 
}: ResumePhaseProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<{
    resumeAlignmentScore: number;
    feedback: string;
    matchedClaims: string[];
    gaps: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [allResults, setAllResults] = useState<Array<{ score: number; gaps: string[]; strengths: string[] }>>([]);
  const [fullTranscript, setFullTranscript] = useState("");
  
  const metricsRef = useRef<{
    smileScores: number[];
    eyeContactScores: number[];
    attentionScores: number[];
    expressionConfidences: number[];
    postureScores: number[];
    headStabilities: number[];
    shoulderAlignments: number[];
  }>({
    smileScores: [],
    eyeContactScores: [],
    attentionScores: [],
    expressionConfidences: [],
    postureScores: [],
    headStabilities: [],
    shoulderAlignments: [],
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    isListening, 
    isSupported, 
    transcript, 
    interimTranscript, 
    startListening, 
    stopListening,
    resetTranscript 
  } = useSpeechRecognition();

  const {
    videoRef,
    canvasRef,
    isLoading: mediaPipeLoading,
    isRunning: mediaPipeRunning,
    metrics,
    startAnalysis: startMediaPipe,
    stopAnalysis: stopMediaPipe,
  } = useMediaPipe();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Track metrics during recording
  useEffect(() => {
    if (isRecording && metrics) {
      metricsRef.current.smileScores.push(metrics.smileScore);
      metricsRef.current.eyeContactScores.push(metrics.eyeContactScore);
      metricsRef.current.attentionScores.push(metrics.attentionScore);
      metricsRef.current.expressionConfidences.push(metrics.expressionConfidence);
      metricsRef.current.postureScores.push(metrics.postureScore);
      metricsRef.current.headStabilities.push(metrics.headStability);
      metricsRef.current.shoulderAlignments.push(metrics.shoulderAlignment);
    }
  }, [isRecording, metrics]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Reset state when question changes
  useEffect(() => {
    resetTranscript();
    setShowAnalysis(false);
    setAnalysis(null);
    setElapsedTime(0);
    metricsRef.current = {
      smileScores: [],
      eyeContactScores: [],
      attentionScores: [],
      expressionConfidences: [],
      postureScores: [],
      headStabilities: [],
      shoulderAlignments: [],
    };
  }, [currentIndex, resetTranscript]);

  const calculateAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const handleStartRecording = useCallback(async () => {
    setIsRecording(true);
    startListening();
    await startMediaPipe();
  }, [startListening, startMediaPipe]);

  const handleStopRecording = useCallback(async () => {
    setIsRecording(false);
    stopListening();
    stopMediaPipe();

    if (!currentQuestion) return;

    setIsAnalyzing(true);

    const facialMetrics = {
      avgSmileScore: calculateAverage(metricsRef.current.smileScores),
      avgEyeContact: calculateAverage(metricsRef.current.eyeContactScores),
      avgAttention: calculateAverage(metricsRef.current.attentionScores),
      expressionConfidence: calculateAverage(metricsRef.current.expressionConfidences),
    };

    const postureMetrics = {
      avgPostureScore: calculateAverage(metricsRef.current.postureScores),
      headStability: calculateAverage(metricsRef.current.headStabilities),
      shoulderAlignment: calculateAverage(metricsRef.current.shoulderAlignments),
    };

    try {
      const result = await onAnalyze(
        currentQuestion.question,
        transcript,
        facialMetrics,
        postureMetrics
      );
      
      setAnalysis(result);
      setShowAnalysis(true);
      
      // Track results for final summary
      setAllResults(prev => [...prev, {
        score: result.resumeAlignmentScore,
        gaps: result.gaps,
        strengths: result.matchedClaims,
      }]);
      
      setFullTranscript(prev => prev + `\n\nQ: ${currentQuestion.question}\nA: ${transcript}`);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentQuestion, transcript, onAnalyze, stopListening, stopMediaPipe]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete(allResults, fullTranscript);
    } else {
      onNext();
    }
  }, [isLastQuestion, allResults, fullTranscript, onComplete, onNext]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Preview */}
        <div className="glass-card p-4">
          <div className="relative aspect-[4/3] bg-secondary rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className={`w-full h-full object-cover ${!mediaPipeRunning ? 'hidden' : ''}`}
            />
            
            {!mediaPipeRunning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                    <Mic className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mediaPipeLoading ? "Loading camera..." : "Click record to start"}
                  </p>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-medium text-white">REC</span>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="mt-4 p-4 bg-secondary/50 rounded-xl min-h-[100px] max-h-[150px] overflow-y-auto">
            <p className="text-sm text-muted-foreground mb-1">Your response:</p>
            <p className="text-foreground text-sm">
              {transcript || interimTranscript || (
                <span className="text-muted-foreground italic">
                  {isRecording ? "Listening..." : "Your answer will appear here"}
                </span>
              )}
              {isRecording && interimTranscript && (
                <span className="text-muted-foreground"> {interimTranscript}</span>
              )}
            </p>
          </div>
        </div>

        {/* Question & Analysis */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6"
            >
              {/* Question Badge */}
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Resume: {currentQuestion.relevantResumeSection}
                </span>
              </div>

              {/* Question */}
              <h2 className="text-lg font-semibold text-foreground leading-relaxed mb-4">
                {currentQuestion.question}
              </h2>

              {/* Criteria */}
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What we're looking for:</p>
                <p>{currentQuestion.assessmentCriteria}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Analysis Results */}
          <AnimatePresence>
            {showAnalysis && analysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Response Analysis</h3>
                  <div className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${analysis.resumeAlignmentScore >= 80 ? "bg-green-500/20 text-green-500" :
                      analysis.resumeAlignmentScore >= 60 ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-red-500/20 text-red-500"}
                  `}>
                    {analysis.resumeAlignmentScore}% Alignment
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{analysis.feedback}</p>

                {analysis.matchedClaims.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-500 mb-1">✓ Verified Claims</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.matchedClaims.map((claim, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">
                          {claim}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.gaps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-yellow-500 mb-1">! Areas to Elaborate</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.gaps.map((gap, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex gap-3">
            {!showAnalysis ? (
              <>
                {!isSupported ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Speech recognition not supported in this browser</span>
                  </div>
                ) : !isRecording ? (
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleStartRecording}
                    disabled={mediaPipeLoading}
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleStopRecording}
                    disabled={isAnalyzing}
                  >
                    <MicOff className="w-5 h-5" />
                    {isAnalyzing ? "Analyzing..." : "Stop & Analyze"}
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="hero"
                className="flex-1"
                onClick={handleNext}
              >
                {isLastQuestion ? "Complete Resume Round" : "Next Question"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePhase;
