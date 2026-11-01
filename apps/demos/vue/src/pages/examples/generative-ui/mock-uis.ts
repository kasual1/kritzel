/** How the demo answers prompts: with a model and the user's own API key, or with the canned UIs below. */
export type RequestMode = 'live' | 'mock'

export interface MockUi {
  prompt: string
  /** The HTML document a model would answer the prompt with. */
  document: string
}

/** How long a mocked request takes, long enough to see the UI's loading state. */
const MOCK_DELAY = 1100

export const MOCK_UIS: readonly MockUi[] = [
  {
    prompt: 'A pomodoro timer with a circular progress ring',
    document: `<!doctype html>
<html>
  <head>
    <title>Pomodoro Timer</title>
    <style>
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
    </style>
  </head>
  <body>
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
    <script>
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
    </script>
  </body>
</html>`,
  },
  {
    prompt: 'A weather card for Lisbon with a 5-day forecast',
    document: `<!doctype html>
<html>
  <head>
    <title>Lisbon Weather</title>
    <style>
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
    </style>
  </head>
  <body>
    <header>
      <div>
        <h1>Lisbon</h1>
        <p>Sunny with a light Atlantic breeze</p>
      </div>
      <button id="unit" type="button">Show °F</button>
    </header>
    <div id="current"></div>
    <ul id="days"></ul>
    <script>
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
    </script>
  </body>
</html>`,
  },
  {
    prompt: 'A kanban board for a product launch, with drag and drop',
    document: `<!doctype html>
<html>
  <head>
    <title>Launch Board</title>
    <style>
      body { display: flex; flex-direction: column; box-sizing: border-box; padding: 24px; background: #f5f6fa; color: #1f2333; font-family: system-ui, sans-serif; }
      h1 { margin: 0 0 16px; font-size: 22px; }
      main { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; min-height: 0; }
      section { display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: auto; padding: 12px; border-radius: 14px; background: #e9ebf3; }
      section.over { outline: 2px solid #5b5bd6; }
      h2 { margin: 0; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #5c6178; }
      article { padding: 12px; border-radius: 10px; background: #ffffff; font-size: 14px; line-height: 1.35; box-shadow: 0 1px 2px rgba(31, 35, 51, 0.12); cursor: grab; }
    </style>
  </head>
  <body>
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
    <script>
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
    </script>
  </body>
</html>`,
  },
]

/** Answers like a model would, after a short delay and without any network request. */
export function completeWithMock(ui: MockUi): Promise<string> {
  return new Promise((resolve) => setTimeout(() => resolve(ui.document), MOCK_DELAY))
}
