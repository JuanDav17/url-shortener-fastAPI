import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CorLink | Acorta y comparte enlaces",
  description: "Acorta enlaces en segundos y compártelos fácilmente.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}