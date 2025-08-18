const https = require('https');
const fs = require('fs');
const path = require('path');

// 创建图片目录
const showcaseDir = path.join(__dirname, '..', 'public', 'images', 'showcase');

// 缺失的图片，使用其他高质量图片源
const missingImages = [
  {
    url: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&h=600&fit=crop',
    filename: 'cyberpunk-tokyo-market.jpg',
    category: 'Sci-Fi',
    style: 'Concept Art',
    prompt: 'Cyberpunk street market in Neo Tokyo 2099, neon signs, holographic advertisements, rain-soaked streets, blade runner aesthetic, cinematic lighting'
  },
  {
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop',
    filename: 'viking-queen-warrior.jpg',
    category: 'Portrait',
    style: 'Concept Art',
    prompt: 'Viking warrior queen in battle armor, detailed Celtic patterns, snowy mountain battlefield, dramatic lighting, epic fantasy character design'
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

// 下载缺失的图片
async function downloadMissingImages() {
  console.log('开始下载缺失的图片...');
  
  for (const image of missingImages) {
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
  
  console.log('缺失图片下载完成!');
}

// 运行下载
downloadMissingImages().catch(console.error);