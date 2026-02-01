import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, Loader2, CheckCircle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResumeParser } from "@/hooks/useResumeParser";
import type { ResumeData } from "@/types/interview";

interface InterviewSetupProps {
  onStart: (jobRole: string, resumeData?: ResumeData) => void;
  isLoading: boolean;
}

const InterviewSetup = ({ onStart, isLoading }: InterviewSetupProps) => {
  const [jobRole, setJobRole] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { parseResume, isParsing, error } = useResumeParser();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      try {
        const data = await parseResume(file);
        setResumeData(data);
      } catch {
        // Error handled in hook
      }
    }
  }, [parseResume]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const data = await parseResume(file);
        setResumeData(data);
      } catch {
        // Error handled in hook
      }
    }
  }, [parseResume]);

  const handleStart = useCallback(() => {
    onStart(jobRole || "Software Developer", resumeData || undefined);
  }, [onStart, jobRole, resumeData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">Start Your Interview</h1>
        <p className="text-muted-foreground">
          Upload your resume and select your target role for a personalized interview experience.
        </p>
      </div>

      {/* Job Role Input */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="jobRole" className="text-foreground font-medium">
              Target Job Role
            </Label>
            <p className="text-xs text-muted-foreground">
              Questions will be tailored to this role
            </p>
          </div>
        </div>
        <Input
          id="jobRole"
          placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          className="bg-secondary/50"
        />
      </div>

      {/* Resume Upload */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-foreground font-medium">Upload Resume</span>
            <p className="text-xs text-muted-foreground">
              PDF or DOC format (optional but recommended)
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
            ${resumeData ? "border-green-500 bg-green-500/10" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <AnimatePresence mode="wait">
            {isParsing ? (
              <motion.div
                key="parsing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Parsing resume...</p>
              </motion.div>
            ) : resumeData ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-foreground font-medium mb-2">{resumeData.filename}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {resumeData.skills.slice(0, 6).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {resumeData.skills.length > 6 && (
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                      +{resumeData.skills.length - 6} more
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to upload a different file
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-1">
                  Drop your resume here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Start Button */}
      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={handleStart}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Preparing Interview...
          </>
        ) : (
          "Start 3-Phase Interview"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        The interview consists of Technical MCQs (10-15 min), Resume Deep-Dive (15-20 min), 
        and HR/Behavioral rounds (10-15 min).
      </p>
    </motion.div>
  );
};

export default InterviewSetup;
