/**
 * ─── Maison Baymora — Admin Email Center ─────────────────────────────────────
 * Redirige vers la section email de la page Pilotage
 */
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminEmailCenter() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/pilotage");
  }, []);
  return null;
}
