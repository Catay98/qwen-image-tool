// 深度清理所有多语言对象
export function deepSanitize(obj: any, lang: string = 'zh'): any {
  // 处理 null 或 undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // 处理原始类型
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, lang));
  }
  
  // 检查是否是 React 元素
  if (obj.$$typeof) {
    return obj;
  }
  
  // 检查是否是多语言对象
  const keys = Object.keys(obj);
  if (keys.length === 2 && keys.includes('en') && keys.includes('zh')) {
    // 这是多语言对象，返回对应语言的值
    const result = obj[lang] || obj.zh || obj.en || '';
    console.log('[deepSanitize] 转换多语言对象:', obj, '→', result);
    return result;
  }
  
  // 处理普通对象
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = deepSanitize(obj[key], lang);
    }
  }
  
  return sanitized;
}

// 创建一个 HOC 来包装组件
export function withSanitizedProps<P extends object>(Component: React.ComponentType<P>) {
  return function SanitizedComponent(props: P) {
    const lang = typeof window !== 'undefined' ? 
      (localStorage.getItem('i18nextLng') || 'zh') : 'zh';
    
    const sanitizedProps = deepSanitize(props, lang);
    
    return Component(sanitizedProps);
  };
}