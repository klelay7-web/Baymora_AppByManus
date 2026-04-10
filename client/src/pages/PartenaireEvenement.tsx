/**
 * PARTENAIRE ÉVÉNEMENT — Baymora V7.3
 *
 * Formulaire de soumission d'événement partenaire.
 * Route : /partenaires/evenement
 * Appelle trpc.events.create pour insérer en base.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, MapPin, Tag, DollarSign, ChevronLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  { value: "soiree", label: "Soirée" },
  { value: "concert", label: "Concert" },
  { value: "expo", label: "Exposition" },
  { value: "degustation", label: "Dégustation" },
  { value: "spectacle", label: "Spectacle" },
  { value: "festival", label: "Festival" },
  { value: "sport", label: "Sport" },
  { value: "diner_secret", label: "Dîner secret" },
  { value: "vip", label: "Événement VIP" },
  { value: "afterwork", label: "After-work" },
  { value: "brunch", label: "Brunch" },
  { value: "marche", label: "Marché" },
  { value: "autre", label: "Autre" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

interface FormState {
  title: string;
  description: string;
  category: Category;
  city: string;
  venueName: string;
  venueAddress: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  price: string;
  bookingUrl: string;
  isVip: boolean;
  isMembersOnly: boolean;
  contactEmail: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  category: "soiree",
  city: "",
  venueName: "",
  venueAddress: "",
  date: "",
  timeStart: "",
  timeEnd: "",
  price: "",
  bookingUrl: "",
  isVip: false,
  isMembersOnly: false,
  contactEmail: "",
};

export default function PartenaireEvenement() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Événement soumis avec succès !");
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
    },
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.city || !form.date || !form.category) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }
    createEvent.mutate({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      city: form.city,
      venueName: form.venueName || undefined,
      venueAddress: form.venueAddress || undefined,
      date: form.date,
      timeStart: form.timeStart || undefined,
      timeEnd: form.timeEnd || undefined,
      price: form.price || undefined,
      bookingUrl: form.bookingUrl || undefined,
      isVip: form.isVip,
      isMembersOnly: form.isMembersOnly,
    });
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200,169,110,0.2)",
    borderRadius: 12,
    color: "#F0EDE6",
    padding: "10px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "#8B8D94",
    fontSize: 12,
    marginBottom: 6,
    display: "block",
  };

  if (submitted) {
    return (
      <div style={{ background: "#070B14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <CheckCircle size={56} style={{ color: "#C8A96E" }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#F0EDE6" }}>
            Événement soumis
          </h1>
          <p className="text-sm mb-6" style={{ color: "#8B8D94" }}>
            Votre événement a été transmis à l'équipe Maison Baymora. Nous le validerons sous 24h et vous contacterons à l'adresse fournie.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setForm(INITIAL_FORM); setSubmitted(false); }}
              className="px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #C8A96E, #E8D5A8)", color: "#070B14" }}
            >
              Soumettre un autre événement
            </button>
            <Link href="/maison">
              <button className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#F0EDE6", border: "1px solid rgba(200,169,110,0.2)" }}>
                Retour à la Maison
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#070B14", minHeight: "100vh", color: "#F0EDE6" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(200,169,110,0.1)", padding: "16px 24px" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/maison">
            <button className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <ChevronLeft size={18} style={{ color: "#C8A96E" }} />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Soumettre un événement
            </h1>
            <p className="text-xs" style={{ color: "#8B8D94" }}>Espace partenaires Maison Baymora</p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4" style={{ paddingTop: 32, paddingBottom: 64 }}>

        {/* Informations principales */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} style={{ color: "#C8A96E" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#F0EDE6" }}>Informations principales</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Titre de l'événement *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex : Soirée Jazz & Tapas au Petit Commerce"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez votre événement en quelques phrases..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Catégorie *</label>
                <select name="category" value={form.category} onChange={handleChange} required style={inputStyle}>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value} style={{ background: "#0D1117" }}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ville *</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ex : Bordeaux"
                  required
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lieu */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} style={{ color: "#C8A96E" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#F0EDE6" }}>Lieu</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Nom du lieu</label>
              <input
                name="venueName"
                value={form.venueName}
                onChange={handleChange}
                placeholder="Ex : Le Petit Commerce"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Adresse complète</label>
              <input
                name="venueAddress"
                value={form.venueAddress}
                onChange={handleChange}
                placeholder="Ex : 22 Rue Parlement Saint-Pierre, 33000 Bordeaux"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Date & Horaires */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} style={{ color: "#C8A96E" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#F0EDE6" }}>Date & Horaires</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 md:col-span-1">
              <label style={labelStyle}>Date *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Début</label>
              <input
                name="timeStart"
                type="time"
                value={form.timeStart}
                onChange={handleChange}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Fin</label>
              <input
                name="timeEnd"
                type="time"
                value={form.timeEnd}
                onChange={handleChange}
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>
        </div>

        {/* Tarif & Réservation */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} style={{ color: "#C8A96E" }} />
            <h2 className="font-semibold text-sm" style={{ color: "#F0EDE6" }}>Tarif & Réservation</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Prix</label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Ex : 45€ ou Entrée libre"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Lien de réservation</label>
              <input
                name="bookingUrl"
                type="url"
                value={form.bookingUrl}
                onChange={handleChange}
                placeholder="https://..."
                style={inputStyle}
              />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isVip"
                  checked={form.isVip}
                  onChange={handleChange}
                  style={{ accentColor: "#C8A96E" }}
                />
                <span className="text-sm" style={{ color: "#F0EDE6" }}>Événement VIP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isMembersOnly"
                  checked={form.isMembersOnly}
                  onChange={handleChange}
                  style={{ accentColor: "#C8A96E" }}
                />
                <span className="text-sm" style={{ color: "#F0EDE6" }}>Membres uniquement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)" }}>
          <div className="mb-4">
            <h2 className="font-semibold text-sm" style={{ color: "#F0EDE6" }}>Contact partenaire</h2>
            <p className="text-xs mt-1" style={{ color: "#8B8D94" }}>Pour que l'équipe Baymora puisse vous contacter en cas de besoin.</p>
          </div>
          <div>
            <label style={labelStyle}>Email de contact</label>
            <input
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChange}
              placeholder="contact@votreestablissement.com"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={createEvent.isPending}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold"
          style={{
            background: createEvent.isPending
              ? "rgba(200,169,110,0.4)"
              : "linear-gradient(135deg, #C8A96E, #E8D5A8)",
            color: "#070B14",
            cursor: createEvent.isPending ? "not-allowed" : "pointer",
          }}
        >
          {createEvent.isPending ? "Soumission en cours..." : "Soumettre l'événement"}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "#8B8D94" }}>
          En soumettant, vous acceptez que Maison Baymora publie cet événement après validation éditoriale.
        </p>
      </form>
    </div>
  );
}
