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
  title: "Qwen Image - AI Image Generator | Qwen Image AI Art Creator | Qwen Image",
  description: "Qwen Image is the leading AI image generator. Create stunning art with Qwen Image AI technology. Transform text to images instantly with Qwen Image. Try Qwen Image free - no registration required. Join millions using Qwen Image for AI art generation.",
  keywords: "Qwen Image, Qwen Image AI, Qwen Image generator, Qwen Image art, AI image generator, Qwen Image creator, Qwen Image technology, Qwen Image platform",
  openGraph: {
    title: "Qwen Image - Revolutionary AI Image Generator",
    description: "Create stunning images with Qwen Image AI. The most advanced Qwen Image technology for AI art generation.",
    siteName: "Qwen Image",
  },
  twitter: {
    title: "Qwen Image - AI Image Generator",
    description: "Transform your ideas into art with Qwen Image AI. Try Qwen Image free today!",
    card: "summary_large_image",
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
