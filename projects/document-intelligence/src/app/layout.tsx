import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Document Intelligence",
  description: "Ask questions about your files and inspect the source passages.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await cookies()).get("document_intelligence_locale")?.value === "en" ? "en" : "es";
  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('di-theme');if(t!=='light')t='dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark')}catch(e){document.documentElement.classList.add('dark')}})()` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
