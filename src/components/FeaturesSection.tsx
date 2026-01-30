import { motion } from "framer-motion";
import { 
  Brain, 
  Eye, 
  TrendingUp, 
  Shield, 
  Glasses, 
  LineChart 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Hyper-Realistic Simulation",
    description: "Dynamic multi-round interviews that adapt in real-time to your responses, job roles, and industry trends with emotional nuance.",
    gradient: "from-primary to-[hsl(199,89%,48%)]",
  },
  {
    icon: Eye,
    title: "Multimodal Evaluation",
    description: "360-degree analysis of verbal content, facial expressions, tone, body language, and physiological stress indicators.",
    gradient: "from-[hsl(199,89%,48%)] to-accent",
  },
  {
    icon: TrendingUp,
    title: "Personalized Upskilling",
    description: "Predictive feedback that highlights gaps, forecasts skill trajectories, and recommends tailored learning paths.",
    gradient: "from-accent to-[hsl(330,65%,55%)]",
  },
  {
    icon: Shield,
    title: "Bias & Fairness",
    description: "Advanced adversarial techniques detect and mitigate cultural, accent, and demographic biases for equitable assessments.",
    gradient: "from-[hsl(330,65%,55%)] to-primary",
  },
  {
    icon: Glasses,
    title: "Immersive VR/AR",
    description: "Experience collaborative group interviews in virtual reality with edge computing for low-latency deployment.",
    gradient: "from-primary to-accent",
  },
  {
    icon: LineChart,
    title: "Career Trajectory",
    description: "Long-term progress tracking with predictive modeling to simulate career outcomes and boost employability.",
    gradient: "from-accent to-[hsl(199,89%,48%)]",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Powered by </span>
            <span className="gradient-text">Intelligence</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Six revolutionary capabilities that transform how you prepare for 
            and excel in any interview scenario.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass-card p-8 h-full hover:border-primary/50 transition-all duration-500 hover:shadow-lg hover:shadow-primary/10">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
