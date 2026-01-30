import { motion } from "framer-motion";
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isLoading: boolean;
  isRunning: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

const VideoPreview = ({
  videoRef,
  canvasRef,
  isLoading,
  isRunning,
  error,
  onStart,
  onStop,
}: VideoPreviewProps) => {
  return (
    <div className="relative">
      {/* Video Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-[4/3] glass-card overflow-hidden rounded-2xl"
      >
        {/* Hidden video element for capture */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />

        {/* Canvas for drawing landmarks */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-cover ${!isRunning ? 'hidden' : ''}`}
        />

        {/* Placeholder when not running */}
        {!isRunning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/50">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center max-w-xs">
              {isLoading 
                ? "Loading AI models..." 
                : "Click Start to begin your interview practice session"}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive text-center max-w-xs">{error}</p>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading MediaPipe models...</p>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        {isRunning && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/90 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-medium text-white">LIVE</span>
          </div>
        )}

        {/* Landmark Legend */}
        {isRunning && (
          <div className="absolute bottom-4 left-4 flex gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
              <div className="w-3 h-1 rounded-full bg-primary" />
              <span className="text-xs text-white">Face</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
              <div className="w-3 h-1 rounded-full bg-accent" />
              <span className="text-xs text-white">Pose</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="mt-4 flex justify-center gap-4">
        {!isRunning ? (
          <Button
            variant="hero"
            size="lg"
            onClick={onStart}
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Start Analysis
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="lg"
            onClick={onStop}
            className="min-w-[200px]"
          >
            <CameraOff className="w-5 h-5" />
            Stop Analysis
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;
