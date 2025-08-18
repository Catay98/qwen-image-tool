"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AuthButton() {
  const { t } = useTranslation();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // 防止重复点击
    if (isAuthLoading) return;
    
    // 如果已经登录，直接跳转
    if (user) {
      window.location.href = '/generator';
      return;
    }
    
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
      // 注意：由于会重定向到Google，loading状态会自动重置
    } catch (error) {
      console.error("Sign in failed:", error);
      // 错误已经在signInWithGoogle中处理了
    } finally {
      // 设置一个短暂的延迟后重置状态，防止快速重复点击
      setTimeout(() => setIsAuthLoading(false), 2000);
    }
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      alert(t('errors.signOutFailed', 'Sign out failed, please try again'));
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
        <span className="text-sm text-gray-600">{t('common.loading', 'Loading...')}</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="User avatar"
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700">
            {user.user_metadata?.full_name || user.email?.split("@")[0]}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isAuthLoading}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {isAuthLoading ? t('nav.loggingOut', 'Logging out...') : t('nav.logout', 'Logout')}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isAuthLoading}
      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {isAuthLoading ? t('nav.loggingIn', 'Logging in...') : t('nav.login', 'Login')}
    </button>
  );
}
