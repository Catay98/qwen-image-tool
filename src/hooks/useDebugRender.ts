import { useEffect } from 'react';

export function useDebugRender(componentName: string, props: any) {
  useEffect(() => {
    // 递归检查对象中是否有多语言字段
    function checkForMultiLang(obj: any, path: string = ''): boolean {
      if (obj === null || obj === undefined) return false;
      
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        const keys = Object.keys(obj);
        if (keys.length === 2 && keys.includes('en') && keys.includes('zh')) {
          console.error(`[${componentName}] 发现多语言对象在 ${path}:`, obj);
          console.trace();
          return true;
        }
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && key !== '_owner' && key !== '_store') {
            checkForMultiLang(obj[key], path ? `${path}.${key}` : key);
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          checkForMultiLang(item, `${path}[${index}]`);
        });
      }
      
      return false;
    }
    
    checkForMultiLang(props, 'props');
  }, [componentName, props]);
}