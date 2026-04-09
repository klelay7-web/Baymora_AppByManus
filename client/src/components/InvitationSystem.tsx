import { useState } from "react";
import { Users, UserPlus, Copy, Mail, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Companion {
  id: number;
  name: string;
  email?: string;
  relation?: string;
}

interface InvitationSystemProps {
  tripId?: string | number;
  tripTitle?: string;
  companions?: Companion[];
  onInvite?: (email: string) => void;
}

export default function InvitationSystem({
  tripId,
  tripTitle = "Mon parcours",
  companions = [],
  onInvite,
}: InvitationSystemProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const createCompanionMutation = trpc.companions.create.useMutation({
    onSuccess: () => {
      toast("Invitation envoyée ✓");
      setSent((prev) => [...prev, email]);
      setEmail("");
      setSending(false);
    },
    onError: () => {
      toast("Erreur lors de l'envoi");
      setSending(false);
    },
  });

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast("Adresse email invalide");
      return;
    }
    setSending(true);
    if (onInvite) {
      onInvite(email);
      setSent((prev) => [...prev, email]);
      setEmail("");
      setSending(false);
      toast("Invitation envoyée ✓");
      return;
    }
    createCompanionMutation.mutate({
      name: email.split("@")[0],
      relationship: "ami",
      freeNotes: `Email: ${email}`,
    });
  };

  const handleCopyLink = () => {
    const url = tripId
      ? `${window.location.origin}/parcours/${tripId}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    toast("Lien d'invitation copié ✓");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Rejoins mon parcours "${tripTitle}" sur Baymora`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe t'invite à rejoindre mon parcours "${tripTitle}" planifié avec Maya sur Baymora.\n\nVoici le lien : ${window.location.origin}/parcours/${tripId}\n\nÀ bientôt !`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#0D1117", border: "1px solid rgba(200,169,110,0.1)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} color="#C8A96E" />
          <span className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>
            Voyageurs
          </span>
          {companions.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(200,169,110,0.15)", color: "#C8A96E" }}
            >
              {companions.length + 1}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
          style={{ background: "rgba(200,169,110,0.1)", color: "#C8A96E", border: "1px solid rgba(200,169,110,0.2)" }}
        >
          <UserPlus size={13} />
          Inviter
        </button>
      </div>

      {/* Companions list */}
      {companions.length > 0 && (
        <div className="space-y-2 mb-3">
          {companions.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "#F0EDE6" }}>{c.name}</p>
                {c.relation && (
                  <p className="text-xs" style={{ color: "#8B8D94" }}>{c.relation}</p>
                )}
              </div>
              <Check size={13} color="#10B981" />
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      {showForm && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="email@exemple.com"
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(200,169,110,0.05)",
                border: "1px solid rgba(200,169,110,0.2)",
                color: "#F0EDE6",
              }}
            />
            <button
              onClick={handleInvite}
              disabled={sending}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            >
              {sending ? "..." : "Envoyer"}
            </button>
          </div>

          {/* Sent list */}
          {sent.length > 0 && (
            <div className="space-y-1">
              {sent.map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs" style={{ color: "#10B981" }}>
                  <Check size={12} />
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Quick share options */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl flex-1 justify-center"
              style={{ background: "rgba(200,169,110,0.06)", color: "#8B8D94", border: "1px solid rgba(200,169,110,0.1)" }}
            >
              <Copy size={12} />
              Copier le lien
            </button>
            <button
              onClick={handleShareEmail}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl flex-1 justify-center"
              style={{ background: "rgba(200,169,110,0.06)", color: "#8B8D94", border: "1px solid rgba(200,169,110,0.1)" }}
            >
              <Mail size={12} />
              Par email
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {companions.length === 0 && !showForm && (
        <div className="text-center py-3">
          <Sparkles size={20} color="#C8A96E" className="mx-auto mb-2" />
          <p className="text-xs" style={{ color: "#8B8D94" }}>
            Invitez vos proches à rejoindre ce parcours
          </p>
        </div>
      )}
    </div>
  );
}
