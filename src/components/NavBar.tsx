"use client";

import { useAuth } from "@/contexts/AuthContext";
import AuthButton from "./AuthButton";
import UserMenu from "./UserMenu";
import LanguageToggle from "./LanguageToggle";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface NavBarProps {
  showHistory?: () => void;
}

export default function NavBar({ showHistory }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    checkUserSubscription();
  }, [user]);

  const checkUserSubscription = async () => {
    if (!user) {
      setHasSubscription(false);
      return;
    }

    try {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setHasSubscription(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasSubscription(false);
    }
  };

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: "🏠" },
    {
      href: "/generator",
      label: t("nav.generator"),
      icon: "✨",
      highlight: true,
    },
    { href: "/pricing", label: t("nav.pricing"), icon: "💎" },
    // { href: '/points-shop', label: t('nav.pointsShop'), icon: '🛍️' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/30 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border-b border-white/10"
            : "bg-black/20 dark:bg-gray-900/70 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl">
                    <span className="text-2xl">🎨</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-xl">
                    <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient bg-300%">
                      Qwen Image
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 dark:text-gray-400">
                    AI Art Generator
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                        link.highlight && !isActive
                          ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 dark:text-purple-300 hover:shadow-lg border border-purple-500/30"
                          : isActive
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "hover:bg-white/10 dark:hover:bg-gray-800 text-gray-200 dark:text-gray-300"
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                      {link.highlight && !isActive && (
                        <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-3">
                <LanguageToggle />

                {user ? (
                  <>
                    <Link
                      href={hasSubscription ? "/points-shop" : "/recharge"}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all hover:scale-105 flex items-center gap-1"
                    >
                      <span>{hasSubscription ? "💎" : "⚡"}</span>
                      <span>
                        {hasSubscription
                          ? t("nav.pointsShop")
                          : t("nav.subscribe")}
                      </span>
                    </Link>
                    <UserMenu />
                  </>
                ) : (
                  <AuthButton />
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            mobileMenuOpen
              ? "max-h-screen border-t border-gray-200 dark:border-gray-800"
              : "max-h-0"
          }`}
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl font-medium transition-all ${
                    link.highlight && !isActive
                      ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300"
                      : isActive
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                  {link.highlight && !isActive && (
                    <span className="ml-2 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
              <LanguageToggle />
              {user ? (
                <>
                  <Link
                    href={hasSubscription ? "/points-shop" : "/recharge"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium text-center"
                  >
                    {hasSubscription ? "💎" : "⚡"}{" "}
                    {hasSubscription ? t("nav.pointsShop") : t("nav.subscribe")}
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <AuthButton />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
}
