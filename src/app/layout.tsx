import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "AMCE - Votaciones",
  description:
    "Votaciones proximo presidente de AMCE - Asociación Mexicana De Cirugía Endoscopica",
  icons: [{ rel: "icon", url: "/icon.png" }],
  openGraph: {
    title: "AMCE - Votaciones",
    description:
      "Votaciones proximo presidente de AMCE - Asociación Mexicana De Cirugía Endoscopica",
    url: "https://amce.org.mx",
    type: "website",
    images: [
      {
        url: "https://amce.org.mx/icon.png",
        width: 266,
        height: 280,
        alt: "AMCE - Votaciones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AMCE - Votaciones",
    description:
      "Votaciones proximo presidente de AMCE - Asociación Mexicana De Cirugía Endoscopica",
    images: ["https://amce.org.mx/icon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
