"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/hooks/useSubscription";
import { addWatermark } from "@/lib/watermark";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Image from "next/image";

// 动态导入模态框组件
const SubscriptionModal = dynamic(() => import("@/components/SubscriptionModal"));
const ShareModal = dynamic(() => import("@/components/ShareModal"));
const Footer = dynamic(() => import("@/components/Footer"));

interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

export default function GeneratorPageContent() {
  const { t } = useTranslation();
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const { canUseAPI, recordUsage } = useSubscription();
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [freeUsesRemaining, setFreeUsesRemaining] = useState<number | null>(null);
  const [isFreeTier, setIsFreeTier] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Only show login modal if not loading and no user
    if (!loading && !user) {
      setShowLoginModal(true);
    } else if (user) {
      setShowLoginModal(false);
    }
  }, [user, loading]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("imageHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    fetchUserStatus();
  }, [user]);

  const fetchUserStatus = async () => {
    if (!user) {
      setFreeUsesRemaining(10);
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("user_usage")
        .select("free_uses_remaining")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (usage) {
        setFreeUsesRemaining(usage.free_uses_remaining || 0);
      } else {
        setFreeUsesRemaining(10);
      }

      const { data: points } = await supabase
        .from("user_points")
        .select("available_points")
        .eq("user_id", user.id)
        .single();

      if (points) {
        setUserPoints(points.available_points || 0);
      }

      // Check subscription status
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();
      
      setHasSubscription(!!subscription);
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  const saveToHistory = async (prompt: string, imageUrl: string) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}_${Math.random()}`,
      prompt,
      imageUrl,
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));

    try {
      let userId = user?.id;
      if (!userId) {
        userId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );
      }

      const { error } = await supabase.from("image_history").insert({
        user_id: userId,
        prompt: prompt,
        image_url: imageUrl,
      });

      if (error) {
        console.error("Error saving to database:", error);
      }
    } catch (error) {
      console.error("Error saving history to database:", error);
    }
  };

  const generateImage = async () => {
    if (!user) {
      setError(t('errors.loginRequired'));
      setShowLoginModal(true);
      return;
    }

    if (!prompt.trim()) {
      setError(t('errors.enterDescription'));
      return;
    }

    setIsLoading(true);
    setError("");
    setImageUrl("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/generate-image-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({
          prompt,
          userId: user?.id,
          aspectRatio: "1:1",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needSubscription) {
          setShowSubscriptionModal(true);
          setError(t('errors.freeUsesExhausted'));
        } else {
          setError(data.error || t('errors.generationFailed'));
        }
        return;
      }

      if (data.freeUsesRemaining !== null && data.freeUsesRemaining !== undefined) {
        setFreeUsesRemaining(data.freeUsesRemaining);
      }

      fetchUserStatus();

      let finalImageUrl = data.imageUrl;
      if (data.isFreeTier && data.watermark) {
        setIsFreeTier(true);
        try {
          finalImageUrl = await addWatermark(data.imageUrl, data.watermark);
        } catch (watermarkError) {
          console.error("Failed to add watermark:", watermarkError);
          finalImageUrl = data.imageUrl;
        }
      } else {
        setIsFreeTier(false);
      }

      setImageUrl(finalImageUrl);
      saveToHistory(prompt, finalImageUrl);
    } catch (err) {
      setError(t('errors.generationFailed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('generator.pageTitle')}</title>
        <meta name="description" content={t('generator.subtitle')} />
      </Head>

      <main className="min-h-screen">
        <NavBar />

        {/* Status Bar */}
        {user && (
          <div className="bg-white/10 dark:bg-gray-900/50 backdrop-blur-sm border-b border-white/20 dark:border-gray-800">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">✨</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 dark:text-gray-400">Welcome back</p>
                      <p className="font-semibold text-white dark:text-white">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">🎫</span>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.freeUses')}</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{freeUsesRemaining || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400">💎</span>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.points')}</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{userPoints || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Show different buttons based on subscription status */}
                  {hasSubscription ? (
                    // If has subscription, show points purchase button
                    <button
                      onClick={() => router.push('/points-shop')}
                      className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
                    >
                      💎 {t('nav.pointsShop')}
                    </button>
                  ) : (
                    // If no subscription, show subscription button
                    <button
                      onClick={() => router.push('/pricing')}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
                    >
                      ⚡ {t('nav.subscribe')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generator Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                {t('generator.title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t('generator.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-300 mb-3">
                    {t('generator.imageDescription')}
                  </label>
                  <textarea
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400"
                    rows={6}
                    placeholder={t('generator.placeholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey && !isLoading) {
                        generateImage();
                      }
                    }}
                  />
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {t('generator.quickTip')}
                  </div>

                  {/* Generate Button */}
                  <button
                    className={`w-full mt-6 py-4 px-6 rounded-2xl font-semibold transition-all transform hover:scale-105 ${
                      isLoading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-2xl"
                    }`}
                    onClick={generateImage}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('generator.generating')}
                      </span>
                    ) : (
                      `🎨 ${t('generator.generateButton')}`
                    )}
                  </button>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
                      {error}
                    </div>
                  )}
                </div>

                {/* History Toggle */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full px-6 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>📚</span>
                  <span>{t('nav.history')}</span>
                  <span className="text-sm text-gray-500">({history.length})</span>
                </button>
              </div>

              {/* Result Section */}
              <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 text-white dark:text-white">
                  {t('generator.generatedResult')}
                </h3>
                {isLoading ? (
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-6 text-gray-700 dark:text-gray-300 font-medium">
                      {t('generator.generatingMessage')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {t('generator.estimatedTime')}
                    </p>
                  </div>
                ) : imageUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Generated: ${prompt}`}
                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          setError(t('errors.imageLoadFailed'));
                        }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = imageUrl;
                          link.download = `qwen-image-${Date.now()}.png`;
                          link.target = "_blank";
                          link.click();
                        }}
                      >
                        💾 {t('generator.download')}
                      </button>
                      <button
                        className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
                        onClick={() => setShowShareModal(true)}
                      >
                        🔗 {t('generator.share')}
                      </button>
                    </div>
                    <button
                      className="w-full py-3 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                      onClick={() => {
                        setImageUrl("");
                        setPrompt("");
                      }}
                    >
                      🔄 {t('generator.generateNew')}
                    </button>
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🎨</span>
                      <p className="text-gray-400">{t('generator.yourArtwork')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History Section */}
            {showHistory && history.length > 0 && (
              <div className="mt-8 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-2xl text-white dark:text-white">
                    {t('history.title')}
                  </h3>
                  <button
                    className="text-red-600 hover:text-red-700 font-medium"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("imageHistory");
                    }}
                  >
                    {t('history.clear')}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group cursor-pointer transform transition-all hover:scale-105"
                      onClick={() => {
                        setPrompt(item.prompt);
                        setImageUrl(item.imageUrl);
                        setShowHistory(false);
                      }}
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-2">
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                      <p className="text-xs text-gray-200 dark:text-gray-300 font-medium truncate">
                        {item.prompt}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>

      {/* Modals */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribe={() => {
          setShowSubscriptionModal(false);
          generateImage();
        }}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={imageUrl}
        shareText={`${t('share.shareText')} ${prompt}`}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t('nav.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {t('errors.loginRequired')}
              </p>
              <button
                onClick={async () => {
                  try {
                    setShowLoginModal(false);
                    await signInWithGoogle();
                  } catch (error) {
                    console.error("Login error:", error);
                    setShowLoginModal(true);
                  }
                }}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all transform hover:scale-105 shadow-sm mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t('nav.loginWithGoogle')}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push('/');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}