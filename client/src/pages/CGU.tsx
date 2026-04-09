import { Link } from "wouter";

export default function CGU() {
  return (
    <div className="min-h-screen bg-[#070B14] text-gray-300">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-[#C8A96E] font-playfair text-lg hover:opacity-80 transition-opacity">
          ← Maison Baymora
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-playfair text-4xl text-[#C8A96E] mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-gray-500 mb-12">Dernière mise à jour : avril 2026</p>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 1 — Objet du service</h2>
          <p className="text-gray-400 leading-relaxed">
            Maison Baymora est un service de recommandations premium. Elle met à disposition de ses membres Maya, l'accès exclusif qui connaît les meilleures adresses du monde. Maya crée des parcours sur-mesure, recommande des établissements d'exception et organise des expériences exclusives.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 2 — Inscription</h2>
          <p className="text-gray-400 leading-relaxed">
            L'inscription est gratuite et s'effectue via Manus OAuth. Le membre s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants de connexion.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 3 — Adhésions</h2>
          <div className="space-y-4">
            {[
              { name: "Invité", price: "Gratuit", desc: "3 conversations avec Maya, accès aux adresses publiques, aperçu des privilèges" },
              { name: "Membre", price: "9,90€/mois ou 99€/an", desc: "Maya illimitée, parcours & cartes illimités, privilèges partenaires, feed local Ma position, Mode Business" },
              { name: "Duo", price: "14,90€/mois ou 149€/an", desc: "Tout Membre pour 2 profils, parcours en commun, préférences croisées" },
              { name: "Le Cercle", price: "149€/an — Fondateur à vie", desc: "Tout Membre + Maya mode Prestige, Le Secret du Jour, événements privés, 2 invitations/mois, Badge Fondateur (500 premières places)" },
            ].map((plan) => (
              <div key={plan.name} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-medium">{plan.name}</span>
                  <span className="text-[#C8A96E] font-semibold">{plan.price}</span>
                </div>
                <p className="text-gray-500 text-sm">{plan.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 4 — Annulation et remboursement</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            L'annulation d'un abonnement est possible à tout moment depuis la section "Gérer mon abonnement" du profil. L'annulation prend effet à la fin de la période de facturation en cours.
          </p>
          <p className="text-gray-400 leading-relaxed font-medium">
            Aucun remboursement ne sera effectué pour la période en cours.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 5 — Responsabilité</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            Maya fournit des recommandations à titre indicatif. Maison Baymora ne peut être tenu responsable des décisions prises sur la base de ces recommandations.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Les réservations sont effectuées via des partenaires tiers (Booking.com, Trainline, etc.). Maison Baymora n'est pas partie au contrat conclu entre l'utilisateur et ces partenaires.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 6 — Propriété intellectuelle</h2>
          <p className="text-gray-400 leading-relaxed">
            Tout le contenu de l'application (textes, design, algorithmes, base de données d'établissements) est la propriété exclusive de Maison Baymora. Toute reproduction ou utilisation non autorisée est strictement interdite.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Article 7 — Loi applicable</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, le tribunal compétent sera celui du ressort du siège social de Maison Baymora.
          </p>
        </section>

        <div className="border-t border-white/10 pt-8 mt-12">
          <p className="text-gray-600 text-sm">
            Pour toute question relative aux CGU :{" "}
            <a href="mailto:contact@maisonbaymora.com" className="text-[#C8A96E] hover:underline">
              contact@maisonbaymora.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
