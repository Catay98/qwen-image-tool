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
    
    // 更详细的语言匹配
    if (primaryBrowserLang.startsWith('zh') || 
        primaryBrowserLang === 'zh-cn' || 
        primaryBrowserLang === 'zh-tw' ||
        primaryBrowserLang === 'zh-hk') {
      browserLanguage = 'zh';
    } else if (primaryBrowserLang.startsWith('ja') || 
               primaryBrowserLang === 'ja-jp') {
      browserLanguage = 'ja';
    } else if (primaryBrowserLang.startsWith('ko') || 
               primaryBrowserLang === 'ko-kr') {
      browserLanguage = 'ko';
    } else if (primaryBrowserLang.startsWith('en')) {
      browserLanguage = 'en';
    } else {
      // 如果不是支持的语言，检查次要语言偏好
      for (const lang of browserLanguages) {
        if (lang.code.startsWith('zh')) {
          browserLanguage = 'zh';
          break;
        } else if (lang.code.startsWith('ja')) {
          browserLanguage = 'ja';
          break;
        } else if (lang.code.startsWith('ko')) {
          browserLanguage = 'ko';
          break;
        } else if (lang.code.startsWith('en')) {
          browserLanguage = 'en';
          break;
        }
      }
    }
    
    // 5. 综合判断最终语言
    // 优先级：浏览器语言 > IP定位语言
    let finalLanguage = browserLanguage;
    
    // 如果浏览器没有明确的语言偏好（默认英语），则使用IP定位
    if (browserLanguage === 'en' && detectedLanguage !== 'en') {
      // 检查是否真的偏好英语，还是只是默认值
      const hasExplicitEnglishPreference = browserLanguages.some(
        lang => lang.code.startsWith('en') && lang.quality >= 0.9
      );
      
      if (!hasExplicitEnglishPreference) {
        // 没有明确的英语偏好，使用IP定位的语言
        finalLanguage = detectedLanguage;
      }
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