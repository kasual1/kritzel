// Injected into every page of the recording context. Playwright's screencast does
// not capture the OS cursor, so we draw our own cursor and click ripple in the DOM.
function installRecorderCursor() {
	if (window.__kritzelRecorderCursor) {
		return;
	}
	window.__kritzelRecorderCursor = true;

	const CURSOR_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
		'<path d="M3 2 L3 19 L7.5 14.8 L10.4 21.3 L13.2 20.1 L10.4 13.7 L16.5 13.7 Z" ' +
		'fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';

	const STYLE = `
		html, html * { cursor: none !important; }
		#__recorder-cursor {
			position: fixed; left: 0; top: 0; width: 24px; height: 24px;
			pointer-events: none; z-index: 2147483647; opacity: 0;
			transform-origin: 3px 2px; transition: opacity 120ms ease;
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
			cursor.style.transform = `translate(${x - 3}px, ${y - 2}px) scale(${pressed ? 0.85 : 1})`;
		}
	}

	function mount() {
		const style = document.createElement('style');
		style.textContent = STYLE;
		document.documentElement.appendChild(style);

		cursor = document.createElement('div');
		cursor.id = '__recorder-cursor';
		cursor.innerHTML = CURSOR_SVG;
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
