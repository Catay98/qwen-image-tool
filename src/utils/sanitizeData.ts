// 全局数据清理工具，确保不会渲染多语言对象

export function sanitizeMultiLang(data: any, lang: string = 'zh'): any {
  // 如果是 null 或 undefined，直接返回
  if (data === null || data === undefined) {
    return data;
  }

  // 如果是多语言对象 {en: ..., zh: ...}，返回对应语言的值
  if (typeof data === 'object' && !Array.isArray(data)) {
    // 检查是否是多语言对象
    const keys = Object.keys(data);
    if (keys.length === 2 && keys.includes('en') && keys.includes('zh')) {
      console.log('[sanitizeMultiLang] Converting multilang object:', data, '→', data[lang] || data.zh || data.en || '');
      return data[lang] || data.zh || data.en || '';
    }
    
    // 递归处理普通对象的每个属性
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = sanitizeMultiLang(data[key], lang);
      }
    }
    return result;
  }

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => sanitizeMultiLang(item, lang));
  }

  // 其他类型直接返回
  return data;
}