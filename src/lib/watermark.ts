/**
 * 给图片添加水印
 */
export async function addWatermark(imageUrl: string, text: string = 'aiqwen.cc'): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // 设置画布大小
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制原图
      ctx.drawImage(img, 0, 0);
      
      // 设置水印样式
      const fontSize = Math.max(16, img.width * 0.03); // 根据图片大小调整字体
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      
      // 计算水印位置（右下角）
      const padding = 10;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      const x = canvas.width - textWidth - padding;
      const y = canvas.height - padding;
      
      // 添加背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(
        x - padding/2, 
        y - textHeight - padding/2, 
        textWidth + padding, 
        textHeight + padding
      );
      
      // 绘制文字
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(text, x, y - 5);
      
      // 转换为 base64
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}