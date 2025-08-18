'use client';

import AnimatedBackground from './AnimatedBackground';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen">
      {/* 动态背景 */}
      <AnimatedBackground />
      
      {/* 页面内容 */}
      <div className={`relative z-10 ${className}`}>
        {children}
      </div>
    </div>
  );
}