/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  phase: "resume" | "behavioral";
  question: string;
  transcript: string;
  resumeContext?: string;
  facialMetrics?: {
    avgSmileScore: number;
    avgEyeContact: number;
    avgAttention: number;
    expressionConfidence: number;
  };
  postureMetrics?: {
    avgPostureScore: number;
    headStability: number;
    shoulderAlignment: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      phase, 
      question, 
      transcript, 
      resumeContext, 
      facialMetrics,
      postureMetrics 
    }: AnalyzeRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (phase === "resume") {
      systemPrompt = `You are an expert interview evaluator analyzing resume verification responses.
Evaluate the candidate's response for:
1. Factual alignment with resume claims
2. Technical depth and accuracy
3. Clarity and communication
4. Confidence indicators from speech patterns

Return JSON in this format:
{
  "resumeAlignmentScore": 0-100,
  "technicalDepthScore": 0-100,
  "clarityScore": 0-100,
  "confidenceScore": 0-100,
  "overallScore": 0-100,
  "matchedClaims": ["resume claim that was verified"],
  "gaps": ["areas where answer didn't match resume"],
  "followUpSuggestion": "Suggested follow-up question if needed",
  "feedback": "Detailed feedback for improvement"
}`;

      userPrompt = `Question asked: "${question}"

Candidate's response (transcribed speech):
"${transcript}"

Resume context:
${resumeContext || "No resume context provided"}

Facial/Non-verbal metrics during response:
- Smile Score: ${facialMetrics?.avgSmileScore?.toFixed(2) || "N/A"}
- Eye Contact: ${facialMetrics?.avgEyeContact?.toFixed(2) || "N/A"}
- Attention: ${facialMetrics?.avgAttention?.toFixed(2) || "N/A"}
- Expression Confidence: ${facialMetrics?.expressionConfidence?.toFixed(2) || "N/A"}
- Posture: ${postureMetrics?.avgPostureScore?.toFixed(2) || "N/A"}
- Head Stability: ${postureMetrics?.headStability?.toFixed(2) || "N/A"}

Analyze the response for factual accuracy and depth.`;

    } else if (phase === "behavioral") {
      systemPrompt = `You are an expert HR evaluator analyzing behavioral interview responses using STAR method.
Evaluate the candidate's response for:
1. STAR structure (Situation, Task, Action, Result)
2. Specificity and relevance
3. Soft skills demonstrated
4. Emotional intelligence indicators
5. Non-verbal communication quality

Return JSON in this format:
{
  "starScore": {
    "situation": 0-100,
    "task": 0-100,
    "action": 0-100,
    "result": 0-100
  },
  "softSkillsScore": 0-100,
  "emotionalIntelligence": 0-100,
  "nonVerbalScore": 0-100,
  "overallScore": 0-100,
  "demonstratedSkills": ["skill1", "skill2"],
  "improvementAreas": ["area1", "area2"],
  "feedback": "Personalized improvement tips",
  "emotionAnalysis": {
    "primaryEmotion": "confident|nervous|enthusiastic|calm",
    "confidenceLevel": "high|medium|low",
    "engagementLevel": "high|medium|low"
  }
}`;

      userPrompt = `Behavioral question asked: "${question}"

Candidate's response (transcribed speech):
"${transcript}"

Non-verbal metrics during response:
- Smile Score: ${facialMetrics?.avgSmileScore?.toFixed(2) || "N/A"} (indicates positive affect)
- Eye Contact: ${facialMetrics?.avgEyeContact?.toFixed(2) || "N/A"} (engagement indicator)
- Attention: ${facialMetrics?.avgAttention?.toFixed(2) || "N/A"} (focus level)
- Expression Confidence: ${facialMetrics?.expressionConfidence?.toFixed(2) || "N/A"}
- Posture: ${postureMetrics?.avgPostureScore?.toFixed(2) || "N/A"} (body language)
- Head Stability: ${postureMetrics?.headStability?.toFixed(2) || "N/A"} (nervousness indicator)

Analyze the response using STAR methodology and provide comprehensive feedback.`;
    }

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
        temperature: 0.5,
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

    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error analyzing response:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze response";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
