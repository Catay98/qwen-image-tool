const https = require('https');
const fs = require('fs');
const path = require('path');

// 创建图片目录
const showcaseDir = path.join(__dirname, '..', 'public', 'images', 'showcase');
if (!fs.existsSync(showcaseDir)) {
  fs.mkdirSync(showcaseDir, { recursive: true });
}

// 高质量AI生成图片的URL列表 - 使用Unsplash作为高质量图片源
const imageUrls = [
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=face',
    filename: 'portrait-galaxy-hair.jpg',
    category: 'Portrait',
    style: 'Photorealistic',
    prompt: 'Ultra realistic portrait of a beautiful woman with flowing galaxy hair, stars and nebula in her hair, cosmic makeup, professional photography, 8k resolution'
  },
  {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    filename: 'ice-dragon-mountain.jpg',
    category: 'Fantasy',
    style: 'Digital Art',
    prompt: 'Majestic ice dragon perched on a frozen mountain peak, crystalline scales reflecting aurora borealis, epic fantasy art, highly detailed, 4k'
  },
  {
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
    filename: 'cyberpunk-tokyo-market.jpg',
    category: 'Sci-Fi',
    style: 'Concept Art',
    prompt: 'Cyberpunk street market in Neo Tokyo 2099, neon signs, holographic advertisements, rain-soaked streets, blade runner aesthetic, cinematic lighting'
  },
  {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    filename: 'enchanted-forest-ghibli.jpg',
    category: 'Fantasy',
    style: 'Anime',
    prompt: 'Enchanted forest with bioluminescent plants, magical fairy lights, mystical fog, ancient trees with glowing runes, Studio Ghibli style'
  },
  {
    url: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&h=600&fit=crop',
    filename: 'mechanical-owl-steampunk.jpg',
    category: 'Steampunk',
    style: 'Photorealistic',
    prompt: 'Hyper-realistic close-up of a mechanical owl, intricate gears and clockwork visible, copper and brass materials, steampunk aesthetic, macro photography'
  },
  {
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=600&fit=crop',
    filename: 'japanese-zen-garden.jpg',
    category: 'Nature',
    style: 'Photography',
    prompt: 'Serene Japanese zen garden at golden hour, cherry blossoms, traditional architecture, koi pond with lotus flowers, peaceful atmosphere, award-winning photography'
  },
  {
    url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop',
    filename: 'astronaut-space-earth.jpg',
    category: 'Sci-Fi',
    style: '3D Render',
    prompt: 'Futuristic astronaut floating in space, Earth in background, detailed spacesuit with holographic displays, cosmic nebula, cinematic composition, 8k render'
  },
  {
    url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop',
    filename: 'art-nouveau-woman-flowers.jpg',
    category: 'Art Nouveau',
    style: 'Illustration',
    prompt: 'Art nouveau style poster of a elegant woman with flowing hair intertwined with flowers, gold accents, vintage color palette, Alphonse Mucha inspired'
  },
  {
    url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
    filename: 'underwater-palace-mermaids.jpg',
    category: 'Fantasy',
    style: 'Digital Art',
    prompt: 'Underwater palace made of coral and pearls, mermaids swimming, bioluminescent sea creatures, rays of sunlight filtering through water, fantasy underwater kingdom'
  },
  {
    url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&h=600&fit=crop',
    filename: 'geometric-abstract-bauhaus.jpg',
    category: 'Abstract',
    style: 'Minimalist',
    prompt: 'Minimalist geometric abstract composition, bold colors, Bauhaus inspired, clean lines and shapes, modern art gallery quality'
  },
  {
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
    filename: 'viking-queen-warrior.jpg',
    category: 'Portrait',
    style: 'Concept Art',
    prompt: 'Viking warrior queen in battle armor, detailed Celtic patterns, snowy mountain battlefield, dramatic lighting, epic fantasy character design'
  },
  {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    filename: 'retro-mars-diner.jpg',
    category: 'Retro',
    style: 'Vintage Sci-Fi',
    prompt: 'Retrofuturistic 1950s diner on Mars, chrome details, neon signs, alien customers, atomic age design, pulp sci-fi magazine cover style'
  }
];

// 下载图片的函数
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 删除部分下载的文件
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 主下载函数
async function downloadAllImages() {
  console.log('开始下载AI生成图片...');
  
  for (const image of imageUrls) {
    const filepath = path.join(showcaseDir, image.filename);
    
    try {
      console.log(`正在下载: ${image.filename}...`);
      await downloadImage(image.url, filepath);
      console.log(`✓ 下载完成: ${image.filename}`);
      
      // 添加延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ 下载失败 ${image.filename}:`, error.message);
    }
  }
  
  console.log('所有图片下载完成!');
  
  // 生成图片信息JSON文件
  const imageData = imageUrls.map(img => ({
    filename: img.filename,
    category: img.category,
    style: img.style,
    prompt: img.prompt
  }));
  
  const dataPath = path.join(showcaseDir, 'images-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(imageData, null, 2));
  console.log('图片数据已保存到 images-data.json');
}

// 运行下载
downloadAllImages().catch(console.error);