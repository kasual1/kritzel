import type { KritzelIframeObject } from '@kritzel/react-editor';
import { createPageObject, type PageInput } from './generative-ui-agent';

/** Icons are drawn once as symbols and reused with <use>, so the page stays short for Claude to edit. */
const ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="sun" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4.5" fill="#ffd25e" />
    <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
      stroke="#ffd25e" stroke-width="2" stroke-linecap="round" />
  </symbol>
  <symbol id="cloud" viewBox="0 0 24 24">
    <path d="M6.5 19a4.5 4.5 0 0 1-.4-8.98A6 6 0 0 1 17.6 9.1 5 5 0 0 1 17.5 19z" fill="#ffffff" />
  </symbol>
  <symbol id="partly-cloudy" viewBox="0 0 24 24">
    <use href="#sun" x="7" y="1" width="16" height="16" />
    <use href="#cloud" y="5" width="20" height="20" />
  </symbol>
  <symbol id="rain" viewBox="0 0 24 24">
    <use href="#cloud" y="-3" />
    <path d="M8.5 18.5l-1 3M12.5 18.5l-1 3M16.5 18.5l-1 3" stroke="#d6ecff" stroke-width="1.8" stroke-linecap="round" />
  </symbol>
</svg>`;

/** The page the canvas starts with, so there is something to pick and change before the first prompt. */
export const WEATHER_WIDGET: PageInput = {
  title: 'Weather widget',
  width: 340,
  height: 480,
  html: `${ICONS}
<main class="widget" data-kritzel-id="widget">
  <header class="location" data-kritzel-id="location">
    <h1 data-kritzel-id="city">Berlin</h1>
    <span class="updated" data-kritzel-id="updated">Now</span>
  </header>

  <section class="current" data-kritzel-id="current">
    <svg class="current-icon" data-kritzel-id="weather-icon" role="img" aria-label="Partly cloudy"><use href="#partly-cloudy" /></svg>
    <p class="temperature" data-kritzel-id="temperature">18°</p>
    <p class="condition" data-kritzel-id="condition">Partly cloudy</p>
    <p class="range" data-kritzel-id="high-low">H 21° · L 11°</p>
  </section>

  <dl class="details" data-kritzel-id="details">
    <div data-kritzel-id="wind"><dt>Wind</dt><dd>12 km/h</dd></div>
    <div data-kritzel-id="humidity"><dt>Humidity</dt><dd>48%</dd></div>
    <div data-kritzel-id="rain-chance"><dt>Rain</dt><dd>10%</dd></div>
  </dl>

  <ol class="forecast" data-kritzel-id="forecast" aria-label="Next five days">
    <li data-kritzel-id="forecast-day-1"><span>Wed</span><svg aria-label="Sunny"><use href="#sun" /></svg><span>21°</span></li>
    <li data-kritzel-id="forecast-day-2"><span>Thu</span><svg aria-label="Partly cloudy"><use href="#partly-cloudy" /></svg><span>19°</span></li>
    <li data-kritzel-id="forecast-day-3"><span>Fri</span><svg aria-label="Rain"><use href="#rain" /></svg><span>14°</span></li>
    <li data-kritzel-id="forecast-day-4"><span>Sat</span><svg aria-label="Cloudy"><use href="#cloud" /></svg><span>15°</span></li>
    <li data-kritzel-id="forecast-day-5"><span>Sun</span><svg aria-label="Sunny"><use href="#sun" /></svg><span>20°</span></li>
  </ol>
</main>`,
  css: `* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #ffffff;
  background: linear-gradient(165deg, #3f7ff2 0%, #5f9dfa 55%, #8fc1ff 100%);
}
.widget { display: flex; flex-direction: column; gap: 16px; height: 100%; padding: 24px; }
.location { display: flex; align-items: baseline; justify-content: space-between; }
.location h1 { margin: 0; font-size: 20px; font-weight: 600; }
.updated { font-size: 13px; opacity: 0.8; }
.current { display: flex; flex-direction: column; align-items: center; text-align: center; }
.current-icon { width: 96px; height: 96px; filter: drop-shadow(0 6px 12px rgba(20, 40, 90, 0.25)); }
.current p { margin: 0; }
.temperature { font-size: 72px; font-weight: 200; line-height: 1; letter-spacing: -2px; }
.condition { margin-top: 6px !important; font-size: 17px; font-weight: 500; }
.range { margin-top: 2px !important; font-size: 14px; opacity: 0.85; }
.details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 12px 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  text-align: center;
}
.details dt { font-size: 12px; opacity: 0.8; }
.details dd { margin: 2px 0 0; font-size: 15px; font-weight: 600; }
.forecast {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: auto 0 0;
  padding: 12px 4px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  list-style: none;
}
.forecast li { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; }
.forecast li span:last-child { font-weight: 600; }
.forecast svg { width: 28px; height: 28px; }`,
  script: '',
};

/** The weather widget, centered on the origin of the canvas. */
export function createWeatherWidget(): KritzelIframeObject {
  return createPageObject(WEATHER_WIDGET, -WEATHER_WIDGET.width / 2, -WEATHER_WIDGET.height / 2);
}
