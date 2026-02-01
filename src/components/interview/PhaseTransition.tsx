import { motion } from "framer-motion";
import { CheckCircle, XCircle, TrendingUp, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PhaseTransitionProps {
  fromPhase: "mcq" | "resume" | "behavioral";
  toPhase: "resume" | "behavioral" | "complete";
  score: number;
  passed: boolean;
  feedback?: string;
  onContinue: () => void;
  isLoading?: boolean;
}

const phaseNames = {
  mcq: "Technical Assessment",
  resume: "Resume Deep-Dive",
  behavioral: "HR/Behavioral",
  complete: "Final Report",
};

const PhaseTransition = ({
  fromPhase,
  toPhase,
  score,
  passed,
  feedback,
  onContinue,
  isLoading,
}: PhaseTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center"
    >
      <div className="glass-card p-8">
        {/* Result Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`
            w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center
            ${passed ? "bg-green-500/20" : "bg-yellow-500/20"}
          `}
        >
          {passed ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <TrendingUp className="w-10 h-10 text-yellow-500" />
          )}
        </motion.div>

        {/* Phase Complete */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {phaseNames[fromPhase]} Complete!
        </h2>

        {/* Score */}
        <div className="mb-6">
          <div className="text-5xl font-bold gradient-text mb-2">
            {Math.round(score)}%
          </div>
          <div className="flex items-center justify-center gap-2">
            {passed ? (
              <span className="text-green-500 font-medium">Passed</span>
            ) : (
              <span className="text-yellow-500 font-medium">Keep practicing!</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={score} className="h-3" />
        </div>

        {/* Feedback */}
        {feedback && (
          <p className="text-muted-foreground text-sm mb-6">{feedback}</p>
        )}

        {/* Next Phase Info */}
        {toPhase !== "complete" && (
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Up Next</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {phaseNames[toPhase]}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {toPhase === "resume" 
                ? "Deep-dive into your resume with live video/audio analysis"
                : toPhase === "behavioral"
                ? "Soft skills evaluation using STAR methodology"
                : "View your comprehensive performance report"}
            </p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={onContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Preparing...
            </>
          ) : toPhase === "complete" ? (
            <>
              View Report
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue to {phaseNames[toPhase]}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>

        {!passed && toPhase !== "complete" && (
          <p className="text-xs text-muted-foreground mt-4">
            Score below 70% threshold, but you can continue practicing all phases.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PhaseTransition;
