import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/owner-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Identifiants incorrects");
        return;
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.accessToken);
      window.location.href = "/admin/dashboard";
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2 text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-xl mx-auto mb-4 border border-secondary/20">
              <Lock className="h-5 w-5 text-secondary" />
            </div>
            <CardTitle className="text-center text-white">Accès Administration</CardTitle>
            <p className="text-center text-white/40 text-sm">Baymora — Espace privé</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Email</label>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Mot de passe</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-white/8 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
