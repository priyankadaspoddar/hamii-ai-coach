/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  sessionId: string;
  phases: {
    mcq: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      skillBreakdown: Record<string, { correct: number; total: number }>;
    };
    resume: {
      score: number;
      alignmentScores: number[];
      gaps: string[];
      strengths: string[];
    };
    behavioral: {
      score: number;
      starScores: { situation: number; task: number; action: number; result: number };
      softSkills: string[];
      improvementAreas: string[];
    };
  };
  emotionTimeline: Array<{
    timestamp: number;
    emotion: string;
    confidence: number;
  }>;
  resumeContext?: string;
  jobRole?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, phases, emotionTimeline, resumeContext, jobRole }: ReportRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const overallScore = (phases.mcq.score * 0.35 + phases.resume.score * 0.35 + phases.behavioral.score * 0.30);

    const systemPrompt = `You are an expert career coach generating comprehensive interview performance reports.
Create a detailed, actionable report that helps candidates improve.
Be encouraging but honest. Provide specific, practical improvement suggestions.

Return JSON in this format:
{
  "executiveSummary": "2-3 sentence overview of performance",
  "strengths": ["Top 3-5 strengths demonstrated"],
  "areasForImprovement": ["Top 3-5 areas to work on"],
  "detailedAnalysis": {
    "technical": {
      "summary": "Technical skills assessment",
      "recommendations": ["Specific study areas"]
    },
    "resume": {
      "summary": "Resume presentation assessment",
      "recommendations": ["How to better present experience"]
    },
    "behavioral": {
      "summary": "Soft skills and STAR assessment",
      "recommendations": ["How to improve responses"]
    }
  },
  "actionPlan": [
    {
      "priority": "high|medium|low",
      "action": "Specific action to take",
      "timeframe": "1 week|2 weeks|1 month",
      "resources": ["Optional helpful resources"]
    }
  ],
  "motivationalMessage": "Encouraging closing message"
}`;

    const userPrompt = `Generate a comprehensive interview performance report for a ${jobRole || "Software Developer"} candidate.

Technical/MCQ Phase Results:
- Score: ${phases.mcq.score}%
- Correct: ${phases.mcq.correctAnswers}/${phases.mcq.totalQuestions}
- Skill breakdown: ${JSON.stringify(phases.mcq.skillBreakdown)}

Resume Deep-Dive Phase Results:
- Score: ${phases.resume.score}%
- Identified strengths: ${phases.resume.strengths.join(", ")}
- Gaps found: ${phases.resume.gaps.join(", ")}

Behavioral Phase Results:
- Score: ${phases.behavioral.score}%
- STAR scores: S=${phases.behavioral.starScores.situation}%, T=${phases.behavioral.starScores.task}%, A=${phases.behavioral.starScores.action}%, R=${phases.behavioral.starScores.result}%
- Demonstrated soft skills: ${phases.behavioral.softSkills.join(", ")}
- Areas to improve: ${phases.behavioral.improvementAreas.join(", ")}

Overall Score: ${overallScore.toFixed(1)}%

Emotion timeline summary: ${emotionTimeline.length} data points captured, primary emotions observed.

Create a supportive, actionable report that will help this candidate succeed in future interviews.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    const report = JSON.parse(content);

    return new Response(JSON.stringify({
      ...report,
      overallScore,
      phaseScores: {
        technical: phases.mcq.score,
        resume: phases.resume.score,
        behavioral: phases.behavioral.score,
      },
      sessionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
