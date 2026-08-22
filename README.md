# dsh-dynamic-wallpaper

DeepSeek Harness (DSH) 动态壁纸插件：在设置页提供 8 种内置 Canvas 动态壁纸 + 自定义视频背景，支持速度、密度、遮罩透明度、模糊调节，所有配置存入 localStorage，刷新不丢失。

灵感来自 [dsh-skin](https://github.com/KinGao294/dsh-skin)，采用相同的插件结构（浏览器侧实现 + cordis loader entry）。

## 内置壁纸

| 壁纸 | 效果 |
| --- | --- |
| 粒子 (particles) | 漂浮连线粒子网络 |
| 流星雨 (meteors) | 夜空流星划过 |
| 星际穿梭 (starfield) | 3D 星空飞行 |
| 波光 (waves) | 层叠正弦波浪 |
| 雨幕 (rain) | 深夜落雨 |
| 气泡 (bubbles) | 深海上浮气泡 |
| 字符雨 (matrix) | 黑客帝国风数字雨 |
| 极光 (aurora) | 流动极光帷幕与湖面倒影 |

## 功能

- **8 种内置动态壁纸**，全部 Canvas 渲染，无外部资源
- **自定义视频**：粘贴可直接播放的 http(s) 视频网址，或导入本地 MP4 / WebM / OGV / MOV / M4V 文件作为动态背景
- **内置免版权预设**：设置面板提供热带沙滩 / 自然光斑 / 城市夜景三个 Pexels 视频一键试用
- 本地导入的视频保存在浏览器 IndexedDB 中，刷新或重启后自动恢复；隐私模式等存储受限环境下需重新导入
- 切换视频时会先在后台预加载，加载成功才替换当前壁纸，失败时原壁纸保留并给出具体原因（防盗链/跨域、格式不支持、解码失败、超时）
- 远程视频能通过格式校验不代表一定可播放：需要登录、依赖 Referer、防盗链或不允许跨域嵌入的来源可能加载失败
- **速度 / 密度 / 遮罩 / 模糊** 四个滑杆实时调节
- 动画透在主内容区和侧栏上，消息气泡保持不透明，不影响可读性
- 页面隐藏时自动暂停动画/视频，省电
- 配置持久化（localStorage），刷新后自动恢复

## 安装

```bash
dsh plugin --profile web add -w /path/to/dsh-dynamic-wallpaper
dsh web
```

从 npm 安装：

```bash
dsh plugin --profile web add -w dsh-dynamic-wallpaper
dsh web
```

安装后打开 设置 → 通用，即可看到「动态壁纸」面板。

## 开发

修改 `lib/client.js` 后重启 web 服务器，并运行零依赖的语法与绘制烟雾测试：

```bash
npm run check
npm test
dsh web
```

`npm test` 会让每种内置壁纸在标准、最高与最低密度下完成 Canvas 绘制，捕获浏览器端绘制逻辑的运行时错误。

## License

MIT
