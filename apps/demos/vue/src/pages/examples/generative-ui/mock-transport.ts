import { createScriptedTransport, type UpdrawChatRequest, type UpdrawScriptedAnswer } from '@updraw/vue-editor'

/** A canned UI: the prompt it answers and the code a model would write for it with create_iframe. */
export interface MockUi {
  prompt: string
  name: string
  html: string
  css: string
  script: string
}

/** The size of a canned UI in canvas units. */
const MOCK_WIDTH = 800
const MOCK_HEIGHT = 600

/** The gap between canned UIs, which are placed in a row. */
const MOCK_GAP = 48

export const MOCK_UIS: readonly MockUi[] = [
  {
    prompt: 'A pomodoro timer with a circular progress ring',
    name: 'Pomodoro Timer',
    html: `
      <main>
        <h1>Focus session</h1>
        <div class="ring">
          <svg viewBox="0 0 260 260" aria-hidden="true">
            <circle class="track" cx="130" cy="130" r="115"></circle>
            <circle id="progress" cx="130" cy="130" r="115"></circle>
          </svg>
          <div id="time" role="timer">25:00</div>
        </div>
        <div class="actions">
          <button id="toggle" type="button">Start</button>
          <button id="reset" type="button">Reset</button>
        </div>
      </main>
    `,
    css: `
      body { display: grid; place-items: center; background: #fff7f5; color: #3b1d17; font-family: system-ui, sans-serif; }
      main { display: grid; justify-items: center; gap: 24px; }
      h1 { margin: 0; font-size: 22px; }
      .ring { position: relative; width: 260px; height: 260px; }
      svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      circle { fill: none; stroke-width: 14; }
      .track { stroke: #fbdcd5; }
      #progress { stroke: #e5533d; stroke-linecap: round; transition: stroke-dashoffset 250ms linear; }
      #time { position: absolute; inset: 0; display: grid; place-items: center; font-size: 56px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .actions { display: flex; gap: 12px; }
      button { min-width: 112px; height: 44px; border: 0; border-radius: 12px; background: #fbdcd5; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
      #toggle { background: #e5533d; color: #ffffff; }
    `,
    script: `
      var TOTAL = 25 * 60;
      var LENGTH = 2 * Math.PI * 115;
      var remaining = TOTAL;
      var timer = null;
      var progress = document.getElementById("progress");
      var time = document.getElementById("time");
      var toggle = document.getElementById("toggle");
      progress.style.strokeDasharray = LENGTH;

      function render() {
        var seconds = remaining % 60;
        time.textContent = Math.floor(remaining / 60) + ":" + (seconds < 10 ? "0" : "") + seconds;
        progress.style.strokeDashoffset = LENGTH * (1 - remaining / TOTAL);
        toggle.textContent = timer ? "Pause" : "Start";
      }

      function pause() {
        clearInterval(timer);
        timer = null;
      }

      toggle.addEventListener("click", function () {
        if (timer) {
          pause();
        } else {
          timer = setInterval(function () {
            remaining = Math.max(remaining - 1, 0);
            if (!remaining) {
              pause();
            }
            render();
          }, 1000);
        }
        render();
      });

      document.getElementById("reset").addEventListener("click", function () {
        pause();
        remaining = TOTAL;
        render();
      });

      render();
    `,
  },
  {
    prompt: 'A weather card for Lisbon with a 5-day forecast',
    name: 'Lisbon Weather',
    html: `
      <header>
        <div>
          <h1>Lisbon</h1>
          <p>Sunny with a light Atlantic breeze</p>
        </div>
        <button id="unit" type="button">Show °F</button>
      </header>
      <div id="current"></div>
      <ul id="days"></ul>
    `,
    css: `
      body { display: flex; flex-direction: column; box-sizing: border-box; padding: 40px; background: linear-gradient(160deg, #2f7de1, #7cc4f5); color: #ffffff; font-family: system-ui, sans-serif; }
      header { display: flex; justify-content: space-between; align-items: flex-start; }
      h1 { margin: 0; font-size: 30px; }
      p { margin: 4px 0 0; opacity: 0.85; }
      #unit { height: 36px; padding: 0 14px; border: 0; border-radius: 10px; background: rgba(255, 255, 255, 0.2); color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
      #current { margin: auto 0; font-size: 112px; font-weight: 700; line-height: 1; }
      ul { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 0; padding: 0; list-style: none; }
      li { display: grid; justify-items: center; gap: 6px; padding: 16px 8px; border-radius: 16px; background: rgba(255, 255, 255, 0.18); }
      svg { width: 32px; height: 32px; }
      strong { font-size: 18px; }
    `,
    script: `
      var CURRENT = 23;
      var DAYS = [
        { name: "Mon", high: 24, sunny: true },
        { name: "Tue", high: 22, sunny: true },
        { name: "Wed", high: 19, sunny: false },
        { name: "Thu", high: 20, sunny: false },
        { name: "Fri", high: 25, sunny: true },
      ];
      var SUN = '<svg viewBox="0 0 24 24" aria-label="Sunny"><circle cx="12" cy="12" r="7" fill="#ffd54a"></circle></svg>';
      var CLOUD = '<svg viewBox="0 0 24 24" aria-label="Cloudy"><path d="M7 19a5 5 0 0 1 0-10 6 6 0 0 1 11 2 4 4 0 0 1-1 8z" fill="#ffffff"></path></svg>';
      var celsius = true;

      function format(value) {
        return (celsius ? value : Math.round((value * 9) / 5 + 32)) + "°";
      }

      function render() {
        document.getElementById("current").textContent = format(CURRENT);
        document.getElementById("unit").textContent = celsius ? "Show °F" : "Show °C";
        document.getElementById("days").innerHTML = DAYS.map(function (day) {
          return "<li><span>" + day.name + "</span>" + (day.sunny ? SUN : CLOUD) + "<strong>" + format(day.high) + "</strong></li>";
        }).join("");
      }

      document.getElementById("unit").addEventListener("click", function () {
        celsius = !celsius;
        render();
      });

      render();
    `,
  },
  {
    prompt: 'A kanban board for a product launch, with drag and drop',
    name: 'Launch Board',
    html: `
      <h1>Product launch</h1>
      <main>
        <section data-column><h2>To do</h2>
          <article draggable="true">Write the launch announcement</article>
          <article draggable="true">Record the product demo</article>
          <article draggable="true">Prepare the press kit</article>
        </section>
        <section data-column><h2>In progress</h2>
          <article draggable="true">Finish the pricing page</article>
          <article draggable="true">Brief the support team</article>
        </section>
        <section data-column><h2>Done</h2>
          <article draggable="true">Pick the launch date</article>
        </section>
      </main>
    `,
    css: `
      body { display: flex; flex-direction: column; box-sizing: border-box; padding: 24px; background: #f5f6fa; color: #1f2333; font-family: system-ui, sans-serif; }
      h1 { margin: 0 0 16px; font-size: 22px; }
      main { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; min-height: 0; }
      section { display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: auto; padding: 12px; border-radius: 14px; background: #e9ebf3; }
      section.over { outline: 2px solid #5b5bd6; }
      h2 { margin: 0; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #5c6178; }
      article { padding: 12px; border-radius: 10px; background: #ffffff; font-size: 14px; line-height: 1.35; box-shadow: 0 1px 2px rgba(31, 35, 51, 0.12); cursor: grab; }
    `,
    script: `
      var dragged = null;

      document.querySelectorAll("article").forEach(function (card) {
        card.addEventListener("dragstart", function (event) {
          dragged = card;
          event.dataTransfer.setData("text/plain", card.textContent);
        });
      });

      document.querySelectorAll("[data-column]").forEach(function (column) {
        column.addEventListener("dragover", function (event) {
          event.preventDefault();
          column.classList.add("over");
        });
        column.addEventListener("dragleave", function () {
          column.classList.remove("over");
        });
        column.addEventListener("drop", function (event) {
          event.preventDefault();
          column.classList.remove("over");
          if (dragged) {
            column.appendChild(dragged);
          }
        });
      });
    `,
  },
]

/** The text of the newest user message, including the chips sent with it. */
function lastPrompt(request: UpdrawChatRequest): string {
  const user = [...request.messages].reverse().find(message => message.role === 'user')
  return user?.parts.map(part => (part.type === 'text' ? part.text : '')).join('\n') ?? ''
}

/** How many UIs the conversation has created, to place the next one to the right of them. */
function countCreatedUis(request: UpdrawChatRequest): number {
  return request.messages
    .flatMap(message => message.parts)
    .filter(part => part.type === 'tool-call' && part.name === 'create_iframe').length
}

/**
 * Stands in for a model, without a key or a network request. Every prompt is answered with a create_iframe call for one
 * of the canned UIs, followed by fit_viewport. The answer streams like a model writes it, so the UI shows as a
 * placeholder until its code is written.
 */
export function createMockTransport() {
  return createScriptedTransport(
    (request): string | UpdrawScriptedAnswer => {
      const last = request.messages[request.messages.length - 1]
      if (last?.role === 'tool') {
        return 'Done. Select it to ask for a change, or press ▶ in its titlebar to open it fullscreen.'
      }
      const prompt = lastPrompt(request)
      if (prompt.includes('objectId: ')) {
        return 'The mocked answers can only add the canned UIs. Connect an API key to change a UI.'
      }
      const count = countCreatedUis(request)
      const ui =
        MOCK_UIS.find(candidate => prompt.toLowerCase().includes(candidate.prompt.toLowerCase())) ??
        MOCK_UIS[count % MOCK_UIS.length]!
      const { name, html, css, script } = ui
      return {
        text: `Building the ${name}.`,
        toolCalls: [
          {
            tool: 'create_iframe',
            // Position and size come first, like a model writes them, so the placeholder shows before the code.
            input: {
              name,
              x: count * (MOCK_WIDTH + MOCK_GAP) - MOCK_WIDTH / 2,
              y: -MOCK_HEIGHT / 2,
              width: MOCK_WIDTH,
              height: MOCK_HEIGHT,
              html,
              css,
              script,
            },
          },
          { tool: 'fit_viewport', input: {} },
        ],
      }
    },
    { delayMs: 400, stream: { chunkSize: 40, chunkDelayMs: 12 } },
  )
}
