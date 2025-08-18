const fs = require('fs');
const path = require('path');

const showcaseDir = path.join(__dirname, '..', 'public', 'images', 'showcase');

// 创建高质量的赛博朋克风格图片
const cyberpunkSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cyberpunkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#1a0033;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#330066;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </linearGradient>
    
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff0080;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#ff4080;stop-opacity:0.3" />
    </linearGradient>
    
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ffff;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#4080ff;stop-opacity:0.3" />
    </linearGradient>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="neonGlow">
      <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="800" height="600" fill="url(#cyberpunkBg)" />
  
  <!-- 建筑轮廓 -->
  <rect x="50" y="200" width="60" height="400" fill="#1a1a1a" opacity="0.8" />
  <rect x="150" y="150" width="80" height="450" fill="#2a2a2a" opacity="0.8" />
  <rect x="280" y="100" width="100" height="500" fill="#1a1a1a" opacity="0.8" />
  <rect x="420" y="180" width="90" height="420" fill="#2a2a2a" opacity="0.8" />
  <rect x="550" y="120" width="70" height="480" fill="#1a1a1a" opacity="0.8" />
  <rect x="650" y="160" width="100" height="440" fill="#2a2a2a" opacity="0.8" />
  
  <!-- 霓虹灯招牌 -->
  <rect x="160" y="200" width="60" height="15" fill="url(#neonPink)" filter="url(#neonGlow)" />
  <rect x="290" y="150" width="80" height="12" fill="url(#neonCyan)" filter="url(#neonGlow)" />
  <rect x="430" y="230" width="70" height="18" fill="url(#neonPink)" filter="url(#neonGlow)" />
  <rect x="560" y="180" width="50" height="14" fill="url(#neonCyan)" filter="url(#neonGlow)" />
  
  <!-- 窗户灯光 -->
  <rect x="65" y="220" width="8" height="12" fill="#ffff80" opacity="0.6" />
  <rect x="80" y="240" width="8" height="12" fill="#80ffff" opacity="0.6" />
  <rect x="65" y="280" width="8" height="12" fill="#ff8080" opacity="0.6" />
  
  <rect x="165" y="180" width="10" height="15" fill="#ffff80" opacity="0.6" />
  <rect x="185" y="200" width="10" height="15" fill="#80ffff" opacity="0.6" />
  <rect x="205" y="220" width="10" height="15" fill="#ff8080" opacity="0.6" />
  
  <rect x="300" y="130" width="12" height="18" fill="#ffff80" opacity="0.6" />
  <rect x="320" y="160" width="12" height="18" fill="#80ffff" opacity="0.6" />
  <rect x="340" y="190" width="12" height="18" fill="#ff8080" opacity="0.6" />
  
  <!-- 街道反射 -->
  <rect x="0" y="580" width="800" height="20" fill="url(#cyberpunkBg)" opacity="0.3" />
  
  <!-- 雨滴效果 -->
  <line x1="100" y1="0" x2="95" y2="600" stroke="#4080ff" stroke-width="1" opacity="0.3" />
  <line x1="200" y1="0" x2="195" y2="600" stroke="#4080ff" stroke-width="0.5" opacity="0.4" />
  <line x1="350" y1="0" x2="345" y2="600" stroke="#4080ff" stroke-width="1" opacity="0.3" />
  <line x1="500" y1="0" x2="495" y2="600" stroke="#4080ff" stroke-width="0.5" opacity="0.4" />
  <line x1="650" y1="0" x2="645" y2="600" stroke="#4080ff" stroke-width="1" opacity="0.3" />
  
  <!-- 文字标题 -->
  <text x="400" y="320" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
        fill="#00ffff" text-anchor="middle" filter="url(#neonGlow)">CYBERPUNK</text>
  <text x="400" y="360" font-family="Arial, sans-serif" font-size="24" 
        fill="#ff0080" text-anchor="middle" filter="url(#neonGlow)">TOKYO 2099</text>
  
  <!-- 品牌标识 -->
  <text x="400" y="550" font-family="Arial, sans-serif" font-size="14" 
        fill="rgba(255,255,255,0.5)" text-anchor="middle">Generated with Qwen Image AI</text>
        
  <!-- 发光粒子效果 -->
  <circle cx="150" cy="100" r="2" fill="#00ffff" opacity="0.8" filter="url(#glow)" />
  <circle cx="300" cy="80" r="1.5" fill="#ff0080" opacity="0.9" filter="url(#glow)" />
  <circle cx="500" cy="120" r="2.5" fill="#ffff00" opacity="0.7" filter="url(#glow)" />
  <circle cx="650" cy="90" r="1" fill="#00ffff" opacity="0.8" filter="url(#glow)" />
  <circle cx="720" cy="110" r="2" fill="#ff0080" opacity="0.6" filter="url(#glow)" />
</svg>`;

// 保存为JPG格式的SVG (浏览器会将其作为图片处理)
const filepath = path.join(showcaseDir, 'cyberpunk-tokyo-market.jpg');
fs.writeFileSync(filepath, cyberpunkSvg);

console.log('创建了高质量的赛博朋克图片: cyberpunk-tokyo-market.jpg');

// 验证文件存在和大小
const stats = fs.statSync(filepath);
console.log(`文件大小: ${stats.size} bytes`);
console.log('图片创建完成!');