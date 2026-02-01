import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Clock, ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { MCQQuestion } from "@/types/interview";

interface MCQPhaseProps {
  questions: MCQQuestion[];
  currentIndex: number;
  onAnswer: (questionId: string, answer: string, timeTaken: number) => void;
  onNext: () => void;
  onComplete: () => void;
}

const MCQPhase = ({ questions, currentIndex, onAnswer, onNext, onComplete }: MCQPhaseProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeStarted, setTimeStarted] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Timer
  useEffect(() => {
    if (showResult) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeStarted, showResult]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeStarted(Date.now());
    setElapsedTime(0);
  }, [currentIndex]);

  const handleSelect = useCallback((answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (!selectedAnswer || !currentQuestion) return;
    
    const timeTaken = Math.floor((Date.now() - timeStarted) / 1000);
    onAnswer(currentQuestion.id, selectedAnswer, timeTaken);
    setShowResult(true);
  }, [selectedAnswer, currentQuestion, timeStarted, onAnswer]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete();
    } else {
      onNext();
    }
  }, [isLastQuestion, onComplete, onNext]);

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = questions.filter(q => q.userAnswer).length;
  const correctCount = questions.filter(q => q.isCorrect).length;

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-green-500">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{correctCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{elapsedTime}s</span>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8"
        >
          {/* Skill & Difficulty Badge */}
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
              {currentQuestion.skillArea}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              currentQuestion.difficulty === "easy" 
                ? "bg-green-500/20 text-green-500"
                : currentQuestion.difficulty === "medium"
                ? "bg-yellow-500/20 text-yellow-500"
                : "bg-red-500/20 text-red-500"
            }`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-xl font-semibold text-foreground mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const letter = option.charAt(0);
              const isSelected = selectedAnswer === letter;
              const isCorrect = letter === currentQuestion.correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showIncorrect = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  whileTap={!showResult ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(letter)}
                  disabled={showResult}
                  className={`
                    w-full p-4 text-left rounded-xl border-2 transition-all
                    ${isSelected && !showResult ? "border-primary bg-primary/10" : "border-border"}
                    ${showCorrect ? "border-green-500 bg-green-500/10" : ""}
                    ${showIncorrect ? "border-red-500 bg-red-500/10" : ""}
                    ${!showResult ? "hover:border-primary/50" : ""}
                    ${showResult && !isSelected && !isCorrect ? "opacity-50" : ""}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm
                      ${isSelected && !showResult ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                      ${showCorrect ? "bg-green-500 text-white" : ""}
                      ${showIncorrect ? "bg-red-500 text-white" : ""}
                    `}>
                      {showCorrect ? <CheckCircle className="w-4 h-4" /> : 
                       showIncorrect ? <XCircle className="w-4 h-4" /> : letter}
                    </span>
                    <span className="text-foreground flex-1">{option.slice(3)}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Explanation</p>
                    <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-8 flex justify-between items-center">
            {!showResult ? (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="ml-auto"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleNext}
                className="ml-auto"
              >
                {isLastQuestion ? "Complete Phase" : "Next Question"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Score Summary */}
      <div className="mt-6 flex justify-center gap-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{answeredCount}</div>
          <div className="text-xs text-muted-foreground">Answered</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{correctCount}</div>
          <div className="text-xs text-muted-foreground">Correct</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
      </div>
    </div>
  );
};

export default MCQPhase;
