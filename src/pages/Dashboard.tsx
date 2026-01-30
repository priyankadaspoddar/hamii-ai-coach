import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Play, 
  TrendingUp, 
  Clock, 
  Target, 
  LogOut,
  Video,
  MessageSquare,
  Users,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const interviewTypes = [
  { 
    id: "technical", 
    icon: Video, 
    label: "Technical", 
    description: "Coding, system design, algorithms",
    color: "from-primary to-[hsl(199,89%,48%)]"
  },
  { 
    id: "behavioral", 
    icon: MessageSquare, 
    label: "Behavioral", 
    description: "STAR method, soft skills",
    color: "from-[hsl(199,89%,48%)] to-accent"
  },
  { 
    id: "hr", 
    icon: Users, 
    label: "HR", 
    description: "Culture fit, expectations",
    color: "from-accent to-[hsl(330,65%,55%)]"
  },
  { 
    id: "resume", 
    icon: FileText, 
    label: "Resume-Based", 
    description: "Experience walkthrough",
    color: "from-[hsl(330,65%,55%)] to-primary"
  },
];

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Brain className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-[hsl(199,89%,48%)] to-accent flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">HAMII</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </motion.header>

        {/* Welcome Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, <span className="gradient-text">{user?.user_metadata?.full_name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="text-muted-foreground">
            Ready to master your next interview? Choose a practice mode below.
          </p>
        </motion.section>

        {/* Quick Stats */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { icon: Play, label: "Sessions", value: "0", color: "text-primary" },
            { icon: Clock, label: "Practice Time", value: "0h", color: "text-[hsl(199,89%,48%)]" },
            { icon: TrendingUp, label: "Improvement", value: "0%", color: "text-accent" },
            { icon: Target, label: "Avg Score", value: "--", color: "text-[hsl(330,65%,55%)]" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.section>

        {/* Interview Types */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Start Practice Session</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {interviewTypes.map((type, i) => (
              <motion.div
                key={type.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Link to="/practice">
                  <div className="glass-card p-6 hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <type.icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {type.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Link to="/practice">
            <Button variant="hero" size="xl" className="group">
              <Play className="w-5 h-5" />
              Quick Start Practice
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.section>
      </div>
    </div>
  );
};

export default Dashboard;
