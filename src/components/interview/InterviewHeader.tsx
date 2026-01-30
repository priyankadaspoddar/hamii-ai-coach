import { motion } from "framer-motion";
import { ArrowLeft, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface InterviewHeaderProps {
  sessionType: string;
  isRunning: boolean;
}

const InterviewHeader = ({ sessionType, isRunning }: InterviewHeaderProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interview Practice</h1>
          <p className="text-sm text-muted-foreground capitalize">{sessionType} Interview</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timer */}
        <div className="flex items-center gap-2 px-4 py-2 glass-card">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-lg text-foreground">{formatTime(elapsedTime)}</span>
        </div>

        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </motion.header>
  );
};

export default InterviewHeader;
