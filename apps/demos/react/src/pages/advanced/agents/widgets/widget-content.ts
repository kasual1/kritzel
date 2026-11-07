import type { KritzelIframeContent } from "@kritzel/react-editor";

export type WidgetKind = "timer" | "poll" | "checklist";

export interface WidgetSpec {
  kind: WidgetKind;
  title: string;
  /** Timer length. */
  minutes?: number;
  /** Poll options or checklist items. */
  items?: string[];
}

/** The size a widget needs on the canvas. */
export function widgetSize(spec: WidgetSpec) {
  const items = spec.items?.length ?? 0;
  switch (spec.kind) {
    case "timer":
      return { width: 230, height: 214 };
    case "poll":
      return { width: 260, height: 90 + items * 46 };
    case "checklist":
      return { width: 270, height: 96 + items * 36 };
  }
}

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Roboto, system-ui, sans-serif; color: #1f2937; background: transparent; }
  .card { display: flex; flex-direction: column; height: 100vh; overflow: hidden; border-radius: 14px; background: #ffffff; }
  header { display: flex; align-items: center; gap: 8px; padding: 12px 14px 8px; }
  header i { width: 22px; height: 22px; border-radius: 7px; background: var(--accent); flex: none; }
  h2 { margin: 0; font-size: 15px; font-weight: 700; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  button { font: inherit; }
`;

/** The data goes in as JSON and the page builds its DOM with textContent, so no text is ever parsed as HTML. */
function json(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function timer(spec: WidgetSpec): KritzelIframeContent {
  const seconds = Math.round((spec.minutes ?? 5) * 60);
  return {
    html: `<main class="card"><header><i></i><h2 id="title"></h2></header>
      <div class="dial"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="track"/><circle cx="50" cy="50" r="44" class="ring" id="ring"/></svg><output id="time"></output></div>
      <div class="buttons"><button id="toggle" data-kritzel-id="toggle"></button><button id="reset" class="ghost">Reset</button></div></main>`,
    css: `${BASE_CSS}
      :root { --accent: #f97316; }
      .dial { position: relative; width: 104px; height: 104px; margin: 0 auto; }
      svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      circle { fill: none; stroke-width: 7; }
      .track { stroke: #fde7d6; }
      .ring { stroke: var(--accent); stroke-linecap: round; stroke-dasharray: 276.5; transition: stroke-dashoffset 300ms linear; }
      output { position: absolute; inset: 0; display: grid; place-items: center; font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .buttons { display: flex; gap: 6px; padding: 10px 14px 14px; }
      .buttons button { flex: 1; height: 32px; border: 0; border-radius: 9px; background: var(--accent); color: #fff; font-weight: 700; }
      .buttons .ghost { background: #f3f4f6; color: #374151; }`,
    script: `
      const DATA = ${json({ title: spec.title, seconds })};
      document.getElementById('title').textContent = DATA.title;
      const read = () => Object.assign({ left: DATA.seconds, endsAt: null }, kritzel.state || {});
      const remaining = state => Math.max(0, state.endsAt ? Math.ceil((state.endsAt - Date.now()) / 1000) : state.left);
      const render = () => {
        const state = read();
        const left = remaining(state);
        document.getElementById('time').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
        document.getElementById('ring').style.strokeDashoffset = String(276.5 * (1 - left / DATA.seconds));
        document.getElementById('toggle').textContent = state.endsAt && left > 0 ? 'Pause' : left === 0 ? 'Done' : 'Start';
      };
      document.getElementById('toggle').addEventListener('click', () => {
        const state = read();
        const left = remaining(state);
        if (left === 0) return;
        kritzel.setState(state.endsAt ? { left, endsAt: null } : { left, endsAt: Date.now() + left * 1000 });
        render();
      });
      document.getElementById('reset').addEventListener('click', () => { kritzel.setState({ left: DATA.seconds, endsAt: null }); render(); });
      addEventListener('kritzelstatechange', render);
      setInterval(render, 250);
      render();`,
  };
}

function poll(spec: WidgetSpec): KritzelIframeContent {
  return {
    html: `<main class="card"><header><i></i><h2 id="title"></h2></header><div id="options" class="options"></div><footer id="total"></footer></main>`,
    css: `${BASE_CSS}
      :root { --accent: #7c3aed; }
      .options { display: flex; flex-direction: column; gap: 8px; padding: 2px 14px; }
      .option { position: relative; display: flex; justify-content: space-between; height: 38px; padding: 0 12px; align-items: center; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; overflow: hidden; text-align: left; font-weight: 600; color: #374151; }
      .option span { position: relative; }
      .bar { position: absolute; inset: 0 auto 0 0; background: #ede9fe; transition: width 300ms ease; }
      footer { padding: 10px 14px; color: #6b7280; font-size: 12px; }`,
    script: `
      const DATA = ${json({ title: spec.title, options: spec.items ?? [] })};
      document.getElementById('title').textContent = DATA.title;
      const read = () => Object.assign({ votes: DATA.options.map(() => 0) }, kritzel.state || {});
      const list = document.getElementById('options');
      const buttons = DATA.options.map((option, index) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.dataset.kritzelId = 'option-' + index;
        const bar = document.createElement('div');
        bar.className = 'bar';
        const name = document.createElement('span');
        name.textContent = option;
        const count = document.createElement('span');
        button.append(bar, name, count);
        button.addEventListener('click', () => {
          const state = read();
          state.votes[index] += 1;
          kritzel.setState(state);
          render();
        });
        list.append(button);
        return { bar, count };
      });
      const render = () => {
        const { votes } = read();
        const total = votes.reduce((sum, value) => sum + value, 0);
        buttons.forEach(({ bar, count }, index) => {
          bar.style.width = (total ? (votes[index] / total) * 100 : 0) + '%';
          count.textContent = String(votes[index]);
        });
        document.getElementById('total').textContent = total === 1 ? '1 vote' : total + ' votes';
      };
      addEventListener('kritzelstatechange', render);
      render();`,
  };
}

function checklist(spec: WidgetSpec): KritzelIframeContent {
  return {
    html: `<main class="card"><header><i></i><h2 id="title"></h2></header><ul id="items"></ul><footer id="progress"></footer></main>`,
    css: `${BASE_CSS}
      :root { --accent: #16a34a; }
      ul { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 2px 14px; list-style: none; }
      li label { display: flex; align-items: center; gap: 9px; height: 32px; font-size: 14px; cursor: pointer; }
      input { width: 17px; height: 17px; accent-color: var(--accent); }
      li.done span { color: #9ca3af; text-decoration: line-through; }
      footer { padding: 10px 14px; color: #6b7280; font-size: 12px; }`,
    script: `
      const DATA = ${json({ title: spec.title, items: spec.items ?? [] })};
      document.getElementById('title').textContent = DATA.title;
      const read = () => Object.assign({ done: DATA.items.map(() => false) }, kritzel.state || {});
      const list = document.getElementById('items');
      const rows = DATA.items.map((item, index) => {
        const row = document.createElement('li');
        const label = document.createElement('label');
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.dataset.kritzelId = 'item-' + index;
        const text = document.createElement('span');
        text.textContent = item;
        label.append(box, text);
        row.append(label);
        box.addEventListener('change', () => {
          const state = read();
          state.done[index] = box.checked;
          kritzel.setState(state);
          render();
        });
        list.append(row);
        return { row, box };
      });
      const render = () => {
        const { done } = read();
        rows.forEach(({ row, box }, index) => { box.checked = !!done[index]; row.classList.toggle('done', !!done[index]); });
        document.getElementById('progress').textContent = done.filter(Boolean).length + ' of ' + DATA.items.length + ' done';
      };
      addEventListener('kritzelstatechange', render);
      render();`,
  };
}

export function widgetContent(spec: WidgetSpec): KritzelIframeContent {
  switch (spec.kind) {
    case "timer":
      return timer(spec);
    case "poll":
      return poll(spec);
    case "checklist":
      return checklist(spec);
  }
}
