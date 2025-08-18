// Cookie and Script Management Utility
// This module handles blocking and allowing cookies and scripts based on user consent

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

// Extended window interface for tracking scripts
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: Function;
    ga?: Function;
    _gaq?: any[];
    fbq?: Function;
    hj?: Function;
    clarity?: Function;
    analytics?: any;
    _linkedin_data_partner_ids?: any[];
    twq?: Function;
    ttq?: Function;
    criteo_q?: any[];
    google_trackConversion?: Function;
    [key: string]: any;
  }
}

class CookieManager {
  private static instance: CookieManager | null = null;
  private blockedScripts: Set<string> = new Set();
  private preferences: ConsentPreferences | null = null;
  private initialized = false;

  // Comprehensive list of tracking domains
  private readonly TRACKING_DOMAINS = {
    analytics: [
      'google-analytics.com',
      'googletagmanager.com',
      'google.com/analytics',
      'hotjar.com',
      'clarity.ms',
      'segment.com',
      'segment.io',
      'mixpanel.com',
      'amplitude.com',
      'heap.io',
      'fullstory.com',
      'plausible.io',
      'matomo.org',
      'piwik.org',
      'mouseflow.com',
      'luckyorange.com',
      'crazyegg.com',
      'inspectlet.com'
    ],
    marketing: [
      'doubleclick.net',
      'googlesyndication.com',
      'googleadservices.com',
      'googleads.g.doubleclick.net',
      'facebook.com/tr',
      'connect.facebook.net',
      'facebook.com/en_US/fbevents.js',
      'criteo.com',
      'criteo.net',
      'adsrvr.org',
      'amazon-adsystem.com',
      'bing.com/bat',
      'bat.bing.com',
      'linkedin.com/px',
      'px.ads.linkedin.com',
      'twitter.com/i/adsct',
      'static.ads-twitter.com',
      'analytics.twitter.com',
      'tiktok.com/i18n/pixel',
      'analytics.tiktok.com',
      'pinterest.com/v3',
      'ct.pinterest.com',
      'snapchat.com/tr',
      'sc-static.net',
      'reddit.com/px',
      'redditstatic.com',
      'taboola.com',
      'outbrain.com'
    ],
    social: [
      'platform.twitter.com',
      'platform.instagram.com',
      'connect.facebook.net/en_US/sdk.js',
      'platform.linkedin.com',
      'assets.pinterest.com',
      'widgets.pinterest.com',
      'platform.tumblr.com',
      'platform.reddit.com',
      'tiktok.com/embed.js'
    ]
  };

  private constructor() {
    // Initialize only on client side
    if (typeof window !== 'undefined') {
      // Temporarily disable to avoid conflicts
      // this.initializeBlocking();
    }
  }

  public static getInstance(): CookieManager {
    if (typeof window === 'undefined') {
      // Return a dummy instance for SSR
      return {
        updatePreferences: () => {},
        getAllCookies: () => [],
        testBlocking: () => ({ blocked: [], allowed: [] })
      } as any;
    }

    if (!CookieManager.instance) {
      CookieManager.instance = new CookieManager();
    }
    return CookieManager.instance;
  }

  private initializeBlocking() {
    if (this.initialized) return;
    this.initialized = true;

    // Override XMLHttpRequest to block tracking requests
    if (typeof XMLHttpRequest !== 'undefined') {
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
        const manager = CookieManager.getInstance();
        if (manager.shouldBlockRequest && manager.shouldBlockRequest(url)) {
          console.warn(`[Cookie Manager] Blocked XHR request to: ${url}`);
          throw new Error('Request blocked by cookie consent policy');
        }
        return originalOpen.apply(this, [method, url, ...args]);
      };
    }

    // Override fetch to block tracking requests
    if (typeof window.fetch !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const manager = CookieManager.getInstance();
        if (manager.shouldBlockRequest && manager.shouldBlockRequest(url)) {
          console.warn(`[Cookie Manager] Blocked fetch request to: ${url}`);
          return Promise.reject(new Error('Request blocked by cookie consent policy'));
        }
        return originalFetch.apply(window, [input, init]);
      };
    }

    // Override Image constructor to block tracking pixels
    if (typeof window.Image !== 'undefined') {
      const OriginalImage = window.Image;
      window.Image = class extends OriginalImage {
        set src(value: string) {
          const manager = CookieManager.getInstance();
          if (manager.shouldBlockRequest && manager.shouldBlockRequest(value)) {
            console.warn(`[Cookie Manager] Blocked tracking pixel: ${value}`);
            return;
          }
          super.src = value;
        }
        
        get src() {
          return super.src;
        }
      };
    }

    // Monitor and block dynamic script injection
    this.observeScriptInjection();
  }

  private observeScriptInjection() {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Check script tags
            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              if (src && this.shouldBlockRequest(src)) {
                console.warn(`[Cookie Manager] Blocking script: ${src}`);
                // Instead of removing, prevent execution
                element.setAttribute('type', 'text/plain');
                element.setAttribute('data-blocked', 'true');
              }
            }
            
            // Check iframes (social media embeds, etc.)
            if (element.tagName === 'IFRAME') {
              const src = element.getAttribute('src');
              if (src && this.shouldBlockRequest(src)) {
                console.warn(`[Cookie Manager] Blocking iframe: ${src}`);
                // Instead of removing, replace src
                element.setAttribute('data-original-src', src);
                element.setAttribute('src', 'about:blank');
              }
            }
            
            // Check for scripts within added elements
            try {
              element.querySelectorAll('script').forEach((script) => {
                const src = script.getAttribute('src');
                if (src && this.shouldBlockRequest(src)) {
                  console.warn(`[Cookie Manager] Blocking nested script: ${src}`);
                  script.setAttribute('type', 'text/plain');
                  script.setAttribute('data-blocked', 'true');
                }
              });
            } catch (e) {
              // Ignore errors from React's internal elements
            }
          }
        });
      });
    });

    // Start observing when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        }
      });
    } else if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  public updatePreferences(preferences: ConsentPreferences) {
    this.preferences = preferences;
    
    if (!preferences.analytics) {
      this.blockAnalytics();
    }
    
    if (!preferences.marketing) {
      this.blockMarketing();
    }
    
    if (!preferences.functional) {
      this.blockFunctional();
    }
  }

  private shouldBlockRequest(url: string): boolean {
    if (!this.preferences) {
      // Load preferences from localStorage
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('cookieConsent');
        if (stored) {
          this.preferences = JSON.parse(stored);
        } else {
          // Default to blocking everything except necessary
          this.preferences = {
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false
          };
        }
      } else {
        return false; // Can't determine preferences on server
      }
    }

    // Check if URL matches any blocked domains
    if (!this.preferences.analytics) {
      if (this.TRACKING_DOMAINS.analytics.some(domain => url.includes(domain))) {
        return true;
      }
    }

    if (!this.preferences.marketing) {
      if (this.TRACKING_DOMAINS.marketing.some(domain => url.includes(domain))) {
        return true;
      }
    }

    if (!this.preferences.functional) {
      if (this.TRACKING_DOMAINS.social.some(domain => url.includes(domain))) {
        return true;
      }
    }

    return false;
  }

  private blockAnalytics() {
    if (typeof window === 'undefined') return;

    // Google Analytics
    window['ga-disable-GA_MEASUREMENT_ID'] = true;
    window.ga = () => {};
    window.gtag = () => {};
    window.dataLayer = [];
    
    // Google Analytics Legacy
    window._gaq = [];
    
    // Hotjar
    window.hj = () => {};
    
    // Microsoft Clarity
    window.clarity = () => {};
    
    // Segment
    window.analytics = {
      track: () => {},
      page: () => {},
      identify: () => {},
      group: () => {},
      ready: () => {},
      alias: () => {},
      debug: () => {},
      on: () => {},
      off: () => {},
      trackLink: () => {},
      trackForm: () => {},
      pageview: () => {},
      reset: () => {}
    };

    this.clearAnalyticsCookies();
  }

  private blockMarketing() {
    if (typeof window === 'undefined') return;

    // Facebook Pixel
    window.fbq = () => {};
    
    // Google Ads
    window.google_trackConversion = () => {};
    
    // LinkedIn
    window._linkedin_data_partner_ids = [];
    
    // Twitter
    window.twq = () => {};
    
    // TikTok
    window.ttq = () => {};
    
    // Criteo
    window.criteo_q = [];

    this.clearMarketingCookies();
  }

  private blockFunctional() {
    // Block non-essential functional features
    this.clearFunctionalCookies();
  }

  private clearAnalyticsCookies() {
    if (typeof document === 'undefined') return;

    const analyticsCookies = [
      '_ga', '_gid', '_gat', '_gat_.*',
      '_gali', '_gcl_au', '_gcl_aw', '_gcl_dc',
      'hjid', 'hjAbsoluteSessionInProgress',
      '_clck', '_clsk',
      '__hssc', '__hssrc', '__hstc', 'hubspotutk'
    ];

    this.clearCookiesByPattern(analyticsCookies);
  }

  private clearMarketingCookies() {
    if (typeof document === 'undefined') return;

    const marketingCookies = [
      '_fbp', 'fr', 'xs', 'c_user', 'datr',
      'IDE', 'test_cookie', 'id',
      '_gcl_dc', '_gcl_au', '_gcl_aw',
      '_rdt_uuid',
      'muc_ads', 'personalization_id',
      '_ttp', '_tt_enable_cookie',
      '_pinterest_sess', '_pinterest_ct',
      'bcookie', 'li_gc', 'lidc',
      '__adroll', '__ar_v4'
    ];

    this.clearCookiesByPattern(marketingCookies);
  }

  private clearFunctionalCookies() {
    if (typeof document === 'undefined') return;

    const essentialCookies = [
      'cookieConsent',
      'cookieConsentTime',
      'cookieConsentVersion',
      'preferred-language',
      'auth',
      'session',
      'csrf'
    ];

    // Clear all cookies except essential ones
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      if (!essentialCookies.some(ec => cookieName.includes(ec))) {
        this.deleteCookie(cookieName);
      }
    });
  }

  private clearCookiesByPattern(patterns: string[]) {
    if (typeof document === 'undefined') return;

    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      const cookieName = name.trim();
      
      patterns.forEach(pattern => {
        // Handle wildcard patterns
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(cookieName)) {
          this.deleteCookie(cookieName);
        }
      });
    });
  }

  private deleteCookie(name: string) {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    // Delete for current domain
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Delete for parent domain
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    
    // Delete for current exact domain
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    
    // Delete for all possible paths
    const paths = ['/', '/app', '/api'];
    paths.forEach(path => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    });
  }

  public getAllCookies(): string[] {
    if (typeof document === 'undefined') return [];
    return document.cookie.split(';').map(c => c.trim()).filter(c => c);
  }

  public testBlocking(): { blocked: string[], allowed: string[] } {
    const blocked: string[] = [];
    const allowed: string[] = [];

    // Test URLs
    const testUrls = [
      'https://www.google-analytics.com/analytics.js',
      'https://connect.facebook.net/en_US/fbevents.js',
      'https://platform.twitter.com/widgets.js',
      'https://cdn.example.com/app.js'
    ];

    testUrls.forEach(url => {
      if (this.shouldBlockRequest(url)) {
        blocked.push(url);
      } else {
        allowed.push(url);
      }
    });

    return { blocked, allowed };
  }
}

// Export singleton instance
let cookieManager: CookieManager;

if (typeof window !== 'undefined') {
  cookieManager = CookieManager.getInstance();
} else {
  // Dummy instance for SSR
  cookieManager = {
    updatePreferences: () => {},
    getAllCookies: () => [],
    testBlocking: () => ({ blocked: [], allowed: [] })
  } as any;
}

export { cookieManager };
export type { ConsentPreferences };