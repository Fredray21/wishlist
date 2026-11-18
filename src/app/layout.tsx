import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Bricolage_Grotesque, Fraunces, Inter } from "next/font/google";
import { getSiteConfig } from "@/lib/config";
import { autoTheme, currentMonth } from "@/lib/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", preload: false, style: ["normal", "italic"] });
const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni", display: "swap", preload: false, style: ["normal", "italic"] });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", preload: false });

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { ownerName } = getSiteConfig();
  return {
    title: `Wishlist de ${ownerName}`,
    description: `Les idées cadeaux de ${ownerName}. Réservez un cadeau en toute discrétion.`,
    robots: { index: false, follow: false, nocache: true },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { birthdayMonth } = getSiteConfig();
  const theme = autoTheme(currentMonth(), birthdayMonth);
  return (
    <html
      lang="fr"
      data-theme={theme}
      className={`${inter.variable} ${fraunces.variable} ${bodoni.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {theme !== "minimaliste" && (
          <div aria-hidden className={`decor ${theme === "noel" ? "decor-snow" : "decor-confetti"}`}>
            <i />
            <i />
          </div>
        )}
        <div id="app" className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
