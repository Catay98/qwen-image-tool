import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. 获取客户端IP地址
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // 2. 获取浏览器语言偏好
    const acceptLanguage = request.headers.get('accept-language') || '';
    const browserLanguages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, qValue] = lang.trim().split(';q=');
        return {
          code: code.toLowerCase(),
          quality: qValue ? parseFloat(qValue.replace('q=', '')) : 1
        };
      })
      .sort((a, b) => b.quality - a.quality);
    
    // 3. 根据IP获取地理位置（使用免费的IP API）
    let countryCode = '';
    let country = '';
    let detectedLanguage = 'en'; // 默认英语
    
    // 开发环境或本地IP时跳过
    if (ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('::1')) {
      try {
        // 使用 ip-api.com (免费服务，无需密钥)
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lang`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            countryCode = geoData.countryCode || '';
            country = geoData.country || '';
            
            // 根据国家代码判断语言
            const chineseCountries = ['CN', 'HK', 'MO', 'TW', 'SG'];
            const japaneseCountries = ['JP'];
            const koreanCountries = ['KR', 'KP'];
            
            if (chineseCountries.includes(countryCode)) {
              detectedLanguage = 'zh';
            } else if (japaneseCountries.includes(countryCode)) {
              detectedLanguage = 'ja';
            } else if (koreanCountries.includes(countryCode)) {
              detectedLanguage = 'ko';
            }
          }
        }
      } catch (error) {
        console.error('Error fetching geo data:', error);
      }
    }
    
    // 4. 分析浏览器语言偏好
    let browserLanguage = 'en';
    const primaryBrowserLang = browserLanguages[0]?.code || '';
    
    if (primaryBrowserLang.startsWith('zh')) {
      browserLanguage = 'zh';
    } else if (primaryBrowserLang.startsWith('ja')) {
      browserLanguage = 'ja';
    } else if (primaryBrowserLang.startsWith('ko')) {
      browserLanguage = 'ko';
    } else if (primaryBrowserLang.startsWith('en')) {
      browserLanguage = 'en';
    }
    
    // 5. 综合判断最终语言
    // 优先级：浏览器语言 > IP定位语言
    let finalLanguage = browserLanguage;
    
    // 如果浏览器语言是英语但IP在中文区，使用中文
    if (browserLanguage === 'en' && detectedLanguage === 'zh') {
      finalLanguage = 'zh';
    }
    
    // 6. 返回检测结果
    return NextResponse.json({
      detectedLanguage: finalLanguage,
      browserLanguage,
      ipBasedLanguage: detectedLanguage,
      browserLanguages: browserLanguages.slice(0, 3), // 返回前3个语言偏好
      location: {
        ip,
        country,
        countryCode
      },
      supportedLanguages: ['en', 'zh', 'ja', 'ko'], // 支持的语言列表
      recommendation: finalLanguage
    });
    
  } catch (error) {
    console.error('Error detecting language:', error);
    return NextResponse.json({
      detectedLanguage: 'en',
      browserLanguage: 'en',
      ipBasedLanguage: 'en',
      error: 'Failed to detect language',
      supportedLanguages: ['en', 'zh', 'ja', 'ko']
    });
  }
}