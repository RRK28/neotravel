import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoTravel — Location d'autocar avec chauffeur",
  description:
    "Courtier en transport autocar depuis 2010. Devis gratuit sous 24 h pour vos déplacements de groupe en France et en Belgique.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
