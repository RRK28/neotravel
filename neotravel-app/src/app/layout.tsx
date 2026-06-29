import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoTravel — Devis transport autocar",
  description:
    "Plateforme de devis transport autocar automatisée — Groupe 16, Epitech 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
