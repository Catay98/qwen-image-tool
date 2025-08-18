"use client";

import { useEffect, useRef } from 'react';

interface TranslationWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function TranslationWrapper({ children, className = '' }: TranslationWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Add attributes to prevent translation
      ref.current.setAttribute('translate', 'no');
      ref.current.classList.add('notranslate');
      
      // Add Google-specific attribute
      const meta = document.createElement('meta');
      meta.name = 'google';
      meta.content = 'notranslate';
      if (!document.querySelector('meta[name="google"][content="notranslate"]')) {
        document.head.appendChild(meta);
      }
      
      // Prevent translation plugin from modifying children
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                if (element.tagName === 'FONT' || element.classList?.contains('skiptranslate')) {
                  // Translation plugin detected, prevent modification
                  mutation.target.replaceChild(mutation.removedNodes[0], node);
                }
              }
            });
          }
        });
      });

      // Only observe if browser translation might be active
      if (navigator.language !== 'zh-CN' && navigator.language !== 'en-US') {
        observer.observe(ref.current, {
          childList: true,
          subtree: true,
        });
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return (
    <div ref={ref} className={`notranslate ${className}`} translate="no">
      {children}
    </div>
  );
}