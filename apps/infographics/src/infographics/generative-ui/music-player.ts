import type { UpdrawIframeObject } from '@updraw/react-editor';
import { createPageObject, type PageInput } from './generative-ui-agent';

/** The page the canvas starts with, so there is something to pick and change before the first prompt. */
export const MUSIC_PLAYER: PageInput = {
  title: 'Music player',
  width: 320,
  height: 520,
  html: `<main class="player" data-updraw-id="player">
  <svg class="cover" data-updraw-id="album-cover" viewBox="0 0 100 100" role="img" aria-label="Album cover of Full Control">
    <rect width="100" height="100" fill="#d9572b" />
    <circle cx="62" cy="40" r="30" fill="#e8a33d" />
    <g transform="translate(58 39) rotate(-20) scale(1.4) translate(-52 -36)">
      <path d="M44 21C44 14 40 10.5 34 9.5" fill="none" stroke="#f5ecd7" stroke-width="3.2" stroke-linecap="round" />
      <path d="M34.5 9.6L28.5 8.6" stroke="#1c1917" stroke-width="3.6" stroke-linecap="round" />
      <path d="M44 20V52A11 11 0 0 0 66 52V42" fill="none" stroke="#f5ecd7" stroke-width="6.5" />
      <path d="M62.6 43C62 38.5 59 34.5 56 31H76C73 34.5 70 38.5 69.4 43Z" fill="#f5ecd7" />
      <ellipse cx="66" cy="31" rx="10" ry="1.8" fill="#f5ecd7" />
      <ellipse cx="66" cy="31" rx="7.5" ry="1" fill="#1c1917" />
      <g fill="#1c1917">
        <circle cx="44" cy="28" r="1.6" />
        <circle cx="44" cy="35" r="1.6" />
        <circle cx="44" cy="42" r="1.6" />
      </g>
    </g>
    <text x="8" y="87" textLength="68" lengthAdjust="spacingAndGlyphs" fill="#1c1917"
      font-family="system-ui, sans-serif" font-size="9" font-weight="800">FULL CONTROL</text>
    <text x="8" y="95" textLength="44" lengthAdjust="spacingAndGlyphs" fill="#f5ecd7"
      font-family="system-ui, sans-serif" font-size="4.5" font-weight="600">LUCA MOULIN BEAU</text>
  </svg>

  <header class="track-info" data-updraw-id="track-info">
    <h1 data-updraw-id="track-title">Full Control</h1>
    <p data-updraw-id="artist">Luca Moulin Beau</p>
  </header>

  <div class="progress" data-updraw-id="progress">
    <div class="track"><div class="fill"></div></div>
    <div class="times"><span data-updraw-id="elapsed">1:24</span><span data-updraw-id="duration">3:41</span></div>
  </div>

  <div class="controls" data-updraw-id="controls">
    <button type="button" data-updraw-id="previous-button" aria-label="Previous track">
      <svg viewBox="0 0 24 24"><rect x="5" y="6" width="2.5" height="12" rx="1" /><path d="M19 6.5v11L9.5 12z" /></svg>
    </button>
    <button type="button" class="play" data-updraw-id="play-button" aria-label="Play">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
    </button>
    <button type="button" data-updraw-id="next-button" aria-label="Next track">
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
  box-shadow: 0 12px 28px -10px rgba(153, 52, 20, 0.45);
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
export function createMusicPlayer(): UpdrawIframeObject {
  return createPageObject(MUSIC_PLAYER, -MUSIC_PLAYER.width / 2, -MUSIC_PLAYER.height / 2);
}
