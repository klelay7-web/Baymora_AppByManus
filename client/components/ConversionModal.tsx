import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function ConversionModal({ onClose, onSuccess }: Props) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'fantome' | 'signature'>('fantome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'benefits' | 'signup'>('benefits');

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) { setError('Un pseudo est requis'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ pseudo, email: email || undefined, mode });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Close */}
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white z-10">
            <X className="h-5 w-5" />
          </button>
        )}

        {step === 'benefits' && (
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-secondary/15 border border-secondary/30 text-secondary text-xs font-medium px-3 py-1 rounded-full mb-3">
                ✦ Votre plan est prêt
              </div>
              <h2 className="text-xl font-bold text-white">Créez votre profil Baymora</h2>
              <p className="text-white/50 text-sm mt-1">
                Accédez à tout, gardez tout, sans rien répéter.
              </p>
            </div>

            {/* Avantages */}
            <div className="space-y-3 mb-6">
              {[
                {
                  icon: '🧠',
                  title: 'Mémoire permanente',
                  desc: 'Baymora retient tout — vos goûts, vos proches, vos destinations préférées. Jamais à répéter.',
                },
                {
                  icon: '👻',
                  title: 'Anonymat total si vous le souhaitez',
                  desc: 'Vos données ne sont jamais liées à votre identité réelle. Vous êtes qui vous voulez.',
                },
                {
                  icon: '🗝️',
                  title: 'Accès aux lieux sélects',
                  desc: 'Baymora a des contacts directs. Des tables qui n\'existent pas en ligne. Des portes qui ne s\'ouvrent pas seul.',
                },
                {
                  icon: '📅',
                  title: 'Toujours un tour d\'avance',
                  desc: '"L\'anniversaire de Clara c\'est dans 3 semaines. Je prépare quelque chose ?" — avant même que vous y pensiez.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{item.title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep('signup')}
              className="w-full h-12 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-secondary/20 text-sm"
            >
              Créer mon profil — Gratuit
            </button>
            <p className="text-center text-white/25 text-xs mt-2">
              20 conversations/mois offertes · Sans carte bancaire
            </p>
          </div>
        )}

        {step === 'signup' && (
          <div className="p-6 sm:p-8">
            <button
              onClick={() => setStep('benefits')}
              className="text-white/40 hover:text-white text-xs mb-4 flex items-center gap-1"
            >
              ← Retour
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Votre profil en 30 secondes</h2>
            <p className="text-white/40 text-xs mb-5">Juste l'essentiel. Vous complétez le reste avec Baymora.</p>

            <form onSubmit={handleQuickSignup} className="space-y-3">

              {/* Mode */}
              <div className="grid grid-cols-2 gap-2">
                {(['fantome', 'signature'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === m
                        ? 'border-secondary bg-secondary/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/50'
                    }`}
                  >
                    <span className="text-base">{m === 'fantome' ? '👻' : '✦'}</span>
                    <p className="text-xs font-semibold mt-1">
                      {m === 'fantome' ? 'Fantôme' : 'Signature'}
                    </p>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Votre pseudo *"
                autoFocus
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
              />

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'signature' ? 'Votre email *' : 'Votre email (optionnel)'}
                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
              />

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continuer avec Baymora →
              </button>
            </form>

            <p className="text-center text-white/20 text-xs mt-3">
              Ou{' '}
              <button
                onClick={() => navigate('/auth')}
                className="text-secondary/70 hover:text-secondary underline"
              >
                créer un compte complet
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
