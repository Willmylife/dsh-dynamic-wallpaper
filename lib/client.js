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
					// Trailing fade instead of a hard fill keeps particle motion readable as light trails.
					ctx.fillStyle = "rgba(9, 13, 26, 0.22)";
					ctx.fillRect(0, 0, w, h);
					// Re-paint the colour blooms on top of the fade so the background doesn't wash out.
					ctx.globalCompositeOperation = "lighter";
					for (const bloom of [{ x: 0.22, y: 0.3, color: "70, 120, 255", phase: 0 }, { x: 0.76, y: 0.62, color: "185, 90, 255", phase: 2.1 }, { x: 0.5, y: 0.12, color: "50, 220, 210", phase: 4.3 }]) {
						const driftX = bloom.x * w + Math.sin(t * 0.00012 + bloom.phase) * w * 0.06;
						const driftY = bloom.y * h + Math.cos(t * 0.0001 + bloom.phase) * h * 0.05;
						const glow = ctx.createRadialGradient(driftX, driftY, 0, driftX, driftY, Math.min(w, h) * 0.42);
						glow.addColorStop(0, `rgba(${bloom.color}, 0.10)`);
						glow.addColorStop(1, `rgba(${bloom.color}, 0)`);
						ctx.fillStyle = glow;
						ctx.fillRect(0, 0, w, h);
					}
					ctx.globalCompositeOperation = "source-over";
					const n = Math.round(80 * cfg.density);
					const ps = cfg._particles ??= [];
					while (ps.length < n) ps.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02, r: 1 + Math.random() * 2.2, p: Math.random() * 6.28, tint: Math.random() < 0.2 ? "222, 182, 255" : Math.random() < 0.45 ? "155, 242, 234" : "158, 186, 255", trail: [] });
					ps.length = n;
					const link = 0.14 * w;
					// Pointer pull: nearby particles drift toward the cursor, giving the network a sense of touch.
					const px = pointer.x, py = pointer.y;
					const ptrActive = pointer.active && (t - pointer.lastMove) < 4000;
					const ptrX = px * w, ptrY = py * h;
					const pullR = Math.min(w, h) * 0.22;
					const cells = new Map();
					for (let i = 0; i < ps.length; i++) {
						const p = ps[i];
						if (ptrActive) {
							const dxp = px - p.x, dyp = py - p.y;
							const d2p = (dxp * dxp + dyp * dyp);
							if (d2p < 0.05) {
								const f = (0.05 - d2p) / 0.05;
								p.vx += dxp * f * 0.6 * dt * cfg.speed;
								p.vy += dyp * f * 0.6 * dt * cfg.speed;
							}
						}
						// gentle damping so the pointer pull doesn't spiral into chaos
						p.vx *= 0.985; p.vy *= 0.985;
						// cap velocity
						const sp = Math.hypot(p.vx, p.vy);
						if (sp > 0.06) { p.vx *= 0.06 / sp; p.vy *= 0.06 / sp; }
						p.x += p.vx * dt * cfg.speed;
						p.y += p.vy * dt * cfg.speed;
						if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1;
						if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1;
						const tw = 0.55 + 0.45 * Math.sin(t * 0.0015 + p.p);
						const x = p.x * w, y = p.y * h;
						// short motion trail (4 samples) for a streak of light
						p.trail.push(x); p.trail.push(y);
						if (p.trail.length > 8) p.trail.splice(0, 2);
						if (p.trail.length >= 4) {
							ctx.strokeStyle = `rgba(${p.tint}, ${0.12 * tw})`;
							ctx.lineWidth = p.r * 0.8;
							ctx.beginPath();
							ctx.moveTo(p.trail[0], p.trail[1]);
							for (let k = 2; k < p.trail.length; k += 2) ctx.lineTo(p.trail[k], p.trail[k + 1]);
							ctx.stroke();
						}
						const halo = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
						halo.addColorStop(0, `rgba(${p.tint}, ${0.5 * tw})`);
						halo.addColorStop(1, `rgba(${p.tint}, 0)`);
						ctx.fillStyle = halo;
						ctx.beginPath();
						ctx.arc(x, y, p.r * 4, 0, 6.2832);
						ctx.fill();
						ctx.fillStyle = `rgba(${p.tint}, ${0.85 * tw})`;
						ctx.beginPath();
						ctx.arc(x, y, p.r, 0, 6.2832);
						ctx.fill();
						const cellX = Math.floor(x / link), cellY = Math.floor(y / link);
						const key = `${cellX}:${cellY}`;
						const cell = cells.get(key);
						if (cell) cell.push(i);
						else cells.set(key, [i]);
					}
					ctx.lineWidth = 1;
					for (let i = 0; i < ps.length; i++) {
						const p = ps[i];
						const cellX = Math.floor((p.x * w) / link), cellY = Math.floor((p.y * h) / link);
						for (let offsetX = -1; offsetX <= 1; offsetX++) for (let offsetY = -1; offsetY <= 1; offsetY++) {
							const candidates = cells.get(`${cellX + offsetX}:${cellY + offsetY}`) ?? [];
							for (const j of candidates) {
								if (j <= i) continue;
								const q = ps[j];
								const dx = (p.x - q.x) * w, dy = (p.y - q.y) * h;
								const d2 = dx * dx + dy * dy;
								if (d2 < link * link) {
									const dn = Math.sqrt(d2) / link;
									// gradient line tinted by both endpoints, brighter near the cursor
									const grad = ctx.createLinearGradient(p.x * w, p.y * h, q.x * w, q.y * h);
									const boost = ptrActive ? Math.max(0, 1 - Math.hypot((p.x - px) * w, (p.y - py) * h) / pullR) : 0;
									grad.addColorStop(0, `rgba(${p.tint}, ${(0.20 + boost * 0.4) * (1 - dn)})`);
									grad.addColorStop(1, `rgba(${q.tint}, ${(0.20 + boost * 0.4) * (1 - dn)})`);
									ctx.strokeStyle = grad;
									ctx.beginPath();
									ctx.moveTo(p.x * w, p.y * h);
									ctx.lineTo(q.x * w, q.y * h);
									ctx.stroke();
								}
							}
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
					// Milky Way band: a soft diagonal haze across the sky gives the night depth.
					ctx.save();
					ctx.translate(w * 0.5, h * 0.5);
					ctx.rotate(-0.42);
					const mw = ctx.createLinearGradient(0, -h * 0.18, 0, h * 0.18);
					mw.addColorStop(0, "rgba(120, 140, 200, 0)");
					mw.addColorStop(0.5, "rgba(150, 170, 230, 0.16)");
					mw.addColorStop(1, "rgba(120, 140, 200, 0)");
					ctx.fillStyle = mw;
					ctx.fillRect(-w * 0.9, -h * 0.18, w * 1.8, h * 0.36);
					ctx.restore();
					// twinkling stars
					const ns = Math.round(150 * Math.max(0.6, cfg.density));
					const stars = cfg._mstars ??= [];
					while (stars.length < ns) stars.push({ x: Math.random(), y: Math.random() * 0.85, r: 0.4 + Math.random() * 1.2, p: Math.random() * 6.28, s: 0.5 + Math.random() * 2 });
					stars.length = ns;
					for (const s of stars) {
						const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.001 * s.s + s.p));
						// a few stars get a subtle cross flare when at peak brightness
						if (tw > 0.88 && s.r > 0.9) {
							const x = s.x * w, y = s.y * h;
							ctx.strokeStyle = `rgba(235, 240, 255, ${tw * 0.35})`;
							ctx.lineWidth = 0.6;
							ctx.beginPath();
							ctx.moveTo(x - s.r * 3, y); ctx.lineTo(x + s.r * 3, y);
							ctx.moveTo(x, y - s.r * 3); ctx.lineTo(x, y + s.r * 3);
							ctx.stroke();
						}
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
					// distant mountain silhouette at the horizon grounds the sky
					const horizonY = h * 0.78;
					ctx.fillStyle = "rgba(8, 12, 30, 0.9)";
					ctx.beginPath();
					ctx.moveTo(0, horizonY);
					const peaks = cfg._peaks ??= [];
					while (peaks.length < 14) peaks.push({ x: peaks.length / 14, h: 0.04 + Math.random() * 0.10 });
					for (const p of peaks) ctx.lineTo(p.x * w, horizonY - p.h * h);
					ctx.lineTo(w, horizonY);
					ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
					ctx.fill();
					// meteors with glowing heads
					const n = Math.max(2, Math.round(6 * cfg.density));
					const ms = cfg._meteors ??= [];
					while (ms.length < n) ms.push({ x: Math.random(), y: -0.1, v: 0.25 + Math.random() * 0.3, len: 0.1 + Math.random() * 0.15, a: 0.5 + Math.random() * 0.5, fireball: Math.random() < 0.18, hue: 20 + Math.random() * 40 });
					for (const m of ms) {
						m.x -= m.v * dt * cfg.speed * 0.4;
						m.y += m.v * dt * cfg.speed;
						if (m.y > 1.1 || m.x < -0.2) { m.x = 0.6 + Math.random() * 0.6; m.y = -0.15; m.a = 0.5 + Math.random() * 0.5; m.fireball = Math.random() < 0.18; }
						const x = m.x * w, y = m.y * h, l = m.len * Math.min(w, h);
						const fade = Math.min(1, Math.min(m.y + 0.15, 1.05 - m.y) * 6);
						const tailCol = m.fireball ? `255, ${180 + Math.sin(t * 0.01) * 30 | 0}, 120` : "230, 240, 255";
						const g = ctx.createLinearGradient(x, y, x + l * 0.6, y - l);
						g.addColorStop(0, `rgba(${tailCol}, ${m.a * fade})`);
						g.addColorStop(1, `rgba(${tailCol}, 0)`);
						ctx.strokeStyle = g;
						ctx.lineWidth = m.fireball ? 2.6 : 1.8;
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x + l * 0.6, y - l);
						ctx.stroke();
						const headR = m.fireball ? 7 : 5;
						const head = ctx.createRadialGradient(x, y, 0, x, y, headR);
						head.addColorStop(0, `rgba(255, 255, 255, ${0.9 * fade})`);
						head.addColorStop(1, "rgba(255, 255, 255, 0)");
						ctx.fillStyle = head;
						ctx.beginPath();
						ctx.arc(x, y, headR, 0, 6.2832);
						ctx.fill();
						// fireball sparks trailing behind
						if (m.fireball) {
							const sparks = cfg._msparks ??= [];
							if (Math.random() < 0.6) sparks.push({ x, y, vx: (Math.random() - 0.5) * 0.5, vy: 0.2 + Math.random() * 0.4, life: 1, hue: m.hue });
							for (let i = sparks.length - 1; i >= 0; i--) {
								const sp = sparks[i];
								sp.x += sp.vx; sp.y += sp.vy; sp.life -= dt * 1.6;
								if (sp.life <= 0) { sparks.splice(i, 1); continue; }
								ctx.fillStyle = `rgba(255, ${160 + sp.hue | 0}, 80, ${sp.life * 0.7})`;
								ctx.beginPath();
								ctx.arc(sp.x, sp.y, 1.2 * sp.life + 0.3, 0, 6.2832);
								ctx.fill();
							}
						}
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
					// A distant spiral galaxy gives the flight a clear destination instead of an empty star tunnel.
					const driftX = Math.sin(t * 0.00008) * w * 0.04;
					const driftY = Math.cos(t * 0.00011) * h * 0.04;
					const gx = w * 0.72 + driftX, gy = h * 0.3 + driftY, gr = Math.min(w, h) * 0.3;
					const nebula = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
					nebula.addColorStop(0, "rgba(235, 245, 255, 0.5)");
					nebula.addColorStop(0.1, "rgba(135, 180, 255, 0.28)");
					nebula.addColorStop(0.45, "rgba(120, 82, 220, 0.11)");
					nebula.addColorStop(1, "rgba(20, 10, 55, 0)");
					ctx.fillStyle = nebula;
					ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
					const galaxyCount = Math.round(90 * cfg.density);
					const galaxy = cfg._galaxy ??= [];
					while (galaxy.length < galaxyCount) galaxy.push({ arm: Math.random() < 0.5 ? 0 : 1, r: Math.pow(Math.random(), 0.72), phase: (Math.random() - 0.5) * 0.55, size: 0.45 + Math.random() * 1.5, tint: Math.random() < 0.2 ? "255, 205, 180" : "205, 220, 255" });
					galaxy.length = galaxyCount;
					for (const s of galaxy) {
						const r = s.r * gr;
						const angle = s.arm * Math.PI + s.r * 10 + s.phase + t * 0.00002;
						const x = gx + Math.cos(angle) * r;
						const y = gy + Math.sin(angle) * r * 0.36;
						ctx.fillStyle = `rgba(${s.tint}, ${0.15 + (1 - s.r) * 0.75})`;
						ctx.fillRect(x, y, s.size, s.size);
					}
					// Supernova pulse: a slow-blooming bright core that fades, giving occasional drama.
					const sn = cfg._supernova ??= { phase: Math.random(), on: false, t: 0 };
					sn.t += dt * 0.05;
					const snCycle = (Math.sin(sn.t) * 0.5 + 0.5);
					if (snCycle > 0.92 && !sn.on) { sn.on = true; sn.x = 0.2 + Math.random() * 0.6; sn.y = 0.2 + Math.random() * 0.6; }
					if (sn.on) {
						sn.phase += dt * 0.6;
						const a = Math.sin(sn.phase * Math.PI);
						if (sn.phase >= 1) { sn.on = false; sn.phase = 0; }
						else {
							const sx = sn.x * w, sy = sn.y * h;
							const sR = Math.min(w, h) * (0.04 + sn.phase * 0.22);
							const sGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sR);
							sGrad.addColorStop(0, `rgba(255, 250, 230, ${a * 0.7})`);
							sGrad.addColorStop(0.3, `rgba(255, 200, 160, ${a * 0.3})`);
							sGrad.addColorStop(1, "rgba(255, 200, 160, 0)");
							ctx.fillStyle = sGrad;
							ctx.fillRect(sx - sR, sy - sR, sR * 2, sR * 2);
							// expanding shockwave ring
							ctx.strokeStyle = `rgba(255, 240, 220, ${a * 0.4})`;
							ctx.lineWidth = 1.5;
							ctx.beginPath();
							ctx.arc(sx, sy, sR * 0.7, 0, 6.2832);
							ctx.stroke();
						}
					}
					const n = Math.round(220 * cfg.density);
					const ss = cfg._stars ??= [];
					while (ss.length < n) ss.push({ z: Math.random(), ang: Math.random() * 6.2832, hue: Math.random() });
					ss.length = n;
					const cx = w / 2, cy = h / 2;
					// subtle camera sway parallax shifts the vanishing point
					const sway = Math.sin(t * 0.0003) * 0.06;
					const ccx = cx + sway * w, ccy = cy + Math.cos(t * 0.00027) * h * 0.05;
					for (const s of ss) {
						s.z -= dt * 0.06 * cfg.speed;
						if (s.z <= 0.02) { s.z = 1; s.ang = Math.random() * 6.2832; }
						const r = (1 - s.z) * Math.max(w, h) * 0.7;
						const x = ccx + Math.cos(s.ang) * r, y = ccy + Math.sin(s.ang) * r;
						const size = (1 - s.z) * 2.6;
						const tint = s.hue < 0.25 ? "255, 224, 214" : s.hue < 0.5 ? "214, 228, 255" : "235, 240, 255";
						ctx.fillStyle = `rgba(${tint}, ${0.25 + (1 - s.z) * 0.75})`;
						ctx.fillRect(x, y, size, size);
						if (s.z < 0.25) {
							ctx.strokeStyle = `rgba(${tint}, ${(0.25 - s.z) * 1.2})`;
							ctx.lineWidth = size * 0.5;
							ctx.beginPath();
							ctx.moveTo(ccx + Math.cos(s.ang) * r * 0.92, ccy + Math.sin(s.ang) * r * 0.92);
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
					const mx = w * 0.72, my = h * 0.21, mr = Math.min(w, h) * 0.065;
					const moonHalo = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 5);
					moonHalo.addColorStop(0, "rgba(255, 244, 214, 0.3)");
					moonHalo.addColorStop(0.45, "rgba(255, 244, 214, 0.08)");
					moonHalo.addColorStop(1, "rgba(255, 244, 214, 0)");
					ctx.fillStyle = moonHalo;
					ctx.beginPath();
					ctx.arc(mx, my, mr * 5, 0, 6.2832);
					ctx.fill();
					ctx.fillStyle = "#f6edcf";
					ctx.beginPath();
					ctx.arc(mx, my, mr, 0, 6.2832);
					ctx.fill();
					ctx.fillStyle = "rgba(165, 151, 125, 0.2)";
					for (const crater of [[-0.28, -0.16, 0.16], [0.22, 0.18, 0.12], [-0.08, 0.34, 0.1]]) {
						ctx.beginPath();
						ctx.arc(mx + crater[0] * mr, my + crater[1] * mr, crater[2] * mr, 0, 6.2832);
						ctx.fill();
					}
					// moonlight shimmer band on the water
					const shimmer = ctx.createLinearGradient(mx - w * 0.08, 0, mx + w * 0.08, h);
					shimmer.addColorStop(0, "rgba(255, 244, 214, 0)");
					shimmer.addColorStop(0.5, `rgba(255, 244, 214, ${0.05 + 0.03 * Math.sin(t * 0.001)})`);
					shimmer.addColorStop(1, "rgba(255, 244, 214, 0)");
					ctx.fillStyle = shimmer;
					ctx.fillRect(mx - w * 0.08, h * 0.4, w * 0.16, h * 0.6);
					// Broken moon reflection on the water — a column of shimmering segments under the moon.
					ctx.fillStyle = "rgba(255, 244, 214, 0.5)";
					for (let i = 0; i < 10; i++) {
						const ry = h * (0.45 + i * 0.05);
						const wob = Math.sin(t * 0.0012 + i * 0.6) * w * 0.012;
						const segW = mr * (1.4 - i * 0.08) * (0.7 + 0.3 * Math.sin(t * 0.002 + i));
						const segA = 0.22 * (1 - i * 0.08) * (0.6 + 0.4 * Math.abs(Math.sin(t * 0.0014 + i * 1.3)));
						ctx.globalAlpha = segA;
						ctx.fillRect(mx - segW * 0.5 + wob, ry, segW, 2 + Math.sin(t * 0.003 + i) * 1.2);
					}
					ctx.globalAlpha = 1;
					// Occasional water splash droplets launched from a wave crest.
					const splashes = cfg._splash ??= [];
					if (Math.random() < 0.04 * cfg.density) splashes.push({ x: Math.random() * w, y: h * 0.5, vy: -(2 + Math.random() * 3), life: 1, peak: 0 });
					for (let i = splashes.length - 1; i >= 0; i--) {
						const sp = splashes[i];
						sp.vy += 14 * dt;
						sp.y += sp.vy * dt * 60 * 0.016;
						sp.life -= dt * 0.8;
						if (sp.life <= 0) { splashes.splice(i, 1); continue; }
						ctx.fillStyle = `rgba(220, 240, 255, ${sp.life * 0.5})`;
						ctx.beginPath();
						ctx.arc(sp.x, sp.y, 1.4, 0, 6.2832);
						ctx.fill();
					}
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
					const rippleCount = Math.round(32 * cfg.density);
					const ripples = cfg._ripples ??= [];
					while (ripples.length < rippleCount) ripples.push({ x: Math.random(), y: 0.5 + Math.random() * 0.45, length: 0.01 + Math.random() * 0.06, phase: Math.random() * 6.28, alpha: 0.08 + Math.random() * 0.2 });
					ripples.length = rippleCount;
					ctx.lineWidth = 1;
					for (const ripple of ripples) {
						const y = ripple.y * h + Math.sin(t * 0.0012 + ripple.phase) * 3;
						const x = ripple.x * w + Math.sin(t * 0.0008 + ripple.phase) * w * 0.015;
						ctx.strokeStyle = `rgba(235, 245, 255, ${ripple.alpha})`;
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x + ripple.length * w, y + Math.sin(t * 0.001 + ripple.phase) * 1.5);
						ctx.stroke();
					}
					// Foreground capillary ripples: dense short filaments that read as surface tension.
					const capCount = Math.round(70 * cfg.density);
					const caps = cfg._caps ??= [];
					while (caps.length < capCount) caps.push({ x: Math.random(), y: 0.55 + Math.random() * 0.42, len: 0.004 + Math.random() * 0.018, phase: Math.random() * 6.28, sp: 0.5 + Math.random() * 1.5 });
					caps.length = capCount;
					ctx.lineWidth = 0.6;
					for (const c of caps) {
						const y = c.y * h + Math.sin(t * 0.002 * c.sp + c.phase) * 2;
						const x = c.x * w + Math.sin(t * 0.0015 + c.phase) * w * 0.01;
						ctx.strokeStyle = `rgba(210, 235, 255, ${0.06 + 0.06 * Math.sin(t * 0.003 + c.phase)})`;
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x + c.len * w, y + Math.sin(t * 0.002 + c.phase) * 0.8);
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
					// Window lights: scattered warm pinpoints flickering on the city silhouette.
					const windows = cfg._rwin ??= [];
					while (windows.length < 40) windows.push({ x: Math.random() * 0.9 + 0.05, y: 0.7 + Math.random() * 0.18, ph: Math.random() * 6.28, sp: 0.3 + Math.random() * 1.2 });
					for (const win of windows) {
						const f = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.001 * win.sp + win.ph));
						ctx.fillStyle = `rgba(255, 200, 110, ${f * 0.5})`;
						ctx.fillRect(win.x * w, win.y * h, 1.6, 1.6);
					}
					// Drifting fog bands soften the middle distance.
					for (let i = 0; i < 3; i++) {
						const fy = h * (0.45 + i * 0.12);
						const fx = (t * 0.004 * (i + 1) * cfg.speed) % (w * 1.4) - w * 0.2;
						const fog = ctx.createLinearGradient(0, fy, 0, fy + h * 0.18);
						fog.addColorStop(0, "rgba(160, 180, 210, 0)");
						fog.addColorStop(0.5, `rgba(160, 180, 210, ${0.05 - i * 0.01})`);
						fog.addColorStop(1, "rgba(160, 180, 210, 0)");
						ctx.fillStyle = fog;
						ctx.fillRect(fx, fy, w * 0.8, h * 0.18);
					}
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
							if (r.y > 1.05) {
								// a raindrop hits the wet ground and spawns a splash ripple
								if (layer === 2 && Math.random() < 0.5) {
									const spl = cfg._rsplash ??= [];
									spl.push({ x: r.x * w, y: h * 0.92, r: 1, life: 1 });
								}
								r.y = -0.08; r.x = Math.random();
							}
							const x = r.x * w, y = r.y * h, l = (0.03 + layer * 0.02) * h;
							ctx.beginPath();
							ctx.moveTo(x, y);
							ctx.lineTo(x - 2.5 * depth, y - l * depth);
							ctx.stroke();
						}
					}
					// Splash ripples expanding on the wet ground.
					const splashes = cfg._rsplash ??= [];
					for (let i = splashes.length - 1; i >= 0; i--) {
						const s = splashes[i];
						s.r += dt * 40 * cfg.speed;
						s.life -= dt * 1.4;
						if (s.life <= 0) { splashes.splice(i, 1); continue; }
						ctx.strokeStyle = `rgba(190, 215, 245, ${s.life * 0.35})`;
						ctx.lineWidth = 0.8;
						ctx.beginPath();
						ctx.ellipse(s.x, s.y, s.r, s.r * 0.3, 0, 0, 6.2832);
						ctx.stroke();
					}
					// Wet ground reflection sheen at the very bottom.
					const sheen = ctx.createLinearGradient(0, h * 0.85, 0, h);
					sheen.addColorStop(0, "rgba(120, 150, 190, 0)");
					sheen.addColorStop(1, "rgba(120, 150, 190, 0.08)");
					ctx.fillStyle = sheen;
					ctx.fillRect(0, h * 0.85, w, h * 0.15);
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
					// Soft caustics make the water surface feel alive even between bubbles.
					ctx.lineWidth = 1.2;
					for (let band = 0; band < 4; band++) {
						const y = h * (0.08 + band * 0.1);
						ctx.strokeStyle = `rgba(135, 235, 245, ${0.06 - band * 0.008})`;
						ctx.beginPath();
						for (let x = 0; x <= w; x += 18) {
							const waveY = y + Math.sin(x * 0.025 + t * 0.001 + band) * 5 + Math.sin(x * 0.06 - t * 0.0007) * 2;
							if (x === 0) ctx.moveTo(x, waveY);
							else ctx.lineTo(x, waveY);
						}
						ctx.stroke();
					}
					const planktonCount = Math.round(34 * cfg.density);
					const plankton = cfg._plankton ??= [];
					while (plankton.length < planktonCount) plankton.push({ x: Math.random(), y: Math.random(), v: 0.008 + Math.random() * 0.02, phase: Math.random() * 6.28, size: 0.4 + Math.random() * 1.1 });
					plankton.length = planktonCount;
					for (const speck of plankton) {
						speck.y -= speck.v * dt * cfg.speed;
						if (speck.y < -0.02) { speck.y = 1.02; speck.x = Math.random(); }
						ctx.fillStyle = "rgba(170, 245, 238, 0.32)";
						ctx.fillRect((speck.x + Math.sin(t * 0.001 + speck.phase) * 0.008) * w, speck.y * h, speck.size, speck.size);
					}
					// Distant out-of-focus micro-bubbles: a depth layer of tiny dim specks drifting up.
					const farCount = Math.round(60 * cfg.density);
					const fars = cfg._fbubbles ??= [];
					while (fars.length < farCount) fars.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, v: 0.01 + Math.random() * 0.03, ph: Math.random() * 6.28 });
					fars.length = farCount;
					ctx.fillStyle = "rgba(140, 210, 230, 0.18)";
					for (const f of fars) {
						f.y -= f.v * dt * cfg.speed;
						if (f.y < -0.02) { f.y = 1.02; f.x = Math.random(); }
						const x = (f.x + Math.sin(t * 0.0008 + f.ph) * 0.006) * w, y = f.y * h;
						ctx.beginPath();
						ctx.arc(x, y, f.r, 0, 6.2832);
						ctx.fill();
					}
					// Occasional jellyfish silhouette drifting up — a soft bell with trailing tentacles.
					const jellies = cfg._jellies ??= [];
					if (jellies.length < Math.max(1, Math.round(2 * cfg.density)) && Math.random() < 0.004) {
						jellies.push({ x: 0.15 + Math.random() * 0.7, y: 1.1, v: 0.012 + Math.random() * 0.01, bell: 8 + Math.random() * 10, ph: Math.random() * 6.28, hue: Math.random() < 0.5 ? "180, 120, 220" : "120, 200, 230" });
					}
					for (let i = jellies.length - 1; i >= 0; i--) {
						const j = jellies[i];
						j.y -= j.v * dt * cfg.speed;
						j.ph += dt * 1.2 * cfg.speed;
						if (j.y < -0.15) { jellies.splice(i, 1); continue; }
						const x = j.x * w + Math.sin(t * 0.0006 + j.ph) * w * 0.02, y = j.y * h;
						// bell
						const bg = ctx.createRadialGradient(x, y, j.bell * 0.2, x, y, j.bell);
						bg.addColorStop(0, `rgba(${j.hue}, 0.22)`);
						bg.addColorStop(1, `rgba(${j.hue}, 0)`);
						ctx.fillStyle = bg;
						ctx.beginPath();
						ctx.ellipse(x, y, j.bell, j.bell * 0.7, 0, Math.PI, 2 * Math.PI);
						ctx.fill();
						// tentacles
						ctx.strokeStyle = `rgba(${j.hue}, 0.18)`;
						ctx.lineWidth = 0.9;
						for (let k = -2; k <= 2; k++) {
							ctx.beginPath();
							ctx.moveTo(x + k * j.bell * 0.3, y + j.bell * 0.3);
							ctx.quadraticCurveTo(x + k * j.bell * 0.3 + Math.sin(j.ph + k) * 4, y + j.bell * 2.2, x + k * j.bell * 0.3 + Math.sin(j.ph + k + 1) * 6, y + j.bell * 3.8);
							ctx.stroke();
						}
					}
					const n = Math.round(50 * cfg.density);
					const bs = cfg._bubbles ??= [];
					while (bs.length < n) bs.push({ x: Math.random(), y: 1 + Math.random(), r: 3 + Math.random() * 9, v: 0.04 + Math.random() * 0.06, wob: Math.random() * 6.2832 });
					bs.length = n;
					const pops = cfg._bpops ??= [];
					for (const b of bs) {
						b.y -= b.v * dt * cfg.speed;
						b.wob += dt * 2 * cfg.speed;
						if (b.y < -0.05) {
							// bubble reaches the surface and pops into a ring
							if (b.y < 0 && b.y > -0.06) pops.push({ x: (b.x + Math.sin(b.wob) * 0.01) * w, y: h * 0.04, r: b.r, life: 1 });
							b.y = 1.05; b.x = Math.random();
						}
						const x = (b.x + Math.sin(b.wob) * 0.01) * w, y = b.y * h;
						ctx.strokeStyle = "rgba(150, 230, 240, 0.1)";
						ctx.lineWidth = Math.max(0.6, b.r * 0.11);
						ctx.beginPath();
						ctx.moveTo(x, y + b.r * 0.6);
						ctx.lineTo(x - Math.sin(b.wob) * b.r * 1.4, y + b.r * 4);
						ctx.stroke();
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
					// surface pop rings
					for (let i = pops.length - 1; i >= 0; i--) {
						const p = pops[i];
						p.r += dt * 18 * cfg.speed;
						p.life -= dt * 1.8;
						if (p.life <= 0) { pops.splice(i, 1); continue; }
						ctx.strokeStyle = `rgba(180, 235, 245, ${p.life * 0.4})`;
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.arc(p.x, p.y, p.r, 0, 6.2832);
						ctx.stroke();
					}
				}
			},
			{
				id: "matrix",
				labelKey: "matrix",
				descKey: "matrixDesc",
					draw(ctx, w, h, t, dt, cfg) {
					// Trail fade varies with speed: faster = longer ghosting trails.
					const fadeA = 0.22 - Math.min(0.14, (cfg.speed - 0.1) * 0.05);
					ctx.fillStyle = `rgba(2, 6, 4, ${fadeA})`;
					ctx.fillRect(0, 0, w, h);
					const cols = Math.max(8, Math.round((w / 16) * cfg.density));
					const cw = w / cols;
					const drops = cfg._drops ??= [];
					while (drops.length < cols) drops.push({ y: Math.random() * -30, v: 8 + Math.random() * 12, trail: 4 + ((Math.random() * 12) | 0), pulse: 0 });
					drops.length = cols;
					// A horizontal glitch band sweeps across every few seconds, offsetting a slice of the rain.
					const glitch = cfg._mglitch ??= { t: 0, active: false, y: 0, h: 0, dx: 0 };
					glitch.t -= dt;
					if (glitch.t <= 0 && !glitch.active) { glitch.t = 3 + Math.random() * 6; if (Math.random() < 0.6) { glitch.active = true; glitch.y = Math.random() * h; glitch.h = 8 + Math.random() * 24; glitch.dx = (Math.random() - 0.5) * cw * 6; glitch.life = 0.4 + Math.random() * 0.3; } }
					if (glitch.active) {
						glitch.life -= dt;
						if (glitch.life <= 0) glitch.active = false;
					}
					ctx.font = "13px monospace";
					for (let i = 0; i < cols; i++) {
						const d = drops[i];
						d.y += d.v * dt * cfg.speed;
						if (d.y * 14 > h + 40 && Math.random() < 0.02) { d.y = 0; d.trail = 4 + ((Math.random() * 12) | 0); }
						// occasional bright pulse traveling down this column
						if (d.pulse > 0) d.pulse -= dt * 2;
						else if (Math.random() < 0.002) d.pulse = 1;
						const colX = i * cw;
						// draw a fading trail of recent characters behind the head
						for (let k = 1; k <= d.trail; k++) {
							const ty = d.y - k;
							if (ty < -1) continue;
							const tch = String.fromCharCode(0x4e00 + ((Math.random() * 200) | 0));
							const ta = (1 - k / d.trail) * 0.4;
							ctx.fillStyle = `rgba(70, 255, 140, ${ta})`;
							ctx.shadowColor = "rgba(60, 255, 130, 0.8)";
							ctx.shadowBlur = 6;
							ctx.fillText(tch, colX, ty * 14);
						}
						const ch = String.fromCharCode(0x4e00 + ((Math.random() * 200) | 0));
						// bright head, dimmer trailing chars; pulse turns a column briefly cyan-white
						let headColor, glow;
						if (d.pulse > 0) { headColor = "#bdfcff"; glow = "rgba(120, 240, 255, 0.9)"; }
						else if (Math.random() < 0.06) { headColor = "#d8ffe8"; glow = "rgba(60, 255, 130, 0.8)"; }
						else { headColor = `rgba(70, 255, 140, ${0.35 + Math.random() * 0.45})`; glow = "rgba(60, 255, 130, 0.8)"; }
						ctx.fillStyle = headColor;
						ctx.shadowColor = glow;
						ctx.shadowBlur = d.pulse > 0 ? 10 : 6;
						// glitch band offsets a horizontal slice of characters
						const drawX = (glitch.active && Math.abs(d.y * 14 - glitch.y) < glitch.h) ? colX + glitch.dx : colX;
						ctx.fillText(ch, drawX, d.y * 14);
					}
					ctx.shadowBlur = 0;
					// bottom green afterglow pooling where the rain lands
					const pool = ctx.createLinearGradient(0, h * 0.85, 0, h);
					pool.addColorStop(0, "rgba(20, 80, 35, 0)");
					pool.addColorStop(1, "rgba(20, 80, 35, 0.18)");
					ctx.fillStyle = pool;
					ctx.fillRect(0, h * 0.85, w, h * 0.15);
				}
			},
			{
				id: "aurora",
				labelKey: "aurora",
				descKey: "auroraDesc",
					draw(ctx, w, h, t, dt, cfg) {
// Deep polar-night sky with a subtle vertical gradient plus a faint horizon glow.
					const sky = ctx.createLinearGradient(0, 0, 0, h);
					sky.addColorStop(0, "#020410");
					sky.addColorStop(0.5, "#050d22");
					sky.addColorStop(0.85, "#0a1830");
					sky.addColorStop(1, "#0e2240");
					ctx.fillStyle = sky;
					ctx.fillRect(0, 0, w, h);
					// Milky Way diagonal band — a soft hazy stripe across the upper sky.
					ctx.save();
					ctx.translate(w * 0.5, h * 0.28);
					ctx.rotate(-0.38);
					const mw = ctx.createLinearGradient(0, -h * 0.16, 0, h * 0.16);
					mw.addColorStop(0, "rgba(120, 140, 210, 0)");
					mw.addColorStop(0.5, "rgba(150, 170, 235, 0.10)");
					mw.addColorStop(1, "rgba(120, 140, 210, 0)");
					ctx.fillStyle = mw;
					ctx.fillRect(-w * 0.9, -h * 0.16, w * 1.8, h * 0.32);
					ctx.restore();
					// Diffuse nebula puff near the upper-right for colour depth.
					const neb = ctx.createRadialGradient(w * 0.78, h * 0.2, 0, w * 0.78, h * 0.2, Math.min(w, h) * 0.35);
					neb.addColorStop(0, "rgba(80, 120, 200, 0.10)");
					neb.addColorStop(1, "rgba(80, 120, 200, 0)");
					ctx.fillStyle = neb;
					ctx.fillRect(0, 0, w, h);
					// Twinkling background stars (only above the horizon), with cross flare on the brightest.
					const ns = Math.round(140 * Math.max(0.6, cfg.density));
					const stars = cfg._astars ??= [];
					while (stars.length < ns) stars.push({ x: Math.random(), y: Math.random() * 0.55, r: 0.4 + Math.random() * 1.2, p: Math.random() * 6.28, s: 0.5 + Math.random() * 1.8 });
					stars.length = ns;
					for (const s of stars) {
						const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.001 * s.s + s.p));
						if (tw > 0.85 && s.r > 0.95) {
							const x = s.x * w, y = s.y * h;
							ctx.strokeStyle = `rgba(230, 240, 255, ${tw * 0.3})`;
							ctx.lineWidth = 0.5;
							ctx.beginPath();
							ctx.moveTo(x - s.r * 4, y); ctx.lineTo(x + s.r * 4, y);
							ctx.moveTo(x, y - s.r * 4); ctx.lineTo(x, y + s.r * 4);
							ctx.stroke();
						}
						ctx.fillStyle = `rgba(230, 240, 255, ${tw * 0.85})`;
						ctx.beginPath();
						ctx.arc(s.x * w, s.y * h, s.r, 0, 6.2832);
						ctx.fill();
					}
					const horizonY = h * 0.72;
					const curtainTop = h * 0.14;
					// Brightness field — layered sines that breathe and fold the curtain.
					const field = (x, tt) => {
						const k = x / w;
						const w1 = Math.sin(k * 6.2 + tt * 0.00028);
						const w2 = Math.sin(k * 3.1 - tt * 0.00019 + 1.7);
						const w3 = Math.sin(k * 11.0 + tt * 0.0004 + 0.6);
						return 0.5 + 0.32 * w1 + 0.22 * w2 + 0.12 * w3;
					};
					const reach = (x, tt) => {
						const k = x / w;
						return 0.75 + 0.18 * Math.sin(k * 4.3 + tt * 0.00022 + 0.4) + 0.10 * Math.sin(k * 9 - tt * 0.0003);
					};
					// Hue shift along x so the curtain's dominant colour drifts across the sky.
					const hueAt = (x, tt) => {
						const k = x / w;
						return (0.32 + 0.22 * Math.sin(k * 2.1 + tt * 0.00012) + 0.12 * Math.sin(k * 5.0 - tt * 0.0002) + 1) % 1;
					};
					// Convert hue [0..1] to an rgb triple spanning green->teal->blue->violet.
					const auroraColor = (hh) => {
						const seg = hh * 4;
						if (seg < 1) return [90, 255, 160 + seg * 60];
						if (seg < 2) { const f = seg - 1; return [90 - f * 40, 255 - f * 35, 220 + f * 20]; }
						if (seg < 3) { const f = seg - 2; return [50 + f * 70, 220 - f * 70, 240 + f * 15]; }
						const f = seg - 3; return [120 + f * 50, 150 - f * 30, 255];
					};
					ctx.globalCompositeOperation = "lighter";
					const colW = Math.max(2, Math.round(w / 220));
					// Back curtain: dimmer, taller — a secondary sheet behind the main one for depth.
					for (let x = 0; x < w; x += colW) {
						const bright = field(x + w * 0.13, t * cfg.speed * 0.8 + 1.2);
						if (bright < 0.46) continue;
						const top = curtainTop * 0.7 + (1 - reach(x, t * cfg.speed * 0.8)) * (horizonY - curtainTop) * 0.55;
						const col = auroraColor(hueAt(x, t * cfg.speed));
						const grad = ctx.createLinearGradient(x, top, x, horizonY);
						grad.addColorStop(0, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						grad.addColorStop(0.4, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, ${0.045 * bright})`);
						grad.addColorStop(1, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						ctx.fillStyle = grad;
						ctx.fillRect(x, top, colW + 1, horizonY - top);
					}
					// Main curtain: the prominent ray field.
					for (let x = 0; x < w; x += colW) {
						const bright = field(x, t * cfg.speed);
						if (bright < 0.42) continue;
						const top = curtainTop + (1 - reach(x, t * cfg.speed)) * (horizonY - curtainTop) * 0.4;
						const col = auroraColor(hueAt(x, t * cfg.speed));
						const grad = ctx.createLinearGradient(x, top, x, horizonY);
						grad.addColorStop(0, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						grad.addColorStop(0.15, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, ${0.07 * bright})`);
						grad.addColorStop(0.45, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, ${0.11 * bright})`);
						grad.addColorStop(0.78, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, ${0.07 * bright})`);
						grad.addColorStop(1, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						ctx.fillStyle = grad;
						ctx.fillRect(x, top, colW + 1, horizonY - top);
					}
					// Glowing curtain foot — soft pooled light along the lower edge, modulated by brightness.
					for (let x = 0; x < w; x += colW * 2) {
						const bright = field(x, t * cfg.speed);
						if (bright < 0.5) continue;
						const baseY = horizonY - (6 + reach(x, t * cfg.speed) * 28);
						const col = auroraColor(hueAt(x, t * cfg.speed));
						const r = 70;
						const glow = ctx.createRadialGradient(x, baseY, 0, x, baseY, r);
						glow.addColorStop(0, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, ${0.14 * bright})`);
						glow.addColorStop(1, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						ctx.fillStyle = glow;
						ctx.fillRect(x - r, baseY - r, r * 2, r * 2);
					}
					ctx.globalCompositeOperation = "source-over";
					// Mountain ranges: three receding smooth ridgelines with snow-cap highlights on the front layer.
					const ranges = cfg._apeaks ??= [];
					while (ranges.length < 3) {
						const i = ranges.length;
						ranges.push({ s1: 0.6 + Math.random() * 0.8, s2: 1.3 + Math.random() * 1.2, s3: 2.7 + Math.random() * 1.5, a1: 0.04 + Math.random() * 0.04, a2: 0.02 + Math.random() * 0.02, a3: 0.01 + Math.random() * 0.012, p: Math.random() * 6.28, drift: 0.00002 + Math.random() * 0.00003 });
					}
					const rangeCfg = [
						{ base: 0.70, shade: "rgba(12, 26, 48, 0.55)", scale: 0.7, snow: false },
						{ base: 0.75, shade: "rgba(6, 14, 30, 0.88)", scale: 1.0, snow: false },
						{ base: 0.80, shade: "rgba(2, 6, 16, 1)", scale: 1.25, snow: true }
					];
					// Precompute the front-range ridgeline points so we can stroke a snow highlight on the crest.
					const frontPoints = [];
					for (let r = 0; r < 3; r++) {
						const rg = ranges[r];
						const rc = rangeCfg[r];
						const baseY = h * rc.base;
						ctx.fillStyle = rc.shade;
						ctx.beginPath();
						ctx.moveTo(0, h);
						const step = Math.max(4, Math.round(w / 240));
						const pts = [];
						for (let x = 0; x <= w; x += step) {
							const k = x / w;
							const y = baseY - h * (rg.a1 * Math.sin(k * rg.s1 + rg.p + t * rg.drift) + rg.a2 * Math.sin(k * rg.s2 + rg.p * 1.7) + rg.a3 * Math.sin(k * rg.s3 - rg.p * 0.5)) * rc.scale;
							ctx.lineTo(x, y);
							if (rc.snow) pts.push({ x, y });
						}
						ctx.lineTo(w, h); ctx.closePath();
						ctx.fill();
						if (rc.snow) for (const p of pts) frontPoints.push(p);
					}
					// Snow-cap highlight: a thin bright stroke tracing the front ridge crest.
					if (frontPoints.length > 1) {
						ctx.strokeStyle = "rgba(200, 220, 240, 0.22)";
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(frontPoints[0].x, frontPoints[0].y);
						for (let i = 1; i < frontPoints.length; i++) ctx.lineTo(frontPoints[i].x, frontPoints[i].y);
						ctx.stroke();
					}
					// Lake reflection: mirror the aurora faintly into the water below the front range.
					ctx.save();
					ctx.globalCompositeOperation = "lighter";
					ctx.beginPath();
					ctx.rect(0, horizonY, w, h - horizonY);
					ctx.clip();
					ctx.translate(0, horizonY * 2);
					ctx.scale(1, -1);
					for (let x = 0; x < w; x += colW) {
						const bright = field(x, t * cfg.speed);
						if (bright < 0.42) continue;
						const top = curtainTop + (1 - reach(x, t * cfg.speed)) * (horizonY - curtainTop) * 0.4;
						const col = auroraColor(hueAt(x, t * cfg.speed));
						const grad = ctx.createLinearGradient(x, top, x, horizonY);
						grad.addColorStop(0, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						grad.addColorStop(0.45, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, ${0.05 * bright})`);
						grad.addColorStop(1, `rgba(${col[0]|0}, ${col[1]|0}, ${col[2]|0}, 0)`);
						ctx.fillStyle = grad;
						ctx.fillRect(x, top, colW + 1, horizonY - top);
					}
					ctx.restore();
					// A faint moonlight shimmer column on the water for a cold specular sheen.
					const moonX = w * 0.74;
					const shimmer = ctx.createLinearGradient(moonX - w * 0.06, 0, moonX + w * 0.06, h);
					shimmer.addColorStop(0, "rgba(200, 225, 255, 0)");
					shimmer.addColorStop(0.5, `rgba(200, 225, 255, ${0.04 + 0.02 * Math.sin(t * 0.0009)})`);
					shimmer.addColorStop(1, "rgba(200, 225, 255, 0)");
					ctx.fillStyle = shimmer;
					ctx.fillRect(moonX - w * 0.06, horizonY, w * 0.12, h - horizonY);
					// Ripple lines on the water surface — denser near the horizon.
					const rippleCount = Math.round(40 * cfg.density);
					const ripples = cfg._aripples ??= [];
					while (ripples.length < rippleCount) ripples.push({ x: Math.random(), y: 0.74 + Math.random() * 0.24, len: 0.01 + Math.random() * 0.05, phase: Math.random() * 6.28, alpha: 0.05 + Math.random() * 0.15 });
					ripples.length = rippleCount;
					ctx.lineWidth = 0.7;
					for (const r of ripples) {
						const y = r.y * h + Math.sin(t * 0.0014 + r.phase) * 2;
						const x = r.x * w + Math.sin(t * 0.001 + r.phase) * w * 0.012;
						ctx.strokeStyle = `rgba(180, 230, 255, ${r.alpha})`;
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x + r.len * w, y + Math.sin(t * 0.0012 + r.phase) * 1.2);
						ctx.stroke();
					}
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
			"dynbg.aurora": "极光",
			"dynbg.auroraDesc": "流动极光帷幕",
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
			"dynbg.errorVideo": "视频无法加载，请检查网址或网络连接",
			"dynbg.errorSave": "设置无法保存到本地",
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
			"dynbg.aurora": "Aurora",
			"dynbg.auroraDesc": "Flowing polar lights",
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
			"dynbg.errorVideo": "The video could not be loaded. Check the URL or network connection.",
			"dynbg.errorSave": "The setting could not be saved locally.",
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
		let pointer = { x: 0.5, y: 0.5, active: false, lastMove: 0 };
		let animCfg = { speed: DEFAULT_SPEED, density: DEFAULT_DENSITY, _particles: null, _meteors: null, _mstars: null, _peaks: null, _msparks: null, _stars: null, _galaxy: null, _supernova: null, _ripples: null, _caps: null, _splash: null, _rain0: null, _rain1: null, _rain2: null, _rwin: null, _rsplash: null, _bolt: null, _plankton: null, _fbubbles: null, _jellies: null, _bubbles: null, _bpops: null, _drops: null, _mglitch: null, _astars: null, _apeaks: null, _aripples: null };
		let overrideDispose = null;
		let lastFrame = 0;
		let activeCtx = null;
		let reportVideoError = null;

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
			// Pointer is tracked at window level so the particle field reacts even though
			// the backdrop sits behind the UI (pointer-events:none on the canvas itself).
			if (!pointer._bound) {
				pointer._bound = true;
				window.addEventListener("pointermove", (e) => {
					pointer.x = e.clientX / Math.max(1, window.innerWidth);
					pointer.y = e.clientY / Math.max(1, window.innerHeight);
					pointer.active = true;
					pointer.lastMove = performance.now();
				}, { passive: true });
				window.addEventListener("pointerleave", () => { pointer.active = false; });
			}
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
			layerEl.preload = "metadata";
			layerEl.referrerPolicy = "no-referrer";
			layerEl.setAttribute("referrerpolicy", "no-referrer");
			const video = layerEl;
			video.addEventListener("error", () => {
				if (layerEl === video && readType() === "custom") reportVideoError?.();
			});
			video.style.cssText = "position:fixed;inset:0;z-index:-1;pointer-events:none;width:100%;height:100%;object-fit:cover;";
			video.src = src;
			document.body.prepend(video);
			return video;
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
			if (!c2d) return;
			const wp = WALLPAPERS.find((x) => x.id === readType());
			if (!wp) return;
			animCfg = { speed: readNumber(KEY_SPEED, 0.1, 4, DEFAULT_SPEED), density: readNumber(KEY_DENSITY, 0.2, 3, DEFAULT_DENSITY), _particles: animCfg._particles, _meteors: animCfg._meteors, _mstars: animCfg._mstars, _peaks: animCfg._peaks, _msparks: animCfg._msparks, _stars: animCfg._stars, _galaxy: animCfg._galaxy, _supernova: animCfg._supernova, _ripples: animCfg._ripples, _caps: animCfg._caps, _splash: animCfg._splash, _rain0: animCfg._rain0, _rain1: animCfg._rain1, _rain2: animCfg._rain2, _rwin: animCfg._rwin, _rsplash: animCfg._rsplash, _bolt: animCfg._bolt, _plankton: animCfg._plankton, _fbubbles: animCfg._fbubbles, _jellies: animCfg._jellies, _bubbles: animCfg._bubbles, _bpops: animCfg._bpops, _drops: animCfg._drops, _mglitch: animCfg._mglitch, _astars: animCfg._astars, _apeaks: animCfg._apeaks, _aripples: animCfg._aripples };
			const blur = readNumber(KEY_BLUR, 0, 60, DEFAULT_BLUR);
			canvas.style.filter = blur > 0 ? `blur(${blur}px)` : "none";
			const tick = (now) => {
				const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016;
				lastFrame = now;
				const cssWidth = Math.max(1, canvas.clientWidth);
				const cssHeight = Math.max(1, canvas.clientHeight);
				const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
				const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
				const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
				if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
					canvas.width = pixelWidth;
					canvas.height = pixelHeight;
				}
				c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
				if (!document.hidden) wp.draw(c2d, cssWidth, cssHeight, now, dt, animCfg);
				rafId = requestAnimationFrame(tick);
			};
			if (document.hidden) return;
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
			if (document.hidden) stopAnim();
			if (layerEl && layerEl.tagName === "VIDEO") {
				if (document.hidden) layerEl.pause();
				else {
					const p = layerEl.play();
					if (p && typeof p.catch === "function") p.catch(function () {});
				}
			}
			if (!document.hidden && activeCtx && layerEl?.tagName === "CANVAS") scheduleApply(activeCtx);
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
			activeCtx = null;
			reportVideoError = null;
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
					matrix: "linear-gradient(180deg, #030805, #0a2a14)",
					aurora: "linear-gradient(180deg, #021030 20%, #0a4a3a 55%, #1a2a5a 85%)"
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
					error ? (0, react_jsx_runtime.jsx)("div", { style: styles.error, children: t(error === "video" ? "dynbg.errorVideo" : error === "save" ? "dynbg.errorSave" : "dynbg.errorInvalid") }) : null,
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
			activeCtx = ctx;
			let revision = 0;
			let rowError = null;
			const store = createWallpaperStore();
			let bound;
			const sync = () => {
				revision += 1;
				bound?.sync(readType(), readNumber(KEY_SPEED, 0.1, 4, DEFAULT_SPEED), readNumber(KEY_DENSITY, 0.2, 3, DEFAULT_DENSITY), readNumber(KEY_OPACITY, 0, 1, DEFAULT_OPACITY), readNumber(KEY_BLUR, 0, 60, DEFAULT_BLUR), sanitizeVideoUrl(readStorage(KEY_VIDEO)), rowError, revision);
			};
			reportVideoError = () => {
				rowError = "video";
				sync();
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
