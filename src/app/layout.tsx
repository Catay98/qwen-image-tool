import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIQwen Image Generator - Independent AI Art Creation Platform",
  description: "AIQwen is an independent AI image generation service. Not affiliated with Alibaba or Tongyi Qianwen. Create stunning art with our AI technology. Safe and secure payment via Stripe.",
  keywords: "AI image generator, AI art creator, independent AI service, image generation platform",
  openGraph: {
    title: "AIQwen - Independent AI Image Generator",
    description: "Independent AI art generation platform. Not affiliated with any other companies. Secure payments via Stripe.",
    siteName: "AIQwen Image Generator",
  },
  twitter: {
    title: "AIQwen - Independent AI Image Generator",
    description: "Create AI art on our independent platform. Safe and secure.",
    card: "summary_large_image",
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased notranslate min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/50 to-blue-900/50`}
        translate="no"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
