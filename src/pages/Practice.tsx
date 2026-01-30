import { useMediaPipe } from "@/hooks/useMediaPipe";
import InterviewHeader from "@/components/interview/InterviewHeader";
import VideoPreview from "@/components/interview/VideoPreview";
import MetricsPanel from "@/components/interview/MetricsPanel";

const Practice = () => {
  const {
    videoRef,
    canvasRef,
    isLoading,
    isRunning,
    error,
    metrics,
    startAnalysis,
    stopAnalysis,
  } = useMediaPipe();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <InterviewHeader sessionType="technical" isRunning={isRunning} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Video Area */}
          <div className="lg:col-span-2">
            <VideoPreview
              videoRef={videoRef}
              canvasRef={canvasRef}
              isLoading={isLoading}
              isRunning={isRunning}
              error={error}
              onStart={startAnalysis}
              onStop={stopAnalysis}
            />

            {/* Analysis Info */}
            <div className="mt-6 glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Real-Time Analysis
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                HAMII uses advanced computer vision to track <span className="text-primary font-medium">468 facial landmarks</span> via 
                MediaPipe for FACS-inspired expression analysis, combined with <span className="text-accent font-medium">full body pose estimation</span> for 
                posture assessment. Speech patterns are analyzed using YIN-based pitch detection, and NLP provides content 
                relevance scoring.
              </p>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">468</div>
                  <div className="text-xs text-muted-foreground">Face Points</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-accent">33</div>
                  <div className="text-xs text-muted-foreground">Pose Points</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-[hsl(199,89%,48%)]">52</div>
                  <div className="text-xs text-muted-foreground">Blendshapes</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold text-[hsl(330,65%,55%)]">30</div>
                  <div className="text-xs text-muted-foreground">FPS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Sidebar */}
          <div className="lg:col-span-1">
            <MetricsPanel metrics={metrics} isRunning={isRunning} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
