import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Cinzel, Jost } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./workspace.css";
import SmoothScroll from "./motion/SmoothScroll";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { PortalAuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClerkProvider } from "@clerk/nextjs";

const serif = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const logoFont = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-logo",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lunetty — L'optique, autrement",
    template: "%s · Lunetty",
  },
  description:
    "Lunetty réunit montures, verres et opticiens dans une expérience d'optique moderne : collections sélectionnées, conseil expert et boutiques partenaires.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Lunetty",
    title: "Lunetty — L'optique, autrement",
    description:
      "Collections de lunettes sélectionnées, conseil d'opticiens et boutiques partenaires.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f5f0e7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${serif.variable} ${sans.variable} ${jost.variable} ${logoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AuthProvider>
            <ThemeProvider>
              <FavoritesProvider>
                <PortalAuthProvider>
                  <SmoothScroll />
                  <Suspense fallback={null}>
                    <Header />
                  </Suspense>
                  <main id="contenu" className="flex-1">
                    {children}
                  </main>
                  <Suspense fallback={null}>
                    <Footer />
                  </Suspense>
                </PortalAuthProvider>
              </FavoritesProvider>
            </ThemeProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
