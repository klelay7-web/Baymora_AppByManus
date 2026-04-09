import { Link } from "wouter";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-[#070B14] text-gray-300">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-[#C8A96E] font-playfair text-lg hover:opacity-80 transition-opacity">
          ← Maison Baymora
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-playfair text-4xl text-[#C8A96E] mb-2">Politique de confidentialité</h1>
        <p className="text-gray-500 mb-12">Conformément au Règlement Général sur la Protection des Données (RGPD)</p>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Données collectées</h2>
          <p className="text-gray-400 leading-relaxed mb-3">Maison Baymora collecte les données suivantes :</p>
          <ul className="list-disc list-inside space-y-2 text-gray-400 ml-4">
            <li>Prénom ou pseudo, adresse email</li>
            <li>Préférences de voyage (style, budget, destinations favorites)</li>
            <li>Historique des conversations avec Maya</li>
            <li>Dates importantes (anniversaires, avec votre consentement)</li>
            <li>Informations sur vos proches (prénoms, liens, avec votre consentement)</li>
            <li>Données de navigation (cookies analytics, opt-in)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Finalité du traitement</h2>
          <p className="text-gray-400 leading-relaxed">
            Les données collectées sont utilisées exclusivement pour personnaliser les recommandations de Maya, votre concierge IA. Elles ne sont jamais revendues à des tiers à des fins commerciales.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Base légale</h2>
          <p className="text-gray-400 leading-relaxed">
            Le traitement de vos données repose sur votre <strong className="text-white">consentement</strong> explicite lors de la création de votre compte et de la configuration de votre profil.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Durée de conservation</h2>
          <p className="text-gray-400 leading-relaxed">
            Vos données sont conservées pendant <strong className="text-white">3 ans</strong> après votre dernière activité sur la plateforme. En cas de suppression de compte, toutes vos données sont effacées dans un délai de 30 jours.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Sous-traitants</h2>
          <div className="space-y-3 text-gray-400">
            <div className="flex items-start gap-3">
              <span className="text-[#C8A96E] mt-0.5">•</span>
              <div>
                <span className="text-white">Anthropic (Claude IA)</span> — traitement des conversations pour générer les recommandations Maya
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#C8A96E] mt-0.5">•</span>
              <div>
                <span className="text-white">Stripe</span> — traitement sécurisé des paiements (aucune donnée bancaire stockée chez Baymora)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#C8A96E] mt-0.5">•</span>
              <div>
                <span className="text-white">Google Maps</span> — affichage des cartes et calcul d'itinéraires
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Vos droits</h2>
          <p className="text-gray-400 leading-relaxed mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { right: "Droit d'accès", desc: "Consulter toutes vos données" },
              { right: "Droit de rectification", desc: "Corriger vos informations" },
              { right: "Droit à l'effacement", desc: "Supprimer votre compte et données" },
              { right: "Droit à la portabilité", desc: "Exporter vos données" },
              { right: "Droit d'opposition", desc: "Refuser certains traitements" },
              { right: "Droit à la limitation", desc: "Restreindre l'utilisation" },
            ].map((item) => (
              <div key={item.right} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white font-medium text-sm mb-1">{item.right}</p>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Pseudonyme & anonymat</h2>
          <p className="text-gray-400 leading-relaxed">
            Vous pouvez utiliser un pseudonyme à la place de votre vrai prénom. La suppression totale de votre compte et de toutes vos données est possible à tout moment depuis votre profil.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Cookies</h2>
          <p className="text-gray-400 leading-relaxed">
            Nous utilisons des cookies de session (nécessaires au fonctionnement) et des cookies d'analyse (opt-in). Vous pouvez gérer vos préférences depuis les paramètres de votre navigateur.
          </p>
        </section>

        <div className="border-t border-white/10 pt-8 mt-12">
          <p className="text-gray-400 mb-2">
            <span className="text-white">DPO (Délégué à la Protection des Données) :</span>
          </p>
          <a href="mailto:privacy@maisonbaymora.com" className="text-[#C8A96E] hover:underline">
            privacy@maisonbaymora.com
          </a>
          <p className="text-gray-600 text-sm mt-4">
            Vous pouvez également adresser une réclamation à la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#C8A96E] hover:underline">
              CNIL
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
