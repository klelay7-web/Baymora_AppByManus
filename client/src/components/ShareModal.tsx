import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Share2, Copy, Check, X, Link2, MessageCircle,
  Twitter, Mail, ExternalLink, QrCode, Eye
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "trip" | "offer" | "destination";
  resourceId: number;
  title?: string;
  description?: string;
  coverImage?: string;
}

export function ShareModal({ isOpen, onClose, type, resourceId, title, description, coverImage }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const generateLink = trpc.share.generateLink.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/partage/${data.token}`;
      setShareUrl(url);
    },
    onError: () => toast.error("Impossible de générer le lien de partage"),
  });

  useEffect(() => {
    if (isOpen && !shareUrl) {
      generateLink.mutate({ type, resourceId, title, description, coverImage });
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Découvrez cette sélection Baymora",
          text: description || "Une expérience d'exception sélectionnée par Maison Baymora",
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`${title || "Sélection Baymora"} — ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleTwitter = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`${title || "Découvrez cette sélection"} via @MaisonBaymora`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleEmail = () => {
    if (!shareUrl) return;
    const subject = encodeURIComponent(title || "Sélection Baymora");
    const body = encodeURIComponent(`${description || "Une expérience d'exception"}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const qrUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&color=c8a94a&bgcolor=080c14`
    : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="fixed z-50 bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full">
        <div className="bg-[#0d1420] border border-[#c8a94a]/20 rounded-t-3xl md:rounded-2xl p-6 shadow-2xl">
          {/* Handle bar mobile */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 md:hidden" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#c8a94a]/15 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-[#c8a94a]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Partager</h3>
                {title && <p className="text-white/40 text-xs truncate max-w-[200px]">{title}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Cover preview */}
          {coverImage && (
            <div className="relative h-28 rounded-xl overflow-hidden mb-5">
              <img src={coverImage} alt={title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1420]/80 to-transparent" />
              {title && (
                <p className="absolute bottom-2.5 left-3 text-white font-medium text-sm">{title}</p>
              )}
            </div>
          )}

          {/* Share URL */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5">
            {generateLink.isPending ? (
              <div className="flex-1 h-4 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <Link2 className="w-4 h-4 text-[#c8a94a] shrink-0" />
                <span className="flex-1 text-white/60 text-xs truncate font-mono">
                  {shareUrl || "Génération du lien..."}
                </span>
                {shareUrl && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                      title="QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5 text-white/60" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="w-7 h-7 rounded-lg bg-[#c8a94a]/15 hover:bg-[#c8a94a]/25 flex items-center justify-center transition-colors"
                    >
                      {copied
                        ? <Check className="w-3.5 h-3.5 text-[#c8a94a]" />
                        : <Copy className="w-3.5 h-3.5 text-[#c8a94a]" />
                      }

                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* QR Code */}
          {showQR && qrUrl && (
            <div className="flex flex-col items-center gap-2 mb-5 p-4 bg-white/5 rounded-xl border border-white/10">
              <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-lg" />
              <p className="text-white/40 text-xs">Scannez pour ouvrir</p>
            </div>
          )}

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Native share (mobile) / Copy (desktop) */}
            <Button
              onClick={handleNativeShare}
              disabled={!shareUrl}
              className="bg-[#c8a94a] hover:bg-[#d4b85a] text-[#080c14] font-semibold rounded-xl h-11 gap-2"
            >
              <Share2 className="w-4 h-4" />
              {typeof navigator.share === 'function' ? "Partager" : "Copier le lien"}
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={handleWhatsApp}
              disabled={!shareUrl}
              variant="outline"
              className="border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 rounded-xl h-11 gap-2 bg-transparent"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Twitter/X */}
            <Button
              onClick={handleTwitter}
              disabled={!shareUrl}
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5 rounded-xl h-10 gap-2 bg-transparent text-sm"
            >
              <Twitter className="w-3.5 h-3.5" />
              Twitter / X
            </Button>

            {/* Email */}
            <Button
              onClick={handleEmail}
              disabled={!shareUrl}
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5 rounded-xl h-10 gap-2 bg-transparent text-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </Button>
          </div>

          {/* View count hint */}
          {shareUrl && (
            <p className="text-center text-white/25 text-xs mt-4 flex items-center justify-center gap-1.5">
              <Eye className="w-3 h-3" />
              Lien valable 30 jours
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// Hook utilitaire pour déclencher le partage facilement
export function useShareModal() {
  const [shareState, setShareState] = useState<{
    isOpen: boolean;
    type: "trip" | "offer" | "destination";
    resourceId: number;
    title?: string;
    description?: string;
    coverImage?: string;
  }>({ isOpen: false, type: "trip", resourceId: 0 });

  const openShare = (params: Omit<typeof shareState, "isOpen">) => {
    setShareState({ ...params, isOpen: true });
  };

  const closeShare = () => setShareState(s => ({ ...s, isOpen: false }));

  return { shareState, openShare, closeShare };
}
