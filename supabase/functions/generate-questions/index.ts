/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  phase: "mcq" | "resume" | "behavioral";
  resumeData?: {
    skills: string[];
    experience: string;
    education: string;
    rawText: string;
  };
  jobRole?: string;
  previousAnswers?: string[];
  questionCount?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phase, resumeData, jobRole, previousAnswers, questionCount = 10 }: GenerateRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (phase === "mcq") {
      systemPrompt = `You are an expert technical interviewer. Generate multiple-choice questions for a coding/technical assessment.
Each question should have exactly 4 options (A, B, C, D) with one correct answer.
Return a JSON array of questions in this exact format:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct",
      "skillArea": "Python/Algorithms/etc",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

      const skills = resumeData?.skills?.join(", ") || "general programming";
      userPrompt = `Generate ${questionCount} technical MCQ questions for a ${jobRole || "software developer"} role.
Focus on these skills from the resume: ${skills}.
Mix difficulties: 30% easy, 50% medium, 20% hard.
Make questions practical and scenario-based when possible.`;

    } else if (phase === "resume") {
      systemPrompt = `You are an experienced interviewer conducting a deep-dive resume round.
Generate probing questions that verify the candidate's experience and skills listed in their resume.
Focus on technical depth, specific achievements, and real project experience.
Return a JSON array in this format:
{
  "questions": [
    {
      "question": "The interview question",
      "followUps": ["Follow-up question 1", "Follow-up question 2"],
      "expectedKeywords": ["keyword1", "keyword2"],
      "relevantResumeSection": "Which part of resume this relates to",
      "assessmentCriteria": "What to look for in a good answer"
    }
  ]
}`;

      userPrompt = `Based on this resume content, generate ${questionCount || 5} deep-dive interview questions:
${resumeData?.rawText || "No resume provided"}

Job Role: ${jobRole || "Software Developer"}
${previousAnswers?.length ? `Previous answers given: ${previousAnswers.join("; ")}` : ""}

Focus on verifying claims, understanding depth of experience, and probing technical decisions.`;

    } else if (phase === "behavioral") {
      systemPrompt = `You are an HR specialist conducting behavioral interviews using the STAR method.
Generate questions that assess soft skills, leadership, teamwork, and problem-solving.
Each question should be linked to experiences mentioned in the resume when possible.
Return a JSON array in this format:
{
  "questions": [
    {
      "question": "The behavioral question (STAR format)",
      "category": "leadership|teamwork|conflict|problem-solving|adaptability|communication",
      "starPrompts": {
        "situation": "What to ask about the situation",
        "task": "What to ask about the task",
        "action": "What to ask about actions taken",
        "result": "What to ask about results"
      },
      "redFlags": ["Things that indicate poor answer"],
      "greenFlags": ["Things that indicate good answer"],
      "linkedExperience": "Which resume experience this relates to"
    }
  ]
}`;

      userPrompt = `Generate ${questionCount || 5} behavioral interview questions.
Resume highlights: ${resumeData?.rawText?.slice(0, 1000) || "General candidate"}
Job Role: ${jobRole || "Software Developer"}

Include questions about:
1. Leadership/team management (if mentioned in resume)
2. Conflict resolution
3. Problem-solving under pressure
4. Adaptability and learning
5. Communication and collaboration`;
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
        temperature: 0.7,
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

    const questions = JSON.parse(content);

    return new Response(JSON.stringify(questions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating questions:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate questions";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
