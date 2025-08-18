"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // 如果有用户，保存到数据库并检查订阅过期
      if (session?.user) {
        saveUserToDatabase(session.user);
        if (session.access_token) {
          checkSubscriptionExpiry(session.access_token);
        }
      }
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // 如果有用户，保存到数据库并检查订阅过期
      if (session?.user) {
        saveUserToDatabase(session.user);
        if (session.access_token) {
          checkSubscriptionExpiry(session.access_token);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSubscriptionExpiry = async (token: string) => {
    try {
      const response = await fetch('/api/subscription/check-expiry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription expiry check:', data);
      } else if (response.status === 401) {
        // 忽略401错误，这可能是因为token还未完全准备好
        console.log('Subscription check skipped - auth not ready');
      }
    } catch (error) {
      console.error('Error checking subscription expiry:', error);
    }
  };

  const saveUserToDatabase = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          provider: user.app_metadata?.provider || 'google',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error saving user to database:', error);
      }
    } catch (error) {
      console.error('Error in saveUserToDatabase:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // 先检查是否已经登录
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('User already logged in, redirecting to generator');
        window.location.href = '/generator';
        return;
      }

      // Always redirect to generator page after login
      const redirectPath = '/generator';

      // 登录后重定向到相应页面
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }

      // data.url 包含了重定向到Google的URL
      if (data?.url) {
        console.log('Redirecting to Google OAuth:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No OAuth URL returned from Supabase');
        throw new Error('Failed to get login link');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      // 显示用户友好的错误信息
      const errorMessage = error instanceof Error ? error.message : 'Login failed, please try again later';
      alert(errorMessage);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // 1. 尝试通过Supabase正常登出
      await supabase.auth.signOut().catch(e => console.log('Supabase signOut error:', e));
      
      // 2. 调用API清除服务端cookies
      await fetch('/api/auth/signout', { method: 'POST' }).catch(e => console.log('API signOut error:', e));
      
    } catch (error) {
      console.error('Sign out error (ignored):', error);
    } finally {
      // 3. 清除所有本地存储
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. 清除所有cookies（客户端能访问的）
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // 5. 强制刷新页面
      window.location.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}