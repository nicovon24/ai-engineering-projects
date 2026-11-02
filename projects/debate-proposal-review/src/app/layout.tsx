import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debate & Proposal Review",
  description: "An inspectable, human-led proposal review prototype.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
