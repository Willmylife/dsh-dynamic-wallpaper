// Headless smoke test: run every wallpaper's draw() 60 frames against a
// recording 2D-context stub; catches runtime errors in the draw logic.
"use strict";
const fs = require("fs");
const path = require("path");

const client = fs.readFileSync(path.join(__dirname, "lib", "client.js"), "utf8");
const captured = {};
let activeCalls = null;
global.window = {
	__ModuleLoader__: {
		load(entry) {
			const stub = () => new Proxy(function () {}, {
				get: (t, k) => (k === Symbol.toPrimitive ? () => "stub" : stub()),
				apply: () => stub()
			});
			Object.assign(captured, entry.factory(() => stub()));
		}
	}
};
function recordingCtx(calls = activeCalls ?? { gradientStops: 0, fills: 0, strokes: 0, arcs: 0, texts: 0, images: 0 }) {
	const gradient = { addColorStop() { calls.gradientStops++; } };
	return {
		calls,
		createLinearGradient: () => gradient,
		createRadialGradient: () => gradient,
		measureText: () => ({ width: 10 }),
		fillRect() { calls.fills++; },
		fill() { calls.fills++; },
		stroke() { calls.strokes++; },
		drawImage() { calls.images++; },
		beginPath() {},
		moveTo() {},
		lineTo() {},
		closePath() {},
		arc() { calls.arcs++; },
		fillText() { calls.texts++; },
		save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
		clip() {}, setTransform() {}, transform() {}, clearRect() {}, strokeRect() {},
		ellipse() { calls.arcs++; }, quadraticCurveTo() {}, bezierCurveTo() {}, rect() {},
		set fillStyle(v) { this._fs = v; },
		get fillStyle() { return this._fs; },
		set strokeStyle(v) { this._ss = v; },
		get strokeStyle() { return this._ss; },
		shadowColor: "", shadowBlur: 0, lineWidth: 1, font: "", globalAlpha: 1
	};
}

function createCanvas() {
	const canvas = { width: 0, height: 0 };
	canvas.getContext = () => recordingCtx();
	return canvas;
}
global.document = { createElement: createCanvas };
global.requestAnimationFrame = () => {};
eval(client);

const WALLPAPERS = captured.WALLPAPERS;
if (!Array.isArray(WALLPAPERS) || WALLPAPERS.length === 0) {
	console.log("FAIL: no WALLPAPERS exported");
	process.exit(1);
}

let failed = 0;
for (const wp of WALLPAPERS) {
	const ctx = recordingCtx();
	activeCalls = ctx.calls;
	let err = null;
	try {
		for (let f = 0; f < 120; f++) wp.draw(ctx, 800, 500, f * 16.7, 0.0167, { speed: 1, density: 1 });
		// density extremes
		for (let f = 0; f < 30; f++) wp.draw(ctx, 800, 500, f * 16.7, 0.0167, { speed: 4, density: 3 });
		for (let f = 0; f < 30; f++) wp.draw(ctx, 800, 500, f * 16.7, 0.0167, { speed: 0.1, density: 0.2 });
	} catch (e) {
		err = e.message;
	}
	activeCalls = null;
	if (err) {
		failed++;
		console.log(`FAIL ${wp.id}: ${err}`);
	} else {
		console.log(`OK   ${wp.id}: gradients=${ctx.calls.gradientStops} fills=${ctx.calls.fills} strokes=${ctx.calls.strokes} arcs=${ctx.calls.arcs} texts=${ctx.calls.texts} images=${ctx.calls.images}`);
	}
}
console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
