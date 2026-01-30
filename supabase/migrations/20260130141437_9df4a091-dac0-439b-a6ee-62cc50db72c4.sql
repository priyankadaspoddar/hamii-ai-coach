-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  target_role TEXT,
  industry TEXT,
  experience_level TEXT DEFAULT 'mid',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'technical', -- technical, behavioral, hr, resume
  job_role TEXT,
  industry TEXT,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, cancelled
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interview_sessions
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Interview sessions RLS policies
CREATE POLICY "Users can view their own sessions" 
ON public.interview_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.interview_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.interview_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- Create analysis_metrics table for storing per-session analysis data
CREATE TABLE public.analysis_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Facial metrics (FACS-inspired)
  avg_smile_score DECIMAL(4,3) DEFAULT 0,
  avg_eye_contact_score DECIMAL(4,3) DEFAULT 0,
  avg_attention_score DECIMAL(4,3) DEFAULT 0,
  expression_confidence DECIMAL(4,3) DEFAULT 0,
  -- Posture metrics
  avg_posture_score DECIMAL(4,3) DEFAULT 0,
  head_position_stability DECIMAL(4,3) DEFAULT 0,
  shoulder_alignment DECIMAL(4,3) DEFAULT 0,
  -- Speech metrics (YIN-inspired)
  avg_pitch_hz DECIMAL(6,2) DEFAULT 0,
  pitch_variability DECIMAL(5,2) DEFAULT 0,
  speech_pace_wpm INTEGER DEFAULT 0,
  filler_word_count INTEGER DEFAULT 0,
  -- NLP metrics
  content_relevance_score DECIMAL(4,3) DEFAULT 0,
  sentiment_score DECIMAL(4,3) DEFAULT 0,
  clarity_score DECIMAL(4,3) DEFAULT 0,
  vocabulary_diversity DECIMAL(4,3) DEFAULT 0,
  -- Overall scores
  overall_verbal_score DECIMAL(4,3) DEFAULT 0,
  overall_nonverbal_score DECIMAL(4,3) DEFAULT 0,
  overall_confidence_score DECIMAL(4,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analysis_metrics
ALTER TABLE public.analysis_metrics ENABLE ROW LEVEL SECURITY;

-- Analysis metrics RLS policies
CREATE POLICY "Users can view their own metrics" 
ON public.analysis_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics" 
ON public.analysis_metrics FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles timestamp update
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();