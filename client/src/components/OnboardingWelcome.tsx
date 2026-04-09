import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const ONBOARDING_KEY = "baymora_onboarding_done_v7";

interface OnboardingWelcomeProps {
  onComplete?: () => void;
}

export function OnboardingWelcome({ onComplete }: OnboardingWelcomeProps) {
  const [step, setStep] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  const completeOnboarding = trpc.auth.completeOnboarding?.useMutation?.();

  useEffect(() => {
    // Vérifier localStorage ET le flag DB (user.hasCompletedOnboarding)
    const localDone = localStorage.getItem(ONBOARDING_KEY);
    const dbDone = (user as any)?.hasCompletedOnboarding;
    if (!localDone && !dbDone && user) {
      setVisible(true);
    }
  }, [user]);

  const handleComplete = (style?: string) => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
    // Persister en DB
    try {
      completeOnboarding?.mutate?.({ style: style || selectedStyle });
    } catch (_) {}
    const msg = style
      ? encodeURIComponent(`Je vis mes meilleurs moments ${style.toLowerCase()}. Qu'est-ce que tu me proposes ?`)
      : encodeURIComponent("Bonjour Maya ! Je viens de rejoindre la Maison.");
    navigate(`/maya?q=${msg}`);
    onComplete?.();
  };

  if (!visible) return null;

  const LIFESTYLE_OPTIONS = [
    { emoji: "🏖️", label: "En voyage", value: "en voyage" },
    { emoji: "🍽️", label: "À table", value: "à table" },
    { emoji: "💼", label: "En déplacement", value: "en déplacement pro" },
    { emoji: "🎭", label: "En sortant", value: "en sortant" },
    { emoji: "🏌️", label: "En bougeant", value: "en bougeant" },
    { emoji: "✨", label: "En me faisant plaisir", value: "en me faisant plaisir" },
  ];

  const steps = [
    // Étape 0 : Bienvenue
    <motion.div
      key="step0"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div className="mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #C8A96E 0%, #8B6914 100%)" }}
        >
          <span className="text-4xl">✦</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-white mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Bienvenue à la Maison.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg"
          style={{ color: "#C8A96E" }}
        >
          Votre Maison Baymora.
        </motion.p>
      </div>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={() => setStep(1)}
        className="mt-8 px-8 py-3 rounded-full font-semibold text-lg transition-colors"
        style={{ background: "#C8A96E", color: "#070B14" }}
      >
        Découvrir →
      </motion.button>
    </motion.div>,

    // Étape 1 : Questionnaire lifestyle
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Comment vivez-vous vos meilleurs moments ?
        </h2>
        <p className="text-sm" style={{ color: "#8B8D94" }}>
          Maya s'adapte à ce qui vous fait vibrer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {LIFESTYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setSelectedStyle(opt.value);
              setTimeout(() => handleComplete(opt.value), 350);
            }}
            className="py-4 px-3 rounded-xl border text-sm font-medium transition-all text-left"
            style={{
              borderColor: selectedStyle === opt.value ? "#C8A96E" : "rgba(255,255,255,0.12)",
              background: selectedStyle === opt.value ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.03)",
              color: selectedStyle === opt.value ? "#C8A96E" : "#F0EDE6",
            }}
          >
            <span className="text-xl block mb-1">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => handleComplete()}
        className="mt-6 text-sm transition-colors"
        style={{ color: "#8B8D94" }}
      >
        Passer →
      </button>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "#0A0A0F" }}>
      {/* Progress dots */}
      <div className="flex justify-center pt-8 gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === step ? "24px" : "12px",
              background: i <= step ? "#C8A96E" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const localDone = localStorage.getItem(ONBOARDING_KEY);
    const dbDone = (user as any)?.hasCompletedOnboarding;
    if (!localDone && !dbDone && user) setShouldShow(true);
  }, [user]);

  return shouldShow;
}
