import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Bautizo y Cumpleaños de Sebastián León",
  description:
    "Invitación al bautizo y cumpleaños de Sebastián León. Sábado 5 de diciembre de 2026.",
  openGraph: {
    title: "Bautizo y Cumpleaños de Sebastián León",
    description:
      "Invitación al bautizo y cumpleaños de Sebastián León. Sábado 5 de diciembre de 2026.",
    images: ["/flyer.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className="bg-[#f2efe9]">{children}</body>
    </html>
  );
}
