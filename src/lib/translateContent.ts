// Helper function to translate database content
export function translateDatabaseContent(content: any, language: 'en' | 'zh'): string {
  // Handle multilingual objects
  if (typeof content === 'object' && content !== null) {
    if ('en' in content || 'zh' in content) {
      return content[language] || content.zh || content.en || '';
    }
  }
  
  // Convert to string if not already
  const contentStr = String(content || '');
  
  // Common translations mapping
  const commonTranslations: Record<string, Record<'en' | 'zh', string>> = {
    // Plan names
    'Free': { en: 'Free', zh: '免费版' },
    'Starter': { en: 'Starter', zh: '入门版' },
    'Professional': { en: 'Professional', zh: '专业版' },
    'Pro': { en: 'Pro', zh: '专业版' },
    'Unlimited': { en: 'Unlimited', zh: '无限版' },
    'Enterprise': { en: 'Enterprise', zh: '企业版' },
    'Basic': { en: 'Basic', zh: '基础版' },
    'Premium': { en: 'Premium', zh: '高级版' },
    
    // Common features
    'Unlimited generations': { en: 'Unlimited generations', zh: '无限生成' },
    'Priority support': { en: 'Priority support', zh: '优先支持' },
    'API access': { en: 'API access', zh: 'API访问' },
    'No watermark': { en: 'No watermark', zh: '无水印' },
    'Watermark removed': { en: 'Watermark removed', zh: '去除水印' },
    'HD quality': { en: 'HD quality', zh: '高清质量' },
    '4K resolution': { en: '4K resolution', zh: '4K分辨率' },
    'All styles': { en: 'All styles', zh: '所有风格' },
    'Custom models': { en: 'Custom models', zh: '自定义模型' },
    'Commercial use': { en: 'Commercial use', zh: '商业使用' },
    'Team collaboration': { en: 'Team collaboration', zh: '团队协作' },
    
    // Intervals
    'month': { en: 'month', zh: '月' },
    'year': { en: 'year', zh: '年' },
    'day': { en: 'day', zh: '天' },
    'week': { en: 'week', zh: '周' },
    
    // Points packages
    'Starter Pack': { en: 'Starter Pack', zh: '入门包' },
    'Popular Pack': { en: 'Popular Pack', zh: '热门包' },
    'Pro Pack': { en: 'Pro Pack', zh: '专业包' },
    'Mega Pack': { en: 'Mega Pack', zh: '超值包' },
    'points': { en: 'points', zh: '积分' },
    'credits': { en: 'credits', zh: '积分' },
  };
  
  // Check if we have a common translation
  if (commonTranslations[contentStr]) {
    return commonTranslations[contentStr][language];
  }
  
  // Try to translate feature descriptions with patterns
  const patterns: Array<{ regex: RegExp; translate: (matches: string[]) => Record<'en' | 'zh', string> }> = [
    {
      regex: /^(\d+) generations? per (month|day|week|year)$/i,
      translate: (matches) => ({
        en: `${matches[1]} generations per ${matches[2]}`,
        zh: `每${commonTranslations[matches[2]]?.zh || matches[2]}${matches[1]}次生成`
      })
    },
    {
      regex: /^(\d+) images? per (month|day|week|year)$/i,
      translate: (matches) => ({
        en: `${matches[1]} images per ${matches[2]}`,
        zh: `每${commonTranslations[matches[2]]?.zh || matches[2]}${matches[1]}张图片`
      })
    },
    {
      regex: /^Up to (\d+) generations?$/i,
      translate: (matches) => ({
        en: `Up to ${matches[1]} generations`,
        zh: `最多${matches[1]}次生成`
      })
    },
    {
      regex: /^(\d+) (points|credits)$/i,
      translate: (matches) => ({
        en: `${matches[1]} ${matches[2]}`,
        zh: `${matches[1]}积分`
      })
    },
  ];
  
  // Try pattern matching
  for (const pattern of patterns) {
    const match = contentStr.match(pattern.regex);
    if (match) {
      const translated = pattern.translate(match);
      return translated[language];
    }
  }
  
  // Return original content if no translation found
  return contentStr;
}

// Helper to translate plan name
export function translatePlanName(slug: string, language: 'en' | 'zh'): string {
  const planNames: Record<string, Record<'en' | 'zh', string>> = {
    'free': { en: 'Free', zh: '免费版' },
    'starter': { en: 'Starter', zh: '入门版' },
    'pro': { en: 'Professional', zh: '专业版' },
    'professional': { en: 'Professional', zh: '专业版' },
    'unlimited': { en: 'Unlimited', zh: '无限版' },
    'enterprise': { en: 'Enterprise', zh: '企业版' },
    'basic': { en: 'Basic', zh: '基础版' },
    'premium': { en: 'Premium', zh: '高级版' },
  };
  
  return planNames[slug.toLowerCase()]?.[language] || slug;
}

// Helper to translate plan description
export function translatePlanDescription(description: any, language: 'en' | 'zh'): string {
  // Handle multilingual objects first
  if (typeof description === 'object' && description !== null) {
    if ('en' in description || 'zh' in description) {
      return description[language] || description.zh || description.en || '';
    }
  }
  
  const descriptionStr = String(description || '');
  
  const descriptions: Record<string, Record<'en' | 'zh', string>> = {
    'Perfect for beginners': { en: 'Perfect for beginners', zh: '非常适合初学者' },
    'Great for casual users': { en: 'Great for casual users', zh: '适合休闲用户' },
    'For professional creators': { en: 'For professional creators', zh: '适合专业创作者' },
    'Unlimited creativity': { en: 'Unlimited creativity', zh: '无限创意' },
    'For teams and businesses': { en: 'For teams and businesses', zh: '适合团队和企业' },
  };
  
  return descriptions[descriptionStr]?.[language] || translateDatabaseContent(descriptionStr, language);
}