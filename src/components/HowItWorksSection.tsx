import { motion } from "framer-motion";
import { UserPlus, Target, Mic, BarChart3, GraduationCap, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Profile",
    description: "Set up your career goals, target roles, and industry preferences.",
  },
  {
    icon: Target,
    title: "Choose Scenario",
    description: "Select from technical, behavioral, HR, or custom interview formats.",
  },
  {
    icon: Mic,
    title: "Practice Live",
    description: "Engage in realistic AI-powered interviews with adaptive questioning.",
  },
  {
    icon: BarChart3,
    title: "Get Analysis",
    description: "Receive comprehensive feedback on verbal and non-verbal performance.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Improve",
    description: "Access personalized learning paths and micro-simulations.",
  },
  {
    icon: Rocket,
    title: "Land Your Role",
    description: "Enter interviews with confidence and proven preparation.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      
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
            <span className="text-foreground">How </span>
            <span className="gradient-text">HAMII Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your journey from nervous candidate to confident professional 
            in six simple steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="glass-card p-8 text-center h-full hover:border-primary/50 transition-all duration-500 group">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-colors duration-500">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
