import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { getLoginUrl } from "../const";
import { CheckCircle, XCircle, Clock, Users, Zap, Shield, Star, ArrowRight, Copy, ExternalLink } from "lucide-react";

export default function AcceptInvite() {
  const [, params] = useRoute("/invite/:token");
  const token = params?.token ?? "";
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  // Vérifier l'invitation
  const { data: inviteData, isLoading: inviteLoading, error: inviteError } = trpc.team.acceptInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // Confirmer l'acceptation après connexion
  const confirmMutation = trpc.team.confirmAccept.useMutation({
    onSuccess: (data) => {
      // Rediriger vers le dashboard terrain ou pilotage
      setTimeout(() => {
        if (data.role === "team") {
          navigate("/terrain");
        } else {
          navigate("/pilotage");
        }
      }, 2000);
    },
  });

  // Si l'utilisateur est connecté et l'invitation est valide, confirmer automatiquement
  useEffect(() => {
    if (user && inviteData?.status === "valid" && !confirmMutation.isSuccess && !confirmMutation.isPending) {
      confirmMutation.mutate({ token });
    }
  }, [user, inviteData?.status]);

  const isLoading = authLoading || inviteLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Vérification de l'invitation…</p>
        </div>
      </div>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invitation introuvable</h1>
          <p className="text-white/60 mb-8">Ce lien d'invitation n'existe pas ou a été supprimé.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors">
            Retour à l'accueil <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (inviteData.status === "expired") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invitation expirée</h1>
          <p className="text-white/60 mb-2">Cette invitation n'est plus valide.</p>
          <p className="text-white/40 text-sm mb-8">Demandez à votre fondateur de vous envoyer un nouveau lien.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  if (inviteData.status === "already_accepted") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invitation déjà acceptée</h1>
          <p className="text-white/60 mb-8">Ce lien a déjà été utilisé. Connectez-vous pour accéder à votre espace.</p>
          <a href="/terrain" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors">
            Accéder à mon espace <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (inviteData.status === "cancelled") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invitation annulée</h1>
          <p className="text-white/60 mb-8">Cette invitation a été annulée par le fondateur.</p>
          <a href="/" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // Invitation valide
  const inv = inviteData.invitation;

  // Si confirmation en cours ou réussie
  if (confirmMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Activation de votre accès…</p>
        </div>
      </div>
    );
  }

  if (confirmMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Bienvenue dans l'équipe !</h1>
          <p className="text-white/60 mb-2">Votre accès a été activé avec succès.</p>
          <p className="text-amber-400 text-sm mb-8">Redirection vers votre espace…</p>
        </div>
      </div>
    );
  }

  // Afficher la page d'invitation (non connecté)
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header Baymora */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-amber-400/60 mb-4">
            <span className="text-3xl font-serif text-amber-400 font-bold">B</span>
          </div>
          <p className="text-white/40 text-sm tracking-widest uppercase">Baymora</p>
        </div>

        {/* Card principale */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
          {/* Invitation de */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white/40 text-xs">Invitation de l'équipe Baymora</p>
              <p className="text-white font-semibold">
                {inv?.recipientName ? `Bonjour ${inv.recipientName} 👋` : "Vous êtes invité(e)"}
              </p>
            </div>
          </div>

          {/* Message personnalisé */}
          {inv?.message && (
            <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 mb-6">
              <p className="text-white/70 text-sm italic">"{inv.message}"</p>
            </div>
          )}

          {/* Ce que vous obtenez */}
          <h2 className="text-lg font-bold text-white mb-4">Ce que vous obtenez</h2>
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Forfait Explorer gratuit</p>
                <p className="text-white/40 text-xs">Accès complet aux outils terrain sans abonnement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Dashboard Terrain dédié</p>
                <p className="text-white/40 text-xs">Gérez vos rapports, fiches et missions sur le terrain</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Accès à LÉNA</p>
                <p className="text-white/40 text-xs">Votre assistante IA pour la création de fiches et rapports</p>
              </div>
            </div>
          </div>

          {/* Expiration */}
          {inv?.expiresAt && (
            <p className="text-white/30 text-xs text-center mb-6">
              Lien valide jusqu'au {new Date(inv.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}

          {/* CTA connexion */}
          {!user ? (
            <a
              href={getLoginUrl(`/invite/${token}`)}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-colors text-base"
            >
              Rejoindre l'équipe Baymora
              <ArrowRight className="w-5 h-5" />
            </a>
          ) : (
            <button
              onClick={() => confirmMutation.mutate({ token })}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-colors text-base"
            >
              Activer mon accès
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {confirmMutation.error && (
            <p className="text-red-400 text-sm text-center mt-3">
              {confirmMutation.error.message}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs text-center">
          Baymora — Conciergerie de luxe propulsée par l'IA
        </p>
      </div>
    </div>
  );
}
