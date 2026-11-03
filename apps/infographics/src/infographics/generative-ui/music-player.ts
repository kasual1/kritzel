import type { KritzelIframeObject } from '@kritzel/react-editor';
import { createPageObject, type PageInput } from './generative-ui-agent';

/** The page the canvas starts with, so there is something to pick and change before the first prompt. */
export const MUSIC_PLAYER: PageInput = {
  title: 'Music player',
  width: 320,
  height: 520,
  html: `<main class="player" data-kritzel-id="player">
  <svg class="cover" data-kritzel-id="album-cover" viewBox="0 0 100 100" role="img" aria-label="Album cover of Velvet Midnight">
    <rect width="100" height="100" fill="#1c1917" />
    <circle cx="62" cy="38" r="27" fill="#e8a33d" />
    <circle cx="20" cy="24" r="6" fill="#d9572b" />
    <g stroke="#f5ecd7" stroke-linecap="round" fill="none">
      <path d="M44 18v32a11 11 0 0 0 22 0v-6" stroke-width="6" />
      <path d="M44 18l-7-7" stroke-width="3.5" />
    </g>
    <path d="M60 37h12l-2.5 8h-7z" fill="#f5ecd7" />
    <g fill="#1c1917">
      <circle cx="44" cy="27" r="1.4" />
      <circle cx="44" cy="35" r="1.4" />
      <circle cx="44" cy="43" r="1.4" />
    </g>
    <text x="8" y="82" textLength="84" lengthAdjust="spacingAndGlyphs" fill="#f5ecd7"
      font-family="system-ui, sans-serif" font-size="9" font-weight="800">VELVET MIDNIGHT</text>
    <text x="8" y="91" textLength="50" lengthAdjust="spacingAndGlyphs" fill="#e8a33d"
      font-family="system-ui, sans-serif" font-size="4.5" font-weight="600">RAY MOREAU QUARTET</text>
  </svg>

  <header class="track-info" data-kritzel-id="track-info">
    <h1 data-kritzel-id="track-title">Velvet Midnight</h1>
    <p data-kritzel-id="artist">Ray Moreau Quartet</p>
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
  box-shadow: 0 12px 28px -10px rgba(28, 25, 23, 0.5);
}
.track-info h1 { margin: 0; font-size: 21px; font-weight: 700; }
.track-info p { margin: 4px 0 0; font-size: 15px; color: #78716c; }
.track { height: 4px; border-radius: 2px; background: #e7e5e4; overflow: hidden; }
.fill { width: 38%; height: 100%; background: #d9572b; }
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
