'use client';

import { ThemeProvider } from "@/components/ThemeProvider";
import I18nProvider from "@/components/I18nProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import CookieConsent from "@/components/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}