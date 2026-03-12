import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

const sansFont = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Trazabilidad de Expedientes",
  description: "Subsistema de trazabilidad física de expedientes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body className={`${sansFont.variable} ${monoFont.variable}`}>
        <div className="layout-wrapper">
          {user && <Sidebar user={user} />}
          {children}
        </div>
      </body>
    </html>
  );
}

