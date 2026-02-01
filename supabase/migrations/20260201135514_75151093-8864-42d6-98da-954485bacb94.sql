-- Create enum for interview phases
DO $$ BEGIN
    CREATE TYPE interview_phase AS ENUM ('mcq', 'resume', 'behavioral');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table for storing resume data
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    filename TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    education TEXT,
    parsed_sections JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- RLS policies for resumes
CREATE POLICY "Users can view their own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resumes" ON public.resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resumes" ON public.resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);

-- Create table for MCQ questions generated per session
CREATE TABLE IF NOT EXISTS public.session_questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    phase TEXT NOT NULL DEFAULT 'mcq',
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer TEXT,
    user_answer TEXT,
    is_correct BOOLEAN,
    explanation TEXT,
    skill_area TEXT,
    difficulty TEXT DEFAULT 'medium',
    time_taken_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on session_questions
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_questions
CREATE POLICY "Users can view their own questions" ON public.session_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own questions" ON public.session_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own questions" ON public.session_questions FOR UPDATE USING (auth.uid() = user_id);

-- Create table for phase results
CREATE TABLE IF NOT EXISTS public.phase_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    phase TEXT NOT NULL,
    score NUMERIC DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    duration_seconds INTEGER DEFAULT 0,
    feedback JSONB DEFAULT '{}',
    transcript TEXT,
    analysis_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on phase_results
ALTER TABLE public.phase_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for phase_results
CREATE POLICY "Users can view their own phase results" ON public.phase_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own phase results" ON public.phase_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own phase results" ON public.phase_results FOR UPDATE USING (auth.uid() = user_id);

-- Create table for session reports
CREATE TABLE IF NOT EXISTS public.session_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    overall_score NUMERIC DEFAULT 0,
    tech_score NUMERIC DEFAULT 0,
    resume_score NUMERIC DEFAULT 0,
    behavioral_score NUMERIC DEFAULT 0,
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    detailed_feedback JSONB DEFAULT '{}',
    emotion_timeline JSONB DEFAULT '[]',
    report_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on session_reports
ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_reports
CREATE POLICY "Users can view their own reports" ON public.session_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON public.session_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reports" ON public.session_reports FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for resumes updated_at
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();