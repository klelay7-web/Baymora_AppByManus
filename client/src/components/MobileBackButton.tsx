import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  label?: string;
  fallback?: string;
}

export default function MobileBackButton({ label = "Retour", fallback = "/" }: Props) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="md:hidden flex items-center gap-1 text-white/50 hover:text-white/80 text-sm mb-3 -ml-1"
    >
      <ChevronLeft size={18} />
      <span>{label}</span>
    </button>
  );
}
