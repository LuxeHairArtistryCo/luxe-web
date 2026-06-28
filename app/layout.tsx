import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCachedSiteSettings } from '@/lib/sanity'
import { SiteSettings } from "@/lib/types";
import { urlFor } from "@/lib/image";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings: SiteSettings = await getCachedSiteSettings();
  return {
    title: settings.companyName ?? "[Company Name]",
    description: settings.seoDescription ?? "",
    icons: settings.favicon
      ? { icon: urlFor(settings.favicon).width(32).height(32).url() }
      : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCachedSiteSettings();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col">
        {settings.announcementBanner && (
          <div className="bg-primary text-light text-center text-sm py-2 px-4">
            {settings.announcementBanner}
          </div>
        )}
        <Header settings={settings} />
        <main className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}