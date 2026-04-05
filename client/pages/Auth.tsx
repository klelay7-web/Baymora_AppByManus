import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';

type Tab = 'register' | 'login';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/chat';
  const tokenParam = searchParams.get('token');
  const isTeam = searchParams.get('team') === 'true';

  const { register, login } = useAuth();

  // Auto-login si token dans l'URL (invitation équipe)
  useEffect(() => {
    if (tokenParam) {
      localStorage.setItem('baymora_token', tokenParam);
      navigate(isTeam ? '/admin/dashboard' : '/chat', { replace: true });
      window.location.reload();
    }
  }, [tokenParam]);

  const [tab, setTab] = useState<Tab>('register');
  const [pseudo, setPseudo] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) { setError('Un pseudo est requis'); return; }
    if (!email.trim()) { setError('L\'email est requis'); return; }
    setError('');
    setLoading(true);
    try {
      await register({ pseudo, prenom, email: email || undefined, password: password || undefined, mode: 'signature' });
      navigate(returnTo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !pseudo) { setError('Email ou pseudo requis'); return; }
    setError('');
    setLoading(true);
    try {
      await login({ email: email || undefined, pseudo: pseudo || undefined, password: password || undefined });
      navigate(returnTo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-secondary/20">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Baymora</h1>
          <p className="text-white/40 text-sm mt-1">Votre conciergerie de voyage privée</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

          {/* Tabs (compact) */}
          <div className="flex gap-1 bg-slate-950/60 rounded-lg p-0.5 mb-5">
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'register' ? 'bg-secondary text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
            >
              Créer mon compte
            </button>
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'login' ? 'bg-secondary text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
            >
              Se connecter
            </button>
          </div>

          {/* Google OAuth - PRIMARY action */}
          <a
            href="/api/auth/google"
            className="w-full h-12 bg-white text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all shadow-lg text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </a>

          {/* Apple (placeholder) */}
          <button
            type="button"
            disabled
            className="w-full h-11 mt-2 border border-white/10 bg-white/5 text-white/40 font-medium rounded-xl flex items-center justify-center gap-3 cursor-not-allowed text-sm"
            title="Apple Sign-In — bientôt disponible"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
            </svg>
            Continuer avec Apple <span className="text-xs">(bientôt)</span>
          </button>

          {/* Séparateur collapsible */}
          <button
            type="button"
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="w-full flex items-center gap-3 py-4 group"
          >
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-xs flex items-center gap-1 group-hover:text-white/60 transition-colors">
              Ou avec email
              <ChevronDown className={`h-3 w-3 transition-transform ${showEmailForm ? 'rotate-180' : ''}`} />
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </button>

          {/* Email forms - collapsed by default */}
          {showEmailForm && (
            <>
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">

                  {/* Pseudo */}
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">
                      Pseudo <span className="text-secondary">*</span>
                    </label>
                    <input
                      type="text"
                      value={pseudo}
                      onChange={e => setPseudo(e.target.value)}
                      placeholder="Votre nom de voyage..."
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
                      autoFocus
                    />
                  </div>

                  {/* Prénom optionnel */}
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">
                      Prénom <span className="text-white/30">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={e => setPrenom(e.target.value)}
                      placeholder="Pour que Baymora vous appelle par votre prénom..."
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">
                      Email <span className="text-secondary">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Pour vos plans de voyage et rappels..."
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
                    />
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">
                      Mot de passe <span className="text-white/30">(optionnel)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Sécurisez votre compte..."
                        className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Créer mon compte Baymora
                  </button>
                </form>
              )}

              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">Email ou pseudo</label>
                    <input
                      type="text"
                      value={email || pseudo}
                      onChange={e => {
                        const v = e.target.value;
                        if (v.includes('@')) { setEmail(v); setPseudo(''); }
                        else { setPseudo(v); setEmail(''); }
                      }}
                      placeholder="Votre email ou pseudo..."
                      className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-medium mb-1.5 block">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-secondary/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Se connecter
                  </button>
                </form>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-xs mt-4">
          Vos données sont chiffrées et ne sont jamais revendues.
        </p>
      </div>
    </div>
  );
}
