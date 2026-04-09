import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_KEY = "baymora_onboarding_done";

interface OnboardingWelcomeProps {
  onComplete?: () => void;
}

export function OnboardingWelcome({ onComplete }: OnboardingWelcomeProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ style?: string; destination?: string; budget?: string }>({});
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setVisible(true);
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
    const style = answers.style || "voyages";
    const dest = answers.destination || "une belle destination";
    const budget = answers.budget || "confort";
    const msg = encodeURIComponent(`Je cherche un voyage ${style} en ${dest} avec un budget ${budget}`);
    navigate(`/maya?q=${msg}`);
    onComplete?.();
  };

  const selectAnswer = (key: keyof typeof answers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    setTimeout(() => setStep(s => s + 1), 350);
  };

  if (!visible) return null;

  const steps = [
    // Étape 0 : Logo + Bienvenue
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
          className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C8A96E] to-[#8B6914] flex items-center justify-center mx-auto mb-6 shadow-2xl"
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
          Bienvenue chez Maison Baymora
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-[#C8A96E] text-lg"
        >
          Votre club privé de conciergerie IA
        </motion.p>
      </div>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        onClick={() => setStep(1)}
        className="mt-8 px-8 py-3 rounded-full bg-[#C8A96E] text-black font-semibold text-lg hover:bg-[#D4B87A] transition-colors"
      >
        Découvrir →
      </motion.button>
    </motion.div>,

    // Étape 1 : Maya se présente
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C8A96E] to-[#8B6914] flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-3xl">✨</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Voici Maya, votre concierge
        </h2>
        <p className="text-gray-400 text-sm mb-6">Elle crée vos voyages, trouve vos restaurants,<br />anticipe vos envies</p>
      </div>

      {/* Bulle animée de Maya */}
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1A1A2E] border border-[#C8A96E]/30 rounded-2xl rounded-tl-sm p-4 text-left mb-3"
        >
          <p className="text-white text-sm">Bonjour ! Je suis Maya ✨</p>
          <p className="text-gray-300 text-sm mt-1">Je vais vous créer des expériences sur-mesure — voyages, restaurants, hôtels, événements...</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-[#1A1A2E] border border-[#C8A96E]/30 rounded-2xl rounded-tl-sm p-4 text-left"
        >
          <p className="text-gray-300 text-sm">Pour commencer, dites-moi qui vous êtes...</p>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setStep(2)}
        className="mt-8 px-8 py-3 rounded-full bg-[#C8A96E] text-black font-semibold hover:bg-[#D4B87A] transition-colors"
      >
        Commencer →
      </motion.button>
    </motion.div>,

    // Étape 2 : Question 1 — Style de voyage
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <div className="mb-8 text-center">
        <span className="text-4xl mb-4 block">1️⃣</span>
        <h3 className="text-xl font-bold text-white mb-2">Quel type de voyageur êtes-vous ?</h3>
        <p className="text-gray-400 text-sm">Maya adaptera ses suggestions à votre style</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { label: "🏖️ Détente", value: "détente" },
          { label: "🎭 Culture", value: "culture" },
          { label: "🍽️ Gastro", value: "gastronomie" },
          { label: "🏔️ Aventure", value: "aventure" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => selectAnswer("style", opt.label)}
            className={`py-4 px-3 rounded-xl border text-sm font-medium transition-all ${
              answers.style === opt.label
                ? "border-[#C8A96E] bg-[#C8A96E]/20 text-[#C8A96E]"
                : "border-white/20 text-white hover:border-[#C8A96E]/60 hover:bg-[#C8A96E]/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>,

    // Étape 3 : Question 2 — Destination rêve
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <div className="mb-8 text-center">
        <span className="text-4xl mb-4 block">2️⃣</span>
        <h3 className="text-xl font-bold text-white mb-2">Votre destination rêve ?</h3>
        <p className="text-gray-400 text-sm">Ou laissez Maya vous surprendre</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { label: "🇮🇹 Italie", value: "Italie" },
          { label: "🇯🇵 Japon", value: "Japon" },
          { label: "🇬🇷 Grèce", value: "Grèce" },
          { label: "🌍 Surprenez-moi", value: "une destination surprise" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => selectAnswer("destination", opt.value)}
            className={`py-4 px-3 rounded-xl border text-sm font-medium transition-all ${
              answers.destination === opt.value
                ? "border-[#C8A96E] bg-[#C8A96E]/20 text-[#C8A96E]"
                : "border-white/20 text-white hover:border-[#C8A96E]/60 hover:bg-[#C8A96E]/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>,

    // Étape 4 : Question 3 — Budget
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-6"
    >
      <div className="mb-8 text-center">
        <span className="text-4xl mb-4 block">3️⃣</span>
        <h3 className="text-xl font-bold text-white mb-2">Budget par voyage ?</h3>
        <p className="text-gray-400 text-sm">Maya trouvera toujours la pépite parfaite</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {[
          { label: "💰 Malin", value: "malin (< 500€)" },
          { label: "💰💰 Confort", value: "confort (500-1500€)" },
          { label: "💎 Premium", value: "premium (1500-3000€)" },
          { label: "👑 Sans limite", value: "sans limite" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              setAnswers(prev => ({ ...prev, budget: opt.value }));
              setTimeout(handleComplete, 400);
            }}
            className={`py-4 px-3 rounded-xl border text-sm font-medium transition-all ${
              answers.budget === opt.value
                ? "border-[#C8A96E] bg-[#C8A96E]/20 text-[#C8A96E]"
                : "border-white/20 text-white hover:border-[#C8A96E]/60 hover:bg-[#C8A96E]/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0A0F] flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center pt-8 gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-6 bg-[#C8A96E]" : i < step ? "w-3 bg-[#C8A96E]/50" : "w-3 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>

      {/* Skip */}
      {step > 0 && step < 4 && (
        <div className="pb-8 text-center">
          <button
            onClick={handleComplete}
            className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Passer →
          </button>
        </div>
      )}
    </div>
  );
}

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShouldShow(true);
  }, []);

  return shouldShow;
}
