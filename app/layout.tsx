import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Lead Finder | Vind je volgende klant",
  description: "Vind lokale bedrijven met digitale groeikansen. Zoek, score en exporteer B2B-leads.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
