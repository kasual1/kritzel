import type { KritzelIframeObject } from '@kritzel/react-editor';
import { createPageObject, type PageInput } from './generative-ui-agent';

/** The page the canvas starts with, so there is something to pick and change before the first prompt. */
export const MUSIC_PLAYER: PageInput = {
  title: 'Music player',
  width: 320,
  height: 520,
  html: `<main class="player" data-kritzel-id="player">
  <svg class="cover" data-kritzel-id="album-cover" viewBox="0 0 100 100" role="img" aria-label="Album cover">
    <defs>
      <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fed7aa" />
        <stop offset="0.55" stop-color="#fb923c" />
        <stop offset="1" stop-color="#e11d48" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#sunset)" />
    <circle cx="50" cy="58" r="20" fill="#fff7ed" opacity="0.9" />
    <rect y="68" width="100" height="32" fill="#9f1239" opacity="0.35" />
    <path d="M14 76h30M56 76h30M24 84h52M36 92h28" stroke="#fff7ed" stroke-width="2" stroke-linecap="round" opacity="0.6" />
  </svg>

  <header class="track-info" data-kritzel-id="track-info">
    <h1 data-kritzel-id="track-title">Slow Sunday</h1>
    <p data-kritzel-id="artist">Nora Vale</p>
  </header>

  <div class="progress" data-kritzel-id="progress">
    <div class="track"><div class="fill"></div></div>
    <div class="times"><span data-kritzel-id="elapsed">1:24</span><span data-kritzel-id="duration">3:41</span></div>
  </div>

  <div class="controls" data-kritzel-id="controls">
    <button type="button" data-kritzel-id="previous-button" aria-label="Previous track">
      <svg viewBox="0 0 24 24"><rect x="5" y="6" width="2.5" height="12" rx="1" /><path d="M19 6.5v11L9.5 12z" /></svg>
    </button>
    <button type="button" class="play" data-kritzel-id="play-button" aria-label="Play">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
    </button>
    <button type="button" data-kritzel-id="next-button" aria-label="Next track">
      <svg viewBox="0 0 24 24"><rect x="16.5" y="6" width="2.5" height="12" rx="1" /><path d="M5 6.5v11l9.5-5.5z" /></svg>
    </button>
  </div>
</main>`,
  css: `* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #1c1917;
  background: #fffaf5;
}
.player { display: flex; flex-direction: column; gap: 20px; height: 100%; padding: 24px; }
.cover {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 28px -10px rgba(194, 65, 12, 0.45);
}
.track-info h1 { margin: 0; font-size: 21px; font-weight: 700; }
.track-info p { margin: 4px 0 0; font-size: 15px; color: #78716c; }
.track { height: 4px; border-radius: 2px; background: #e7e5e4; overflow: hidden; }
.fill { width: 38%; height: 100%; background: #f97316; }
.times {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #78716c;
  font-variant-numeric: tabular-nums;
}
.controls { display: flex; align-items: center; justify-content: center; gap: 28px; }
.controls button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #1c1917;
  cursor: pointer;
}
.controls svg { width: 24px; height: 24px; fill: currentColor; }
.controls .play { width: 64px; height: 64px; background: #1c1917; color: #fffaf5; }
.controls .play svg { width: 28px; height: 28px; }`,
  script: '',
};

/** The music player, centered on the origin of the canvas. */
export function createMusicPlayer(): KritzelIframeObject {
  return createPageObject(MUSIC_PLAYER, -MUSIC_PLAYER.width / 2, -MUSIC_PLAYER.height / 2);
}
