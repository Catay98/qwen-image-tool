const fs = require('fs');
const path = require('path');

// 创建图片目录
const showcaseDir = path.join(__dirname, '..', 'public', 'images', 'showcase');
if (!fs.existsSync(showcaseDir)) {
  fs.mkdirSync(showcaseDir, { recursive: true });
}

// 图片信息
const images = [
  { filename: 'portrait-galaxy-hair.jpg', title: 'Galaxy Portrait', colors: ['#8B5CF6', '#06B6D4'] },
  { filename: 'ice-dragon-mountain.jpg', title: 'Ice Dragon', colors: ['#3B82F6', '#E0E7FF'] },
  { filename: 'cyberpunk-tokyo-market.jpg', title: 'Cyberpunk Tokyo', colors: ['#F59E0B', '#EF4444'] },
  { filename: 'enchanted-forest-ghibli.jpg', title: 'Enchanted Forest', colors: ['#10B981', '#34D399'] },
  { filename: 'mechanical-owl-steampunk.jpg', title: 'Mechanical Owl', colors: ['#92400E', '#D97706'] },
  { filename: 'japanese-zen-garden.jpg', title: 'Zen Garden', colors: ['#84CC16', '#FDE047'] },
  { filename: 'astronaut-space-earth.jpg', title: 'Space Astronaut', colors: ['#1E40AF', '#3730A3'] },
  { filename: 'art-nouveau-woman-flowers.jpg', title: 'Art Nouveau', colors: ['#DC2626', '#F59E0B'] },
  { filename: 'underwater-palace-mermaids.jpg', title: 'Underwater Palace', colors: ['#0891B2', '#06B6D4'] },
  { filename: 'geometric-abstract-bauhaus.jpg', title: 'Geometric Abstract', colors: ['#7C2D12', '#EA580C'] },
  { filename: 'viking-queen-warrior.jpg', title: 'Viking Queen', colors: ['#374151', '#6B7280'] },
  { filename: 'retro-mars-diner.jpg', title: 'Mars Diner', colors: ['#BE123C', '#F97316'] }
];

// 生成SVG占位符
images.forEach((img, index) => {
  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${img.colors[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${img.colors[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad${index})" />
  <circle cx="400" cy="300" r="100" fill="rgba(255,255,255,0.2)" />
  <text x="400" y="320" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">${img.title}</text>
  <text x="400" y="350" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle">Qwen Image AI</text>
</svg>`;

  const filePath = path.join(showcaseDir, img.filename.replace('.jpg', '.svg'));
  fs.writeFileSync(filePath, svg);
  console.log(`Created ${img.filename}`);
});

console.log(`Generated ${images.length} placeholder images in ${showcaseDir}`);