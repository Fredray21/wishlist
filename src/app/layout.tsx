import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Bricolage_Grotesque, Fraunces, Inter } from "next/font/google";
import { getSiteConfig } from "@/lib/config";
import { autoTheme, themeBootScript } from "@/lib/themes";
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
  const initialTheme = autoTheme(new Date().getMonth() + 1, birthdayMonth);
  return (
    <html
      lang="fr"
      data-theme={initialTheme}
      className={`${inter.variable} ${fraunces.variable} ${bodoni.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(birthdayMonth) }} />
      </head>
      <body className="font-sans antialiased">
        <div aria-hidden className="decor decor-snow" />
        <div aria-hidden className="decor decor-confetti" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
