// Injected into every page of the recording context. Draws a small "Powered by updraw.io" badge in the
// bottom right corner of the page, above everything else, so it ends up in the video.
function installRecorderWatermark({ text }) {
	// Only the top page gets the badge, not every iframe inside it.
	if (window.top !== window || window.__updrawRecorderWatermark) {
		return;
	}
	window.__updrawRecorderWatermark = true;

	const STYLE = `
		#__recorder-watermark {
			position: fixed; right: 12px; bottom: 12px; z-index: 2147483645;
			padding: 4px 8px; border-radius: 6px;
			background: rgba(255, 255, 255, 0.9); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
			color: #52525b; font: 500 11px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif;
			pointer-events: none; user-select: none;
		}
	`;

	function mount() {
		const style = document.createElement('style');
		style.textContent = STYLE;
		document.documentElement.appendChild(style);

		const badge = document.createElement('div');
		badge.id = '__recorder-watermark';
		badge.textContent = text;
		document.documentElement.appendChild(badge);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mount, { once: true });
	} else {
		mount();
	}
}

module.exports = { installRecorderWatermark };
