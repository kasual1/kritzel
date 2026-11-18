// Injected into every page of the recording context. Draws a small badge with the dark Upmade mark and
// "upmade.io" in the bottom right corner of the page, above everything else, so it ends up in the video.
function installRecorderWatermark({ text, logo }) {
	// Only the top page gets the badge, not every iframe inside it.
	if (window.top !== window || window.__upmadeRecorderWatermark) {
		return;
	}
	window.__upmadeRecorderWatermark = true;

	const SVG_NS = 'http://www.w3.org/2000/svg';
	const STYLE = `
		#__recorder-watermark {
			position: fixed; right: 12px; bottom: 12px; z-index: 2147483645;
			display: flex; align-items: center; gap: 4px;
			padding: 4px 8px; border-radius: 6px;
			background: rgba(255, 255, 255, 0.9); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
			color: #52525b; font: 500 11px/1.2 system-ui, -apple-system, "Segoe UI", sans-serif;
			pointer-events: none; user-select: none;
		}
		#__recorder-watermark svg {
			display: block; height: 12px; width: auto; flex: none;
		}
	`;

	// Built from elements rather than an SVG string, so pages with Trusted Types still show it.
	function createLogo() {
		const svg = document.createElementNS(SVG_NS, 'svg');
		svg.setAttribute('viewBox', logo.viewBox);
		svg.setAttribute('aria-hidden', 'true');
		for (const d of logo.paths) {
			const path = document.createElementNS(SVG_NS, 'path');
			path.setAttribute('fill', logo.color);
			path.setAttribute('d', d);
			svg.appendChild(path);
		}
		return svg;
	}

	function mount() {
		const style = document.createElement('style');
		style.textContent = STYLE;
		document.documentElement.appendChild(style);

		const badge = document.createElement('div');
		badge.id = '__recorder-watermark';
		badge.appendChild(createLogo());
		badge.appendChild(document.createTextNode(text));
		document.documentElement.appendChild(badge);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mount, { once: true });
	} else {
		mount();
	}
}

module.exports = { installRecorderWatermark };
