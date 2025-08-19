import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { additionalTranslations } from './i18n-additional';

// 合并翻译资源
const resources = {
  en: {
    translation: {
      ...additionalTranslations.en,
      // Navigation
      'nav.home': 'Home',
      'nav.generator': 'Create',
      'nav.pricing': 'Pricing',
      'nav.pointsShop': 'Points Shop',
      'nav.buyPoints': 'Buy Points',
      'nav.gallery': 'Gallery',
      'nav.recharge': 'Recharge',
      'nav.login': 'Login',
      'nav.loginWithGoogle': 'Sign in with Google',
      'nav.freeUses': 'Free Uses',
      'nav.points': 'Points',
      'nav.history': 'History',
      'nav.logout': 'Logout',
      'nav.loggingIn': 'Logging in...',
      'nav.loggingOut': 'Logging out...',
      'nav.subscribe': 'Subscribe',
      'nav.title': 'Qwen Image',
      'nav.recharge': 'Recharge',
      'nav.profile': 'Profile',
      'nav.billing': 'Billing',
      'nav.usage': 'Usage',
      
      // Hero Section
      'hero.badge': 'Powered by Advanced Qwen Image AI Technology',
      'hero.title1': 'Create Stunning Art with Qwen Image',
      'hero.title2': 'AI Image Generator',
      'hero.description': 'Experience the revolutionary Qwen Image AI technology - Create breathtaking images with Qwen Image in seconds. Join millions using Qwen Image for professional AI art generation.',
      'hero.startCreating': 'Start Creating',
      'hero.viewPricing': 'View Pricing',
      'hero.viewGallery': 'View Gallery',
      'hero.stat1': 'Images Created',
      'hero.stat2': 'Active Users',
      'hero.stat3': 'User Rating',
      
      // Generator
      'generator.title': 'Qwen Image Generator',
      'generator.subtitle': 'Transform your ideas into stunning visuals with Qwen Image',
      'generator.placeholder': 'Describe your image...',
      'generator.generateButton': 'Generate Image',
      'generator.generating': 'Creating your masterpiece...',
      'generator.download': 'Download',
      'generator.share': 'Share',
      'generator.welcomeBack': 'Welcome back',
      'generator.imageDescription': 'Describe your image...',
      'generator.quickTip': '🎨 Generate Image',
      'generator.generatedResult': 'Generated Result',
      'generator.history': 'History',
      'generator.yourArtwork': 'Your Artwork',
      'generator.generatingMessage': 'Creating your masterpiece...',
      'generator.estimatedTime': 'Estimated time: 30-60 seconds',
      'generator.generateNew': 'Generate New',
      'generator.pageTitle': 'Qwen Image Generator',
      
      // Features
      'features.sectionTitle': 'Why Choose Qwen Image AI?',
      'features.sectionSubtitle': 'Qwen Image offers powerful features for all your creative needs',
      'features.ctaText': 'Ready to unleash your creativity?',
      'features.ctaButton': 'Start Creating Now',
      'features.artistic.title': 'Artistic Styles',
      'features.artistic.desc': 'Choose from hundreds of artistic styles, from photorealistic to abstract art',
      'features.fast.title': 'Lightning Fast',
      'features.fast.desc': 'Generate high-quality images in seconds, not minutes',
      'features.multilingual.title': 'Multilingual Support',
      'features.multilingual.desc': 'Perfect understanding of prompts in multiple languages',
      'features.quality.title': 'HD Quality',
      'features.quality.desc': 'All images generated in stunning 1024x1024 resolution',
      'features.private.title': 'Private & Secure',
      'features.private.desc': 'Your creations are private and secure, with no data sharing',
      'features.unlimited.title': 'Unlimited Creativity',
      'features.unlimited.desc': 'No limits on your imagination - create anything you can dream of',
      
      // Showcase
      'showcase.title': 'Qwen Image AI Gallery',
      'showcase.subtitle': 'Explore amazing Qwen Image creations from our community',
      'showcase.loadMore': 'Load More Creations',
      'showcase.details': 'Creation Details',
      'showcase.prompt': 'Prompt',
      'showcase.category': 'Category',
      'showcase.style': 'Style',
      'showcase.usePrompt': 'Use This Prompt',
      
      // Footer
      'footer.product': 'Product',
      'footer.company': 'Company',
      'footer.resources': 'Resources',
      'footer.legal': 'Legal',
      'footer.home': 'Home',
      'footer.pricing': 'Pricing',
      'footer.aboutUs': 'About Us',
      'footer.blog': 'Blog',
      'footer.careers': 'Careers',
      'footer.contact': 'Contact',
      'footer.documentation': 'Documentation',
      'footer.apiReference': 'API Reference',
      'footer.support': 'Support',
      'footer.community': 'Community',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service',
      'footer.cookies': 'Cookie Policy',
      'footer.refund': 'Refund Policy',
      'footer.copyright': '© 2024 Qwen Image. All rights reserved.',
      
      // Pricing
      'pricing.title': 'Choose Your Qwen Image Plan',
      'pricing.subtitle': 'Flexible Qwen Image pricing for everyone',
      'pricing.subscriptions': 'Subscriptions',
      'pricing.pointsPackages': 'Points Packages',
      'pricing.faq': 'Frequently Asked Questions',
      'pricing.getStarted': 'Get Started',
      'pricing.mostPopular': 'Most Popular',
      'pricing.bestValue': 'Best Value',
      'pricing.buyNow': 'Buy Now',
      'pricing.faqWhatIsQwen': 'What is Qwen Image?',
      'pricing.faqWhatIsQwenAnswer': 'Qwen Image is an advanced AI image generation technology that creates stunning visuals from text descriptions.',
      'pricing.faqGenerations': 'How many images can I generate?',
      'pricing.faqGenerationsAnswer': 'Each generation uses 10 points. The number of images depends on your subscription or points package.',
      'pricing.faqCommercial': 'Can I use generated images commercially?',
      'pricing.faqCommercialAnswer': 'Yes, all images generated with paid plans can be used for commercial purposes.',
      'pricing.faqDifference': 'What\'s the difference between subscriptions and points?',
      'pricing.faqDifferenceAnswer': 'Subscriptions provide monthly or yearly points that refresh, while points packages are one-time purchases that don\'t expire.',
      
      // Common
      'common.paymentFailed': 'Payment failed. Please try again or contact support.',
      'common.purchaseFailed': 'Purchase failed. Please try again.',
      'common.loginRequired': 'Please login to continue',
      'common.contactSupport': 'Contact Support',
      
      // History
      'history.title': 'Generation History',
      'history.clear': 'Clear History',
      
      // Share
      'share.shareText': 'Check out this amazing Qwen Image creation',
      'share.title': 'Share',
      'share.copyLink': 'Copy Link',
      'share.cancel': 'Cancel',
      'success.linkCopied': 'Link Copied!',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.confirm': 'Confirm',
      'common.processing': 'Processing...',
      'common.cancel': 'Cancel',
      'common.back': 'Back',
      'common.month': 'Month',
      'common.year': 'Year',
      'common.times': 'times',
      'common.back': 'Back',
      'common.userId': 'User ID',
      'nav.title': 'Qwen Image',
      
      // Errors
      'errors.signOutFailed': 'Sign out failed, please try again',
      'errors.loginRequired': 'Please login to generate images',
      'errors.enterDescription': 'Please enter an image description',
      'errors.freeUsesExhausted': 'Free uses exhausted. Please subscribe to continue.',
      'errors.generationFailed': 'Image generation failed. Please try again.',
      'errors.imageLoadFailed': 'Failed to load image',
      'errors.loginFailed': 'Login failed',
      
      // Checkout
      'checkout.cancelled': 'Payment was cancelled',
      'checkout.processing': 'Processing payment...',
      'checkout.success': 'Payment successful!',
      'checkout.redirecting': 'Redirecting...',
      'checkout.confirming': 'Please wait while we confirm your payment...',
      'checkout.pointsAdded': 'Points have been added to your account',
      'checkout.backToRecharge': 'Back to Recharge',
      'checkout.invalid': 'Invalid Request',
      'checkout.invalidParams': 'Invalid checkout parameters',
      'checkout.backToHome': 'Back to Home',
      'checkout.contactSupport': 'If you continue to experience issues, please contact support.',
      'checkout.loading': 'Loading checkout information...',
    }
  },
  zh: {
    translation: {
      ...additionalTranslations.zh,
      // 导航
      'nav.home': '首页',
      'nav.generator': '创作',
      'nav.pricing': '价格',
      'nav.pointsShop': '积分商店',
      'nav.buyPoints': '购买积分',
      'nav.gallery': '图库',
      'nav.recharge': '充值',
      'nav.login': '登录',
      'nav.loginWithGoogle': '使用 Google 登录',
      'nav.freeUses': '免费次数',
      'nav.points': '积分',
      'nav.history': '历史记录',
      'nav.logout': '退出',
      'nav.loggingIn': '登录中...',
      'nav.loggingOut': '退出中...',
      'nav.subscribe': '订阅',
      'nav.title': 'Qwen Image',
      'nav.recharge': '充值',
      'nav.profile': '个人资料',
      'nav.billing': '账单',
      'nav.usage': '使用记录',
      
      // 主页横幅
      'hero.badge': '由先进的 Qwen Image AI 技术驱动',
      'hero.title1': '使用 Qwen Image 创作惊艳艺术',
      'hero.title2': 'AI 图像生成器',
      'hero.description': '体验革命性的 Qwen Image AI 技术 - 使用 Qwen Image 在几秒钟内创建令人惊叹的图像。加入数百万使用 Qwen Image 进行专业 AI 艺术创作的用户。',
      'hero.startCreating': '开始创作',
      'hero.viewPricing': '查看价格',
      'hero.viewGallery': '查看图库',
      'hero.stat1': '生成图像',
      'hero.stat2': '活跃用户',
      'hero.stat3': '用户评分',
      
      // 生成器
      'generator.title': 'Qwen Image 生成器',
      'generator.subtitle': '使用 Qwen Image 将您的想法转化为惊艳的视觉效果',
      'generator.placeholder': '描述您的图像...',
      'generator.generateButton': '生成图像',
      'generator.generating': '正在创作您的杰作...',
      'generator.download': '下载',
      'generator.share': '分享',
      'generator.welcomeBack': '欢迎回来',
      'generator.imageDescription': '描述您的图像...',
      'generator.quickTip': '🎨 生成图像',
      'generator.generatedResult': '生成结果',
      'generator.history': '历史记录',
      'generator.yourArtwork': '您的作品',
      'generator.generatingMessage': '正在创作您的杰作...',
      'generator.estimatedTime': '预计时间：30-60秒',
      'generator.generateNew': '生成新图片',
      'generator.pageTitle': 'Qwen Image 生成器',
      
      // 功能特点
      'features.sectionTitle': '为什么选择 Qwen Image AI？',
      'features.sectionSubtitle': 'Qwen Image 提供满足您所有创意需求的强大功能',
      'features.ctaText': '准备好释放您的创造力了吗？',
      'features.ctaButton': '立即开始创作',
      'features.artistic.title': '艺术风格',
      'features.artistic.desc': '从数百种艺术风格中选择，从照片写实到抽象艺术',
      'features.fast.title': '闪电般快速',
      'features.fast.desc': '在几秒钟内生成高质量图像，而不是几分钟',
      'features.multilingual.title': '多语言支持',
      'features.multilingual.desc': '完美理解多种语言的提示词',
      'features.quality.title': '高清质量',
      'features.quality.desc': '所有图像均以惊艳的1024x1024分辨率生成',
      'features.private.title': '私密安全',
      'features.private.desc': '您的创作私密安全，不会与他人共享数据',
      'features.unlimited.title': '无限创意',
      'features.unlimited.desc': '对您的想象力没有限制 - 创造任何您能梦想的东西',
      
      // 展示
      'showcase.title': 'Qwen Image AI 图库',
      'showcase.subtitle': '探索社区的精彩 Qwen Image 创作',
      'showcase.loadMore': '加载更多作品',
      'showcase.details': '创作详情',
      'showcase.prompt': '提示词',
      'showcase.category': '分类',
      'showcase.style': '风格',
      'showcase.usePrompt': '使用此提示词',
      
      // 页脚
      'footer.product': '产品',
      'footer.company': '公司',
      'footer.resources': '资源',
      'footer.legal': '法律',
      'footer.home': '首页',
      'footer.pricing': '价格',
      'footer.aboutUs': '关于我们',
      'footer.blog': '博客',
      'footer.careers': '招聘',
      'footer.contact': '联系我们',
      'footer.documentation': '文档',
      'footer.apiReference': 'API 参考',
      'footer.support': '支持',
      'footer.community': '社区',
      'footer.privacy': '隐私政策',
      'footer.terms': '服务条款',
      'footer.cookies': 'Cookie 政策',
      'footer.refund': '退款政策',
      'footer.copyright': '© 2024 Qwen Image. 保留所有权利。',
      
      // 价格
      'pricing.title': '选择您的 Qwen Image 套餐',
      'pricing.subtitle': '灵活的 Qwen Image 定价适合每个人',
      'pricing.subscriptions': '订阅套餐',
      'pricing.pointsPackages': '积分套餐',
      'pricing.faq': '常见问题',
      'pricing.getStarted': '开始使用',
      'pricing.mostPopular': '最受欢迎',
      'pricing.bestValue': '超值优惠',
      'pricing.buyNow': '立即购买',
      'pricing.faqWhatIsQwen': 'Qwen Image 是什么？',
      'pricing.faqWhatIsQwenAnswer': 'Qwen Image 是一种先进的 AI 图像生成技术，可以根据文字描述创建惊艳的视觉效果。',
      'pricing.faqGenerations': '我可以生成多少张图片？',
      'pricing.faqGenerationsAnswer': '每次生成使用 10 积分。图片数量取决于您的订阅或积分包。',
      'pricing.faqCommercial': '生成的图片可以商用吗？',
      'pricing.faqCommercialAnswer': '是的，所有付费套餐生成的图片都可以用于商业目的。',
      'pricing.faqDifference': '订阅和积分有什么区别？',
      'pricing.faqDifferenceAnswer': '订阅提供每月或每年刷新的积分，而积分包是一次性购买且不会过期。',
      
      // 通用
      'common.paymentFailed': '支付失败，请重试或联系客服',
      'common.purchaseFailed': '购买失败，请重试',
      'common.loginRequired': '请登录后继续',
      'common.contactSupport': '联系客服',
      
      // 历史
      'history.title': '生成历史',
      'history.clear': '清除历史',
      
      // 分享
      'share.shareText': '看看这个惊艳的 Qwen Image 创作',
      'share.title': '分享',
      'share.copyLink': '复制链接',
      'share.cancel': '取消',
      'success.linkCopied': '链接已复制！',
      
      // 通用
      'common.loading': '加载中...',
      'common.error': '错误',
      'common.success': '成功',
      'common.confirm': '确定',
      'common.processing': '处理中...',
      'common.cancel': '取消',
      'common.back': '返回',
      'common.month': '月',
      'common.year': '年',
      'common.times': '次',
      'common.back': '返回',
      'common.userId': '用户ID',
      'nav.title': 'Qwen Image',
      
      // 错误
      'errors.signOutFailed': '退出失败，请重试',
      'errors.loginRequired': '请登录后生成图片',
      'errors.enterDescription': '请输入图片描述',
      'errors.freeUsesExhausted': '免费次数已用完，请订阅以继续使用',
      'errors.generationFailed': '图片生成失败，请重试',
      'errors.imageLoadFailed': '图片加载失败',
      'errors.loginFailed': '登录失败',
      
      // 结账
      'checkout.cancelled': '支付已取消',
      'checkout.processing': '正在处理支付...',
      'checkout.success': '支付成功！',
      'checkout.redirecting': '正在跳转...',
      'checkout.confirming': '请稍候，正在确认您的支付...',
      'checkout.pointsAdded': '积分已添加到您的账户',
      'checkout.backToRecharge': '返回充值页面',
      'checkout.invalid': '无效请求',
      'checkout.invalidParams': '无效的结账参数',
      'checkout.backToHome': '返回首页',
      'checkout.contactSupport': '如果问题持续，请联系客服。',
      'checkout.loading': '正在加载结账信息...',
    }
  }
};

// 获取初始语言 - 始终返回英文以避免 hydration 错误
const getInitialLanguage = (): string => {
  return 'en'; // 始终使用英文作为初始语言，避免 SSR/客户端不匹配
};

// 初始化 i18next
i18n
  .use(initReactI18next) // 传递 i18n 实例给 react-i18next
  .init({
    resources,
    lng: getInitialLanguage(), // 设置初始语言
    fallbackLng: 'en',
    debug: false,
    
    // 支持的语言
    supportedLngs: ['en', 'zh'],
    
    
    interpolation: {
      escapeValue: false, // React 已经默认转义
    },
    
    react: {
      useSuspense: false, // 关闭 Suspense 模式
    }
  });

export default i18n;