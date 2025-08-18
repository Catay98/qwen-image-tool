import React from 'react';

/**
 * 确保任何值都是 React 可以安全渲染的
 * @param value 任意值
 * @param lang 语言选择
 * @returns 字符串或 React 元素
 */
export function renderSafe(value: any, lang: string = 'zh'): React.ReactNode {
  // 处理 null 或 undefined
  if (value === null || value === undefined) {
    return '';
  }
  
  // 处理 React 元素
  if (React.isValidElement(value)) {
    return value;
  }
  
  // 处理原始类型
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // 处理多语言对象
  if (typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (keys.length === 2 && keys.includes('en') && keys.includes('zh')) {
      const result = value[lang] || value.zh || value.en || '';
      console.log('[renderSafe] 转换多语言对象:', value, '→', result);
      return String(result);
    }
    
    // 对象但不是多语言对象，尝试转换为 JSON 字符串（用于调试）
    console.warn('[renderSafe] 尝试渲染非多语言对象:', value);
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  
  // 处理数组
  if (Array.isArray(value)) {
    return value.map((item, index) => (
      <React.Fragment key={index}>
        {renderSafe(item, lang)}
      </React.Fragment>
    ));
  }
  
  // 默认返回字符串
  return String(value);
}

/**
 * 安全渲染包装器组件
 */
export function SafeRender({ 
  value, 
  lang = 'zh', 
  fallback = '' 
}: { 
  value: any; 
  lang?: string;
  fallback?: React.ReactNode;
}) {
  try {
    const rendered = renderSafe(value, lang);
    return <>{rendered || fallback}</>;
  } catch (error) {
    console.error('[SafeRender] 渲染错误:', error, '值:', value);
    return <>{fallback}</>;
  }
}