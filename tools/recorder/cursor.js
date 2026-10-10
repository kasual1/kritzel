// Injected into every page of the recording context. Playwright's screencast does
// not capture the OS cursor, so we draw the Kritzel cursor and a click ripple in the DOM.
function installRecorderCursor({ svg, hotspot }) {
	if (window.__kritzelRecorderCursor) {
		return;
	}
	window.__kritzelRecorderCursor = true;

	const STYLE = `
		html, html * { cursor: none !important; }
		#__recorder-cursor {
			position: fixed; left: 0; top: 0; width: 24px; height: 24px;
			pointer-events: none; z-index: 2147483647; opacity: 0;
			transform-origin: ${hotspot.x}px ${hotspot.y}px; transition: opacity 120ms ease;
			will-change: transform;
		}
		#__recorder-cursor.visible { opacity: 1; }
		.__recorder-ripple {
			position: fixed; width: 36px; height: 36px; margin: -18px 0 0 -18px;
			border-radius: 50%; background: rgba(59, 130, 246, 0.35);
			border: 2px solid rgba(59, 130, 246, 0.8);
			pointer-events: none; z-index: 2147483646;
			animation: __recorder-ripple 450ms ease-out forwards;
		}
		@keyframes __recorder-ripple {
			from { transform: scale(0.3); opacity: 1; }
			to { transform: scale(1.4); opacity: 0; }
		}
	`;

	let x = 0;
	let y = 0;
	let pressed = false;
	let cursor;

	function render() {
		if (cursor) {
			cursor.style.transform = `translate(${x - hotspot.x}px, ${y - hotspot.y}px) scale(${pressed ? 0.85 : 1})`;
		}
	}

	function mount() {
		const style = document.createElement('style');
		style.textContent = STYLE;
		document.documentElement.appendChild(style);

		cursor = document.createElement('div');
		cursor.id = '__recorder-cursor';
		cursor.innerHTML = svg;
		document.documentElement.appendChild(cursor);
		render();
	}

	const opts = { capture: true, passive: true };

	window.addEventListener('pointermove', (event) => {
		x = event.clientX;
		y = event.clientY;
		if (cursor) {
			cursor.classList.add('visible');
		}
		render();
	}, opts);

	window.addEventListener('pointerdown', (event) => {
		x = event.clientX;
		y = event.clientY;
		pressed = true;
		render();

		const ripple = document.createElement('div');
		ripple.className = '__recorder-ripple';
		ripple.style.left = `${x}px`;
		ripple.style.top = `${y}px`;
		document.documentElement.appendChild(ripple);
		ripple.addEventListener('animationend', () => ripple.remove());
	}, opts);

	window.addEventListener('pointerup', () => {
		pressed = false;
		render();
	}, opts);

	document.addEventListener('pointerleave', () => {
		if (cursor) {
			cursor.classList.remove('visible');
		}
	}, opts);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mount, { once: true });
	} else {
		mount();
	}
}

module.exports = { installRecorderCursor };
