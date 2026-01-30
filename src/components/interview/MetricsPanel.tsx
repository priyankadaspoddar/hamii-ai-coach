import { motion } from "framer-motion";
import { 
  Smile, 
  Eye, 
  Brain, 
  Activity,
  User,
  Volume2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import type { AnalysisMetrics } from "@/hooks/useMediaPipe";

interface MetricsPanelProps {
  metrics: AnalysisMetrics;
  isRunning: boolean;
}

const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  isActive 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
  color: string;
  isActive: boolean;
}) => {
  const percentage = Math.round(value * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">
          {isActive ? percentage : '--'}
        </span>
        <span className="text-sm text-muted-foreground mb-1">%</span>
      </div>
      
      <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isActive ? `${percentage}%` : 0 }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </motion.div>
  );
};

const MetricsPanel = ({ metrics, isRunning }: MetricsPanelProps) => {
  const facialMetrics = [
    { icon: Smile, label: "Smile", value: metrics.smileScore, color: "bg-primary" },
    { icon: Eye, label: "Eye Contact", value: metrics.eyeContactScore, color: "bg-[hsl(199,89%,48%)]" },
    { icon: Brain, label: "Attention", value: metrics.attentionScore, color: "bg-accent" },
    { icon: Activity, label: "Expression", value: metrics.expressionConfidence, color: "bg-primary" },
  ];

  const postureMetrics = [
    { icon: User, label: "Posture", value: metrics.postureScore, color: "bg-accent" },
    { icon: Activity, label: "Head Stability", value: metrics.headStability, color: "bg-[hsl(199,89%,48%)]" },
    { icon: TrendingUp, label: "Shoulder Align", value: metrics.shoulderAlignment, color: "bg-primary" },
  ];

  const speechMetrics = [
    { icon: Volume2, label: "Pitch", value: metrics.pitchHz / 300, color: "bg-[hsl(330,65%,55%)]" },
    { icon: MessageSquare, label: "Clarity", value: metrics.clarity, color: "bg-accent" },
    { icon: TrendingUp, label: "Relevance", value: metrics.contentRelevance, color: "bg-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Facial Analysis (FACS) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Facial Analysis (FACS)
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {facialMetrics.map((metric, i) => (
            <MetricCard key={i} {...metric} isActive={isRunning} />
          ))}
        </div>
      </div>

      {/* Posture Analysis (MediaPipe) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Posture (MediaPipe 468)
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {postureMetrics.map((metric, i) => (
            <MetricCard key={i} {...metric} isActive={isRunning} />
          ))}
        </div>
      </div>

      {/* Speech Analysis (YIN) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[hsl(330,65%,55%)] animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Speech Analysis (YIN)
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {speechMetrics.map((metric, i) => (
            <MetricCard key={i} {...metric} isActive={isRunning} />
          ))}
        </div>
      </div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <span className="text-sm text-muted-foreground">Overall Confidence</span>
        <div className="text-5xl font-bold gradient-text mt-2">
          {isRunning ? Math.round(
            ((metrics.smileScore + metrics.eyeContactScore + metrics.attentionScore + 
              metrics.postureScore + metrics.headStability) / 5) * 100
          ) : '--'}
          <span className="text-2xl text-muted-foreground">%</span>
        </div>
      </motion.div>
    </div>
  );
};

export default MetricsPanel;
