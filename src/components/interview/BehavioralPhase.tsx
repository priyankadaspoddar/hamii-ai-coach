import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Clock, ChevronRight, AlertCircle, Star, Heart, Users, Lightbulb, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useMediaPipe } from "@/hooks/useMediaPipe";
import type { BehavioralQuestion } from "@/types/interview";

interface BehavioralPhaseProps {
  questions: BehavioralQuestion[];
  currentIndex: number;
  onAnalyze: (
    question: string,
    transcript: string,
    facialMetrics?: { avgSmileScore: number; avgEyeContact: number; avgAttention: number; expressionConfidence: number },
    postureMetrics?: { avgPostureScore: number; headStability: number; shoulderAlignment: number }
  ) => Promise<{
    starScore: { situation: number; task: number; action: number; result: number };
    overallScore: number;
    softSkillsScore: number;
    demonstratedSkills: string[];
    improvementAreas: string[];
    feedback: string;
    emotionAnalysis: {
      primaryEmotion: string;
      confidenceLevel: string;
      engagementLevel: string;
    };
  }>;
  onNext: () => void;
  onComplete: (
    results: Array<{
      starScore: { situation: number; task: number; action: number; result: number };
      softSkills: string[];
      improvementAreas: string[];
      overallScore: number;
    }>,
    fullTranscript: string
  ) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  leadership: Star,
  teamwork: Users,
  conflict: Heart,
  "problem-solving": Lightbulb,
  adaptability: Target,
  communication: MessageSquare,
};

const BehavioralPhase = ({
  questions,
  currentIndex,
  onAnalyze,
  onNext,
  onComplete,
}: BehavioralPhaseProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<{
    starScore: { situation: number; task: number; action: number; result: number };
    overallScore: number;
    softSkillsScore: number;
    demonstratedSkills: string[];
    improvementAreas: string[];
    feedback: string;
    emotionAnalysis: {
      primaryEmotion: string;
      confidenceLevel: string;
      engagementLevel: string;
    };
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [allResults, setAllResults] = useState<Array<{
    starScore: { situation: number; task: number; action: number; result: number };
    softSkills: string[];
    improvementAreas: string[];
    overallScore: number;
  }>>([]);
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
  const CategoryIcon = currentQuestion ? categoryIcons[currentQuestion.category] || MessageSquare : MessageSquare;

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
      
      setAllResults(prev => [...prev, {
        starScore: result.starScore,
        softSkills: result.demonstratedSkills,
        improvementAreas: result.improvementAreas,
        overallScore: result.overallScore,
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

            {/* Real-time emotion indicator */}
            {isRecording && metrics && (
              <div className="absolute bottom-3 right-3 flex gap-2">
                <div className={`px-2 py-1 rounded text-xs backdrop-blur-sm ${
                  metrics.expressionConfidence > 0.6 ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-black"
                }`}>
                  {metrics.expressionConfidence > 0.6 ? "Confident" : "Neutral"}
                </div>
                <div className={`px-2 py-1 rounded text-xs backdrop-blur-sm ${
                  metrics.eyeContactScore > 0.7 ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-black"
                }`}>
                  {metrics.eyeContactScore > 0.7 ? "Good Eye Contact" : "Look at Camera"}
                </div>
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
              {/* Category Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <CategoryIcon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-accent capitalize">
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question */}
              <h2 className="text-lg font-semibold text-foreground leading-relaxed mb-4">
                {currentQuestion.question}
              </h2>

              {/* STAR Prompts */}
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">Use STAR method:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-secondary/50 rounded">
                    <span className="font-medium text-primary">S</span>
                    <span className="text-muted-foreground">ituation</span>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded">
                    <span className="font-medium text-primary">T</span>
                    <span className="text-muted-foreground">ask</span>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded">
                    <span className="font-medium text-primary">A</span>
                    <span className="text-muted-foreground">ction</span>
                  </div>
                  <div className="p-2 bg-secondary/50 rounded">
                    <span className="font-medium text-primary">R</span>
                    <span className="text-muted-foreground">esult</span>
                  </div>
                </div>
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
                  <h3 className="font-semibold text-foreground">STAR Analysis</h3>
                  <div className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${analysis.overallScore >= 80 ? "bg-green-500/20 text-green-500" :
                      analysis.overallScore >= 60 ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-red-500/20 text-red-500"}
                  `}>
                    {analysis.overallScore}% Score
                  </div>
                </div>

                {/* STAR Scores */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {Object.entries(analysis.starScore).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-secondary/50 rounded">
                      <div className="text-lg font-bold text-primary">{value}%</div>
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                {/* Emotion Analysis */}
                <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    analysis.emotionAnalysis.confidenceLevel === "high" 
                      ? "bg-green-500/20 text-green-500"
                      : "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {analysis.emotionAnalysis.confidenceLevel} confidence
                  </span>
                  <span className="px-2 py-1 text-xs bg-accent/20 text-accent rounded">
                    {analysis.emotionAnalysis.primaryEmotion}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{analysis.feedback}</p>

                {analysis.demonstratedSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-500 mb-1">✓ Skills Demonstrated</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.demonstratedSkills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.improvementAreas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-yellow-500 mb-1">! Areas to Improve</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.improvementAreas.map((area, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded">
                          {area}
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
                    <span className="text-sm">Speech recognition not supported</span>
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
                {isLastQuestion ? "Complete Behavioral Round" : "Next Question"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehavioralPhase;
