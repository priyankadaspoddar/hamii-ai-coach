import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  TrendingUp, 
  Award, 
  Target, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Brain,
  MessageSquare,
  User,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { jsPDF } from "jspdf";
import type { SessionReport } from "@/types/interview";

interface SessionReportViewProps {
  report: SessionReport;
  onStartNew: () => void;
  onGoToDashboard: () => void;
}

const SessionReportView = ({ report, onStartNew, onGoToDashboard }: SessionReportViewProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = useCallback(async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;
      const lineHeight = 7;
      const margin = 20;

      // Title
      pdf.setFontSize(24);
      pdf.setTextColor(30, 41, 59);
      pdf.text("HAMII Interview Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Session ID & Date
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Session: ${report.sessionId}`, margin, yPos);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin, yPos, { align: "right" });
      yPos += 15;

      // Overall Score
      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Overall Score", margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(36);
      pdf.setTextColor(48, 213, 200); // Primary color
      pdf.text(`${Math.round(report.overallScore)}%`, margin, yPos);
      yPos += 20;

      // Phase Scores
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Phase Breakdown", margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      const phases = [
        { name: "Technical", score: report.phaseScores.technical },
        { name: "Resume", score: report.phaseScores.resume },
        { name: "Behavioral", score: report.phaseScores.behavioral },
      ];

      phases.forEach(phase => {
        pdf.setTextColor(71, 85, 105);
        pdf.text(`${phase.name}: ${Math.round(phase.score)}%`, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 10;

      // Executive Summary
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Executive Summary", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      const summaryLines = pdf.splitTextToSize(report.executiveSummary, pageWidth - 2 * margin);
      pdf.text(summaryLines, margin, yPos);
      yPos += summaryLines.length * 5 + 10;

      // Strengths
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Key Strengths", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(34, 197, 94); // Green
      report.strengths.forEach(strength => {
        pdf.text(`✓ ${strength}`, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 10;

      // Areas for Improvement
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Areas for Improvement", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(234, 179, 8); // Yellow
      report.areasForImprovement.forEach(area => {
        pdf.text(`• ${area}`, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 10;

      // Action Plan
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Action Plan", margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      report.actionPlan.forEach((item, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setTextColor(71, 85, 105);
        const priorityColor = item.priority === "high" ? [239, 68, 68] : item.priority === "medium" ? [234, 179, 8] : [34, 197, 94];
        pdf.setTextColor(...priorityColor as [number, number, number]);
        pdf.text(`[${item.priority.toUpperCase()}]`, margin, yPos);
        
        pdf.setTextColor(30, 41, 59);
        pdf.text(item.action, margin + 20, yPos);
        yPos += lineHeight;
        
        pdf.setTextColor(100, 116, 139);
        pdf.text(`   Timeframe: ${item.timeframe}`, margin, yPos);
        yPos += lineHeight + 3;
      });

      // Motivational Message
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      yPos += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(48, 213, 200);
      pdf.setFont("helvetica", "italic");
      const motivationLines = pdf.splitTextToSize(`"${report.motivationalMessage}"`, pageWidth - 2 * margin);
      pdf.text(motivationLines, pageWidth / 2, yPos, { align: "center" });

      // Save PDF
      pdf.save(`HAMII-Report-${report.sessionId.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [report]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center"
        >
          <Award className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Interview Complete!</h1>
        <p className="text-muted-foreground">{report.executiveSummary}</p>
      </div>

      {/* Overall Score */}
      <div className="glass-card p-8 text-center">
        <span className="text-sm text-muted-foreground">Overall Performance</span>
        <div className="text-6xl font-bold gradient-text my-4">
          {Math.round(report.overallScore)}%
        </div>
        <Progress value={report.overallScore} className="h-3 max-w-md mx-auto" />
      </div>

      {/* Phase Scores */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/20 mx-auto mb-3 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Technical</span>
          <div className="text-3xl font-bold text-foreground mt-1">
            {Math.round(report.phaseScores.technical)}%
          </div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/20 mx-auto mb-3 flex items-center justify-center">
            <User className="w-6 h-6 text-accent" />
          </div>
          <span className="text-sm text-muted-foreground">Resume</span>
          <div className="text-3xl font-bold text-foreground mt-1">
            {Math.round(report.phaseScores.resume)}%
          </div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[hsl(199,89%,48%)]/20 mx-auto mb-3 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-[hsl(199,89%,48%)]" />
          </div>
          <span className="text-sm text-muted-foreground">Behavioral</span>
          <div className="text-3xl font-bold text-foreground mt-1">
            {Math.round(report.phaseScores.behavioral)}%
          </div>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-foreground">Key Strengths</h3>
          </div>
          <ul className="space-y-2">
            {report.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                <span className="text-muted-foreground">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-foreground">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {report.areasForImprovement.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                <span className="text-muted-foreground">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Plan */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Action Plan</h3>
        </div>
        <div className="space-y-3">
          {report.actionPlan.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className={`
                px-2 py-0.5 text-xs font-medium rounded
                ${item.priority === "high" ? "bg-red-500/20 text-red-500" :
                  item.priority === "medium" ? "bg-yellow-500/20 text-yellow-500" :
                  "bg-green-500/20 text-green-500"}
              `}>
                {item.priority}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.action}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {item.timeframe}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="glass-card p-6 text-center">
        <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
        <p className="text-lg text-foreground italic">{`"${report.motivationalMessage}"`}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={generatePDF}
          disabled={isGeneratingPDF}
        >
          <Download className="w-4 h-4" />
          {isGeneratingPDF ? "Generating..." : "Download PDF Report"}
        </Button>
        <Button
          variant="hero"
          className="flex-1"
          onClick={onStartNew}
        >
          Start New Interview
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        className="w-full"
        onClick={onGoToDashboard}
      >
        Return to Dashboard
      </Button>
    </motion.div>
  );
};

export default SessionReportView;
