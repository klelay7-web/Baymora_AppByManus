import { Link } from "wouter";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#070B14] text-gray-300">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <Link href="/" className="text-[#C8A96E] font-playfair text-lg hover:opacity-80 transition-opacity">
          ← Maison Baymora
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-playfair text-4xl text-[#C8A96E] mb-2">Mentions légales</h1>
        <p className="text-gray-500 mb-12">Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004</p>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Éditeur du site</h2>
          <div className="space-y-2 text-gray-400">
            <p><span className="text-white">Raison sociale :</span> Maison Baymora</p>
            <p><span className="text-white">Adresse :</span> [adresse à compléter]</p>
            <p><span className="text-white">Directeur de la publication :</span> Kevin [nom à compléter]</p>
            <p><span className="text-white">Email :</span> contact@maisonbaymora.com</p>
            <p><span className="text-white">SIRET :</span> [à compléter]</p>
            <p><span className="text-white">Numéro CNIL :</span> [à compléter]</p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Hébergement</h2>
          <div className="space-y-2 text-gray-400">
            <p><span className="text-white">Hébergeur :</span> Manus / Vercel</p>
            <p><span className="text-white">Site :</span> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#C8A96E] hover:underline">vercel.com</a></p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Propriété intellectuelle</h2>
          <p className="text-gray-400 leading-relaxed">
            L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, sons, logiciels...) est la propriété exclusive de Maison Baymora, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            Toute reproduction, distribution, modification, adaptation, retransmission ou publication, même partielle, de ces différents éléments est strictement interdite sans l'accord exprès par écrit de Maison Baymora.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Limitation de responsabilité</h2>
          <p className="text-gray-400 leading-relaxed">
            Maison Baymora ne pourra être tenu responsable des dommages directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications techniques requises, soit de l'apparition d'un bug ou d'une incompatibilité.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Cookies</h2>
          <p className="text-gray-400 leading-relaxed">
            Le site utilise des cookies de session nécessaires au fonctionnement du service d'authentification, ainsi que des cookies d'analyse (opt-in) pour améliorer l'expérience utilisateur. Vous pouvez configurer votre navigateur pour refuser les cookies.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-playfair text-2xl text-[#C8A96E] mb-4">Droit applicable</h2>
          <p className="text-gray-400 leading-relaxed">
            Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>

        <div className="border-t border-white/10 pt-8 mt-12">
          <p className="text-gray-600 text-sm">
            Pour toute question :{" "}
            <a href="mailto:contact@maisonbaymora.com" className="text-[#C8A96E] hover:underline">
              contact@maisonbaymora.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
