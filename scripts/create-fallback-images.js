const fs = require('fs');
const path = require('path');

// 创建图片目录
const showcaseDir = path.join(__dirname, '..', 'public', 'images', 'showcase');

// 检查哪些图片文件缺失
const expectedImages = [
  'portrait-galaxy-hair.jpg',
  'ice-dragon-mountain.jpg', 
  'cyberpunk-tokyo-market.jpg',
  'enchanted-forest-ghibli.jpg',
  'mechanical-owl-steampunk.jpg',
  'japanese-zen-garden.jpg',
  'astronaut-space-earth.jpg',
  'art-nouveau-woman-flowers.jpg',
  'underwater-palace-mermaids.jpg',
  'geometric-abstract-bauhaus.jpg',
  'viking-queen-warrior.jpg',
  'retro-mars-diner.jpg'
];

// 颜色方案和描述
const imageConfigs = {
  'cyberpunk-tokyo-market.jpg': {
    title: 'Cyberpunk Market',
    colors: ['#00FFFF', '#FF0080', '#8000FF'],
    description: 'Futuristic neon-lit cityscape'
  },
  'portrait-galaxy-hair.jpg': {
    title: 'Galaxy Portrait', 
    colors: ['#4A0E4E', '#81C784', '#E1BEE7'],
    description: 'Cosmic beauty with starlit hair'
  }
};

// 创建高质量的渐变背景图片（使用Canvas方式生成更真实的图片）
function createFallbackImage(filename, config) {
  // 创建一个更复杂的SVG，模拟AI艺术风格
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="mainGrad" cx="40%" cy="30%" r="80%">
      <stop offset="0%" style="stop-color:${config.colors[0]};stop-opacity:0.8" />
      <stop offset="50%" style="stop-color:${config.colors[1]};stop-opacity:0.6" />
      <stop offset="100%" style="stop-color:${config.colors[2] || config.colors[0]};stop-opacity:0.9" />
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
    </filter>
    <pattern id="noise" patternUnits="userSpaceOnUse" width="100" height="100">
      <rect width="100" height="100" fill="url(#mainGrad)" />
      <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)" />
      <circle cx="80" cy="60" r="1.5" fill="rgba(255,255,255,0.2)" />
      <circle cx="40" cy="90" r="1" fill="rgba(255,255,255,0.15)" />
    </pattern>
  </defs>
  
  <!-- 主背景 -->
  <rect width="800" height="600" fill="url(#mainGrad)" />
  
  <!-- 纹理层 -->
  <rect width="800" height="600" fill="url(#noise)" opacity="0.4" />
  
  <!-- 艺术性形状 -->
  <ellipse cx="200" cy="150" rx="100" ry="80" fill="rgba(255,255,255,0.1)" transform="rotate(25 200 150)" />
  <ellipse cx="600" cy="400" rx="120" ry="60" fill="rgba(0,0,0,0.1)" transform="rotate(-15 600 400)" />
  
  <!-- 发光效果 -->
  <circle cx="150" cy="120" r="40" fill="${config.colors[1]}" opacity="0.3" filter="url(#blur)" />
  <circle cx="650" cy="480" r="60" fill="${config.colors[0]}" opacity="0.2" filter="url(#blur)" />
  
  <!-- 标题文字 -->
  <text x="400" y="280" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
        fill="white" text-anchor="middle" opacity="0.9">${config.title}</text>
  <text x="400" y="320" font-family="Arial, sans-serif" font-size="18" 
        fill="rgba(255,255,255,0.7)" text-anchor="middle">${config.description}</text>
  
  <!-- 品牌标识 -->
  <text x="400" y="550" font-family="Arial, sans-serif" font-size="14" 
        fill="rgba(255,255,255,0.5)" text-anchor="middle">Created with Qwen Image AI</text>
        
  <!-- 装饰性元素 -->
  <polygon points="50,50 70,90 30,90" fill="rgba(255,255,255,0.1)" />
  <polygon points="750,550 770,590 730,590" fill="rgba(255,255,255,0.1)" />
</svg>`;

  const filepath = path.join(showcaseDir, filename);
  fs.writeFileSync(filepath.replace('.jpg', '.svg'), svg);
  return svg;
}

// 检查并创建缺失的图片
function createMissingImages() {
  console.log('检查缺失的图片...');
  
  expectedImages.forEach(filename => {
    const filepath = path.join(showcaseDir, filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`创建备用图片: ${filename}`);
      
      const config = imageConfigs[filename] || {
        title: filename.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ').replace('.jpg', ''),
        colors: ['#6366F1', '#8B5CF6', '#EC4899'],
        description: 'AI Generated Artwork'
      };
      
      createFallbackImage(filename, config);
      console.log(`✓ 创建完成: ${filename}`);
    } else {
      console.log(`✓ 已存在: ${filename}`);
    }
  });
  
  console.log('图片检查完成!');
}

// 运行检查
createMissingImages();