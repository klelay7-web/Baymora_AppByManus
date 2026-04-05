import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ConversionModal from '@/components/ConversionModal';
import { useAuth } from '@/hooks/useAuth';

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [invite, setInvite] = useState<{ inviterName: string; bonusPoints: number } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) { setInvalid(true); setLoading(false); return; }
    fetch(`/api/club/join/${code}`)
      .then(r => {
        if (!r.ok) { setInvalid(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data) setInvite({ inviterName: data.inviterName, bonusPoints: data.bonusPoints });
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [code]);

  // Already logged in → redirect to club
  useEffect(() => {
    if (isAuthenticated) navigate('/club', { replace: true });
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary/40 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-center p-6">
        <div>
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-white/40 text-sm mb-6">Ce lien d'invitation n'existe pas ou a expiré.</p>
          <Button onClick={() => navigate('/')} variant="ghost" className="text-secondary">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center">
        {/* Badge Club */}
        <div className="w-20 h-20 rounded-full bg-secondary/15 border-2 border-secondary/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">💎</span>
        </div>

        <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1 mb-4">
          <span className="text-secondary text-xs font-semibold">Invitation personnelle</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {invite?.inviterName} vous invite au Baymora Club
        </h1>
        <p className="text-white/45 text-sm leading-relaxed mb-6">
          Rejoignez la communauté premium Baymora et recevez{' '}
          <span className="text-secondary font-bold">+{invite?.bonusPoints} Crystals</span>{' '}
          de bienvenue pour commencer votre aventure.
        </p>

        {/* Bonus cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-secondary/8 border border-secondary/20 rounded-2xl p-4">
            <p className="text-secondary font-bold text-2xl">+{invite?.bonusPoints}</p>
            <p className="text-white/40 text-xs mt-0.5">Crystals pour vous</p>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
            <p className="text-white font-bold text-2xl">💎</p>
            <p className="text-white/40 text-xs mt-0.5">Niveau Crystal offert</p>
          </div>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="w-full bg-secondary hover:bg-secondary/90 text-black font-bold text-base py-6 rounded-2xl mb-3"
        >
          Rejoindre le Club →
        </Button>

        <p className="text-white/20 text-xs">
          Déjà membre ?{' '}
          <button onClick={() => navigate('/auth')} className="text-secondary/60 hover:text-secondary underline">
            Se connecter
          </button>
        </p>
      </div>

      {/* Conversion modal with invite code pre-filled */}
      {showModal && (
        <ConversionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => navigate('/club')}
          inviteCode={code}
        />
      )}
    </div>
  );
}
