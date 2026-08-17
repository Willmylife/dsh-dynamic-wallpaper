# dsh-dynamic-wallpaper

DeepSeek Harness (DSH) 动态壁纸插件：在设置页提供 7 种内置 Canvas 动态壁纸 + 自定义视频背景，支持速度、密度、遮罩透明度、模糊调节，所有配置存入 localStorage，刷新不丢失。

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

## 功能

- **7 种内置动态壁纸**，全部 Canvas 渲染，无外部资源
- **自定义视频**：粘贴 mp4/webm 等 http(s) 视频网址作为动态背景
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

修改 `lib/client.js` 后重启 web 服务器：

```bash
dsh web
```

## License

MIT
