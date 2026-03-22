"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  BrainCircuit, 
  PlusCircle, 
  GraduationCap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const steps: Step[] = [
  {
    title: "Welcome to BuildRAX.ai",
    description: "Your workspace for building AI agents and automated workflows without writing a single line of code.",
    icon: Sparkles,
    color: "text-yellow-500 bg-yellow-500/10",
  },
  {
    title: "Visual Builder",
    description: "Create complex logic using our drag-and-drop node interface. Connect prompts, tools, and memory effortlessly.",
    icon: PlusCircle,
    color: "text-primary bg-primary/10",
  },
  {
    title: "Learn & Level Up",
    description: "Complete interactive lessons in 'Learn Mode' to earn XP, unlock new nodes, and become an AI Architect.",
    icon: GraduationCap,
    color: "text-green-500 bg-green-500/10",
  },
  {
    title: "Ready to Build?",
    description: "Start with a template or create a new project from scratch. Your journey into the future of AI starts now.",
    icon: BrainCircuit,
    color: "text-blue-500 bg-blue-500/10",
  },
];

export function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth entry after page load
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md"
          >
            <Card className="border-border/40 bg-card/50 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary/30">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 h-8 w-8 rounded-full z-10 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>

              <CardContent className="pt-12 pb-8 px-8 flex flex-col items-center text-center space-y-6">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, rotate: -10, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center ${step.color} shadow-lg`}
                >
                  <Icon className="w-10 h-10" />
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight">{step.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full pt-4">
                  {currentStep > 0 && (
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-12"
                      onClick={handleBack}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  )}
                  <Button 
                    className="flex-[2] rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    onClick={handleNext}
                  >
                    {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <div className="flex gap-1.5 pt-2">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-border"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
