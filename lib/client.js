// dsh-dynamic-wallpaper — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-dynamic-wallpaper/client.js
// and executed through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load), the same shape as dsh-skin.
//
// Features:
//   * 7 built-in canvas-animated wallpapers (particles, meteors, starfield,
//     waves, rain, bubbles, matrix) rendered on a fixed backdrop canvas.
//   * Custom animated wallpaper via video URL (http(s)/data:video).
//   * Speed / density / opacity / blur sliders, live preview-free apply.
//   * Everything persisted in localStorage; survives reloads.
window.__ModuleLoader__.load({
	id: "dsh-dynamic-wallpaper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _react = require("react");
		let _runtime_client = require("@deepseek-ai/dsh-client-runtime/client");

		//#region definitions
		const SETTINGS_NS = "settings.dynbg";
		const KEY_TYPE = "dsh-dynbg:type";
		const KEY_SPEED = "dsh-dynbg:speed";
		const KEY_DENSITY = "dsh-dynbg:density";
		const KEY_OPACITY = "dsh-dynbg:opacity";
		const KEY_BLUR = "dsh-dynbg:blur";
		const KEY_VIDEO = "dsh-dynbg:video";
		const DEFAULT_TYPE = "none";
		const DEFAULT_SPEED = 1;
		const DEFAULT_DENSITY = 1;
		const DEFAULT_OPACITY = 0.35;
		const DEFAULT_BLUR = 0;
		const OVERRIDE_SOURCE = "dsh-dynbg:wallpaper";
		const BUILTIN_BASE = {
			light: "rgb(255, 255, 255)",
			dark: "rgb(21, 21, 23)"
		};

		/** Built-in animated wallpapers. Each draw(ctx, w, h, t, dt, cfg) renders one frame. */
		const WALLPAPERS = [
			{
				id: "particles",
				labelKey: "particles",
				descKey: "particlesDesc",
				draw(ctx, w, h, t, dt, cfg) {
					const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.max(w, h) * 0.8);
					grad.addColorStop(0, "#131b30");
					grad.addColorStop(1, "#090d1a");
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					const n = Math.round(80 * cfg.density);
					const ps = cfg._particles ??= [];
					while (ps.length < n) ps.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02, r: 1 + Math.random() * 2.2, p: Math.random() * 6.28 });
					ps.length = n;
					const link = 0.14 * w;
					for (const p of ps) {
						p.x += p.vx * dt * cfg.speed;
						p.y += p.vy * dt * cfg.speed;
						if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1;
						if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1;
						const tw = 0.55 + 0.45 * Math.sin(t * 0.0015 + p.p);
						const x = p.x * w, y = p.y * h;
						const halo = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
						halo.addColorStop(0, `rgba(158, 186, 255, ${0.5 * tw})`);
						halo.addColorStop(1, "rgba(158, 186, 255, 0)");
						ctx.fillStyle = halo;
						ctx.beginPath();
						ctx.arc(x, y, p.r * 4, 0, 6.2832);
						ctx.fill();
						ctx.fillStyle = `rgba(210, 226, 255, ${0.85 * tw})`;
						ctx.beginPath();
						ctx.arc(x, y, p.r, 0, 6.2832);
						ctx.fill();
					}
					ctx.lineWidth = 1;
					for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
						const dx = (ps[i].x - ps[j].x) * w, dy = (ps[i].y - ps[j].y) * h;
						const d2 = dx * dx + dy * dy;
						if (d2 < link * link) {
							ctx.strokeStyle = `rgba(140, 170, 235, ${0.22 * (1 - Math.sqrt(d2) / link)})`;
							ctx.beginPath();
							ctx.moveTo(ps[i].x * w, ps[i].y * h);
							ctx.lineTo(ps[j].x * w, ps[j].y * h);
							ctx.stroke();
						}
					}
				}
			},
			{
				id: "meteors",
				labelKey: "meteors",
				descKey: "meteorsDesc",
				draw(ctx, w, h, t, dt, cfg) {
					const grad = ctx.createLinearGradient(0, 0, 0, h);
					grad.addColorStop(0, "#040615");
					grad.addColorStop(0.55, "#0a1130");
					grad.addColorStop(1, "#182142");
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					// twinkling stars
					const ns = Math.round(150 * Math.max(0.6, cfg.density));
					const stars = cfg._mstars ??= [];
					while (stars.length < ns) stars.push({ x: Math.random(), y: Math.random() * 0.85, r: 0.4 + Math.random() * 1.2, p: Math.random() * 6.28, s: 0.5 + Math.random() * 2 });
					stars.length = ns;
					for (const s of stars) {
						const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.001 * s.s + s.p));
						ctx.fillStyle = `rgba(235, 240, 255, ${tw * 0.9})`;
						ctx.beginPath();
						ctx.arc(s.x * w, s.y * h, s.r, 0, 6.2832);
						ctx.fill();
					}
					// crescent moon with soft halo
					const mx = w * 0.78, my = h * 0.18, mr = Math.min(w, h) * 0.05;
					const halo = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 6);
					halo.addColorStop(0, "rgba(255, 243, 210, 0.28)");
					halo.addColorStop(0.4, "rgba(255, 243, 210, 0.08)");
					halo.addColorStop(1, "rgba(255, 243, 210, 0)");
					ctx.fillStyle = halo;
					ctx.beginPath();
					ctx.arc(mx, my, mr * 6, 0, 6.2832);
					ctx.fill();
					ctx.fillStyle = "#f7efd2";
					ctx.beginPath();
					ctx.arc(mx, my, mr, 0, 6.2832);
					ctx.fill();
					ctx.fillStyle = "#0a1130";
					ctx.beginPath();
					ctx.arc(mx + mr * 0.42, my - mr * 0.24, mr * 0.9, 0, 6.2832);
					ctx.fill();
					// meteors with glowing heads
					const n = Math.max(2, Math.round(6 * cfg.density));
					const ms = cfg._meteors ??= [];
					while (ms.length < n) ms.push({ x: Math.random(), y: -0.1, v: 0.25 + Math.random() * 0.3, len: 0.1 + Math.random() * 0.15, a: 0.5 + Math.random() * 0.5 });
					for (const m of ms) {
						m.x -= m.v * dt * cfg.speed * 0.4;
						m.y += m.v * dt * cfg.speed;
						if (m.y > 1.1 || m.x < -0.2) { m.x = 0.6 + Math.random() * 0.6; m.y = -0.15; m.a = 0.5 + Math.random() * 0.5; }
						const x = m.x * w, y = m.y * h, l = m.len * Math.min(w, h);
						const fade = Math.min(1, Math.min(m.y + 0.15, 1.05 - m.y) * 6);
						const g = ctx.createLinearGradient(x, y, x + l * 0.6, y - l);
						g.addColorStop(0, `rgba(230, 240, 255, ${m.a * fade})`);
						g.addColorStop(1, "rgba(230, 240, 255, 0)");
						ctx.strokeStyle = g;
						ctx.lineWidth = 1.8;
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x + l * 0.6, y - l);
						ctx.stroke();
						const head = ctx.createRadialGradient(x, y, 0, x, y, 5);
						head.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fade})`);
						head.addColorStop(1, "rgba(255, 255, 255, 0)");
						ctx.fillStyle = head;
						ctx.beginPath();
						ctx.arc(x, y, 5, 0, 6.2832);
						ctx.fill();
					}
				}
			},
			{
				id: "starfield",
				labelKey: "starfield",
				descKey: "starfieldDesc",
				draw(ctx, w, h, t, dt, cfg) {
					const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
					grad.addColorStop(0, "#0c1230");
					grad.addColorStop(1, "#02030a");
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					const n = Math.round(220 * cfg.density);
					const ss = cfg._stars ??= [];
					while (ss.length < n) ss.push({ z: Math.random(), ang: Math.random() * 6.2832, hue: Math.random() });
					ss.length = n;
					const cx = w / 2, cy = h / 2;
					for (const s of ss) {
						s.z -= dt * 0.06 * cfg.speed;
						if (s.z <= 0.02) { s.z = 1; s.ang = Math.random() * 6.2832; }
						const r = (1 - s.z) * Math.max(w, h) * 0.7;
						const x = cx + Math.cos(s.ang) * r, y = cy + Math.sin(s.ang) * r;
						const size = (1 - s.z) * 2.6;
						const tint = s.hue < 0.25 ? "255, 224, 214" : s.hue < 0.5 ? "214, 228, 255" : "235, 240, 255";
						ctx.fillStyle = `rgba(${tint}, ${0.25 + (1 - s.z) * 0.75})`;
						ctx.fillRect(x, y, size, size);
						if (s.z < 0.25) {
							ctx.strokeStyle = `rgba(${tint}, ${(0.25 - s.z) * 1.2})`;
							ctx.lineWidth = size * 0.5;
							ctx.beginPath();
							ctx.moveTo(cx + Math.cos(s.ang) * r * 0.92, cy + Math.sin(s.ang) * r * 0.92);
							ctx.lineTo(x, y);
							ctx.stroke();
						}
					}
				}
			},
			{
				id: "waves",
				labelKey: "waves",
				descKey: "wavesDesc",
				draw(ctx, w, h, t, dt, cfg) {
					const grad = ctx.createLinearGradient(0, 0, 0, h);
					grad.addColorStop(0, "#061426");
					grad.addColorStop(0.6, "#0a2440");
					grad.addColorStop(1, "#0e3a5c");
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					// moonlight shimmer band on the water
					const mx = w * 0.72;
					const shimmer = ctx.createLinearGradient(mx - w * 0.08, 0, mx + w * 0.08, h);
					shimmer.addColorStop(0, "rgba(255, 244, 214, 0)");
					shimmer.addColorStop(0.5, `rgba(255, 244, 214, ${0.05 + 0.03 * Math.sin(t * 0.001)})`);
					shimmer.addColorStop(1, "rgba(255, 244, 214, 0)");
					ctx.fillStyle = shimmer;
					ctx.fillRect(mx - w * 0.08, h * 0.4, w * 0.16, h * 0.6);
					const bands = Math.max(2, Math.round(4 * cfg.density));
					for (let b = 0; b < bands; b++) {
						const yBase = h * (0.45 + (b / bands) * 0.45);
						const amp = h * 0.05 * (1 + b * 0.3);
						const phase = t * 0.0006 * cfg.speed * (1 + b * 0.25);
						ctx.beginPath();
						ctx.moveTo(0, h);
						for (let x = 0; x <= w; x += 10) {
							const k = x / w * 4 * Math.PI;
							ctx.lineTo(x, yBase + Math.sin(k + phase) * amp + Math.sin(k * 0.5 - phase * 0.7) * amp * 0.5);
						}
						ctx.lineTo(w, h);
						ctx.closePath();
						const fill = ctx.createLinearGradient(0, yBase - amp, 0, h);
						fill.addColorStop(0, `rgba(90, 170, 235, ${0.28 + b * 0.1})`);
						fill.addColorStop(1, `rgba(30, 90, 160, ${0.12 + b * 0.05})`);
						ctx.fillStyle = fill;
						ctx.fill();
						// crest highlight
						ctx.strokeStyle = `rgba(190, 225, 255, ${0.25 + b * 0.08})`;
						ctx.lineWidth = 1.2;
						ctx.beginPath();
						for (let x = 0; x <= w; x += 10) {
							const k = x / w * 4 * Math.PI;
							const y = yBase + Math.sin(k + phase) * amp + Math.sin(k * 0.5 - phase * 0.7) * amp * 0.5;
							if (x === 0) ctx.moveTo(x, y);
							else ctx.lineTo(x, y);
						}
						ctx.stroke();
					}
				}
			},
			{
				id: "rain",
				labelKey: "rain",
				descKey: "rainDesc",
				draw(ctx, w, h, t, dt, cfg) {
					const grad = ctx.createLinearGradient(0, 0, 0, h);
					grad.addColorStop(0, "#070a12");
					grad.addColorStop(1, "#101828");
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					// distant city glow
					const glow = ctx.createRadialGradient(w * 0.3, h, 0, w * 0.3, h, h * 0.7);
					glow.addColorStop(0, "rgba(255, 176, 90, 0.10)");
					glow.addColorStop(1, "rgba(255, 176, 90, 0)");
					ctx.fillStyle = glow;
					ctx.fillRect(0, 0, w, h);
					// three depth layers of rain
					for (let layer = 0; layer < 3; layer++) {
						const depth = 0.5 + layer * 0.35;
						const n = Math.round((60 - layer * 12) * cfg.density);
						const key = "_rain" + layer;
						const rs = cfg[key] ??= [];
						while (rs.length < n) rs.push({ x: Math.random(), y: Math.random(), v: 0.5 + Math.random() * 0.5 });
						rs.length = n;
						ctx.strokeStyle = `rgba(170, 200, 235, ${0.12 + layer * 0.1})`;
						ctx.lineWidth = 0.8 + layer * 0.4;
						for (const r of rs) {
							r.y += r.v * depth * dt * cfg.speed;
							if (r.y > 1.05) { r.y = -0.08; r.x = Math.random(); }
							const x = r.x * w, y = r.y * h, l = (0.03 + layer * 0.02) * h;
							ctx.beginPath();
							ctx.moveTo(x, y);
							ctx.lineTo(x - 2.5 * depth, y - l * depth);
							ctx.stroke();
						}
					}
					// occasional lightning
					const bolt = cfg._bolt ??= { next: 3 + Math.random() * 6, flash: 0 };
					bolt.next -= dt;
					if (bolt.next <= 0) { bolt.next = 6 + Math.random() * 14; bolt.flash = 0.5 + Math.random() * 0.4; }
					if (bolt.flash > 0.01) {
						bolt.flash *= Math.pow(0.02, dt);
						ctx.fillStyle = `rgba(200, 220, 255, ${bolt.flash * 0.25})`;
						ctx.fillRect(0, 0, w, h);
					}
				}
			},
			{
				id: "bubbles",
				labelKey: "bubbles",
				descKey: "bubblesDesc",
				draw(ctx, w, h, t, dt, cfg) {
					const grad = ctx.createLinearGradient(0, 0, 0, h);
					grad.addColorStop(0, "#03121c");
					grad.addColorStop(0.5, "#062635");
					grad.addColorStop(1, "#0a3a4d");
					ctx.fillStyle = grad;
					ctx.fillRect(0, 0, w, h);
					// light shafts from above
					for (let i = 0; i < 3; i++) {
						const sx = w * (0.2 + i * 0.3) + Math.sin(t * 0.0003 + i) * w * 0.02;
						const shaft = ctx.createLinearGradient(sx, 0, sx + w * 0.06, h);
						shaft.addColorStop(0, "rgba(120, 210, 235, 0.06)");
						shaft.addColorStop(1, "rgba(120, 210, 235, 0)");
						ctx.fillStyle = shaft;
						ctx.beginPath();
						ctx.moveTo(sx - w * 0.02, 0);
						ctx.lineTo(sx + w * 0.04, 0);
						ctx.lineTo(sx + w * 0.1, h);
						ctx.lineTo(sx - w * 0.04, h);
						ctx.closePath();
						ctx.fill();
					}
					const n = Math.round(50 * cfg.density);
					const bs = cfg._bubbles ??= [];
					while (bs.length < n) bs.push({ x: Math.random(), y: 1 + Math.random(), r: 3 + Math.random() * 9, v: 0.04 + Math.random() * 0.06, wob: Math.random() * 6.2832 });
					bs.length = n;
					for (const b of bs) {
						b.y -= b.v * dt * cfg.speed;
						b.wob += dt * 2 * cfg.speed;
						if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); }
						const x = (b.x + Math.sin(b.wob) * 0.01) * w, y = b.y * h;
						const g = ctx.createRadialGradient(x - b.r * 0.3, y - b.r * 0.3, b.r * 0.1, x, y, b.r);
						g.addColorStop(0, "rgba(200, 240, 250, 0.35)");
						g.addColorStop(0.7, "rgba(140, 220, 235, 0.06)");
						g.addColorStop(0.92, "rgba(160, 230, 245, 0.3)");
						g.addColorStop(1, "rgba(160, 230, 245, 0)");
						ctx.fillStyle = g;
						ctx.beginPath();
						ctx.arc(x, y, b.r, 0, 6.2832);
						ctx.fill();
						// specular highlight
						ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
						ctx.beginPath();
						ctx.arc(x - b.r * 0.35, y - b.r * 0.35, Math.max(0.6, b.r * 0.16), 0, 6.2832);
						ctx.fill();
					}
				}
			},
			{
				id: "matrix",
				labelKey: "matrix",
				descKey: "matrixDesc",
				draw(ctx, w, h, t, dt, cfg) {
					ctx.fillStyle = "rgba(2, 6, 4, 0.22)";
					ctx.fillRect(0, 0, w, h);
					const cols = Math.max(8, Math.round((w / 16) * cfg.density));
					const cw = w / cols;
					const drops = cfg._drops ??= [];
					while (drops.length < cols) drops.push({ y: Math.random() * -30, v: 8 + Math.random() * 12 });
					drops.length = cols;
					ctx.font = "13px monospace";
					for (let i = 0; i < cols; i++) {
						const d = drops[i];
						d.y += d.v * dt * cfg.speed;
						if (d.y * 14 > h + 40 && Math.random() < 0.02) d.y = 0;
						const ch = String.fromCharCode(0x4e00 + ((Math.random() * 200) | 0));
						// bright head, dimmer trailing chars
						ctx.fillStyle = Math.random() < 0.06 ? "#d8ffe8" : `rgba(70, 255, 140, ${0.35 + Math.random() * 0.45})`;
						ctx.shadowColor = "rgba(60, 255, 130, 0.8)";
						ctx.shadowBlur = 6;
						ctx.fillText(ch, i * cw, d.y * 14);
					}
					ctx.shadowBlur = 0;
				}
			}
		];
		const WALLPAPER_IDS = WALLPAPERS.map((x) => x.id);

		const zh = {
			"dynbg.title": "动态壁纸",
			"dynbg.none": "关闭",
			"dynbg.particles": "粒子",
			"dynbg.particlesDesc": "漂浮连线粒子",
			"dynbg.meteors": "流星雨",
			"dynbg.meteorsDesc": "夜空流星划过",
			"dynbg.starfield": "星际穿梭",
			"dynbg.starfieldDesc": "3D 星空飞行",
			"dynbg.waves": "波光",
			"dynbg.wavesDesc": "层叠正弦波浪",
			"dynbg.rain": "雨幕",
			"dynbg.rainDesc": "深夜落雨",
			"dynbg.bubbles": "气泡",
			"dynbg.bubblesDesc": "上浮的气泡",
			"dynbg.matrix": "字符雨",
			"dynbg.matrixDesc": "黑客帝国风",
			"dynbg.custom": "自定义视频",
			"dynbg.customDesc": "粘贴视频网址（mp4/webm）",
			"dynbg.speed": "速度",
			"dynbg.density": "密度",
			"dynbg.opacity": "界面遮罩",
			"dynbg.blur": "模糊",
			"dynbg.urlPlaceholder": "视频网址 (https://… .mp4)",
			"dynbg.urlApply": "应用",
			"dynbg.remove": "移除",
			"dynbg.errorInvalid": "请输入 http(s) 视频网址",
			"dynbg.hint": "数字越高，界面越实、壁纸越弱。动画透在主内容区和侧栏上，消息气泡保持不透明。"
		};
		const en = {
			"dynbg.title": "Animated wallpaper",
			"dynbg.none": "Off",
			"dynbg.particles": "Particles",
			"dynbg.particlesDesc": "Floating linked particles",
			"dynbg.meteors": "Meteor shower",
			"dynbg.meteorsDesc": "Meteors across a night sky",
			"dynbg.starfield": "Starfield",
			"dynbg.starfieldDesc": "3D star flight",
			"dynbg.waves": "Waves",
			"dynbg.wavesDesc": "Layered sine waves",
			"dynbg.rain": "Rain",
			"dynbg.rainDesc": "Night rainfall",
			"dynbg.bubbles": "Bubbles",
			"dynbg.bubblesDesc": "Rising bubbles",
			"dynbg.matrix": "Matrix",
			"dynbg.matrixDesc": "Digital rain",
			"dynbg.custom": "Custom video",
			"dynbg.customDesc": "Paste a video URL (mp4/webm)",
			"dynbg.speed": "Speed",
			"dynbg.density": "Density",
			"dynbg.opacity": "UI wash",
			"dynbg.blur": "Blur",
			"dynbg.urlPlaceholder": "Video URL (https://… .mp4)",
			"dynbg.urlApply": "Apply",
			"dynbg.remove": "Remove",
			"dynbg.errorInvalid": "Enter an http(s) video URL",
			"dynbg.hint": "Higher wash = more solid UI, weaker wallpaper. The animation shows through the main canvas and sidebar; bubbles stay opaque."
		};
		//#endregion

		//#region persistence
		function readStorage(key) {
			try {
				const value = window.localStorage.getItem(key);
				return typeof value === "string" ? value : null;
			} catch {
				return null;
			}
		}
		function writeStorage(key, value) {
			try {
				if (value === null) window.localStorage.removeItem(key);
				else window.localStorage.setItem(key, value);
				return true;
			} catch {
				return false;
			}
		}
		function readNumber(key, min, max, dflt) {
			const raw = readStorage(key);
			if (raw === null) return dflt;
			const value = Number(raw);
			return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : dflt;
		}
		function readType() {
			const raw = readStorage(KEY_TYPE);
			return raw === "custom" || WALLPAPER_IDS.includes(raw) ? raw : DEFAULT_TYPE;
		}
		function sanitizeVideoUrl(raw) {
			if (typeof raw !== "string") return null;
			const value = raw.trim();
			if (value === "" || /["'\n\r]/.test(value)) return null;
			if (/^blob:|^javascript:/i.test(value)) return null;
			if (/^data:video\//i.test(value)) return value;
			if (/^https?:\/\//i.test(value) && /\.(mp4|webm|ogv|mov)(\?|#|$)/i.test(value)) return value;
			return null;
		}
		//#endregion

		//#region wallpaper layer
		/** The fixed backdrop (z-index -1): a canvas or a <video>. */
		let layerEl = null;
		let rafId = null;
		let animCfg = { speed: DEFAULT_SPEED, density: DEFAULT_DENSITY, _particles: null, _meteors: null, _stars: null, _rain: null, _bubbles: null, _drops: null };
		let overrideDispose = null;
		let lastFrame = 0;

		function toRgba(color, alpha) {
			const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
			if (hex !== null) {
				let digits = hex[1];
				if (digits.length === 3) digits = digits.split("").map((char) => char + char).join("");
				const n = parseInt(digits, 16);
				return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
			}
			const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(color.trim());
			if (rgb !== null) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
			return color.trim();
		}

		/** Make the main canvas + sidebar translucent so the backdrop shows through. */
		function shadeTokens(ctx) {
			const snapshot = ctx.theme.getTheme();
			const alpha = readNumber(KEY_OPACITY, 0, 1, DEFAULT_OPACITY);
			const sidebarAlpha = Math.min(1, alpha + 0.1);
			const base = (scheme) => {
				const active = snapshot.active;
				if (active && active.colorScheme === scheme && active.tokens && typeof active.tokens["--dsw-alias-bg-base"] === "string") return active.tokens["--dsw-alias-bg-base"];
				return BUILTIN_BASE[scheme];
			};
			overrideDispose?.();
			overrideDispose = ctx.theme.overrideTokens(OVERRIDE_SOURCE, {
				"--dsw-alias-bg-base": { light: toRgba(base("light"), alpha), dark: toRgba(base("dark"), alpha) },
				"--dsw-specific-sidebar-fill": { light: toRgba(base("light"), sidebarAlpha), dark: toRgba(base("dark"), sidebarAlpha) }
			});
		}

		function ensureCanvas() {
			if (layerEl && layerEl.tagName === "CANVAS" && document.body.contains(layerEl)) return layerEl;
			teardownLayerEl();
			layerEl = document.createElement("canvas");
			layerEl.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%;display:block;";
			document.body.prepend(layerEl);
			return layerEl;
		}
		function ensureVideo(src) {
			if (layerEl && layerEl.tagName === "VIDEO" && document.body.contains(layerEl)) {
				if (layerEl.src !== src) layerEl.src = src;
				return layerEl;
			}
			teardownLayerEl();
			layerEl = document.createElement("video");
			layerEl.autoplay = true;
			layerEl.muted = true;
			layerEl.loop = true;
			layerEl.playsInline = true;
			layerEl.referrerPolicy = "no-referrer";
			layerEl.setAttribute("referrerpolicy", "no-referrer");
			layerEl.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%;object-fit:cover;";
			layerEl.src = src;
			document.body.prepend(layerEl);
			return layerEl;
		}
		function teardownLayerEl() {
			stopAnim();
			if (layerEl && layerEl.tagName === "VIDEO") {
				layerEl.pause();
				layerEl.removeAttribute("src");
				layerEl.load();
			}
			layerEl?.remove();
			layerEl = null;
		}

		function stopAnim() {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			lastFrame = 0;
		}

		function startAnim(ctx) {
			stopAnim();
			const canvas = layerEl;
			const c2d = canvas.getContext("2d");
			const wp = WALLPAPERS.find((x) => x.id === readType());
			if (!wp) return;
			animCfg = { speed: readNumber(KEY_SPEED, 0.1, 4, DEFAULT_SPEED), density: readNumber(KEY_DENSITY, 0.2, 3, DEFAULT_DENSITY), _particles: animCfg._particles, _meteors: animCfg._meteors, _stars: animCfg._stars, _rain: animCfg._rain, _bubbles: animCfg._bubbles, _drops: animCfg._drops };
			const blur = readNumber(KEY_BLUR, 0, 60, DEFAULT_BLUR);
			canvas.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
			const tick = (now) => {
				const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016;
				lastFrame = now;
				if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
					canvas.width = Math.max(1, canvas.clientWidth);
					canvas.height = Math.max(1, canvas.clientHeight);
				}
				if (!document.hidden) wp.draw(c2d, canvas.width, canvas.height, now, dt, animCfg);
				rafId = requestAnimationFrame(tick);
			};
			rafId = requestAnimationFrame(tick);
		}

		let applying = false;
		let applyRaf = null;
		function applyWallpaper(ctx) {
			if (applying || !document.body) return;
			applying = true;
			try {
				const type = readType();
				if (type === DEFAULT_TYPE) {
					teardownLayerEl();
					overrideDispose?.();
					overrideDispose = null;
					return;
				}
				if (type === "custom") {
					const url = sanitizeVideoUrl(readStorage(KEY_VIDEO));
					if (url === null) {
						writeStorage(KEY_VIDEO, null);
						writeStorage(KEY_TYPE, null);
						teardownLayerEl();
						overrideDispose?.();
						overrideDispose = null;
						return;
					}
					const video = ensureVideo(url);
					const blur = readNumber(KEY_BLUR, 0, 60, DEFAULT_BLUR);
					video.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
					if (!document.hidden) {
						const p = video.play();
						if (p && typeof p.catch === "function") p.catch(function () {});
					}
				} else {
					ensureCanvas();
					startAnim(ctx);
				}
				shadeTokens(ctx);
			} finally {
				applying = false;
			}
		}
		function scheduleApply(ctx) {
			if (applyRaf !== null) return;
			applyRaf = requestAnimationFrame(function () {
				applyRaf = null;
				applyWallpaper(ctx);
			});
		}
		function onVisibility() {
			if (layerEl && layerEl.tagName === "VIDEO") {
				if (document.hidden) layerEl.pause();
				else {
					const p = layerEl.play();
					if (p && typeof p.catch === "function") p.catch(function () {});
				}
			}
		}
		function teardown() {
			if (applyRaf !== null) {
				cancelAnimationFrame(applyRaf);
				applyRaf = null;
			}
			document.removeEventListener("visibilitychange", onVisibility);
			teardownLayerEl();
			overrideDispose?.();
			overrideDispose = null;
		}
		//#endregion

		//#region settings row
		const styles = {
			group: { borderBottom: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0" },
			title: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", fontWeight: 400, lineHeight: "22px" },
			hint: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", lineHeight: "18px" },
			error: { color: "var(--dsw-alias-state-error-primary)", fontSize: "12px", lineHeight: "18px" },
			grid: { display: "flex", flexWrap: "wrap", gap: "10px" },
			card: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "96px", padding: "3px", borderRadius: "10px", border: "2px solid transparent", background: "transparent", cursor: "pointer", font: "inherit", boxSizing: "border-box" },
			cardSelected: { borderColor: "var(--dsw-alias-brand-primary)", background: "var(--dsw-alias-interactive-bg-hover)" },
			cardLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", lineHeight: "16px", whiteSpace: "nowrap" },
			cardLabelSelected: { color: "var(--dsw-alias-label-primary)" },
			cardDesc: { color: "var(--dsw-alias-label-tertiary)", fontSize: "11px", lineHeight: "14px" },
			button: { height: "32px", padding: "0 14px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-button-elevated-fill)", color: "var(--dsw-alias-label-primary)", cursor: "pointer", fontSize: "13px", font: "inherit", boxSizing: "border-box" },
			buttonDanger: { color: "var(--dsw-alias-state-error-primary)" },
			sliderRow: { display: "flex", alignItems: "center", gap: "10px", minWidth: "240px" },
			sliderLabel: { color: "var(--dsw-alias-label-secondary)", fontSize: "13px", whiteSpace: "nowrap", width: "72px" },
			slider: { flex: 1, accentColor: "var(--dsw-alias-brand-primary)" },
			sliderValue: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px", whiteSpace: "nowrap", width: "44px", textAlign: "right" },
			urlRow: { display: "flex", alignItems: "center", gap: "10px" },
			urlInput: { flex: "1 1 180px", height: "32px", padding: "0 10px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-1)", color: "var(--dsw-alias-label-primary)", font: "inherit", boxSizing: "border-box" },
			preview: { width: "72px", height: "44px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)" }
		};

		/** Static gradient chip previewing one wallpaper. */
		function CardChip({ id }) {
			const backgrounds = {
				none: "linear-gradient(90deg, #f4f4f5 50%, #1c1c20 50%)",
				particles: "radial-gradient(circle at 30% 40%, #3a4a6a, #101726)",
				meteors: "linear-gradient(135deg, #0b1026, #26365e)",
				starfield: "radial-gradient(circle at 50% 50%, #1a2340, #05060f)",
				waves: "linear-gradient(180deg, #0a1a2f, #1a4a70)",
				rain: "linear-gradient(180deg, #0a0d14, #1c2a3a)",
				bubbles: "linear-gradient(180deg, #071a24, #0a3a4a)",
				matrix: "linear-gradient(180deg, #030805, #0a2a14)"
			};
			return (0, react_jsx_runtime.jsx)("div", {
				style: { width: "100%", height: "52px", borderRadius: "8px", background: backgrounds[id] ?? "#222", border: "1px solid var(--dsw-alias-border-l2)", boxSizing: "border-box" }
			});
		}

		function Slider({ label, value, min, max, step, format, onChange }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.sliderRow,
				children: [
					(0, react_jsx_runtime.jsx)("span", { style: styles.sliderLabel, children: label }),
					(0, react_jsx_runtime.jsx)("input", { type: "range", min, max, step, value, style: styles.slider, onChange: (event) => onChange(Number(event.target.value)) }),
					(0, react_jsx_runtime.jsx)("span", { style: styles.sliderValue, children: format(value) })
				]
			});
		}

		function WallpaperRow({ t, setType, setSpeed, setDensity, setOpacity, setBlur, setVideo, useStore }) {
			const type = useStore((s) => s.type);
			const speed = useStore((s) => s.speed);
			const density = useStore((s) => s.density);
			const opacity = useStore((s) => s.opacity);
			const blur = useStore((s) => s.blur);
			const videoUrl = useStore((s) => s.video);
			const error = useStore((s) => s.error);
			const [urlInput, setUrlInput] = (0, _react.useState)("");
			const applyUrl = () => {
				const sanitized = sanitizeVideoUrl(urlInput);
				if (sanitized === null) {
					setVideo(null, "invalid");
					return;
				}
				setVideo(sanitized, null);
				setUrlInput("");
			};
			const cards = [{ id: DEFAULT_TYPE, labelKey: "none" }, ...WALLPAPERS.map((x) => ({ id: x.id, labelKey: x.labelKey, descKey: x.descKey })), { id: "custom", labelKey: "custom", descKey: "customDesc" }];
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", { style: styles.title, children: t("dynbg.title") }),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.grid,
						children: cards.map((card) => {
							const selected = type === card.id;
							return (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-pressed": selected,
								onClick: () => setType(card.id),
								style: { ...styles.card, ...(selected ? styles.cardSelected : {}) },
								children: [
									(0, react_jsx_runtime.jsx)(CardChip, { id: card.id }),
									(0, react_jsx_runtime.jsx)("span", { style: { ...styles.cardLabel, ...(selected ? styles.cardLabelSelected : {}) }, children: t("dynbg." + card.labelKey) }),
									card.descKey ? (0, react_jsx_runtime.jsx)("span", { style: styles.cardDesc, children: t("dynbg." + card.descKey) }) : null
								]
							}, card.id);
						})
					}),
					type === "custom" ? (0, react_jsx_runtime.jsxs)("div", {
						style: styles.urlRow,
						children: [
							(0, react_jsx_runtime.jsx)("input", { type: "text", value: urlInput, placeholder: t("dynbg.urlPlaceholder"), style: styles.urlInput, onChange: (event) => setUrlInput(event.target.value), onKeyDown: (event) => { if (event.key === "Enter") applyUrl(); } }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: applyUrl, children: t("dynbg.urlApply") }),
							videoUrl ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
								children: [
									(0, react_jsx_runtime.jsx)("video", { src: videoUrl, muted: true, loop: true, autoPlay: !document.hidden, playsInline: true, referrerPolicy: "no-referrer", style: styles.preview }),
									(0, react_jsx_runtime.jsx)("button", { type: "button", style: { ...styles.button, ...styles.buttonDanger }, onClick: () => setVideo(null, null), children: t("dynbg.remove") })
								]
							}) : null
						]
					}) : null,
					type !== DEFAULT_TYPE ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
						children: [
							type !== "custom" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
								children: [
									(0, react_jsx_runtime.jsx)(Slider, { label: t("dynbg.speed"), value: speed, min: 0.1, max: 4, step: 0.1, format: (v) => `${v.toFixed(1)}x`, onChange: setSpeed }),
									(0, react_jsx_runtime.jsx)(Slider, { label: t("dynbg.density"), value: Math.round(density * 100), min: 20, max: 300, step: 5, format: (v) => `${v}%`, onChange: (v) => setDensity(v / 100) })
								]
							}) : null,
							(0, react_jsx_runtime.jsx)(Slider, { label: t("dynbg.opacity"), value: Math.round(opacity * 100), min: 0, max: 100, step: 1, format: (v) => `${v}%`, onChange: setOpacity }),
							(0, react_jsx_runtime.jsx)(Slider, { label: t("dynbg.blur"), value: blur, min: 0, max: 60, step: 1, format: (v) => `${v}px`, onChange: setBlur })
						]
					}) : null,
					error ? (0, react_jsx_runtime.jsx)("div", { style: styles.error, children: t("dynbg.errorInvalid") }) : null,
					(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("dynbg.hint") })
				]
			});
		}
		//#endregion

		//#region plugin body
		const inject = ["slots", "locale", "theme"];

		function createWallpaperStore() {
			return (0, _runtime_client.defineStore)({
				init: () => ({ type: DEFAULT_TYPE, speed: DEFAULT_SPEED, density: DEFAULT_DENSITY, opacity: DEFAULT_OPACITY, blur: DEFAULT_BLUR, video: null, error: null, revision: -1 }),
				actions: {
					sync: (d, type, speed, density, opacity, blur, video, error, revision) => {
						if (revision <= d.revision) return;
						d.type = type;
						d.speed = speed;
						d.density = density;
						d.opacity = opacity;
						d.blur = blur;
						d.video = video;
						d.error = error;
						d.revision = revision;
					}
				}
			});
		}

		function apply(ctx) {
			let revision = 0;
			let rowError = null;
			const store = createWallpaperStore();
			let bound;
			const sync = () => {
				revision += 1;
				bound?.sync(readType(), readNumber(KEY_SPEED, 0.1, 4, DEFAULT_SPEED), readNumber(KEY_DENSITY, 0.2, 3, DEFAULT_DENSITY), readNumber(KEY_OPACITY, 0, 1, DEFAULT_OPACITY), readNumber(KEY_BLUR, 0, 60, DEFAULT_BLUR), sanitizeVideoUrl(readStorage(KEY_VIDEO)), rowError, revision);
			};

			document.addEventListener("visibilitychange", onVisibility);
			applyWallpaper(ctx);
			sync();
			ctx.effect(() => () => {
				teardown();
			}, "dsh-dynamic-wallpaper: cleanup");

			// A theme/scheme switch changes the base color; re-shade the wash.
			let lastShadedKey = null;
			ctx.on("theme/change", (snapshot) => {
				const key = `${snapshot.active?.id ?? ""}:${snapshot.active?.colorScheme ?? ""}`;
				if (readType() !== DEFAULT_TYPE && key !== lastShadedKey) {
					lastShadedKey = key;
					scheduleApply(ctx);
				}
			});

			ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "dsh-dynamic-wallpaper: dictionaries");

			const injected = (actions) => {
				bound = actions;
				sync();
				return {
					setType: (type) => {
						if (type !== "custom" && type !== DEFAULT_TYPE && !WALLPAPER_IDS.includes(type)) return;
						writeStorage(KEY_TYPE, type === DEFAULT_TYPE ? null : type);
						rowError = null;
						sync();
						scheduleApply(ctx);
					},
					setSpeed: (value) => {
						writeStorage(KEY_SPEED, String(Math.min(4, Math.max(0.1, value))));
						sync();
						scheduleApply(ctx);
					},
					setDensity: (value) => {
						writeStorage(KEY_DENSITY, String(Math.min(3, Math.max(0.2, value))));
						sync();
						scheduleApply(ctx);
					},
					setOpacity: (percent) => {
						writeStorage(KEY_OPACITY, String(Math.min(1, Math.max(0, percent / 100))));
						sync();
						scheduleApply(ctx);
					},
					setBlur: (px) => {
						writeStorage(KEY_BLUR, String(Math.min(60, Math.max(0, px))));
						sync();
						scheduleApply(ctx);
					},
					setVideo: (url, error) => {
						if (url === null) {
							writeStorage(KEY_VIDEO, null);
							if (error === null && readType() === "custom") writeStorage(KEY_TYPE, null);
						} else if (!writeStorage(KEY_VIDEO, url)) {
							rowError = "save";
							sync();
							return;
						}
						rowError = error;
						sync();
						scheduleApply(ctx);
					}
				};
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "dynbg",
				order: 40,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, WallpaperRow));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		exports.WALLPAPERS = WALLPAPERS;
		return module.exports;
	}
});
