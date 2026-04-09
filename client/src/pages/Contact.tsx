import { useState } from "react";
import { Link } from "wouter";

export default function Contact() {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulation d'envoi (à connecter à un endpoint tRPC ou Resend)
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-gray-300">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-[#C8A96E] font-playfair text-lg hover:opacity-80 transition-opacity">
          ← Maison Baymora
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-playfair text-4xl text-[#C8A96E] mb-2">Nous contacter</h1>
        <p className="text-gray-500 mb-12">Notre équipe vous répond sous 24h ouvrées</p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Formulaire */}
          <div>
            {sent ? (
              <div className="bg-[#C8A96E]/10 border border-[#C8A96E]/30 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-playfair text-xl text-[#C8A96E] mb-2">Message envoyé</h3>
                <p className="text-gray-400 text-sm">Nous vous répondrons dans les 24h ouvrées.</p>
                <button
                  onClick={() => { setSent(false); setForm({ nom: "", email: "", sujet: "", message: "" }); }}
                  className="mt-6 text-[#C8A96E] text-sm hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nom</label>
                  <input
                    type="text"
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E]/50 transition-colors"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E]/50 transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sujet</label>
                  <select
                    required
                    value={form.sujet}
                    onChange={(e) => setForm({ ...form, sujet: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C8A96E]/50 transition-colors"
                  >
                    <option value="" className="bg-[#070B14]">Choisir un sujet</option>
                    <option value="support" className="bg-[#070B14]">Support technique</option>
                    <option value="abonnement" className="bg-[#070B14]">Mon abonnement</option>
                    <option value="partenariat" className="bg-[#070B14]">Partenariat</option>
                    <option value="presse" className="bg-[#070B14]">Presse</option>
                    <option value="autre" className="bg-[#070B14]">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E]/50 transition-colors resize-none"
                    placeholder="Décrivez votre demande..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-[#C8A96E] text-[#070B14] font-semibold py-3 rounded-lg hover:bg-[#D4B87A] transition-colors disabled:opacity-60"
                >
                  {sending ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </form>
            )}
          </div>

          {/* Contacts directs */}
          <div className="space-y-8">
            <div>
              <h3 className="font-playfair text-xl text-[#C8A96E] mb-4">Contacts directs</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white font-medium mb-1">Support membres</p>
                  <a href="mailto:support@maisonbaymora.com" className="text-[#C8A96E] hover:underline text-sm">
                    support@maisonbaymora.com
                  </a>
                  <p className="text-gray-600 text-xs mt-1">Réponse sous 24h ouvrées</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white font-medium mb-1">Partenariats & établissements</p>
                  <a href="mailto:partenaires@maisonbaymora.com" className="text-[#C8A96E] hover:underline text-sm">
                    partenaires@maisonbaymora.com
                  </a>
                  <p className="text-gray-600 text-xs mt-1">Rejoignez notre réseau de partenaires</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-white font-medium mb-1">Presse & médias</p>
                  <a href="mailto:contact@maisonbaymora.com" className="text-[#C8A96E] hover:underline text-sm">
                    contact@maisonbaymora.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-playfair text-xl text-[#C8A96E] mb-4">Besoin d'aide rapide ?</h3>
              <p className="text-gray-400 text-sm mb-4">Maya peut répondre à la plupart de vos questions directement dans l'application.</p>
              <Link
                href="/maya"
                className="inline-block bg-white/10 border border-white/20 text-white px-5 py-3 rounded-lg hover:bg-white/15 transition-colors text-sm"
              >
                ✨ Parler à Maya
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
