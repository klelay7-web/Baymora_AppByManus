import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const TOKEN_KEY = 'baymora_token';
const GUEST_MSG_KEY = 'baymora_guest_msgs';

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(GUEST_MSG_KEY);
      navigate('/chat', { replace: true });
    } else {
      navigate(`/auth?error=${error || 'google_failed'}`, { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-secondary animate-spin" />
        <p className="text-white/50 text-sm">Connexion en cours...</p>
      </div>
    </div>
  );
}
