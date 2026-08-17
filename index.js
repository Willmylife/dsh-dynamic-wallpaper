const canvas = require('canvas');
const { createCanvas } = canvas;

// 动态壁纸配置
const config = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 30, // 秒
  output: 'dynamic-wallpaper.gif'
};

// 颜色渐变
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

// 创建画布
const canvasEl = createCanvas(config.width, config.height);
const ctx = canvasEl.getContext('2d');

// 动画参数
let time = 0;
const frames = [];

// 生成动画帧
for (let frame = 0; frame < config.fps * config.duration; frame++) {
  time = frame / config.fps;
  
  // 清空画布
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, config.width, config.height);
  
  // 绘制渐变圆圈
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const radius = Math.min(config.width, config.height) * 0.4;
  
  const grad = ctx.createRadialGradient(
    centerX, centerY, radius * 0.3,
    centerX, centerY, radius
  );
  grad.addColorStop(0, colors[frame % colors.length]);
  grad.addColorStop(1, colors[(frame + 1) % colors.length]);
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * (0.5 + Math.sin(time) * 0.2), 0, Math.PI * 2);
  ctx.fill();
  
  // 绘制小圆点
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const x = centerX + Math.cos(time * 2 + i) * radius * 0.7;
    const y = centerY + Math.sin(time * 2 + i) * radius * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  frames.push(canvasEl.toBuffer('image/jpeg', { quality: 0.8 }));
}

// 保存为 GIF
const gifEncoder = new canvas.GIFEncoder(config.width, config.height);
gifEncoder.start();
gifEncoder.setRepeat(0); // 无限循环
gifEncoder.setQuality(10);
gifEncoder.setDelay(1000 / config.fps);

frames.forEach(frame => {
  gifEncoder.addFrame(frame);
});

gifEncoder.finish();
const fs = require('fs');
fs.writeFileSync(config.output, gifEncoder.out.getData());

// 生成缩略图
const thumbCanvas = createCanvas(400, 225);
const thumbCtx = thumbCanvas.getContext('2d');
thumbCtx.drawImage(canvasEl, 0, 0, 400, 225);
fs.writeFileSync('thumb.jpg', thumbCanvas.toBuffer('image/jpeg'));

console.log('动态壁纸生成完成:');
console.log('- 动态壁纸: dynamic-wallpaper.gif');
console.log('- 缩略图: thumb.jpg');